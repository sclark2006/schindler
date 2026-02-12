import React, { useEffect, useState } from 'react';
import { List, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const statusConfig: Record<string, { label: string; color: string }> = {
    'Pending': { label: 'Pending', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    'Proposed': { label: 'Proposed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'In Progress': { label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Migrated': { label: 'Migrated', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

interface RecordGroupsTableProps {
    recordGroups: any[];
    analysisId?: string;
    registerService: (item: any, type: string) => void;
    createDevOpsTicket: (item: string) => void;
    onRecordGroupSelect?: (name: string) => void;
}

export const RecordGroupsTable: React.FC<RecordGroupsTableProps> = ({ recordGroups = [], analysisId, onRecordGroupSelect }) => {
    const { token } = useAuth();
    const [blockStatuses, setBlockStatuses] = useState<Record<string, string>>({});

    useEffect(() => {
        if (analysisId && recordGroups.length > 0 && token) {
            fetchBlockStatuses();
        }
    }, [analysisId, recordGroups.length, token]);

    const fetchBlockStatuses = async () => {
        try {
            const res = await axios.post(`${API_URL}/ai/block-statuses`, {
                analysisId,
                blockNames: recordGroups.map(rg => rg.name)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBlockStatuses(res.data);
        } catch (error) {
            console.error('Failed to fetch record group statuses', error);
        }
    };

    const handleRowClick = (rgName: string) => {
        if (onRecordGroupSelect) {
            onRecordGroupSelect(rgName);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <List size={20} className="text-indigo-500" />
                Record Groups — GET Endpoint Candidates ({recordGroups.length})
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="pb-2 font-medium text-slate-500">Name</th>
                            <th className="pb-2 font-medium text-slate-500">Query</th>
                            <th className="pb-2 font-medium text-slate-500">Status</th>
                            <th className="pb-2 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recordGroups.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500 italic">No record groups found.</td>
                            </tr>
                        ) : (
                            recordGroups.map((rg, i) => {
                                const status = blockStatuses[rg.name] || 'Pending';
                                const cfg = statusConfig[status] || statusConfig['Pending'];
                                return (
                                    <tr
                                        key={i}
                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer"
                                        onClick={() => handleRowClick(rg.name)}
                                    >
                                        <td className="py-3 font-medium text-slate-800">{rg.name}</td>
                                        <td className="py-3 text-slate-500 text-xs font-mono max-w-[300px] truncate" title={rg.query}>
                                            {rg.query ? rg.query.substring(0, 60) + (rg.query.length > 60 ? '...' : '') : 'N/A'}
                                        </td>
                                        <td className="py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowClick(rg.name); }}
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
