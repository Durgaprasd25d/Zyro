import { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';

export default function Withdrawals() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${config.API_URL}/admin/withdrawals?status=${filter}`);
            if (response.data.success) {
                setRequests(response.data.withdrawals);
            }
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        const note = prompt('Enter admin note (optional):');
        try {
            const response = await axios.post(`${config.API_URL}/admin/withdrawals/${id}/status`, {
                status,
                adminNote: note
            });
            if (response.data.success) {
                fetchRequests();
            }
        } catch (error) {
            alert('Action failed');
        }
    };

    const markPaid = async (id) => {
        const txId = prompt('Enter Transaction ID / Reference:');
        if (!txId) return;

        try {
            const response = await axios.post(`${config.API_URL}/admin/withdrawals/${id}/mark-paid`, {
                transactionId: txId
            });
            if (response.data.success) {
                fetchRequests();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Payout processing failed');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: ADMIN_COLORS.textPrimary }}>
                        Payout Requests
                    </h2>
                    <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                        Approve technician earnings withdrawal requests & transfer payouts
                    </p>
                </div>

                <div 
                    className="flex gap-1.5 p-1.5 rounded-2xl border self-start md:self-auto"
                    style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                >
                    {['pending', 'approved', 'rejected'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className="px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all"
                            style={{ 
                                backgroundColor: filter === tab ? ADMIN_COLORS.primary : 'transparent',
                                color: filter === tab ? '#432B1E' : ADMIN_COLORS.textSecondary
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div 
                className="rounded-3xl border overflow-hidden shadow-xl"
                style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: '#1A1A1A', borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>TECHNICIAN</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>AMOUNT</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>BANK / UPI DETAILS</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>STATUS</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-right" style={{ color: ADMIN_COLORS.textSecondary }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: ADMIN_COLORS.border }}>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-sm font-medium" style={{ color: ADMIN_COLORS.textMuted }}>
                                        Loading payout requests...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-sm font-medium" style={{ color: ADMIN_COLORS.textMuted }}>
                                        No {filter} withdrawal requests.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req._id} className="hover:bg-[#1A1A1A] transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm text-white">{req.technicianId?.userId?.name || 'Technician'}</p>
                                            <p className="text-xs font-mono" style={{ color: ADMIN_COLORS.textMuted }}>{req.technicianId?.userId?.mobile}</p>
                                        </td>
                                        <td className="px-6 py-4 font-black text-base" style={{ color: ADMIN_COLORS.primary }}>
                                            ₹{req.amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-white">
                                            {req.payoutDetails?.upiId ? (
                                                <span>UPI: {req.payoutDetails.upiId}</span>
                                            ) : req.payoutDetails?.accountNumber ? (
                                                <span>Acc: {req.payoutDetails.accountNumber} • IFSC: {req.payoutDetails.ifscCode}</span>
                                            ) : (
                                                <span style={{ color: ADMIN_COLORS.textMuted }}>Manual Transfer</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span 
                                                className="px-3 py-1 rounded-full text-xs font-bold uppercase border"
                                                style={{ 
                                                    backgroundColor: req.status === 'APPROVED' ? ADMIN_COLORS.successBg : req.status === 'REJECTED' ? ADMIN_COLORS.errorBg : ADMIN_COLORS.warningBg,
                                                    borderColor: req.status === 'APPROVED' ? 'rgba(74, 222, 128, 0.3)' : req.status === 'REJECTED' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(251, 191, 36, 0.3)',
                                                    color: req.status === 'APPROVED' ? ADMIN_COLORS.success : req.status === 'REJECTED' ? ADMIN_COLORS.error : ADMIN_COLORS.warning
                                                }}
                                            >
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'PENDING' && (
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => markPaid(req._id)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95 shadow-md"
                                                        style={{ backgroundColor: ADMIN_COLORS.primary, borderColor: ADMIN_COLORS.borderGold, color: '#432B1E' }}
                                                    >
                                                        Mark Paid
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(req._id, 'REJECTED')}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95"
                                                        style={{ backgroundColor: ADMIN_COLORS.errorBg, borderColor: 'rgba(248, 113, 113, 0.3)', color: ADMIN_COLORS.error }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
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
