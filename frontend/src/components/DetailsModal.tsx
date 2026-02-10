import React from 'react';
import { X, Database, ArrowRight, Zap } from 'lucide-react';

interface DetailsModalProps {
    item: any;
    isOpen: boolean;
    onClose: () => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({ item, isOpen, onClose }) => {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Zap className="text-amber-500" size={20} />
                            {item.name}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Analysis Detail & Migration Recommendation</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Metadata & Context */}
                    <div className="w-full md:w-1/3 border-r border-slate-100 p-6 overflow-y-auto bg-white">
                        <section className="mb-6">
                            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Database size={16} /> Context
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-xs font-medium text-slate-400 uppercase">Type</span>
                                    <p className="font-medium text-slate-800">{item.type || 'Unknown'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-xs font-medium text-slate-400 uppercase">Complexity</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`h-2 w-2 rounded-full ${item.complexityType === 'High' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                        <p className="font-medium text-slate-800">{item.complexityType || 'Standard'}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-xs font-medium text-slate-400 uppercase">Detection Reason</span>
                                    <p className="text-sm text-slate-600 mt-1">{item.reason}</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <ArrowRight size={16} /> Strategy
                            </h3>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <h4 className="font-bold text-blue-900 text-sm mb-1">{item.recommendation || 'Standard Migration'}</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Based on the detected pattern, we recommend getting this logic out of the form and into the target layer displayed on the right.
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Right: Code Comparison */}
                    <div className="w-full md:w-2/3 bg-slate-900 flex flex-col overflow-hidden">
                        <div className="flex border-b border-slate-700">
                            <div className="w-1/2 p-3 text-xs font-medium text-slate-400 border-r border-slate-700 text-center">
                                {item.type === 'Block' ? 'Data Source (Table/View/SQL)' : 'Original PL/SQL'}
                            </div>
                            <div className="w-1/2 p-3 text-xs font-medium text-blue-400 text-center">Recommended Target</div>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="w-1/2 overflow-auto p-4 border-r border-slate-700">
                                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
                                    {item.type === 'Block' ? (item.dataSource || '-- No Data Source') : (item.code || '-- No source code available')}
                                </pre>
                            </div>
                            <div className="w-1/2 overflow-auto p-4 bg-slate-800/50">
                                <pre className="font-mono text-xs text-blue-100 whitespace-pre-wrap">
                                    {item.pseudocode || '// No recommendation generated'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
