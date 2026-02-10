import React from 'react';
import { Server } from 'lucide-react';

interface BlocksTableProps {
    blocks: any[];
    setSelectedItem: (item: any) => void;
    createDevOpsTicket: (item: string) => void;
}

export const BlocksTable: React.FC<BlocksTableProps> = ({ blocks, setSelectedItem, createDevOpsTicket }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Server size={20} className="text-indigo-600" />
                Bloques y Fuentes de Datos
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="pb-2 font-medium text-slate-500">Bloque</th>
                            <th className="pb-2 font-medium text-slate-500">Fuente Datos</th>
                            <th className="pb-2 font-medium text-slate-500">Items</th>
                            <th className="pb-2 font-medium text-slate-500">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blocks.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500 italic">No se encontraron bloques.</td>
                            </tr>
                        ) : (
                            blocks.map((b, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedItem({ ...b, type: 'Block', complexityType: 'Info', reason: 'Data Structure', recommendation: 'Migrate to TypeORM Entity' })}>
                                    <td className="py-2 font-medium">{b.name}</td>
                                    <td className="py-2 text-slate-500 text-xs">
                                        {b.dataSource}
                                        {b.dataSourceType !== 'Unknown' && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-[10px]">{b.dataSourceType}</span>}
                                    </td>
                                    <td className="py-2 text-slate-500 text-xs">{b.itemsCount}</td>
                                    <td className="py-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); createDevOpsTicket(`Componente React: ${b.name}`); }}
                                            className="text-xs text-blue-600 hover:underline font-medium"
                                        >
                                            Crear Tarea
                                        </button>
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
