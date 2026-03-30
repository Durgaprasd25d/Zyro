import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { Users, Briefcase, IndianRupee, Activity, TrendingUp, Calendar } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
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
        { label: 'Total Customers', value: stats.users, icon: Users, color: 'bg-blue-500', trend: '+12%' },
        { label: 'Technicians', value: stats.technicians, icon: Briefcase, color: 'bg-indigo-500', trend: '+5%' },
        { label: 'Active Services', value: activeJobs, icon: Activity, color: 'bg-rose-500', trend: 'Live' },
        { label: 'Total Earnings', value: `₹${(stats.revenue / 1000).toFixed(1)}K`, icon: IndianRupee, color: 'bg-emerald-500', trend: '+18%' },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-bold text-white">₹{payload[0].value.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-400 font-bold">{payload[1]?.value || 0} Jobs Completed</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight text-neutral-800">Platform Overview</h2>
                    <p className="text-slate-500 font-medium">Real-time snapshots of your service network</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm text-xs font-bold text-slate-500">
                    <Calendar size={14} />
                    Last 7 Days
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-4 rounded-2xl ${stat.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} className={stat.color.replace('bg-', 'text-')} />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.label === 'Active Services' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-1">{stat.value}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Revenue Velocity</h3>
                            <p className="text-sm text-slate-400 font-medium flex items-center gap-1">
                                <TrendingUp size={14} className="text-emerald-500" /> 
                                Daily platform earnings performance
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full mt-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.recentActivity}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                    dataKey="label" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}}
                                    dy={10}
                                />
                                <YAxis 
                                    hide 
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#3B82F6', strokeWidth: 2}} />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#3B82F6" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                    animationDuration={1500}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="jobs" 
                                    stroke="transparent" 
                                    fill="transparent" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Map Preview Card */}
                <div
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:border-blue-200 hover:shadow-2xl transition-all group overflow-hidden relative"
                    onClick={() => navigate('/map')}
                >
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Live Fleet</h3>
                            <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-lg shadow-blue-200">ACTIVE</span>
                        </div>
                        
                        <div className="mb-8">
                            <h4 className="text-5xl font-black text-slate-900 mb-2">{activeJobs}</h4>
                            <p className="text-sm font-bold text-slate-400 uppercase">Technicians on Duty</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-500">Operational Efficiency</span>
                                <span className="text-emerald-600">{stats.jobs > 0 ? ((stats.completedJobs / stats.jobs) * 100).toFixed(0) : 0}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                    style={{ width: `${stats.jobs > 0 ? (stats.completedJobs / stats.jobs) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-50 relative z-10">
                        <span className="text-sm text-blue-600 font-black group-hover:translate-x-2 inline-flex items-center gap-2 transition-transform">
                            Open Command Center <TrendingUp size={16} />
                        </span>
                    </div>

                    {/* Decorative Background Icon */}
                    <Activity size={120} className="absolute -bottom-10 -right-10 text-slate-50 opacity-10 group-hover:scale-125 transition-transform" />
                </div>
            </div>
        </div>
    );
}
