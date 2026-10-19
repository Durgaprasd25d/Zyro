const { Expo } = require('expo-server-sdk');
// Use the pre-initialized Firebase Admin from the central firebase.js config
const { admin } = require('../config/firebase');

// Create a new Expo SDK client
let expo = new Expo();

/**
 * Send a push notification to specific Push Tokens (supports both Native FCM & Expo tokens)
 * @param {string|string[]} tokens - Single token or array of tokens
 * @param {Object} payload - Notification payload { title, body, data, badge }
 */
const sendPushNotification = async (tokens, payload) => {
    try {
        const messageTokens = Array.isArray(tokens) ? tokens : [tokens];
        const expoMessages = [];
        const fcmTokens = [];

        for (let token of messageTokens) {
            if (!token) continue;
            if (token.startsWith('ExponentPushToken[')) {
                expoMessages.push({
                    to: token,
                    sound: 'default',
                    title: payload.title,
                    body: payload.body,
                    data: payload.data || {},
                    channelId: 'default',
                    priority: 'high',
                    ttl: 2419200,
                    _displayInForeground: true,
                    badge: payload.badge || 1,
                });
            } else {
                fcmTokens.push(token);
            }
        }

        const results = [];

        // 1. Send Direct FCM Notifications (for closed/killed Android apps)
        if (fcmTokens.length > 0 && admin && admin.apps && admin.apps.length > 0) {
            for (const fcmToken of fcmTokens) {
                try {
                    console.log(`📤 Sending FCM to token: ...${fcmToken.slice(-20)}`);
                    const fcmMessage = {
                        token: fcmToken,
                        notification: {
                            title: payload.title,
                            body: payload.body,
                        },
                        data: {
                            title: String(payload.title || ''),
                            body: String(payload.body || ''),
                            ...Object.keys(payload.data || {}).reduce((acc, key) => {
                                acc[key] = String(payload.data[key]);
                                return acc;
                            }, {})
                        },
                        android: {
                            priority: 'high',
                            notification: {
                                channelId: 'default',
                                sound: 'default',
                                priority: 'max',
                                defaultVibrateTimings: true,
                                visibility: 'public',
                                tag: 'zyro_' + Date.now(),
                            }
                        }
                    };
                    const fcmRes = await admin.messaging().send(fcmMessage);
                    console.log('✅ FCM Sent Successfully! Message ID:', fcmRes);
                    results.push({ status: 'ok', id: fcmRes });
                } catch (fcmErr) {
                    console.error('❌ FCM Direct Send Error:', fcmErr.code, fcmErr.message);
                    // INVALID_ARGUMENT or REGISTRATION_TOKEN_NOT_REGISTERED means stale token
                    if (fcmErr.code === 'messaging/registration-token-not-registered' ||
                        fcmErr.code === 'messaging/invalid-registration-token') {
                        console.error('⚠️  STALE TOKEN! User must re-login to refresh their FCM token.');
                    }
                    results.push({ status: 'error', error: fcmErr.message });
                }
            }
        } else if (fcmTokens.length > 0) {
            console.error('❌ Firebase Admin not initialized! Cannot send FCM notifications.');
        }

        // 2. Send Expo Notifications
        if (expoMessages.length > 0) {
            let chunks = expo.chunkPushNotifications(expoMessages);
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log('🚀 Expo Notification Chunk Sent:', ticketChunk);
                    results.push(...ticketChunk);
                } catch (error) {
                    console.error('❌ Expo Notification Chunk Error:', error);
                }
            }
        }

        return results;
    } catch (error) {
        console.error('❌ sendPushNotification Error:', error);
    }
};

/**
 * Send a notification to a specific User ID
 * @param {string} userId - Native Mongoose ID of the user
 * @param {Object} payload - Notification payload
 */
const sendToUser = async (userId, payload) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(userId);

        if (!user || !user.fcmToken) { // Still using fcmToken field for compatibility
            console.warn(`⚠️ User ${userId} has no Push token. Skipping notification.`);
            return;
        }

        return await sendPushNotification(user.fcmToken, payload);
    } catch (error) {
        console.error('❌ sendToUser Error:', error);
    }
};

module.exports = {
    sendPushNotification,
    sendToUser,
};
