import React, { useState, useEffect } from 'react';
import DropList from './DropList';
import DropForm from './DropForm';
import DropService from './DropService';

const AdminDrops = () => {
    const [drops, setDrops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingDrop, setEditingDrop] = useState(null);
    const [notification, setNotification] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchDrops();
    }, [filter]);

    const fetchDrops = async () => {
        setLoading(true);
        try {
            // DropService.getDrops already extracts response.data.drops and returns the array
            const dropsArray = await DropService.getDrops(filter === 'active');
            console.log("RAW DROPS FROM SERVICE:", dropsArray);

            // Client-side safety normalization — guards against any null/undefined fields
            // even if the backend normalization has a gap
            const safe = (Array.isArray(dropsArray) ? dropsArray : []).map(drop => ({
                ...drop,
                id: drop.id,
                title: (drop.title || '').trim() || 'Untitled Drop',
                description: drop.description || '',
                image: parseImage(drop.image),
                status: drop.status || 'upcoming',
                price: drop.price != null ? drop.price : 0
            }));

            setDrops(safe);
        } catch (error) {
            console.error('fetchDrops failed:', error);
            showNotification('error', 'Failed to fetch drops');
            setDrops([]);
        } finally {
            setLoading(false);
        }
    };

    // Resolve image to a usable URL or null — matches backend logic for client-side safety
    const parseImage = (imageField) => {
        if (!imageField) return null;
        if (typeof imageField === 'string' && imageField.startsWith('[')) {
            try {
                const parsed = JSON.parse(imageField);
                return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
            } catch (_) {
                return imageField; // treat as raw URL
            }
        }
        if (Array.isArray(imageField)) return imageField[0] || null;
        return imageField;
    };

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleAddClick = () => {
        setEditingDrop(null);
        setView('form');
    };

    const handleEditClick = (drop) => {
        setEditingDrop(drop);
        setView('form');
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingDrop) {
                await DropService.updateDrop(editingDrop.id, formData);
                showNotification('success', 'Drop updated successfully!');
            } else {
                await DropService.createDrop(formData);
                showNotification('success', 'New drop created and notifications sent!');
            }
            setView('list');
            fetchDrops();
        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this drop? This action cannot be undone.')) {
            try {
                await DropService.deleteDrop(id);
                showNotification('success', 'Drop deleted successfully');
                fetchDrops();
            } catch (error) {
                showNotification('error', 'Failed to delete drop');
            }
        }
    };

    const handleFilterChange = (status) => {
        setFilter(status);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Drops Management</h1>
                    <p className="text-slate-400 mt-1">Manage your shop's product drops and notifications.</p>
                </div>

                {view === 'list' && (
                    <button
                        onClick={handleAddClick}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Drop
                    </button>
                )}
            </div>

            {/* Notifications */}
            {notification && (
                <div className={`p-4 rounded-xl border animate-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : 'bg-red-900/20 border-red-500/50 text-red-400'
                    }`}>
                    <div className="flex items-center gap-3">
                        {notification.type === 'success' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <p className="font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 animate-pulse">Loading drops data...</p>
                    </div>
                ) : view === 'list' ? (
                    <DropList
                        drops={drops}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        onStatusFilter={handleFilterChange}
                    />
                ) : (
                    <DropForm
                        initialData={editingDrop}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setView('list')}
                    />
                )}
            </div>
        </div>
    );
};

export default AdminDrops;
