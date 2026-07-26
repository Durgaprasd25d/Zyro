import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';
import { Users, Briefcase, IndianRupee, Activity, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState({
        users: 0,
        technicians: 0,
        jobs: 0,
        completedJobs: 0,
        revenue: 0,
        commission: 0,
        wallets: 0,
        dues: 0,
        recentActivity: []
    });
    const [activeJobs, setActiveJobs] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
        fetchActiveJobs();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/admin/stats`);
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveJobs = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/admin/active-jobs`);
            if (response.data.success) {
                setActiveJobs(response.data.jobs.length);
            }
        } catch (error) {
            console.error('Error fetching active jobs:', error);
        }
    };

    const statCards = [
        { label: 'Total Customers', value: stats.users, icon: Users, color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.12)', trend: '+12%' },
        { label: 'Technicians', value: stats.technicians, icon: Briefcase, color: '#C084FC', bg: 'rgba(192, 132, 252, 0.12)', trend: '+5%' },
        { label: 'Active Services', value: activeJobs, icon: Activity, color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', trend: 'Live' },
        { label: 'Total Revenue', value: `₹${(stats.revenue / 1000).toFixed(1)}K`, icon: IndianRupee, color: ADMIN_COLORS.primary, bg: 'rgba(230, 190, 171, 0.12)', trend: '+18%' },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div 
                    className="p-4 rounded-2xl border shadow-2xl backdrop-blur-md"
                    style={{ 
                        backgroundColor: '#1C1C1C', 
                        borderColor: '#2D2D2D' 
                    }}
                >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: ADMIN_COLORS.textMuted }}>{label}</p>
                    <p className="text-base font-black text-white">₹{payload[0].value.toLocaleString()}</p>
                    <p className="text-xs font-bold" style={{ color: ADMIN_COLORS.primary }}>{payload[1]?.value || 0} Services Finished</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10 font-sans">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: ADMIN_COLORS.textPrimary }}>
                        Platform Overview
                    </h2>
                    <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                        Real-time metrics, live fleet activity & platform revenue
                    </p>
                </div>

                <div 
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold self-start sm:self-auto"
                    style={{ 
                        backgroundColor: ADMIN_COLORS.surface,
                        borderColor: ADMIN_COLORS.border,
                        color: ADMIN_COLORS.textSecondary
                    }}
                >
                    <Calendar size={14} style={{ color: ADMIN_COLORS.primary }} />
                    <span>Last 7 Days</span>
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div 
                        key={index} 
                        className="p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group"
                        style={{ 
                            backgroundColor: ADMIN_COLORS.surface,
                            borderColor: ADMIN_COLORS.border,
                        }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div 
                                className="p-3.5 rounded-2xl transition-transform group-hover:scale-110"
                                style={{ backgroundColor: stat.bg }}
                            >
                                <stat.icon size={22} style={{ color: stat.color }} />
                            </div>
                            <span 
                                className="text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider"
                                style={{ 
                                    backgroundColor: stat.label === 'Active Services' ? ADMIN_COLORS.errorBg : 'rgba(74, 222, 128, 0.1)',
                                    borderColor: stat.label === 'Active Services' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(74, 222, 128, 0.3)',
                                    color: stat.label === 'Active Services' ? ADMIN_COLORS.error : ADMIN_COLORS.success
                                }}
                            >
                                {stat.trend}
                            </span>
                        </div>

                        <h3 className="text-3xl font-black mb-1 text-white tracking-tight">
                            {loading ? <span className="opacity-40 animate-pulse">...</span> : stat.value}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid: Chart + Live Fleet */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div 
                    className="lg:col-span-2 p-7 rounded-3xl border flex flex-col min-h-[440px]"
                    style={{ 
                        backgroundColor: ADMIN_COLORS.surface,
                        borderColor: ADMIN_COLORS.border
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold" style={{ color: ADMIN_COLORS.textPrimary }}>
                                Revenue Velocity
                            </h3>
                            <p className="text-xs font-medium flex items-center gap-1.5 mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                                <TrendingUp size={14} style={{ color: ADMIN_COLORS.primary }} /> 
                                Daily platform income & service velocity
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full mt-2">
                        <ResponsiveContainer width="100%" height={290}>
                            <AreaChart data={stats.recentActivity || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={ADMIN_COLORS.primary} stopOpacity={0.35} />
                                        <stop offset="95%" stopColor={ADMIN_COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222222" />
                                <XAxis 
                                    dataKey="label" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: ADMIN_COLORS.textSecondary, fontSize: 11, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: ADMIN_COLORS.primary, strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke={ADMIN_COLORS.primary} 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                    animationDuration={1200}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Fleet Overview Card */}
                <div
                    className="p-7 rounded-3xl border flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-[#E6BEAB]/40 group"
                    style={{ 
                        backgroundColor: ADMIN_COLORS.surface,
                        borderColor: ADMIN_COLORS.border
                    }}
                    onClick={() => navigate('/map')}
                >
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
                                Live Fleet
                            </h3>
                            <span 
                                className="text-[10px] px-3 py-1 rounded-full font-extrabold uppercase tracking-widest border"
                                style={{ 
                                    backgroundColor: 'rgba(74, 222, 128, 0.15)',
                                    borderColor: 'rgba(74, 222, 128, 0.3)',
                                    color: ADMIN_COLORS.success
                                }}
                            >
                                ACTIVE
                            </span>
                        </div>
                        
                        <div className="mb-8">
                            <h4 className="text-5xl font-black text-white mb-2">{activeJobs}</h4>
                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: ADMIN_COLORS.textSecondary }}>
                                Technicians On Duty
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span style={{ color: ADMIN_COLORS.textSecondary }}>Completion Efficiency</span>
                                <span style={{ color: ADMIN_COLORS.primary }}>
                                    {stats.jobs > 0 ? ((stats.completedJobs / stats.jobs) * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#222222' }}>
                                <div 
                                    className="h-full rounded-full transition-all duration-1000" 
                                    style={{ 
                                        backgroundColor: ADMIN_COLORS.primary,
                                        width: `${stats.jobs > 0 ? (stats.completedJobs / stats.jobs) * 100 : 0}%` 
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t" style={{ borderColor: ADMIN_COLORS.border }}>
                        <span 
                            className="text-xs font-extrabold group-hover:translate-x-1 inline-flex items-center gap-1.5 transition-transform"
                            style={{ color: ADMIN_COLORS.primary }}
                        >
                            <span>Open Live Map Command Center</span>
                            <ArrowUpRight size={16} />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
