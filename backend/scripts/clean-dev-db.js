const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

async function cleanDevDatabase() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zyroac';
    console.log(`Connecting to database: ${mongoUri}...`);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Remove test data
    console.log('Cleaning test users, technicians, rides, and transactions...');
    await mongoose.connection.db.collection('rides').deleteMany({});
    await mongoose.connection.db.collection('transactions').deleteMany({});
    await mongoose.connection.db.collection('chats').deleteMany({});
    await mongoose.connection.db.collection('withdrawalrequests').deleteMany({});
    await mongoose.connection.db.collection('technicians').deleteMany({});
    
    // Remove all users except admin
    await mongoose.connection.db.collection('users').deleteMany({ role: { $ne: 'admin' }, mobile: { $ne: 'admin' } });

    // Ensure super admin exists and has bcrypt hashed password
    const adminUser = await mongoose.connection.db.collection('users').findOne({
        $or: [{ role: 'admin' }, { mobile: 'admin' }]
    });

    const hashedPassword = await bcrypt.hash('admin', 10);
    if (!adminUser) {
        await mongoose.connection.db.collection('users').insertOne({
            mobile: 'admin',
            name: 'Super Admin',
            role: 'admin',
            password: hashedPassword,
            isActive: true,
            authProvider: 'local',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('✅ Created default admin user (admin / admin)');
    } else {
        await mongoose.connection.db.collection('users').updateOne(
            { _id: adminUser._id },
            {
                $set: {
                    mobile: 'admin',
                    name: 'Super Admin',
                    role: 'admin',
                    password: hashedPassword,
                    isActive: true,
                    authProvider: 'local',
                    updatedAt: new Date()
                }
            }
        );
        console.log('✅ Updated super admin credentials (admin / admin)');
    }

    // Drop any old problematic unique indexes if needed
    try {
        const userIndexes = await mongoose.connection.db.collection('users').indexes();
        console.log('Current user collection indexes:', userIndexes.map(i => i.name));
    } catch (e) {
        console.log('Indexes check error:', e.message);
    }

    console.log('✨ Development database cleaned successfully.');
    await mongoose.disconnect();
    process.exit(0);
}

cleanDevDatabase().catch(err => {
    console.error('❌ Clean DB failed:', err);
    process.exit(1);
});
