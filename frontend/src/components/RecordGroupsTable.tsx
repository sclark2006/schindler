import React from 'react';
import { List, Share2 } from 'lucide-react';

interface RecordGroupsTableProps {
    recordGroups: any[];
    registerService: (item: any, type: string) => void;
    createDevOpsTicket: (item: string) => void;
}

export const RecordGroupsTable: React.FC<RecordGroupsTableProps> = ({ recordGroups = [], registerService, createDevOpsTicket }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <List size={20} className="text-indigo-500" />
                Record Groups (Candidatos a Servicios GET)
            </h3>
            <div className="space-y-3">
                {recordGroups.length === 0 ? (
                    <p className="text-slate-500 italic">No se encontraron Record Groups.</p>
                ) : (
                    recordGroups.map((rg, i) => (
                        <div key={i} className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl group relative">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{rg.name}</span>
                                    <button onClick={() => registerService(rg, 'RECORD_GROUP')} className="text-slate-400 hover:text-blue-600" title="Register Service">
                                        <Share2 size={14} />
                                    </button>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded transition" onClick={() => createDevOpsTicket(`API GET para ${rg.name}`)}>+ Ticket</button>
                            </div>
                            <div className="mt-2 bg-white p-3 rounded-lg border border-indigo-100">
                                <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap overflow-x-auto">
                                    {rg.query || "Query no definido"}
                                </pre>
                            </div>
                            <code className="block mt-2 text-[10px] text-indigo-400">
                                GET /api/lov/{rg.name.toLowerCase()}
                            </code>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
