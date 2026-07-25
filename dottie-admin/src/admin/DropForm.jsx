import React, { useState, useEffect } from 'react';

const DropForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        type: 'new-drop',
        image_url: '', // Main image
        images: [], // Additional images
        sizes: ['S', 'M', 'L', 'XL'], // Default sizes
        is_active: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                price: initialData.price.toString(),
                sizes: initialData.sizes || ['S', 'M', 'L', 'XL'],
                is_active: initialData.is_active !== undefined ? initialData.is_active : true
            });
        }
    }, [initialData]);

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
        if (!formData.image_url.trim() && formData.images.length === 0) newErrors.images = 'At least one image is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSizeToggle = (size) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size]
        }));
    };

    const handleImageAdd = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), url]
            }));
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const submissionData = {
                ...formData,
                price: parseFloat(formData.price),
                images: formData.image_url ? [formData.image_url, ...(formData.images || [])] : (formData.images || [])
            };
            // Clean up duplicates and ensure unique images
            submissionData.images = [...new Set(submissionData.images.filter(img => img.trim() !== ''))];
            onSubmit(submissionData);
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${initialData ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                {initialData ? 'Edit Drop' : 'Add New Drop'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-700'} text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                            placeholder="E.g., Winter Essential Hoodie"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            className={`w-full bg-slate-800 border ${errors.price ? 'border-red-500' : 'border-slate-700'} text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                            placeholder="0.00"
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                            <option value="new-drop">New Drop</option>
                            <option value="recent-drop">Recent Drop</option>
                            <option value="limited">Limited Edition</option>
                        </select>
                    </div>

                    <div className="flex items-end pb-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all"
                            />
                            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Active Status</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Available Sizes</label>
                    <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Uni'].map(size => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => handleSizeToggle(size)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${formData.sizes.includes(size)
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Primary Image URL</label>
                    <input
                        type="text"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        className={`w-full bg-slate-800 border ${errors.images ? 'border-red-500' : 'border-slate-700'} text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        placeholder="https://example.com/main-image.jpg"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-400">Additional Gallery Images</label>
                        <button
                            type="button"
                            onClick={handleImageAdd}
                            className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Image URL
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                        {formData.images && formData.images.map((url, index) => (
                            <div key={index} className="relative group w-20 h-20 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shadow-inner">
                                <img src={url} alt={`Drop ${index}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {(!formData.images || formData.images.length === 0) && (
                            <div className="w-full text-center py-4 text-slate-600 text-sm italic">
                                No additional images added to gallery
                            </div>
                        )}
                    </div>
                    {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-8 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95"
                    >
                        {initialData ? 'Update Drop' : 'Create & Notify'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DropForm;
