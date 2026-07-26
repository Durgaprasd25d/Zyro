import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DESIGN_COLORS as C } from '../constants/designSystem';

const { width } = Dimensions.get('window');

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef(null);

    const hideNotification = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -120,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setNotification(null);
        });
    }, [translateY, opacity]);

    const showNotification = useCallback(({ title, message, type = 'info', duration = 3500, buttons = null }) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setNotification({ title, message, type, buttons });

        translateY.setValue(-120);
        opacity.setValue(0);

        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                tension: 65,
                friction: 9,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        if (duration > 0 && !buttons) {
            timeoutRef.current = setTimeout(() => {
                hideNotification();
            }, duration);
        }
    }, [translateY, opacity, hideNotification]);

    const getParams = (type) => {
        switch (type) {
            case 'success':
                return {
                    icon: 'checkmark-circle-sharp',
                    color: '#4CAF50',
                    bg: '#142918',
                    border: '#204A26',
                };
            case 'warning':
                return {
                    icon: 'warning-sharp',
                    color: '#FFB74D',
                    bg: '#2A2114',
                    border: '#4D3B1E',
                };
            case 'error':
                return {
                    icon: 'alert-circle-sharp',
                    color: '#FF5252',
                    bg: '#2A1414',
                    border: '#4D1E1E',
                };
            case 'info':
            default:
                return {
                    icon: 'information-circle-sharp',
                    color: C.primary || '#E6BEAB',
                    bg: '#1E1A17',
                    border: '#3A2E28',
                };
        }
    };

    const params = notification ? getParams(notification.type) : getParams('info');

    return (
        <NotificationContext.Provider value={{ showNotification, hideNotification }}>
            {children}

            {notification && (
                <View style={styles.bannerWrapper} pointerEvents="box-none">
                    <SafeAreaView edges={['top']} pointerEvents="box-none">
                        <Animated.View
                            style={[
                                styles.banner,
                                {
                                    backgroundColor: params.bg,
                                    borderColor: params.border,
                                    opacity,
                                    transform: [{ translateY }],
                                },
                            ]}
                        >
                            <View style={styles.bannerHeader}>
                                <View style={[styles.iconBox, { backgroundColor: params.color + '22' }]}>
                                    <Ionicons name={params.icon} size={22} color={params.color} />
                                </View>

                                <View style={styles.textContainer}>
                                    {!!notification.title && (
                                        <Text style={styles.titleText}>{notification.title}</Text>
                                    )}
                                    {!!notification.message && (
                                        <Text style={styles.messageText} numberOfLines={3}>
                                            {notification.message}
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={hideNotification}
                                    style={styles.closeBtn}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="close" size={18} color="#888888" />
                                </TouchableOpacity>
                            </View>

                            {notification.buttons && notification.buttons.length > 0 && (
                                <View style={styles.buttonRow}>
                                    {notification.buttons.map((btn, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.actionBtn,
                                                btn.style === 'destructive' && styles.actionBtnDestructive,
                                                btn.style === 'primary' && { backgroundColor: params.color },
                                            ]}
                                            onPress={() => {
                                                hideNotification();
                                                if (btn.onPress) btn.onPress();
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.actionBtnText,
                                                    btn.style === 'primary' && { color: '#000000' },
                                                    btn.style === 'destructive' && { color: '#FF5252' },
                                                ]}
                                            >
                                                {btn.text}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </Animated.View>
                    </SafeAreaView>
                </View>
            )}
        </NotificationContext.Provider>
    );
};

export const useInAppNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useInAppNotification must be used within a NotificationProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    bannerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 8,
    },
    banner: {
        width: width - 32,
        borderRadius: 20,
        borderWidth: 1.5,
        padding: 14,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 16,
        elevation: 12,
    },
    bannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    messageText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#CCCCCC',
        marginTop: 2,
        lineHeight: 16,
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionBtnDestructive: {
        backgroundColor: '#3D1C1C',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
