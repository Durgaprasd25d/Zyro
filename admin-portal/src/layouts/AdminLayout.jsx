import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import ADMIN_COLORS from '../theme/colors';
import {
    LayoutDashboard,
    Users,
    MapPin,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    ShieldCheck,
    Briefcase,
    Sparkles
} from 'lucide-react';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const navSections = [
        {
            label: 'Operations',
            items: [
                { name: 'Dashboard', path: '/', icon: LayoutDashboard },
                { name: 'Live Map', path: '/map', icon: MapPin },
            ]
        },
        {
            label: 'Management',
            items: [
                { name: 'Technicians', path: '/technicians', icon: Users },
                { name: 'KYC Center', path: '/kyc', icon: ShieldCheck },
                { name: 'Service Catalog', path: '/services', icon: Briefcase },
            ]
        },
        {
            label: 'Accounting',
            items: [
                { name: 'Transaction Ledger', path: '/transactions', icon: CreditCard },
                { name: 'Payout Requests', path: '/payouts', icon: CreditCard },
            ]
        },
        {
            label: 'Infrastructure',
            items: [
                { name: 'System Settings', path: '/settings', icon: Settings },
            ]
        }
    ];

    return (
        <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: ADMIN_COLORS.bg }}>
            {/* Sidebar */}
            <aside
                className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:flex flex-col border-r shadow-2xl z-20`}
                style={{ 
                    backgroundColor: ADMIN_COLORS.sidebarBg,
                    borderColor: ADMIN_COLORS.border
                }}
            >
                <div 
                    className="h-16 flex items-center justify-between px-4 border-b"
                    style={{ borderColor: ADMIN_COLORS.border }}
                >
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" style={{ color: ADMIN_COLORS.primary }} />
                            <h2 className="text-lg font-black tracking-wider" style={{ color: ADMIN_COLORS.textPrimary }}>
                                ZYRO <span style={{ color: ADMIN_COLORS.primary }}>ADMIN</span>
                            </h2>
                        </div>
                    ) : (
                        <span className="font-black text-lg mx-auto" style={{ color: ADMIN_COLORS.primary }}>ZA</span>
                    )}
                </div>

                <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto custom-scrollbar">
                    {navSections.map((section) => (
                        <div key={section.label} className="space-y-2">
                            {isSidebarOpen && (
                                <h3 
                                    className="px-3 text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                                    style={{ color: ADMIN_COLORS.textMuted }}
                                >
                                    {section.label}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                                isActive
                                                    ? 'font-bold shadow-lg'
                                                    : 'hover:bg-[#1C1C1C]'
                                            }`
                                        }
                                        style={({ isActive }) => ({
                                            backgroundColor: isActive ? ADMIN_COLORS.primary : 'transparent',
                                            color: isActive ? '#432B1E' : ADMIN_COLORS.textSecondary,
                                            boxShadow: isActive ? '0 4px 20px rgba(230, 190, 171, 0.25)' : 'none'
                                        })}
                                    >
                                        <item.icon size={18} className={`${isSidebarOpen ? '' : 'mx-auto'}`} />
                                        {isSidebarOpen && <span className="text-sm">{item.name}</span>}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t" style={{ borderColor: ADMIN_COLORS.border }}>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-red-500/10 ${!isSidebarOpen && 'justify-center'}`}
                        style={{ color: ADMIN_COLORS.error }}
                    >
                        <LogOut size={18} />
                        {isSidebarOpen && <span>Logout Session</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: ADMIN_COLORS.bg }}>
                {/* Header */}
                <header 
                    className="h-16 flex items-center justify-between px-6 border-b z-10"
                    style={{ 
                        backgroundColor: ADMIN_COLORS.surface,
                        borderColor: ADMIN_COLORS.border
                    }}
                >
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-xl border transition-colors hover:bg-[#1C1C1C]"
                        style={{ 
                            borderColor: ADMIN_COLORS.border,
                            color: ADMIN_COLORS.textPrimary
                        }}
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs font-extrabold uppercase tracking-wider" style={{ color: ADMIN_COLORS.primary }}>
                                Super Admin
                            </div>
                            <div className="text-xs" style={{ color: ADMIN_COLORS.textMuted }}>
                                admin@zyro.com
                            </div>
                        </div>
                        <div 
                            className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm border shadow-sm"
                            style={{ 
                                backgroundColor: ADMIN_COLORS.primary,
                                color: '#432B1E',
                                borderColor: ADMIN_COLORS.borderGold
                            }}
                        >
                            A
                        </div>
                    </div>
                </header>

                {/* Page View Outlet */}
                <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: ADMIN_COLORS.bg, color: ADMIN_COLORS.textPrimary }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
