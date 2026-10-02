'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, Project, type ApiResponse } from '@/lib/api-client';

interface UseProjectsResult {
    projects: Project[];
    loading: boolean;
    error: string | null;
    addProject: (name: string, viewType?: 'list' | 'board', description?: string, color?: string) => Promise<Project>;
    updateProject: (projectId: string, updates: Partial<Project>) => Promise<Project>;
    deleteProject: (projectId: string) => Promise<void>;
    refetch: () => Promise<void>;
}

import { useApp } from '@/context/AppContext';

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
    refetch: () => Promise<void>;
}

export function useProject(projectId: string): UseProjectResult {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProject = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getProject(projectId);
            setProject(response.data || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch project');
            setProject(null);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    return {
        project,
        loading,
        error,
        refetch: fetchProject,
    };
}
