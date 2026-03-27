/**
 * useProjects Hook
 * 
 * Manages project data fetching and caching
 */

'use client';

import { useState, useEffect } from 'react';
import { apiClient, type Project } from '@/lib/api-client';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<{ data: Project[] }>('/projects');
      setProjects(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}
