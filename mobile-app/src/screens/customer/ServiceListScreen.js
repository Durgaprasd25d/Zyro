import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StatusBar,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import config from '../../constants/config';
import { DESIGN_COLORS as C } from '../../constants/designSystem';

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

export default function ServiceListScreen({ route, navigation }) {
    const { type, categoryName } = route.params;
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/services/category/${type}`);
            const result = await response.json();
            if (result.success) {
                setServices(result.data.services || []);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderService = ({ item }) => (
        <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ServiceDetail', { service: item })}
        >
            <View style={styles.serviceCardContent}>
                <Image
                    source={getServiceImage(item.name)}
                    style={styles.serviceThumbnail}
                    resizeMode="cover"
                />

                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={2}>
                        {item.description || 'Professional AC service by verified technicians'}
                    </Text>

                    <View style={styles.serviceMetaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={COLORS.textTertiary} />
                            <Text style={styles.metaText}>{item.time || '1-2 hrs'}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Ionicons name="star" size={14} color="#f59e0b" />
                            <Text style={styles.metaText}>4.9</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.servicePriceSection}>
                    <Text style={styles.priceLabel}>from</Text>
                    <Text style={styles.priceValue}>₹{item.price || 0}</Text>
                    <TouchableOpacity 
                        style={styles.bookButton}
                        onPress={() => navigation.navigate('ServiceDetail', { service: item })}
                    >
                        <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

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
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{categoryName || 'Services'}</Text>
                        {!loading && (
                            <Text style={styles.headerSubtitle}>{services.length} services available</Text>
                        )}
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                </View>
            ) : services.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name="folder-open-outline" size={48} color={COLORS.textTertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>No services found</Text>
                    <Text style={styles.emptySubtitle}>Check back later for new services</Text>
                </View>
            ) : (
                <FlatList
                    data={services}
                    renderItem={renderService}
                    keyExtractor={(item) => item._id || item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.black,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    serviceCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    serviceCardContent: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
    },
    serviceThumbnail: {
        width: 56,
        height: 56,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: COLORS.background,
    },
    serviceInfo: {
        flex: 1,
        marginRight: 12,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 4,
    },
    serviceDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
        marginBottom: 8,
    },
    serviceMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: COLORS.border,
        marginHorizontal: 10,
    },
    servicePriceSection: {
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 11,
        color: COLORS.textTertiary,
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 8,
    },
    bookButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
