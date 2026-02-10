import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Save } from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<'domains' | 'rules'>('domains');
    const [domains, setDomains] = useState<BusinessDomain[]>([]);
    const [rules, setRules] = useState<MigrationRule[]>([]);
    const [newDomain, setNewDomain] = useState({ name: '', description: '', owner: '' });
    const [newRule, setNewRule] = useState({ patternName: '', ticketTemplate: '', targetLayer: 'Backend API' });

    useEffect(() => {
        fetchDomains();
        fetchRules();
    }, []);

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

    const handleAddDomain = async () => {
        if (!newDomain.name) return;
        try {
            await axios.post(`${API_URL}/governance/domains`, newDomain);
            setNewDomain({ name: '', description: '', owner: '' });
            fetchDomains();
        } catch (e) { console.error(e); }
    };

    const handleAddRule = async () => {
        if (!newRule.patternName) return;
        try {
            await axios.post(`${API_URL}/governance/rules`, newRule);
            setNewRule({ patternName: '', ticketTemplate: '', targetLayer: 'Backend API' });
            fetchRules();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
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
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
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
            </div>
        </div>
    );
};
