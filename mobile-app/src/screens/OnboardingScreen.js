import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Dimensions, TouchableOpacity, Image,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring, withTiming,
    withDelay, interpolate, runOnJS, withSequence, withRepeat,
    FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { DESIGN_COLORS as C, DESIGN_SPACING as SP, DESIGN_TYPOGRAPHY as TY } from '../constants/designSystem';

const { width } = Dimensions.get('window');

// ─── Step 1: Tap to Book ────────────────────────────────────────────────────
const InteractiveStep1 = ({ onComplete }) => {
    const scale       = useSharedValue(1);
    const rippleScale = useSharedValue(1);
    const rippleOp    = useSharedValue(0.6);
    const isFound     = useSharedValue(0);

    const handlePress = () => {
        scale.value     = withSequence(withTiming(0.8, { duration: 100 }), withSpring(1));
        rippleScale.value = withTiming(4, { duration: 900 });
        rippleOp.value    = withTiming(0, { duration: 900 }, () => {
            rippleScale.value = 1;
            rippleOp.value    = 0.6;
        });
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
        opacity: rippleOp.value,
    }));
    const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tap to Book</Text>
            <Text style={styles.stepSubtitle}>Find the best AC experts near you in seconds.</Text>

            <View style={styles.interactiveArea}>
                <Animated.View style={[styles.bookingSuccessCard, acStyle]}>
                    <LinearGradient
                        colors={[C.surfaceContainerHigh, C.surfaceContainerLowest]}
                        style={styles.bookingCardInner}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.successIconCircle}>
                            <Ionicons name="shield-checkmark" size={38} color={C.primary} />
                        </View>
                        <Text style={styles.successCardTitle}>EXPERT MATCHED</Text>
                        <Text style={styles.successCardDesc}>Your booking is confirmed with a premium technician.</Text>
                        
                        <View style={styles.badgeRow}>
                            <View style={styles.miniBadge}>
                                <Ionicons name="star" size={12} color={C.primary} style={{ marginRight: 4 }} />
                                <Text style={styles.miniBadgeText}>4.9/5 Rated</Text>
                            </View>
                            <View style={styles.miniBadge}>
                                <Ionicons name="flash" size={12} color={C.primary} style={{ marginRight: 4 }} />
                                <Text style={styles.miniBadgeText}>Fast Arrival</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
                    <Animated.View style={[styles.pulseButton, btnStyle]}>
                        <Animated.View style={[styles.ripple, rippleStyle]} />
                        <LinearGradient
                            colors={[C.primary, C.onPrimary]}
                            style={styles.pulseInner}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="search" size={30} color={C.onSurface} />
                        </LinearGradient>
                    </Animated.View>
                </TouchableOpacity>

                <Text style={styles.tapHint}>Tap to find an expert</Text>
            </View>
        </View>
    );
};

