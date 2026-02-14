import React from 'react';
import { X, Server, Layout, Database, Cloud } from 'lucide-react';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            Schindler
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Oracle Forms Migration Architect</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="prose prose-slate max-w-none">
                        <p className="lead text-lg text-slate-600 mb-6">
                            Schindler is a specialized tool designed to assist in the migration of legacy Oracle Forms applications to a modern architecture. It analyzes Oracle Forms XML exports to identify patterns, calculate complexity, and suggest modern equivalents.
                        </p>

                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Architecture Stack</h3>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Layout size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">Frontend</div>
                                    <div className="text-xs text-slate-500">React + Vite + Tailwind</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <Server size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">Backend</div>
                                    <div className="text-xs text-slate-500">NestJS + TypeORM</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">Database</div>
                                    <div className="text-xs text-slate-500">PostgreSQL 15</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <Cloud size={20} />
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-800">Integrations</div>
                                    <div className="text-xs text-slate-500">Azure DevOps + GitHub</div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6 flex justify-between items-center text-xs text-slate-400">
                            <div>
                                Version 1.0.0 (Phase 16)
                            </div>
                            <div>
                                Developed by Deepmind Agent
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
