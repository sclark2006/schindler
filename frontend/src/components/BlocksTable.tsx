import React from 'react';
import { Server, ArrowRight } from 'lucide-react';

interface BlocksTableProps {
    blocks: any[];
    setSelectedItem?: (item: any) => void;
    createDevOpsTicket?: (title: string, description?: string) => void;
    onBlockSelect?: (blockName: string) => void;
}

export const BlocksTable: React.FC<BlocksTableProps> = ({ blocks = [], onBlockSelect }) => {
    // const navigate = useNavigate(); // Removed
    // const { analysisId } = useParams(); // Removed

    // const params = useParams();
    // const currentAnalysisId = params.analysisId || 'unknown'; 

    const dataBlocks = blocks.filter(b => b.dataSource && b.dataSource !== 'None' && b.dataSource !== 'Unknown');

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
                            <th className="pb-2 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataBlocks.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-500 italic">No data blocks found.</td>
                            </tr>
                        ) : (
                            dataBlocks.map((b, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer" onClick={() => handleRowClick(b.name)}>
                                    <td className="py-2 font-medium">{b.name}</td>
                                    <td className="py-2 text-slate-500 text-xs">
                                        {b.dataSource}
                                        {b.dataSourceType !== 'Unknown' && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-[10px]">{b.dataSourceType}</span>}
                                    </td>
                                    <td className="py-2 text-slate-500 text-xs">{b.itemsCount}</td>
                                    <td className="py-2 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRowClick(b.name); }}
                                            className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold flex items-center justify-end gap-1 ml-auto"
                                        >
                                            View Details <ArrowRight size={14} />
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
