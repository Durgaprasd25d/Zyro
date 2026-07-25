import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DESIGN_COLORS as C } from '../../constants/designSystem';

/**
 * Shared BottomNavBar component for all customer screens.
 * Pass `activeTab` as one of: 'climate' | 'services' | 'history' | 'profile'
 */
export default function BottomNavBar({ navigation, activeTab }) {
    const tabs = [
        {
            key: 'climate',
            label: 'Climate',
            icon: 'snow-outline',
            activeIcon: 'snow',
            onPress: () => navigation.navigate('Home'),
        },
        {
            key: 'services',
            label: 'Services',
            icon: 'construct-outline',
            activeIcon: 'construct',
            onPress: () => navigation.navigate('ServiceList', { categoryName: 'All Services' }),
        },
        {
            key: 'history',
            label: 'History',
            icon: 'time-outline',
            activeIcon: 'time',
            onPress: () => navigation.navigate('History'),
        },
        {
            key: 'profile',
            label: 'Profile',
            icon: 'person-outline',
            activeIcon: 'person',
            onPress: () => navigation.navigate('Profile'),
        },
    ];

    return (
        <SafeAreaView edges={['bottom']} style={styles.bottomNav}>
            <View style={styles.navContent}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={styles.navItem}
                            activeOpacity={0.7}
                            onPress={isActive ? undefined : tab.onPress}
                        >
                            <Ionicons
                                name={isActive ? tab.activeIcon : tab.icon}
                                size={22}
                                color={isActive ? C.primary : C.outline}
                            />
                            <Text style={[styles.navText, isActive && styles.navTextActive]}>
                                {tab.label}
                            </Text>
                            {isActive && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        backgroundColor: '#141414',
        borderTopWidth: 1,
        borderTopColor: '#222222',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navContent: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 0 : 8,
        justifyContent: 'space-around',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        position: 'relative',
    },
    navText: {
        fontSize: 10,
        fontWeight: '600',
        color: C.outline,
        marginTop: 3,
        letterSpacing: 0.4,
    },
    navTextActive: {
        color: C.primary,
        fontWeight: '800',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -2,
        width: 20,
        height: 2,
        borderRadius: 1,
        backgroundColor: C.primary,
    },
});
