import React, { useState, useEffect } from 'react';
import { X, Database, ArrowRight, Zap, Sparkles, PlusSquare, Loader } from 'lucide-react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { TicketCreationModal } from './TicketCreationModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DetailsModalProps {
    item: any;
    isOpen: boolean;
    onClose: () => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({ item, isOpen, onClose }) => {
    const { currentProject } = useProject();
    const [generating, setGenerating] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [selectedRec, setSelectedRec] = useState<any>(null);

    // Reset state when item changes
    useEffect(() => {
        setRecommendations([]);
        setSelectedRec(null);
    }, [item]);

    if (!isOpen || !item) return null;

    const handleGenerate = async () => {
        if (!currentProject) return;
        setGenerating(true);
        try {
            // Fetch Rules & Domains
            const [rulesRes, domainsRes] = await Promise.all([
                axios.get(`${API_URL}/governance/rules`),
                axios.get(`${API_URL}/governance/domains`, { params: { projectId: currentProject.id } })
            ]);

            const res = await axios.post(`${API_URL}/ai/recommend/block`, {
                projectId: currentProject.id,
                block: {
                    name: item.name,
                    dataSourceType: item.dataSourceType || 'TABLE', // Default to TABLE if missing
                    dataSource: item.dataSource,
                    itemsCount: item.itemsCount || 0
                },
                rules: rulesRes.data,
                domains: domainsRes.data
            });

            setRecommendations(res.data);
            if (res.data.length > 0) {
                setSelectedRec(res.data[0]); // Select first by default
            }

        } catch (e) {
            console.error(e);
            alert('Error generating recommendations.');
        } finally {
            setGenerating(false);
        }
    };

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
                    <div className="flex gap-2">
                        {recommendations.length > 0 && (
                            <button
                                onClick={() => setTicketModalOpen(true)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium"
                            >
                                <PlusSquare size={18} />
                                Create Ticket
                            </button>
                        )}
                        {!recommendations.length && (
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm font-medium disabled:opacity-50"
                            >
                                {generating ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                {generating ? 'Generating...' : 'Generate Recommendation'}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors ml-2">
                            <X size={24} className="text-slate-500" />
                        </button>
                    </div>
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
                            <div className="w-1/2 p-3 text-xs font-medium text-blue-400 text-center flex justify-between px-6">
                                <span>Recommended Target</span>
                                {recommendations.length > 1 && (
                                    <select
                                        className="bg-slate-800 text-xs border-none rounded text-blue-300 focus:ring-0 cursor-pointer"
                                        onChange={(e) => setSelectedRec(recommendations.find(r => r.serviceName === e.target.value))}
                                        value={selectedRec?.serviceName}
                                    >
                                        {recommendations.map(r => (
                                            <option key={r.serviceName} value={r.serviceName}>{r.method} {r.serviceName}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="w-1/2 overflow-auto p-4 border-r border-slate-700">
                                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
                                    {item.type === 'Block' ? (item.dataSource || '-- No Data Source') : (item.code || '-- No source code available')}
                                </pre>
                            </div>
                            <div className="w-1/2 overflow-auto p-4 bg-slate-800/50">
                                {selectedRec ? (
                                    <div className="space-y-4">
                                        <div className="border-b border-slate-700 pb-2">
                                            <p className="text-xs text-slate-400 mb-1">Target Endpoint</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedRec.method === 'GET' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                                                    {selectedRec.method}
                                                </span>
                                                <code className="text-xs text-blue-200 font-mono">{selectedRec.url}</code>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Description</p>
                                            <p className="text-xs text-slate-300 leading-relaxed">{selectedRec.description}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 mb-1">Suggested Domain</p>
                                            <span className="text-xs text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded-full border border-purple-800">
                                                {selectedRec.domain}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-slate-600 italic text-xs">
                                        {generating ? 'Analyzing block structure...' : 'No recommendations generated yet.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticket Creation Modal */}
            <TicketCreationModal
                isOpen={ticketModalOpen}
                onClose={() => setTicketModalOpen(false)}
                initialTitle={selectedRec ? `[BE] Implement ${selectedRec.serviceName}` : ''}
                initialDescription={selectedRec ? `**Technical Specification**\n\n**Service Name:** ${selectedRec.serviceName}\n**Method:** ${selectedRec.method}\n**URL:** ${selectedRec.url}\n**Domain:** ${selectedRec.domain}\n\n**Description:**\n${selectedRec.description}\n\nGenerated by Schindler AI` : ''}
                projectId={currentProject?.id}
            />
        </div>
    );
};
