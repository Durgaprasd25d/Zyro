import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/theme';
import JobRequestSheet from '../../components/JobRequestSheet';
import technicianService from '../../services/technicianService';
import authService from '../../services/authService';
import technicianSocketService from '../../services/technicianSocketService';
import driverLocationService from '../../services/driverLocationService';
import rideService from '../../services/rideService';
import ServicesListSheet from '../../components/ServicesListSheet';

const { width } = Dimensions.get('window');

export default function TechnicianDashboardScreen({ navigation }) {
    const [isOnline, setIsOnline] = useState(false);
    const [user, setUser] = useState(null);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [completedJobs, setCompletedJobs] = useState(0);
    const [activeJob, setActiveJob] = useState(null);
    const [recentJobs, setRecentJobs] = useState([]);
    const [showJobModal, setShowJobModal] = useState(false);
    const [pendingJob, setPendingJob] = useState(null);
    const [wallet, setWallet] = useState({ balance: 0, commissionDue: 0, codLimit: 500 });
    const [showServicesSheet, setShowServicesSheet] = useState(false);
    const [kycStatus, setKycStatus] = useState('LOADING');

    useEffect(() => {
        const initDashboard = async () => {
            const userData = await authService.getUser();
            setUser(userData);
            const userId = userData?.id || userData?._id;
            technicianSocketService.connect(userId, handleJobRequest, handleJobCancelled, () => { }, () => { });
            loadDashboardData();
        };

        initDashboard();

        const unsubscribe = navigation.addListener('focus', () => {
            loadDashboardData();
        });

        return () => {
            unsubscribe();
            technicianSocketService.disconnect();
            driverLocationService.stopTracking();
        };
    }, [navigation]);

    // Continuous location tracking & real-time broadcast when online
    useEffect(() => {
        let isSubscribed = true;
        const userId = user?.id || user?._id;

        if (isOnline && userId) {
            driverLocationService.startTracking((loc) => {
                if (isSubscribed) {
                    technicianSocketService.sendLocation(null, loc, userId);
                }
            }).catch(err => {
                console.log('Location tracking start notice:', err.message);
            });
        } else {
            driverLocationService.stopTracking();
        }

        return () => {
            isSubscribed = false;
            driverLocationService.stopTracking();
        };
    }, [isOnline, user]);

    const handleJobRequest = (jobData) => {
        if (jobData.paymentMethod === 'COD' && wallet.commissionDue >= wallet.codLimit) return;
        setPendingJob(jobData);
        setShowJobModal(true);
    };

    const handleJobCancelled = (data) => {
        if (pendingJob && pendingJob.rideId === data.rideId) {
            setShowJobModal(false);
            setPendingJob(null);
        }
        if (activeJob && activeJob.id === data.rideId) {
            setActiveJob(null);
            loadDashboardData();
        }
    };

    const handleAcceptJob = async () => {
        setShowJobModal(false);
        if (!pendingJob?.rideId) return;

        try {
            const technicianData = await authService.getUser();
            const driverId = technicianData?.id || technicianData?._id;
            const result = await rideService.acceptRide(pendingJob.rideId, driverId);

            if (result.success) {
                Alert.alert('Success', 'Job accepted!');
                setPendingJob(null);
                loadDashboardData();
                navigation.navigate('JobDetails', { job: { id: pendingJob.rideId, rideId: pendingJob.rideId, ...pendingJob } });
            } else {
                Alert.alert('Failed', result.error || 'Job already taken');
                setPendingJob(null);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to accept job');
        }
    };

    const handleDeclineJob = () => {
        setShowJobModal(false);
        setPendingJob(null);
    };

    const handleAcceptFromList = async (job) => {
        try {
            const technicianData = await authService.getUser();
            const driverId = technicianData?.id || technicianData?._id;
            const result = await rideService.acceptRide(job.rideId, driverId);

            if (result.success) {
                setShowServicesSheet(false);
                loadDashboardData();
                navigation.navigate('JobDetails', { job: { id: job.rideId, rideId: job.rideId, ...job } });
            } else {
                Alert.alert('Failed', result.error || 'Job no longer available');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to accept job');
        }
    };

    const [fullKycData, setFullKycData] = useState(null);

    const loadDashboardData = async () => {
        try {
            const userId = user?.id || user?._id;
            const response = await technicianService.getTechnicianDashboard(userId);

            if (response.success) {
                setTodayEarnings(response.data.todayEarnings);
                setCompletedJobs(response.data.completedJobs);
                setActiveJob(response.data.activeJob);
                setIsOnline(response.data.isOnline);
                setWallet(response.data.wallet);

                // Get recent jobs for history preview
                console.log('📊 Fetching job history for userId:', userId);
                const jobsResponse = await rideService.getAllJobs(userId);
                console.log('📊 Jobs response:', jobsResponse);
                if (jobsResponse.success) {
                    const completed = jobsResponse.completed || [];
                    console.log('✅ Completed jobs:', completed.length, completed);
                    setRecentJobs(completed.slice(0, 3));
                }
            }

            const kycRes = await technicianService.getKYCStatus();
            if (kycRes.success) {
                setKycStatus(kycRes.kycStatus);
                setFullKycData(kycRes);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };


    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [lastToggleTime, setLastToggleTime] = useState(0);

    const handleToggleOnline = async () => {
        const now = Date.now();
        // Rate limit: 2 seconds between toggles
        if (now - lastToggleTime < 2000) {
            return;
        }

        if (!isOnline && kycStatus !== 'VERIFIED') {
            Alert.alert(
                "KYC Required", 
                "You must complete your KYC verification before you can go online and accept jobs.",
                [
                    { text: "Later", style: "cancel" },
                    { 
                        text: "Complete KYC", 
                        onPress: () => navigation.navigate('KYC', { 
                            initialStatus: kycStatus,
                            initialKycData: fullKycData?.documents 
                        }) 
                    }
                ]
            );
            return;
        }

        // Optimistic UI Update
        const nextStatus = !isOnline;
        setIsOnline(nextStatus);
        setLastToggleTime(now);
        setIsUpdatingStatus(true);

        try {
            const result = await technicianService.updateOnlineStatus(nextStatus);
            if (!result.success) {
                // Rollback on failure
                setIsOnline(!nextStatus);
                Alert.alert('Status Error', result.error || 'Failed to sync status');
            }
        } catch (error) {
            setIsOnline(!nextStatus);
            Alert.alert('Error', 'Connection failed');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{user?.name || 'CoolTech Pro'}</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.profileIcon} onPress={() => navigation.navigate('TechnicianProfile')}>
                        <Ionicons name="person-circle" size={32} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Online/Offline Toggle */}
                <View style={styles.toggleCard}>
                    <View style={styles.toggleSwitch}>
                        <TouchableOpacity
                            style={[styles.toggleButton, isOnline && styles.toggleButtonActive]}
                            onPress={handleToggleOnline}
                        >
                            <Text style={[styles.toggleText, isOnline && styles.toggleTextActive]}>Online</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, !isOnline && styles.toggleButtonActive]}
                            onPress={handleToggleOnline}
                        >
                            <Text style={[styles.toggleText, !isOnline && styles.toggleTextActive]}>Offline</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statusRow}>
                        <Text style={styles.availabilityText}>
                            SYSTEM STATUS: <Text style={[styles.availabilityStatus, isOnline && styles.availabilityOnline]}>
                                {isOnline ? 'OPERATIONAL' : 'STANDBY'}
                            </Text>
                        </Text>
                        <View style={styles.statusIconContainer}>
                            {isUpdatingStatus ? (
                                <ActivityIndicator size="small" color={isOnline ? '#10b981' : '#999'} />
                            ) : (
                                <Ionicons 
                                    name={isOnline ? "radio" : "ellipse-outline"} 
                                    size={16} 
                                    color={isOnline ? '#10b981' : '#999'} 
                                />
                            )}
                        </View>
                    </View>
                </View>
                
                {/* Active Job Card */}
                {activeJob && (
                    <View style={styles.activeJobCard}>
                        <View style={styles.activeJobHeader}>
                            <View style={styles.activeJobBadge}>
                                <Text style={styles.activeJobBadgeText}>ONGOING JOB</Text>
                            </View>
                            <Text style={styles.activeJobId}>#{activeJob.rideId?.substring(0, 8).toUpperCase()}</Text>
                        </View>
                        
                        <View style={styles.activeJobBody}>
                            <View style={styles.activeJobInfo}>
                                <Text style={styles.activeJobStatus}>
                                    {activeJob.status === 'ACCEPTED' && 'Confirmed - Head to location'}
                                    {activeJob.status === 'ARRIVED' && 'Arrived at location'}
                                    {activeJob.status === 'IN_PROGRESS' && 'Service in progress'}
                                </Text>
                                <Text style={styles.activeJobAddress} numberOfLines={1}>
                                    {activeJob.pickup?.address || 'Service Location'}
                                </Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.activeJobGoButton}
                                onPress={() => navigation.navigate('TechnicianNavigation', {
                                    job: activeJob,
                                    rideId: activeJob.rideId || activeJob._id
                                })}
                            >
                                <Text style={styles.activeJobGoText}>GO</Text>
                                <Ionicons name="navigate" size={16} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Earnings Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Earnings Summary</Text>
                    <View style={styles.earningsRow}>
                        <View style={styles.earningItem}>
                            <Ionicons name="construct" size={24} color="#000" />
                            <Text style={styles.earningLabel}>Total Jobs</Text>
                            <Text style={styles.earningValue}>{completedJobs}</Text>
                        </View>
                        <View style={styles.earningItem}>
                            <Ionicons name="cash" size={24} color="#000" />
                            <Text style={styles.earningLabel}>Total Earnings</Text>
                            <Text style={styles.earningValue}>₹{Math.round(todayEarnings).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Wallet */}
                <View style={styles.card}>
                    <View style={styles.walletRow}>
                        <View style={styles.walletLeft}>
                            <Ionicons name="wallet" size={24} color="#000" />
                            <View style={styles.walletInfo}>
                                <Text style={styles.walletLabel}>Wallet</Text>
                                <Text style={styles.walletAmount}>₹{Math.round(wallet.balance)}</Text>
                                <Text style={styles.currentBalance}>Current Balance</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.withdrawButton}
                            onPress={() => navigation.navigate('TechnicianWallet', { initialView: 'WITHDRAW' })}
                        >
                            <Text style={styles.withdrawText}>Withdraw</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Job History Preview */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Job History Preview</Text>
                    {recentJobs.length > 0 ? (
                        recentJobs.map((job, index) => (
                            <View key={index} style={styles.historyItem}>
                                <View style={styles.historyLeft}>
                                    <View style={styles.historyIcon}>
                                        <Ionicons name="briefcase" size={20} color="#000" />
                                    </View>
                                    <View>
                                        <Text style={styles.historyDate}>{formatDate(job.createdAt)}</Text>
                                        <Text style={styles.historyDesc}>
                                            {job.serviceType || 'Service'} - {job.pickup?.address?.split(',')[0] || 'Location'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.completedBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                    <Text style={styles.completedText}>Completed</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No job history yet</Text>
                    )}
                </View>

                {/* Refresh Jobs Button */}

            </ScrollView>

            <JobRequestSheet visible={showJobModal} jobData={pendingJob} onAccept={handleAcceptJob} onReject={handleDeclineJob} />
            <ServicesListSheet visible={showServicesSheet} onClose={() => setShowServicesSheet(false)} technicianId={user?.id || user?._id} onAcceptJob={handleAcceptFromList} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },

    // Header
    header: {
        backgroundColor: '#000',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    profileIcon: {
        marginRight: 4,
    },

    scroll: {
        padding: 16,
        paddingBottom: 40,
    },

    // Toggle Card
    toggleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    toggleSwitch: {
        flexDirection: 'row',
        backgroundColor: '#e5e5e5',
        borderRadius: 25,
        padding: 4,
        marginBottom: 12,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 22,
    },
    toggleButtonActive: {
        backgroundColor: '#000',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    toggleTextActive: {
        color: '#fff',
    },
    availabilityText: {
        fontSize: 11,
        color: '#666',
        fontWeight: '900',
        letterSpacing: 1
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    statusIconContainer: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    availabilityStatus: {
        fontWeight: '600',
        color: '#999',
    },
    availabilityOnline: {
        color: '#10b981',
    },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },

    // Earnings
    earningsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    earningItem: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    earningLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    earningValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    activeJobCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    activeJobHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeJobBadge: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fb923c',
    },
    activeJobBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#ea580c',
        letterSpacing: 0.5,
    },
    activeJobId: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
    },
    activeJobBody: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    activeJobInfo: {
        flex: 1,
        marginRight: 16,
    },
    activeJobStatus: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    activeJobAddress: {
        fontSize: 13,
        color: '#6b7280',
    },
    activeJobGoButton: {
        backgroundColor: '#fde68a',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    activeJobGoText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000',
    },

    // Wallet
    walletRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    walletLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    walletInfo: {
        flex: 1,
    },
    walletLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    walletAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    currentBalance: {
        fontSize: 12,
        color: '#999',
    },
    withdrawButton: {
        backgroundColor: '#000',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    withdrawText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },

    // History
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    historyIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    historyDesc: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedText: {
        fontSize: 11,
        color: '#10b981',
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },

    // Refresh Button
    refreshButton: {
        backgroundColor: '#4A90E2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    refreshText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
