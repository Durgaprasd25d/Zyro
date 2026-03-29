import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Uber-Inspired Clean Palette (matching HomeScreen)
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

export default function ServiceDetailScreen({ route, navigation }) {
    const { service } = route.params;

    const handleSchedule = () => {
        navigation.navigate('Schedule', { service });
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
                    <Text style={styles.headerTitle}>Service Details</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Service Header */}
                <View style={styles.serviceHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="construct" size={48} color={COLORS.black} />
                    </View>
                    <Text style={styles.serviceName}>{service?.name || 'Service'}</Text>
                    <Text style={styles.serviceCategory}>{service?.category || 'AC Service'}</Text>
                </View>

                {/* Price Card */}
                <View style={styles.priceCard}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Service Fee</Text>
                        <Text style={styles.priceValue}>₹{service?.price || 0}</Text>
                    </View>
                </View>

                {/* Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Service Information</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>Duration</Text>
                            <Text style={styles.infoValue}>{service?.duration || '1-2 hours'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>Warranty</Text>
                            <Text style={styles.infoValue}>30 days service warranty</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>Professional</Text>
                            <Text style={styles.infoValue}>Verified & experienced technician</Text>
                        </View>
                    </View>
                </View>

                {/* Description Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>About this service</Text>
                    <Text style={styles.description}>
                        {service?.description ||
                            'Our professional technicians provide comprehensive AC service including cleaning, gas charging, and performance optimization to ensure efficient cooling.'}
                    </Text>
                </View>

                {/* Inclusions Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>What's included</Text>

                    {[
                        'Complete unit inspection',
                        'Filter cleaning & replacement',
                        'Gas pressure check',
                        'Coil cleaning',
                        'Performance testing',
                        'Safety checks'
                    ].map((item, index) => (
                        <View key={index} style={styles.checklistItem}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                            <Text style={styles.checklistText}>{item}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom CTA */}
            <SafeAreaView edges={['bottom']} style={styles.footer}>
                <View style={styles.footerContent}>
                    <View style={styles.footerPriceSection}>
                        <Text style={styles.footerPriceLabel}>Total</Text>
                        <Text style={styles.footerPrice}>₹{service?.price || 0}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.scheduleButton}
                        activeOpacity={0.8}
                        onPress={handleSchedule}
                    >
                        <Text style={styles.scheduleButtonText}>Schedule Service</Text>
                    </TouchableOpacity>
                </View>
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
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    serviceHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    serviceName: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    serviceCategory: {
        fontSize: 15,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    priceCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 15,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
    },
    infoLabel: {
        fontSize: 13,
        color: COLORS.textTertiary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: COLORS.black,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.textSecondary,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checklistText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        marginLeft: 12,
        flex: 1,
    },
    footer: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 16,
    },
    footerPriceSection: {
        flex: 1,
    },
    footerPriceLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    footerPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
    },
    scheduleButton: {
        backgroundColor: COLORS.black,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 8,
    },
    scheduleButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
