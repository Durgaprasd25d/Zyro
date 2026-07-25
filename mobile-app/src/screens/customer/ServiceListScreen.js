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
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import config from '../../constants/config';
import rideService from '../../services/rideService';
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from '../../constants/designSystem';
import BottomNavBar from '../../components/BottomNavBar';

// Dynamic Service Image Mapping matching backend seeded services
const SERVICE_IMAGES = {
    'gas leak fix': require('../../../assets/gas_leak_fix_1.png'),
    'cooling issue': require('../../../assets/cooling_issue_1.png'),
    'deep cleaning': require('../../../assets/deep_cleaning.png'),
    'standard checkup': require('../../../assets/standard_checkup.png'),
    'unit installation': require('../../../assets/unit_installation.png'),
    'fast repair': require('../../../assets/cooling_issue_2.png'),
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
    const { type, categoryName } = route?.params || {};
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'active'
    const [activeRide, setActiveRide] = useState(null);

    useEffect(() => {
        fetchServices();
        fetchActiveRide();
    }, [type]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const url = type
                ? `${config.BACKEND_URL}/api/services/category/${type}`
                : `${config.BACKEND_URL}/api/services/all`;
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setServices(result.data?.services || result.data || []);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveRide = async () => {
        const res = await rideService.getCurrentRide();
        if (res.success && res.data) {
            setActiveRide(res.data);
        } else {
            setActiveRide(null);
        }
    };

    const handleActiveBookingPress = () => {
        if (!activeRide) return;
        const rideId = activeRide.rideId || activeRide._id;
        const status = activeRide.status;

        if (status === 'REQUESTED') {
            navigation.navigate('TechnicianWaiting', { rideId });
        } else if (status === 'ACCEPTED' || status === 'ARRIVED') {
            navigation.navigate('ServiceStatus', { rideId, otp: activeRide.arrivalOtp });
        } else if (status === 'IN_PROGRESS' || status === 'SERVICE_ENDED') {
            navigation.navigate('ServiceStatus', { rideId, initialStep: 'in_progress' });
        } else {
            navigation.navigate('History');
        }
    };

    const renderService = ({ item }) => (
        <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.75}
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
                            <Ionicons name="time-outline" size={13} color={C.onSurfaceVariant} />
                            <Text style={styles.metaText}>{item.time || '1-2 hrs'}</Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Ionicons name="star" size={13} color="#FFD54F" />
                            <Text style={styles.metaText}>4.9</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.servicePriceSection}>
                    <Text style={styles.priceLabel}>from</Text>
                    <Text style={styles.priceValue}>₹{item.price || 1}</Text>
                    <TouchableOpacity 
                        style={styles.bookButton}
                        onPress={() => navigation.navigate('ServiceDetail', { service: item })}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chevron-forward" size={18} color="#131313" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

            {/* Dark Theme Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color={C.onSurface} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{categoryName || 'Services & Activity'}</Text>
                        {!loading && (
                            <Text style={styles.headerSubtitle}>{services.length} services available</Text>
                        )}
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Sub Segment Filter Tabs: All Services vs Active Activity */}
                <View style={styles.segmentContainer}>
                    <TouchableOpacity
                        style={[styles.segmentBtn, activeTab === 'all' && styles.segmentBtnActive]}
                        onPress={() => setActiveTab('all')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.segmentText, activeTab === 'all' && styles.segmentTextActive]}>
                            All Services ({services.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.segmentBtn, activeTab === 'active' && styles.segmentBtnActive]}
                        onPress={() => setActiveTab('active')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.segmentText, activeTab === 'active' && styles.segmentTextActive]}>
                            Active Activity {activeRide ? '(1)' : '(0)'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Main Tab Content */}
            {activeTab === 'active' ? (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {activeRide && activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED' ? (
                        <TouchableOpacity
                            style={styles.activeBookingCard}
                            activeOpacity={0.88}
                            onPress={handleActiveBookingPress}
                        >
                            <View style={styles.activeCardHeader}>
                                <View style={styles.activeIconCircle}>
                                    <Ionicons name="snow" size={20} color={C.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activeCardTitle}>
                                        {(activeRide.serviceType || 'AC SERVICE').toUpperCase()}
                                    </Text>
                                    <Text style={styles.activeCardSub}>
                                        {activeRide.pickup?.address || 'Current Booking'}
                                    </Text>
                                </View>
                                <View style={styles.activeStatusBadge}>
                                    <Text style={styles.activeStatusText}>
                                        {activeRide.status === 'REQUESTED' ? 'SEARCHING' : activeRide.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.activeCardFooter}>
                                <Text style={styles.activeFooterText}>Tap to open live tracking</Text>
                                <Ionicons name="arrow-forward" size={16} color={C.primary} />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="checkmark-circle-outline" size={44} color={C.onSurfaceVariant} />
                            </View>
                            <Text style={styles.emptyTitle}>No Active Activity</Text>
                            <Text style={styles.emptySubtitle}>You don't have any ongoing service bookings right now.</Text>
                        </View>
                    )}
                </ScrollView>
            ) : loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                </View>
            ) : services.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name="folder-open-outline" size={44} color={C.onSurfaceVariant} />
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

            <BottomNavBar navigation={navigation} activeTab="services" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    header: {
        backgroundColor: '#0D0D0D',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1C',
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
        borderRadius: 20,
        backgroundColor: '#161616',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: TY.titleMd.fontFamily,
        fontWeight: '600',
        color: C.onSurface,
    },
    headerSubtitle: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        marginTop: 2,
    },
    segmentContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 10,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#161616',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    segmentBtnActive: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.onSurfaceVariant,
    },
    segmentTextActive: {
        color: C.onPrimary,
        fontWeight: '800',
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
        paddingVertical: 60,
    },
    emptyIconBox: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#141414',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#222222',
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: C.onSurface,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: C.onSurfaceVariant,
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 110,
    },
    serviceCard: {
        backgroundColor: '#141414',
        borderRadius: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#222222',
    },
    serviceCardContent: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
    },
    serviceThumbnail: {
        width: 64,
        height: 64,
        borderRadius: 12,
        marginRight: 14,
        backgroundColor: '#1C1C1C',
    },
    serviceInfo: {
        flex: 1,
        marginRight: 12,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: C.onSurface,
        marginBottom: 4,
    },
    serviceDescription: {
        fontSize: 13,
        color: C.onSurfaceVariant,
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
        color: C.onSurfaceVariant,
        fontWeight: '500',
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#262626',
        marginHorizontal: 10,
    },
    servicePriceSection: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 64,
    },
    priceLabel: {
        fontSize: 10,
        color: C.onSurfaceVariant,
        textTransform: 'uppercase',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '700',
        color: C.primary,
    },
    bookButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeBookingCard: {
        backgroundColor: '#141414',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.primary,
        padding: 18,
        marginBottom: 16,
    },
    activeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    activeIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(230, 190, 171, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeCardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: C.onSurface,
    },
    activeCardSub: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        marginTop: 2,
    },
    activeStatusBadge: {
        backgroundColor: C.primary,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    activeStatusText: {
        fontSize: 10,
        fontWeight: '800',
        color: C.onPrimary,
    },
    activeCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#222222',
        paddingTop: 12,
    },
    activeFooterText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.primary,
    },
    bottomNav: {
        backgroundColor: C.surfaceContainerLow,
        borderTopWidth: 1,
        borderColor: C.outlineVariant,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navContent: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 0 : 10,
        justifyContent: 'space-between',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
    },
    navTextActive: {
        fontSize: 10,
        fontWeight: '800',
        color: C.primary,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    navText: {
        fontSize: 10,
        fontWeight: '600',
        color: C.outline,
        marginTop: 4,
        letterSpacing: 0.5,
    },
});
