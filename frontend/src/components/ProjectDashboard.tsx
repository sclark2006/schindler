import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { Plus, Trash2, Eye, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AnalysisResult {
    id: string;
    moduleName: string;
    complexityScore: number;
    complexityLevel: string;
    createdAt: string;
}

interface ProjectDashboardProps {
    onNewAnalysis: () => void;
    onViewAnalysis: (analysisId: string) => void;
}

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
        if (!confirm('¿Estás seguro de eliminar este análisis?')) return;
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

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Panel de Proyecto: {currentProject.name}</h1>
                    <p className="text-slate-500">{currentProject.description || 'Sin descripción'}</p>
                </div>
                <button
                    onClick={onNewAnalysis}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    Nuevo Análisis
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Módulo</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Complejidad</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Fecha Análisis</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {analyses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                <FileText size={24} />
                                            </div>
                                            <p>No hay análisis registrados en este proyecto.</p>
                                            <button onClick={onNewAnalysis} className="text-blue-600 hover:underline text-sm">
                                                Comenzar un nuevo análisis
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {analyses.map((analysis) => (
                                <tr key={analysis.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800 flex items-center gap-2">
                                            <FileText size={16} className="text-slate-400" />
                                            {analysis.moduleName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${analysis.complexityLevel === 'Baja' ? 'bg-green-50 text-green-700 border-green-200' :
                                                analysis.complexityLevel === 'Media' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                            {analysis.complexityLevel} ({analysis.complexityScore})
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm flex items-center gap-2">
                                        <Calendar size={14} />
                                        {new Date(analysis.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewAnalysis(analysis.id)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Ver Detalles"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(analysis.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
