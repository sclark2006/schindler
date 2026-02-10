import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { ChevronDown, Folder, Plus } from 'lucide-react';
import { ProjectCreationModal } from './ProjectCreationModal';

export const ProjectSelector: React.FC = () => {
    const { projects, currentProject, setCurrentProject } = useProject();
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
                <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded flex items-center justify-center">
                    <Folder size={14} />
                </div>
                <span className="font-medium text-slate-200 text-sm">
                    {currentProject ? currentProject.name : 'Seleccionar Proyecto'}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Switch Project
                    </div>
                    {projects.length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-400 italic text-center">
                            No projects found
                        </div>
                    )}
                    {projects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => {
                                setCurrentProject(project);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-50 transition-colors ${currentProject && project.id === currentProject.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                        >
                            <Folder size={14} className={currentProject && project.id === currentProject.id ? 'text-blue-500' : 'text-slate-400'} />
                            {project.name}
                        </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1 px-2 pb-2">
                        <button
                            onClick={() => {
                                setIsModalOpen(true);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                            <Plus size={14} />
                            Create New Project
                        </button>
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}

            <ProjectCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};
