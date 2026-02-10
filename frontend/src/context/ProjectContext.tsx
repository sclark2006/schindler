import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface Project {
    id: string;
    name: string;
    description: string;
}

interface ProjectContextType {
    projects: Project[];
    currentProject: Project | null;
    setCurrentProject: (project: Project) => void;
    isLoading: boolean;
    refreshProjects: () => Promise<void>;
    createProject: (name: string, description: string) => Promise<any>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const fetchProjects = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_URL}/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(res.data);

            // Auto-select stored project or default
            const storedProjectId = localStorage.getItem('currentProjectId');
            if (storedProjectId) {
                const found = res.data.find((p: Project) => p.id === storedProjectId);
                if (found) {
                    setCurrentProject(found);
                } else if (res.data.length > 0) {
                    setCurrentProject(res.data[0]);
                }
            } else if (res.data.length > 0) {
                setCurrentProject(res.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [token]);

    const handleSetCurrentProject = (project: Project) => {
        setCurrentProject(project);
        localStorage.setItem('currentProjectId', project.id);
    };

    const createProject = async (name: string, description: string) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/projects`, { name, description }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newProject = res.data;
            setProjects([...projects, newProject]);
            setCurrentProject(newProject);
            localStorage.setItem('currentProjectId', newProject.id);
            return newProject;
        } catch (error) {
            console.error('Failed to create project', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            currentProject,
            setCurrentProject: handleSetCurrentProject,
            isLoading,
            refreshProjects: fetchProjects,
            createProject
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
