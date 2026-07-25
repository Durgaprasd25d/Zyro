/**
 * SplashScreen3.js — Splash Screen 3 of 3 (Final)
 *
 * Design: Same gradient. Logo/brand mark + "ZYRO AC" wordmark centered.
 * CTA sub-text + third dot active.
 * Exits → Auth or Onboarding.
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DESIGN_COLORS, DESIGN_SPACING, DESIGN_TYPOGRAPHY } from '../constants/designSystem';

const { width, height } = Dimensions.get('window');

const PARTICLES = [
    { x: 0.18, y: 0.12, size: 3,   opacity: 0.45 },
    { x: 0.80, y: 0.20, size: 4,   opacity: 0.5 },
    { x: 0.05, y: 0.45, size: 2.5, opacity: 0.35 },
    { x: 0.72, y: 0.52, size: 3.5, opacity: 0.4 },
    { x: 0.50, y: 0.08, size: 2,   opacity: 0.3 },
    { x: 0.35, y: 0.78, size: 3,   opacity: 0.4 },
    { x: 0.88, y: 0.68, size: 2.5, opacity: 0.35 },
    { x: 0.12, y: 0.85, size: 3,   opacity: 0.3 },
    { x: 0.60, y: 0.93, size: 2,   opacity: 0.25 },
];

function Particle({ x, y, size, opacity, delay }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 2600, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={{
            position: 'absolute',
            left: x * width, top: y * height,
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: DESIGN_COLORS.primary,
            opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [opacity * 0.3, opacity] }),
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) }],
        }} />
    );
}

export default function SplashScreen3({ navigation }) {
    const masterOpacity  = useRef(new Animated.Value(0)).current;
    const logoOpacity    = useRef(new Animated.Value(0)).current;
    const logoScale      = useRef(new Animated.Value(0.7)).current;
    const wordOpacity    = useRef(new Animated.Value(0)).current;
    const wordY          = useRef(new Animated.Value(24)).current;
    const subOpacity     = useRef(new Animated.Value(0)).current;
    const dotsOpacity    = useRef(new Animated.Value(0)).current;
    const exitOpacity    = useRef(new Animated.Value(1)).current;

    const navigate = async () => {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (seen === 'true') {
            navigation.replace('Auth');
        } else {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            navigation.replace('Onboarding');
        }
    };

    useEffect(() => {
        // Bg
        Animated.timing(masterOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();

        // Logo pop-in
        Animated.parallel([
            Animated.spring(logoScale, { toValue: 1, delay: 200, tension: 70, friction: 7, useNativeDriver: true }),
            Animated.timing(logoOpacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
        ]).start();

        // Wordmark
        Animated.parallel([
            Animated.timing(wordOpacity, { toValue: 1, duration: 800, delay: 600, useNativeDriver: true }),
            Animated.timing(wordY, { toValue: 0, duration: 800, delay: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        // Sub
        Animated.timing(subOpacity, { toValue: 1, duration: 600, delay: 1100, useNativeDriver: true }).start();

        // Dots
        Animated.timing(dotsOpacity, { toValue: 1, duration: 400, delay: 1300, useNativeDriver: true }).start();

        // Exit
        const t = setTimeout(() => {
            Animated.timing(exitOpacity, {
                toValue: 0, duration: 700,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(() => navigate());
        }, 4000);
        return () => clearTimeout(t);
    }, []);

    return (
        <Animated.View style={[styles.root, { opacity: exitOpacity }]}>
            <StatusBar style="light" hidden />

            {/* Background */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: masterOpacity }]}>
                <LinearGradient
                    colors={['#131313', '#1c1210', '#3e2215', '#bf9268']}
                    locations={[0, 0.28, 0.62, 1]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.4, y: 0 }}
                    end={{ x: 0.6, y: 1 }}
                />
            </Animated.View>

            {PARTICLES.map((p, i) => <Particle key={i} {...p} delay={i * 190} />)}

            <View style={styles.center}>
                {/* App Logo */}
                <Animated.View style={[
                    styles.logoWrap,
                    { opacity: logoOpacity, transform: [{ scale: logoScale }] }
                ]}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logoImg}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Wordmark */}
                <Animated.View style={{ opacity: wordOpacity, transform: [{ translateY: wordY }], alignItems: 'center', marginTop: 20 }}>
                    <Text style={styles.brand}>ZYRO</Text>
                    <Text style={styles.brandSub}>AC SERVICE</Text>
                </Animated.View>

                {/* Sub tagline */}
                <Animated.View style={{ opacity: subOpacity, marginTop: 20 }}>
                    <Text style={styles.tagline}>Your comfort, our commitment.</Text>
                </Animated.View>

                {/* Page dots */}
                <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={[styles.dot, styles.dotActive]} />
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: DESIGN_COLORS.background },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: DESIGN_SPACING.containerPaddingMobile,
    },
    logoWrap: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        // Subtle warm glow behind the logo
        shadowColor: DESIGN_COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 12,
    },
    logoImg: {
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    brand: {
        fontWeight: '600',
        fontSize: 52,
        color: DESIGN_COLORS.onSurface,
        letterSpacing: 14,
    },
    brandSub: {
        ...DESIGN_TYPOGRAPHY.labelCaps,
        color: DESIGN_COLORS.primary,
        letterSpacing: 6,
        marginTop: 4,
    },
    tagline: {
        ...DESIGN_TYPOGRAPHY.bodyMd,
        color: DESIGN_COLORS.onSurfaceVariant,
        textAlign: 'center',
    },
    dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32 },
    dot: {
        width: 7, height: 7, borderRadius: 3.5,
        backgroundColor: DESIGN_COLORS.outlineVariant,
    },
    dotActive: {
        backgroundColor: DESIGN_COLORS.primary,
        width: 9, height: 9, borderRadius: 4.5,
    },
});
