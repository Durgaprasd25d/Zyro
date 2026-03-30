import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import config from '../../constants/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

export default function BookingSummaryScreen({ route, navigation }) {
    const { service, date, time, address } = route.params;
    const [fees, setFees] = React.useState({ platformFee: 0, gst: 0 });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchFees = async () => {
            try {
                const response = await fetch(`${config.BACKEND_URL}/api/services/settings`);
                const result = await response.json();
                if (result.success) {
                    setFees(result.settings);
                }
            } catch (error) {
                console.error('Error fetching fees:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFees();
    }, []);

    const basePrice = Math.round(parseFloat(service.price));
    // Calculate Platform Fee as a percentage or flat? 
    // The user's previous code was flat 49, but user asked for "controlled" fields.
    // I will treat them as percentages based on the Admin UI I built.
    const platformFeeVal = Math.round(parseFloat(fees.platformFee || 0));
    const taxVal = Math.round(basePrice * (fees.gst / 100)); // GST only on service charge
    const total = Math.round(basePrice + platformFeeVal + taxVal);

    const pricing = {
        basePrice,
        platformFee: platformFeeVal,
        gst: taxVal,
        gstRate: fees.gst, // Added GST percentage for historical records
        price: total
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
                    <Text style={styles.headerTitle}>Review Booking</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Service Details Card */}
                <View style={styles.card}>
                    <View style={styles.serviceHeader}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="construct-outline" size={24} color={COLORS.black} />
                        </View>
                        <View style={styles.serviceInfo}>
                            <Text style={styles.serviceLabel}>Selected Service</Text>
                            <Text style={styles.serviceName}>{service.name}</Text>
                        </View>
                    </View>
                </View>

                {/* Logistics Section */}
                <Text style={styles.sectionTitle}>Booking Details</Text>
                <View style={styles.card}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="calendar-outline" size={20} color={COLORS.black} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Date & Time</Text>
                            <Text style={styles.infoValue}>{date} • {time}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="location-outline" size={20} color={COLORS.black} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Service Address</Text>
                            <Text style={styles.infoValue} numberOfLines={3}>
                                {address?.description || 'No address provided'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Price Breakdown */}
                <Text style={styles.sectionTitle}>Price Breakdown</Text>
                <View style={styles.card}>
                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.blue} style={{ padding: 20 }} />
                    ) : (
                        <View style={{ gap: 12 }}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Base Service Fee</Text>
                                <Text style={styles.priceValue}>₹{basePrice}</Text>
                            </View>

                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Platform Fee</Text>
                                <Text style={styles.priceValue}>₹{platformFeeVal}</Text>
                            </View>

                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>GST ({fees.gst}%)</Text>
                                <Text style={styles.priceValue}>₹{taxVal}</Text>
                            </View>

                            <View style={styles.priceDivider} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={[styles.totalValue, { color: COLORS.blue }]}>₹{total}</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.guaranteeRow}>
                    <Ionicons name="shield-checkmark" size={16} color={COLORS.textTertiary} />
                    <Text style={styles.guaranteeText}>
                        ZyroAC handles all payments securely.
                    </Text>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom CTA */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <TouchableOpacity
                    style={styles.confirmButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PaymentMethod', { total, service, address, time, date, pricing })}
                >
                    <Text style={styles.confirmButtonText}>Select Payment Method</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.black,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoIcon: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.black,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
        marginLeft: 44,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.black,
    },
    priceDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.blue,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.accent,
    },
    guaranteeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: -8,
        marginBottom: 24,
    },
    guaranteeText: {
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
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});
