import React, { useState, useEffect } from 'react';
import { ArrowLeft, Database, Code, Sparkles, AlertCircle, ArrowUpRight, Check, Loader, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { TicketCreationModal } from '../components/TicketCreationModal';

const API_URL = import.meta.env.VITE_API_URL;

// Swagger-style colors for HTTP methods
const methodConfig: Record<string, { label: string; color: string }> = {
    'GET': { label: 'GET', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'POST': { label: 'POST', color: 'bg-green-50 text-green-700 border-green-200' },
    'PUT': { label: 'PUT', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    'PATCH': { label: 'PATCH', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    'DELETE': { label: 'DELETE', color: 'bg-red-50 text-red-700 border-red-200' },
};

import { AnalysisResult } from '../types/analysis';

interface BlockDetailViewProps {
    analysisResult: AnalysisResult;
    blockName: string;
    onBack: () => void;
}

export const BlockDetailView: React.FC<BlockDetailViewProps> = ({ analysisResult, blockName, onBack }) => {
    const { currentProject } = useProject();
    const { token } = useAuth();

    const [block, setBlock] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedRec, setSelectedRec] = useState<any>(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [blockStatus, setBlockStatus] = useState<string>('Pending');
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

    useEffect(() => {
        if (analysisResult && blockName) {
            fetchData();
        }
    }, [analysisResult, blockName]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Use passed analysis result directly
            const parsed = analysisResult.parsedData;

            // Find block in flat array (FormsXmlAdapter returns flat structure)
            const foundBlock = parsed.blocks?.find((b: any) => b.name === blockName);

            if (foundBlock) {
                // Enrich block with related data
                const triggers = parsed.triggers?.filter((t: any) => t.parentBlock === blockName) || [];
                const candidates = parsed.complexityCandidates?.filter((c: any) =>
                    triggers.some((t: any) => t.name === c.name)
                ) || [];

                // Derived stats
                const totalLoc = triggers.reduce((acc: number, t: any) => acc + (t.loc || 0), 0);
                const complexityScore = (foundBlock.itemsCount * 1) + (triggers.length * 5) + (totalLoc * 0.1);

                let complexityLevel = 'Low';
                let color = 'bg-green-400';

                if (complexityScore > 50) { complexityLevel = 'High'; color = 'bg-red-400'; }
                else if (complexityScore > 20) { complexityLevel = 'Medium'; color = 'bg-orange-400'; }

                setBlock({
                    ...foundBlock,
                    triggers,
                    candidates,
                    stats: {
                        loc: Math.round(totalLoc),
                        complexity: complexityLevel,
                        score: Math.round(complexityScore),
                        color
                    }
                });

                // Logic preview removed
            } else {
                console.warn(`Block ${blockName} not found in analysis result`);
            }

            // 2. Fetch Stored Recommendations with timeout
            try {
                const resRecs = await axios.get(`${API_URL}/ai/recommendations`, {
                    params: { analysisId: analysisResult.id, blockName },
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000 // 5s timeout
                });
                // Filter out manual status entries
                setRecommendations(resRecs.data.filter((r: any) => r.serviceName !== '__MANUAL_STATUS__'));
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                // Don't block the UI if recommendations fail
            }

            // 3. Fetch block status
            try {
                const statusRes = await axios.post(`${API_URL}/ai/block-statuses`, {
                    analysisId: analysisResult.id,
                    blockNames: [blockName]
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBlockStatus(statusRes.data[blockName] || 'Pending');
            } catch (err) {
                console.error('Error fetching block status:', err);
            }

        } catch (error) {
            console.error('Error fetching block details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // Fetch configuration (Rules/Domains)
            const [rulesRes, domainsRes] = await Promise.all([
                axios.get(`${API_URL}/governance/rules`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/governance/domains?projectId=${currentProject?.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            // Send only essential block fields to avoid payload too large
            const blockPayload = {
                name: block?.name,
                dataSource: block?.dataSource,
                dataSourceType: block?.dataSourceType,
                itemsCount: block?.itemsCount,
            };

            const res = await axios.post(`${API_URL}/ai/recommend/block`, {
                projectId: currentProject?.id,
                block: blockPayload,
                rules: rulesRes.data,
                domains: domainsRes.data
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Save generated recommendations
            const newRecs = res.data.map((r: any) => ({
                ...r,
                analysisResultId: analysisResult.id,
                blockName: blockName,
                status: 'PROPOSED'
            }));

            const savedRes = await axios.post(`${API_URL}/ai/recommendations`, {
                analysisId: analysisResult.id,
                recommendations: newRecs
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRecommendations(savedRes.data);

        } catch (error) {
            console.error('Error generating recommendations:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleCreateTicket = (rec: any) => {
        setSelectedRec(rec);
        setIsTicketModalOpen(true);
    };

    const onTicketCreated = async (ticketData: any) => {
        // Update recommendation with ticket info
        try {
            await axios.patch(`${API_URL}/ai/recommendations/${selectedRec.id}`, {
                ticketId: ticketData.id,
                ticketUrl: ticketData.url,
                status: 'ACCEPTED'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Auto-register service in discovered_service catalog
            await axios.post(`${API_URL}/discovered-services/register`, {
                projectId: currentProject?.id,
                originalName: selectedRec.blockName,
                sourceType: 'BLOCK',
                method: selectedRec.method,
                domain: selectedRec.domain,
                endpoint: selectedRec.url,
                dataSource: selectedRec.blockName,
                dataSourceType: 'TABLE',
                proposedServiceName: selectedRec.serviceName,
                ticketId: ticketData.id,
                ticketUrl: ticketData.url,
                status: 'APPROVED',
                ticketStatus: 'ACTIVE'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh list
            fetchData();
        } catch (e) {
            console.error('Error linking ticket to recommendation:', e);
        }
        setIsTicketModalOpen(false);
    };

    if (loading) return <div className="flex h-full items-center justify-center"><Loader className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Database size={20} className="text-indigo-600" />
                        {blockName}
                    </h1>
                    <p className="text-xs text-slate-500">Block Details & Migration Analysis</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {/* Status Badge with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${blockStatus === 'Migrated' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                blockStatus === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    blockStatus === 'Proposed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                        >
                            {blockStatus}
                            <ChevronDown size={12} />
                        </button>
                        {statusDropdownOpen && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
                                {['Pending', 'Proposed', 'In Progress', 'Migrated'].map(s => (
                                    <button
                                        key={s}
                                        onClick={async () => {
                                            try {
                                                await axios.put(`${API_URL}/ai/block-status`, {
                                                    analysisId: analysisResult.id,
                                                    blockName,
                                                    status: s
                                                }, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                setBlockStatus(s);
                                            } catch (err) {
                                                console.error('Error setting block status:', err);
                                            }
                                            setStatusDropdownOpen(false);
                                        }}
                                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition ${blockStatus === s ? 'font-bold text-indigo-600' : 'text-slate-700'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Context */}
                <div className="w-1/4 bg-white border-r border-slate-200 p-6 overflow-y-auto hidden md:block">
                    <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Metadata</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-slate-500 block">Items Count</span>
                            <span className="text-sm font-medium text-slate-700">
                                {block?.itemsCount || 0} Fields
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Complexity</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${block?.stats?.color || 'bg-slate-400'} w-[${block?.stats?.complexity === 'High' ? '90%' : block?.stats?.complexity === 'Medium' ? '60%' : '30%'}]`}></div>
                                </div>
                                <span className="text-sm font-bold text-slate-700">{block?.stats?.complexity || 'N/A'}</span>
                            </div>
                        </div>
                        {block?.candidates?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <span className="text-xs text-red-500 font-bold block mb-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> Analysis Findings
                                </span>
                                <ul className="text-xs text-slate-600 space-y-1">
                                    {block.candidates.map((c: any, i: number) => (
                                        <li key={i} className="pl-2 border-l-2 border-red-200">
                                            {c.reason} ({c.name})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center/Right: Main Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Source Code / Logic Snippet */}
                    {/* Data Source Info (Moved from Left Panel) */}
                    <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <Database size={20} className="text-indigo-600" /> Data Source Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1">Data Source Name</span>
                                <span className="font-mono text-base bg-slate-50 px-3 py-2 rounded-lg block border border-slate-200 text-slate-700">
                                    {block?.dataSource || 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1">Source Type</span>
                                <span className="text-base font-medium text-slate-700 flex items-center gap-2 px-3 py-2">
                                    {block?.dataSourceType === 'TABLE' ? <Database size={16} /> : <Code size={16} />}
                                    {block?.dataSourceType || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations Section */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Sparkles size={20} className="text-purple-600" />
                                AI Recommendations ({recommendations.length})
                            </h3>
                            {recommendations.length === 0 && (
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm font-medium"
                                >
                                    {generating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Generate Recommendations
                                </button>
                            )}
                        </div>

                        {recommendations.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {recommendations.map((rec, i) => (
                                    <div key={i} className={`bg-white p-5 rounded-xl border shadow-sm transition hover:shadow-md ${rec.ticketId ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold border ${(methodConfig[rec.method] || methodConfig['GET']).color}`}>
                                                    {rec.method}
                                                </span>
                                                <span className="font-mono text-sm font-medium text-slate-700">{rec.url}</span>
                                            </div>
                                            {rec.ticketId ? (
                                                <a href={rec.ticketUrl} target="_blank" rel="noreferrer" className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-green-200 transition">
                                                    <Check size={12} /> Ticket #{rec.ticketId}
                                                </a>
                                            ) : (
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Proposed</span>
                                            )}
                                        </div>

                                        <h4 className="font-bold text-slate-800 mb-2">{rec.serviceName}</h4>
                                        <p className="text-sm text-slate-600 mb-4 line-clamp-3">{rec.description}</p>

                                        <div className="flex justify-end pt-3 border-t border-slate-100">
                                            {!rec.ticketId && (
                                                <button
                                                    onClick={() => handleCreateTicket(rec)}
                                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition"
                                                >
                                                    Create Ticket <ArrowUpRight size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !generating && (
                                <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
                                    <Sparkles size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p>No recommendations generated yet.</p>
                                    <p className="text-sm">Click "Generate Recommendations" to analyze code structure.</p>
                                </div>
                            )
                        )}

                        {generating && (
                            <div className="mt-8 text-center text-slate-500">
                                <Loader size={32} className="animate-spin mx-auto mb-2 text-indigo-600" />
                                <p>Analyzing block structure and generating migration paths...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <TicketCreationModal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                initialTitle={selectedRec ? `[BE] Implement ${selectedRec.serviceName}` : ''}
                initialDescription={selectedRec ? selectedRec.description : ''}
                projectId={currentProject?.id}
                onSuccess={onTicketCreated} // We need to update TicketCreationModal to accept this prop
            />
        </div>
    );
};
