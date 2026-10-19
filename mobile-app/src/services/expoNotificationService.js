import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import config from '../constants/config';

const API_URL = config.BACKEND_URL + '/api/auth';

/**
 * Expo Push Notifications Service
 * Replaces FCM for standardized Expo ecosystem support
 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Expo Push Notifications Service
 * Replaces FCM for standardized Expo ecosystem support
 */
class ExpoNotificationService {
    constructor() {
        this.initialized = false;

        if (isExpoGo) {
            console.log('ℹ️ Notification Service: Expo Go detected. Skipping notification handler setup.');
            return;
        }

        // Configure how notifications are handled when the app is open
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });

        // Initialize listeners and setup channel immediately
        this.setupChannel();
        this.createNotificationListeners();
    }

    async setupChannel() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Zyro AC Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#E6BEAB',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
                enableLights: true,
                enableVibrate: true,
                showBadge: true,
                sound: 'default',
            });
        }
    }

    async register(userId) {
        if (isExpoGo) {
            console.log('ℹ️ Notification Service: Expo Go detected. Skipping registration.');
            return;
        }

        try {
            const token = await this.registerForPushNotificationsAsync();
            if (token) {
                console.log('🚀 Expo Push Token:', token);
                await this.updateTokenOnServer(userId, token);
                this.initialized = true;
                this.createNotificationListeners();
            }
        } catch (error) {
            console.log('⚠️ Expo Notification Registration Warning:', error.message);
        }
    }

    async registerForPushNotificationsAsync() {
        if (isExpoGo) return null;

        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Zyro AC Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#E6BEAB',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                bypassDnd: true,
                enableLights: true,
                enableVibrate: true,
                showBadge: true,
                sound: 'default',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('❌ Failed to get push token for push notification!');
            return null;
        }

        // First try native FCM token (most reliable for closed/killed apps on Android)
        try {
            const messaging = require('@react-native-firebase/messaging').default;
            if (messaging) {
                token = await messaging().getToken();
                if (token) {
                    console.log('🚀 Native FCM Device Token acquired:', token);
                    return token;
                }
            }
        } catch (e) {
            console.log('ℹ️ FCM token fallback to Expo token:', e.message);
        }

        // Project ID is required for Expo Push Notifications
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        return token;
    }

    async updateTokenOnServer(userId, expoToken) {
        try {
            const response = await axios.post(`${API_URL}/fcm-token`, {
                userId,
                fcmToken: expoToken // Reusing the same field name on backend for simplicity
            });
            if (response.data.success) {
                console.log('✅ Expo Token synced');
                await AsyncStorage.setItem('expoPushToken', expoToken);
            }
        } catch (error) {
            console.log('❌ Failed to sync Expo Token', error.message);
        }
    }

    createNotificationListeners(navigationRef = null) {
        if (isExpoGo) return;

        // Listen for direct Firebase messages when app is in foreground
        try {
            const messaging = require('@react-native-firebase/messaging').default;
            if (messaging) {
                this.fcmUnsubscribe = messaging().onMessage(async remoteMessage => {
                    console.log('📩 [Foreground FCM] Message received:', remoteMessage);
                    const title = remoteMessage?.notification?.title || remoteMessage?.data?.title || 'Zyro AC Alert';
                    const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || '';
                    if (title || body) {
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title,
                                body,
                                data: remoteMessage?.data || {},
                                sound: 'default',
                                channelId: 'default',
                            },
                            trigger: null,
                        });
                    }
                });
            }
        } catch (e) {
            console.log('Foreground FCM listener setup note:', e.message);
        }

        // This listener is fired whenever a notification is received while the app is foregrounded
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('📩 [Foreground] Notification:', notification.request.content.title);
        });

        // This listener is fired whenever a user taps on or interacts with a notification while backgrounded
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('📂 [Notification Tapped]:', response.notification.request.content.title);
            const data = response.notification.request.content.data;
            if (navigationRef && data?.screen) {
                navigationRef.navigate(data.screen, data.params || {});
            }
        });

        // Handle cold-start launch when app was completely killed/closed
        Notifications.getLastNotificationResponseAsync().then(response => {
            if (response?.notification) {
                console.log('🚀 [Cold Launch From Notification]:', response.notification.request.content.title);
                const data = response.notification.request.content.data;
                if (navigationRef && data?.screen) {
                    setTimeout(() => {
                        navigationRef.navigate(data.screen, data.params || {});
                    }, 1000);
                }
            }
        }).catch(err => console.log('Notice: getLastNotificationResponse:', err.message));
    }

    unregister() {
        if (isExpoGo) return;

        if (this.fcmUnsubscribe) {
            this.fcmUnsubscribe();
        }
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }
}

export const expoNotificationService = new ExpoNotificationService();
