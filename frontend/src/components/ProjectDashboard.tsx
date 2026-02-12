import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { Plus, Trash2, Eye, FileText, Calendar, Database, Code, Layers, BarChart3, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AnalysisResult {
    id: string;
    moduleName: string;
    complexityScore: number;
    complexityLevel: string;
    createdAt: string;
    parsedData?: {
        blocks?: any[];
        triggers?: any[];
        programUnits?: any[];
        recordGroups?: any[];
        stats?: any;
    };
}

interface ProjectDashboardProps {
    onNewAnalysis: () => void;
    onViewAnalysis: (analysisId: string) => void;
}

// Compute migration % for a module based on components
const computeMigrationProgress = (analysis: AnalysisResult): {
    overall: number;
    blocks: { total: number; migrated: number };
    plsql: { total: number; migrated: number };
    recordGroups: { total: number; migrated: number };
    frontend: { total: number; migrated: number };
} => {
    const parsed = analysis.parsedData;
    if (!parsed) return { overall: 0, blocks: { total: 0, migrated: 0 }, plsql: { total: 0, migrated: 0 }, recordGroups: { total: 0, migrated: 0 }, frontend: { total: 0, migrated: 0 } };

    // For now, estimate migration progress heuristically
    // In production, this would come from ticket/recommendation status
    const blocksTotal = parsed.blocks?.length || 0;
    const triggersTotal = parsed.triggers?.length || 0;
    const puTotal = parsed.programUnits?.length || 0;
    const rgTotal = parsed.recordGroups?.length || 0;
    const plsqlTotal = triggersTotal + puTotal;

    // Placeholder: 0% migrated (actual would check recommendation/ticket status)
    return {
        overall: 0,
        blocks: { total: blocksTotal, migrated: 0 },
        plsql: { total: plsqlTotal, migrated: 0 },
        recordGroups: { total: rgTotal, migrated: 0 },
        frontend: { total: blocksTotal, migrated: 0 }, // Each block maps to a UI view
    };
};

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onNewAnalysis, onViewAnalysis }) => {
    const { currentProject } = useProject();
    const { token } = useAuth();
    const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentProject && token) {
            fetchAnalyses();
        }
    }, [currentProject, token]);

    const fetchAnalyses = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/analysis/project/${currentProject?.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalyses(res.data);
        } catch (error) {
            console.error('Failed to fetch analyses', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this analysis?')) return;
        try {
            await axios.delete(`${API_URL}/analysis/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAnalyses();
        } catch (error) {
            console.error('Failed to delete analysis', error);
        }
    };

    if (!currentProject) return null;

    // Aggregate stats across all analyses
    const totalModules = analyses.length;
    const totalBlocks = analyses.reduce((sum, a) => sum + (a.parsedData?.blocks?.length || 0), 0);
    const totalTriggers = analyses.reduce((sum, a) => sum + (a.parsedData?.triggers?.length || 0), 0);
    const totalPU = analyses.reduce((sum, a) => sum + (a.parsedData?.programUnits?.length || 0), 0);
    const totalRG = analyses.reduce((sum, a) => sum + (a.parsedData?.recordGroups?.length || 0), 0);
    const totalComponents = totalBlocks + totalTriggers + totalPU + totalRG;
    const avgComplexity = analyses.length > 0
        ? Math.round(analyses.reduce((sum, a) => sum + (a.complexityScore || 0), 0) / analyses.length)
        : 0;

    // Overall migration progress (aggregate)
    const moduleProgresses = analyses.map(computeMigrationProgress);
    const overallMigrated = moduleProgresses.reduce((sum, p) => {
        const total = p.blocks.total + p.plsql.total + p.recordGroups.total + p.frontend.total;
        const migrated = p.blocks.migrated + p.plsql.migrated + p.recordGroups.migrated + p.frontend.migrated;
        return sum + (total > 0 ? (migrated / total) * 100 : 0);
    }, 0);
    const overallProgress = analyses.length > 0 ? Math.round(overallMigrated / analyses.length) : 0;

    const complexityColor = (level: string) => {
        if (level === 'Low' || level === 'Baja') return 'bg-green-50 text-green-700 border-green-200';
        if (level === 'Medium' || level === 'Media') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        return 'bg-red-50 text-red-700 border-red-200';
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Project: {currentProject.name}</h1>
                    <p className="text-slate-500">{currentProject.description || 'No description'}</p>
                </div>
                <button
                    onClick={onNewAnalysis}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    New Analysis
                </button>
            </div>

            {/* Dashboard Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Layers size={20} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Modules</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{totalModules}</p>
                    <p className="text-xs text-slate-400 mt-1">{totalComponents} total components</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Database size={20} className="text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Data Blocks</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{totalBlocks}</p>
                    <p className="text-xs text-slate-400 mt-1">{totalRG} record groups</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Code size={20} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">PL/SQL Logic</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{totalTriggers + totalPU}</p>
                    <p className="text-xs text-slate-400 mt-1">{totalTriggers} triggers · {totalPU} program units</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <TrendingUp size={20} className="text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Migration Progress</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{overallProgress}%</p>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Average Complexity Widget */}
            {analyses.length > 0 && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-slate-300 mb-1">Average Complexity Score</h3>
                            <p className="text-4xl font-bold">{avgComplexity}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                                <p className="text-slate-400">High</p>
                                <p className="text-xl font-bold text-red-400">
                                    {analyses.filter(a => a.complexityLevel === 'Alta' || a.complexityLevel === 'High').length}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400">Medium</p>
                                <p className="text-xl font-bold text-yellow-400">
                                    {analyses.filter(a => a.complexityLevel === 'Media' || a.complexityLevel === 'Medium').length}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400">Low</p>
                                <p className="text-xl font-bold text-green-400">
                                    {analyses.filter(a => a.complexityLevel === 'Baja' || a.complexityLevel === 'Low').length}
                                </p>
                            </div>
                        </div>
                        <BarChart3 size={48} className="text-slate-600" />
                    </div>
                </div>
            )}

            {/* Modules Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={18} className="text-slate-400" />
                        Analyzed Modules
                    </h2>
                    <span className="text-xs text-slate-400">{analyses.length} module(s)</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Module</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Complexity</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Components</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Migration</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Analyzed</th>
                                <th className="px-6 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {analyses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                <FileText size={24} />
                                            </div>
                                            <p>No analyses registered in this project.</p>
                                            <button onClick={onNewAnalysis} className="text-blue-600 hover:underline text-sm">
                                                Start a new analysis
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {analyses.map((analysis) => {
                                const progress = computeMigrationProgress(analysis);
                                const totalItems = progress.blocks.total + progress.plsql.total + progress.recordGroups.total + progress.frontend.total;
                                const migratedItems = progress.blocks.migrated + progress.plsql.migrated + progress.recordGroups.migrated + progress.frontend.migrated;
                                const pct = totalItems > 0 ? Math.round((migratedItems / totalItems) * 100) : 0;

                                return (
                                    <tr key={analysis.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onViewAnalysis(analysis.id)}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800 flex items-center gap-2">
                                                <FileText size={16} className="text-blue-500" />
                                                {analysis.moduleName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${complexityColor(analysis.complexityLevel)}`}>
                                                {analysis.complexityLevel} ({analysis.complexityScore})
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-3 text-xs text-slate-500">
                                                <span title="Data Blocks" className="flex items-center gap-1">
                                                    <Database size={12} className="text-indigo-400" />{progress.blocks.total}
                                                </span>
                                                <span title="PL/SQL" className="flex items-center gap-1">
                                                    <Code size={12} className="text-purple-400" />{progress.plsql.total}
                                                </span>
                                                <span title="Record Groups" className="flex items-center gap-1">
                                                    <Layers size={12} className="text-amber-400" />{progress.recordGroups.total}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-slate-200'}`}
                                                        style={{ width: `${Math.max(pct, 2)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600">{pct}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(analysis.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => onViewAnalysis(analysis.id)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(analysis.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
