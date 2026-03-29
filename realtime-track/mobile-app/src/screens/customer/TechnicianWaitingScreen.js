import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Easing,
    Alert,
    Dimensions,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import customerSocketService from '../../services/customerSocketService';
import rideService from '../../services/rideService';
import { expoNotificationService } from '../../services/expoNotificationService';

const { width, height } = Dimensions.get('window');

// Uber-Inspired Clean Palette
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
    red: '#e11d48',
    mapOverlay: 'rgba(39, 110, 241, 0.08)',
};

export default function TechnicianWaitingScreen({ route, navigation }) {
    const { rideId, total, service, address, paymentTiming } = route.params;
    const [cancelling, setCancelling] = useState(false);

    // Radar scan animation
    const scanAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Radar scanning animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Pulse animation for pin
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Connect to socket
        customerSocketService.connect(rideId);
        customerSocketService.setOnRideAccepted((data) => {
            if (data.otp) {
                expoNotificationService.sendLocalNotification(
                    'Technician Assigned!',
                    `Your technician is on the way. OTP: ${data.otp}`,
                    { screen: 'ServiceStatus', rideId }
                );
            }

            navigation.replace('ServiceStatus', {
                rideId,
                otp: data.arrivalOtp || data.otp,
                serviceType: service?.id || 'service',
                pricing: route.params.pricing
            });
        });

        return () => {
            customerSocketService.setOnRideAccepted(null);
        };
    }, [rideId]);

    const handleCancelRequest = () => {
        Alert.alert(
            'Cancel Booking',
            'Are you sure you want to cancel this booking?',
            [
                { text: 'Keep Booking', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: confirmCancellation
                }
            ]
        );
    };

    const confirmCancellation = async () => {
        setCancelling(true);
        try {
            const response = await rideService.cancelRide(rideId, 'Customer cancelled');

            if (response.success) {
                // Use replace to ensure HomeScreen refreshes
                navigation.replace('Home');
            } else {
                Alert.alert('Error', response.error || 'Failed to cancel booking');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong: ' + error.message);
        } finally {
            setCancelling(false);
        }
    };

    const scanScale = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 2.5]
    });

    const scanOpacity = scanAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.6, 0.3, 0]
    });

    const isPrepaid = paymentTiming === 'PREPAID';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Finding Technician</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Map-like Background with Scanning Animation */}
                <View style={styles.mapSection}>
                    {/* Grid Pattern */}
                    <View style={styles.gridPattern}>
                        {[...Array(8)].map((_, i) => (
                            <View
                                key={`h-${i}`}
                                style={[styles.gridLineHorizontal, { top: `${(i + 1) * 12.5}%` }]}
                            />
                        ))}
                        {[...Array(6)].map((_, i) => (
                            <View
                                key={`v-${i}`}
                                style={[styles.gridLineVertical, { left: `${(i + 1) * 16.66}%` }]}
                            />
                        ))}
                    </View>

                    {/* Radar Container */}
                    <View style={styles.radarContainer}>
                        <Animated.View
                            style={[
                                styles.radarWave,
                                {
                                    transform: [{ scale: scanScale }],
                                    opacity: scanOpacity,
                                }
                            ]}
                        />

                        {/* Center Pin */}
                        <Animated.View style={[
                            styles.centerPin,
                            { transform: [{ scale: pulseAnim }] }
                        ]}>
                            <View style={styles.pinOuter}>
                                <Ionicons name="search" size={32} color={COLORS.white} />
                            </View>
                        </Animated.View>
                    </View>

                    {/* Status Overlay */}
                    <Animated.View style={[styles.statusOverlay, { opacity: fadeAnim }]}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Searching nearby experts...</Text>
                    </Animated.View>
                </View>

                {/* Info Section */}
                <Animated.View style={[styles.infoSection, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>Finding Your Expert</Text>
                    <Text style={styles.subtitle}>
                        Connecting with verified professionals in your area
                    </Text>

                    {/* Payment Status Banner */}
                    <View style={[styles.paymentBanner, isPrepaid ? styles.paymentBannerPaid : styles.paymentBannerPostpaid]}>
                        <Ionicons
                            name={isPrepaid ? "checkmark-circle" : "time-outline"}
                            size={20}
                            color={isPrepaid ? COLORS.accent : '#f59e0b'}
                        />
                        <Text style={styles.paymentBannerText}>
                            {isPrepaid ? 'Payment Completed' : 'Pay After Service'}
                        </Text>
                        <View style={[styles.paymentPill, isPrepaid ? styles.pillPaid : styles.pillPostpaid]}>
                            <Text style={styles.paymentPillText}>
                                {isPrepaid ? 'PREPAID' : 'POSTPAID'}
                            </Text>
                        </View>
                    </View>

                    {/* Booking Details */}
                    <View style={styles.detailsCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="receipt-outline" size={20} color={COLORS.textPrimary} />
                            <Text style={styles.cardHeaderText}>Booking Details</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Booking ID</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>
                                {rideId?.toUpperCase() || 'UNKNOWN'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Service Type</Text>
                            <Text style={styles.detailValue}>{service?.name || 'AC Service'}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Service Location</Text>
                            <Text style={styles.detailValue}>
                                {address?.description || address?.address || 'Location not set'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Amount</Text>
                            <Text style={[styles.detailValue, styles.amountText]}>₹{total}</Text>
                        </View>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color={COLORS.blue} />
                        <Text style={styles.infoBoxText}>
                            You'll receive a notification once a technician accepts your request
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Footer with Cancel Button */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelRequest}
                    disabled={cancelling}
                    activeOpacity={0.7}
                >
                    <Ionicons name="close-circle-outline" size={20} color={COLORS.red} />
                    <Text style={styles.cancelButtonText}>
                        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                    </Text>
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
    scrollContainer: {
        flex: 1,
    },
    mapSection: {
        height: 280,
        backgroundColor: COLORS.mapOverlay,
        position: 'relative',
        overflow: 'hidden',
    },
    gridPattern: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    gridLineHorizontal: {
        position: 'absolute',
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    gridLineVertical: {
        position: 'absolute',
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    radarContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radarWave: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.blue,
        borderWidth: 2,
        borderColor: COLORS.blue,
    },
    centerPin: {
        zIndex: 10,
    },
    pinOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.blue,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 4,
        borderColor: COLORS.white,
    },
    statusOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.blue,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    infoSection: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginBottom: 20,
    },
    paymentBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    paymentBannerPaid: {
        backgroundColor: '#E8F5E9',
    },
    paymentBannerPostpaid: {
        backgroundColor: '#FFF3E0',
    },
    paymentBannerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
    },
    paymentPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    pillPaid: {
        backgroundColor: COLORS.accent,
    },
    pillPostpaid: {
        backgroundColor: '#f59e0b',
    },
    paymentPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    detailsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.border,
    },
    cardHeaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
    },
    detailItem: {
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 11,
        color: COLORS.textTertiary,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 15,
        color: COLORS.black,
        fontWeight: '600',
        lineHeight: 20,
    },
    amountText: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.mapOverlay,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    infoBoxText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textPrimary,
        lineHeight: 19,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.red,
        gap: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.red,
    },
});
