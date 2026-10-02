'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, Project } from '@/lib/api-client';
import { useApp } from '@/context/AppContext';

interface UseProjectsResult {
    projects: Project[];
    loading: boolean;
    error: string | null;
    addProject: (name: string, viewType?: 'list' | 'board', description?: string, color?: string) => Promise<Project>;
    updateProject: (projectId: string, updates: Partial<Project>) => Promise<Project>;
    deleteProject: (projectId: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export function useProjects(): UseProjectsResult {
    const {
        projects,
        loading,
        error,
        addProject,
        updateProject,
        deleteProject,
        refetchProjects,
    } = useApp();

    return {
        projects,
        loading,
        error,
        addProject,
        updateProject,
        deleteProject,
        refetch: refetchProjects,
    };
}

// Hook for managing a single project
interface UseProjectResult {
    project: Project | null;
    loading: boolean;
    error: string | null;
    updateProject: (updates: Partial<Project>) => Promise<Project>;
    refetch: () => Promise<void>;
}

export function useProject(projectId: string): UseProjectResult {
    const { updateProject: updateProjectInList } = useApp();
    const [projectSnapshot, setProjectSnapshot] = useState<{ projectId: string; project: Project | null }>({ projectId, project: null });
    const [loadingSnapshot, setLoadingSnapshot] = useState<{ projectId: string; loading: boolean }>({ projectId, loading: true });
    const [errorSnapshot, setErrorSnapshot] = useState<{ projectId: string; error: string | null }>({ projectId, error: null });
    const fetchVersion = useRef(0);

    const fetchProject = useCallback(async () => {
        const requestVersion = ++fetchVersion.current;
        try {
            setLoadingSnapshot({ projectId, loading: true });
            setErrorSnapshot({ projectId, error: null });
            const response = await apiClient.getProject(projectId);
            if (requestVersion === fetchVersion.current) {
                setProjectSnapshot({ projectId, project: response.data || null });
            }
        } catch (err) {
            if (requestVersion === fetchVersion.current) {
                setErrorSnapshot({ projectId, error: err instanceof Error ? err.message : 'Failed to fetch project' });
                setProjectSnapshot({ projectId, project: null });
            }
        } finally {
            if (requestVersion === fetchVersion.current) {
                setLoadingSnapshot({ projectId, loading: false });
            }
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
        return () => {
            fetchVersion.current++;
        };
    }, [fetchProject]);

    const updateProject = useCallback(async (updates: Partial<Project>) => {
        const previous = projectSnapshot.projectId === projectId ? projectSnapshot.project : null;
        if (!previous) throw new Error('Project is not loaded');

        const optimistic = { ...previous, ...updates };
        setProjectSnapshot({ projectId, project: optimistic });
        try {
            const updated = await updateProjectInList(projectId, updates);
            setProjectSnapshot({ projectId, project: updated });
            return updated;
        } catch (err) {
            setProjectSnapshot(current => {
                if (current.projectId !== projectId || !current.project) return current;
                const rolledBack = { ...current.project };
                for (const key of Object.keys(updates) as Array<keyof Project>) {
                    if (current.project[key] === optimistic[key]) {
                        (rolledBack[key] as Project[keyof Project]) = previous[key] as Project[keyof Project];
                    }
                }
                return { projectId, project: rolledBack };
            });
            throw err;
        }
    }, [projectId, projectSnapshot, updateProjectInList]);

    return {
        project: projectSnapshot.projectId === projectId ? projectSnapshot.project : null,
        loading: loadingSnapshot.projectId !== projectId || loadingSnapshot.loading,
        error: errorSnapshot.projectId === projectId ? errorSnapshot.error : null,
        updateProject,
        refetch: fetchProject,
    };
}
