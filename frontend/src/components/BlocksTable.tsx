import React from 'react';
import { Server, PlusSquare } from 'lucide-react';

interface BlocksTableProps {
    blocks: any[];
    setSelectedItem: (item: any) => void;
    createDevOpsTicket: (title: string, description?: string) => void;
}

export const BlocksTable: React.FC<BlocksTableProps> = ({ blocks, setSelectedItem, createDevOpsTicket }) => {
    const dataBlocks = blocks.filter(b => b.dataSource && b.dataSource !== 'None' && b.dataSource !== 'Unknown');

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Server size={20} className="text-indigo-600" />
                Bloques de Datos detectados ({dataBlocks.length})
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="pb-2 font-medium text-slate-500">Bloque</th>
                            <th className="pb-2 font-medium text-slate-500">Fuente Datos</th>
                            <th className="pb-2 font-medium text-slate-500">Items</th>
                            <th className="pb-2 font-medium text-slate-500 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataBlocks.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500 italic">No se encontraron bloques de datos.</td>
                            </tr>
                        ) : (
                            dataBlocks.map((b, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedItem({ ...b, type: 'Block', complexityType: 'Info', reason: 'Data Structure', recommendation: 'Migrate to TypeORM Entity' })}>
                                    <td className="py-2 font-medium">{b.name}</td>
                                    <td className="py-2 text-slate-500 text-xs">
                                        {b.dataSource}
                                        {b.dataSourceType !== 'Unknown' && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-[10px]">{b.dataSourceType}</span>}
                                    </td>
                                    <td className="py-2 text-slate-500 text-xs">{b.itemsCount}</td>
                                    <td className="py-2 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); createDevOpsTicket(`Componente React: ${b.name}`); }}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition"
                                            title="Crear Tarea"
                                        >
                                            <PlusSquare size={18} />
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
