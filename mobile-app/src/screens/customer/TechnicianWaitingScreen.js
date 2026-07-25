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
import {
    DESIGN_COLORS as C,
    DESIGN_TYPOGRAPHY as TY,
    DESIGN_RADIUS as R,
    DESIGN_SPACING as S,
    DESIGN_SHADOWS as SHADOWS
} from '../../constants/designSystem';

const { width } = Dimensions.get('window');

export default function TechnicianWaitingScreen({ route, navigation }) {
    const { rideId, total, service, address, paymentTiming } = route.params;
    const [cancelling, setCancelling] = useState(false);

    // Radar scan & pulse animations
    const scanAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Radar scanning animation loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, {
                    toValue: 1,
                    duration: 2200,
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

        // Pulse animation for center pin
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

        // Fade in content
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Connect customer socket and join ride room
        customerSocketService.connect(rideId);
        
        // Listen for technician ride acceptance
        customerSocketService.setOnRideAccepted((data) => {
            if (data.otp) {
                expoNotificationService.sendLocalNotification(
                    'Technician Assigned!',
                    `Your technician is on the way. Arrival OTP: ${data.otp}`,
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
            'Are you sure you want to cancel this booking request?',
            [
                { text: 'Keep Waiting', style: 'cancel' },
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
            const response = await rideService.cancelRide(rideId, 'Customer cancelled search');

            if (response.success) {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    navigation.navigate('Home');
                }
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
        outputRange: [0, 2.8]
    });

    const scanOpacity = scanAnim.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0.7, 0.35, 0]
    });

    const isPrepaid = paymentTiming === 'PREPAID';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.background} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('Home');
                            }
                        }}
                    >
                        <Ionicons name="arrow-back" size={22} color={C.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Finding Technician</Text>
                    <View style={styles.headerPlaceholder} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Radar Scanning Area */}
                <View style={styles.mapSection}>
                    {/* Dark Grid Background */}
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

                    {/* Animated Radar Pulse Waves */}
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
                                <Ionicons name="search" size={28} color={C.onPrimary} />
                            </View>
                        </Animated.View>
                    </View>

                    {/* Live Status Badge */}
                    <Animated.View style={[styles.statusOverlay, { opacity: fadeAnim }]}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Notifying all nearby technicians...</Text>
                    </Animated.View>
                </View>

                {/* Main Information Section */}
                <Animated.View style={[styles.infoSection, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>Finding Your Expert</Text>
                    <Text style={styles.subtitle}>
                        Broadcasting your service request to active technicians in your location.
                    </Text>

                    {/* Payment Timing Status Banner */}
                    <View style={[styles.paymentBanner, isPrepaid ? styles.paymentBannerPaid : styles.paymentBannerPostpaid]}>
                        <Ionicons
                            name={isPrepaid ? "checkmark-circle" : "time-outline"}
                            size={20}
                            color={isPrepaid ? C.primary : '#f59e0b'}
                        />
                        <Text style={styles.paymentBannerText}>
                            {isPrepaid ? 'Payment Verified (Prepaid)' : 'Pay After Service (Postpaid)'}
                        </Text>
                        <View style={[styles.paymentPill, isPrepaid ? styles.pillPaid : styles.pillPostpaid]}>
                            <Text style={[styles.paymentPillText, isPrepaid ? styles.pillPaidText : styles.pillPostpaidText]}>
                                {isPrepaid ? 'PREPAID' : 'POSTPAID'}
                            </Text>
                        </View>
                    </View>

                    {/* Booking Details Card */}
                    <View style={styles.detailsCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="receipt-outline" size={18} color={C.primary} />
                            <Text style={styles.cardHeaderText}>Booking Details</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>BOOKING ID</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>
                                {rideId?.toUpperCase() || 'UNKNOWN'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>SERVICE CATEGORY</Text>
                            <Text style={styles.detailValue}>{service?.name || 'AC Service'}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>SERVICE LOCATION</Text>
                            <Text style={styles.detailValue}>
                                {address?.description || address?.address || 'Location not specified'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>ESTIMATED AMOUNT</Text>
                            <Text style={[styles.detailValue, styles.amountText]}>₹{total ? Math.round(total) : '0'}</Text>
                        </View>
                    </View>

                    {/* Real-time Broadcast Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="radio-outline" size={20} color={C.primary} />
                        <Text style={styles.infoBoxText}>
                            A notification has been dispatched to available technicians. You'll be alerted immediately when a technician accepts.
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
                    activeOpacity={0.8}
                >
                    <Ionicons name="close-circle-outline" size={20} color={C.error} />
                    <Text style={styles.cancelButtonText}>
                        {cancelling ? 'Cancelling Request...' : 'Cancel Booking'}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.background,
    },
    headerSafeArea: {
        backgroundColor: C.surfaceContainerLowest,
        borderBottomWidth: 1,
        borderBottomColor: C.surfaceContainerHigh,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: S.containerPaddingMobile,
        paddingVertical: 14,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: R.full,
        backgroundColor: C.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: TY.titleMd.fontFamily,
        fontSize: 18,
        fontWeight: '600',
        color: C.onSurface,
    },
    headerPlaceholder: {
        width: 40,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    mapSection: {
        height: 250,
        backgroundColor: C.surfaceContainerLowest,
        position: 'relative',
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: C.surfaceContainerHigh,
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
        backgroundColor: 'rgba(255,255,255, 0.04)',
    },
    gridLineVertical: {
        position: 'absolute',
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(255,255,255, 0.04)',
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
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: C.primary,
        borderWidth: 2,
        borderColor: C.primary,
    },
    centerPin: {
        zIndex: 10,
    },
    pinOuter: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.lg,
        borderWidth: 3,
        borderColor: C.onSurface,
    },
    statusOverlay: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: C.surfaceContainerHigh,
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: R.full,
        marginHorizontal: 40,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: C.primary,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.onSurface,
    },
    infoSection: {
        paddingHorizontal: S.containerPaddingMobile,
        paddingTop: 24,
    },
    title: {
        fontFamily: TY.headlineLgMobile.fontFamily,
        fontSize: 24,
        fontWeight: '600',
        color: C.onSurface,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: C.onSurfaceVariant,
        lineHeight: 21,
        marginBottom: 20,
    },
    paymentBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: R.base,
        marginBottom: 20,
        gap: 10,
        borderWidth: 1,
    },
    paymentBannerPaid: {
        backgroundColor: C.surfaceContainerLow,
        borderColor: C.primaryContainer,
    },
    paymentBannerPostpaid: {
        backgroundColor: C.surfaceContainerLow,
        borderColor: '#f59e0b40',
    },
    paymentBannerText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: C.onSurface,
    },
    paymentPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: R.sm,
    },
    pillPaid: {
        backgroundColor: C.onPrimaryContainer,
    },
    pillPostpaid: {
        backgroundColor: '#f59e0b20',
    },
    paymentPillText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    pillPaidText: {
        color: C.primary,
    },
    pillPostpaidText: {
        color: '#f59e0b',
    },
    detailsCard: {
        backgroundColor: C.surfaceContainerLow,
        borderRadius: R.xl,
        padding: 20,
        borderWidth: 1,
        borderColor: C.surfaceContainerHigh,
        marginBottom: 16,
        ...SHADOWS.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.surfaceContainerHigh,
    },
    cardHeaderText: {
        fontFamily: TY.titleMd.fontFamily,
        fontSize: 16,
        fontWeight: '600',
        color: C.onSurface,
    },
    detailItem: {
        paddingVertical: 10,
    },
    detailLabel: {
        fontFamily: TY.labelCaps.fontFamily,
        fontSize: 11,
        color: C.onSurfaceVariant,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 1,
    },
    detailValue: {
        fontSize: 15,
        color: C.onSurface,
        fontWeight: '600',
        lineHeight: 21,
    },
    amountText: {
        fontSize: 22,
        fontWeight: '700',
        color: C.primary,
    },
    divider: {
        height: 1,
        backgroundColor: C.surfaceContainerHigh,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: C.surfaceContainerLow,
        padding: 16,
        borderRadius: R.base,
        gap: 12,
        borderWidth: 1,
        borderColor: C.surfaceContainerHigh,
    },
    infoBoxText: {
        flex: 1,
        fontSize: 13,
        color: C.onSurfaceVariant,
        lineHeight: 19,
    },
    footer: {
        paddingHorizontal: S.containerPaddingMobile,
        paddingTop: 14,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: C.surfaceContainerHigh,
        backgroundColor: C.surfaceContainerLowest,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.surfaceContainerLow,
        paddingVertical: 15,
        borderRadius: R.base,
        borderWidth: 1.5,
        borderColor: C.errorContainer,
        gap: 8,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.error,
    },
});
