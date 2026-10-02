'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, Todo, Section, BoardSection } from '@/lib/api-client';

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
    const [todoSnapshot, setTodoSnapshot] = useState<{ projectId: string; todos: Todo[] }>({ projectId, todos: [] });
    const [loadingSnapshot, setLoadingSnapshot] = useState<{ projectId: string; loading: boolean }>({ projectId, loading: true });
    const [errorSnapshot, setErrorSnapshot] = useState<{ projectId: string; error: string | null }>({ projectId, error: null });
    const fetchVersion = useRef(0);
    const dataVersions = useRef(new Map<string, number>());
    const mutationVersions = useRef(new Map<string, number>());
    const mutationQueues = useRef(new Map<string, Promise<void>>());

    const todos = todoSnapshot.projectId === projectId ? todoSnapshot.todos : [];
    const loading = loadingSnapshot.projectId !== projectId || loadingSnapshot.loading;
    const error = errorSnapshot.projectId === projectId ? errorSnapshot.error : null;

    const updateTodos = useCallback((updater: (current: Todo[]) => Todo[]) => {
        setTodoSnapshot(previous => ({
            projectId,
            todos: updater(previous.projectId === projectId ? previous.todos : []),
        }));
    }, [projectId]);

    const fetchTodos = useCallback(async () => {
        const requestVersion = ++fetchVersion.current;
        const dataVersion = dataVersions.current.get(projectId) || 0;
        try {
            setLoadingSnapshot({ projectId, loading: true });
            setErrorSnapshot({ projectId, error: null });
            const response = await apiClient.getTodos(projectId);
            if (requestVersion === fetchVersion.current && dataVersions.current.get(projectId) === dataVersion) {
                setTodoSnapshot({ projectId, todos: response.data || [] });
            }
        } catch (err) {
            if (requestVersion === fetchVersion.current && dataVersions.current.get(projectId) === dataVersion) {
                setErrorSnapshot({ projectId, error: err instanceof Error ? err.message : 'Failed to fetch todos' });
                setTodoSnapshot({ projectId, todos: [] });
            }
        } finally {
            if (requestVersion === fetchVersion.current) {
                setLoadingSnapshot({ projectId, loading: false });
            }
        }
    }, [projectId]);

    useEffect(() => {
        fetchTodos();
        return () => {
            fetchVersion.current++;
        };
    }, [fetchTodos]);

    useEffect(() => {
        const belongsHere = (todo: Todo) => projectId === 'none'
            ? (!todo.projectId || todo.projectId === 'none')
            : todo.projectId === projectId;

        const handleTodoCreated = (event: Event) => {
            const detail = (event as CustomEvent<{ todo: Todo; temporaryId?: string }>).detail;
            if (!detail?.todo || !belongsHere(detail.todo)) return;
            dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
            updateTodos(current => {
                const replacingId = detail.temporaryId;
                if (replacingId && current.some(todo => todo.id === replacingId)) {
                    return current.map(todo => todo.id === replacingId ? detail.todo : todo);
                }
                return current.some(todo => todo.id === detail.todo.id)
                    ? current
                    : [...current, detail.todo];
            });
        };

        const handleTodoCreateFailed = (event: Event) => {
            const detail = (event as CustomEvent<{ temporaryId: string }>).detail;
            if (detail?.temporaryId) {
                dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
                updateTodos(current => current.filter(todo => todo.id !== detail.temporaryId));
                void fetchTodos();
            }
        };

        window.addEventListener('todo-created', handleTodoCreated);
        window.addEventListener('todo-create-failed', handleTodoCreateFailed);
        return () => {
            window.removeEventListener('todo-created', handleTodoCreated);
            window.removeEventListener('todo-create-failed', handleTodoCreateFailed);
        };
    }, [fetchTodos, projectId, updateTodos]);

    const reconcileTodo = useCallback(async (todoId: string) => {
        try {
            const response = await apiClient.getTodo(todoId);
            if (!response.data) throw new Error('The server did not return the current task');
            const currentTodo = response.data;
            const belongsHere = projectId === 'none'
                ? (!currentTodo.projectId || currentTodo.projectId === 'none')
                : currentTodo.projectId === projectId;
            updateTodos(current => {
                if (!belongsHere) return current.filter(todo => todo.id !== todoId);
                return current.some(todo => todo.id === todoId)
                    ? current.map(todo => todo.id === todoId ? currentTodo : todo)
                    : [...current, currentTodo];
            });
        } catch (todoError) {
            try {
                const response = await apiClient.getTodos(projectId);
                if (!response.data) throw new Error('The server did not return the current task list');
                updateTodos(() => response.data || []);
            } catch (listError) {
                const todoMessage = todoError instanceof Error ? todoError.message : 'Failed to fetch the task';
                const listMessage = listError instanceof Error ? listError.message : 'Failed to fetch the task list';
                throw new Error(`${todoMessage}; task-list reconciliation also failed: ${listMessage}`);
            }
        }
    }, [projectId, updateTodos]);

    const addTodo = useCallback(async (title: string, sectionId?: string, boardSectionId?: string): Promise<Todo> => {
        dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
        const id = `optimistic-todo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const now = new Date().toISOString();
        const project = apiClient.getCurrentUser();
        const optimisticTodo: Todo = {
            id,
            userId: project?.id || '',
            projectId: projectId === 'none' ? 'none' : projectId,
            sectionId,
            boardSectionId,
            title,
            isCompleted: false,
            order: todos.length,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        };
        updateTodos(current => [...current, optimisticTodo]);

        try {
            const response = await apiClient.createTodo(title, projectId, sectionId, { boardSectionId });
            if (!response.data) throw new Error('The server did not return the created task');
            const newTodo = response.data;
            dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
            updateTodos(current => current.some(todo => todo.id === id)
                ? current.map(todo => todo.id === id ? newTodo : todo)
                : current.some(todo => todo.id === newTodo.id) ? current : [...current, newTodo]);
            return newTodo;
        } catch (err) {
            dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
            updateTodos(current => current.filter(todo => todo.id !== id));
            await fetchTodos();
            throw err instanceof Error ? err : new Error('Failed to create todo');
        }
    }, [fetchTodos, projectId, todos.length, updateTodos]);

    const updateTodo = useCallback(async (todoId: string, updates: Partial<Todo>): Promise<Todo> => {
        const previous = todos.find(todo => todo.id === todoId);
        if (!previous) throw new Error('Todo not found');

        dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
        const version = (mutationVersions.current.get(todoId) || 0) + 1;
        mutationVersions.current.set(todoId, version);
        const optimistic = { ...previous, ...updates };
        const belongsHere = (todo: Todo) => projectId === 'none'
            ? (!todo.projectId || todo.projectId === 'none')
            : todo.projectId === projectId;

        updateTodos(current => belongsHere(optimistic)
            ? current.map(todo => todo.id === todoId ? optimistic : todo)
            : current.filter(todo => todo.id !== todoId));

        const previousRequest = mutationQueues.current.get(todoId) || Promise.resolve();
        const request = previousRequest
            .catch(() => undefined)
            .then(() => apiClient.updateTodo(todoId, updates));
        const queuedRequest = request.then(() => undefined, () => undefined);
        mutationQueues.current.set(todoId, queuedRequest);

        try {
            const response = await request;
            if (!response.data) throw new Error('The server did not return the updated task');
            const updated = response.data;
            if (mutationVersions.current.get(todoId) === version) {
                updateTodos(current => belongsHere(updated)
                    ? current.map(todo => todo.id === todoId ? updated : todo)
                    : current.filter(todo => todo.id !== todoId));
            }
            return updated;
        } catch (err) {
            if (mutationVersions.current.get(todoId) === version) {
                updateTodos(current => {
                    const currentTodo = current.find(todo => todo.id === todoId);
                    if (!currentTodo) {
                        return belongsHere(previous) ? [...current, previous] : current;
                    }
                    const rolledBack = { ...currentTodo };
                    for (const key of Object.keys(updates) as Array<keyof Todo>) {
                        if (currentTodo[key] === optimistic[key]) {
                            (rolledBack[key] as Todo[keyof Todo]) = previous[key] as Todo[keyof Todo];
                        }
                    }
                    return belongsHere(rolledBack)
                        ? current.map(todo => todo.id === todoId ? rolledBack : todo)
                        : current.filter(todo => todo.id !== todoId);
                });
            }
            try {
                await reconcileTodo(todoId);
            } catch (reconcileError) {
                const message = err instanceof Error ? err.message : 'Failed to update todo';
                const reconciliationMessage = reconcileError instanceof Error
                    ? reconcileError.message
                    : 'Failed to verify task state';
                throw new Error(`${message}. Could not verify the task state: ${reconciliationMessage}`);
            }
            throw err instanceof Error ? err : new Error('Failed to update todo');
        } finally {
            dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
            if (mutationVersions.current.get(todoId) === version) {
                mutationVersions.current.delete(todoId);
            }
            if (mutationQueues.current.get(todoId) === queuedRequest) {
                mutationQueues.current.delete(todoId);
            }
        }
    }, [projectId, reconcileTodo, todos, updateTodos]);

    const deleteTodo = useCallback(async (todoId: string): Promise<void> => {
        const previous = todos.find(todo => todo.id === todoId);
        if (!previous) return;
        dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
        const version = (mutationVersions.current.get(todoId) || 0) + 1;
        mutationVersions.current.set(todoId, version);
        updateTodos(current => current.filter(todo => todo.id !== todoId));
        const previousRequest = mutationQueues.current.get(todoId) || Promise.resolve();
        const request = previousRequest
            .catch(() => undefined)
            .then(() => apiClient.deleteTodo(todoId));
        const queuedRequest = request.then(() => undefined, () => undefined);
        mutationQueues.current.set(todoId, queuedRequest);

        try {
            await request;
        } catch (err) {
            if (mutationVersions.current.get(todoId) === version) {
                updateTodos(current => current.some(todo => todo.id === todoId) ? current : [...current, previous]);
            }
            try {
                await reconcileTodo(todoId);
            } catch (reconcileError) {
                const message = err instanceof Error ? err.message : 'Failed to delete todo';
                const reconciliationMessage = reconcileError instanceof Error
                    ? reconcileError.message
                    : 'Failed to verify task state';
                throw new Error(`${message}. Could not verify the task state: ${reconciliationMessage}`);
            }
            throw err instanceof Error ? err : new Error('Failed to delete todo');
        } finally {
            dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
            if (mutationVersions.current.get(todoId) === version) {
                mutationVersions.current.delete(todoId);
            }
            if (mutationQueues.current.get(todoId) === queuedRequest) {
                mutationQueues.current.delete(todoId);
            }
        }
    }, [projectId, reconcileTodo, todos, updateTodos]);

    const toggleTodo = useCallback(async (todoId: string): Promise<Todo> => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) throw new Error('Todo not found');
        return updateTodo(todoId, { isCompleted: !todo.isCompleted });
    }, [todos, updateTodo]);

    const moveTodo = useCallback(async (todoId: string, sectionId?: string, boardSectionId?: string, order?: number, targetProjectId?: string): Promise<Todo> => {
        const previous = todos.find(todo => todo.id === todoId);
        if (!previous) throw new Error('Todo not found');
        dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
        const version = (mutationVersions.current.get(todoId) || 0) + 1;
        mutationVersions.current.set(todoId, version);
        const optimistic: Todo = {
            ...previous,
            sectionId: sectionId === 'unsectioned' ? undefined : sectionId,
            boardSectionId,
            order: order ?? previous.order,
            projectId: targetProjectId ?? previous.projectId,
        };
        const belongsHere = (todo: Todo) => projectId === 'none'
            ? (!todo.projectId || todo.projectId === 'none')
            : todo.projectId === projectId;
        updateTodos(current => belongsHere(optimistic)
            ? current.map(todo => todo.id === todoId ? optimistic : todo)
            : current.filter(todo => todo.id !== todoId));

        const previousRequest = mutationQueues.current.get(todoId) || Promise.resolve();
        const request = previousRequest
            .catch(() => undefined)
            .then(() => apiClient.moveTodo(todoId, sectionId, boardSectionId, order, targetProjectId));
        const queuedRequest = request.then(() => undefined, () => undefined);
        mutationQueues.current.set(todoId, queuedRequest);

        try {
            const response = await request;
            if (!response.data) throw new Error('The server did not return the moved task');
            const moved = response.data;
            if (mutationVersions.current.get(todoId) === version) {
                updateTodos(current => belongsHere(moved)
                    ? current.map(todo => todo.id === todoId ? moved : todo)
                    : current.filter(todo => todo.id !== todoId));
            }
            return moved;
        } catch (err) {
            if (mutationVersions.current.get(todoId) === version) {
                updateTodos(current => belongsHere(previous)
                    ? current.map(todo => todo.id === todoId ? previous : todo)
                    : current.filter(todo => todo.id !== todoId));
            }
            try {
                await reconcileTodo(todoId);
            } catch (reconcileError) {
                const message = err instanceof Error ? err.message : 'Failed to move todo';
                const reconciliationMessage = reconcileError instanceof Error
                    ? reconcileError.message
                    : 'Failed to verify task state';
                throw new Error(`${message}. Could not verify the task state: ${reconciliationMessage}`);
            }
            throw err instanceof Error ? err : new Error('Failed to move todo');
        } finally {
            dataVersions.current.set(projectId, (dataVersions.current.get(projectId) || 0) + 1);
            if (mutationVersions.current.get(todoId) === version) {
                mutationVersions.current.delete(todoId);
            }
            if (mutationQueues.current.get(todoId) === queuedRequest) {
                mutationQueues.current.delete(todoId);
            }
        }
    }, [projectId, reconcileTodo, todos, updateTodos]);

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
    const [sectionSnapshot, setSectionSnapshot] = useState<{ projectId: string; sections: Section[] }>({ projectId, sections: [] });
    const [loadingSnapshot, setLoadingSnapshot] = useState<{ projectId: string; loading: boolean }>({ projectId, loading: true });
    const [errorSnapshot, setErrorSnapshot] = useState<{ projectId: string; error: string | null }>({ projectId, error: null });
    const fetchVersion = useRef(0);

    const sections = sectionSnapshot.projectId === projectId ? sectionSnapshot.sections : [];
    const loading = loadingSnapshot.projectId !== projectId || loadingSnapshot.loading;
    const error = errorSnapshot.projectId === projectId ? errorSnapshot.error : null;

    const updateSections = useCallback((updater: (current: Section[]) => Section[]) => {
        setSectionSnapshot(previous => ({
            projectId,
            sections: updater(previous.projectId === projectId ? previous.sections : []),
        }));
    }, [projectId]);

    const fetchSections = useCallback(async () => {
        const requestVersion = ++fetchVersion.current;
        try {
            setLoadingSnapshot({ projectId, loading: true });
            setErrorSnapshot({ projectId, error: null });
            const response = await apiClient.getSections(projectId);
            if (requestVersion === fetchVersion.current) {
                setSectionSnapshot({ projectId, sections: response.data || [] });
            }
        } catch (err) {
            if (requestVersion === fetchVersion.current) {
                setErrorSnapshot({ projectId, error: err instanceof Error ? err.message : 'Failed to fetch sections' });
                setSectionSnapshot({ projectId, sections: [] });
            }
        } finally {
            if (requestVersion === fetchVersion.current) {
                setLoadingSnapshot({ projectId, loading: false });
            }
        }
    }, [projectId]);

    useEffect(() => {
        fetchSections();
        return () => {
            fetchVersion.current++;
        };
    }, [fetchSections]);

    const addSection = useCallback(async (name: string, description?: string): Promise<Section> => {
        try {
            const response = await apiClient.createSection(projectId, name, description);
            const newSection = response.data!;
            updateSections(prev => [...prev, newSection]);
            return newSection;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to create section');
        }
    }, [projectId, updateSections]);

    const updateSection = useCallback(async (sectionId: string, updates: Partial<Section>): Promise<Section> => {
        try {
            const response = await apiClient.updateSection(sectionId, updates);
            const updated = response.data!;
            updateSections(prev => prev.map(s => s.id === sectionId ? updated : s));
            return updated;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to update section');
        }
    }, [projectId, updateSections]);

    const deleteSection = useCallback(async (sectionId: string): Promise<void> => {
        try {
            await apiClient.deleteSection(sectionId);
            updateSections(prev => prev.filter(s => s.id !== sectionId));
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to delete section');
        }
    }, [projectId, updateSections]);

    const reorderSections = useCallback(async (reorderPayload: Array<{ id: string; order: number }>): Promise<void> => {
        const previous = sections;
        updateSections(prev => {
            const updated = prev.map(s => {
                const match = reorderPayload.find(p => p.id === s.id);
                return match ? { ...s, order: match.order } : s;
            });
            return updated.sort((a, b) => a.order - b.order);
        });

        try {
            const response = await apiClient.reorderSections(reorderPayload);
            if (response.data) updateSections(() => response.data!);
        } catch (err) {
            updateSections(() => previous);
            throw err;
        }
    }, [projectId, sections, updateSections]);

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
