const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');
const { sendToUser, sendPushNotification } = require('../services/notificationService');

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zyroac');
    console.log('Connected to MongoDB.');

    const usersWithTokens = await User.find({ fcmToken: { $exists: true, $ne: null } });
    console.log(`Found ${usersWithTokens.length} user(s) with Push/FCM tokens:`);

    for (const u of usersWithTokens) {
        console.log(`- User: ${u.name} (${u.role}) | Token: ${u.fcmToken.substring(0, 25)}...`);
        const result = await sendToUser(u._id, {
            title: 'Zyro AC • Service Alert ❄️',
            body: 'Technician is en route to your location with all tools.',
            data: { screen: 'History', orderId: 'ZYRO-AC-9081' }
        });
        console.log('Notification Dispatch Result:', result);
    }

    await mongoose.disconnect();
}

runTest().catch(console.error);
