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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import rideService from '../../services/rideService';

const { width } = Dimensions.get('window');

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
    red: '#e11d48',
    orange: '#f59e0b',
};

const STATUS_CONFIG = {
    'ALL': { label: 'All', color: COLORS.black, icon: 'list-outline' },
    'REQUESTED': { label: 'Requested', color: COLORS.blue, icon: 'time-outline' },
    'ACCEPTED': { label: 'Assigned', color: COLORS.blue, icon: 'person-outline' },
    'ARRIVED': { label: 'Arrived', color: COLORS.orange, icon: 'location-outline' },
    'IN_PROGRESS': { label: 'In Progress', color: COLORS.blue, icon: 'construct-outline' },
    'COMPLETED': { label: 'Completed', color: COLORS.accent, icon: 'checkmark-circle-outline' },
    'CANCELLED': { label: 'Cancelled', color: COLORS.red, icon: 'close-circle-outline' },
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
                        <View style={[styles.iconBox, { backgroundColor: `${status.color}10` }]}>
                            <Ionicons name="construct" size={20} color={status.color} />
                        </View>
                        <View>
                            <Text style={styles.serviceType}>
                                {item.serviceType || 'Cooling Expert'}
                            </Text>
                            <Text style={styles.cardDate}>
                                {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.priceBox}>
                        <Text style={styles.cardPrice}>₹{Math.round(item.price || 0)}</Text>
                        <View style={[styles.miniStatus, { backgroundColor: `${status.color}15` }]}>
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
                        <Text style={styles.idText}>{item.rideId?.substring(0, 8).toUpperCase()}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color={COLORS.black} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Activity</Text>
                    <TouchableOpacity
                        style={styles.refreshBadge}
                        onPress={handleRefresh}
                    >
                        <Ionicons name="refresh" size={16} color={COLORS.black} />
                        <Text style={styles.refreshText}>Updated Just Now</Text>
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
            {filteredHistory.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name="receipt-outline" size={48} color={COLORS.textTertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>No Activity Yet</Text>
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
                    ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    header: {
        backgroundColor: COLORS.white,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.black,
        letterSpacing: -0.5,
    },
    refreshBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: COLORS.background,
    },
    refreshText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    filterWrapper: {
        backgroundColor: COLORS.white,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: COLORS.background,
        marginRight: 8,
    },
    filterChipSelected: {
        backgroundColor: COLORS.black,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    filterTextSelected: {
        color: COLORS.white,
    },
    listContent: {
        padding: 20,
    },
    listSeparator: {
        height: 12,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
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
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceType: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    priceBox: {
        alignItems: 'flex-end',
        gap: 6,
    },
    cardPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
    },
    miniStatus: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    miniStatusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addressBox: {
        marginBottom: 12,
        paddingLeft: 4,
    },
    addressLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    addressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.textTertiary,
    },
    addressText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    bookingIdBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    idLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
    },
    idText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.black,
        fontFamily: 'monospace',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
