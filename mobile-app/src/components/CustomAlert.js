import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from '../constants/designSystem';

const { width } = Dimensions.get('window');

const CustomAlert = ({
    visible,
    type = 'error', // 'error' | 'success' | 'warning' | 'info'
    title,
    message,
    onClose,
    actionText = 'DISMISS',
}) => {
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.85);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    // Choose icon and color scheme based on alert type
    const getAlertParams = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'checkmark-circle-outline',
                    color: C.primary,
                    bgIcon: C.primary + '18',
                };
            case 'warning':
                return {
                    icon: 'warning-outline',
                    color: '#FFB74D',
                    bgIcon: 'rgba(255, 183, 77, 0.12)',
                };
            case 'info':
                return {
                    icon: 'information-circle-outline',
                    color: '#64B5F6',
                    bgIcon: 'rgba(100, 181, 246, 0.12)',
                };
            case 'error':
            default:
                return {
                    icon: 'alert-circle-outline',
                    color: C.error || '#FF8A80',
                    bgIcon: 'rgba(255, 138, 128, 0.12)',
                };
        }
    };

    const params = getAlertParams();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.alertCard,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Top colored accent indicator */}
                    <View style={[styles.accentHeader, { backgroundColor: params.color }]} />

                    {/* Icon container */}
                    <View style={[styles.iconWrapper, { backgroundColor: params.bgIcon }]}>
                        <Ionicons name={params.icon} size={36} color={params.color} />
                    </View>

                    {/* Content */}
                    <Text style={styles.alertTitle}>{title}</Text>
                    <Text style={styles.alertMessage}>{message}</Text>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={styles.actionBtnContainer}
                        onPress={onClose}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={[C.primary, C.primaryContainer]}
                            style={styles.actionBtn}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.actionText}>{actionText}</Text>
                            <Ionicons name="chevron-forward" size={16} color={C.onPrimary} style={styles.btnIcon} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(9, 9, 9, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    alertCard: {
        width: width * 0.84,
        backgroundColor: C.surfaceContainerLow,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: C.outlineVariant,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 18,
        elevation: 12,
        overflow: 'hidden',
    },
    accentHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
    },
    iconWrapper: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    alertTitle: {
        ...TY.titleMd,
        color: C.onSurface,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    alertMessage: {
        ...TY.bodyMd,
        color: C.outline,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 28,
        paddingHorizontal: 12,
    },
    actionBtnContainer: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionBtn: {
        height: 48,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '800',
        color: C.onPrimary,
        letterSpacing: 1.5,
    },
    btnIcon: {
        marginTop: -1,
    },
});

export default CustomAlert;
