import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Platform,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DESIGN_COLORS as C } from '../../constants/designSystem';

const { width } = Dimensions.get('window');

// Dynamic Service Image Mapping matching the exact backend seeded services
const SERVICE_IMAGES = {
    'gas leak fix': require('../../../assets/gas_leak_fix.png'),
    'cooling issue': require('../../../assets/cooling_issue.png'),
    'deep cleaning': require('../../../assets/deep_cleaning.png'),
    'standard checkup': require('../../../assets/standard_checkup.png'),
    'unit installation': require('../../../assets/unit_installation.png'),
    'fast repair': require('../../../assets/fast_repair.png'),
};

const getServiceImage = (name) => {
    if (!name) return SERVICE_IMAGES['standard checkup'];
    const normalized = name.toLowerCase().trim();
    if (normalized.includes('gas') || normalized.includes('leak')) return SERVICE_IMAGES['gas leak fix'];
    if (normalized.includes('cooling') || normalized.includes('issue') || normalized.includes('cool')) return SERVICE_IMAGES['cooling issue'];
    if (normalized.includes('deep') || normalized.includes('clean') || normalized.includes('chemical')) return SERVICE_IMAGES['deep cleaning'];
    if (normalized.includes('checkup') || normalized.includes('standard') || normalized.includes('maintenance')) return SERVICE_IMAGES['standard checkup'];
    if (normalized.includes('installation') || normalized.includes('unit') || normalized.includes('install')) return SERVICE_IMAGES['unit installation'];
    if (normalized.includes('fast') || normalized.includes('emergency') || normalized.includes('repair')) return SERVICE_IMAGES['fast repair'];
    return SERVICE_IMAGES['standard checkup'];
};

export default function ServiceDetailScreen({ route, navigation }) {
    const { service } = route.params;

    const handleSchedule = () => {
        navigation.navigate('Schedule', { service });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Stunning HD Banner Header Section */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={getServiceImage(service?.name)}
                        style={styles.bannerImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(19, 19, 19, 0.4)', 'rgba(19, 19, 19, 0.95)']}
                        style={styles.bannerGradient}
                    >
                        <View style={styles.bannerHeaderRow}>
                            <TouchableOpacity
                                style={styles.floatingBackButton}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.floatingHeaderTitle}>Details</Text>
                            <View style={{ width: 42 }} />
                        </View>

                        <View style={styles.bannerTextContainer}>
                            <Text style={styles.serviceName}>{service?.name || 'AC Service'}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryBadgeText}>
                                        {service?.category?.name || service?.category || 'Premium Service'}
                                    </Text>
                                </View>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={12} color="#FFD54F" />
                                    <Text style={styles.ratingBadgeText}>4.9</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Body Content Container */}
                <View style={styles.bodyContainer}>
                    {/* Price and Duration Summary */}
                    <View style={styles.statsCard}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Service Price</Text>
                            <Text style={styles.statValue}>₹{service?.price || 499}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Duration</Text>
                            <Text style={styles.statValue}>{service?.time || service?.duration || '1.5 hrs'}</Text>
                        </View>
                    </View>

                    {/* About Section */}
                    <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>About This Service</Text>
                        <Text style={styles.description}>
                            {service?.description ||
                                'Premium climate control maintenance. Our certified technicians carry out high-grade inspections, filter washing, coolant tests, and complete mechanical checks to ensure peak efficiency.'}
                        </Text>
                    </View>

                    {/* Highlights Checkbox list */}
                    <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>What's Included</Text>
                        {[
                            'Full diagnostic diagnostics run-up',
                            'Chemical coil sanitation & dirt purging',
                            'Coolant level testing & gas leak survey',
                            '30-day premium service assurance warranty',
                            'No hidden fees - standard platform rates'
                        ].map((item, index) => (
                            <View key={index} style={styles.checklistItem}>
                                <Ionicons name="checkmark-circle" size={18} color={C.primary} style={{ marginTop: 2 }} />
                                <Text style={styles.checklistText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Technical details list */}
                    <View style={styles.infoCard}>
                        <Text style={styles.cardTitle}>Expert Details</Text>
                        
                        <View style={styles.detailRow}>
                            <Ionicons name="shield-checkmark" size={20} color={C.outline} />
                            <View style={styles.detailTextCol}>
                                <Text style={styles.detailTitle}>Certified Specialists</Text>
                                <Text style={styles.detailSubtitle}>Every technician is background-checked & certified.</Text>
                            </View>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailRow}>
                            <Ionicons name="sparkles" size={20} color={C.outline} />
                            <View style={styles.detailTextCol}>
                                <Text style={styles.detailTitle}>Zero Damage Guarantee</Text>
                                <Text style={styles.detailSubtitle}>Premium insurance coverage for all active cleaning sessions.</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            {/* Bottom Sticky Booking CTA */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <View style={styles.footerContent}>
                    <View style={styles.footerPriceSection}>
                        <Text style={styles.footerPriceLabel}>Total Cost</Text>
                        <Text style={styles.footerPrice}>₹{service?.price || 499}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.scheduleButton}
                        activeOpacity={0.85}
                        onPress={handleSchedule}
                    >
                        <Text style={styles.scheduleButtonText}>BOOK SERVICE</Text>
                        <Ionicons name="arrow-forward" size={18} color={C.onPrimary} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    bannerContainer: {
        height: 310,
        position: 'relative',
        backgroundColor: C.background,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 20,
    },
    bannerHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    floatingBackButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(28, 28, 28, 0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    bannerTextContainer: {
        width: '100%',
    },
    serviceName: {
        fontSize: 28,
        fontWeight: '850',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: C.primary,
        letterSpacing: 0.5,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    ratingBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bodyContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 16,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: C.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        borderRadius: 20,
        paddingVertical: 18,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: C.outline,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '850',
        color: C.onSurface,
    },
    statDivider: {
        width: 1,
        backgroundColor: C.outlineVariant,
    },
    infoCard: {
        backgroundColor: C.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        borderRadius: 20,
        padding: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: C.onSurface,
        marginBottom: 12,
        letterSpacing: 0.1,
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        color: C.outline,
        fontWeight: '500',
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    checklistText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: C.onSurface,
        lineHeight: 18,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
    },
    detailTextCol: {
        flex: 1,
    },
    detailTitle: {
        fontSize: 14,
        fontWeight: '750',
        color: C.onSurface,
        marginBottom: 2,
    },
    detailSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: C.outline,
        lineHeight: 16,
    },
    detailDivider: {
        height: 1,
        backgroundColor: C.outlineVariant,
        marginVertical: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: C.surfaceContainerLow,
        borderTopWidth: 1,
        borderColor: C.outlineVariant,
        zIndex: 20,
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 16,
    },
    footerPriceSection: {
        flex: 1,
    },
    footerPriceLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: C.outline,
        marginBottom: 2,
    },
    footerPrice: {
        fontSize: 24,
        fontWeight: '850',
        color: C.onSurface,
    },
    scheduleButton: {
        backgroundColor: C.primary,
        height: 52,
        paddingHorizontal: 24,
        borderRadius: 26,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    scheduleButtonText: {
        color: C.onPrimary,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
});
