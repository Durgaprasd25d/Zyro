import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    StatusBar,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import rideService from '../../services/rideService';

const { width } = Dimensions.get('window');

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
};

const METHODS = [
    {
        id: 'prepaid',
        name: 'Instant Checkout',
        icon: 'card-outline',
        desc: 'Fastest service with prepaid booking.',
        timing: 'PREPAID',
    },
    {
        id: 'postpaid',
        name: 'Pay After Service',
        icon: 'time-outline',
        desc: 'Pay online once the job is completed.',
        timing: 'POSTPAID',
    },
];

export default function PaymentMethodScreen({ route, navigation }) {
    const { total, service, address, time, date } = route.params;
    const [selectedMethod, setSelectedMethod] = useState('prepaid');
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const serviceTypeMap = {
                'r1': 'repair', 'r2': 'service', 'r3': 'install',
                'i1': 'install', 's1': 'service', 'emergency': 'emergency'
            };

            const mappedServiceType = serviceTypeMap[service?.id] || 'service';
            const pickupLocation = {
                address: address?.description || address?.address || 'No address provided',
                lat: address?.location?.lat || 0,
                lng: address?.location?.lng || 0
            };

            if (!pickupLocation.lat || !pickupLocation.lng) {
                Alert.alert('Invalid Location', 'Please select a valid location with coordinates');
                setLoading(false);
                return;
            }

            const selectedMethodObj = METHODS.find(m => m.id === selectedMethod);
            const paymentTiming = selectedMethodObj?.timing || 'PREPAID';

            const response = await rideService.requestRide(
                pickupLocation,
                { address: 'Technician Hub', lat: 0, lng: 0 },
                mappedServiceType,
                'ONLINE',
                paymentTiming,
                route.params.pricing
            );

            if (response.success) {
                const jobId = response.rideId || response.data?.rideId || 'UNKNOWN';
                if (paymentTiming === 'PREPAID') {
                    // Prepaid: Go to payment first, then waiting screen
                    navigation.navigate('CustomerRazorpayCheckout', {
                        rideId: jobId,
                        amount: total,
                        paymentTiming: 'PREPAID',
                        service,
                        address,
                        pricing: route.params.pricing
                    });
                } else {
                    // Postpaid: Go to search screen
                    navigation.navigate('TechnicianWaiting', {
                        rideId: jobId,
                        total,
                        service,
                        address,
                        paymentTiming: 'POSTPAID',
                        pricing: route.params.pricing
                    });
                }
            } else {
                Alert.alert('Booking Failed', response.error || 'Unable to create booking');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

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
                    <Text style={styles.headerTitle}>Select Payment</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <View style={styles.content}>
                {/* Total Info */}
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Amount to Pay</Text>
                    <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
                </View>

                <Text style={styles.sectionTitle}>Payment Timing</Text>

                <View style={styles.methodList}>
                    {METHODS.map((method) => {
                        const isActive = selectedMethod === method.id;
                        return (
                            <TouchableOpacity
                                key={method.id}
                                activeOpacity={0.7}
                                style={[
                                    styles.methodCard,
                                    isActive && styles.methodCardActive
                                ]}
                                onPress={() => setSelectedMethod(method.id)}
                            >
                                <View style={styles.methodIcon}>
                                    <Ionicons
                                        name={method.icon}
                                        size={24}
                                        color={isActive ? COLORS.black : COLORS.textTertiary}
                                    />
                                </View>

                                <View style={styles.methodDetails}>
                                    <Text style={[
                                        styles.methodName,
                                        isActive && styles.methodNameActive
                                    ]}>
                                        {method.name}
                                    </Text>
                                    <Text style={styles.methodDesc}>{method.desc}</Text>
                                </View>

                                <View style={[
                                    styles.radioCircle,
                                    isActive && styles.radioCircleActive
                                ]}>
                                    {isActive && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.securityBox}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textTertiary} />
                    <Text style={styles.securityText}>
                        Your transaction is encrypted and secured.
                    </Text>
                </View>
            </View>

            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity
                    style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                    activeOpacity={0.8}
                    onPress={handlePayment}
                    disabled={loading}
                >
                    <Text style={styles.confirmButtonText}>
                        {loading ? 'Processing...' : 'Confirm Booking'}
                    </Text>
                    {!loading && <Ionicons name="chevron-forward" size={20} color={COLORS.white} />}
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
        padding: 16,
    },
    totalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    totalLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    totalValue: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.black,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.black,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    methodList: {
        gap: 12,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    methodCardActive: {
        borderColor: COLORS.black,
        borderWidth: 2,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodDetails: {
        flex: 1,
    },
    methodName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    methodNameActive: {
        color: COLORS.black,
    },
    methodDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleActive: {
        borderColor: COLORS.black,
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.black,
    },
    securityBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 32,
    },
    securityText: {
        fontSize: 12,
        color: COLORS.textTertiary,
    },
    footer: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
    },
    confirmButton: {
        backgroundColor: COLORS.black,
        paddingVertical: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmButtonDisabled: {
        opacity: 0.7,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});
