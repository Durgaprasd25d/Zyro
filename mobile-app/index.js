import { registerRootComponent } from "expo";
import * as Notifications from "expo-notifications";
import App from "./App";

// Configure how notifications are displayed across the entire app lifecycle
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * CRITICAL: Background FCM Handler — must be registered at root level BEFORE
 * AppRegistry.registerComponent(). This runs in Android Headless JS when the
 * app is killed or in the background.
 */
try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('🌙 [BG FCM] Message received in background/killed state:', remoteMessage?.data?.title || remoteMessage?.notification?.title);
        // If message has native notification payload, Firebase Android SDK displays it automatically.
        // Only schedule a local notification for data-only messages to prevent duplicates.
        if (!remoteMessage?.notification && (remoteMessage?.data?.title || remoteMessage?.data?.body)) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: remoteMessage.data.title || 'Zyro AC Notification',
                    body: remoteMessage.data.body || '',
                    data: remoteMessage.data || {},
                    sound: 'default',
                    channelId: 'default',
                },
                trigger: null,
            });
        }
    });
} catch (e) {
    console.log('⚠️ [BG FCM] Background handler not registered:', e.message);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
