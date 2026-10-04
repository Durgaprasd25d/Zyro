const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Technician = require('../models/Technician');

const BASE_URL = 'http://localhost:4000/api';

async function runTests() {
    console.log('🚀 Starting Comprehensive Authentication Test Suite...\n');
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // 0. Clean test data before running suite
        await User.deleteMany({ mobile: { $in: ['9876543210', '9876543211', '9123456780'] } });
        await User.deleteMany({ googleId: 'google_oauth_sub_1001' });
        await Technician.deleteMany({});

        // --- TEST 1: Normal Customer Registration ---
        console.log('--- TEST 1: Customer Normal Registration ---');
        const regPayload = {
            name: 'Rohit Sharma',
            mobile: '9876543210',
            password: 'SecurePassword123'
        };

        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload)
        });
        const regData = await regRes.json();
        
        assert(regRes.status === 201, 'Registration returns HTTP 201');
        assert(regData.success === true, 'Registration success is true');
        assert(!!regData.token, 'Registration returns JWT token');
        assert(regData.user?.role === 'customer', 'User role is customer');
        assert(regData.user?.mobile === '9876543210', 'Mobile is stored correctly');
        assert(regData.user?.password === undefined, 'Password is NOT exposed in response');

        // Test DB password hashing
        const dbUser = await User.findOne({ mobile: '9876543210' });
        assert(dbUser && dbUser.password !== 'SecurePassword123', 'Password is fully hashed in database with bcrypt');
        assert(await bcrypt.compare('SecurePassword123', dbUser.password), 'Hashed password verifies with bcrypt.compare');

        // --- TEST 2: Duplicate Mobile Registration Prevention ---
        console.log('\n--- TEST 2: Duplicate Mobile Registration ---');
        const dupRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload)
        });
        const dupData = await dupRes.json();
        assert(dupRes.status === 400, 'Duplicate registration returns HTTP 400');
        assert(dupData.success === false, 'Duplicate registration success is false');

        // --- TEST 3: Public Technician Registration Restriction ---
        console.log('\n--- TEST 3: Attempting Technician Registration via Public API ---');
        const techRegPayload = {
            name: 'Hacker Tech',
            mobile: '9876543211',
            password: 'SecurePassword123',
            role: 'technician' // Malicious attempt to self-register as technician
        };
        const techRegRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(techRegPayload)
        });
        const techRegData = await techRegRes.json();
        assert(techRegData.user?.role === 'customer', 'Public registration forces role to customer and rejects technician role');

        // --- TEST 4: Customer Login ---
        console.log('\n--- TEST 4: Customer Login ---');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: '9876543210', password: 'SecurePassword123' })
        });
        const loginData = await loginRes.json();
        assert(loginRes.status === 200, 'Login returns HTTP 200');
        assert(loginData.success === true, 'Login success is true');
        assert(loginData.user?.role === 'customer', 'Logged in user role is customer');
        assert(loginData.user?.password === undefined, 'Password is NOT returned during login');

        // Wrong password test
        const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: '9876543210', password: 'WrongPassword' })
        });
        assert(badLoginRes.status === 401, 'Incorrect password returns HTTP 401');

        // --- TEST 5: Google OAuth Flow (New User) ---
        console.log('\n--- TEST 5: Google OAuth - New User Auto-Registration ---');
        const googleNewPayload = {
            googleUser: {
                id: 'google_oauth_sub_1001',
                email: 'googleuser1@example.com',
                name: 'Priya Patel',
                photo: 'https://lh3.googleusercontent.com/a/photo1'
            }
        };
        const googleNewRes = await fetch(`${BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(googleNewPayload)
        });
        const googleNewData = await googleNewRes.json();
        assert(googleNewRes.status === 200, 'Google auth returns HTTP 200');
        assert(googleNewData.success === true, 'Google auth success is true');
        assert(googleNewData.isNewUser === true, 'Identified as new Google user');
        assert(googleNewData.user?.role === 'customer', 'Google new user is created as customer');
        assert(googleNewData.user?.googleId === 'google_oauth_sub_1001', 'Google ID is stored');
        assert(googleNewData.user?.authProvider === 'google', 'Auth provider is google');

        // --- TEST 6: Google OAuth Flow (Existing User) ---
        console.log('\n--- TEST 6: Google OAuth - Existing User Login ---');
        const googleExistRes = await fetch(`${BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(googleNewPayload)
        });
        const googleExistData = await googleExistRes.json();
        assert(googleExistRes.status === 200, 'Existing Google login returns HTTP 200');
        assert(googleExistData.isNewUser === false, 'Identified as existing user');
        assert(googleExistData.user?.googleId === 'google_oauth_sub_1001', 'Existing Google user ID matches');

        const totalUsersWithGoogleId = await User.countDocuments({ googleId: 'google_oauth_sub_1001' });
        assert(totalUsersWithGoogleId === 1, 'No duplicate account created for same Google user');

        // --- TEST 7: Admin-Created Technician Account ---
        console.log('\n--- TEST 7: Admin-Created Technician Account ---');
        const adminTechPayload = {
            name: 'Ramesh Kumar',
            mobile: '9123456780',
            password: 'TechPassword2026',
            specialization: 'Split & Window AC Expert',
            city: 'Bhubaneswar',
            pincode: '751024'
        };

        const adminTechRes = await fetch(`${BASE_URL}/admin/technicians`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminTechPayload)
        });
        const adminTechData = await adminTechRes.json();
        assert(adminTechRes.status === 201, 'Admin technician creation returns HTTP 201');
        assert(adminTechData.success === true, 'Technician created successfully');
        assert(adminTechData.technician?.role === 'technician', 'Role assigned as technician');

        // Check Technician model record
        const techDoc = await Technician.findOne({ userId: adminTechData.technician.userId });
        assert(!!techDoc, 'Associated Technician document created in database');
        assert(techDoc?.verification?.adminVerified === true, 'Technician is admin-verified');

        // --- TEST 8: Technician Login & Dashboard Routing Validation ---
        console.log('\n--- TEST 8: Technician Login ---');
        const techLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: '9123456780', password: 'TechPassword2026' })
        });
        const techLoginData = await techLoginRes.json();
        assert(techLoginRes.status === 200, 'Technician login returns HTTP 200');
        assert(techLoginData.user?.role === 'technician', 'Backend identifies role as technician for dashboard routing');

        // --- TEST 9: Authenticated Profile & Middleware Verification ---
        console.log('\n--- TEST 9: Authentication Middleware ---');
        const meRes = await fetch(`${BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        const meData = await meRes.json();
        assert(meRes.status === 200, 'Authenticated GET /api/auth/me returns HTTP 200');
        assert(meData.user?.mobile === '9876543210', 'Profile matches authenticated customer');

        // Unauthenticated check
        const unauthRes = await fetch(`${BASE_URL}/auth/me`);
        assert(unauthRes.status === 401, 'Unauthenticated request rejected with HTTP 401');

        console.log(`\n========================================`);
        console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
        console.log(`========================================\n`);

        process.exit(failed > 0 ? 1 : 0);
    } catch (e) {
        console.error('Test execution error:', e);
        process.exit(1);
    }
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zyroac')
    .then(runTests)
    .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });
