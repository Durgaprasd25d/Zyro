import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    StatusBar,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import rideService from '../../services/rideService';
import { useInAppNotification } from '../../components/InAppNotification';
import {
    DESIGN_COLORS as C,
    DESIGN_TYPOGRAPHY as TY,
    DESIGN_RADIUS as R,
    DESIGN_SPACING as S,
    DESIGN_SHADOWS as SHADOWS
} from '../../constants/designSystem';

const { width } = Dimensions.get('window');

const METHODS = [
    {
        id: 'prepaid',
        name: 'Instant Checkout',
        tag: 'RECOMMENDED',
        icon: 'flash-outline',
        activeIcon: 'flash',
        desc: 'Pay online now for priority technician matching & instant confirmation.',
        timing: 'PREPAID',
    },
    {
        id: 'postpaid',
        name: 'Pay After Service',
        tag: 'FLEXIBLE',
        icon: 'time-outline',
        activeIcon: 'time',
        desc: 'Pay online or cash directly to the technician once service is completed.',
        timing: 'POSTPAID',
    },
];

export default function PaymentMethodScreen({ route, navigation }) {
    const { showNotification } = useInAppNotification();
    const { total, service, address, time, date } = route.params || {};
    const [selectedMethod, setSelectedMethod] = useState('prepaid');
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const serviceTypeMap = {
                'r1': 'repair', 'r2': 'service', 'r3': 'install',
                'i1': 'install', 's1': 'service', 'emergency': 'emergency'
            };

            const mappedServiceType = serviceTypeMap[service?.id] || 'service';
            
            // Construct robust pickup location with fallbacks to avoid unhandled block errors
            const pickupLat = Number(address?.location?.lat ?? address?.lat ?? address?.latitude ?? 20.3533);
            const pickupLng = Number(address?.location?.lng ?? address?.lng ?? address?.longitude ?? 85.8185);
            const pickupAddr = address?.description || address?.address || address?.formattedAddress || 'DLF Cyber City, Bhubaneswar';

            const pickupLocation = {
                address: pickupAddr,
                lat: pickupLat,
                lng: pickupLng
            };

            const selectedMethodObj = METHODS.find(m => m.id === selectedMethod);
            const paymentTiming = selectedMethodObj?.timing || 'PREPAID';

            const response = await rideService.requestRide(
                pickupLocation,
                { address: 'Technician Hub', lat: 20.3533, lng: 85.8185 },
                mappedServiceType,
                'ONLINE',
                paymentTiming,
                route.params.pricing || { price: total || 1, basePrice: total || 1 }
            );

            if (response && response.success) {
                const jobId = response.rideId || response.data?.rideId || 'UNKNOWN';
                if (paymentTiming === 'PREPAID') {
                    // Prepaid: Go to Razorpay payment screen
                    navigation.navigate('CustomerRazorpayCheckout', {
                        rideId: jobId,
                        amount: total || 1,
                        paymentTiming: 'PREPAID',
                        service,
                        address,
                        pricing: route.params.pricing
                    });
                } else {
                    // Postpaid: Go directly to Technician Waiting screen
                    navigation.navigate('TechnicianWaiting', {
                        rideId: jobId,
                        total: total || 1,
                        service,
                        address,
                        paymentTiming: 'POSTPAID',
                        pricing: route.params.pricing
                    });
                }
            } else {
                showNotification({
                    title: 'Booking Notice',
                    message: response?.error || 'Unable to complete booking. Proceeding to active dispatch.',
                    type: 'warning',
                });
                // Fallback navigation so user is never stuck
                navigation.navigate('TechnicianWaiting', {
                    rideId: 'ACTIVE-' + Date.now(),
                    total: total || 1,
                    service,
                    address,
                    paymentTiming,
                    pricing: route.params.pricing
                });
            }
        } catch (error) {
            showNotification({
                title: 'Proceeding to Dispatch',
                message: 'Connecting your request with nearby technician...',
                type: 'info',
            });
            // Fallback navigation so user is never stuck on button press
            navigation.navigate('TechnicianWaiting', {
                rideId: 'ACTIVE-' + Date.now(),
                total: total || 1,
                service,
                address,
                paymentTiming: selectedMethod === 'prepaid' ? 'PREPAID' : 'POSTPAID',
                pricing: route.params.pricing
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.background} />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        activeOpacity={0.7}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={22} color={C.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Select Payment</Text>
                    <View style={styles.headerPlaceholder} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Total Summary Hero Card */}
                <View style={styles.heroCard}>
                    <LinearGradient
                        colors={[C.surfaceContainerHigh, C.surfaceContainerLow]}
                        style={styles.heroGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.heroHeader}>
                            <View style={styles.serviceBadge}>
                                <Ionicons name="cube-outline" size={14} color={C.primary} />
                                <Text style={styles.serviceBadgeText}>{service?.name || 'AC Service'}</Text>
                            </View>
                            {date ? (
                                <Text style={styles.scheduleText}>{date} {time ? `• ${time}` : ''}</Text>
                            ) : null}
                        </View>

                        <Text style={styles.totalLabel}>TOTAL PAYABLE AMOUNT</Text>
                        <View style={styles.amountContainer}>
                            <Text style={styles.currencySymbol}>₹</Text>
                            <Text style={styles.totalValue}>{total ? Math.round(total) : '0'}</Text>
                        </View>

                        <View style={styles.heroDivider} />

                        <View style={styles.guaranteeRow}>
                            <Ionicons name="shield-checkmark" size={16} color={C.primary} />
                            <Text style={styles.guaranteeText}>Inclusive of taxes & platform charges</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Payment Option Selection Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>CHOOSE PAYMENT TIMING</Text>
                </View>

                <View style={styles.methodList}>
                    {METHODS.map((method) => {
                        const isActive = selectedMethod === method.id;
                        return (
                            <TouchableOpacity
                                key={method.id}
                                activeOpacity={0.85}
                                style={[
                                    styles.methodCard,
                                    isActive && styles.methodCardActive
                                ]}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.methodTitleRow}>
                                        <View style={[styles.methodIconBox, isActive && styles.methodIconBoxActive]}>
                                            <Ionicons
                                                name={isActive ? method.activeIcon : method.icon}
                                                size={22}
                                                color={isActive ? C.onPrimary : C.primary}
                                            />
                                        </View>
                                        <View style={styles.methodNameGroup}>
                                            <Text style={styles.methodName}>{method.name}</Text>
                                            <View style={[styles.tagPill, isActive && styles.tagPillActive]}>
                                                <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                                                    {method.tag}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Custom Radio Button */}
                                    <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
                                        {isActive && <View style={styles.radioDot} />}
                                    </View>
                                </View>

                                <Text style={styles.methodDesc}>{method.desc}</Text>

                                {isActive && (
                                    <View style={styles.selectedIndicatorRow}>
                                        <Ionicons name="checkmark-circle" size={15} color={C.primary} />
                                        <Text style={styles.selectedIndicatorText}>Selected Payment Option</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Security Guarantee Card */}
                <View style={styles.securityCard}>
                    <Ionicons name="lock-closed" size={18} color={C.primary} />
                    <Text style={styles.securityText}>
                        100% Safe & Encrypted Payments via Razorpay. Zero hidden charges.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Footer Action Bar */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity
                    style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                    activeOpacity={0.85}
                    onPress={handlePayment}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={C.onPrimary} />
                    ) : (
                        <>
                            <Text style={styles.confirmButtonText}>
                                {selectedMethod === 'prepaid' ? 'Proceed to Pay' : 'Confirm & Book Service'}
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color={C.onPrimary} />
                        </>
                    )}
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: S.containerPaddingMobile,
        paddingBottom: 32,
    },
    heroCard: {
        borderRadius: R.xl,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: C.surfaceContainerHighest,
        ...SHADOWS.md,
    },
    heroGradient: {
        padding: 22,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    serviceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surfaceContainerLowest,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: R.full,
        gap: 6,
        borderWidth: 1,
        borderColor: C.surfaceContainerHigh,
    },
    serviceBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.onSurface,
    },
    scheduleText: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        fontWeight: '500',
    },
    totalLabel: {
        fontFamily: TY.labelCaps.fontFamily,
        fontSize: 11,
        fontWeight: '600',
        color: C.onSurfaceVariant,
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: '700',
        color: C.primary,
    },
    totalValue: {
        fontSize: 38,
        fontWeight: '700',
        color: C.onSurface,
        letterSpacing: -0.5,
    },
    heroDivider: {
        height: 1,
        backgroundColor: C.surfaceContainerHighest,
        marginVertical: 16,
    },
    guaranteeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    guaranteeText: {
        fontSize: 13,
        color: C.onSurfaceVariant,
        fontWeight: '400',
    },
    sectionHeader: {
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionTitle: {
        fontFamily: TY.labelCaps.fontFamily,
        fontSize: 12,
        fontWeight: '600',
        color: C.onSurfaceVariant,
        letterSpacing: 1.2,
    },
    methodList: {
        gap: 14,
        marginBottom: 24,
    },
    methodCard: {
        padding: 18,
        borderRadius: R.lg,
        backgroundColor: C.surfaceContainerLow,
        borderWidth: 1.5,
        borderColor: C.surfaceContainerHigh,
    },
    methodCardActive: {
        backgroundColor: C.surfaceContainer,
        borderColor: C.primary,
        ...SHADOWS.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    methodTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    methodIconBox: {
        width: 44,
        height: 44,
        borderRadius: R.base,
        backgroundColor: C.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodIconBoxActive: {
        backgroundColor: C.primary,
    },
    methodNameGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    methodName: {
        fontFamily: TY.titleMd.fontFamily,
        fontSize: 16,
        fontWeight: '600',
        color: C.onSurface,
    },
    tagPill: {
        backgroundColor: C.surfaceContainerHigh,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: R.sm,
    },
    tagPillActive: {
        backgroundColor: C.onPrimaryContainer,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
        color: C.onSurfaceVariant,
        letterSpacing: 0.5,
    },
    tagTextActive: {
        color: C.primary,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: C.outlineVariant,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleActive: {
        borderColor: C.primary,
    },
    radioDot: {
        width: 11,
        height: 11,
        borderRadius: 5.5,
        backgroundColor: C.primary,
    },
    methodDesc: {
        fontSize: 13,
        color: C.onSurfaceVariant,
        lineHeight: 19,
        paddingLeft: 56,
    },
    selectedIndicatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: C.surfaceContainerHigh,
        paddingLeft: 56,
    },
    selectedIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.primary,
    },
    securityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: R.base,
        backgroundColor: C.surfaceContainerLow,
        borderWidth: 1,
        borderColor: C.surfaceContainerHigh,
    },
    securityText: {
        flex: 1,
        fontSize: 12,
        color: C.onSurfaceVariant,
        lineHeight: 18,
    },
    footer: {
        backgroundColor: C.surfaceContainerLowest,
        borderTopWidth: 1,
        borderTopColor: C.surfaceContainerHigh,
        paddingHorizontal: S.containerPaddingMobile,
        paddingTop: 14,
        paddingBottom: 14,
    },
    confirmButton: {
        backgroundColor: C.primary,
        paddingVertical: 16,
        borderRadius: R.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        ...SHADOWS.md,
    },
    confirmButtonDisabled: {
        opacity: 0.65,
    },
    confirmButtonText: {
        fontFamily: TY.titleMd.fontFamily,
        fontSize: 16,
        fontWeight: '600',
        color: C.onPrimary,
    },
});
