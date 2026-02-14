import React, { useEffect, useState } from 'react';
import { Server, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

interface BlocksTableProps {
    blocks: any[];
    analysisId?: string;
    setSelectedItem?: (item: any) => void;
    createDevOpsTicket?: (title: string, description?: string) => void;
    onBlockSelect?: (blockName: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    'Pending': { label: 'Pending', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    'Proposed': { label: 'Proposed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'In Progress': { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Migrated': { label: 'Migrated', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const BlocksTable: React.FC<BlocksTableProps> = ({ blocks = [], analysisId, onBlockSelect }) => {
    const { token } = useAuth();
    const [blockStatuses, setBlockStatuses] = useState<Record<string, string>>({});

    const dataBlocks = blocks.filter(b => b.dataSource && b.dataSource !== 'None' && b.dataSource !== 'Unknown');

    useEffect(() => {
        if (analysisId && dataBlocks.length > 0 && token) {
            fetchBlockStatuses();
        }
    }, [analysisId, blocks.length, token]);

    const fetchBlockStatuses = async () => {
        try {
            const res = await axios.post(`${API_URL}/ai/block-statuses`, {
                analysisId,
                blockNames: dataBlocks.map(b => b.name)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlockStatuses(res.data);
        } catch (error) {
            console.error('Failed to fetch block statuses', error);
        }
    };

    const handleRowClick = (blockName: string) => {
        if (onBlockSelect) {
            onBlockSelect(blockName);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Server size={20} className="text-indigo-600" />
                Data Blocks Detected ({dataBlocks.length})
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="pb-2 font-medium text-slate-500">Block Name</th>
                            <th className="pb-2 font-medium text-slate-500">Data Source</th>
                            <th className="pb-2 font-medium text-slate-500">Items</th>
                            <th className="pb-2 font-medium text-slate-500">Status</th>
                            <th className="pb-2 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataBlocks.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-4 text-center text-slate-500 italic">No data blocks found.</td>
                            </tr>
                        ) : (
                            dataBlocks.map((b, i) => {
                                const status = blockStatuses[b.name] || 'Pending';
                                const cfg = statusConfig[status] || statusConfig['Pending'];
                                return (
                                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer" onClick={() => handleRowClick(b.name)}>
                                        <td className="py-2 font-medium">{b.name}</td>
                                        <td className="py-2 text-slate-500 text-xs">
                                            {b.dataSource}
                                            {b.dataSourceType !== 'Unknown' && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-[10px]">{b.dataSourceType}</span>}
                                        </td>
                                        <td className="py-2 text-slate-500 text-xs">{b.itemsCount}</td>
                                        <td className="py-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="py-2 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(b.name); }}
                                                className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold flex items-center justify-end gap-1 ml-auto"
                                            >
                                                View Details <ArrowRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
