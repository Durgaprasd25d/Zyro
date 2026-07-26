import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Search, ShieldCheck, Lock, Unlock } from 'lucide-react';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';

export default function Technicians() {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: ADMIN_COLORS.textMuted }} />
                    <input
                        type="text"
                        placeholder="Search by name or mobile..."
                        className="pl-10 pr-4 py-2.5 rounded-2xl border text-sm font-medium outline-none transition-all w-72"
                        style={{ 
                            backgroundColor: ADMIN_COLORS.surface,
                            borderColor: ADMIN_COLORS.border,
                            color: ADMIN_COLORS.textPrimary
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

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
