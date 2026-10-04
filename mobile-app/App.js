import React, { useState, useEffect } from 'react';
import * as Updates from 'expo-updates';
import { View, ActivityIndicator, Alert, Platform, UIManager, AppState } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapboxGL from '@rnmapbox/maps';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

import config from './src/constants/config';
import { NotificationProvider } from './src/components/InAppNotification';
import { renderAuthScreens, renderCustomerScreens, renderTechnicianScreens } from './src/navigation';

import authService from './src/services/authService';
import technicianService from './src/services/technicianService';
import { expoNotificationService } from './src/services/expoNotificationService';
import { COLORS } from './src/constants/theme';

const Stack = createStackNavigator();

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [kycStatus, setKycStatus] = useState(null);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    useEffect(() => {
        async function onFetchUpdateAsync() {
            try {
                if (__DEV__) return; // Skip OTA in development
                if (!Updates.isEnabled) {
                    console.log('[OTA] expo-updates is not enabled.');
                    return;
                }
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    console.log('[OTA] Update available, downloading...');
                    await Updates.fetchUpdateAsync();
                    console.log('[OTA] Download complete. Reloading silently...');
                    await Updates.reloadAsync(); // Silent reload — no user prompt
                }
            } catch (error) {
                // Fail silently — OTA errors should never crash the app
                console.log('[OTA] Update check failed (non-critical):', error.message);
            }
        }

        onFetchUpdateAsync();

        const appStateSub = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                onFetchUpdateAsync();
            }
        });

        if (config.MAPBOX_ACCESS_TOKEN) {
            MapboxGL.setAccessToken(config.MAPBOX_ACCESS_TOKEN);
        }

        const bootstrapAsync = async () => {
            let token;
            let role = null;
            try {
                await AsyncStorage.removeItem('hasSeenOnboarding');
                token = await authService.isLoggedIn();
                const seenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
                setHasSeenOnboarding(seenOnboarding === 'true');

                if (token) {
                    const user = await authService.getUser();
                    role = user?.role || 'customer';

                    if (role === 'technician') {
                        const kycRes = await technicianService.getKYCStatus();
                        if (kycRes.success) {
                            setKycStatus(kycRes.kycStatus);
                        }
                    }

                    expoNotificationService.register(user.id || user._id);
                }
            } catch (e) {
                console.error('Check login error:', e);
            }
            setUserToken(token);
            setUserRole(role);
            setIsLoading(false);
        };

        bootstrapAsync();

        return () => {
            appStateSub.remove();
        };
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.roseGold} />
            </View>
        );
    }

    const NavTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            background: '#131313',
            card:       '#131313',
        },
    };

    return (
        <SafeAreaProvider>
            <NotificationProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <NavigationContainer theme={NavTheme}>
                        <Stack.Navigator
                            initialRouteName={
                                !userToken ? (hasSeenOnboarding ? "Auth" : "Splash") :
                                    userRole === 'technician' ? "TechnicianDashboard" : "Home"
                            }
                            screenOptions={{
                                cardStyle: { backgroundColor: '#131313' },
                                headerStyle: {
                                    backgroundColor: COLORS.surface || '#131313',
                                    elevation: 0,
                                    shadowOpacity: 0,
                                    borderBottomWidth: 1,
                                    borderBottomColor: COLORS.outlineVariant || '#50443f',
                                },
                                headerTintColor: COLORS.onSurface || '#e5e2e1',
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                    fontSize: 16,
                                    letterSpacing: 1,
                                    color: COLORS.onSurface || '#e5e2e1',
                                },
                                headerBackTitleVisible: false,
                                headerTitleAlign: 'center',
                            }}
                        >
                            {renderAuthScreens(Stack)}
                            {renderCustomerScreens(Stack)}
                            {renderTechnicianScreens(Stack)}
                        </Stack.Navigator>
                    </NavigationContainer>
                </GestureHandlerRootView>
            </NotificationProvider>
        </SafeAreaProvider>
    );
}
