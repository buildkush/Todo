'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/Layout';
import { TodoItem, DropPosition } from '@/components/TodoItem';
import { useTodos } from '@/hooks/useTodos';
import { useSections } from '@/hooks/useTodos';
import { useApp } from '@/context/AppContext';
import { Todo, Section } from '@/lib/api-client';
import { Plus, MoreHorizontal, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

const MAX_TODO_DEPTH = 4; // 0-indexed, so 5 visible nesting levels.
const TODO_INDENT_PX = 32;

type VisibleTodo = { todo: Todo; depth: number };
type TodoDropTarget = {
    todoId: string;
    position: DropPosition;
    depth: number;
    sectionId: string | null;
    parentTodoId: string | null;
    insertBeforeId?: string;
    insertAfterId?: string;
};

function EmptyInboxIllustration() {
    return (
        <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="35" y="18" width="70" height="85" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1.5"/>
            <rect x="52" y="10" width="36" height="16" rx="4" fill="#fecdd3" stroke="#fda4af" strokeWidth="1.2"/>
            <circle cx="70" cy="18" r="3" fill="#fb7185"/>
            <rect x="46" y="38" width="12" height="12" rx="3" stroke="#fca5a5" strokeWidth="1.5" fill="#fff1f2"/>
            <line x1="52" y1="42" x2="55" y2="46" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="55" y1="46" x2="60" y2="40" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="64" y1="43" x2="92" y2="43" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="46" y="56" width="12" height="12" rx="3" stroke="#e5e7eb" strokeWidth="1.5" fill="#fafafa"/>
            <line x1="64" y1="62" x2="88" y2="62" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="46" y="74" width="12" height="12" rx="3" stroke="#e5e7eb" strokeWidth="1.5" fill="#fafafa"/>
            <line x1="64" y1="80" x2="84" y2="80" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="115" cy="30" r="4" fill="#fecdd3" opacity="0.6"/>
            <circle cx="22" cy="50" r="3" fill="#fecdd3" opacity="0.5"/>
            <path d="M120 60l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#fda4af" opacity="0.5"/>
            <path d="M18 30l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5 1.5-3z" fill="#fda4af" opacity="0.4"/>
            <circle cx="70" cy="100" r="8" fill="#fb7185" opacity="0.15"/>
            <line x1="66" y1="100" x2="74" y2="100" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="70" y1="96" x2="70" y2="104" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    );
}

export default function Home() {
    const projectId = 'none'; // Represent Inbox
    const { todos, loading: todosLoading, error: todosError, updateTodo, deleteTodo, toggleTodo, refetch: refetchTodos } = useTodos(projectId);
    const { sections, addSection, updateSection, deleteSection, reorderSections } = useSections(projectId);
    const { openCreateTodoModal } = useApp();

    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [showSectionForm, setShowSectionForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Section UI state
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [collapsedTodos, setCollapsedTodos] = useState<Set<string>>(new Set());
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const [sectionDropdownId, setSectionDropdownId] = useState<string | null>(null);

    // Drag state
    const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
    const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);
    const [dragGhostInfo, setDragGhostInfo] = useState<{
        type: 'task' | 'section';
        name: string;
        x: number;
        y: number;
        offsetX: number;
        offsetY: number;
        width: number;
    } | null>(null);
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    const [localSections, setLocalSections] = useState<Section[]>([]);
    const [dropTarget, setDropTarget] = useState<TodoDropTarget | null>(null);
    const dropTargetRef = useRef<TodoDropTarget | null>(null);
    const taskDragMetricsRef = useRef<{ offsetX: number } | null>(null);
    const lastGapTargetsRef = useRef<{
        targets: Record<number, TodoDropTarget>;
        listLeft: number;
        maxAllowedDepth: number;
    } | null>(null);

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const checkIsDescendantOfDragged = useCallback((targetId: string) => {
        if (!draggedTodoId) return false;
        let curr = todos.find(t => t.id === targetId);
        while (curr && curr.parentTodoId) {
            if (curr.parentTodoId === draggedTodoId) return true;
            const parentId = curr.parentTodoId;
            curr = todos.find(t => t.id === parentId);
        }
        return false;
    }, [draggedTodoId, todos]);

    const getTodoDepth = useCallback((todoId: string): number => {
        let depth = 0;
        let curr = todos.find(t => t.id === todoId);
        while (curr && curr.parentTodoId) {
            depth++;
            const parentId = curr.parentTodoId;
            curr = todos.find(t => t.id === parentId);
        }
        return depth;
    }, [todos]);

    const getSubtreeHeight = useCallback((todoId: string): number => {
        const children = todos.filter(t => t.parentTodoId === todoId);
        if (children.length === 0) return 0;
        return 1 + Math.max(...children.map(c => getSubtreeHeight(c.id)));
    }, [todos]);

    const getVisibleTodosForSection = useCallback((sectionId: string | null) => {
        const result: { todo: Todo; depth: number }[] = [];
        const traverse = (todo: Todo, depth: number) => {
            result.push({ todo, depth });
            const children = todos.filter(t => t.parentTodoId === todo.id).sort((a, b) => a.order - b.order);
            const isCollapsed = collapsedTodos.has(todo.id);
            if (!isCollapsed && children.length > 0) {
                children.forEach(child => traverse(child, depth + 1));
            }
        };

        const rootTodos = todos
            .filter(t => (sectionId ? t.sectionId === sectionId : !t.sectionId) && !t.parentTodoId)
            .sort((a, b) => a.order - b.order);

        rootTodos.forEach(todo => traverse(todo, 0));
        return result;
    }, [todos, collapsedTodos]);

    const getAncestorAtDepth = useCallback((todoId: string, targetDepth: number): Todo | null => {
        let curr: Todo | undefined = todos.find(t => t.id === todoId);
        if (!curr) return null;
        let depth = getTodoDepth(todoId);
        while (curr && depth > targetDepth) {
            const parentId: string | undefined = curr.parentTodoId;
            if (!parentId) return null;
            const parent: Todo | undefined = todos.find(t => t.id === parentId);
            if (!parent) return null;
            curr = parent;
            depth--;
        }
        return curr || null;
    }, [todos, getTodoDepth]);

    // Clean up drag state
    useEffect(() => {
        const cleanDragState = () => {
            setDraggedTodoId(null);
            setDraggedSectionId(null);
            setDragOverSectionId(null);
            dropTargetRef.current = null;
            taskDragMetricsRef.current = null;
            lastGapTargetsRef.current = null;
            setDropTarget(null);
            setDragGhostInfo(null);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') cleanDragState();
        };

        const handleGlobalDrop = () => {
            setTimeout(cleanDragState, 50);
        };

        window.addEventListener('dragend', cleanDragState);
        window.addEventListener('drop', handleGlobalDrop);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('dragend', cleanDragState);
            window.removeEventListener('drop', handleGlobalDrop);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Dragover logic
    useEffect(() => {
        if (!draggedSectionId && !draggedTodoId) return;

        const handleGlobalDragOver = (e: DragEvent) => {
            e.preventDefault(); // Make background a valid drop zone to prevent freezing
            setDragGhostInfo(prev => {
                if (!prev) return null;
                if (e.clientX === 0 && e.clientY === 0) return prev;
                return {
                    ...prev,
                    x: e.clientX,
                    y: e.clientY,
                };
            });

            const gap = lastGapTargetsRef.current;
            if (gap && e.clientX !== 0) {
                const dragOffsetX = taskDragMetricsRef.current?.offsetX ?? 0;
                const draggedLeft = e.clientX - dragOffsetX;
                const relativeX = draggedLeft - gap.listLeft;
                const depth = Math.max(0, Math.min(gap.maxAllowedDepth, Math.round(relativeX / TODO_INDENT_PX)));
                const target = gap.targets[depth];
                if (target) {
                    const prev = dropTargetRef.current;
                    if (!prev || prev.depth !== target.depth || prev.todoId !== target.todoId || prev.position !== target.position) {
                        dropTargetRef.current = target;
                        setDropTarget(target);
                    }
                }
            }
        };

        window.addEventListener('dragover', handleGlobalDragOver, true);
        return () => window.removeEventListener('dragover', handleGlobalDragOver, true);
    }, [draggedSectionId, draggedTodoId]);

    const isTodoInsideSubtree = useCallback((todoId: string, ancestorId: string) => {
        if (todoId === ancestorId) return true;
        let curr = todos.find(t => t.id === todoId);
        while (curr?.parentTodoId) {
            if (curr.parentTodoId === ancestorId) return true;
            const parentId = curr.parentTodoId;
            curr = todos.find(t => t.id === parentId);
        }
        return false;
    }, [todos]);

    const handleDragOverItem = useCallback((
        todoId: string,
        position: DropPosition,
        clientX: number,
        rect: { left: number; top: number; height: number }
    ) => {
        if (!draggedTodoId) return;

        const targetTodo = todos.find(t => t.id === todoId);
        if (!targetTodo) return;

        const sectionId = targetTodo.sectionId || null;
        const visibleTodos = getVisibleTodosForSection(sectionId)
            .filter(item => !isTodoInsideSubtree(item.todo.id, draggedTodoId));
        const idx = visibleTodos.findIndex(item => item.todo.id === todoId);
        if (idx === -1) return;

        let aboveItem: VisibleTodo | null = null;
        let belowItem: VisibleTodo | null = null;

        if (position === 'above') {
            aboveItem = idx > 0 ? visibleTodos[idx - 1] : null;
            belowItem = visibleTodos[idx];
        } else {
            aboveItem = visibleTodos[idx];
            belowItem = idx < visibleTodos.length - 1 ? visibleTodos[idx + 1] : null;
        }

        const subtreeHeight = getSubtreeHeight(draggedTodoId);
        const maxDepthFromSubtree = MAX_TODO_DEPTH - subtreeHeight;
        if (maxDepthFromSubtree < 0) {
            dropTargetRef.current = null;
            setDropTarget(null);
            return;
        }

        const targetDepth = visibleTodos[idx].depth;
        const listLeft = rect.left - targetDepth * TODO_INDENT_PX;

        const maxDepthFromGap = aboveItem ? aboveItem.depth + 1 : 0;
        const maxAllowedDepth = Math.min(maxDepthFromGap, maxDepthFromSubtree, MAX_TODO_DEPTH);

        const allDepthTargets: Record<number, TodoDropTarget> = {};
        for (let d = 0; d <= maxAllowedDepth; d++) {
            let pId: string | null = null;
            let ibId: string | undefined;
            let iaId: string | undefined;
            let fTodoId: string = todoId;
            let fPos: DropPosition = 'below';

            if (!aboveItem) {
                ibId = belowItem?.todo.id;
                fTodoId = belowItem?.todo.id || todoId;
                fPos = 'above';
                pId = null;
            } else if (d === aboveItem.depth + 1) {
                pId = aboveItem.todo.id;
                ibId = belowItem?.todo.parentTodoId === pId ? belowItem.todo.id : undefined;
                fTodoId = aboveItem.todo.id;
                fPos = 'child';
            } else {
                const anchor = d === aboveItem.depth ? aboveItem.todo : getAncestorAtDepth(aboveItem.todo.id, d);
                if (!anchor) continue;
                const parent = d > 0 ? getAncestorAtDepth(anchor.id, d - 1) : null;
                pId = parent?.id || null;
                iaId = anchor.id;
                fTodoId = anchor.id;
                fPos = 'below';
            }

            allDepthTargets[d] = {
                todoId: fTodoId,
                position: fPos,
                depth: d,
                sectionId,
                parentTodoId: pId,
                insertBeforeId: ibId,
                insertAfterId: iaId,
            };
        }

        lastGapTargetsRef.current = { targets: allDepthTargets, listLeft, maxAllowedDepth };

        const dragOffsetX = taskDragMetricsRef.current?.offsetX ?? 0;
        const draggedLeft = clientX - dragOffsetX;
        const relativeX = draggedLeft - listLeft;
        let selectedDepth = Math.max(0, Math.min(maxAllowedDepth, Math.round(relativeX / TODO_INDENT_PX)));

        const nextDropTarget = allDepthTargets[selectedDepth];
        if (!nextDropTarget) {
            dropTargetRef.current = null;
            setDropTarget(null);
            return;
        }

        dropTargetRef.current = nextDropTarget;
        setDragOverSectionId(null);
        setDropTarget(prev => {
            if (
                prev &&
                prev.todoId === nextDropTarget.todoId &&
                prev.position === nextDropTarget.position &&
                prev.depth === nextDropTarget.depth &&
                prev.parentTodoId === nextDropTarget.parentTodoId &&
                prev.insertBeforeId === nextDropTarget.insertBeforeId &&
                prev.insertAfterId === nextDropTarget.insertAfterId
            ) {
                return prev;
            }
            return nextDropTarget;
        });
    }, [todos, draggedTodoId, getVisibleTodosForSection, getSubtreeHeight, getAncestorAtDepth, isTodoInsideSubtree]);

    // Initialize collapsed states
    useEffect(() => {
        const collapsed = new Set<string>();
        sections.forEach(s => {
            if (s.isCollapsed) collapsed.add(s.id);
        });
        setCollapsedSections(collapsed);
    }, [sections]);

    const toggleSectionCollapse = async (sectionId: string) => {
        const newCollapsed = new Set(collapsedSections);
        const isNowCollapsed = !newCollapsed.has(sectionId);
        if (isNowCollapsed) {
            newCollapsed.add(sectionId);
        } else {
            newCollapsed.delete(sectionId);
        }
        setCollapsedSections(newCollapsed);
        if (sectionId === 'unsectioned') return;
        try {
            await updateSection(sectionId, { isCollapsed: isNowCollapsed });
        } catch (err) {
            setCollapsedSections(current => {
                const rolledBack = new Set(current);
                if (isNowCollapsed) rolledBack.delete(sectionId);
                else rolledBack.add(sectionId);
                return rolledBack;
            });
            setFormError(err instanceof Error ? err.message : 'Failed to update section');
        }
    };

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId);
        const el = sectionRefs.current[sectionId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const unsectionedTodos = todos.filter(t => !t.sectionId && !t.parentTodoId).sort((a, b) => a.order - b.order);
    const sortedSections = [...sections].sort((a, b) => a.order - b.order);
    const displaySections = draggedSectionId ? localSections : sortedSections;

    const getTodosForSection = (sectionId: string) =>
        todos.filter(t => t.sectionId === sectionId && !t.parentTodoId).sort((a, b) => a.order - b.order);

    const getSubTodos = (parentId: string) =>
        todos.filter(t => t.parentTodoId === parentId).sort((a, b) => a.order - b.order);

    const handleUpdateTodo = async (updates: Partial<any>) => {
        try {
            await updateTodo(updates.id, updates);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to update todo');
        }
    };

    const handleDeleteTodo = async (todoId: string) => {
        try {
            await deleteTodo(todoId);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to delete todo');
        }
    };

    const handleAddSection = async (name: string) => {
        try {
            await addSection(name);
            setShowSectionForm(false);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to create section');
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        showConfirm('Delete section', 'Delete this section and all its tasks?', async () => {
            try {
                await deleteSection(sectionId);
                if (activeSection === sectionId) setActiveSection(null);
            } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Failed to delete section');
            }
        });
    };

    const handleEditSection = async (sectionId: string) => {
        if (!editingSectionName.trim()) { setEditingSectionId(null); return; }
        try {
            await updateSection(sectionId, { name: editingSectionName });
            setEditingSectionId(null);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to update section');
        }
    };

    const handleTaskDragStart = (e: React.DragEvent, todoId: string) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const width = rect.width;
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        taskDragMetricsRef.current = { offsetX };

        setDragGhostInfo({
            type: 'task',
            name: todo.title,
            x: e.clientX,
            y: e.clientY,
            offsetX,
            offsetY,
            width,
        });

        setTimeout(() => {
            setDraggedTodoId(todoId);

            const initialTarget: TodoDropTarget = {
                todoId: todo.id,
                position: 'above',
                depth: getTodoDepth(todo.id),
                sectionId: todo.sectionId || null,
                parentTodoId: todo.parentTodoId || null,
            };
            setDropTarget(initialTarget);
            dropTargetRef.current = initialTarget;
        }, 0);
    };

    const handleSectionDragOver = (e: React.DragEvent, sectionId: string | 'unsectioned') => {
        e.preventDefault();
        if (draggedTodoId) {
            e.dataTransfer.dropEffect = 'move';
            if (!draggedSectionId) {
                setDragOverSectionId(sectionId);
                dropTargetRef.current = null;
                setDropTarget(null); // Clear task indicator when over section background
                lastGapTargetsRef.current = null; // Clear the previous task gap targets to prevent cross-section flickering
            }
        }
    };

    const handleSectionDragLeave = (e: React.DragEvent) => {
        if (e.clientX === 0 && e.clientY === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (
            e.clientX < rect.left ||
            e.clientX >= rect.right ||
            e.clientY < rect.top ||
            e.clientY >= rect.bottom
        ) {
            setDragOverSectionId(null);

            if (!dropTargetRef.current && draggedTodoId) {
                const todo = todos.find(t => t.id === draggedTodoId);
                if (todo) {
                    const fallbackTarget: TodoDropTarget = {
                        todoId: todo.id,
                        position: 'above',
                        depth: getTodoDepth(todo.id),
                        sectionId: todo.sectionId || null,
                        parentTodoId: todo.parentTodoId || null,
                    };
                    setDropTarget(fallbackTarget);
                    dropTargetRef.current = fallbackTarget;
                }
            }
        }
    };

    const handleSectionDrop = async (e: React.DragEvent, sectionId: string | undefined) => {
        e.preventDefault();
        setDragOverSectionId(null);
        dropTargetRef.current = null;
        setDropTarget(null);
        setDragGhostInfo(null);
        setDraggedSectionId(null);
        if (draggedSectionId) return;
        const todoId = draggedTodoId || e.dataTransfer.getData('todoId');
        if (!todoId) return;
        setDraggedTodoId(null);
        try {
            const targetSectionId = sectionId === 'unsectioned' ? undefined : sectionId;
            const targetTodos = targetSectionId ? getTodosForSection(targetSectionId) : unsectionedTodos;
            const newOrder = targetTodos.length;
            await updateTodo(todoId, {
                sectionId: targetSectionId || null,
                parentTodoId: null,
                order: newOrder,
            } as any);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to move task');
        }
    };

    const handleTodoDrop = async (targetId: string, draggedId: string, position: DropPosition) => {
        const activeDropTarget = dropTargetRef.current;

        setDraggedTodoId(null);
        dropTargetRef.current = null;
        taskDragMetricsRef.current = null;
        setDropTarget(null);
        setDragGhostInfo(null);
        setDragOverSectionId(null);
        setDraggedSectionId(null);

        if (!activeDropTarget) return;
        const finalTargetId = activeDropTarget.todoId || targetId;
        const finalDepth = activeDropTarget.depth ?? getTodoDepth(targetId);
        if (draggedSectionId) return;
        if (draggedId === finalTargetId) return;

        let curr = todos.find(t => t.id === finalTargetId);
        let isDescendant = false;
        while (curr && curr.parentTodoId) {
            if (curr.parentTodoId === draggedId) {
                isDescendant = true;
                break;
            }
            const parentId = curr.parentTodoId;
            curr = todos.find(t => t.id === parentId);
        }
        if (isDescendant) return;

        const targetTodo = todos.find(t => t.id === finalTargetId);
        if (!targetTodo) return;

        const subtreeHeight = getSubtreeHeight(draggedId);
        if (finalDepth + subtreeHeight > MAX_TODO_DEPTH) {
            setFormError('Nesting depth cannot exceed 5 levels');
            return;
        }

        try {
            const sectionId = activeDropTarget?.sectionId ?? targetTodo.sectionId ?? null;
            const parentTodoId = activeDropTarget
                ? activeDropTarget.parentTodoId
                : position === 'child'
                    ? finalTargetId
                    : targetTodo.parentTodoId || null;

            let siblings = parentTodoId
                ? getSubTodos(parentTodoId)
                : sectionId
                    ? getTodosForSection(sectionId)
                    : unsectionedTodos;

            siblings = siblings.filter(t => t.id !== draggedId);

            let insertIdx = siblings.length;
            if (activeDropTarget?.insertBeforeId) {
                const beforeIdx = siblings.findIndex(t => t.id === activeDropTarget.insertBeforeId);
                if (beforeIdx !== -1) insertIdx = beforeIdx;
            } else if (activeDropTarget?.insertAfterId) {
                const afterIdx = siblings.findIndex(t => t.id === activeDropTarget.insertAfterId);
                insertIdx = afterIdx !== -1 ? afterIdx + 1 : siblings.length;
            } else if (!activeDropTarget && position === 'above') {
                const idxInSiblings = siblings.findIndex(t => t.id === finalTargetId);
                insertIdx = idxInSiblings !== -1 ? idxInSiblings : 0;
            } else if (!activeDropTarget && position === 'below') {
                const idxInSiblings = siblings.findIndex(t => t.id === finalTargetId);
                insertIdx = idxInSiblings !== -1 ? idxInSiblings + 1 : siblings.length;
            }

            await updateTodo(draggedId, {
                parentTodoId: parentTodoId,
                sectionId: sectionId,
                order: insertIdx,
            } as any);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to move task');
        }
    };

    const handleSectionReorderDragStart = (e: React.DragEvent, sectionId: string, sectionName: string) => {
        e.dataTransfer.setData('sectionId', sectionId);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const width = rect.width;
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);

        setDragGhostInfo({
            type: 'section',
            name: sectionName,
            x: e.clientX,
            y: e.clientY,
            offsetX,
            offsetY,
            width,
        });

        setTimeout(() => {
            setDraggedSectionId(sectionId);
            setLocalSections(sortedSections);
        }, 0);
    };

    const handleSectionReorderDragOver = (e: React.DragEvent, targetSectionId: string) => {
        e.preventDefault();
        if (draggedSectionId && draggedSectionId !== targetSectionId) {
            const fromIdx = localSections.findIndex(s => s.id === draggedSectionId);
            const toIdx = localSections.findIndex(s => s.id === targetSectionId);

            if (fromIdx !== -1 && toIdx !== -1) {
                const updatedSections = [...localSections];
                const [moved] = updatedSections.splice(fromIdx, 1);
                updatedSections.splice(toIdx, 0, moved);

                const orderChanged = updatedSections.some((s, idx) => s.id !== localSections[idx].id);
                if (orderChanged) {
                    setLocalSections(updatedSections);
                }
            }
        }
    };

    const handleSectionReorderDragEnd = async () => {
        const sourceSecId = draggedSectionId;
        setDraggedSectionId(null);
        setDragGhostInfo(null);

        if (!sourceSecId) return;

        const dbSections = [...sections].sort((a, b) => a.order - b.order);
        const orderChanged = localSections.some((s, idx) => s.id !== dbSections[idx]?.id);

        if (orderChanged) {
            const reorderPayload = localSections.map((s, i) => ({ id: s.id, order: i }));
            try {
                await reorderSections(reorderPayload);
            } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Failed to reorder sections');
                setLocalSections(dbSections);
            }
        }
    };

    const toggleTodoCollapse = (todoId: string) => {
        const newCollapsed = new Set(collapsedTodos);
        if (newCollapsed.has(todoId)) {
            newCollapsed.delete(todoId);
        } else {
            newCollapsed.add(todoId);
        }
        setCollapsedTodos(newCollapsed);
    };

    const DropIndicatorLine = ({ indentOffset = 0 }: { indentOffset?: number }) => (
        <div
            className="pointer-events-none w-full my-1 transition-all duration-150 ease-out"
            style={{
                marginLeft: `calc(${indentOffset * TODO_INDENT_PX}px + 44px)`,
                width: `calc(100% - ${indentOffset * TODO_INDENT_PX}px - 44px)`
            }}
        >
            <div className="flex items-center" style={{ height: '2px' }}>
                <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" style={{ marginTop: '-1px' }} />
                <div className="flex-1 h-[2px] bg-rose-500" />
            </div>
            <div className="flex mt-1">
                <div className="w-2 flex-shrink-0" />
                <div className="flex-1 bg-gray-50/50 border border-dashed border-gray-200 rounded-lg h-10" />
            </div>
        </div>
    );

    const renderTodo = (todo: Todo, depth: number = 0) => {
        const children = getSubTodos(todo.id);
        const isCollapsed = collapsedTodos.has(todo.id);
        const isTarget = dropTarget?.todoId === todo.id;
        const isDragging = draggedTodoId === todo.id;
        const indicatorIndent = dropTarget ? Math.max(0, dropTarget.depth - depth) : 0;
        return (
            <div key={todo.id}>
                {isTarget && dropTarget!.position === 'above' && (
                    <DropIndicatorLine indentOffset={indicatorIndent} />
                )}

                <TodoItem
                    todo={todo}
                    onUpdate={handleUpdateTodo}
                    onDelete={handleDeleteTodo}
                    onToggle={(id) => {
                        toggleTodo(id).catch(err => setFormError(err instanceof Error ? err.message : 'Failed to update task'));
                    }}
                    hasChildren={children.length > 0}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => toggleTodoCollapse(todo.id)}
                    onDrop={handleTodoDrop}
                    onDragStart={handleTaskDragStart}
                    draggedTodoId={draggedTodoId}
                    checkIsDescendant={checkIsDescendantOfDragged}
                    onDragOverItem={handleDragOverItem}
                    isDragging={isDragging}
                />

                {isTarget && dropTarget!.position === 'child' && (
                    <DropIndicatorLine indentOffset={indicatorIndent} />
                )}

                {!isDragging && !isCollapsed && children.length > 0 && (
                    <div
                        className="ml-8"
                        onDragOver={(e) => {
                            if (draggedTodoId) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                        onDrop={(e) => {
                            if (draggedTodoId) {
                                e.preventDefault();
                                e.stopPropagation();
                                const draggedId = draggedTodoId || e.dataTransfer.getData('todoId');
                                if (draggedId) {
                                    const activeTarget = dropTargetRef.current;
                                    if (activeTarget) {
                                        handleTodoDrop(activeTarget.todoId, draggedId, activeTarget.position);
                                    }
                                }
                            }
                        }}
                    >
                        {children.map(child => renderTodo(child, depth + 1))}
                    </div>
                )}

                {isTarget && dropTarget!.position === 'below' && (
                    <DropIndicatorLine indentOffset={indicatorIndent} />
                )}
            </div>
        );
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-6 py-8 min-h-screen flex flex-col">
                {/* Alerts */}
                {todosError && (
                    <div className="flex items-center gap-3 mb-3">
                        <ErrorAlert message={todosError} />
                        <button onClick={() => void refetchTodos()} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                            Retry
                        </button>
                    </div>
                )}
                {formError && <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />}
                {successMessage && <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-gray-900">Inbox</h1>
                    </div>
                    <button
                        onClick={() => openCreateTodoModal('none', (activeSection && activeSection !== 'unsectioned') ? activeSection : undefined)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        Add task
                    </button>
                </div>

                <div className="flex gap-6 items-start flex-1">
                    {/* Sidebar */}
                    <div className="w-48 flex-shrink-0 sticky top-8">
                        <div className="space-y-4">
                            <div className="px-3 py-1">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Sections</span>
                            </div>
                            <div className="space-y-0.5">
                                <button
                                    onClick={() => { setActiveSection('unsectioned'); scrollToSection('unsectioned'); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeSection === 'unsectioned' || activeSection === null
                                        ? 'bg-rose-50 text-rose-600 border-l-2 border-rose-500 rounded-l-none'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    General ({unsectionedTodos.length})
                                </button>

                                {displaySections.map(section => (
                                    <div key={section.id} className="group/nav flex items-center">
                                        <button
                                            onClick={() => scrollToSection(section.id)}
                                            className={`flex-1 text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors truncate ${activeSection === section.id
                                                ? 'bg-rose-50 text-rose-600 border-l-2 border-rose-500 rounded-l-none'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            {section.name} ({getTodosForSection(section.id).length})
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSection(section.id)}
                                            className="opacity-0 group-hover/nav:opacity-100 p-1.5 text-gray-400 hover:text-rose-500 rounded transition-opacity"
                                            title="Delete section"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}

                                {!showSectionForm ? (
                                    <button
                                        onClick={() => setShowSectionForm(true)}
                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-500 hover:bg-rose-50/50 rounded-lg transition-colors"
                                    >
                                        + New Section
                                    </button>
                                ) : (
                                    <form
                                        onSubmit={e => {
                                            e.preventDefault();
                                            const input = (e.currentTarget.elements as any)[0];
                                            handleAddSection(input.value);
                                            input.value = '';
                                        }}
                                        className="p-1 space-y-2"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Section name..."
                                            required
                                            className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 placeholder-gray-300"
                                            autoFocus
                                        />
                                        <div className="flex gap-1.5">
                                            <button type="submit" className="flex-1 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[10px] font-semibold">Add</button>
                                            <button type="button" onClick={() => setShowSectionForm(false)} className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-md text-[10px] font-semibold">Cancel</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 flex flex-col h-full">
                        {todosLoading ? (
                            <div className="flex-1 flex items-center justify-center py-16">
                                <LoadingSpinner />
                            </div>
                        ) : todos.length === 0 && sections.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                                <EmptyInboxIllustration />
                                <p className="text-sm font-semibold text-gray-800 mt-6 mb-1">
                                    Collect Now. Connect Later.
                                </p>
                                <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-6">
                                    Gather ideas in seconds and turn them into organized projects when the moment is right.
                                </p>
                                <button
                                    onClick={() => openCreateTodoModal('none')}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    Add a task
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* General tasks */}
                                <div
                                    ref={el => { sectionRefs.current['unsectioned'] = el; }}
                                    className="mb-8 transition-colors"
                                    onDragOver={(e) => handleSectionDragOver(e, 'unsectioned')}
                                    onDragLeave={handleSectionDragLeave}
                                    onDrop={(e) => {
                                        const activeTarget = dropTargetRef.current;
                                        if (activeTarget && draggedTodoId) {
                                            e.preventDefault();
                                            handleTodoDrop(activeTarget.todoId, draggedTodoId, activeTarget.position);
                                        } else {
                                            handleSectionDrop(e, 'unsectioned');
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2 py-2 border-b border-gray-200">
                                        <div className="w-4 h-4 flex-shrink-0" />
                                        <button
                                            onClick={() => toggleSectionCollapse('unsectioned')}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {collapsedSections.has('unsectioned') ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        <h2 className="text-sm font-bold text-gray-800">General</h2>
                                    </div>
                                    {!collapsedSections.has('unsectioned') && (
                                        <div className="divide-y divide-gray-50 pl-6">
                                            {unsectionedTodos.filter(t => t.id !== draggedTodoId).length > 0 ? (
                                                unsectionedTodos.map(todo => renderTodo(todo))
                                            ) : (
                                                (!dragOverSectionId || dragOverSectionId !== 'unsectioned' || draggedSectionId) && (
                                                    <div className="h-[70px] flex items-center justify-center text-xs text-gray-300">
                                                        No tasks in General
                                                    </div>
                                                )
                                            )}
                                            {dragOverSectionId === 'unsectioned' && !draggedSectionId && (
                                                <div className="py-2">
                                                    <DropIndicatorLine indentOffset={0} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Sections */}
                                {displaySections.map(section => {
                                    const sectionTodos = getTodosForSection(section.id);
                                    const isCollapsed = collapsedSections.has(section.id);
                                    const isDragged = section.id === draggedSectionId;

                                    return (
                                        <div key={section.id} className="relative group/section" id={`section-${section.id}`}>
                                            <div
                                                ref={el => { sectionRefs.current[section.id] = el; }}
                                                draggable={editingSectionId !== section.id}
                                                onDragStart={(e) => handleSectionReorderDragStart(e, section.id, section.name)}
                                                onDragEnd={handleSectionReorderDragEnd}
                                                className={`mb-6 transition-all ${isDragged ? 'bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl h-20 w-full' : ''}`}
                                                onDragOver={(e) => {
                                                    if (draggedSectionId) {
                                                        handleSectionReorderDragOver(e, section.id);
                                                    } else {
                                                        handleSectionDragOver(e, section.id);
                                                    }
                                                }}
                                                onDragLeave={handleSectionDragLeave}
                                                onDrop={(e) => {
                                                    const dragSecId = draggedSectionId || e.dataTransfer.getData('sectionId');
                                                    if (dragSecId) {
                                                        e.preventDefault();
                                                    } else {
                                                        const activeTarget = dropTargetRef.current;
                                                        if (activeTarget && draggedTodoId) {
                                                            e.preventDefault();
                                                            handleTodoDrop(activeTarget.todoId, draggedTodoId, activeTarget.position);
                                                        } else {
                                                            handleSectionDrop(e, section.id);
                                                        }
                                                    }
                                                }}
                                            >
                                                {!isDragged && (
                                                    <>
                                                        <div className="group/header flex items-center gap-2 py-2 border-b border-gray-200">
                                                            <div className="opacity-0 group-hover/header:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-opacity">
                                                                <GripVertical className="w-4 h-4" />
                                                            </div>
                                                            <button
                                                                onClick={() => toggleSectionCollapse(section.id)}
                                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                            >
                                                                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>

                                                            {editingSectionId === section.id ? (
                                                                <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-100">
                                                                    <input
                                                                        type="text"
                                                                        value={editingSectionName}
                                                                        onChange={e => setEditingSectionName(e.target.value)}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') handleEditSection(section.id);
                                                                            if (e.key === 'Escape') setEditingSectionId(null);
                                                                        }}
                                                                        onBlur={() => setEditingSectionId(null)}
                                                                        autoFocus
                                                                        className="flex-1 bg-white border border-gray-200 rounded px-2 py-0.5 text-sm font-bold focus:outline-none focus:border-rose-300"
                                                                    />
                                                                    <button
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={() => handleEditSection(section.id)}
                                                                        className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    className="flex-1 text-sm font-bold text-gray-800 cursor-text hover:bg-gray-50 px-2 py-0.5 rounded transition-colors"
                                                                    onClick={() => {
                                                                        setEditingSectionName(section.name);
                                                                        setEditingSectionId(section.id);
                                                                    }}
                                                                >
                                                                    {section.name}
                                                                    <span className="ml-2 text-xs font-normal text-gray-400">{sectionTodos.length}</span>
                                                                </span>
                                                            )}

                                                            <button
                                                                onClick={() => openCreateTodoModal('none', section.id)}
                                                                className="opacity-0 group-hover/header:opacity-100 p-1 text-gray-400 hover:text-rose-500 rounded transition-all"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>

                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setSectionDropdownId(sectionDropdownId === section.id ? null : section.id)}
                                                                    className="opacity-0 group-hover/header:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded transition-all"
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>
                                                                {sectionDropdownId === section.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-10" onClick={() => setSectionDropdownId(null)} />
                                                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditingSectionId(section.id);
                                                                                    setEditingSectionName(section.name);
                                                                                    setSectionDropdownId(null);
                                                                                }}
                                                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                                                                            >
                                                                                Edit section
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSectionDropdownId(null);
                                                                                    handleDeleteSection(section.id);
                                                                                }}
                                                                                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                                                                            >
                                                                                Delete section
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {!isCollapsed && (
                                                            <div className="py-1">
                                                                {sectionTodos.filter(t => t.id !== draggedTodoId).length > 0 ? (
                                                                    <div className="divide-y divide-gray-50 pl-6">
                                                                        {sectionTodos.map(todo => renderTodo(todo))}
                                                                    </div>
                                                                ) : (
                                                                    (!dragOverSectionId || dragOverSectionId !== section.id || draggedSectionId) && (
                                                                        <div className="h-[70px] flex items-center justify-center text-xs text-gray-300">
                                                                            No tasks in this section
                                                                        </div>
                                                                    )
                                                                )}
                                                                {dragOverSectionId === section.id && !draggedSectionId && (
                                                                    <div className="pl-6 py-2">
                                                                        <DropIndicatorLine indentOffset={0} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                        <p className="text-xs text-gray-500 mb-5 leading-relaxed">{confirmModal.message}</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 active:bg-gray-300 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white active:bg-rose-700 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Drag Ghost */}
            {dragGhostInfo && (
                <div
                    className="fixed pointer-events-none z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl px-6 py-3.5 flex items-center gap-3 text-sm font-bold text-gray-800"
                    style={{
                        left: `${dragGhostInfo.x - dragGhostInfo.offsetX}px`,
                        top: `${dragGhostInfo.y - dragGhostInfo.offsetY}px`,
                        width: `${dragGhostInfo.width}px`,
                    }}
                >
                    <div className="text-gray-400 flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                    </div>
                    {dragGhostInfo.type === 'section' ? (
                        <>
                            <div className="text-gray-400 flex-shrink-0">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-800 truncate">{dragGhostInfo.name}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-800 truncate">{dragGhostInfo.name}</span>
                        </>
                    )}
                </div>
            )}
        </Layout>
    );
}
