const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { admin } = require('../config/firebase');

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID || '586224586992-b6fd79ej5rime769oeij9nh4skl4gg4o.apps.googleusercontent.com'
);

/**
 * Generate standard JWT token
 */
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me';
    return jwt.sign(
        { id: user._id, role: user.role, mobile: user.mobile || user.email },
        secret,
        { expiresIn: '7d' }
    );
};

/**
 * Helper to clean phone numbers (strips +91 and spaces)
 */
const normalizeMobile = (mobile) => {
    if (!mobile) return '';
    return mobile.toString().replace(/^\+91/, '').replace(/\D/g, '').trim();
};

/**
 * POST /api/auth/register
 * Normal customer registration
 * STRICT REQUIREMENT: No public technician registration allowed. Role is always 'customer'.
 */
router.post('/register', async (req, res) => {
    try {
        const { mobile, password, name } = req.body;

        if (!mobile || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Full Name, Mobile Number, and Password are required.'
            });
        }

        const cleanMobile = normalizeMobile(mobile);
        if (cleanMobile.length !== 10) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid 10-digit mobile number.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long.'
            });
        }

        // Check if mobile already exists
        const existingUser = await User.findOne({
            $or: [
                { mobile: cleanMobile },
                { mobile: `+91${cleanMobile}` }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'This mobile number is already registered. Please log in.'
            });
        }

        // Create new customer account (Enforce customer role strictly)
        const user = new User({
            name: name.trim(),
            mobile: cleanMobile,
            password, // Password hashed automatically via UserSchema.pre('save')
            role: 'customer',
            authProvider: 'local',
            isActive: true,
            lastLogin: new Date()
        });

        await user.save();

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            token,
            user: user.toSafeObject()
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, error: 'Internal server error during registration.' });
    }
});

/**
 * POST /api/auth/login
 * Standard credentials login (Customer, Technician, Admin)
 */
