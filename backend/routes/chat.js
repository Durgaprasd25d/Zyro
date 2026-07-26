const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');

// Get chat history for a customer
router.get('/messages/:userId', async (req, res) => {
    try {
        const messages = await Chat.find({ userId: req.params.userId })
            .sort({ createdAt: 1 })
            .limit(100);

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark all messages as read for a specific user
router.put('/mark-read', async (req, res) => {
    try {
        const { userId, role } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'Missing userId' });
        }

        // If admin marks as read, clear unread customer messages; if customer marks, clear admin messages
        const senderRoleToClear = role === 'admin' ? 'customer' : 'admin';

        await Chat.updateMany(
            { userId, senderRole: senderRoleToClear, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Post message via HTTP fallback
router.post('/send', async (req, res) => {
    try {
        const { userId, text, senderRole = 'customer' } = req.body;
        if (!userId || !text) {
            return res.status(400).json({ success: false, error: 'Missing userId or text' });
        }

        const chatMsg = await Chat.create({
            userId,
            senderRole,
            text,
            isRead: senderRole === 'admin'
        });

        res.json({
            success: true,
            message: chatMsg
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin: Get all active support conversations with unread counts
router.get('/conversations', async (req, res) => {
    try {
        const chatUsers = await Chat.distinct('userId');
        const conversations = await Promise.all(
            chatUsers.map(async (uid) => {
                const user = await User.findById(uid).select('name mobile role email');
                const lastMsg = await Chat.findOne({ userId: uid }).sort({ createdAt: -1 });
                const unreadCount = await Chat.countDocuments({ userId: uid, senderRole: 'customer', isRead: false });

                return {
                    userId: uid,
                    user,
                    lastMessage: lastMsg,
                    unreadCount
                };
            })
        );

        conversations.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));

        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
