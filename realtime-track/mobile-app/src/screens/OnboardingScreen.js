import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    interpolate,
    Extrapolate,
    interpolateColor,
    runOnJS,
    withSequence,
    withRepeat,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { PanGestureHandler } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const InteractiveStep1 = ({ onComplete }) => {
    const scale = useSharedValue(1);
    const rippleScale = useSharedValue(1);
    const rippleOpacity = useSharedValue(0.5);
    const isFound = useSharedValue(0);

    const handlePress = () => {
        scale.value = withSequence(withTiming(0.8, { duration: 100 }), withSpring(1));
        rippleScale.value = withTiming(4, { duration: 1000 });
        rippleOpacity.value = withTiming(0, { duration: 1000 }, () => {
            rippleScale.value = 1;
            rippleOpacity.value = 0.5;
        });

        // Simulate finding a service
        setTimeout(() => {
            isFound.value = withSpring(1);
            setTimeout(onComplete, 1500);
        }, 800);
    };

    const acStyle = useAnimatedStyle(() => ({
        transform: [{ scale: isFound.value }, { translateY: interpolate(isFound.value, [0, 1], [50, 0]) }],
        opacity: isFound.value,
    }));

    const rippleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: rippleScale.value }],
        opacity: rippleOpacity.value,
    }));

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tap to Book</Text>
            <Text style={styles.stepSubtitle}>Find the best AC experts near you in seconds.</Text>

            <View style={styles.interactiveArea}>
                <Animated.View style={[styles.acFoundContainer, acStyle]}>
                    <Image source={require('../../assets/onboarding/ac_service_bw.png')} style={styles.acImage} resizeMode="contain" />
                    <View style={styles.foundBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#000000" />
                        <Text style={styles.foundText}>Expert Assigned!</Text>
                    </View>
                </Animated.View>

                <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.pulseButton}>
                    <Animated.View style={[styles.ripple, rippleStyle]} />
                    <View style={styles.pulseInner}>
                        <Ionicons name="search" size={32} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const InteractiveStep2 = ({ onComplete }) => {
    const progress = useSharedValue(0);
    const [arrived, setArrived] = useState(false);

    const handleSlider = (val) => {
        if (!arrived) {
            progress.value = val;
            if (val > 0.98) {
                runOnJS(setArrived)(true);
            }
        }
    };

    const techStyle = useAnimatedStyle(() => {
        const x = interpolate(progress.value, [0, 1], [-width * 0.3, width * 0.35]);
        const y = interpolate(progress.value, [0, 0.5, 1], [0, -30, 0]);
        const rotate = interpolate(progress.value, [0, 0.2, 0.5, 0.8, 1], [10, 0, -10, 0, 10]);

        return {
            transform: [{ translateX: x }, { translateY: y }, { rotate: `${rotate}deg` }],
        };
    });

    const pathStyle = useAnimatedStyle(() => ({
        width: interpolate(progress.value, [0, 1], [0, width * 0.65]),
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        left: interpolate(progress.value, [0, 1], [0, 240]),
    }));

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Live Tracking</Text>
            <Text style={styles.stepSubtitle}>Slide to see how easy it is to track your Zyro expert.</Text>

            <View style={styles.interactiveArea}>
                <View style={styles.mapContainer}>
                    <View style={styles.linePath} />
                    <Animated.View style={[styles.lineActive, pathStyle]} />

                    <Animated.View style={[styles.techIcon, techStyle]}>
                        <Image source={require('../../assets/onboarding/tech.png')} style={styles.techImage} resizeMode="contain" />
                        {arrived && (
                            <Animated.View entering={FadeInUp.springify()} style={styles.tagBadge}>
                                <Text style={styles.tagText}>ARRIVED</Text>
                            </Animated.View>
                        )}
                    </Animated.View>

                    <View style={styles.homeIcon}>
                        <Ionicons name="home" size={40} color="#000000" />
                        <Text style={styles.homeLabel}>LOCATION</Text>
                    </View>
                </View>

                {!arrived ? (
                    <View style={styles.sliderTray}>
                        <PanGestureHandler onGestureEvent={(e) => handleSlider(Math.max(0, Math.min(1, e.nativeEvent.x / 300)))}>
                            <View style={styles.sliderTrack}>
                                <Animated.View style={[styles.sliderThumb, thumbStyle]}>
                                    <Ionicons name="chevron-forward" size={24} color="white" />
                                </Animated.View>
                                <Text style={styles.sliderText}>Slide to track expert</Text>
                            </View>
                        </PanGestureHandler>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.continueBtn} onPress={onComplete}>
                        <View style={styles.btnGradient}>
                            <Text style={styles.btnText}>NEXT STEP</Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const InteractiveStep3 = ({ onComplete }) => {
    const shineProgress = useSharedValue(-1);

    React.useEffect(() => {
        shineProgress.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
    }, []);

    const shineStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: interpolate(shineProgress.value, [-1, 1], [-width, width]) }],
    }));

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Zyro Billing</Text>
            <Text style={styles.stepSubtitle}>Premium service meets honest prices. No hidden fees.</Text>

            <View style={styles.interactiveArea}>
                <View style={styles.receiptStack}>
                    <View style={[styles.receiptCard, styles.receiptCardBack]} />
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.receiptCard}>
                        <View style={styles.receiptHeader}>
                            <Logo size={40} />
                            <View>
                                <Text style={styles.receiptId}>ZY-9831</Text>
                                <Text style={styles.receiptDate}>30 MAR 2026</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <Animated.View entering={FadeInDown.delay(600)} style={styles.receiptRow}>
                            <Text style={styles.itemLabel}>Premium AC Service</Text>
                            <Text style={styles.itemValue}>₹1,299</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(800)} style={styles.receiptRow}>
                            <Text style={styles.itemLabel}>Platform Fee</Text>
                            <Text style={styles.itemValue}>₹49</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(1000)} style={styles.receiptRow}>
                            <Text style={styles.itemLabel}>GST (18%)</Text>
                            <Text style={styles.itemValue}>₹242.64</Text>
                        </Animated.View>

                        <View style={styles.dashedDivider} />

                        <Animated.View entering={FadeInDown.delay(1200)} style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹1,590.64</Text>
                        </Animated.View>

                        <View style={styles.paymentBadgeContainer}>
                            <View style={styles.paymentBadge}>
                                <Ionicons name="checkmark-shield" size={18} color="white" />
                                <Text style={styles.paymentStatusText}>PAYMENT SECURED</Text>
                                <Animated.View style={[styles.shineOverlay, shineStyle]} />
                            </View>
                        </View>
                    </Animated.View>
                </View>

                <TouchableOpacity style={styles.getStartedBtn} onPress={onComplete}>
                    <View style={styles.btnGradient}>
                        <Text style={styles.btnText}>GET STARTED</Text>
                        <Ionicons name="sparkles" size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const Logo = ({ size = 60 }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="wind" size={size * 0.8} color="#000000" />
    </View>
);

