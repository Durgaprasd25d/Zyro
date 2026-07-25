import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Platform,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import config from '../../constants/config';
import authService from '../../services/authService';
import rideService from '../../services/rideService';
import customerSocketService from '../../services/customerSocketService';
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from '../../constants/designSystem';

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

const CATEGORY_IMAGES = {
    'repair': require('../../../assets/gas_leak_fix.png'),
    'service': require('../../../assets/deep_cleaning.png'),
    'install': require('../../../assets/unit_installation.png'),
    'emergency': require('../../../assets/fast_repair.png'),
};

const getCategoryImage = (slug) => {
    if (!slug) return CATEGORY_IMAGES['service'];
    const s = slug.toLowerCase().trim();
    if (s.includes('repair')) return CATEGORY_IMAGES['repair'];
    if (s.includes('service')) return CATEGORY_IMAGES['service'];
    if (s.includes('install')) return CATEGORY_IMAGES['install'];
    if (s.includes('emergency')) return CATEGORY_IMAGES['emergency'];
    return CATEGORY_IMAGES['service'];
};

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [showCategories, setShowCategories] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeRide, setActiveRide] = useState(null);

    // Current address location summary
    const [locationAddress, setLocationAddress] = useState('New Delhi, India');

    useEffect(() => {
        initHome();
        const unsubscribe = navigation.addListener('focus', () => {
            checkActiveRide();
            loadUser();
        });
        return () => {
            unsubscribe();
            customerSocketService.disconnect();
        };
    }, [navigation]);

    const initHome = async () => {
        const userData = await authService.getUser();
        setUser(userData);
        fetchCategories();
        fetchServices();
        checkActiveRide();

        const userId = userData?.id || userData?._id;
        if (userId) {
            customerSocketService.connect(null, null, null, userId);
            customerSocketService.registerHandlers(
                (data) => { setActiveRide(null); },
                (data) => { setActiveRide(null); }
            );
        }
    };

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
    };

    const checkActiveRide = async () => {
        const res = await rideService.getCurrentRide();
        if (res.success && res.data) {
            setActiveRide(res.data);
            if (res.data.pickup?.address) {
                // Shorten address for layout header
                const parts = res.data.pickup.address.split(',');
                const shortAddr = parts.slice(0, 2).join(', ');
                setLocationAddress(shortAddr || 'New Delhi, India');
            }
        } else {
            setActiveRide(null);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/services/categories`);
            const result = await response.json();
            if (result.success) {
                setCategories(result.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/services/all`);
            const result = await response.json();
            if (result.success) {
                setServices(result.data);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Quick Service direct category redirection
    const handleCategorySelect = (slug, catName) => {
        navigation.navigate('ServiceList', {
            type: slug,
            categoryName: catName
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.background} />

            {/* Custom Top Navigation Bar */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.leftHeader}>
                        <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
                            <Ionicons name="menu-outline" size={24} color={C.onSurface} />
                        </TouchableOpacity>
                        <Text style={styles.brandTitle}>ZYRO</Text>
                    </View>

                    <View style={styles.rightHeader}>
                        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
                            <Ionicons name="notifications-outline" size={22} color={C.onSurface} />
                            <View style={styles.notificationBadge} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.profileBtn}
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.profileCircle}>
                                <Text style={styles.profileInitial}>{user?.name?.[0] || 'U'}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Location Picker Row */}
                <TouchableOpacity 
                    style={styles.locationContainer} 
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('MapPicker')}
                >
                    <Ionicons name="location" size={14} color={C.primary} />
                    <Text style={styles.locationText}>{locationAddress}</Text>
                </TouchableOpacity>

                {/* Greeting Section */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greetingText}>
                        {getGreeting()},{' '}
                        <Text style={styles.greetingName}>{user?.name?.split(' ')[0] || 'Durga'} 👋</Text>
                    </Text>
                </View>

                {/* Search Bar mockup with mic */}
                <TouchableOpacity style={styles.searchBar} activeOpacity={0.9}>
                    <Ionicons name="search" size={18} color={C.outline} />
                    <Text style={styles.searchText} numberOfLines={1}>
                        Search AC Repair, Gas Refill, Installation...
                    </Text>
                    <Ionicons name="mic-outline" size={18} color={C.outline} style={styles.micIcon} />
                </TouchableOpacity>

                {/* Quick Services section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Services</Text>
                    <TouchableOpacity 
                        style={styles.viewAllBtn} 
                        activeOpacity={0.7}
                        onPress={() => setShowCategories(!showCategories)}
                    >
                        <Text style={styles.viewAllText}>
                            {showCategories ? 'Hide Categories' : 'All Categories'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Database Categories Grid (Toggled on "All Categories" click) */}
                {showCategories && (
                    <View style={styles.categoriesGrid}>
                        {loading ? (
                            <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />
                        ) : (
                            categories.map((cat, idx) => (
                                <TouchableOpacity
                                    key={cat._id || idx}
                                    style={styles.categoryTile}
                                    activeOpacity={0.8}
                                    onPress={() => handleCategorySelect(cat.slug, cat.name)}
                                >
                                    <View style={styles.categoryIconCircle}>
                                        <Ionicons name={cat.icon || 'construct-outline'} size={20} color={C.primary} />
                                    </View>
                                    <Text style={styles.categoryTileText} numberOfLines={1}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                )}

                {/* Horizontal Swiping Direct Services List (Without filter, fetched from /api/services/all) */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScroll}
                >
                    {services.length === 0 ? (
                        <ActivityIndicator color={C.primary} style={{ marginHorizontal: 24, marginVertical: 20 }} />
                    ) : (
                        services.map((item, index) => (
                            <TouchableOpacity 
                                key={item._id || index}
                                style={styles.serviceCard} 
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('ServiceDetail', { service: item })}
                            >
                                <Image 
                                    source={getServiceImage(item.name)} 
                                    style={styles.cardImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.cardBody}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.cardPrice}>Starts at ₹{item.price || '499'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>

                {/* Active Bookings section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Bookings</Text>
                </View>

                {activeRide && activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED' ? (
                    <TouchableOpacity 
                        style={styles.activeBookingCard} 
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('ServiceProgress', {
                            rideId: activeRide.rideId || activeRide._id
                        })}
                    >
                        <View style={styles.activeCardHeader}>
                            <View style={styles.activeIconCircle}>
                                <Ionicons name="snow-outline" size={18} color={C.primary} />
                            </View>
                            <View style={styles.activeCardTitleCol}>
                                <Text style={styles.activeCardTitle} numberOfLines={1}>
                                    {activeRide.serviceType?.toUpperCase() || 'AC CLEANING'} SERVICE
                                </Text>
                                <Text style={styles.activeCardTime}>
                                    Scheduled for Today, 2:00 PM
                                </Text>
                            </View>
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>
                                    {activeRide.status === 'REQUESTED' ? 'FINDING TECH' : activeRide.status.replace('_', ' ')}
                                </Text>
                            </View>
                        </View>

                        {/* Custom visual progress bar */}
                        <View style={styles.progressTrack}>
                            <View style={[
                                styles.progressBarFill, 
                                { 
                                    width: activeRide.status === 'REQUESTED' ? '25%' : 
                                           activeRide.status === 'ACCEPTED' ? '50%' : 
                                           activeRide.status === 'ARRIVED' ? '75%' : '90%' 
                                }
                            ]} />
                        </View>

                        <View style={styles.activeCardFooter}>
                            <Text style={styles.footerLeftText}>
                                {activeRide.status === 'REQUESTED' ? 'Searching nearby experts' : 'Technician Assigned'}
                            </Text>
                            <Text style={styles.footerRightText}>Arriving Soon</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    // Beautiful Default active booking card (exactly matching the mock illustration!)
                    <View style={styles.activeBookingCard}>
                        <View style={styles.activeCardHeader}>
                            <View style={styles.activeIconCircle}>
                                <Ionicons name="snow" size={18} color={C.primary} />
                            </View>
                            <View style={styles.activeCardTitleCol}>
                                <Text style={styles.activeCardTitle}>Deep Cleaning Service</Text>
                                <Text style={styles.activeCardTime}>Scheduled for Today, 2:00 PM</Text>
                            </View>
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>IN PROGRESS</Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressBarFill, { width: '55%' }]} />
                        </View>

                        <View style={styles.activeCardFooter}>
                            <Text style={styles.footerLeftText}>Technician Assigned</Text>
                            <Text style={styles.footerRightText}>Arriving Soon</Text>
                        </View>
                    </View>
                )}

                {/* Recommended For You Section (Now displaying Categories list) */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                </View>

                {/* Categories mapped as gorgeous recommendation cards */}
                {loading ? (
                    <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />
                ) : (
                    categories.map((cat, index) => (
                        <TouchableOpacity 
                            key={cat._id || index}
                            style={styles.bannerCard} 
                            activeOpacity={0.9}
                            onPress={() => handleCategorySelect(cat.slug, cat.name)}
                        >
                            <Image 
                                source={getCategoryImage(cat.slug)} 
                                style={styles.bannerImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(19, 19, 19, 0.95)']}
                                style={styles.bannerGradient}
                            >
                                <Text style={styles.bannerTitle}>{cat.name}</Text>
                                <Text style={styles.bannerSubtitle}>
                                    {cat.slug.includes('service') && 'Save 30% annually with ZYRO AMC'}
                                    {cat.slug.includes('cleaning') && '99.9% Bacteria-free premium sanitation'}
                                    {cat.slug.includes('install') && 'Verified expert installation & setup'}
                                    {!cat.slug.includes('service') && !cat.slug.includes('cleaning') && !cat.slug.includes('install') && 'Exclusive high-grade AC solutions'}
                                </Text>
                                
                                <View style={styles.bookButton}>
                                    <Ionicons name="add" size={16} color={C.onPrimary} />
                                    <Text style={styles.bookBtnText}>BOOK</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Custom Tab Bar exactly replicating Climate active tab design */}
            <SafeAreaView edges={['bottom']} style={styles.bottomNav}>
                <View style={styles.navContent}>
                    <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
                        <Ionicons name="snow-outline" size={22} color={C.primary} />
                        <Text style={styles.navTextActive}>Climate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('History')}
                    >
                        <Ionicons name="construct-outline" size={22} color={C.outline} />
                        <Text style={styles.navText}>Service</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('History')}
                    >
                        <Ionicons name="time-outline" size={22} color={C.outline} />
                        <Text style={styles.navText}>History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="person-outline" size={22} color={C.outline} />
                        <Text style={styles.navText}>Profile</Text>
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
    header: {
        backgroundColor: C.background,
        borderBottomWidth: 1,
        borderColor: C.surfaceContainerLowest,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    leftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuBtn: {
        padding: 4,
    },
    brandTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: C.primary,
        letterSpacing: 2,
    },
    rightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    notificationBtn: {
        padding: 4,
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 3,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF8A80',
    },
    profileBtn: {
        padding: 2,
    },
    profileCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: C.surfaceContainerLow,
        borderWidth: 1.5,
        borderColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        color: C.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    locationText: {
        fontSize: 13,
        color: C.outline,
        fontWeight: '600',
    },
    greetingSection: {
        marginBottom: 20,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: '400',
        color: C.outline,
    },
    greetingName: {
        color: C.onSurface,
        fontWeight: '850',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        borderRadius: 14,
        height: 48,
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 28,
    },
    searchText: {
        flex: 1,
        fontSize: 14,
        color: C.outline + 'cc',
        fontWeight: '500',
    },
    micIcon: {
        marginLeft: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '850',
        color: C.onSurface,
        letterSpacing: 0.1,
    },
    viewAllBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: C.primary,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
        marginTop: -6,
        paddingHorizontal: 2,
    },
    categoryTile: {
        width: (width - 60) / 3,
        backgroundColor: C.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    categoryIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: C.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryTileText: {
        fontSize: 11,
        fontWeight: '700',
        color: C.onSurface,
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    horizontalScroll: {
        paddingRight: 20,
        marginBottom: 28,
        gap: 16,
    },
    serviceCard: {
        width: width * 0.58,
        backgroundColor: C.surfaceContainerLowest,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 124,
        backgroundColor: C.surfaceContainerLow,
    },
    cardBody: {
        padding: 14,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: C.onSurface,
        marginBottom: 4,
    },
    cardPrice: {
        fontSize: 12,
        fontWeight: '700',
        color: C.primary,
    },
    activeBookingCard: {
        backgroundColor: C.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        borderRadius: 20,
        padding: 18,
        marginBottom: 28,
    },
    activeCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activeIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: C.outlineVariant,
    },
    activeCardTitleCol: {
        flex: 1,
    },
    activeCardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: C.onSurface,
        marginBottom: 2,
    },
    activeCardTime: {
        fontSize: 12,
        color: C.outline,
        fontWeight: '500',
    },
    activeBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: C.surfaceContainerLow,
        borderWidth: 1,
        borderColor: C.outlineVariant,
    },
    activeBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: C.primary,
        letterSpacing: 0.5,
    },
    progressTrack: {
        height: 4,
        backgroundColor: C.surfaceContainerLow,
        borderRadius: 2,
        marginTop: 20,
        marginBottom: 14,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: C.primary,
        borderRadius: 2,
    },
    activeCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeftText: {
        fontSize: 12,
        fontWeight: '600',
        color: C.outline,
    },
    footerRightText: {
        fontSize: 12,
        fontWeight: '700',
        color: C.primary,
    },
    bannerCard: {
        height: 174,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.outlineVariant,
        marginBottom: 20,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
        justifyContent: 'flex-end',
        padding: 16,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: '850',
        color: '#FFFFFF',
        marginBottom: 3,
    },
    bannerSubtitle: {
        fontSize: 13,
        color: C.primary,
        fontWeight: '600',
    },
    bookButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: C.primary,
        height: 38,
        paddingHorizontal: 16,
        borderRadius: 19,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    bookBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: C.onPrimary,
        letterSpacing: 1,
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
