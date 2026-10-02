'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getProjects();
            setProjects(response.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch projects');
            setProjects([]);
        } finally {
            setLoading(false);
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
            try {
                const response = await apiClient.createProject(name, viewType, description, color);
                const newProject = response.data!;
                setProjects(prev => [...prev, newProject]);
                return newProject;
            } catch (err) {
                throw err instanceof Error ? err : new Error('Failed to create project');
            }
        },
        []
    );

    const updateProject = useCallback(async (projectId: string, updates: Partial<Project>): Promise<Project> => {
        try {
            const response = await apiClient.updateProject(projectId, updates);
            const updated = response.data!;
            setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
            return updated;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to update project');
        }
    }, []);

    const deleteProject = useCallback(async (projectId: string): Promise<void> => {
        try {
            await apiClient.deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to delete project');
        }
    }, []);

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