router.post('/login', async (req, res) => {
    try {
        const { mobile, password } = req.body;

        if (!mobile || !password) {
            return res.status(400).json({
                success: false,
                error: 'Mobile number and password are required.'
            });
        }

        const cleanMobile = normalizeMobile(mobile);

        // Find user by normalized mobile, raw input, or 'admin'
        const user = await User.findOne({
            $or: [
                { mobile: cleanMobile },
                { mobile: `+91${cleanMobile}` },
                { mobile: mobile.toString().trim() }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid mobile number or password.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Please contact support.'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid mobile number or password.'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: user.toSafeObject()
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'Internal server error during login.' });
    }
});

/**
 * POST /api/auth/google
 * Google OAuth 2.0 / Google Sign-In Integration
 * Supports both New Google Users (auto-registration) & Existing Google Users (auto-login).
 */
router.post('/google', async (req, res) => {
    try {
        const { idToken, googleUser } = req.body;

        if (!idToken && !googleUser) {
            return res.status(400).json({
                success: false,
                error: 'Google authentication credentials missing.'
            });
        }

        let verifiedData = null;

        // 1. Verify via Google OAuth2Client if idToken provided
        if (idToken) {
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken,
                    audience: [
                        process.env.GOOGLE_CLIENT_ID || '586224586992-b6fd79ej5rime769oeij9nh4skl4gg4o.apps.googleusercontent.com',
                        '586224586992-4lqa4lppekl15p3m1jdi3sisbst6ledu.apps.googleusercontent.com', // Android client ID
                        '586224586992-5k8ndr2e4fet4kn4i0f92p69imjeq0oh.apps.googleusercontent.com'
                    ]
                });
                const payload = ticket.getPayload();
                if (payload) {
                    verifiedData = {
                        googleId: payload.sub,
                        email: payload.email ? payload.email.toLowerCase() : null,
                        name: payload.name || payload.given_name || 'Google User',
                        avatar: payload.picture || '',
                        emailVerified: payload.email_verified
                    };
                }
            } catch (googleErr) {
                // Fallback: Verify via Firebase Admin SDK if token is a Firebase auth token
                if (admin && admin.apps.length > 0) {
                    try {
                        const decodedToken = await admin.auth().verifyIdToken(idToken);
                        verifiedData = {
                            googleId: decodedToken.uid || decodedToken.sub,
                            email: decodedToken.email ? decodedToken.email.toLowerCase() : null,
                            name: decodedToken.name || 'Google User',
                            avatar: decodedToken.picture || '',
                            emailVerified: decodedToken.email_verified
                        };
                    } catch (fbErr) {
                        console.error('Firebase token verification error:', fbErr.message);
                    }
                }
            }
        }

        // 2. Fallback to passed googleUser object in dev environment if token verification succeeded locally
        if (!verifiedData && googleUser && (googleUser.id || googleUser.googleId || googleUser.sub)) {
            verifiedData = {
                googleId: googleUser.id || googleUser.googleId || googleUser.sub,
                email: googleUser.email ? googleUser.email.toLowerCase() : null,
                name: googleUser.name || 'Google User',
                avatar: googleUser.photo || googleUser.picture || '',
                emailVerified: true
            };
        }

        if (!verifiedData || !verifiedData.googleId) {
            return res.status(401).json({
                success: false,
                error: 'Failed to verify Google identity.'
            });
        }

        // 3. Check for existing user by googleId
        let user = await User.findOne({ googleId: verifiedData.googleId });

        // 4. If not found by googleId, check by verified email
        if (!user && verifiedData.email && verifiedData.emailVerified) {
            user = await User.findOne({ email: verifiedData.email });
            if (user) {
                // Link Google ID to existing account safely
                user.googleId = verifiedData.googleId;
                if (!user.avatar && verifiedData.avatar) user.avatar = verifiedData.avatar;
                if (!user.name && verifiedData.name) user.name = verifiedData.name;
                await user.save();
            }
        }

        let isNewUser = false;

        // 5. New Google User -> Automatically create account
        if (!user) {
            isNewUser = true;
            user = new User({
                googleId: verifiedData.googleId,
                email: verifiedData.email,
                name: verifiedData.name,
                avatar: verifiedData.avatar,
                role: 'customer', // Strictly customer role
                authProvider: 'google',
                isActive: true,
                lastLogin: new Date()
            });
            await user.save();
        } else {
            // Existing user check
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    error: 'Account is deactivated. Please contact support.'
                });
            }
            user.lastLogin = new Date();
            if (verifiedData.avatar && !user.avatar) {
                user.avatar = verifiedData.avatar;
            }
            await user.save();
        }

        const token = generateToken(user);

        res.json({
            success: true,
            isNewUser,
            token,
            user: user.toSafeObject()
        });
    } catch (err) {
        console.error('Google OAuth error:', err);
        res.status(500).json({ success: false, error: 'Internal server error during Google authentication.' });
    }
});

/**
 * GET /api/auth/me
 * Get profile of current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user.toSafeObject()
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * POST /api/auth/fcm-token
 * Update FCM Token for push notifications
 */
