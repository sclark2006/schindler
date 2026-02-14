import React, { useState } from 'react';
import { Zap, ArrowRight, Share2, Cpu, BarChart2, Database, Code, CheckCircle, Sparkles, Loader } from 'lucide-react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CardProps {
    title: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, value, sub, icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
        <div className="bg-slate-50 p-3 rounded-xl">
            {icon}
        </div>
        <div>
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</h4>
            <div className="text-2xl font-bold mt-1">{value}</div>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
    </div>
);

interface AnalysisDashboardProps {
    analysisResult: any;
    registerService: (item: any, type: string) => void;
    setSelectedItem: (item: any) => void;
    getRecommendations: (result: any) => string[];
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysisResult, registerService, setSelectedItem, getRecommendations }) => {
    const { currentProject } = useProject();
    const [summary, setSummary] = useState<string>(analysisResult.summary || '');
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Update local summary if prop changes (e.g. parent refresh)
    React.useEffect(() => {
        if (analysisResult.summary) {
            setSummary(analysisResult.summary);
        }
    }, [analysisResult.summary]);

    const generateSummary = async () => {
        if (!currentProject) return;
        setLoadingSummary(true);
        try {
            // Construct a prompt from the analysis metrics
            const metrics = {
                complexity: analysisResult.complexityScore,
                level: analysisResult.complexityLevel,
                totalBlocks: analysisResult.parsedData?.stats?.totalBlocks,
                loc: analysisResult.parsedData?.stats?.totalLoc,
                candidates: analysisResult.parsedData?.complexityCandidates?.length || 0
            };

            // Context data for the prompt
            const contextData = {
                moduleName: analysisResult.moduleName,
                blocks: analysisResult.parsedData?.blocks || [],
                dataSources: analysisResult.parsedData?.dataSources || [],
                ...metrics,
                analysisId: analysisResult.id // Pass ID to save result
            };

            const res = await axios.post(`${API_URL}/ai/summary/${currentProject.id}`, contextData);
            setSummary(res.data.summary);
        } catch (e) {
            console.error(e);
            setSummary('Error generando el resumen. Verifica la configuración de IA.');
        } finally {
            setLoadingSummary(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* AI Summary Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={100} />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                            <Sparkles className="text-purple-600" size={20} />
                            Análisis Inteligente (AI)
                        </h3>
                        {!summary && !loadingSummary && (
                            <button
                                onClick={generateSummary}
                                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-white/80 transition flex items-center gap-2"
                            >
                                <Sparkles size={16} /> Generar Resumen
                            </button>
                        )}
                    </div>

                    {loadingSummary && (
                        <div className="flex items-center gap-3 text-indigo-700 animate-pulse">
                            <Loader className="animate-spin" size={20} />
                            <span className="text-sm font-medium">Analizando métricas y generando insights...</span>
                        </div>
                    )}

                    {summary && (
                        <div className="bg-white/60 p-4 rounded-xl backdrop-blur-sm border border-white/50 animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-indigo-900 text-sm leading-relaxed whitespace-pre-wrap">
                                {summary}
                            </p>
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={() => setSummary('')}
                                    className="text-xs text-indigo-400 hover:text-indigo-600 underline"
                                >
                                    Ocultar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card title="Puntos de Función" value={Number(analysisResult.complexityScore || 0).toFixed(0)} sub="Score Calculado" icon={<Cpu className="text-purple-500" />} />
                <Card title="Nivel de Complejidad" value={analysisResult.complexityLevel || 'N/A'} sub="Categoría" icon={<BarChart2 className="text-blue-500" />} />
                <Card title="Bloques / Tablas" value={analysisResult.parsedData?.stats?.totalBlocks || 0} sub="Entidades de Datos" icon={<Database className="text-green-500" />} />
                <Card title="Líneas PL/SQL" value={analysisResult.parsedData?.stats?.totalLoc || 0} sub="Total Código Legacy" icon={<Code className="text-orange-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Code Structure & Logic Candidates */}
                <div className="space-y-6">
                    {/* Complex Logic Candidates */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-amber-500" />
                            Candidatos a Refactorización Compleja
                        </h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {(!analysisResult.parsedData?.complexityCandidates || analysisResult.parsedData.complexityCandidates.length === 0) ? (
                                <p className="text-slate-500 italic">No se detectaron patrones complejos obvios.</p>
                            ) : (
                                analysisResult.parsedData.complexityCandidates.map((c: any, i: number) => (
                                    <div
                                        key={i}
                                        className="p-3 bg-amber-50 border border-amber-100 rounded-xl hover:shadow-md transition cursor-pointer group"
                                        onClick={() => {
                                            // Find matching code from candidate name in triggers or program units
                                            const trigger = analysisResult.parsedData.triggers.find((t: any) => t.name === c.name);
                                            const pu = analysisResult.parsedData.programUnits.find((p: any) => p.name === c.name);
                                            const code = trigger?.code || pu?.code || '';
                                            setSelectedItem({ ...c, code });
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-slate-800">{c.name}</span>
                                            <div className="flex items-center">
                                                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${c.complexityType === 'Backend Candidate' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {c.complexityType}
                                                </span>
                                                <button onClick={(e) => { e.stopPropagation(); registerService(c, 'PROGRAM_UNIT'); }} className="ml-2 text-xs text-slate-400 hover:text-blue-600" title="Register Service">
                                                    <Share2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-1">
                                            <p className="text-xs text-slate-600">Tipo: {c.type} | Razón: {c.reason}</p>
                                            <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                                Ver Detalle <ArrowRight size={10} />
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Recommendations & Migration Guide */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-600" />
                            Estrategia de Migración Sugerida
                        </h3>
                        <div className="space-y-3">
                            {getRecommendations(analysisResult).map((rec, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-blue-50 rounded-xl items-start">
                                    <ArrowRight size={18} className="text-blue-600 mt-0.5 shrink-0" />
                                    <p className="text-sm text-slate-700">{rec}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
