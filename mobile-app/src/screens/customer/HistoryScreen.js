import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import rideService from '../../services/rideService';
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from '../../constants/designSystem';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

const STATUS_CONFIG = {
    'ALL': { label: 'All', color: C.onSurface, icon: 'list-outline' },
    'REQUESTED': { label: 'Requested', color: C.primary, icon: 'time-outline' },
    'ACCEPTED': { label: 'Assigned', color: C.primary, icon: 'person-outline' },
    'ARRIVED': { label: 'Arrived', color: '#FFD54F', icon: 'location-outline' },
    'IN_PROGRESS': { label: 'In Progress', color: '#64B5F6', icon: 'construct-outline' },
    'COMPLETED': { label: 'Completed', color: '#81C784', icon: 'checkmark-circle-outline' },
    'CANCELLED': { label: 'Cancelled', color: '#E57373', icon: 'close-circle-outline' },
};

export default function HistoryScreen({ navigation }) {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('ALL');

    useEffect(() => {
        fetchHistory();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchHistory();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        filterHistory();
    }, [selectedFilter, history]);

    const fetchHistory = async () => {
        setLoading(true);
        const result = await rideService.getJobHistory(null, 'customer');
        if (result.success) {
            setHistory(result.data || []);
        }
        setLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        const result = await rideService.getJobHistory(null, 'customer');
        if (result.success) {
            setHistory(result.data || []);
        }
        setRefreshing(false);
    };

    const filterHistory = () => {
        if (selectedFilter === 'ALL') {
            setFilteredHistory(history);
        } else {
            setFilteredHistory(history.filter(item => item.status === selectedFilter));
        }
    };

    const renderFilterChip = (statusKey) => {
        const status = STATUS_CONFIG[statusKey];
        const isSelected = selectedFilter === statusKey;

        return (
            <TouchableOpacity
                key={statusKey}
                style={[
                    styles.filterChip,
                    isSelected && styles.filterChipSelected
                ]}
                onPress={() => setSelectedFilter(statusKey)}
                activeOpacity={0.8}
            >
                <Text style={[
                    styles.filterText,
                    isSelected && styles.filterTextSelected
                ]}>
                    {status.label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }) => {
        const status = STATUS_CONFIG[item.status] || STATUS_CONFIG['REQUESTED'];
        const date = new Date(item.createdAt);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => {
                    if (item.status === 'COMPLETED') {
                        navigation.navigate('Receipt', { rideId: item.rideId });
                    } else if (item.status !== 'CANCELLED') {
                        navigation.navigate('ServiceStatus', { rideId: item.rideId });
                    }
                }}
            >
                <View style={styles.cardTop}>
                    <View style={styles.serviceBox}>
                        <View style={[styles.iconBox, { backgroundColor: `${status.color}20` }]}>
                            <Ionicons name="construct" size={20} color={status.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.serviceType} numberOfLines={1}>
                                {(item.serviceType || 'AC Service').toUpperCase()}
                            </Text>
                            <Text style={styles.cardDate}>
                                {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.priceBox}>
                        <Text style={styles.cardPrice}>₹{Math.round(item.price || item.fare || 1)}</Text>
                        <View style={[styles.miniStatus, { backgroundColor: `${status.color}22` }]}>
                            <Text style={[styles.miniStatusText, { color: status.color }]}>{status.label}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.addressBox}>
                    <View style={styles.addressLine}>
                        <View style={styles.addressDot} />
                        <Text style={styles.addressText} numberOfLines={1}>
                            {item.pickup?.address || 'Service Location'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.bookingIdBox}>
                        <Text style={styles.idLabel}>ID:</Text>
                        <Text style={styles.idText}>{(item.rideId || item._id || '').substring(0, 8).toUpperCase()}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={C.onSurfaceVariant} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color={C.onSurface} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Activity & History</Text>

                    <TouchableOpacity
                        style={styles.refreshBadge}
                        onPress={handleRefresh}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh" size={15} color={C.primary} />
                    </TouchableOpacity>
                </View>

                {/* Filter Chips Layer */}
                <View style={styles.filterWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContent}
                    >
                        {Object.keys(STATUS_CONFIG).map(renderFilterChip)}
                    </ScrollView>
                </View>
            </SafeAreaView>

            {/* List Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={C.primary} />
                </View>
            ) : filteredHistory.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name="receipt-outline" size={44} color={C.onSurfaceVariant} />
                    </View>
                    <Text style={styles.emptyTitle}>No Activity Found</Text>
                    <Text style={styles.emptySubtitle}>
                        {selectedFilter === 'ALL'
                            ? 'Bookings and services you request will appear here.'
                            : `You don't have any ${STATUS_CONFIG[selectedFilter].label.toLowerCase()} services.`
                        }
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredHistory}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.rideId || item._id}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    showsVerticalScrollIndicator={false}
                />
            )}

            <BottomNavBar navigation={navigation} activeTab="history" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    headerTitle: {
        fontSize: 18,
        fontFamily: TY.titleMd.fontFamily,
        fontWeight: '600',
        color: C.onSurface,
    },
    refreshBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#161616',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    filterWrapper: {
        paddingVertical: 10,
    },
    filterContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#141414',
        borderWidth: 1,
        borderColor: '#222222',
    },
    filterChipSelected: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.onSurfaceVariant,
    },
    filterTextSelected: {
        color: C.onPrimary,
        fontWeight: '800',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
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
        lineHeight: 18,
    },
    listContent: {
        padding: 16,
        paddingBottom: 110,
    },
    card: {
        backgroundColor: '#141414',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#222222',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    serviceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: 10,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceType: {
        fontSize: 15,
        fontWeight: '700',
        color: C.onSurface,
    },
    cardDate: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        marginTop: 2,
    },
    priceBox: {
        alignItems: 'flex-end',
    },
    cardPrice: {
        fontSize: 17,
        fontWeight: '800',
        color: C.primary,
    },
    miniStatus: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
        marginTop: 4,
    },
    miniStatusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    addressBox: {
        backgroundColor: '#1B1B1B',
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
    },
    addressLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: C.primary,
    },
    addressText: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#1C1C1C',
        paddingTop: 10,
    },
    bookingIdBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    idLabel: {
        fontSize: 11,
        color: C.onSurfaceVariant,
    },
    idText: {
        fontSize: 11,
        fontWeight: '700',
        color: C.onSurface,
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
