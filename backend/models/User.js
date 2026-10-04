const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    mobile: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: function () {
            return this.authProvider === 'local';
        }
    },
    name: {
        type: String,
        default: '',
        trim: true
    },
    email: {
        type: String,
        default: null,
        trim: true,
        lowercase: true
    },
    googleId: {
        type: String,
        trim: true,
        sparse: true,
        unique: true
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'firebase'],
        default: 'local'
    },
    avatar: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['customer', 'technician', 'admin'],
        default: 'customer'
    },
    specialization: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    fcmToken: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Unspecified'],
        default: 'Unspecified'
    },
    alternateMobile: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    pincode: {
        type: String,
        default: ''
    },
    landmark: {
        type: String,
        default: ''
    },
    addresses: [{
        label: String, // Home, Work, etc.
        address: String,
        lat: Number,
        lng: Number,
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    lastLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        address: { type: String, default: '' },
        lastUpdated: { type: Date, default: null }
    }
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Safe JSON serialization (never expose password)
UserSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ mobile: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('User', UserSchema);