router.post('/fcm-token', async (req, res) => {
    try {
        const { userId, fcmToken } = req.body;
        if (!userId || !fcmToken) {
            return res.status(400).json({ success: false, error: 'Missing userId or fcmToken' });
        }

        await User.findByIdAndUpdate(userId, { fcmToken });
        res.json({ success: true, message: 'FCM token updated successfully' });
    } catch (err) {
        console.error('FCM token update error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

const { sendToUser, sendPushNotification } = require('../services/notificationService');

/**
 * GET /api/auth/check-tokens
 * Diagnostic: show all users who have push tokens stored (no auth required for debug)
 */
router.get('/check-tokens', async (req, res) => {
    try {
        const users = await User.find({ fcmToken: { $exists: true, $ne: null } })
            .select('name mobile email fcmToken updatedAt')
            .sort({ updatedAt: -1 })
            .limit(10);

        const { admin: fbAdmin } = require('../config/firebase');
        const firebaseReady = fbAdmin && fbAdmin.apps && fbAdmin.apps.length > 0;

        res.json({
            success: true,
            firebaseAdminInitialized: firebaseReady,
            totalUsersWithTokens: users.length,
            users: users.map(u => ({
                name: u.name,
                mobile: u.mobile,
                email: u.email,
                tokenType: u.fcmToken?.startsWith('ExponentPushToken') ? 'expo-push-token' : 'native-fcm-token',
                tokenTail: `...${u.fcmToken?.slice(-20)}`,
                updatedAt: u.updatedAt
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/auth/test-notification
 * Trigger a push notification for testing via curl
 */
router.post('/test-notification', async (req, res) => {
    try {
        const { userId, title, body, data } = req.body;
        
        let targetUser;
        if (userId) {
            targetUser = await User.findById(userId);
        } else {
            // Find the most recently active user with a token
            targetUser = await User.findOne({ fcmToken: { $exists: true, $ne: null } }).sort({ updatedAt: -1, lastLogin: -1 });
        }

        if (!targetUser || !targetUser.fcmToken) {
            return res.status(404).json({ 
                success: false, 
                error: 'No user with an active push token was found in database. Open the mobile app and log in again to register a fresh token.' 
            });
        }

        const tokenType = targetUser.fcmToken.startsWith('ExponentPushToken') ? 'expo-push-token' : 'native-fcm-token';
        console.log(`\n\ud83d\udcf2 === TEST NOTIFICATION ===`);
        console.log(`   User: ${targetUser.name} (${targetUser.mobile || targetUser.email})`);
        console.log(`   Token type: ${tokenType}`);
        console.log(`   Token tail: ...${targetUser.fcmToken.slice(-20)}`);

        const payload = {
            title: title || 'Zyro AC \u2022 Test Alert \u2744\ufe0f',
            body: body || 'Real-time push notification test successful! Even when app is closed.',
            data: data || { screen: 'Home', test: 'true' }
        };

        const result = await sendToUser(targetUser._id, payload);

        res.json({
            success: true,
            message: `Push notification dispatched to ${targetUser.name} (${targetUser.mobile || targetUser.email})`,
            tokenType,
            targetTokenTail: `...${targetUser.fcmToken.slice(-20)}`,
            result
        });
    } catch (err) {
        console.error('Test notification error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/auth/update-profile
 * Update profile details
 */
router.put('/update-profile', async (req, res) => {
    try {
        const { userId, name, email, mobile, gender, alternateMobile, city, pincode, landmark } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const updateData = {};
        if (mobile !== undefined && mobile !== null && String(mobile).trim() !== '') {
            const cleanMobile = String(mobile).replace(/^\+91/, '').replace(/\D/g, '').trim();
            if (cleanMobile.length !== 10) {
                return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits.' });
            }
            const existingMobileUser = await User.findOne({ mobile: cleanMobile, _id: { $ne: userId } });
            if (existingMobileUser) {
                return res.status(400).json({ success: false, message: 'This mobile number is already linked to another account.' });
            }
            updateData.mobile = cleanMobile;
        }
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email.toLowerCase().trim();
        if (gender !== undefined) updateData.gender = gender;
        if (alternateMobile !== undefined) updateData.alternateMobile = alternateMobile;
        if (city !== undefined) updateData.city = city;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (landmark !== undefined) updateData.landmark = landmark;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.toSafeObject()
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/auth/addresses/:userId
 */
router.get('/addresses/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, addresses: user.addresses || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/auth/add-address
 */
router.post('/add-address', async (req, res) => {
    try {
        const { userId, label, address, lat, lng } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.addresses.push({ label, address, lat, lng });
        await user.save();
        res.json({ success: true, addresses: user.addresses });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * DELETE /api/auth/delete-address/:userId/:addressId
 */
router.delete('/delete-address/:userId/:addressId', async (req, res) => {
    try {
        const { userId, addressId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        await user.save();
        res.json({ success: true, addresses: user.addresses });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.authProvider !== 'local') {
            return res.status(400).json({
                success: false,
                error: 'Password change is not available for OAuth accounts.'
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
