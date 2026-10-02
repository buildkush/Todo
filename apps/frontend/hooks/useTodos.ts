'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, Todo, Section, BoardSection, type ApiResponse } from '@/lib/api-client';

interface UseTodosResult {
    todos: Todo[];
    loading: boolean;
    error: string | null;
    addTodo: (title: string, sectionId?: string, boardSectionId?: string) => Promise<Todo>;
    updateTodo: (todoId: string, updates: Partial<Todo>) => Promise<Todo>;
    deleteTodo: (todoId: string) => Promise<void>;
    toggleTodo: (todoId: string) => Promise<Todo>;
    moveTodo: (todoId: string, sectionId?: string, boardSectionId?: string, order?: number, targetProjectId?: string) => Promise<Todo>;
    refetch: () => Promise<void>;
}

export function useTodos(projectId: string): UseTodosResult {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTodos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getTodos(projectId);
            setTodos(response.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch todos');
            setTodos([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const addTodo = useCallback(async (title: string, sectionId?: string, boardSectionId?: string): Promise<Todo> => {
        try {
            const response = await apiClient.createTodo(title, projectId, sectionId, { boardSectionId });
            const newTodo = response.data!;
            setTodos(prev => [...prev, newTodo]);
            return newTodo;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to create todo');
        }
    }, [projectId]);

    const updateTodo = useCallback(async (todoId: string, updates: Partial<Todo>): Promise<Todo> => {
        try {
            const response = await apiClient.updateTodo(todoId, updates);
            const updated = response.data!;
            // Check if the task still belongs to this view
            const belongsHere = projectId === 'none'
                ? (!updated.projectId || updated.projectId === null || updated.projectId === 'none')
                : updated.projectId === projectId;
            console.log("updateTodo belongsHere check:", { projectId, updatedProjectId: updated.projectId, belongsHere });
            if (!belongsHere) {
                // Task moved to a different project/inbox — remove from current view
                setTodos(prev => prev.filter(t => t.id !== todoId));
            } else {
                setTodos(prev => prev.map(t => t.id === todoId ? updated : t));
            }
            return updated;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to update todo');
        }
    }, [projectId]);

    const deleteTodo = useCallback(async (todoId: string): Promise<void> => {
        try {
            await apiClient.deleteTodo(todoId);
            setTodos(prev => prev.filter(t => t.id !== todoId));
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to delete todo');
        }
    }, []);

    const toggleTodo = useCallback(async (todoId: string): Promise<Todo> => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) throw new Error('Todo not found');
        return updateTodo(todoId, { isCompleted: !todo.isCompleted });
    }, [todos, updateTodo]);

    const moveTodo = useCallback(async (todoId: string, sectionId?: string, boardSectionId?: string, order?: number, targetProjectId?: string): Promise<Todo> => {
        try {
            const response = await apiClient.moveTodo(todoId, sectionId, boardSectionId, order, targetProjectId);
            const moved = response.data!;
            setTodos(prev => prev.map(t => t.id === todoId ? moved : t));
            return moved;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to move todo');
        }
    }, []);

    return {
        todos,
        loading,
        error,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodo,
        moveTodo,
        refetch: fetchTodos,
    };
}

// Hook for managing sections in a project
interface UseSectionsResult {
    sections: Section[];
    loading: boolean;
    error: string | null;
    addSection: (name: string, description?: string) => Promise<Section>;
    updateSection: (sectionId: string, updates: Partial<Section>) => Promise<Section>;
    deleteSection: (sectionId: string) => Promise<void>;
    reorderSections: (reorderPayload: Array<{ id: string; order: number }>) => Promise<void>;
    refetch: () => Promise<void>;
}

export function useSections(projectId: string): UseSectionsResult {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSections = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getSections(projectId);
            setSections(response.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch sections');
            setSections([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    const addSection = useCallback(async (name: string, description?: string): Promise<Section> => {
        try {
            const response = await apiClient.createSection(projectId, name, description);
            const newSection = response.data!;
            setSections(prev => [...prev, newSection]);
            return newSection;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to create section');
        }
    }, [projectId]);

    const updateSection = useCallback(async (sectionId: string, updates: Partial<Section>): Promise<Section> => {
        try {
            const response = await apiClient.updateSection(sectionId, updates);
            const updated = response.data!;
            setSections(prev => prev.map(s => s.id === sectionId ? updated : s));
            return updated;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to update section');
        }
    }, []);

    const deleteSection = useCallback(async (sectionId: string): Promise<void> => {
        try {
            await apiClient.deleteSection(sectionId);
            setSections(prev => prev.filter(s => s.id !== sectionId));
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to delete section');
        }
    }, []);

    const reorderSections = useCallback(async (reorderPayload: Array<{ id: string; order: number }>): Promise<void> => {
        // Optimistically update local state with new orders and sort
        setSections(prev => {
            const updated = prev.map(s => {
                const match = reorderPayload.find(p => p.id === s.id);
                return match ? { ...s, order: match.order } : s;
            });
            return updated.sort((a, b) => a.order - b.order);
        });

        try {
            await apiClient.reorderSections(reorderPayload);
            // Fetch the authoritative order from DB to ensure sync
            const response = await apiClient.getSections(projectId);
            setSections(response.data || []);
        } catch (err) {
            // Re-fetch database state to roll back optimistic update on error
            const response = await apiClient.getSections(projectId);
            setSections(response.data || []);
            throw err;
        }
    }, [projectId]);

    return {
        sections,
        loading,
        error,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        refetch: fetchSections,
    };
}

// Hook for board sections (kanban columns)
interface UseBoardSectionsResult {
    boardSections: BoardSection[];
    loading: boolean;
    error: string | null;
    addBoardSection: (name: string, description?: string) => Promise<BoardSection>;
    updateBoardSection: (sectionId: string, updates: Partial<BoardSection>) => Promise<BoardSection>;
    deleteBoardSection: (sectionId: string) => Promise<void>;
    reorder: (sections: Array<{ id: string; order: number }>) => Promise<void>;
    refetch: () => Promise<void>;
}

export function useBoardSections(projectId: string): UseBoardSectionsResult {
    const [boardSections, setBoardSections] = useState<BoardSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBoardSections = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getBoardSections(projectId);
            setBoardSections(response.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch board sections');
            setBoardSections([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchBoardSections();
    }, [fetchBoardSections]);

    const addBoardSection = useCallback(async (name: string, description?: string): Promise<BoardSection> => {
        try {
            const response = await apiClient.createBoardSection(projectId, name, description);
            const newSection = response.data!;
            setBoardSections(prev => [...prev, newSection]);
            return newSection;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to create board section');
        }
    }, [projectId]);

    const updateBoardSection = useCallback(async (sectionId: string, updates: Partial<BoardSection>): Promise<BoardSection> => {
        try {
            const response = await apiClient.updateBoardSection(sectionId, updates);
            const updated = response.data!;
            setBoardSections(prev => prev.map(s => s.id === sectionId ? updated : s));
            return updated;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to update board section');
        }
    }, []);

    const deleteBoardSection = useCallback(async (sectionId: string): Promise<void> => {
        try {
            await apiClient.deleteBoardSection(sectionId);
            setBoardSections(prev => prev.filter(s => s.id !== sectionId));
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to delete board section');
        }
    }, []);

    const reorder = useCallback(async (sections: Array<{ id: string; order: number }>): Promise<void> => {
        try {
            await apiClient.reorderBoardSections(sections);
            const reordered = sections.reduce((acc, item) => {
                const section = boardSections.find(s => s.id === item.id);
                if (section) acc.push({ ...section, order: item.order });
                return acc;
            }, [] as BoardSection[]);
            setBoardSections(reordered);
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to reorder sections');
        }
    }, [boardSections]);

    return {
        boardSections,
        loading,
        error,
        addBoardSection,
        updateBoardSection,
        deleteBoardSection,
        reorder,
        refetch: fetchBoardSections,
    };
}
