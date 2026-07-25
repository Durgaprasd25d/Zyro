import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Platform,
    Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

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

export default function PaymentStatusScreen({ route, navigation }) {
    const { status, rideId, total, paymentMethod } = route?.params || {};
    const [step, setStep] = useState('processing'); // processing, success, confirmed

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start processing animation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        const timer1 = setTimeout(() => {
            setStep('success');
            animateSuccess();
        }, 1800);

        const timer2 = setTimeout(() => {
            setStep('confirmed');
            animateConfirmed();
        }, 3800);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    const animateSuccess = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true
            })
        ]).start();
    };

    const animateConfirmed = () => {
        scaleAnim.setValue(0);
        opacityAnim.setValue(0);
        slideAnim.setValue(30);

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true
            })
        ]).start();
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const renderProcessing = () => (
        <View style={styles.center}>
            <Animated.View style={[
                styles.iconBox,
                {
                    transform: [{ rotate: spin }]
                }
            ]}>
                <Ionicons name="shield-checkmark-outline" size={56} color={COLORS.black} />
            </Animated.View>
            <Text style={styles.statusTitle}>Securing Your Booking</Text>
            <Text style={styles.statusSubtitle}>
                Verifying payment details and connecting with verified professionals...
            </Text>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.center}>
            <Animated.View style={[
                styles.successCircle,
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim
                }
            ]}>
                <Ionicons name="checkmark" size={60} color={COLORS.white} />
            </Animated.View>
            <Animated.View style={{
                opacity: opacityAnim,
                transform: [{ translateY: slideAnim }]
            }}>
                <Text style={styles.statusTitle}>Payment Verified</Text>
                <Text style={styles.statusSubtitle}>
                    {paymentMethod === 'cod'
                        ? 'Booking confirmed. You can pay after the service.'
                        : `₹${Math.round(total)} has been securely processed.`}
                </Text>
            </Animated.View>
        </View>
    );

    const renderConfirmed = () => (
        <View style={styles.centerContent}>
            <Animated.View style={[
                styles.confirmedCircle,
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim
                }
            ]}>
                <Ionicons name="checkmark-done" size={60} color={COLORS.white} />
            </Animated.View>

            <Animated.View style={{
                width: '100%',
                alignItems: 'center',
                opacity: opacityAnim,
                transform: [{ translateY: slideAnim }]
            }}>
                <Text style={styles.statusTitle}>All Set!</Text>
                <Text style={styles.statusSubtitle}>
                    Your technician is being assigned. Track them live in just a moment.
                </Text>

                <View style={styles.idCard}>
                    <View style={styles.idRow}>
                        <View style={styles.idInfo}>
                            <Text style={styles.idLabel}>BOOKING REFERENCE</Text>
                            <Text style={styles.idValue} numberOfLines={1}>
                                {rideId?.toUpperCase() || 'ZYRO-AC-992'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.copyButton}>
                            <Ionicons name="copy-outline" size={18} color={COLORS.black} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.progressCard}>
                    <View style={styles.progressItem}>
                        <View style={styles.progressIconActive}>
                            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                        </View>
                        <View style={styles.progressContent}>
                            <Text style={styles.progressTitle}>Payment Secured</Text>
                            <Text style={styles.progressSubtitle}>Completed • Just now</Text>
                        </View>
                    </View>

                    <View style={styles.progressDivider} />

                    <View style={styles.progressItem}>
                        <View style={styles.progressIconPending}>
                            <View style={styles.pendingDot} />
                        </View>
                        <View style={styles.progressContent}>
                            <Text style={styles.progressTitle}>Finding Technician</Text>
                            <Text style={styles.progressSubtitle}>Searching nearby experts...</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.8}
                onPress={() => navigation.replace('Customer', { rideId, serviceType: 'service' })}
            >
                <Ionicons name="navigate" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>View Live Tracking</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <SafeAreaView style={{ flex: 1 }}>
                {step === 'processing' && renderProcessing()}
                {step === 'success' && renderSuccess()}
                {step === 'confirmed' && renderConfirmed()}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: height * 0.15,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    iconBox: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    confirmedCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    statusTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 12,
        textAlign: 'center',
    },
    statusSubtitle: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 300,
    },
    idCard: {
        width: '100%',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 20,
        marginTop: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    idRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    idInfo: {
        flex: 1,
        marginRight: 12,
    },
    idLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    idValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    copyButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    progressCard: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    progressItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressIconActive: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    progressIconPending: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    pendingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.textTertiary,
    },
    progressContent: {
        flex: 1,
    },
    progressTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 2,
    },
    progressSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    progressDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    actionButton: {
        width: '100%',
        backgroundColor: COLORS.black,
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
