import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';
import { ShieldCheck, Eye, EyeOff, Lock, User, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function Login() {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [autoFilled, setAutoFilled] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${config.API_URL}/auth/login`, {
                mobile: mobile.trim(),
                password: password.trim()
            });

            if (response.data.success) {
                if (response.data.user.role !== 'admin') {
                    setError('Access Denied: Admin privileges required.');
                    return;
                }
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(response.data.user));
                navigate('/');
            } else {
                setError(response.data.error || 'Invalid admin credentials');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAutoFill = () => {
        setMobile('admin');
        setPassword('admin');
        setAutoFilled(true);
        setError('');
        setTimeout(() => setAutoFilled(false), 2000);
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans p-4"
            style={{ backgroundColor: ADMIN_COLORS.bg }}
        >
            {/* Background Ambient Glow Gradients */}
            <div 
                className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
                style={{ backgroundColor: ADMIN_COLORS.primary }}
            />
            <div 
                className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-15"
                style={{ backgroundColor: ADMIN_COLORS.primaryDark }}
            />
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none opacity-10"
                style={{ backgroundColor: ADMIN_COLORS.primaryGlow }}
            />

            {/* Subtle Grid Overlay Pattern */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(${ADMIN_COLORS.textPrimary} 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Login Card Container */}
            <div className="w-full max-w-md z-10">
                {/* Brand Logo & Portal Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-4 shadow-sm"
                        style={{ 
                            backgroundColor: ADMIN_COLORS.surface,
                            borderColor: ADMIN_COLORS.borderGold,
                        }}
                    >
                        <Sparkles className="w-3.5 h-3.5" style={{ color: ADMIN_COLORS.primary }} />
                        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ADMIN_COLORS.primary }}>
                            Control Center
                        </span>
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: ADMIN_COLORS.textPrimary }}>
                        ZYRO <span style={{ color: ADMIN_COLORS.primary }}>ADMIN</span>
                    </h1>
                    <p className="text-sm mt-2 font-medium" style={{ color: ADMIN_COLORS.textSecondary }}>
                        Authenticate to access platform management console
                    </p>
                </div>

                {/* Main Glass Card */}
                <div 
                    className="p-8 rounded-3xl shadow-2xl backdrop-blur-xl border transition-all duration-300"
                    style={{ 
                        backgroundColor: 'rgba(20, 20, 20, 0.85)',
                        borderColor: ADMIN_COLORS.border,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                    }}
                >
                    {/* Error Banner */}
                    {error && (
                        <div 
                            className="p-4 rounded-xl mb-6 text-sm font-semibold flex items-center gap-3 border animate-shake"
                            style={{ 
                                backgroundColor: ADMIN_COLORS.errorBg,
                                borderColor: 'rgba(248, 113, 113, 0.3)',
                                color: ADMIN_COLORS.error
                            }}
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Auto Fill Success Pill */}
                    {autoFilled && (
                        <div 
                            className="p-3 rounded-xl mb-6 text-xs font-bold flex items-center justify-center gap-2 border animate-fadeIn"
                            style={{ 
                                backgroundColor: ADMIN_COLORS.successBg,
                                borderColor: 'rgba(74, 222, 128, 0.3)',
                                color: ADMIN_COLORS.success
                            }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Default Admin Credentials Loaded!</span>
                        </div>
                    )}

                    {/* Quick Demo Credentials Banner */}
                    <div 
                        className="mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 group"
                        style={{ 
                            backgroundColor: ADMIN_COLORS.surfaceElevated,
                            borderColor: ADMIN_COLORS.borderLight
                        }}
                    >
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: ADMIN_COLORS.primary }}>
                                Quick Credentials
                            </div>
                            <div className="text-xs font-mono" style={{ color: ADMIN_COLORS.textSecondary }}>
                                Username: <span className="text-white font-semibold">admin</span> • Pass: <span className="text-white font-semibold">admin</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleQuickAutoFill}
                            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95 shadow-md"
                            style={{ 
                                backgroundColor: ADMIN_COLORS.primary,
                                color: '#432B1E'
                            }}
                        >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Auto-Fill</span>
                        </button>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Username / Mobile Field */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: ADMIN_COLORS.textSecondary }}>
                                Admin Identifier / Mobile
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-4 h-4" style={{ color: ADMIN_COLORS.textMuted }} />
                                </div>
                                <input
                                    type="text"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 outline-none border focus:ring-2"
                                    style={{
                                        backgroundColor: ADMIN_COLORS.surfaceElevated,
                                        borderColor: ADMIN_COLORS.border,
                                        color: ADMIN_COLORS.textPrimary,
                                    }}
                                    placeholder="Enter 'admin' or registered mobile"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: ADMIN_COLORS.textSecondary }}>
                                Security Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4" style={{ color: ADMIN_COLORS.textMuted }} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 outline-none border"
                                    style={{
                                        backgroundColor: ADMIN_COLORS.surfaceElevated,
                                        borderColor: ADMIN_COLORS.border,
                                        color: ADMIN_COLORS.textPrimary,
                                    }}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                                    style={{ color: ADMIN_COLORS.textMuted }}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 hover:text-white" />
                                    ) : (
                                        <Eye className="w-4 h-4 hover:text-white" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-extrabold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            style={{ 
                                backgroundColor: ADMIN_COLORS.primary,
                                color: '#432B1E',
                                boxShadow: '0 8px 25px rgba(230, 190, 171, 0.25)'
                            }}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Authenticating Admin...</span>
                                </div>
                            ) : (
                                <>
                                    <span>ACCESS ADMIN PORTAL</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Security Badges */}
                <div className="mt-8 flex items-center justify-center gap-6 text-xs font-semibold" style={{ color: ADMIN_COLORS.textMuted }}>
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" style={{ color: ADMIN_COLORS.primary }} />
                        <span>256-Bit SSL Encrypted</span>
                    </div>
                    <span>•</span>
                    <div>Role-Based Access Control</div>
                </div>
            </div>
        </div>
    );
}
