import React, { useState } from 'react';
import axios from 'axios';
import {
    FileText,
    Settings,
    BarChart2,
    CheckCircle,
    AlertTriangle,
    PlusCircle,
    Database,
    Share2,
    LogOut,
    User
} from 'lucide-react';
import { ServiceRegistry } from './components/ServiceRegistry';
import { SettingsPanel } from './components/SettingsPanel';
import { DetailsModal } from './components/DetailsModal';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { BlocksTable } from './components/BlocksTable';
import { PlSqlViewer } from './components/PlSqlViewer';
import { RecordGroupsTable } from './components/RecordGroupsTable';
import { ArchitectureView } from './components/ArchitectureView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';

import { AnalysisResult } from './types/analysis';

interface Message {
    type: 'success' | 'error';
    text: string;
}

const AuthenticatedApp: React.FC = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'config' | 'registry'>('upload');
    const [analysisSubTab, setAnalysisSubTab] = useState<'dashboard' | 'blocks' | 'plsql' | 'record-groups' | 'architecture'>('dashboard');

    // ... (rest of the file until sub-tabs)


    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    // API URL - Environment variable or default
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post<AnalysisResult>(`${API_URL}/analysis/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setAnalysisResult(response.data);
            setActiveTab('analysis');
            setMessage({ type: 'success', text: 'Análisis completado exitosamente.' });
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage({ type: 'error', text: 'Error al analizar el archivo. Asegúrate de que el Backend esté corriendo.' });
        } finally {
            setLoading(false);
        }
    };

    const createDevOpsTicket = (item: string) => {
        setMessage({ type: 'success', text: `Ticket creado en Azure DevOps para: ${item}` });
        setTimeout(() => setMessage(null), 3000);
    };

    const registerService = async (item: any, type: string) => {
        try {
            await axios.post(`${API_URL}/governance/register`, {
                originalName: item.name,
                sourceType: type,
                proposedServiceName: `get-${item.name.toLowerCase().replace(/_/g, '-')}`,
                status: 'PENDING',
                complexity: item.type === 'ProgramUnit' ? 'HIGH' : 'LOW',
                sqlLogic: item.query || item.reason
            });
            setMessage({ type: 'success', text: `Servicio registrado: ${item.name}` });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error registering service:', error);
            setMessage({ type: 'error', text: 'Error al registrar servicio.' });
        }
    };

    // Helper to generate recommendations based on backend data
    const getRecommendations = (result: AnalysisResult) => {
        const recs = [];
        const data = result.parsedData;

        if (data.stats.totalLoc > 1000) recs.push("Volumen alto de código PL/SQL: Priorizar migración de lógica compleja a Backend (NestJS/Stored Procedures).");
        if (data.complexityCandidates.some(c => c.complexityType === 'UI Refactor Required')) recs.push("Lógica UI Síncrona detectada: Refactorizar 'Show_Lov' y alertas a componentes React controlados / Modales Async.");
        if (data.recordGroups.length > 0) recs.push(`Se detectaron ${data.recordGroups.length} Record Groups: Migrar a Endpoints REST GET.`);

        return recs;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header */}
            <header className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center transition-all">
                <div className="flex items-center gap-2">
                    <Database className="text-blue-400" />
                    <h1 className="text-xl font-bold tracking-tight">Oracle Forms Migration Architect</h1>
                </div>

                <div className="flex items-center gap-6">
                    {/* Navigation */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`p-2 rounded-lg transition ${activeTab === 'upload' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                            title="Upload"
                        >
                            <FileText size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`p-2 rounded-lg transition ${activeTab === 'analysis' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                            title="Analysis"
                        >
                            <BarChart2 size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`p-2 rounded-lg transition ${activeTab === 'config' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
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
                {message && (
                    <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800'}`}>
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                        {message.text}
                    </div>
                )}

                {/* TAB: UPLOAD */}
                {activeTab === 'upload' && (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-300 rounded-2xl bg-white animate-in fade-in zoom-in duration-300">
                        <div className="bg-blue-50 p-6 rounded-full mb-4">
                            <FileText size={48} className="text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">Cargar Módulo XML</h2>
                        <p className="text-slate-500 mb-6 text-center max-w-md">
                            Exporta tu archivo .FMB a formato XML usando Forms2XML y súbelo aquí para comenzar el análisis.
                        </p>
                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl cursor-pointer transition flex items-center gap-2 font-medium">
                            <PlusCircle size={20} />
                            Seleccionar Archivo XML
                            <input type="file" className="hidden" accept=".xml" onChange={handleFileUpload} />
                        </label>
                        {loading && <p className="mt-4 animate-pulse text-blue-600">Analizando con Backend...</p>}
                    </div>
                )}

                {/* TAB: ANALYSIS */}
                {activeTab === 'analysis' && analysisResult && (
                    <div className="space-y-6">
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
                                Bloques ({analysisResult.parsedData.blocks.length})
                            </button>
                            <button
                                onClick={() => setAnalysisSubTab('plsql')}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${analysisSubTab === 'plsql' ? 'bg-white border text-blue-600 border-b-white -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                PL/SQL ({analysisResult.parsedData.triggers.length + analysisResult.parsedData.programUnits.length})
                            </button>
                            <button
                                onClick={() => setAnalysisSubTab('record-groups')}
                                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${analysisSubTab === 'record-groups' ? 'bg-white border text-blue-600 border-b-white -mb-px' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                Record Groups ({analysisResult.parsedData.recordGroups.length})
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
                            <BlocksTable
                                blocks={analysisResult.parsedData.blocks}
                                setSelectedItem={setSelectedItem}
                                createDevOpsTicket={createDevOpsTicket}
                            />
                        )}

                        {analysisSubTab === 'plsql' && (
                            <PlSqlViewer
                                triggers={analysisResult.parsedData.triggers}
                                programUnits={analysisResult.parsedData.programUnits}
                                setSelectedItem={setSelectedItem}
                                registerService={registerService}
                            />
                        )}

                        {analysisSubTab === 'record-groups' && (
                            <RecordGroupsTable
                                recordGroups={analysisResult.parsedData.recordGroups}
                                registerService={registerService}
                                createDevOpsTicket={createDevOpsTicket}
                            />
                        )}
                    </div>
                )}

                {/* TAB: CONFIGURATION */}
                {activeTab === 'config' && (
                    <SettingsPanel />
                )}

                {/* TAB: SERVICE REGISTRY */}
                {activeTab === 'registry' && (
                    <ServiceRegistry />
                )}

                {activeTab === 'analysis' && !analysisResult && (
                    <div className="text-center py-20">
                        <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
                        <h3 className="text-xl font-bold">No hay datos para analizar</h3>
                        <p className="text-slate-500">Sube un archivo XML en la pestaña de carga primero.</p>
                    </div>
                )}
            </main>

            <DetailsModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
};

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <AuthenticatedApp /> : <Login />;
}

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
