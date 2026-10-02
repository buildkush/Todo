'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, Project } from '@/lib/api-client';

interface AppContextType {
    // Projects state
    projects: Project[];
    loading: boolean;
    error: string | null;
    addProject: (name: string, viewType?: 'list' | 'board', description?: string, color?: string) => Promise<Project>;
    updateProject: (projectId: string, updates: Partial<Project>) => Promise<Project>;
    deleteProject: (projectId: string) => Promise<void>;
    refetchProjects: () => Promise<void>;

    // Sidebar state
    isSidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;

    // Create project modal state
    isCreateProjectModalOpen: boolean;
    setCreateProjectModalOpen: (open: boolean) => void;

    // Create todo modal state
    isCreateTodoModalOpen: boolean;
    setCreateTodoModalOpen: (open: boolean) => void;
    openCreateTodoModal: (defaultProjectId?: string, defaultSectionId?: string) => void;
    defaultTodoProjectId: string | undefined;
    defaultTodoSectionId: string | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [isCreateTodoModalOpen, setCreateTodoModalOpen] = useState(false);
    const [defaultTodoProjectId, setDefaultTodoProjectId] = useState<string | undefined>(undefined);
    const [defaultTodoSectionId, setDefaultTodoSectionId] = useState<string | undefined>(undefined);
    const projectsRequestVersion = useRef(0);
    const projectsMutationVersion = useRef(0);

    const fetchProjects = useCallback(async () => {
        const requestVersion = ++projectsRequestVersion.current;
        const mutationVersion = projectsMutationVersion.current;
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getProjects();
            if (requestVersion === projectsRequestVersion.current && mutationVersion === projectsMutationVersion.current) {
                setProjects(response.data || []);
            }
        } catch (err) {
            if (requestVersion === projectsRequestVersion.current) {
                setError(err instanceof Error ? err.message : 'Failed to fetch projects');
                if (mutationVersion === projectsMutationVersion.current) setProjects([]);
            }
        } finally {
            if (requestVersion === projectsRequestVersion.current) setLoading(false);
        }
    }, []);

    const [authTrigger, setAuthTrigger] = useState(0);

    useEffect(() => {
        const handleAuthChange = () => {
            setAuthTrigger(prev => prev + 1);
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('auth-changed', handleAuthChange);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('auth-changed', handleAuthChange);
            }
        };
    }, []);

    useEffect(() => {
        // Only fetch if authenticated
        if (apiClient.isAuthenticated()) {
            fetchProjects();
        } else {
            projectsRequestVersion.current++;
            projectsMutationVersion.current++;
            setProjects([]);
            setLoading(false);
        }
    }, [fetchProjects, authTrigger]);

    const addProject = useCallback(
        async (
            name: string,
            viewType: 'list' | 'board' = 'list',
            description?: string,
            color?: string
        ): Promise<Project> => {
            const now = new Date().toISOString();
            const temporaryId = `optimistic-project-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const user = apiClient.getCurrentUser();
            const optimisticProject: Project = {
                id: temporaryId,
                userId: user?.id || '',
                name,
                viewType,
                description,
                color,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
            };
            setProjects(prev => [...prev, optimisticProject]);

            try {
                const response = await apiClient.createProject(name, viewType, description, color);
                if (!response.data) throw new Error('The server did not return the created project');
                const newProject = response.data;
                projectsMutationVersion.current++;
                setProjects(prev => prev.some(project => project.id === temporaryId)
                    ? prev.map(project => project.id === temporaryId ? newProject : project)
                    : prev.some(project => project.id === newProject.id) ? prev : [...prev, newProject]);
                return newProject;
            } catch (err) {
                projectsMutationVersion.current++;
                setProjects(prev => prev.filter(project => project.id !== temporaryId));
                await fetchProjects();
                throw err instanceof Error ? err : new Error('Failed to create project');
            }
        },
        [fetchProjects]
    );

    const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<Project> => {
        const previous = projects.find(project => project.id === projectId);
        const optimistic = previous ? { ...previous, ...updates } : null;
        projectsMutationVersion.current++;
        if (optimistic) {
            setProjects(current => current.map(project => project.id === projectId ? optimistic : project));
        }

        try {
            const response = await apiClient.updateProject(projectId, updates);
            if (!response.data) throw new Error('The server did not return the updated project');
            const updated = response.data;
            projectsMutationVersion.current++;
            setProjects(current => current.some(project => project.id === projectId)
                ? current.map(project => project.id === projectId ? updated : project)
                : [...current, updated]);
            return updated;
        } catch (err) {
            projectsMutationVersion.current++;
            if (previous && optimistic) {
                setProjects(current => current.map(project => {
                    if (project.id !== projectId) return project;
                    const rolledBack = { ...project };
                    for (const key of Object.keys(updates) as Array<keyof Project>) {
                        if (project[key] === optimistic[key]) {
                            (rolledBack[key] as Project[keyof Project]) = previous[key] as Project[keyof Project];
                        }
                    }
                    return rolledBack;
                }));
            }
            throw err instanceof Error ? err : new Error('Failed to update project');
        }
    }, [projects]);

    const deleteProject = useCallback(async (projectId: string): Promise<void> => {
        const previousProjects = projects;
        const deletedIndex = previousProjects.findIndex(project => project.id === projectId);
        if (deletedIndex === -1) return;
        projectsMutationVersion.current++;
        setProjects(current => current.filter(project => project.id !== projectId));

        try {
            await apiClient.deleteProject(projectId);
            projectsMutationVersion.current++;
        } catch (err) {
            projectsMutationVersion.current++;
            setProjects(current => {
                if (current.some(project => project.id === projectId)) return current;
                const restored = [...current];
                restored.splice(Math.min(deletedIndex, restored.length), 0, previousProjects[deletedIndex]);
                return restored;
            });
            throw err instanceof Error ? err : new Error('Failed to delete project');
        }
    }, [projects]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    const openCreateTodoModal = useCallback((defaultProjectId?: string, defaultSectionId?: string) => {
        setDefaultTodoProjectId(defaultProjectId);
        setDefaultTodoSectionId(defaultSectionId);
        setCreateTodoModalOpen(true);
    }, []);

    return (
        <AppContext.Provider
            value={{
                projects,
                loading,
                error,
                addProject,
                updateProject,
                deleteProject,
                refetchProjects: fetchProjects,
                isSidebarCollapsed,
                setSidebarCollapsed,
                toggleSidebar,
                isCreateProjectModalOpen,
                setCreateProjectModalOpen,
                isCreateTodoModalOpen,
                setCreateTodoModalOpen,
                openCreateTodoModal,
                defaultTodoProjectId,
                defaultTodoSectionId,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
