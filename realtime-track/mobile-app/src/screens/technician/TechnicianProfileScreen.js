import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING } from '../../constants/theme';
import authService from '../../services/authService';
import technicianService from '../../services/technicianService';

export default function TechnicianProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [kycStatus, setKycStatus] = useState('LOADING');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });
        return unsubscribe;
    }, [navigation]);

    const loadData = async () => {
        setRefreshing(true);
        const userData = await authService.getUser();
        setUser(userData);
        
        const res = await technicianService.getKYCStatus();
        if (res.success) {
            setKycStatus(res.kycStatus);
        }
        setRefreshing(false);
    };

    const getBadge = () => {
        switch (kycStatus) {
            case 'VERIFIED': return { label: 'VERIFIED', color: '#000' };
            case 'PENDING': return { label: 'PENDING', color: '#666' };
            case 'REJECTED': return { label: 'REJECTED', color: '#000' };
            case 'NOT_STARTED': return { label: 'NOT STARTED', color: '#ccc' };
            default: return { label: 'LOADING', color: '#eee' };
        }
    };

    const badge = getBadge();

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to exit?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Logout', 
                style: 'destructive',
                onPress: async () => {
                    await authService.logout();
                    navigation.replace('Auth');
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.bw_black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CONTROL CENTER</Text>
                <TouchableOpacity onPress={loadData} style={styles.iconButton}>
                    {refreshing ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="refresh" size={20} color={COLORS.bw_black} />}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={48} color={COLORS.bw_white} />
                        </View>
                        <View style={styles.editIcon}>
                            <Ionicons name="camera" size={12} color={COLORS.bw_white} />
                        </View>
                    </View>
                    <Text style={styles.userName}>{user?.name?.toUpperCase() || 'TECHNICIAN'}</Text>
                    <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'SERVICE EXPERT'}</Text>
                    
                    <View style={[styles.kycBadge, { borderColor: badge.color }]}>
                        <Text style={[styles.kycText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>ACCOUNT MANAGEMENT</Text>
                    <ProfileMenuItem 
                        icon="person-outline" 
                        label="Personal Information" 
                        subtitle={user?.mobile || 'Primary details'}
                        onPress={() => navigation.navigate('PersonalDetails')} 
                    />
                    <ProfileMenuItem 
                        icon="shield-checkmark-outline" 
                        label="KYC & Verification" 
                        subtitle={badge.label.toLowerCase()}
                        onPress={() => navigation.navigate('KYC')} 
                        rightElement={
                            <View style={[styles.dot, { backgroundColor: kycStatus === 'VERIFIED' ? '#000' : '#ccc' }]} />
                        }
                    />
                    <ProfileMenuItem 
                        icon="key-outline" 
                        label="Security & Password" 
                        subtitle="Update access code"
                        onPress={() => navigation.navigate('ChangePassword')} 
                    />
                    <ProfileMenuItem 
                        icon="wallet-outline" 
                        label="Banking & Payouts" 
                        subtitle="Account configuration"
                        onPress={() => navigation.navigate('TechnicianWallet', { initialView: 'WITHDRAW' })} 
                    />
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>SUPPORT & LEGAL</Text>
                    <ProfileMenuItem 
                        icon="help-buoy-outline" 
                        label="Get Assistance" 
                        subtitle="Helpdesk and FAQs"
                        onPress={() => navigation.navigate('Support')} 
                    />
                    <ProfileMenuItem 
                        icon="document-outline" 
                        label="Terms of Service" 
                        subtitle="Platform agreement"
                        onPress={() => {}} 
                    />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.bw_white} />
                    <Text style={styles.logoutText}>TERMINATE SESSION</Text>
                </TouchableOpacity>
                
                <Text style={styles.versionText}>ZYRO v1.0.4 • B&W EDITION</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function ProfileMenuItem({ icon, label, subtitle, onPress, rightElement }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconBox}>
                <Ionicons name={icon} size={22} color={COLORS.bw_black} />
            </View>
            <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{label}</Text>
                <Text style={styles.menuSubtitle}>{subtitle}</Text>
            </View>
            {rightElement || <Ionicons name="chevron-forward" size={18} color={COLORS.bw_greyMedium} />}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bw_white },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: SPACING.lg, 
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bw_border
    },
    headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.bw_black, letterSpacing: 3 },
    iconButton: { padding: 8 },
    scrollContent: { padding: SPACING.lg },
    profileHeader: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
    avatarContainer: { marginBottom: 16 },
    avatar: { 
        width: 100, 
        height: 100, 
        borderRadius: 50, 
        backgroundColor: COLORS.bw_black, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.bw_white,
        // Elevation for iOS/Android
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
    },
    editIcon: { 
        position: 'absolute', 
        bottom: 0, 
        right: 0, 
        backgroundColor: COLORS.bw_black, 
        width: 28, 
        height: 28, 
        borderRadius: 14, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.bw_white
    },
    userName: { fontSize: 22, fontWeight: '900', color: COLORS.bw_black, letterSpacing: 1 },
    userRole: { fontSize: 11, color: COLORS.grey, letterSpacing: 2, marginTop: 4, fontWeight: 'bold' },
    kycBadge: { 
        marginTop: 16, 
        paddingHorizontal: 12, 
        paddingVertical: 4, 
        borderRadius: 2, 
        borderWidth: 1,
    },
    kycText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    menuSection: { marginBottom: 35 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: COLORS.bw_greyMedium, letterSpacing: 2, marginBottom: 15 },
    menuItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bw_greyLight
    },
    menuIconBox: { 
        width: 40, 
        height: 40, 
        borderRadius: 4, 
        backgroundColor: COLORS.bw_greyLight, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginRight: 15
    },
    menuContent: { flex: 1 },
    menuLabel: { fontSize: 15, fontWeight: 'bold', color: COLORS.bw_black },
    menuSubtitle: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    logoutButton: { 
        flexDirection: 'row',
        backgroundColor: COLORS.bw_black, 
        padding: 18, 
        borderRadius: 4, 
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10
    },
    logoutText: { color: COLORS.bw_white, fontWeight: '900', letterSpacing: 2, fontSize: 14 },
    versionText: { textAlign: 'center', color: COLORS.bw_greyMedium, fontSize: 10, marginTop: 30, letterSpacing: 1 },
});
