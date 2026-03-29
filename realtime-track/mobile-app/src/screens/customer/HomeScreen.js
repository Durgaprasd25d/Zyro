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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SHADOWS } from '../../constants/theme';
import config from '../../constants/config';
import authService from '../../services/authService';
import rideService from '../../services/rideService';
import customerSocketService from '../../services/customerSocketService';

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

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeRide, setActiveRide] = useState(null);

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Clean Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.brandSection}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.brandName}>ZYROAC</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={styles.profileCircle}>
                            <Text style={styles.profileInitial}>{user?.name?.[0] || 'U'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Greeting Section */}
                <View style={styles.greetingSection}>
                    <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Guest'}</Text>
                    <Text style={styles.subGreeting}>Where would you like service today?</Text>
                </View>

                {/* Active Service Tracking Card */}
                {activeRide && activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED' && (
                    <View style={styles.activeRideCard}>
                        <View style={styles.activeRideHeader}>
                            <View style={styles.activeRideIndicator} />
                            <Text style={styles.activeRideLabel}>Active Service</Text>
                        </View>
                        
                        <View style={styles.activeRideMain}>
                            <View style={styles.activeRideInfo}>
                                <Text style={styles.activeRideStatus}>
                                    {activeRide.status === 'REQUESTED' && 'Finding your professional...'}
                                    {activeRide.status === 'ACCEPTED' && 'Technician is assigned'}
                                    {activeRide.status === 'ARRIVED' && 'Technician has arrived'}
                                    {activeRide.status === 'IN_PROGRESS' && 'Service in progress'}
                                </Text>
                                <Text style={styles.activeRideType}>{activeRide.serviceType?.toUpperCase()} SERVICE</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.goButton}
                                onPress={() => navigation.navigate('ServiceProgress', {
                                    rideId: activeRide.rideId || activeRide._id
                                })}
                            >
                                <Text style={styles.goButtonText}>GO</Text>
                                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Services Section */}
                <View style={styles.servicesHeader}>
                    <Text style={styles.sectionTitle}>Services</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.black} />
                    </View>
                ) : (
                    <View style={styles.servicesGrid}>
                        {categories.map((category, index) => (
                            <TouchableOpacity
                                key={category._id || index}
                                style={styles.serviceCard}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('ServiceList', {
                                    type: category.slug,
                                    categoryName: category.name
                                })}
                            >
                                <View style={styles.serviceCardContent}>
                                    <View style={styles.serviceIconBox}>
                                        <Ionicons name={category.icon} size={32} color={COLORS.black} />
                                    </View>
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceName}>{category.name}</Text>
                                        {category.serviceCount > 0 && (
                                            <Text style={styles.serviceCount}>
                                                {category.serviceCount} {category.serviceCount === 1 ? 'option' : 'options'}
                                            </Text>
                                        )}
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <SafeAreaView edges={['bottom']} style={styles.bottomNav}>
                <View style={styles.navContent}>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="home" size={24} color={COLORS.black} />
                        <Text style={styles.navTextActive}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('History')}
                    >
                        <Ionicons name="time-outline" size={24} color={COLORS.textTertiary} />
                        <Text style={styles.navText}>Activity</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="person-outline" size={24} color={COLORS.textTertiary} />
                        <Text style={styles.navText}>Account</Text>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    brandSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: COLORS.white,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    brandName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.black,
        letterSpacing: -0.5,
    },
    profileButton: {
        padding: 2,
    },
    profileCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    greetingSection: {
        paddingTop: 24,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 4,
        letterSpacing: -1,
    },
    subGreeting: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    activeRideCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.light,
    },
    activeRideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    activeRideIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accent,
    },
    activeRideLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    activeRideMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    activeRideInfo: {
        flex: 1,
        marginRight: 16,
    },
    activeRideStatus: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 4,
    },
    activeRideType: {
        fontSize: 12,
        color: COLORS.blue,
        fontWeight: '600',
    },
    goButton: {
        backgroundColor: COLORS.black,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    goButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
    activeRideBanner: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activeRideContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    activeRideIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activeRideText: {
        flex: 1,
    },
    activeRideTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 2,
    },
    activeRideSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    servicesHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.black,
        letterSpacing: -0.5,
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    servicesGrid: {
        gap: 12,
    },
    serviceCard: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    serviceCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    serviceIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 2,
    },
    serviceCount: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '400',
    },
    bottomNav: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    navContent: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    navTextActive: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.black,
        marginTop: 4,
    },
    navText: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textTertiary,
        marginTop: 4,
    },
});
