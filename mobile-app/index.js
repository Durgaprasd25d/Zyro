import { registerRootComponent } from "expo";
import App from "./App";

/**
 * CRITICAL: Background FCM Handler — must be registered at root level BEFORE
 * AppRegistry.registerComponent(). This runs in Android Headless JS when the
 * app is killed or in the background. Do NOT move this into any component.
 */
try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('🌙 [BG FCM] Message received in background/killed state:', remoteMessage?.notification?.title);
        // Background display is handled natively by FCM channel config in AndroidManifest.
        // If you need Notifee here, import and call notifee.displayNotification().
    });
} catch (e) {
    console.log('⚠️ [BG FCM] Background handler not registered (likely Expo Go):', e.message);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
