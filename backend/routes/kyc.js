const express = require('express');
const router = express.Router();
const Technician = require('../models/Technician');

// Get current KYC status and documents
router.get('/status', async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const technician = await Technician.getOrCreate(userId);

        res.json({
            success: true,
            kycStatus: technician.verification.kycStatus,
            documents: technician.verification.documents,
            rejectionReason: technician.verification.rejectionReason,
            submittedAt: technician.verification.submittedAt,
            kycVerified: technician.verification.kycVerified
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit KYC for verification
router.post('/submit', async (req, res) => {
    try {
        const userId = req.query.userId || req.body.userId || req.user?.id;
        const { documents, bankDetails } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const technician = await Technician.getOrCreate(userId);

        // Check if already verified or pending
        if (technician.verification.kycStatus === 'VERIFIED') {
            return res.status(400).json({ success: false, error: 'KYC already verified' });
        }

        // Update documents and status
        if (!technician.verification) {
            technician.verification = {
                kycStatus: 'NOT_STARTED',
                kycVerified: false,
                documents: {}
            };
        }

        if (documents) {
            if (!technician.verification.documents) {
                technician.verification.documents = {};
            }
            for (let [key, val] of Object.entries(documents)) {
                if (key === 'aadharFront') key = 'aadhaarFront';
                if (key === 'aadharBack') key = 'aadhaarBack';
                if (typeof val === 'string' && val) {
                    technician.verification.documents[key] = { url: val, publicId: `doc_${Date.now()}` };
                } else if (val && typeof val === 'object' && val.url) {
                    technician.verification.documents[key] = val;
                }
            }
        }

        if (bankDetails) {
            if (!technician.verification.bankDetails) {
                technician.verification.bankDetails = {};
            }
            technician.verification.bankDetails = {
                ...technician.verification.bankDetails,
                ...bankDetails
            };
        }

        technician.verification.kycStatus = 'PENDING';
        technician.verification.submittedAt = new Date();
        technician.verification.rejectionReason = null; // Clear old reason if any

        await technician.save();

        res.json({
            success: true,
            message: 'KYC submitted successfully. Our team will verify it within 24-48 hours.',
            kycStatus: 'PENDING'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
