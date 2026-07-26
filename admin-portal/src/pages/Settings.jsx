import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';
import {
    Save,
    CheckCircle2,
} from 'lucide-react';

export default function Settings() {
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        platformFee: 0,
        gst: 0,
        maintenanceMode: false,
        autoApproval: false,
        notificationEmails: 'admin@zyro.com',
        minWithdrawal: 500
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/admin/settings`);
            if (response.data.success) {
                setSettings({
                    ...settings,
                    platformFee: response.data.settings.platformFee,
                    gst: response.data.settings.gst
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await axios.post(`${config.API_URL}/admin/settings`, {
                platformFee: Number(settings.platformFee),
                gst: Number(settings.gst)
            });
            if (response.data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            alert('Failed to save platform settings');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10 font-sans">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: ADMIN_COLORS.textPrimary }}>
                    System Settings
                </h2>
                <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                    Platform commission fee, GST tax rates & infrastructure parameters
                </p>
            </div>

            {saved && (
                <div 
                    className="p-4 rounded-2xl border text-xs font-extrabold flex items-center gap-2"
                    style={{ backgroundColor: ADMIN_COLORS.successBg, borderColor: 'rgba(74, 222, 128, 0.3)', color: ADMIN_COLORS.success }}
                >
                    <CheckCircle2 size={16} />
                    <span>System settings updated successfully!</span>
                </div>
            )}

            <div 
                className="p-8 rounded-3xl border space-y-6 shadow-xl"
                style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
            >
                <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
                    Billing & Platform Fees
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2" style={{ color: ADMIN_COLORS.textSecondary }}>
                            Platform Commission Fee (₹)
                        </label>
                        <input
                            type="number"
                            value={settings.platformFee}
                            onChange={(e) => setSettings({ ...settings, platformFee: e.target.value })}
                            className="w-full px-4 py-3.5 rounded-2xl border text-sm font-bold outline-none"
                            style={{ backgroundColor: '#1C1C1C', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                            placeholder="0"
                        />
                        <p className="text-[11px] mt-1.5" style={{ color: ADMIN_COLORS.textMuted }}>
                            Added as platform convenience charge on customer bookings.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase mb-2" style={{ color: ADMIN_COLORS.textSecondary }}>
                            GST Tax Rate (%)
                        </label>
                        <input
                            type="number"
                            value={settings.gst}
                            onChange={(e) => setSettings({ ...settings, gst: e.target.value })}
                            className="w-full px-4 py-3.5 rounded-2xl border text-sm font-bold outline-none"
                            style={{ backgroundColor: '#1C1C1C', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                            placeholder="0"
                        />
                        <p className="text-[11px] mt-1.5" style={{ color: ADMIN_COLORS.textMuted }}>
                            Applied to final bill total on completed service receipts.
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t flex justify-end" style={{ borderColor: ADMIN_COLORS.border }}>
                    <button
                        onClick={handleSave}
                        className="px-6 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg active:scale-95"
                        style={{ backgroundColor: ADMIN_COLORS.primary, borderColor: ADMIN_COLORS.borderGold, color: '#432B1E' }}
                    >
                        <Save size={16} />
                        <span>Save Configuration</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
