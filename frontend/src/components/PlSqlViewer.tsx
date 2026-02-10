import React, { useState } from 'react';
import { Code, Search, Share2, ArrowRight } from 'lucide-react';

interface PlSqlViewerProps {
    triggers: any[];
    programUnits: any[];
    setSelectedItem: (item: any) => void;
    registerService: (item: any, type: string) => void;
    createDevOpsTicket: (title: string, description?: string) => void;
}

export const PlSqlViewer: React.FC<PlSqlViewerProps> = ({ triggers, programUnits, setSelectedItem, registerService, createDevOpsTicket }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTriggers = triggers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredProgramUnits = programUnits.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar Trigger o Program Unit..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Triggers Column */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Code size={20} className="text-orange-500" />
                        Triggers ({filteredTriggers.length})
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filteredTriggers.map((t, i) => (
                            <div
                                key={i}
                                className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer group"
                                onClick={() => setSelectedItem({ ...t, type: 'Trigger', complexityType: 'Logic', reason: 'Form Logic', recommendation: 'Review hooks/handlers' })}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm text-slate-700">{t.name}</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t.parentBlock}</span>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="text-xs text-slate-400">{t.loc} líneas</span>
                                    <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                        Ver Código <ArrowRight size={10} />
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); createDevOpsTicket(`Refactor Trigger: ${t.name}`, `Analyze and refactor logic for trigger ${t.name} in block ${t.parentBlock}. LOC: ${t.loc}`); }}
                                    className="mt-2 w-full text-center text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1 rounded transition opacity-0 group-hover:opacity-100"
                                >
                                    Crear Ticket
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Program Units Column */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Code size={20} className="text-purple-500" />
                        Program Units ({filteredProgramUnits.length})
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {filteredProgramUnits.map((p, i) => (
                            <div
                                key={i}
                                className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer group"
                                onClick={() => setSelectedItem({ ...p, type: 'ProgramUnit', complexityType: 'Logic', reason: 'Shared Logic', recommendation: 'Move to Service/Utils' })}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm text-slate-700">{p.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); registerService(p, 'PROGRAM_UNIT'); }} className="text-slate-400 hover:text-blue-600">
                                        <Share2 size={14} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="text-xs text-slate-400">{p.loc} líneas</span>
                                    <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                        Ver Código <ArrowRight size={10} />
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); createDevOpsTicket(`Refactor Program Unit: ${p.name}`, `Logic extraction for ${p.name}. LOC: ${p.loc}`); }}
                                    className="mt-2 w-full text-center text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1 rounded transition opacity-0 group-hover:opacity-100"
                                >
                                    Crear Ticket
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
