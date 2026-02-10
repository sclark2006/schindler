import React from 'react';
import { Zap, ArrowRight, Share2, Cpu, BarChart2, Database, Code, CheckCircle } from 'lucide-react';

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
    return (
        <div className="space-y-6">
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
