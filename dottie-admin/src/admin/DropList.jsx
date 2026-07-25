import React from 'react';

const DropList = ({ drops, onEdit, onDelete, onStatusFilter }) => {
    console.log("DROPS STATE:", drops);

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Current Drops</h2>
                <div className="flex gap-2">
                    <select
                        onChange={(e) => onStatusFilter(e.target.value)}
                        className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Drops</option>
                        <option value="active">Active Only</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                            <th className="px-6 py-4 font-medium">Drop</th>
                            <th className="px-6 py-4 font-medium">Price</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {(!Array.isArray(drops) || drops.length === 0) ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                                    No drops found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            drops.map((drop) => (
                                <tr key={drop.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                                                {(() => {
                                                    let imgSrc = drop.image;
                                                    
                                                    // Handle images stored as stringified JSON or raw arrays
                                                    try {
                                                        if (typeof imgSrc === 'string' && imgSrc.startsWith('[')) {
                                                            const parsed = JSON.parse(imgSrc);
                                                            imgSrc = Array.isArray(parsed) ? parsed[0] : imgSrc;
                                                        } else if (Array.isArray(imgSrc)) {
                                                            imgSrc = imgSrc[0];
                                                        }
                                                    } catch (e) {
                                                        console.warn("Image resolution failed for drop:", drop.id, e);
                                                    }
                                                    
                                                    return imgSrc ? (
                                                        <img src={imgSrc} alt={drop.title || 'Drop Image'} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/placeholder.jpg'; e.target.onerror = null; }} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px] font-bold text-center uppercase">No Image</div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-200">{drop.title || "Untitled Drop"}</span>
                                                <span className="text-[10px] text-slate-500 line-clamp-1">{drop.description}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                                        ${parseFloat(drop.price || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                            drop.status === 'live' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/10' :
                                            drop.status === 'upcoming' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/10' :
                                            drop.status === 'reservation' ? 'bg-amber-900/40 text-amber-400 border border-amber-500/10' :
                                            'bg-slate-800 text-slate-500 border border-slate-700'
                                        }`}>
                                            {drop.status || 'closed'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(drop)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onDelete(drop.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 3h.01" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DropList;
