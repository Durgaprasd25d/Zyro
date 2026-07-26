import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';
import { CheckCircle, XCircle, Eye, AlertCircle, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

export default function KYCCenter() {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTech, setSelectedTech] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewMode, setViewMode] = useState('PENDING');

    useEffect(() => {
        fetchTechnicians();
    }, [viewMode]);

    const fetchTechnicians = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${config.API_URL}/admin/technicians/verification-list`, {
                params: { status: viewMode }
            });
            if (response.data.success) {
                if (viewMode === 'VERIFIED') {
                    setTechnicians(response.data.technicians.filter(t => !t.verification?.adminVerified));
                } else {
                    setTechnicians(response.data.technicians);
                }
            }
        } catch (error) {
            console.error('Error fetching technicians:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (userId, status) => {
        if (status === 'REJECTED' && !rejectionReason) {
            alert('Please provide a reason for rejection');
            return;
        }

        if (!window.confirm(`Are you sure you want to mark this KYC as ${status}?`)) return;

        setIsProcessing(true);
        try {
            const response = await axios.post(`${config.API_URL}/admin/technicians/${userId}/verify-kyc`, {
                status,
                reason: status === 'REJECTED' ? rejectionReason : null
            });

            if (response.data.success) {
                setSelectedTech(null);
                setRejectionReason('');
                fetchTechnicians();
            }
        } catch (error) {
            alert('Operation failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayoutVerify = async (userId, isVerified) => {
        if (!window.confirm(`Are you sure you want to ${isVerified ? 'ENABLE' : 'DISABLE'} payouts for this technician?`)) return;

        setIsProcessing(true);
        try {
            const response = await axios.post(`${config.API_URL}/admin/technicians/${userId}/verify-payout`, {
                isVerified
            });

            if (response.data.success) {
                setSelectedTech(null);
                fetchTechnicians();
            }
        } catch (error) {
            alert('Payout verification failed');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 text-sm font-semibold" style={{ color: ADMIN_COLORS.textSecondary }}>
                <Clock className="animate-spin mr-2" style={{ color: ADMIN_COLORS.primary }} size={20} />
                Loading trust & safety requests...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: ADMIN_COLORS.textPrimary }}>
                        Trust & Safety Center
                    </h2>
                    <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                        Review government ID documents, bank verification & enable payouts
                    </p>
                </div>

                <div 
                    className="flex gap-1.5 p-1.5 rounded-2xl border self-start md:self-auto"
                    style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                >
                    <button
                        onClick={() => setViewMode('PENDING')}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all"
                        style={{ 
                            backgroundColor: viewMode === 'PENDING' ? ADMIN_COLORS.primary : 'transparent',
                            color: viewMode === 'PENDING' ? '#432B1E' : ADMIN_COLORS.textSecondary
                        }}
                    >
                        KYC Pending ({viewMode === 'PENDING' ? technicians.length : '...'})
                    </button>
                    <button
                        onClick={() => setViewMode('VERIFIED')}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all"
                        style={{ 
                            backgroundColor: viewMode === 'VERIFIED' ? ADMIN_COLORS.primary : 'transparent',
                            color: viewMode === 'VERIFIED' ? '#432B1E' : ADMIN_COLORS.textSecondary
                        }}
                    >
                        Payout Authorization ({viewMode === 'VERIFIED' ? technicians.length : '...'})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* List of Pending Technicians */}
                <div className="lg:col-span-4 space-y-3">
                    {technicians.length === 0 ? (
                        <div 
                            className="p-8 rounded-3xl text-center border"
                            style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                        >
                            <CheckCircle size={36} className="mx-auto mb-3" style={{ color: ADMIN_COLORS.success }} />
                            <p className="font-bold text-white">All Clear!</p>
                            <p className="text-xs mt-1" style={{ color: ADMIN_COLORS.textMuted }}>
                                No pending requests for review.
                            </p>
                        </div>
                    ) : (
                        technicians.map(tech => {
                            const isSelected = selectedTech?._id === tech._id;
                            return (
                                <button
                                    key={tech._id}
                                    onClick={() => setSelectedTech(tech)}
                                    className="w-full text-left p-4 rounded-3xl border transition-all duration-200"
                                    style={{ 
                                        backgroundColor: isSelected ? '#1F1A17' : ADMIN_COLORS.surface,
                                        borderColor: isSelected ? ADMIN_COLORS.primary : ADMIN_COLORS.border,
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-1.5">
                                        <h3 className="font-bold text-sm text-white uppercase">{tech.userId?.name || 'Unknown Tech'}</h3>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border" style={{ backgroundColor: '#222', borderColor: '#333', color: ADMIN_COLORS.textSecondary }}>
                                            ID: {tech._id.slice(-6)}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium mb-2" style={{ color: ADMIN_COLORS.textSecondary }}>{tech.userId?.mobile}</p>
                                    <div className="text-[11px] font-bold flex items-center gap-1" style={{ color: ADMIN_COLORS.primary }}>
                                        <Clock size={12} />
                                        Submitted {new Date(tech.verification?.submittedAt || Date.now()).toLocaleDateString()}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Document Viewer */}
                <div className="lg:col-span-8">
                    {selectedTech ? (
                        <div 
                            className="rounded-3xl border shadow-2xl overflow-hidden flex flex-col min-h-[500px]"
                            style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                        >
                            <div className="p-6 border-b flex justify-between items-center" style={{ backgroundColor: '#1A1A1A', borderColor: ADMIN_COLORS.border }}>
                                <div>
                                    <h3 className="text-lg font-extrabold text-white">{selectedTech.userId?.name}</h3>
                                    <p className="text-xs font-medium" style={{ color: ADMIN_COLORS.textSecondary }}>
                                        Mobile: {selectedTech.userId?.mobile}
                                    </p>
                                </div>
                                <span className="text-xs font-mono px-3 py-1 rounded-full border" style={{ backgroundColor: '#222', borderColor: '#333', color: ADMIN_COLORS.primary }}>
                                    {selectedTech.verification?.kycStatus}
                                </span>
                            </div>

                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                {/* Documents list */}
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: ADMIN_COLORS.textSecondary }}>
                                        Submitted Identity Proof Documents
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedTech.verification?.documents?.map((doc, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl border" style={{ backgroundColor: '#1A1A1A', borderColor: ADMIN_COLORS.border }}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold uppercase text-white">{doc.type || 'ID Card'}</span>
                                                    <a 
                                                        href={doc.url} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="text-xs font-bold flex items-center gap-1"
                                                        style={{ color: ADMIN_COLORS.primary }}
                                                    >
                                                        <span>Open File</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                                <p className="text-xs font-mono" style={{ color: ADMIN_COLORS.textMuted }}>{doc.number || 'No ID Number provided'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rejection reason input */}
                                {viewMode === 'PENDING' && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: ADMIN_COLORS.textSecondary }}>
                                            Rejection Reason (If denying request)
                                        </label>
                                        <input
                                            type="text"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Specify document issues (e.g. Blurry Aadhaar card)..."
                                            className="w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none"
                                            style={{ backgroundColor: '#1A1A1A', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="p-6 border-t flex items-center justify-end gap-3" style={{ backgroundColor: '#161616', borderColor: ADMIN_COLORS.border }}>
                                {viewMode === 'PENDING' ? (
                                    <>
                                        <button
                                            onClick={() => handleVerify(selectedTech.userId?._id, 'REJECTED')}
                                            disabled={isProcessing}
                                            className="px-5 py-3 rounded-2xl text-xs font-extrabold border transition-all active:scale-95"
                                            style={{ backgroundColor: ADMIN_COLORS.errorBg, borderColor: 'rgba(248, 113, 113, 0.3)', color: ADMIN_COLORS.error }}
                                        >
                                            Reject KYC
                                        </button>
                                        <button
                                            onClick={() => handleVerify(selectedTech.userId?._id, 'VERIFIED')}
                                            disabled={isProcessing}
                                            className="px-5 py-3 rounded-2xl text-xs font-extrabold border transition-all active:scale-95 shadow-lg"
                                            style={{ backgroundColor: ADMIN_COLORS.primary, borderColor: ADMIN_COLORS.borderGold, color: '#432B1E' }}
                                        >
                                            Approve KYC
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handlePayoutVerify(selectedTech.userId?._id, true)}
                                        disabled={isProcessing}
                                        className="px-5 py-3 rounded-2xl text-xs font-extrabold border transition-all active:scale-95 shadow-lg"
                                        style={{ backgroundColor: ADMIN_COLORS.primary, borderColor: ADMIN_COLORS.borderGold, color: '#432B1E' }}
                                    >
                                        Enable Payout Accounts
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="p-16 rounded-3xl border text-center flex flex-col items-center justify-center min-h-[500px]"
                            style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                        >
                            <ShieldCheck size={48} style={{ color: ADMIN_COLORS.primary }} className="mb-4" />
                            <h3 className="text-lg font-bold text-white">Select a Technician Request</h3>
                            <p className="text-xs font-medium mt-1 max-w-sm" style={{ color: ADMIN_COLORS.textSecondary }}>
                                Choose any technician from the left queue to inspect verification documents and approve access.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
