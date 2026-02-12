import React, { useState } from 'react';
import axios from 'axios';
import { AboutModal } from './components/AboutModal';
import {
    FileText,
    Settings,
    CheckCircle,
    AlertTriangle,
    PlusCircle,
    Database,
    Share2,
    LogOut,
    User,
    Trash2,
    HelpCircle
} from 'lucide-react';
import { ServiceRegistry } from './components/ServiceRegistry';
import { ProjectSettings } from './components/ProjectSettings';
import { DetailsModal } from './components/DetailsModal';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { BlocksTable } from './components/BlocksTable';
import { PlSqlViewer } from './components/PlSqlViewer';
import { RecordGroupsTable } from './components/RecordGroupsTable';
import { ArchitectureView } from './components/ArchitectureView';
import { TicketCreationModal } from './components/TicketCreationModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { ProjectSelector } from './components/ProjectSelector';
import { ProjectDashboard } from './components/ProjectDashboard';
import { Login } from './pages/Login';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BlockDetailView } from './views/BlockDetailView';

import { AnalysisResult } from './types/analysis';

interface Message {
    type: 'success' | 'error';
    text: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


const AuthenticatedApp: React.FC = () => {
    const { user, logout, token } = useAuth();
    const { currentProject } = useProject();
    const [activeTab, setActiveTab] = useState<'project' | 'registry' | 'settings'>('project');

    // Project Flow State: 'dashboard' | 'upload' | 'detail'
    const [projectView, setProjectView] = useState<'dashboard' | 'upload' | 'detail'>('dashboard');

    const [message, setMessage] = useState<Message | null>(null);

    // Toast helper
    const showToast = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisSubTab, setAnalysisSubTab] = useState<'dashboard' | 'architecture' | 'blocks' | 'plsql' | 'record-groups'>('dashboard');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null); // New state for SPA block navigation
    const [ticketModal, setTicketModal] = useState({ isOpen: false, title: '', description: '' });
    const [showAbout, setShowAbout] = useState(false);

    // New: Fetch specific analysis
    const fetchAnalysisById = async (id: string) => {
        if (!currentProject || !token) {
            console.error('Missing project or token');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/analysis/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalysisResult(res.data);
            setProjectView('detail');
            setAnalysisSubTab('dashboard');
        } catch (error) {
            console.error(error);
            showToast('error', 'Error loading analysis.');
        } finally {
            setLoading(false);
        }
    };

    const openTicketModal = (title: string, description?: string) => {
        setTicketModal({ isOpen: true, title, description: description || '' });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!currentProject) {
            showToast('error', 'Please select a project first.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', currentProject.id);

        try {
            const response = await axios.post<AnalysisResult>(`${API_URL}/analysis/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });

            setAnalysisResult(response.data);
            setProjectView('detail');
            showToast('success', 'Analysis completed successfully.');
        } catch (error) {
            console.error('Error uploading file:', error);
            showToast('error', 'Error analyzing file. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    // Actions in Detail View
    const handleSaveAnalysis = () => {
        // The analysis is already saved in the DB (jsonb) upon upload.
        // This action validates the workflow and returns to dashboard.
        setProjectView('dashboard');
        showToast('success', 'Analysis linked to project and saved.');
    };

    const handleDiscardAnalysis = async () => {
        if (!analysisResult || !token) return;
        if (!confirm('Are you sure you want to discard this analysis? It will be permanently deleted.')) return;

        try {
            await axios.delete(`${API_URL}/analysis/${analysisResult.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalysisResult(null);
            setProjectView('dashboard');
            showToast('success', 'Analysis discarded.');
        } catch (error) {
            console.error(error);
            showToast('error', 'Error deleting analysis.');
        }
    };

    const registerService = async (item: any, type: string) => {
        try {
            await axios.post(`${API_URL}/governance/register`, {
                originalName: item.name,
                sourceType: type,
                proposedServiceName: `get-${item.name.toLowerCase().replace(/_/g, '-')}`,
                status: 'PENDING',
                complexity: item.type === 'ProgramUnit' ? 'HIGH' : 'LOW',
                sqlLogic: item.query || item.reason,
                projectId: currentProject?.id
            });
            showToast('success', `Service registered: ${item.name}`);
            // No need for extra setTimeout, showToast handles it
        } catch (error) {
            console.error('Error registering service:', error);
            showToast('error', 'Error registering service.');
        }
    };

    // Helper to generate recommendations based on backend data
    const getRecommendations = (result: AnalysisResult) => {
        const recs = [];
        const data = result.parsedData || {};
        const stats = data.stats || {};
        const candidates = data.complexityCandidates || [];
        const groups = data.recordGroups || [];

        if ((stats.totalLoc || 0) > 1000) recs.push("Volumen alto de código PL/SQL: Priorizar migración de lógica compleja a Backend (NestJS/Stored Procedures).");
        if (candidates.some((c: any) => c.complexityType === 'UI Refactor Required')) recs.push("Lógica UI Síncrona detectada: Refactorizar 'Show_Lov' y alertas a componentes React controlados / Modales Async.");
        if (groups.length > 0) recs.push(`Se detectaron ${groups.length} Record Groups: Migrar a Endpoints REST GET.`);

        return recs;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header */}
            <header className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center transition-all sticky top-0 z-50">
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => { setActiveTab('project'); setProjectView('dashboard'); }}>
                    <Database className="text-blue-400" />
                    <h1 className="text-xl font-bold tracking-tight">Schindler</h1>
                    <div className="ml-6 border-l border-slate-700 pl-6" onClick={(e) => e.stopPropagation()}>
                        <ProjectSelector />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Navigation */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setActiveTab('project'); setProjectView('dashboard'); }}
                            className={`p-2 rounded-lg transition ${activeTab === 'project' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                            title="Projects"
                        >
                            <FileText size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`p-2 rounded-lg transition ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                            title="Configuration"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('registry')}
                            className={`p-2 rounded-lg transition ${activeTab === 'registry' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                            title="Registry"
                        >
                            <Share2 size={20} />
                        </button>
                        <button
                            onClick={() => setShowAbout(true)}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title="About Schindler"
                        >
                            <HelpCircle size={20} />
                        </button>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-6 border-l border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <User size={16} />
                            <span className="font-medium">{user?.username}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white p-2 rounded-lg transition"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                {/* Toast Notification */}
                {message && (
                    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 ${message.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                        }`}>
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                        {message.text}
                    </div>
                )}

                {/* TAB: PROJECT (Dashboard / Upload / Detail) */}
                {activeTab === 'project' && (
                    <>
                        {projectView === 'dashboard' && (
                            <ProjectDashboard
                                onNewAnalysis={() => setProjectView('upload')}
                                onViewAnalysis={fetchAnalysisById}
                            />
                        )}

                        {projectView === 'upload' && (
                            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                                <button
                                    onClick={() => setProjectView('dashboard')}
                                    className="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2 text-sm font-medium"
                                >
                                    &larr; Back to Dashboard
                                </button>
                                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-300 rounded-2xl bg-white">
                                    <div className="bg-blue-50 p-6 rounded-full mb-4">
                                        <FileText size={48} className="text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-semibold mb-2">Upload XML Module</h2>
                                    <p className="text-slate-500 mb-6 text-center max-w-md">
                                        Export your .FMB file to XML format using Forms2XML and upload it here to start the analysis.
                                    </p>
                                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl cursor-pointer transition flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20">
                                        <PlusCircle size={20} />
                                        Select XML File
                                        <input type="file" className="hidden" accept=".xml" onChange={handleFileUpload} />
                                    </label>
                                    {loading && <p className="mt-4 animate-pulse text-blue-600 font-medium">Analyzing with Backend...</p>}
                                </div>
                            </div>
                        )}

                        {projectView === 'detail' && analysisResult && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Detail Header & Actions */}
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setProjectView('dashboard')}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            &larr;
                                        </button>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">{analysisResult.moduleName}</h2>
                                            <span className="text-xs text-slate-500">Analizado el {new Date(analysisResult.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDiscardAnalysis}
                                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                        <button
                                            onClick={handleSaveAnalysis}
                                            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium transition flex items-center gap-2 shadow-lg"
                                        >
                                            <CheckCircle size={16} /> Save & Exit
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-tabs Navigation */}
                                <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
                                    <button
                                        onClick={() => setAnalysisSubTab('dashboard')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${analysisSubTab === 'dashboard' ? 'bg-white border text-blue-600 border-b-white -mb-px hover:text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => setAnalysisSubTab('architecture')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${analysisSubTab === 'architecture' ? 'bg-white border text-blue-600 border-b-white -mb-px hover:text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        Architecture
                                    </button>
                                    <button
                                        onClick={() => setAnalysisSubTab('blocks')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${analysisSubTab === 'blocks' ? 'bg-white border text-blue-600 border-b-white -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        Blocks ({analysisResult.parsedData?.blocks?.length || 0})
                                    </button>
                                    <button
                                        onClick={() => setAnalysisSubTab('plsql')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${analysisSubTab === 'plsql' ? 'bg-white border text-blue-600 border-b-white -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        PL/SQL ({(analysisResult.parsedData?.triggers?.length || 0) + (analysisResult.parsedData?.programUnits?.length || 0)})
                                    </button>
                                    <button
                                        onClick={() => setAnalysisSubTab('record-groups')}
                                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${analysisSubTab === 'record-groups' ? 'bg-white border text-blue-600 border-b-white -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        Record Groups ({analysisResult.parsedData?.recordGroups?.length || 0})
                                    </button>
                                </div>

                                {/* Sub-tab Content */}
                                {analysisSubTab === 'dashboard' && (
                                    <AnalysisDashboard
                                        analysisResult={analysisResult}
                                        registerService={registerService}
                                        setSelectedItem={setSelectedItem}
                                        getRecommendations={getRecommendations}
                                    />
                                )}

                                {analysisSubTab === 'architecture' && (
                                    <ArchitectureView analysisResult={analysisResult} />
                                )}

                                {analysisSubTab === 'blocks' && (
                                    selectedBlock ? (
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-250px)]">
                                            <BlockDetailView
                                                analysisResult={analysisResult}
                                                blockName={selectedBlock}
                                                onBack={() => setSelectedBlock(null)}
                                            />
                                        </div>
                                    ) : (
                                        <BlocksTable
                                            blocks={analysisResult.parsedData.blocks}
                                            setSelectedItem={setSelectedItem}
                                            createDevOpsTicket={openTicketModal}
                                            onBlockSelect={setSelectedBlock}
                                        />
                                    )
                                )}

                                {analysisSubTab === 'plsql' && (
                                    <PlSqlViewer
                                        triggers={analysisResult.parsedData.triggers}
                                        programUnits={analysisResult.parsedData.programUnits}
                                        setSelectedItem={setSelectedItem}
                                        registerService={registerService}
                                        createDevOpsTicket={openTicketModal}
                                    />
                                )}

                                {analysisSubTab === 'record-groups' && (
                                    <RecordGroupsTable
                                        recordGroups={analysisResult.parsedData.recordGroups}
                                        registerService={registerService}
                                        createDevOpsTicket={openTicketModal}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* TAB: CONFIGURATION */}
                {activeTab === 'settings' && (
                    <ProjectSettings />
                )}

                {/* TAB: SERVICE REGISTRY */}
                {activeTab === 'registry' && (
                    <ServiceRegistry />
                )}
            </main>

            <DetailsModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
            <TicketCreationModal
                isOpen={ticketModal.isOpen}
                onClose={() => setTicketModal({ ...ticketModal, isOpen: false })}
                initialTitle={ticketModal.title}
                initialDescription={ticketModal.description}
                projectId={currentProject?.id}
            />
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
        </div>
    );
};

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <AuthenticatedApp /> : <Login />;
}

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ProjectProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/*" element={<AppContent />} />
                    </Routes>
                </ProjectProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
