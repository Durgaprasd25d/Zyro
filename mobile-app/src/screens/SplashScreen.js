/**
 * SplashScreen.js — Splash Screen 1 of 3
 *
 * Design: Dark → warm terracotta gradient, floating particles,
 * centered headline, 3-dot page indicator.
 * Theme: designSystem.js (single source of truth).
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { DESIGN_COLORS, DESIGN_SPACING, DESIGN_TYPOGRAPHY } from '../constants/designSystem';

const { width, height } = Dimensions.get('window');

// ─── Static particle positions (replicated from design image) ───
const PARTICLES = [
    { x: 0.26, y: 0.24, size: 4,   opacity: 0.5 },
    { x: 0.74, y: 0.31, size: 3.5, opacity: 0.4 },
    { x: 0.16, y: 0.55, size: 3,   opacity: 0.35 },
    { x: 0.82, y: 0.62, size: 4,   opacity: 0.45 },
    { x: 0.65, y: 0.14, size: 2.5, opacity: 0.3 },
    { x: 0.40, y: 0.76, size: 3,   opacity: 0.4 },
    { x: 0.88, y: 0.18, size: 2,   opacity: 0.25 },
    { x: 0.08, y: 0.80, size: 2.5, opacity: 0.35 },
    { x: 0.55, y: 0.89, size: 3,   opacity: 0.3 },
];

function Particle({ x, y, size, opacity, delay }) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 2800,
                    delay,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 2800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const animated = {
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [opacity * 0.4, opacity] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) }],
    };

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: x * width,
                    top: y * height,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: DESIGN_COLORS.primary,
                },
                animated,
            ]}
        />
    );
}

export default function SplashScreen({ navigation }) {
    const masterOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity   = useRef(new Animated.Value(0)).current;
    const textY         = useRef(new Animated.Value(24)).current;
    const dotsOpacity   = useRef(new Animated.Value(0)).current;
    const exitOpacity   = useRef(new Animated.Value(1)).current;

    const navigate = () => {
        navigation.replace('Splash2');
    };

    useEffect(() => {
        // 1. Fade in background
        Animated.timing(masterOpacity, {
            toValue: 1, duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // 2. Slide + fade text up
        Animated.parallel([
            Animated.timing(textOpacity, {
                toValue: 1, duration: 900, delay: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(textY, {
                toValue: 0, duration: 900, delay: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // 3. Dots appear
        Animated.timing(dotsOpacity, {
            toValue: 1, duration: 600, delay: 1200,
            useNativeDriver: true,
        }).start();

        // 4. Exit
        const exitTimer = setTimeout(() => {
            Animated.timing(exitOpacity, {
                toValue: 0, duration: 700,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }).start(() => navigate());
        }, 3500);

        return () => clearTimeout(exitTimer);
    }, []);

    return (
        <Animated.View style={[styles.root, { opacity: exitOpacity }]}>
            <StatusBar style="light" hidden />

            {/* ── Background Gradient ── */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: masterOpacity }]}>
                <LinearGradient
                    colors={['#131313', '#1e1210', '#3d2416', '#c5956e']}
                    locations={[0, 0.35, 0.68, 1]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                />
            </Animated.View>

            {/* ── Floating Particles ── */}
            {PARTICLES.map((p, i) => (
                <Particle key={i} {...p} delay={i * 180} />
            ))}

            {/* ── Centered Content ── */}
            <View style={styles.center}>
                <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}>
                    <Text style={styles.headline}>Premium Cooling,{'\n'}Delivered Every Day</Text>
                </Animated.View>

                <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: DESIGN_COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: DESIGN_SPACING.containerPaddingMobile,
    },
    headline: {
        ...DESIGN_TYPOGRAPHY.headlineLgMobile,
        color: DESIGN_COLORS.onSurface,
        textAlign: 'center',
        lineHeight: 38,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: DESIGN_COLORS.outlineVariant,
    },
    dotActive: {
        backgroundColor: DESIGN_COLORS.primary,
        width: 9,
        height: 9,
        borderRadius: 4.5,
    },
});
