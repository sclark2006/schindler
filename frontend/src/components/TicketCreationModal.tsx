import React, { useState } from 'react';
import { X, Send, AlertCircle, Sparkles, BookOpen, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

interface TicketCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTitle: string;
    initialDescription: string;
    projectId?: string;
    onSuccess?: (ticketData: any) => void;
}

export const TicketCreationModal: React.FC<TicketCreationModalProps> = ({ isOpen, onClose, initialTitle, initialDescription, projectId, onSuccess }) => {
    if (!isOpen) return null;

    const { token } = useAuth();
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [type, setType] = useState('User Story');
    const [provider, setProvider] = useState<'ADO' | 'GITHUB' | null>(null);
    const [availableProviders, setAvailableProviders] = useState<{ ado: boolean; github: boolean }>({ ado: false, github: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [improving, setImproving] = useState(false);
    const [rules, setRules] = useState<any[]>([]);
    const [selectedRuleId, setSelectedRuleId] = useState<string>('');
    const [workItemTypes, setWorkItemTypes] = useState<string[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);

    React.useEffect(() => {
        setTitle(initialTitle);
        setDescription(initialDescription);
        if (isOpen && projectId) {
            checkProviders();
            fetchRules();
        }
    }, [initialTitle, initialDescription, isOpen, projectId]);

    // Fetch work item types when provider changes
    React.useEffect(() => {
        if (provider && projectId) {
            fetchWorkItemTypes();
        }
    }, [provider, projectId]);

    const checkProviders = async () => {
        try {
            const res = await axios.get(`${API_URL}/governance/config`, { params: { projectId } });
            const configs = res.data;
            const hasAdo = configs.some((c: any) => c.key === 'ADO_ORG_URL');
            const hasGithub = configs.some((c: any) => c.key === 'GITHUB_REPO_URL');

            setAvailableProviders({ ado: hasAdo, github: hasGithub });

            if (hasGithub && !hasAdo) setProvider('GITHUB');
            else if (hasAdo) setProvider('ADO'); // Default to ADO if both or only ADO
            else setProvider(null);

        } catch (e: any) {
            console.error('Error checking providers:', e);
        }
    };

    const fetchRules = async () => {
        try {
            const res = await axios.get(`${API_URL}/governance/rules`);
            setRules(res.data);
        } catch (e: any) {
            console.error('Error fetching rules:', e);
        }
    };

    const fetchWorkItemTypes = async () => {
        setLoadingTypes(true);
        try {
            if (provider === 'ADO') {
                const res = await axios.get(`${API_URL}/ado/types`, {
                    params: { projectId },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWorkItemTypes(res.data);
                // Set default type to first available if current type not in list
                if (res.data.length > 0 && !res.data.includes(type)) {
                    setType(res.data[0]);
                }
            } else if (provider === 'GITHUB') {
                setWorkItemTypes(['Issue', 'Bug', 'Enhancement', 'Feature Request']);
            }
        } catch (e: any) {
            console.error('Error fetching work item types:', e);
            // Fallback
            setWorkItemTypes(['User Story', 'Task', 'Bug', 'Feature']);
        } finally {
            setLoadingTypes(false);
        }
    };

    const handleImprove = async () => {
        if (!projectId) return;
        setImproving(true);
        try {
            // Find selected rule content
            const rule = rules.find(r => r.id === selectedRuleId);
            const context = rule ? `Using migration rule: ${rule.patternName} -> ${rule.ticketTemplate}` : '';

            const res = await axios.post(`${API_URL}/ai/generate`, {
                projectId,
                prompt: `Improve this ticket description for a ${type}. 
                Title: ${title}
                Description: ${description}
                ${context}
                
                Make it professional, add acceptance criteria if missing, and ensure technical clarity.
                Return JSON with { title, description }.`,
                context: 'ticket-improvement'
            });

            // Parse response - assuming simple text or json. 
            // The service returns { text: ... }. 
            // If the prompt asks for JSON, we might need to parse `text`.
            // For simplicity, let's assume the text is the new description or tries to be.
            // But let's try to parse if possible or just append. 
            // Let's rely on text response for description improvement.

            // To be safer and robust, let's just ask for description improvement for now.
            if (res.data.text) {
                // Simple heuristic: If response looks like JSON, parse it.
                try {
                    const json = JSON.parse(res.data.text.replace(/```json/g, '').replace(/```/g, ''));
                    if (json.title) setTitle(json.title);
                    if (json.description) setDescription(json.description);
                } catch (e) {
                    // Fallback: just update description
                    setDescription(res.data.text);
                }
            }

        } catch (e) {
            console.error(e);
            alert('Error improving ticket with AI.');
        } finally {
            setImproving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!provider) {
            setError('No integration provider configured for this project.');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (provider === 'ADO') {
                response = await axios.post(
                    `${API_URL}/ado/work-items`,
                    { title, description, type, projectId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                response = await axios.post(
                    `${API_URL}/github/issues`,
                    {
                        title,
                        description,
                        projectId,
                        labels: [type === 'Bug' ? 'bug' : 'enhancement', 'schindler-generated']
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            setSuccess(`Ticket created successfully: #${response.data.id}`); // English standard

            if (onSuccess) {
                onSuccess(response.data);
            }

            setTimeout(() => {
                onClose();
                setSuccess(null);
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error creating ticket.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Send size={18} className="text-blue-400" />
                        Create Ticket (Preview)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* AI & Rules Section */}
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-600" />
                                AI Enhancement
                            </h4>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-indigo-800 mb-1">Apply Migration Rule context</label>
                                <div className="relative">
                                    <BookOpen size={14} className="absolute left-3 top-2.5 text-indigo-400" />
                                    <select
                                        className="w-full pl-9 pr-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm text-indigo-900 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={selectedRuleId}
                                        onChange={(e) => setSelectedRuleId(e.target.value)}
                                    >
                                        <option value="">-- No specific rule --</option>
                                        {rules.map(r => (
                                            <option key={r.id} value={r.id}>{r.patternName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={handleImprove}
                                    disabled={improving}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-sm flex items-center gap-2 disabled:opacity-50 h-[38px]"
                                >
                                    {improving ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Improve with AI
                                </button>
                            </div>
                        </div>
                    </div>

                    <form id="ticket-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
                                <Send size={16} /> {success}
                            </div>
                        )}

                        {!loading && !success && !availableProviders.ado && !availableProviders.github && (
                            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle size={16} /> No integrations configured. Go to Settings to setup Azure DevOps or GitHub.
                            </div>
                        )}

                        {/* Provider Selection */}
                        {(availableProviders.ado && availableProviders.github) && (
                            <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="provider"
                                        checked={provider === 'ADO'}
                                        onChange={() => setProvider('ADO')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Azure DevOps</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="provider"
                                        checked={provider === 'GITHUB'}
                                        onChange={() => setProvider('GITHUB')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">GitHub</span>
                                </label>
                            </div>
                        )}

                        {/* Ticket Type - First field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ticket Type</label>
                            {loadingTypes ? (
                                <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                                    <Loader size={14} className="animate-spin" /> Loading types from {provider === 'ADO' ? 'Azure DevOps' : 'GitHub'}...
                                </div>
                            ) : (
                                <select
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    {workItemTypes.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-64 font-mono text-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="ticket-form"
                        disabled={loading || (!provider)}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                        {loading ? 'Creating...' : 'Create Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
};
