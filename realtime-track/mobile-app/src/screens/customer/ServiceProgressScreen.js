import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Dimensions,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import rideService from '../../services/rideService';

const { width } = Dimensions.get('window');

const COLORS = {
    black: '#000000',
    white: '#ffffff',
    background: '#f7f7f7',
    textPrimary: '#000000',
    textSecondary: '#545454',
    textTertiary: '#8a8a8a',
    border: '#e0e0e0',
    accent: '#06c167',
    blue: '#276ef1',
    card: '#ffffff',
};

// Status configuration with navigation logic
const STATUS_CONFIG = {
    REQUESTED: {
        label: 'Booking Confirmed',
        description: 'Finding a technician for you',
        icon: 'checkmark-circle',
        color: COLORS.accent,
        screen: 'TechnicianWaiting',
        buttonText: 'View Search Status'
    },
    ACCEPTED: {
        label: 'Technician Assigned',
        description: 'Your technician is on the way',
        icon: 'person',
        color: COLORS.blue,
        screen: 'ServiceStatus',
        buttonText: 'Track Technician'
    },
    ARRIVED: {
        label: 'Technician Arrived',
        description: 'Technician has reached your location',
        icon: 'location',
        color: COLORS.accent,
        screen: 'ServiceStatus',
        buttonText: 'View Live Status'
    },
    IN_PROGRESS: {
        label: 'Service in Progress',
        description: 'Technician is working on your service',
        icon: 'construct',
        color: COLORS.blue,
        screen: 'ServiceStatus',
        buttonText: 'View Service Status'
    },
    COMPLETED: {
        label: 'Service Completed',
        description: 'Service has been completed successfully',
        icon: 'checkmark-done-circle',
        color: COLORS.accent,
        screen: 'Receipt',
        buttonText: 'View Receipt'
    }
};

// Progress steps for tracker
const PROGRESS_STEPS = [
    { key: 'REQUESTED', label: 'Booking Confirmed' },
    { key: 'ACCEPTED', label: 'Technician Assigned' },
    { key: 'ARRIVED', label: 'Technician Arrived' },
    { key: 'IN_PROGRESS', label: 'Service Started' },
    { key: 'COMPLETED', label: 'Completed' }
];

export default function ServiceProgressScreen({ route, navigation }) {
    const { rideId } = route.params;
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRideDetails();
    }, [rideId]);

    const loadRideDetails = async () => {
        setLoading(true);
        try {
            // Fetch ride details - you may need to create this endpoint
            const response = await rideService.getCurrentRide();
            if (response.success && response.data) {
                setRide(response.data);
            }
        } catch (error) {
            console.error('Error loading ride:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentStepIndex = () => {
        if (!ride) return 0;
        return PROGRESS_STEPS.findIndex(step => step.key === ride.status);
    };

    const handleContinue = () => {
        if (!ride) return;

        const config = STATUS_CONFIG[ride.status];
        if (config && config.screen) {
            navigation.replace(config.screen, {
                rideId: ride.rideId || rideId,
                serviceType: ride.serviceType || 'service'
            });
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color={COLORS.black} />
                <Text style={styles.loadingText}>Loading service status...</Text>
            </View>
        );
    }

    if (!ride) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <SafeAreaView edges={['top']} style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Service Status</Text>
                    <View style={{ width: 40 }} />
                </SafeAreaView>
                <View style={styles.centerContent}>
                    <Text style={styles.emptyText}>No active service found</Text>
                </View>
            </View>
        );
    }

    const currentStepIndex = getCurrentStepIndex();
    const currentConfig = STATUS_CONFIG[ride.status] || STATUS_CONFIG.REQUESTED;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Service Progress</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Current Status Card */}
                <View style={[styles.statusCard, { borderLeftColor: currentConfig.color }]}>
                    <View style={[styles.statusIcon, { backgroundColor: currentConfig.color }]}>
                        <Ionicons name={currentConfig.icon} size={28} color={COLORS.white} />
                    </View>
                    <View style={styles.statusInfo}>
                        <Text style={styles.statusLabel}>Current Status</Text>
                        <Text style={styles.statusTitle}>{currentConfig.label}</Text>
                        <Text style={styles.statusDescription}>{currentConfig.description}</Text>
                    </View>
                </View>

                {/* Progress Tracker */}
                <View style={styles.trackerSection}>
                    <Text style={styles.sectionTitle}>Progress Tracker</Text>

                    <View style={styles.progressContainer}>
                        {PROGRESS_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const isLast = index === PROGRESS_STEPS.length - 1;

                            return (
                                <View key={step.key} style={styles.progressStep}>
                                    {/* Dot */}
                                    <View style={styles.dotContainer}>
                                        <View style={[
                                            styles.dot,
                                            isCompleted && styles.dotCompleted,
                                            isCurrent && styles.dotCurrent
                                        ]}>
                                            {isCompleted && !isCurrent && (
                                                <Ionicons name="checkmark" size={12} color={COLORS.white} />
                                            )}
                                        </View>
                                        {!isLast && (
                                            <View style={[
                                                styles.connector,
                                                isCompleted && styles.connectorCompleted
                                            ]} />
                                        )}
                                    </View>

                                    {/* Label */}
                                    <View style={styles.stepLabel}>
                                        <Text style={[
                                            styles.stepText,
                                            isCompleted && styles.stepTextCompleted,
                                            isCurrent && styles.stepTextCurrent
                                        ]}>
                                            {step.label}
                                        </Text>
                                        {isCurrent && (
                                            <View style={styles.currentBadge}>
                                                <Text style={styles.currentBadgeText}>Current</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Service Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Service Details</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Booking ID</Text>
                        <Text style={styles.detailValue}>{ride.rideId?.substring(0, 12).toUpperCase()}...</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Service Type</Text>
                        <Text style={styles.detailValue}>{ride.serviceType?.toUpperCase()}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment</Text>
                        <Text style={styles.detailValue}>{ride.paymentTiming || 'PREPAID'}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Continue Button */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>{currentConfig.buttonText}</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    header: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.black,
    },
    content: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    statusCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        margin: 20,
        padding: 20,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statusIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statusInfo: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 11,
        color: COLORS.textTertiary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 4,
    },
    statusDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    trackerSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 20,
    },
    progressContainer: {
        paddingLeft: 8,
    },
    progressStep: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dotContainer: {
        alignItems: 'center',
        marginRight: 16,
    },
    dot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotCompleted: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    dotCurrent: {
        backgroundColor: COLORS.blue,
        borderColor: COLORS.blue,
        borderWidth: 3,
    },
    connector: {
        width: 2,
        flex: 1,
        backgroundColor: COLORS.border,
        marginTop: 4,
    },
    connectorCompleted: {
        backgroundColor: COLORS.accent,
    },
    stepLabel: {
        flex: 1,
        paddingTop: 2,
        paddingBottom: 24,
    },
    stepText: {
        fontSize: 15,
        color: COLORS.textTertiary,
        fontWeight: '500',
    },
    stepTextCompleted: {
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    stepTextCurrent: {
        color: COLORS.blue,
        fontWeight: '700',
    },
    currentBadge: {
        backgroundColor: COLORS.blue,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    currentBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    detailsCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.black,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.black,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});
