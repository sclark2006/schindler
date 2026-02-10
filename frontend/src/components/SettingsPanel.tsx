import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Save, Github } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export const SettingsPanel: React.FC = () => {
    const { currentProject } = useProject();
    const [activeTab, setActiveTab] = useState<'domains' | 'rules' | 'integrations'>('domains');

    // Domain State
    const [domains, setDomains] = useState<BusinessDomain[]>([]);
    const [newDomain, setNewDomain] = useState({ name: '', description: '', owner: '' });

    // Rules State
    const [rules, setRules] = useState<MigrationRule[]>([]);
    const [newRule, setNewRule] = useState({ patternName: '', ticketTemplate: '', targetLayer: 'Backend API' });
    // ADO Config Configuration
    const [adoConfig, setAdoConfig] = useState({ orgUrl: '', project: '', pat: '' });
    // GitHub Config Configuration
    const [githubConfig, setGithubConfig] = useState({ repoUrl: '', token: '' });

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: null }), 3000);
    };

    useEffect(() => {
        if (currentProject) {
            fetchDomains();
            fetchRules();
            fetchAdoConfig();
            fetchGithubConfig();
        }
    }, [currentProject]);

    const fetchAdoConfig = async () => {
        if (!currentProject) return;
        try {
            const res = await axios.get(`${API_URL}/governance/config`, { params: { projectId: currentProject.id } });
            const configs = res.data;
            if (configs.length > 0) {
                setAdoConfig({
                    orgUrl: configs.find((c: any) => c.key === 'ADO_ORG_URL')?.value || '',
                    project: configs.find((c: any) => c.key === 'ADO_PROJECT')?.value || '',
                    pat: configs.find((c: any) => c.key === 'ADO_PAT')?.value || ''
                });
            }
        } catch (e) { console.error(e); }
    };

    const fetchGithubConfig = async () => {
        if (!currentProject) return;
        try {
            const res = await axios.get(`${API_URL}/governance/config`, { params: { projectId: currentProject.id } });
            const configs = res.data;
            if (configs.length > 0) {
                setGithubConfig({
                    repoUrl: configs.find((c: any) => c.key === 'GITHUB_REPO_URL')?.value || '',
                    token: configs.find((c: any) => c.key === 'GITHUB_TOKEN')?.value || ''
                });
            }
        } catch (e) { console.error(e); }
    };

    const saveAdoConfig = async () => {
        if (!currentProject) return;
        try {
            await axios.post(`${API_URL}/governance/config`, { key: 'ADO_ORG_URL', value: adoConfig.orgUrl, description: 'Azure DevOps Organization URL', projectId: currentProject.id });
            await axios.post(`${API_URL}/governance/config`, { key: 'ADO_PROJECT', value: adoConfig.project, description: 'Project Name', projectId: currentProject.id });
            await axios.post(`${API_URL}/governance/config`, { key: 'ADO_PAT', value: adoConfig.pat, description: 'Personal Access Token', isSecret: true, projectId: currentProject.id });
            showToast('Configuración ADO guardada exitosamente.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error al guardar la configuración ADO.', 'error');
        }
    };

    const saveGithubConfig = async () => {
        if (!currentProject) return;
        try {
            await axios.post(`${API_URL}/governance/config`, { key: 'GITHUB_REPO_URL', value: githubConfig.repoUrl, description: 'GitHub Repository URL', projectId: currentProject.id });
            await axios.post(`${API_URL}/governance/config`, { key: 'GITHUB_TOKEN', value: githubConfig.token, description: 'GitHub Personal Access Token', isSecret: true, projectId: currentProject.id });
            showToast('Configuración GitHub guardada exitosamente.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error al guardar la configuración GitHub.', 'error');
        }
    };

    const fetchDomains = async () => {
        try {
            const res = await axios.get(`${API_URL}/governance/domains`);
            setDomains(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchRules = async () => {
        try {
            const res = await axios.get(`${API_URL}/governance/rules`);
            setRules(res.data);
        } catch (e) { console.error(e); }
    };

    // ... handleAddDomain with toast ...
    const handleAddDomain = async () => {
        if (!newDomain.name) return;
        try {
            await axios.post(`${API_URL}/governance/domains`, newDomain);
            setNewDomain({ name: '', description: '', owner: '' });
            fetchDomains();
            showToast('Dominio agregado.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error al agregar dominio.', 'error');
        }
    };

    // ... handleAddRule with toast ...
    const handleAddRule = async () => {
        if (!newRule.patternName) return;
        try {
            await axios.post(`${API_URL}/governance/rules`, newRule);
            setNewRule({ patternName: '', ticketTemplate: '', targetLayer: 'Backend API' });
            fetchRules();
            showToast('Regla agregada.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Error al agregar regla.', 'error');
        }
    };

    if (!currentProject) {
        return (
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-slate-100 p-6 rounded-full mb-6">
                    <Settings className="text-slate-400" size={48} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Configuración no disponible</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    Para acceder al panel de configuración, primero debes crear o seleccionar un proyecto activo.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.href = '/'} // Or logic to go back to upload/home
                        className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-medium"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col relative overflow-hidden">
            {/* Toast Notification */}
            {toast.type && (
                <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-2 z-50 ${toast.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    {toast.message}
                </div>
            )}

            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <Settings className="text-slate-400" />
                <h2 className="text-xl font-bold text-slate-800">Governance Configuration</h2>
            </div>

            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('domains')}
                    className={`px-6 py-3 text-sm font-medium ${activeTab === 'domains' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Business Domains
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-3 text-sm font-medium ${activeTab === 'rules' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Migration Rules & Templates
                </button>
                <button
                    onClick={() => setActiveTab('integrations')}
                    className={`px-6 py-3 text-sm font-medium ${activeTab === 'integrations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Integrations
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {activeTab === 'domains' && (
                    <div className="space-y-6">
                        {/* ... domains content ... */}
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
                        {/* ... rules content ... */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
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
                                <Save size={18} /> Save Rule Template
                            </button>
                        </div>

                        <div className="space-y-4">
                            {rules.map(r => (
                                <div key={r.id} className="p-5 border border-slate-200 rounded-xl bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{r.patternName}</h4>
                                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 mt-1 inline-block">{r.targetLayer}</span>
                                        </div>
                                    </div>
                                    <pre className="bg-slate-50 p-3 rounded text-xs text-slate-600 overflow-x-auto border border-slate-100 mt-3 whitespace-pre-wrap">
                                        {r.ticketTemplate}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="max-w-xl mx-auto space-y-8">
                        {/* Azure DevOps Section */}
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
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    Save ADO Configuration
                                </button>
                            </div>
                        </div>

                        {/* GitHub Section */}
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
                                    className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-900 transition font-medium"
                                >
                                    Save GitHub Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
