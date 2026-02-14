import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Save, Github, Trash2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const API_URL = import.meta.env.VITE_API_URL;

const AI_MODELS: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    gemini: [
        'gemini-3-pro',
        'gemini-3-flash',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
    ],
    ollama: ['llama3', 'mistral', 'codellama', 'qwen2.5-coder'],
};

interface BusinessDomain {
    id: string;
    name: string;
    description: string;
    owner: string;
}

interface MigrationRule {
    id: string;
    patternName: string;
    ticketTemplate: string;
    targetLayer: string;
    isActive: boolean;
}

export const ProjectSettings: React.FC = () => {
    const { currentProject } = useProject();
    const [activeTab, setActiveTab] = useState<'general' | 'domains' | 'rules' | 'integrations' | 'ai'>('general');

    // Domain State
    const [domains, setDomains] = useState<BusinessDomain[]>([]);
    const [newDomain, setNewDomain] = useState({ name: '', description: '', owner: '' });

    // Rules State
    const [rules, setRules] = useState<MigrationRule[]>([]);
    const [newRule, setNewRule] = useState({ patternName: '', ticketTemplate: '', targetLayer: 'Backend API' });
    const [editingRule, setEditingRule] = useState<MigrationRule | null>(null);

    // ADO Config Configuration
    const [adoConfig, setAdoConfig] = useState({ orgUrl: '', project: '', pat: '' });
    const [initialAdoConfig, setInitialAdoConfig] = useState({ orgUrl: '', project: '', pat: '' });

    // GitHub Config Configuration
    const [githubConfig, setGithubConfig] = useState({ repoUrl: '', token: '' });
    const [initialGithubConfig, setInitialGithubConfig] = useState({ repoUrl: '', token: '' });

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
    const [selectedEnv, setSelectedEnv] = useState('DEV');

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: null }), 3000);
    };

    // Project General Settings
    const [projectSettings, setProjectSettings] = useState({ name: '', description: '' });

    useEffect(() => {
        if (currentProject) {
            setProjectSettings({ name: currentProject.name, description: currentProject.description || '' });
            fetchDomains();
            fetchRules();
            fetchAdoConfig();
            fetchGithubConfig();
            fetchAiConfig();
        }
    }, [currentProject, selectedEnv]);

    const handleUpdateProject = async () => {
        if (!currentProject) return;
        try {
            await axios.put(`${API_URL}/projects/${currentProject.id}`, projectSettings);
            showToast('Project updated.', 'success');
            // Refresh project context/list (not implemented in context but ideally should be)
        } catch (e) {
            console.error(e);
            showToast('Error updating project.', 'error');
        }
    };

    const handleDeleteProject = async () => {
        if (!currentProject) return;
        const confirmName = prompt(`To delete this project, type its full name: ${currentProject.name}`);
        if (confirmName !== currentProject.name) {
            showToast('Incorrect name. Deletion cancelled.', 'error');
            return;
        }

        try {
            await axios.delete(`${API_URL}/projects/${currentProject.id}`);
            window.location.reload(); // Force reload to reset state/context
        } catch (e) {
            console.error(e);
            showToast('Error deleting project.', 'error');
        }
    };
    const [aiConfig, setAiConfig] = useState({ provider: 'openai', model: 'gpt-4o', apiKey: '', baseUrl: '' });
    const [initialAiConfig, setInitialAiConfig] = useState({ provider: 'openai', model: 'gpt-4o', apiKey: '', baseUrl: '' });

    useEffect(() => {
        if (currentProject) {
            fetchDomains();
            fetchRules();
            fetchAdoConfig();
            fetchGithubConfig();
            fetchAiConfig();
        }
    }, [currentProject, selectedEnv]);

    const fetchAiConfig = async () => {
        if (!currentProject) return;
        try {
            const res = await axios.get(`${API_URL}/projects/${currentProject.id}`);
            if (res.data.aiConfig) {
                setAiConfig(res.data.aiConfig);
                setInitialAiConfig(res.data.aiConfig);
            }
        } catch (e) { console.error(e); }
    };

    const saveAiConfig = async () => {
        if (!currentProject) return;
        try {
            await axios.put(`${API_URL}/ai/config/${currentProject.id}`, aiConfig);
            setInitialAiConfig(aiConfig);
            showToast('AI configuration saved successfully.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error saving AI configuration.', 'error');
        }
    };

    const fetchAdoConfig = async () => {
        if (!currentProject) return;
        try {
            const res = await axios.get(`${API_URL}/governance/config`, { params: { projectId: currentProject.id, environment: selectedEnv } });
            const configs = res.data;
            if (configs.length > 0) {
                const config = {
                    orgUrl: configs.find((c: any) => c.key === 'ADO_ORG_URL')?.value || '',
                    project: configs.find((c: any) => c.key === 'ADO_PROJECT')?.value || '',
                    pat: configs.find((c: any) => c.key === 'ADO_PAT')?.value || ''
                };
                setAdoConfig(config);
                setInitialAdoConfig(config);
            } else {
                setAdoConfig({ orgUrl: '', project: '', pat: '' });
                setInitialAdoConfig({ orgUrl: '', project: '', pat: '' });
            }
        } catch (e) { console.error(e); }
    };

    const fetchGithubConfig = async () => {
        if (!currentProject) return;
        try {
            const res = await axios.get(`${API_URL}/governance/config`, { params: { projectId: currentProject.id, environment: selectedEnv } });
            const configs = res.data;
            if (configs.length > 0) {
                const config = {
                    repoUrl: configs.find((c: any) => c.key === 'GITHUB_REPO_URL')?.value || '',
                    token: configs.find((c: any) => c.key === 'GITHUB_TOKEN')?.value || ''
                };
                setGithubConfig(config);
                setInitialGithubConfig(config);
            } else {
                setGithubConfig({ repoUrl: '', token: '' });
                setInitialGithubConfig({ repoUrl: '', token: '' });
            }
        } catch (e) { console.error(e); }
    };

    const saveAdoConfig = async () => {
        if (!currentProject) return;
        try {
            await axios.post(`${API_URL}/governance/config`, { key: 'ADO_ORG_URL', value: adoConfig.orgUrl, description: 'Azure DevOps Organization URL', projectId: currentProject.id, environment: selectedEnv });
            await axios.post(`${API_URL}/governance/config`, { key: 'ADO_PROJECT', value: adoConfig.project, description: 'Project Name', projectId: currentProject.id, environment: selectedEnv });
            await axios.post(`${API_URL}/governance/config`, { key: 'ADO_PAT', value: adoConfig.pat, description: 'Personal Access Token', isSecret: true, projectId: currentProject.id, environment: selectedEnv });
            setInitialAdoConfig(adoConfig);
            showToast('ADO configuration saved successfully.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error saving ADO configuration.', 'error');
        }
    };

    const saveGithubConfig = async () => {
        if (!currentProject) return;
        try {
            await axios.post(`${API_URL}/governance/config`, { key: 'GITHUB_REPO_URL', value: githubConfig.repoUrl, description: 'GitHub Repository URL', projectId: currentProject.id, environment: selectedEnv });
            await axios.post(`${API_URL}/governance/config`, { key: 'GITHUB_TOKEN', value: githubConfig.token, description: 'GitHub Personal Access Token', isSecret: true, projectId: currentProject.id, environment: selectedEnv });
            setInitialGithubConfig(githubConfig);
            showToast('GitHub configuration saved successfully.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error saving GitHub configuration.', 'error');
        }
    };

    const fetchDomains = async () => {
        if (!currentProject) return;
        try {
            const res = await axios.get(`${API_URL}/governance/domains`, { params: { projectId: currentProject.id } });
            setDomains(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchRules = async () => {
        try {
            const res = await axios.get(`${API_URL}/governance/rules`);
            setRules(res.data);
        } catch (e) { console.error(e); }
    };

    const handleAddDomain = async () => {
        if (!newDomain.name || !currentProject) return;
        try {
            await axios.post(`${API_URL}/governance/domains`, { ...newDomain, projectId: currentProject.id });
            setNewDomain({ name: '', description: '', owner: '' });
            fetchDomains();
            showToast('Domain added.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error adding domain.', 'error');
        }
    };

    const handleAddRule = async () => {
        if (!newRule.patternName) return;
        try {
            await axios.post(`${API_URL}/governance/rules`, newRule);
            setNewRule({ patternName: '', ticketTemplate: '', targetLayer: 'Backend API' });
            fetchRules();
            showToast('Rule added.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error adding rule.', 'error');
        }
    };

    const handleEditRuleClick = async (id: string) => {
        try {
            const res = await axios.get(`${API_URL}/governance/rules/${id}`);
            setEditingRule(res.data);
        } catch (e) {
            console.error(e);
            showToast('Error loading rule.', 'error');
        }
    };

    const handleUpdateRule = async (rule: MigrationRule) => {
        try {
            await axios.put(`${API_URL}/governance/rules/${rule.id}`, rule);
            setEditingRule(null);
            fetchRules();
            showToast('Rule updated.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error updating rule.', 'error');
        }
    };

    const isAiConfigDirty = JSON.stringify(aiConfig) !== JSON.stringify(initialAiConfig);
    const isAdoConfigDirty = JSON.stringify(adoConfig) !== JSON.stringify(initialAdoConfig);
    const isGithubConfigDirty = JSON.stringify(githubConfig) !== JSON.stringify(initialGithubConfig);

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col relative overflow-hidden">
            {toast.type && (
                <div className={`absolute bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all z-50 flex items-center gap-2 animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {toast.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {toast.message}
                </div>
            )}

            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Settings className="text-slate-400" />
                <h2 className="text-xl font-bold text-slate-800">Governance & System Configuration</h2>
            </div>

            <div className="flex border-b border-slate-100 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    General
                </button>
                <button
                    onClick={() => setActiveTab('domains')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'domains' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Business Domains
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'rules' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Migration Rules
                </button>
                <button
                    onClick={() => setActiveTab('integrations')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'integrations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Integrations
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'ai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    AI & Generation
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'general' && (
                    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                                <input
                                    className="w-full p-2 border rounded-lg"
                                    value={projectSettings.name}
                                    onChange={e => setProjectSettings({ ...projectSettings, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg h-24"
                                    value={projectSettings.description}
                                    onChange={e => setProjectSettings({ ...projectSettings, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleUpdateProject}
                                    className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
                                >
                                    Update Details
                                </button>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-red-100">
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <h3 className="font-bold text-red-900 mb-2">Danger Zone</h3>
                                <p className="text-sm text-red-700 mb-4">
                                    Deleting this project will permanently remove all analysis results, configurations, and data associated with it. This action cannot be undone.
                                </p>
                                <button
                                    onClick={handleDeleteProject}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Delete Project
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'domains' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <input
                                placeholder="Domain Name (e.g. Finance)"
                                className="p-2 border rounded"
                                value={newDomain.name}
                                onChange={e => setNewDomain({ ...newDomain, name: e.target.value })}
                            />
                            <input
                                placeholder="Owner (e.g. Team A)"
                                className="p-2 border rounded"
                                value={newDomain.owner}
                                onChange={e => setNewDomain({ ...newDomain, owner: e.target.value })}
                            />
                            <button onClick={handleAddDomain} className="bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Plus size={18} /> Add Domain
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {domains.map(d => (
                                <div key={d.id} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition bg-white">
                                    <h3 className="font-bold text-lg text-slate-800">{d.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">Owner: {d.owner || 'Unassigned'}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                        <button className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="space-y-6">
                        {/* Edit Mode */}
                        {editingRule ? (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-right-8">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-800">Edit Rule</h3>
                                    <button onClick={() => setEditingRule(null)} className="text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        placeholder="Pattern Name"
                                        className="p-2 border rounded"
                                        value={editingRule.patternName}
                                        onChange={e => setEditingRule({ ...editingRule, patternName: e.target.value })}
                                    />
                                    <select
                                        className="p-2 border rounded"
                                        value={editingRule.targetLayer}
                                        onChange={e => setEditingRule({ ...editingRule, targetLayer: e.target.value })}
                                    >
                                        <option>Backend API</option>
                                        <option>Frontend Component</option>
                                        <option>Database</option>
                                    </select>
                                </div>
                                <textarea
                                    className="w-full p-2 border rounded h-64 font-mono text-sm"
                                    value={editingRule.ticketTemplate}
                                    onChange={e => setEditingRule({ ...editingRule, ticketTemplate: e.target.value })}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleUpdateRule(editingRule)} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 flex items-center gap-2">
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Create New Rule */}
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                    <h3 className="font-bold text-slate-700 text-sm">Create New Rule</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            placeholder="Pattern Name (e.g. Cursor_Logic)"
                                            className="p-2 border rounded"
                                            value={newRule.patternName}
                                            onChange={e => setNewRule({ ...newRule, patternName: e.target.value })}
                                        />
                                        <select
                                            className="p-2 border rounded"
                                            value={newRule.targetLayer}
                                            onChange={e => setNewRule({ ...newRule, targetLayer: e.target.value })}
                                        >
                                            <option>Backend API</option>
                                            <option>Frontend Component</option>
                                            <option>Database</option>
                                        </select>
                                    </div>
                                    <textarea
                                        placeholder="Start writing your ticket template in Markdown..."
                                        className="w-full p-2 border rounded h-24"
                                        value={newRule.ticketTemplate}
                                        onChange={e => setNewRule({ ...newRule, ticketTemplate: e.target.value })}
                                    />
                                    <button onClick={handleAddRule} className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                                        <Plus size={18} /> Add Rule
                                    </button>
                                </div>

                                {/* Rules List */}
                                <div className="space-y-3">
                                    {rules.map(r => (
                                        <div key={r.id} className="p-4 border border-slate-200 rounded-xl bg-white hover:shadow-md transition flex justify-between items-center group">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-800">{r.patternName}</h4>
                                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{r.targetLayer}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                                    {r.ticketTemplate.substring(0, 100)}...
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleEditRuleClick(r.id)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 rounded hover:bg-blue-50 transition"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="max-w-xl mx-auto space-y-8">
                        <div className="flex justify-center pb-4">
                            <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                                {['DEV', 'QA', 'PROD'].map(env => (
                                    <button
                                        key={env}
                                        onClick={() => setSelectedEnv(env)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${selectedEnv === env ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {env}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" className="w-5 h-5" alt="Azure" />
                                    Azure DevOps Configuration
                                </h3>
                                <p className="text-sm text-blue-700">Configure your connection to create Work Items directly from the analysis.</p>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization URL</label>
                                    <input
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="https://dev.azure.com/myorg"
                                        value={adoConfig.orgUrl}
                                        onChange={e => setAdoConfig({ ...adoConfig, orgUrl: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                                    <input
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="MyMigrationProject"
                                        value={adoConfig.project}
                                        onChange={e => setAdoConfig({ ...adoConfig, project: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token (PAT)</label>
                                    <input
                                        type="password"
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="Token requiring Work Items Read & Write"
                                        value={adoConfig.pat}
                                        onChange={e => setAdoConfig({ ...adoConfig, pat: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={saveAdoConfig}
                                    disabled={!isAdoConfigDirty}
                                    className={`w-full py-2 rounded-lg transition font-medium ${isAdoConfigDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {isAdoConfigDirty ? 'Save ADO Configuration' : 'Saved'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-slate-200">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Github size={20} />
                                    GitHub Configuration
                                </h3>
                                <p className="text-sm text-slate-600">Configure GitHub to sync issues and pull requests.</p>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Repository URL</label>
                                    <input
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="https://github.com/myorg/myrepo"
                                        value={githubConfig.repoUrl}
                                        onChange={e => setGithubConfig({ ...githubConfig, repoUrl: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token (PAT)</label>
                                    <input
                                        type="password"
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="ghp_xxxxxxxxxxxx"
                                        value={githubConfig.token}
                                        onChange={e => setGithubConfig({ ...githubConfig, token: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={saveGithubConfig}
                                    disabled={!isGithubConfigDirty}
                                    className={`w-full py-2 rounded-lg transition font-medium ${isGithubConfigDirty ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {isGithubConfigDirty ? 'Save GitHub Configuration' : 'Saved'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
                            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2 text-lg">
                                ✨ Artificial Intelligence
                            </h3>
                            <p className="text-sm text-purple-700">
                                Configure the Generative AI provider to enable automatic code analysis, summarization, and refactoring suggestions.
                            </p>
                        </div>

                        <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">AI Provider</label>
                                <select
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={aiConfig.provider}
                                    onChange={e => setAiConfig({ ...aiConfig, provider: e.target.value })}
                                >
                                    <option value="openai">OpenAI (GPT-4)</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="ollama">Ollama (Local LLM)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Model Name</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none appearance-none bg-white"
                                        value={aiConfig.model}
                                        onChange={e => setAiConfig({ ...aiConfig, model: e.target.value })}
                                    >
                                        {AI_MODELS[aiConfig.provider]?.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Select the model to use for generation.</p>
                            </div>

                            {aiConfig.provider !== 'ollama' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                                    <input
                                        type="password"
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="sk-..."
                                        value={aiConfig.apiKey}
                                        onChange={e => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                                    />
                                </div>
                            )}

                            {aiConfig.provider === 'ollama' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
                                    <input
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="http://localhost:11434"
                                        value={aiConfig.baseUrl}
                                        onChange={e => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={saveAiConfig}
                                    disabled={!isAiConfigDirty}
                                    className={`w-full py-3 rounded-lg transition font-bold shadow-lg ${isAiConfigDirty ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-purple-900/10' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                                >
                                    {isAiConfigDirty ? 'Save AI Configuration' : 'Configuration Saved'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
