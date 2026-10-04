import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Search, ShieldCheck, Lock, Unlock, UserPlus, X, Phone, User, KeyRound, Wrench, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';

export default function Technicians() {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        password: '',
        specialization: 'General AC Specialist',
        city: 'Bhubaneswar',
        pincode: '',
        preApproved: true,
    });

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/admin/technicians`);
            if (response.data.success) {
                setTechnicians(response.data.technicians);
            }
        } catch (error) {
            console.error('Error fetching technicians:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTechnician = async (e) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');

        if (!formData.name.trim()) {
            setCreateError('Technician name is required.');
            return;
        }

        const cleanPhone = formData.mobile.replace(/^\+91/, '').replace(/\D/g, '').trim();
        if (cleanPhone.length !== 10) {
            setCreateError('Please enter a valid 10-digit mobile number.');
            return;
        }

        setCreateLoading(true);
        try {
            const response = await axios.post(`${config.API_URL}/admin/technicians`, {
                name: formData.name.trim(),
                mobile: cleanPhone,
                password: formData.password.trim() || '123456',
                specialization: formData.specialization,
                city: formData.city.trim(),
                pincode: formData.pincode.trim(),
                preApproved: formData.preApproved,
            });

            if (response.data.success) {
                setCreateSuccess('Technician created successfully!');
                setFormData({
                    name: '',
                    mobile: '',
                    password: '',
                    specialization: 'General AC Specialist',
                    city: 'Bhubaneswar',
                    pincode: '',
                    preApproved: true,
                });
                fetchTechnicians();
                setTimeout(() => {
                    setShowCreateModal(false);
                    setCreateSuccess('');
                }, 1200);
            } else {
                setCreateError(response.data.error || 'Failed to create technician.');
            }
        } catch (err) {
            setCreateError(err.response?.data?.error || err.response?.data?.message || 'Failed to create technician.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleKycVerify = async (userId, status) => {
        if (status === 'REJECTED') {
            const reason = window.prompt('Reason for rejection:');
            if (!reason) return;
            await submitVerification(userId, 'verify-kyc', { status, reason });
        } else {
            if (!window.confirm('Approve KYC documents?')) return;
            await submitVerification(userId, 'verify-kyc', { status });
        }
    };

    const handlePayoutVerify = async (userId, isVerified) => {
        if (!window.confirm(`Are you sure you want to ${isVerified ? 'ENABLE' : 'DISABLE'} payouts?`)) return;
        await submitVerification(userId, 'verify-payout', { isVerified });
    };

    const submitVerification = async (userId, endpoint, data) => {
        try {
            const response = await axios.post(`${config.API_URL}/admin/technicians/${userId}/${endpoint}`, data);
            if (response.data.success) {
                fetchTechnicians(); // Refresh
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Action failed');
        }
    };

    const filteredTechs = technicians.filter(t =>
        t.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userId?.mobile?.includes(searchTerm)
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: ADMIN_COLORS.textPrimary }}>
                        Technician Fleet
                    </h2>
                    <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                        Manage partner verifications, wallet balances & payout permissions
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: ADMIN_COLORS.textMuted }} />
                        <input
                            type="text"
                            placeholder="Search by name or mobile..."
                            className="pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium outline-none transition-all w-64 md:w-72"
                            style={{ 
                                backgroundColor: ADMIN_COLORS.surface,
                                borderColor: ADMIN_COLORS.border,
                                color: ADMIN_COLORS.textPrimary
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => {
                            setCreateError('');
                            setCreateSuccess('');
                            setShowCreateModal(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm tracking-wide shadow-lg transition-all active:scale-95 cursor-pointer"
                        style={{
                            backgroundColor: ADMIN_COLORS.primary,
                            color: '#000000',
                        }}
                    >
                        <UserPlus size={18} />
                        Add Technician
                    </button>
                </div>
            </div>

            {/* Create Technician Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div 
                        className="w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden p-6 md:p-8 space-y-6"
                        style={{ 
                            backgroundColor: ADMIN_COLORS.surface,
                            borderColor: ADMIN_COLORS.border,
                        }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: ADMIN_COLORS.border }}>
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{ backgroundColor: ADMIN_COLORS.primaryGlow, color: ADMIN_COLORS.primary }}
                                >
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-white">Create Technician Account</h3>
                                    <p className="text-xs font-medium" style={{ color: ADMIN_COLORS.textSecondary }}>
                                        Provision a new technician partner with instant login credentials
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Error / Success Feedback */}
                        {createError && (
                            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold border" style={{ backgroundColor: ADMIN_COLORS.errorBg, borderColor: 'rgba(248, 113, 113, 0.3)', color: ADMIN_COLORS.error }}>
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{createError}</span>
                            </div>
                        )}
                        {createSuccess && (
                            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold border" style={{ backgroundColor: ADMIN_COLORS.successBg, borderColor: 'rgba(74, 222, 128, 0.3)', color: ADMIN_COLORS.success }}>
                                <CheckCircle2 size={16} className="shrink-0" />
                                <span>{createSuccess}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleCreateTechnician} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: ADMIN_COLORS.textMuted }} />
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Ramesh Kumar"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium outline-none transition-all"
                                            style={{ backgroundColor: ADMIN_COLORS.surfaceElevated, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                        />
                                    </div>
                                </div>

                                {/* Mobile */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>
                                        Mobile Number *
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3.5 text-xs font-bold" style={{ color: ADMIN_COLORS.primary }}>+91</span>
                                        <input
                                            type="tel"
                                            required
                                            maxLength={10}
                                            placeholder="10-digit mobile"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                                            className="w-full pl-12 pr-4 py-2.5 rounded-2xl border text-sm font-medium outline-none transition-all"
                                            style={{ backgroundColor: ADMIN_COLORS.surfaceElevated, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>
                                        Password <span className="text-gray-500 font-normal normal-case">(Default: 123456)</span>
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: ADMIN_COLORS.textMuted }} />
                                        <input
                                            type="text"
                                            placeholder="123456"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium outline-none transition-all font-mono"
                                            style={{ backgroundColor: ADMIN_COLORS.surfaceElevated, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                        />
                                    </div>
                                </div>

                                {/* Specialization */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>
                                        Specialization
                                    </label>
                                    <div className="relative">
                                        <Wrench className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: ADMIN_COLORS.textMuted }} />
                                        <select
                                            value={formData.specialization}
                                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium outline-none transition-all appearance-none cursor-pointer"
                                            style={{ backgroundColor: ADMIN_COLORS.surfaceElevated, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                        >
                                            <option value="General AC Specialist">General AC Specialist</option>
                                            <option value="AC Deep Cleaning">AC Deep Cleaning</option>
                                            <option value="AC Installation & Repair">AC Installation & Repair</option>
                                            <option value="Gas Leak & Refill">Gas Leak & Refill</option>
                                            <option value="Compressor & Electrical Specialist">Compressor & Electrical Specialist</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* City */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>
                                        City / Operating Area
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: ADMIN_COLORS.textMuted }} />
                                        <input
                                            type="text"
                                            placeholder="e.g. Bhubaneswar"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium outline-none transition-all"
                                            style={{ backgroundColor: ADMIN_COLORS.surfaceElevated, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                        />
                                    </div>
                                </div>

                                {/* Pre-approval switch */}
                                <div className="flex items-center justify-between p-3 rounded-2xl border mt-auto" style={{ backgroundColor: ADMIN_COLORS.surfaceElevated, borderColor: ADMIN_COLORS.border }}>
                                    <div>
                                        <p className="text-xs font-bold text-white">Pre-Approve KYC & Payout</p>
                                        <p className="text-[11px]" style={{ color: ADMIN_COLORS.textMuted }}>Allow immediate job acceptance</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.preApproved}
                                        onChange={(e) => setFormData({ ...formData, preApproved: e.target.checked })}
                                        className="w-5 h-5 accent-[#E6BEAB] rounded cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: ADMIN_COLORS.border }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-5 py-2.5 rounded-2xl border text-sm font-bold transition-all hover:bg-white/5 cursor-pointer"
                                    style={{ borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textSecondary }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="px-6 py-2.5 rounded-2xl text-sm font-extrabold tracking-wide shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                                    style={{ backgroundColor: ADMIN_COLORS.primary, color: '#000000' }}
                                >
                                    {createLoading ? 'Creating...' : 'Create Technician'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div 
                className="rounded-3xl border overflow-hidden shadow-xl"
                style={{ 
                    backgroundColor: ADMIN_COLORS.surface,
                    borderColor: ADMIN_COLORS.border
                }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: '#1A1A1A', borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>TECHNICIAN</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>CONTACT</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>WALLET</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>KYC STATUS</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>PAYOUTS</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-right" style={{ color: ADMIN_COLORS.textSecondary }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: ADMIN_COLORS.border }}>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm font-medium" style={{ color: ADMIN_COLORS.textMuted }}>
                                        Loading technician registry...
                                    </td>
                                </tr>
                            ) : filteredTechs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm font-medium" style={{ color: ADMIN_COLORS.textMuted }}>
                                        No technicians found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredTechs.map((tech) => (
                                    <tr key={tech._id} className="hover:bg-[#1A1A1A] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border"
                                                    style={{ 
                                                        backgroundColor: ADMIN_COLORS.surfaceElevated,
                                                        borderColor: ADMIN_COLORS.border,
                                                        color: ADMIN_COLORS.primary
                                                    }}
                                                >
                                                    {tech.userId?.name?.charAt(0) || 'T'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-white">{tech.userId?.name || 'N/A'}</p>
                                                    <p className="text-xs font-mono mt-0.5" style={{ color: ADMIN_COLORS.textMuted }}>
                                                        ID: {tech.userId?._id?.substring(0, 8)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-white">{tech.userId?.mobile || 'N/A'}</p>
                                            <p className="text-xs mt-0.5" style={{ color: ADMIN_COLORS.textMuted }}>
                                                Joined: {new Date(tech.createdAt).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-extrabold text-sm text-white">₹{tech.wallet?.balance?.toLocaleString() || 0}</p>
                                            <p className="text-xs font-medium mt-0.5" style={{ color: ADMIN_COLORS.textMuted }}>
                                                Locked: ₹{tech.wallet?.lockedAmount?.toLocaleString() || 0}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tech.verification?.kycStatus === 'VERIFIED' ? (
                                                <span 
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                                                    style={{ backgroundColor: ADMIN_COLORS.successBg, borderColor: 'rgba(74, 222, 128, 0.3)', color: ADMIN_COLORS.success }}
                                                >
                                                    Verified
                                                </span>
                                            ) : tech.verification?.kycStatus === 'PENDING' ? (
                                                <span 
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                                                    style={{ backgroundColor: ADMIN_COLORS.warningBg, borderColor: 'rgba(251, 191, 36, 0.3)', color: ADMIN_COLORS.warning }}
                                                >
                                                    Pending Review
                                                </span>
                                            ) : (
                                                <span 
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                                                    style={{ backgroundColor: '#222222', borderColor: '#333333', color: ADMIN_COLORS.textSecondary }}
                                                >
                                                    {tech.verification?.kycStatus || 'Not Started'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {tech.verification?.adminVerified ? (
                                                <span 
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                                                    style={{ backgroundColor: ADMIN_COLORS.infoBg, borderColor: 'rgba(96, 165, 250, 0.3)', color: ADMIN_COLORS.info }}
                                                >
                                                    Payout Enabled
                                                </span>
                                            ) : (
                                                <span 
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                                                    style={{ backgroundColor: '#222222', borderColor: '#333333', color: ADMIN_COLORS.textMuted }}
                                                >
                                                    Payout Locked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex flex-col gap-1.5 items-end">
                                                {tech.verification?.kycStatus !== 'VERIFIED' && (
                                                    <button
                                                        onClick={() => handleKycVerify(tech.userId?._id, 'VERIFIED')}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95"
                                                        style={{ 
                                                            backgroundColor: ADMIN_COLORS.successBg, 
                                                            borderColor: 'rgba(74, 222, 128, 0.3)', 
                                                            color: ADMIN_COLORS.success 
                                                        }}
                                                    >
                                                        Approve KYC
                                                    </button>
                                                )}
                                                {tech.verification?.kycStatus === 'VERIFIED' && !tech.verification?.adminVerified && (
                                                    <button
                                                        onClick={() => handlePayoutVerify(tech.userId?._id, true)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95"
                                                        style={{ 
                                                            backgroundColor: ADMIN_COLORS.infoBg, 
                                                            borderColor: 'rgba(96, 165, 250, 0.3)', 
                                                            color: ADMIN_COLORS.info 
                                                        }}
                                                    >
                                                        Unlock Payout
                                                    </button>
                                                )}
                                                {tech.verification?.adminVerified && (
                                                    <button
                                                        onClick={() => handlePayoutVerify(tech.userId?._id, false)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95"
                                                        style={{ 
                                                            backgroundColor: ADMIN_COLORS.errorBg, 
                                                            borderColor: 'rgba(248, 113, 113, 0.3)', 
                                                            color: ADMIN_COLORS.error 
                                                        }}
                                                    >
                                                        Lock Payout
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
