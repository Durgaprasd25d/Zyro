import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import ADMIN_COLORS from '../theme/colors';
import {
    Plus,
    Edit2,
    Trash2,
    LayoutGrid,
    Package,
    X,
    Save,
    Search
} from 'lucide-react';

const API_BASE = `${config.API_URL}/services`;

export default function Services() {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form States
    const [serviceForm, setServiceForm] = useState({
        name: '', price: '', time: '1 hr', description: '', category: ''
    });
    const [categoryForm, setCategoryForm] = useState({
        name: '', slug: '', icon: 'build-outline'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, serRes] = await Promise.all([
                axios.get(`${config.API_URL}/services/categories`),
                axios.get(`${config.API_URL}/services/all`)
            ]);
            setCategories(catRes.data.data);
            setServices(serRes.data.data);
            if (catRes.data.data.length > 0 && !activeTab) {
                setActiveTab(catRes.data.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`${API_BASE}/${editingItem._id}`, serviceForm);
            } else {
                await axios.post(`${API_BASE}/`, { ...serviceForm, category: activeTab });
            }
            setShowServiceModal(false);
            fetchData();
        } catch (error) {
            alert('Error saving service');
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`${API_BASE}/categories/${editingItem._id}`, categoryForm);
            } else {
                await axios.post(`${API_BASE}/categories`, categoryForm);
            }
            setShowCategoryModal(false);
            fetchData();
        } catch (error) {
            alert('Error saving category');
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Delete service item?')) return;
        try {
            await axios.delete(`${API_BASE}/${id}`);
            fetchData();
        } catch (error) {
            alert('Error deleting service');
        }
    };

    const openServiceModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setServiceForm({
                name: item.name,
                price: item.price,
                time: item.time || '1 hr',
                description: item.description || '',
                category: item.category?._id || item.category
            });
        } else {
            setServiceForm({ name: '', price: '', time: '1 hr', description: '', category: activeTab });
        }
        setShowServiceModal(true);
    };

    const openCategoryModal = (cat = null) => {
        setEditingItem(cat);
        if (cat) {
            setCategoryForm({ name: cat.name, slug: cat.slug, icon: cat.icon });
        } else {
            setCategoryForm({ name: '', slug: '', icon: 'build-outline' });
        }
        setShowCategoryModal(true);
    };

    const filteredServices = services.filter(s => {
        const matchesCategory = activeTab ? (s.category?._id === activeTab || s.category === activeTab) : true;
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: ADMIN_COLORS.textPrimary }}>
                        Service Catalog Management
                    </h2>
                    <p className="text-sm font-medium mt-1" style={{ color: ADMIN_COLORS.textSecondary }}>
                        Configure pricing, categories & AC service details offered on Zyro customer app
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => openCategoryModal()}
                        className="px-4 py-2.5 rounded-2xl text-xs font-extrabold border flex items-center gap-2 transition-all active:scale-95"
                        style={{ backgroundColor: ADMIN_COLORS.surfaceElevated, borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                    >
                        <Plus size={16} />
                        <span>Add Category</span>
                    </button>

                    <button
                        onClick={() => openServiceModal()}
                        className="px-4 py-2.5 rounded-2xl text-xs font-extrabold border flex items-center gap-2 transition-all active:scale-95 shadow-lg"
                        style={{ backgroundColor: ADMIN_COLORS.primary, borderColor: ADMIN_COLORS.borderGold, color: '#432B1E' }}
                    >
                        <Plus size={16} />
                        <span>Add Service</span>
                    </button>
                </div>
            </div>

            {/* Categories Horizontal Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {categories.map((cat) => {
                    const isActive = activeTab === cat._id;
                    return (
                        <button
                            key={cat._id}
                            onClick={() => setActiveTab(cat._id)}
                            className="px-5 py-3 rounded-2xl text-xs font-extrabold transition-all border whitespace-nowrap flex items-center gap-2"
                            style={{ 
                                backgroundColor: isActive ? ADMIN_COLORS.primary : ADMIN_COLORS.surface,
                                borderColor: isActive ? ADMIN_COLORS.primary : ADMIN_COLORS.border,
                                color: isActive ? '#432B1E' : ADMIN_COLORS.textSecondary
                            }}
                        >
                            <span>{cat.name}</span>
                            <span 
                                className="px-2 py-0.5 rounded-full text-[10px] font-black"
                                style={{ 
                                    backgroundColor: isActive ? 'rgba(67, 43, 30, 0.15)' : '#222222',
                                    color: isActive ? '#432B1E' : ADMIN_COLORS.textPrimary
                                }}
                            >
                                {services.filter(s => s.category?._id === cat._id || s.category === cat._id).length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-16 text-center text-sm font-semibold" style={{ color: ADMIN_COLORS.textMuted }}>
                        Loading services catalog...
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div 
                        className="col-span-full p-12 rounded-3xl border text-center"
                        style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                    >
                        <Package size={40} className="mx-auto mb-3" style={{ color: ADMIN_COLORS.primary }} />
                        <p className="font-bold text-white text-base">No services found</p>
                        <p className="text-xs mt-1" style={{ color: ADMIN_COLORS.textMuted }}>
                            Click "Add Service" above to add items to this category.
                        </p>
                    </div>
                ) : (
                    filteredServices.map((service) => (
                        <div
                            key={service._id}
                            className="p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#E6BEAB]/40 group"
                            style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                        >
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-extrabold text-base text-white">{service.name}</h3>
                                    <span className="text-lg font-black text-white" style={{ color: ADMIN_COLORS.primary }}>
                                        ₹{service.price}
                                    </span>
                                </div>
                                <p className="text-xs line-clamp-2 mb-4 leading-relaxed" style={{ color: ADMIN_COLORS.textSecondary }}>
                                    {service.description || 'Professional technician diagnostic & resolution.'}
                                </p>
                            </div>

                            <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: ADMIN_COLORS.border }}>
                                <span className="text-xs font-semibold" style={{ color: ADMIN_COLORS.textMuted }}>
                                    Est. Time: {service.time || '1 hr'}
                                </span>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openServiceModal(service)}
                                        className="p-2 rounded-xl border transition-all active:scale-95"
                                        style={{ backgroundColor: '#1C1C1C', borderColor: '#2D2D2D', color: ADMIN_COLORS.primary }}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteService(service._id)}
                                        className="p-2 rounded-xl border transition-all active:scale-95"
                                        style={{ backgroundColor: ADMIN_COLORS.errorBg, borderColor: 'rgba(248, 113, 113, 0.3)', color: ADMIN_COLORS.error }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Service Edit / Add Modal */}
            {showServiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div 
                        className="w-full max-w-lg p-7 rounded-3xl border shadow-2xl space-y-5"
                        style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                    >
                        <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: ADMIN_COLORS.border }}>
                            <h3 className="text-lg font-extrabold text-white">
                                {editingItem ? 'Edit Service Details' : 'Create New Service'}
                            </h3>
                            <button onClick={() => setShowServiceModal(false)} className="p-1 rounded-full text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleServiceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>Service Name</label>
                                <input
                                    type="text"
                                    required
                                    value={serviceForm.name}
                                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none"
                                    style={{ backgroundColor: '#1C1C1C', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                    placeholder="e.g. Deep Foam Jet Wash"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>Base Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={serviceForm.price}
                                        onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none"
                                        style={{ backgroundColor: '#1C1C1C', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                        placeholder="e.g. 499"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>Est. Duration</label>
                                    <input
                                        type="text"
                                        value={serviceForm.time}
                                        onChange={(e) => setServiceForm({ ...serviceForm, time: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none"
                                        style={{ backgroundColor: '#1C1C1C', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                        placeholder="e.g. 45 mins"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>Description</label>
                                <textarea
                                    rows={3}
                                    value={serviceForm.description}
                                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none"
                                    style={{ backgroundColor: '#1C1C1C', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                    placeholder="Service inclusions and procedure..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg mt-2"
                                style={{ backgroundColor: ADMIN_COLORS.primary, color: '#432B1E' }}
                            >
                                Save Service Details
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Edit / Add Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div 
                        className="w-full max-w-md p-7 rounded-3xl border shadow-2xl space-y-5"
                        style={{ backgroundColor: ADMIN_COLORS.surface, borderColor: ADMIN_COLORS.border }}
                    >
                        <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: ADMIN_COLORS.border }}>
                            <h3 className="text-lg font-extrabold text-white">
                                {editingItem ? 'Edit Category' : 'Create Category'}
                            </h3>
                            <button onClick={() => setShowCategoryModal(false)} className="p-1 rounded-full text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>Category Name</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    className="w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none"
                                    style={{ backgroundColor: '#1C1C1C', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                    placeholder="e.g. Chemical Cleaning"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: ADMIN_COLORS.textSecondary }}>Slug</label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.slug}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                                    className="w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none"
                                    style={{ backgroundColor: '#1C1C1C', borderColor: ADMIN_COLORS.border, color: ADMIN_COLORS.textPrimary }}
                                    placeholder="e.g. chemical-cleaning"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg mt-2"
                                style={{ backgroundColor: ADMIN_COLORS.primary, color: '#432B1E' }}
                            >
                                Save Category
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