export default function OnboardingScreen({ navigation }) {
    const [step, setStep] = useState(0);

    const nextStep = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            finish();
        }
    };

    const finish = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        navigation.replace('Auth');
    };

    return (
        <View style={styles.container}>
            <View style={styles.mainContent}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <View style={styles.progressBar}>
                            {[0, 1, 2].map(i => (
                                <View key={i} style={[styles.progressSegment, i <= step && styles.activeSegment]} />
                            ))}
                        </View>
                        <TouchableOpacity onPress={finish}>
                            <Text style={styles.skipText}>SKIP</Text>
                        </TouchableOpacity>
                    </View>

                    {step === 0 && <InteractiveStep1 onComplete={nextStep} />}
                    {step === 1 && <InteractiveStep2 onComplete={nextStep} />}
                    {step === 2 && <InteractiveStep3 onComplete={finish} />}
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    mainContent: { flex: 1 },
    header: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressBar: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
        marginRight: 40,
    },
    progressSegment: {
        height: 4,
        flex: 1,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
    },
    activeSegment: {
        backgroundColor: '#000000',
    },
    skipText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 14,
        opacity: 0.5,
    },
    stepContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: SPACING.xl,
        paddingHorizontal: SPACING.xl,
    },
    stepTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: '#000000',
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 24,
    },
    interactiveArea: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    ripple: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#000000',
        borderWidth: 1,
        borderColor: '#000000',
    },
    acFoundContainer: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
    },
    acImage: { width: 280, height: 280 },
    foundBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        ...SHADOWS.small,
        marginTop: -20,
    },
    foundText: { marginLeft: 8, color: '#000000', fontWeight: '900', fontSize: 12 },
    mapContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#F8F9FA',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    linePath: {
        position: 'absolute',
        width: '60%',
        height: 2,
        backgroundColor: '#E0E0E0',
        borderRadius: 1,
    },
    lineActive: {
        position: 'absolute',
        left: '20%',
        height: 2,
        backgroundColor: '#000000',
        borderRadius: 1,
    },
    techIcon: {
        position: 'absolute',
        width: 90,
        height: 90,
        zIndex: 5,
    },
    techImage: { width: '100%', height: '100%' },
    homeIcon: {
        position: 'absolute',
        right: '15%',
        alignItems: 'center',
    },
    homeLabel: { fontSize: 9, fontWeight: '900', color: '#000000', marginTop: 4, letterSpacing: 1 },
    sliderTray: {
        width: 300,
        height: 64,
        backgroundColor: '#F8F9FA',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#eee',
        marginTop: 40,
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    sliderTrack: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sliderThumb: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    sliderText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        zIndex: -1,
    },
    tagBadge: {
        position: 'absolute',
        top: -30,
        backgroundColor: '#000000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        ...SHADOWS.small,
    },
    tagText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    continueBtn: {
        width: '85%',
        height: 60,
        borderRadius: 30,
        backgroundColor: '#000000',
        marginTop: 40,
        ...SHADOWS.medium,
    },
    receiptStack: {
        width: width * 0.85,
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
    },
    receiptCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 30,
        borderWidth: 1,
        borderColor: '#eee',
        ...SHADOWS.medium,
        zIndex: 2,
    },
    receiptCardBack: {
        position: 'absolute',
        width: '92%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        top: 15,
        zIndex: 1,
        borderRadius: 24,
    },
    receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    receiptId: { color: '#000000', fontSize: 12, fontWeight: '900', opacity: 0.5 },
    receiptDate: { color: '#000000', fontSize: 10, opacity: 0.4 },
    divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 },
    dashedDivider: { height: 1, borderWidth: 1, borderColor: '#eee', borderStyle: 'dashed', marginVertical: 20 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    itemLabel: { color: '#757575', fontSize: 14 },
    itemValue: { color: '#000000', fontWeight: 'bold' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontWeight: '900', fontSize: 24, color: '#000000' },
    totalValue: { fontWeight: '900', fontSize: 26, color: '#000000' },
    paymentBadgeContainer: { marginTop: 30, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000000' },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    paymentStatusText: { color: 'white', fontWeight: '900', marginLeft: 10, fontSize: 12, letterSpacing: 2 },
    shineOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: 150,
        transform: [{ skewX: '-25deg' }],
    },
    getStartedBtn: {
        width: '85%',
        height: 64,
        borderRadius: 32,
        backgroundColor: '#000000',
        marginTop: 40,
        ...SHADOWS.medium,
    },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
    btnText: { color: 'white', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
});
