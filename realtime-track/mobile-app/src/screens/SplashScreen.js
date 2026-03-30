import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing,
    runOnJS
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AnimatedFeather = Animated.createAnimatedComponent(Feather);

export default function SplashScreen({ navigation }) {
    const bgOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textScale = useSharedValue(0.9);
    const globeOpacity = useSharedValue(0);
    const globeScale = useSharedValue(0.5);
    const globeRotate = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    const onFinish = async () => {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding === 'true') {
            navigation.replace('Auth');
        } else {
            navigation.replace('Onboarding');
        }
    };

    useEffect(() => {
        // 1. Background Fade In
        bgOpacity.value = withTiming(1, { duration: 1000 });

        // 2. Globe Reveal & Rotation
        globeOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
        globeScale.value = withDelay(400, withSpring(1, { damping: 12 }));
        globeRotate.value = withRepeat(
            withTiming(360, { duration: 20000, easing: Easing.linear }),
            -1,
            false
        );

        // 3. Globe Pulse Animation
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // 4. Text Animation
        textOpacity.value = withDelay(1000, withTiming(1, { duration: 1000 }));
        textScale.value = withDelay(1000, withSpring(1, { damping: 15 }));

        // 5. Completion transition
        setTimeout(() => {
            bgOpacity.value = withTiming(0, { duration: 1000 }, (finished) => {
                if (finished) runOnJS(onFinish)();
            });
        }, 5000);
    }, []);

    const backgroundStyle = useAnimatedStyle(() => ({
        ...StyleSheet.absoluteFillObject,
        opacity: bgOpacity.value,
        backgroundColor: '#FFFFFF', // Pure White
    }));

    const globeStyle = useAnimatedStyle(() => ({
        opacity: globeOpacity.value,
        transform: [
            { scale: globeScale.value },
        ],
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)', // Subtle Pulse
        transform: [{ scale: pulseScale.value }],
        opacity: withRepeat(withTiming(0, { duration: 2000 }), -1, false),
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ scale: textScale.value }],
        marginTop: 40,
        alignItems: 'center',
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="dark" hidden />
            <Animated.View style={backgroundStyle} />

            <View style={styles.content}>
                <View style={styles.globeContainer}>
                    <Animated.View style={pulseStyle} />
                    <Animated.View style={globeStyle}>
                        <AnimatedFeather 
                            name="wind" 
                            size={80} 
                            color="#000000" // Black
                        />
                    </Animated.View>
                </View>

                <Animated.View style={textStyle}>
                    <Text style={styles.brandName}>ZYRO</Text>
                    <Text style={styles.brandSub}>AC SERVICE</Text>
                    <View style={styles.loaderBarContainer}>
                        <Animated.View style={styles.loaderBar} />
                    </View>
                    <Text style={styles.loadingText}>PREPARING YOUR COMFORT...</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    globeContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 150,
        width: 150,
    },
    brandName: {
        fontSize: 48,
        fontWeight: '900',
        color: '#000000',
        letterSpacing: 12,
    },
    brandSub: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        letterSpacing: 8,
        marginTop: 5,
        opacity: 0.6,
    },
    loaderBarContainer: {
        width: 180,
        height: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginTop: 40,
        borderRadius: 2,
        overflow: 'hidden',
    },
    loaderBar: {
        width: '40%',
        height: '100%',
        backgroundColor: '#000000',
        position: 'absolute',
    },
    loadingText: {
        color: 'rgba(0, 0, 0, 0.4)',
        fontSize: 10,
        marginTop: 15,
        letterSpacing: 2,
        fontWeight: '700',
    }
});
