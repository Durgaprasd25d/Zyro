const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    platformFee: {
        type: Number,
        default: 49, // Flat ₹49 default
        required: true
    },
    gst: {
        type: Number,
        default: 18, // 18% default
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