// ─── Step 2: Live Tracking ──────────────────────────────────────────────────
const InteractiveStep2 = ({ onComplete }) => {
    const progress = useSharedValue(0);
    const [arrived, setArrived] = useState(false);

    const handleSlider = (val) => {
        if (!arrived) {
            progress.value = val;
            if (val > 0.98) runOnJS(setArrived)(true);
        }
    };

    const thumbStyle = useAnimatedStyle(() => ({
        left: interpolate(progress.value, [0, 1], [0, 240]),
    }));

    return (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Live Tracking</Text>
            <Text style={styles.stepSubtitle}>Slide to track your expert's live journey to your location.</Text>

            <View style={styles.interactiveArea}>
                <View style={styles.simpleStatusCard}>
                    <View style={styles.radarContainer}>
                        <Ionicons name="location" size={32} color={C.primary} />
                        <View style={styles.radarPulse} />
                    </View>

                    <Text style={styles.statusTitle}>
                        {arrived ? 'Expert has Arrived!' : 'Technician in Transit'}
                    </Text>
                    
                    <Text style={styles.statusDesc}>
                        {arrived
                            ? 'Your technician is at your doorstep. Tap next to review billing.'
                            : 'Background-checked Zyro partner is moving towards your house with premium tools.'}
                    </Text>

                    <View style={styles.timeline}>
                        <View style={styles.timelineRow}>
                            <Ionicons name="checkmark-circle" size={18} color={C.primary} />
                            <Text style={styles.timelineTextDone}>Booking Confirmed</Text>
                        </View>
                        <View style={styles.timelineConnectorDone} />
                        <View style={styles.timelineRow}>
                            <Ionicons name="checkmark-circle" size={18} color={C.primary} />
                            <Text style={styles.timelineTextDone}>Expert Dispatched</Text>
                        </View>
                        <View style={styles.timelineConnectorActive} />
                        <View style={styles.timelineRow}>
                            <Ionicons 
                                name={arrived ? "checkmark-circle" : "radio-button-on"} 
                                size={18} 
                                color={arrived ? C.primary : C.outline} 
                            />
                            <Text style={arrived ? styles.timelineTextDone : styles.timelineTextPending}>
                                Arrived at Doorstep
                            </Text>
                        </View>
                    </View>
                </View>

                {!arrived ? (
                    <View style={styles.sliderTray}>
                        <PanGestureHandler onGestureEvent={(e) =>
                            handleSlider(Math.max(0, Math.min(1, e.nativeEvent.x / 300)))
                        }>
                            <View style={styles.sliderTrack}>
                                <Animated.View style={[styles.sliderThumb, thumbStyle]}>
                                    <Ionicons name="chevron-forward" size={22} color={C.onPrimary} />
                                </Animated.View>
                                <Text style={styles.sliderText}>Slide to track expert</Text>
                            </View>
                        </PanGestureHandler>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.continueBtn} onPress={onComplete} activeOpacity={0.85}>
                        <LinearGradient colors={[C.primary, C.primaryContainer]} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.btnText}>NEXT STEP</Text>
                            <Ionicons name="arrow-forward" size={18} color={C.onPrimary} />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};



// ─── Main Onboarding ────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
    const [step, setStep] = useState(0);

    const nextStep = () => {
        if (step < 1) setStep(step + 1);
        else finish();
    };

    const finish = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        navigation.replace('Auth');
    };

    return (
        <View style={styles.container}>
            {/* Subtle gradient at bottom */}
            <LinearGradient
                colors={['transparent', C.onPrimary + '22']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 0.5 }} end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
            />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.progressBar}>
                        {[0, 1].map(i => (
                            <View key={i} style={[styles.progressSegment, i <= step && styles.activeSegment]} />
                        ))}
                    </View>
                    <TouchableOpacity onPress={finish} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.skipText}>SKIP</Text>
                    </TouchableOpacity>
                </View>

                {step === 0 && <InteractiveStep1 onComplete={nextStep} />}
                {step === 1 && <InteractiveStep2 onComplete={finish} />}
            </SafeAreaView>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: C.background },
    header: {
        paddingHorizontal: SP.containerPaddingMobile,
        paddingTop: SP.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressBar:     { flexDirection: 'row', gap: 6, flex: 1, marginRight: 32 },
    progressSegment: { height: 3, flex: 1, backgroundColor: C.surfaceContainerHigh, borderRadius: 2 },
    activeSegment:   { backgroundColor: C.primary },
    skipText:        { ...TY.labelCaps, color: C.onSurfaceVariant, letterSpacing: 2 },

    stepContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: SP.xl,
        paddingHorizontal: SP.containerPaddingMobile,
    },
    stepTitle: {
        ...TY.headlineLgMobile,
        color: C.onSurface,
        textAlign: 'center',
    },
    stepSubtitle: {
        ...TY.bodyMd,
        color: C.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 10,
    },
    interactiveArea: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tapHint: {
        ...TY.labelCaps,
        color: C.outline,
        marginTop: 16,
        letterSpacing: 2,
    },

    // Step 1
    pulseButton: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    pulseInner:  { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center',
        shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
    ripple: {
        position: 'absolute',
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 2, borderColor: C.primary,
        backgroundColor: 'transparent',
    },
    bookingSuccessCard: {
        position: 'absolute',
        top: 20,
        width: '90%',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.outlineVariant,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    bookingCardInner: {
        padding: 24,
        alignItems: 'center',
    },
    successIconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: C.onPrimary + '33',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successCardTitle: {
        ...TY.labelCaps,
        color: C.primary,
        letterSpacing: 2,
        fontSize: 14,
        fontWeight: '700',
    },
    successCardDesc: {
        ...TY.bodyMd,
        color: C.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    miniBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surfaceContainerHighest,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.outlineVariant,
    },
    miniBadgeText: {
        fontSize: 11,
        color: C.onSurface,
        fontWeight: '600',
    },

    // Step 2
    // Step 2
    simpleStatusCard: {
        width: '90%',
        backgroundColor: C.surfaceContainerLowest,
        borderRadius: 24,
        borderWidth: 1, borderColor: C.outlineVariant,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
    },
    radarContainer: {
        width: 64, height: 64,
        borderRadius: 32,
        backgroundColor: C.onPrimary + '22',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
    },
    radarPulse: {
        position: 'absolute',
        width: 64, height: 64,
        borderRadius: 32,
        borderWidth: 1.5, borderColor: C.primary,
        opacity: 0.4,
    },
    statusTitle: {
        ...TY.headlineSmMobile,
        color: C.onSurface,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    statusDesc: {
        ...TY.bodyMd,
        color: C.onSurfaceVariant,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    timeline: {
        width: '100%',
        paddingHorizontal: 16,
    },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timelineTextDone: {
        fontSize: 14,
        fontWeight: '700',
        color: C.onSurface,
    },
    timelineTextPending: {
        fontSize: 14,
        fontWeight: '500',
        color: C.outline,
    },
    timelineConnectorDone: {
        width: 2,
        height: 20,
        backgroundColor: C.primary,
        marginLeft: 8,
        marginVertical: 4,
    },
    timelineConnectorActive: {
        width: 2,
        height: 20,
        backgroundColor: C.outlineVariant,
        marginLeft: 8,
        marginVertical: 4,
    },
    sliderTray: {
        width: 300, height: 62,
        backgroundColor: C.surfaceContainerHigh,
        borderRadius: 31,
        borderWidth: 1, borderColor: C.outlineVariant,
        marginTop: 32,
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    sliderTrack:  { flex: 1, flexDirection: 'row', alignItems: 'center' },
    sliderThumb:  {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: C.onPrimary,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    sliderText: {
        position: 'absolute', width: '100%',
        textAlign: 'center', fontSize: 13,
        fontWeight: '600', color: C.outline, zIndex: -1,
    },

    // Buttons
    continueBtn: { width: '85%', height: 56, borderRadius: 28, overflow: 'hidden', marginTop: 32, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    btnText:     { color: C.onPrimary, fontWeight: '800', fontSize: 16, letterSpacing: 1.5 },
});
