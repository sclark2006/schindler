import React, { useState, useEffect } from 'react';
import { ArrowLeft, List, Code, Sparkles, ArrowUpRight, Check, Loader, ChevronDown } from 'lucide-react';
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

interface RecordGroupDetailViewProps {
    analysisResult: AnalysisResult;
    recordGroupName: string;
    onBack: () => void;
}

export const RecordGroupDetailView: React.FC<RecordGroupDetailViewProps> = ({ analysisResult, recordGroupName, onBack }) => {
    const { currentProject } = useProject();
    const { token } = useAuth();

    const [recordGroup, setRecordGroup] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedRec, setSelectedRec] = useState<any>(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [rgStatus, setRgStatus] = useState<string>('Pending');
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

    useEffect(() => {
        if (analysisResult && recordGroupName) {
            fetchData();
        }
    }, [analysisResult, recordGroupName]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const parsed = analysisResult.parsedData;
            const foundRG = parsed.recordGroups?.find((rg: any) => rg.name === recordGroupName);

            if (foundRG) {
                // Estimate query complexity
                const queryLength = (foundRG.query || '').length;
                let complexity = 'Low';
                let color = 'bg-green-400';
                if (queryLength > 500) { complexity = 'High'; color = 'bg-red-400'; }
                else if (queryLength > 200) { complexity = 'Medium'; color = 'bg-orange-400'; }

                setRecordGroup({
                    ...foundRG,
                    stats: {
                        queryLength,
                        complexity,
                        color
                    }
                });
            }

            // Fetch recommendations
            try {
                const resRecs = await axios.get(`${API_URL}/ai/recommendations`, {
                    params: { analysisId: analysisResult.id, blockName: recordGroupName },
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                });
                setRecommendations(resRecs.data.filter((r: any) => r.serviceName !== '__MANUAL_STATUS__'));
            } catch (err) {
                console.error('Error fetching recommendations:', err);
            }

            // Fetch status
            try {
                const statusRes = await axios.post(`${API_URL}/ai/block-statuses`, {
                    analysisId: analysisResult.id,
                    blockNames: [recordGroupName]
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRgStatus(statusRes.data[recordGroupName] || 'Pending');
            } catch (err) {
                console.error('Error fetching status:', err);
            }

        } catch (error) {
            console.error('Error fetching record group details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const domainsRes = await axios.get(`${API_URL}/governance/domains?projectId=${currentProject?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const res = await axios.post(`${API_URL}/ai/recommend/block`, {
                projectId: currentProject?.id,
                block: {
                    name: recordGroup?.name,
                    dataSource: recordGroup?.query || recordGroup?.name,
                    dataSourceType: 'QUERY',
                    itemsCount: 0,
                },
                rules: [],
                domains: domainsRes.data
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter to GET-only endpoints for record groups
            const newRecs = res.data
                .filter((r: any) => r.method === 'GET')
                .map((r: any) => ({
                    ...r,
                    analysisResultId: analysisResult.id,
                    blockName: recordGroupName,
                    status: 'PROPOSED'
                }));

            if (newRecs.length > 0) {
                const savedRes = await axios.post(`${API_URL}/ai/recommendations`, {
                    analysisId: analysisResult.id,
                    recommendations: newRecs
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRecommendations(savedRes.data);
            }

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
                sourceType: 'RECORD_GROUP',
                method: selectedRec.method,
                domain: selectedRec.domain,
                endpoint: selectedRec.url,
                dataSource: selectedRec.blockName,
                dataSourceType: 'QUERY',
                proposedServiceName: selectedRec.serviceName,
                ticketId: ticketData.id,
                ticketUrl: ticketData.url,
                status: 'APPROVED',
                ticketStatus: 'ACTIVE'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

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
                        <List size={20} className="text-indigo-500" />
                        {recordGroupName}
                    </h1>
                    <p className="text-xs text-slate-500">Record Group — Read-Only (GET) Endpoint Candidate</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {/* Status Badge with Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${rgStatus === 'Migrated' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                rgStatus === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    rgStatus === 'Proposed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                        >
                            {rgStatus}
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
                                                    blockName: recordGroupName,
                                                    status: s
                                                }, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                setRgStatus(s);
                                            } catch (err) {
                                                console.error('Error setting status:', err);
                                            }
                                            setStatusDropdownOpen(false);
                                        }}
                                        className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition ${rgStatus === s ? 'font-bold text-indigo-600' : 'text-slate-700'
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
                {/* Left Panel: Metadata */}
                <div className="w-1/4 bg-white border-r border-slate-200 p-6 overflow-y-auto hidden md:block">
                    <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Metadata</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-slate-500 block">Type</span>
                            <span className="text-sm font-medium text-slate-700">Record Group</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Endpoint Type</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">GET only</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Query Complexity</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${recordGroup?.stats?.color || 'bg-slate-400'}`}
                                        style={{ width: recordGroup?.stats?.complexity === 'High' ? '90%' : recordGroup?.stats?.complexity === 'Medium' ? '60%' : '30%' }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{recordGroup?.stats?.complexity || 'N/A'}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Query Length</span>
                            <span className="text-sm font-medium text-slate-700">
                                {recordGroup?.stats?.queryLength || 0} chars
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Recommendations</span>
                            <span className="text-sm font-medium text-slate-700">
                                {recommendations.length} endpoint(s)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center/Right: Main Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* SQL Query Preview */}
                    <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <Code size={20} className="text-indigo-600" /> SQL Query
                        </h3>
                        <div className="bg-slate-900 p-4 rounded-xl overflow-x-auto">
                            <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">
                                {recordGroup?.query || 'No query defined'}
                            </pre>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                            <span>Suggested endpoint: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">GET /api/lov/{recordGroupName.toLowerCase()}</code></span>
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
                                    Generate GET Endpoints
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

                                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${rec.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                rec.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                                                    rec.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {rec.status}
                                            </span>
                                            <div className="flex gap-2">
                                                {!rec.ticketId && (
                                                    <button
                                                        onClick={() => handleCreateTicket(rec)}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition"
                                                    >
                                                        Create Ticket <ArrowUpRight size={14} />
                                                    </button>
                                                )}
                                                {rec.ticketId && rec.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={async () => {
                                                            await axios.patch(`${API_URL}/ai/recommendations/${rec.id}`, {
                                                                status: 'COMPLETED'
                                                            }, { headers: { Authorization: `Bearer ${token}` } });
                                                            fetchData();
                                                        }}
                                                        className="text-sm font-medium text-emerald-600 hover:text-emerald-800 flex items-center gap-1 px-3 py-1.5 hover:bg-emerald-50 rounded-lg transition"
                                                    >
                                                        <Check size={14} /> Mark Done
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !generating && (
                                <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-500">
                                    <Sparkles size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p>No recommendations generated yet.</p>
                                    <p className="text-sm">Click "Generate GET Endpoints" to analyze the query and suggest read API endpoints.</p>
                                </div>
                            )
                        )}

                        {generating && (
                            <div className="mt-8 text-center text-slate-500">
                                <Loader size={32} className="animate-spin mx-auto mb-2 text-indigo-600" />
                                <p>Analyzing record group query and generating GET endpoint recommendations...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <TicketCreationModal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                initialTitle={selectedRec ? `[BE] Implement GET ${selectedRec.serviceName}` : ''}
                initialDescription={selectedRec ? `**Endpoint:** GET ${selectedRec.url}\n\n${selectedRec.description}` : ''}
                projectId={currentProject?.id}
                onSuccess={onTicketCreated}
            />
        </div>
    );
};
