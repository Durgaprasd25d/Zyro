/**
 * SplashScreen2.js — Splash Screen 2 of 3
 *
 * Design: Same gradient + particles. Focus on SERVICE badge + tagline.
 * "Expert Technicians,\nAt Your Doorstep"
 * Dot indicator: second dot active.
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
import { DESIGN_COLORS, DESIGN_SPACING, DESIGN_TYPOGRAPHY, DESIGN_RADIUS } from '../constants/designSystem';

const { width, height } = Dimensions.get('window');

const PARTICLES = [
    { x: 0.10, y: 0.18, size: 3.5, opacity: 0.4 },
    { x: 0.78, y: 0.22, size: 4,   opacity: 0.5 },
    { x: 0.30, y: 0.38, size: 3,   opacity: 0.35 },
    { x: 0.88, y: 0.48, size: 2.5, opacity: 0.3 },
    { x: 0.58, y: 0.12, size: 3,   opacity: 0.4 },
    { x: 0.20, y: 0.72, size: 4,   opacity: 0.45 },
    { x: 0.68, y: 0.80, size: 2.5, opacity: 0.35 },
    { x: 0.92, y: 0.70, size: 2,   opacity: 0.25 },
    { x: 0.44, y: 0.92, size: 3,   opacity: 0.3 },
];

function Particle({ x, y, size, opacity, delay }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 3000, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={{
            position: 'absolute',
            left: x * width, top: y * height,
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: DESIGN_COLORS.primaryContainer,
            opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [opacity * 0.3, opacity] }),
            transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) }],
        }} />
    );
}

export default function SplashScreen2({ navigation }) {
    const masterOpacity = useRef(new Animated.Value(0)).current;
    const badgeOpacity  = useRef(new Animated.Value(0)).current;
    const badgeScale    = useRef(new Animated.Value(0.8)).current;
    const textOpacity   = useRef(new Animated.Value(0)).current;
    const textY         = useRef(new Animated.Value(20)).current;
    const dotsOpacity   = useRef(new Animated.Value(0)).current;
    const exitOpacity   = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(masterOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

        Animated.parallel([
            Animated.timing(badgeOpacity, { toValue: 1, duration: 700, delay: 400, useNativeDriver: true }),
            Animated.spring(badgeScale, { toValue: 1, delay: 400, tension: 80, friction: 8, useNativeDriver: true }),
        ]).start();

        Animated.parallel([
            Animated.timing(textOpacity, { toValue: 1, duration: 800, delay: 800, useNativeDriver: true }),
            Animated.timing(textY, { toValue: 0, duration: 800, delay: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        Animated.timing(dotsOpacity, { toValue: 1, duration: 500, delay: 1300, useNativeDriver: true }).start();

        const t = setTimeout(() => {
            Animated.timing(exitOpacity, { toValue: 0, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true })
                .start(() => navigation.replace('Splash3'));
        }, 3500);
        return () => clearTimeout(t);
    }, []);

    return (
        <Animated.View style={[styles.root, { opacity: exitOpacity }]}>
            <StatusBar style="light" hidden />
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: masterOpacity }]}>
                <LinearGradient
                    colors={['#131313', '#1a110e', '#3a2214', '#c09068']}
                    locations={[0, 0.30, 0.65, 1]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                />
            </Animated.View>

            {PARTICLES.map((p, i) => <Particle key={i} {...p} delay={i * 200} />)}

            <View style={styles.center}>
                {/* Badge */}
                <Animated.View style={[styles.badge, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}>
                    <Text style={styles.badgeText}>AC SERVICE</Text>
                </Animated.View>

                <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], marginTop: 20 }}>
                    <Text style={styles.headline}>Expert Technicians,{'\n'}At Your Doorstep</Text>
                    <Text style={styles.sub}>Fast · Reliable · Certified</Text>
                </Animated.View>

                <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
                    <View style={styles.dot} />
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
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
    badge: {
        borderWidth: 1,
        borderColor: DESIGN_COLORS.primary,
        borderRadius: DESIGN_RADIUS.full,
        paddingHorizontal: 20,
        paddingVertical: 7,
        backgroundColor: DESIGN_COLORS.onPrimary + '33',
    },
    badgeText: {
        ...DESIGN_TYPOGRAPHY.labelCaps,
        color: DESIGN_COLORS.primary,
        letterSpacing: 4,
    },
    headline: {
        ...DESIGN_TYPOGRAPHY.headlineLgMobile,
        color: DESIGN_COLORS.onSurface,
        textAlign: 'center',
        lineHeight: 38,
    },
    sub: {
        ...DESIGN_TYPOGRAPHY.labelCaps,
        color: DESIGN_COLORS.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 14,
        letterSpacing: 3,
    },
    dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
    dot: {
        width: 7, height: 7, borderRadius: 3.5,
        backgroundColor: DESIGN_COLORS.outlineVariant,
    },
    dotActive: {
        backgroundColor: DESIGN_COLORS.primary,
        width: 9, height: 9, borderRadius: 4.5,
    },
});
