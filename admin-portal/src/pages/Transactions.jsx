import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';
import {
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Shuffle,
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';

const API_BASE = `${config.API_URL}/admin`;

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ credit: 0, debit: 0, settlement: 0 });
    const [viewMode, setViewMode] = useState('internal');

    const [filters, setFilters] = useState({
        type: '',
        status: '',
        search: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        fetchTransactions();
    }, [pagination.page, filters, viewMode]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            if (viewMode === 'internal') {
                const params = {
                    page: pagination.page,
                    limit: 15,
                    ...filters
                };
                const res = await axios.get(`${API_BASE}/transactions`, {
                    params,
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });

                if (res.data.success) {
                    setTransactions(res.data.transactions);
                    setPagination(prev => ({
                        ...prev,
                        pages: res.data.pagination.pages,
                        total: res.data.pagination.total
                    }));
                    if (res.data.stats) setStats(res.data.stats);
                }
            } else {
                // Razorpay Mode fallback
                setTransactions([]);
            }
        } catch (error) {
            console.error('Fetch transactions error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case 'CREDIT':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border" style={{ backgroundColor: ADMIN_COLORS.successBg, borderColor: 'rgba(74, 222, 128, 0.3)', color: ADMIN_COLORS.success }}><ArrowDownLeft size={12} /> Credit</span>;
            case 'DEBIT':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border" style={{ backgroundColor: ADMIN_COLORS.errorBg, borderColor: 'rgba(248, 113, 113, 0.3)', color: ADMIN_COLORS.error }}><ArrowUpRight size={12} /> Debit</span>;
            case 'SETTLEMENT':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border" style={{ backgroundColor: ADMIN_COLORS.infoBg, borderColor: 'rgba(96, 165, 250, 0.3)', color: ADMIN_COLORS.info }}><Shuffle size={12} /> Settlement</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#222', color: ADMIN_COLORS.textSecondary }}>{type}</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: ADMIN_COLORS.textPrimary }}>
                        Transaction Ledger
                    </h2>
                    <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                        Audit all wallet credits, platform commission debits & settlement transactions
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchTransactions}
                        className="p-2.5 rounded-2xl border transition-all active:scale-95"
                        style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div 
                className="p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4"
                style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
            >
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={16} style={{ color: ADMIN_COLORS.textMuted }} />
                    <input
                        type="text"
                        placeholder="Search TXN ID or technician..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-medium outline-none"
                        style={{ backgroundColor: '#1A1A1A', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="px-4 py-2.5 rounded-2xl border text-xs font-bold outline-none"
                        style={{ backgroundColor: '#1A1A1A', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                    >
                        <option value="">All Types</option>
                        <option value="CREDIT">CREDIT</option>
                        <option value="DEBIT">DEBIT</option>
                        <option value="SETTLEMENT">SETTLEMENT</option>
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="px-4 py-2.5 rounded-2xl border text-xs font-bold outline-none"
                        style={{ backgroundColor: '#1A1A1A', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                    >
                        <option value="">All Statuses</option>
                        <option value="SUCCESS">SUCCESS</option>
                        <option value="PENDING">PENDING</option>
                        <option value="FAILED">FAILED</option>
                    </select>
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
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>TXN ID</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>USER / TECH</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>TYPE</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>AMOUNT</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>REASON</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-right" style={{ color: ADMIN_COLORS.textSecondary }}>DATE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: ADMIN_COLORS.border }}>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm font-medium" style={{ color: ADMIN_COLORS.textMuted }}>
                                        Fetching transaction records...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm font-medium" style={{ color: ADMIN_COLORS.textMuted }}>
                                        No transaction records found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => (
                                    <tr key={txn._id} className="hover:bg-[#1A1A1A] transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-bold" style={{ color: ADMIN_COLORS.primary }}>
                                            #{txn.transactionId || txn._id?.substring(0, 10)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-sm text-white">{txn.userId?.name || 'Platform Admin'}</p>
                                            <p className="text-xs font-mono" style={{ color: ADMIN_COLORS.textMuted }}>{txn.userId?.mobile || 'System'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getTypeBadge(txn.type)}
                                        </td>
                                        <td className="px-6 py-4 font-black text-sm text-white">
                                            ₹{txn.amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium" style={{ color: ADMIN_COLORS.textSecondary }}>
                                            {txn.description || txn.reason || 'Service transaction'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-right" style={{ color: ADMIN_COLORS.textMuted }}>
                                            {new Date(txn.createdAt).toLocaleDateString()}
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
