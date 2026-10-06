'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/Layout';
import { TodoItem, DropPosition } from '@/components/TodoItem';
import { useTodos } from '@/hooks/useTodos';
import { useSections } from '@/hooks/useTodos';
import { useApp } from '@/context/AppContext';
import { Todo, Section } from '@/lib/api-client';
import { Plus, MoreHorizontal, ChevronDown, ChevronRight, GripVertical, PanelLeft, ListTodo, Kanban, Calendar as CalendarIcon } from 'lucide-react';
import BoardView from './projects/[projectId]/BoardView';
import CalendarView from './projects/[projectId]/CalendarView';
import TaskSidebar from './projects/[projectId]/TaskSidebar';
import { ProjectSearchInput } from '@/components/ProjectSearchInput';
import { ProjectFilterPopover, FilterState, DEFAULT_FILTER_STATE } from '@/components/ProjectFilterPopover';
import { SectionSortDropdown, SortOption } from '@/components/SectionSortDropdown';
import { sortTodos, filterTodosBySearch, filterTodosByCriteria } from '@/lib/todo-sort';

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
    const { todos, loading: todosLoading, error: todosError, updateTodo, deleteTodo, toggleTodo, moveTodo, refetch: refetchTodos } = useTodos(projectId);
    const { sections, loading: sectionsLoading, addSection, updateSection, deleteSection, reorderSections } = useSections(projectId);
    const { openCreateTodoModal, isSidebarCollapsed, toggleSidebar } = useApp();

    const [viewType, setViewType] = useState<'list' | 'board' | 'calendar'>('list');
    const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
    const [activeTodoId, setActiveTodoId] = useState<string | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(450);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSidebarMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sidebarWidth;
        
        const handleMouseMove = (mouseEvent: MouseEvent) => {
            const delta = startX - mouseEvent.clientX;
            setSidebarWidth(Math.max(300, Math.min(800, startWidth + delta)));
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const [sectionDropdownId, setSectionDropdownId] = useState<string | null>(null);

    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [showSectionForm, setShowSectionForm] = useState(false);
    const [sectionDropdownOpenMobile, setSectionDropdownOpenMobile] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Search, Filter, and Sort state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);
    const [sectionSorts, setSectionSorts] = useState<Record<string, SortOption>>({});

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
        const todoIds = new Set(todos.map(todo => todo.id));
        const traverse = (todo: Todo, depth: number) => {
            result.push({ todo, depth });
            const children = todos.filter(t => t.parentTodoId === todo.id).sort((a, b) => a.order - b.order);
            const isCollapsed = collapsedTodos.has(todo.id);
            if (!isCollapsed && children.length > 0) {
                children.forEach(child => traverse(child, depth + 1));
            }
        };

        const rootTodos = todos
            .filter(t =>
                (sectionId ? t.sectionId === sectionId : !t.sectionId) &&
                (!t.parentTodoId || !todoIds.has(t.parentTodoId))
            )
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

    const isSectionsInitializedRef = useRef(false);

    // Initialize collapsed states once on load
    useEffect(() => {
        if (sections.length > 0 && !isSectionsInitializedRef.current) {
            isSectionsInitializedRef.current = true;
            setCollapsedSections(prev => {
                const next = new Set(prev);
                sections.forEach(s => {
                    if (s.isCollapsed) next.add(s.id);
                });
                return next;
            });
        }
    }, [sections]);

    const toggleSectionCollapse = async (sectionId: string) => {
        let isNowCollapsed = false;
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
                isNowCollapsed = false;
            } else {
                next.add(sectionId);
                isNowCollapsed = true;
            }
            return next;
        });

        if (sectionId === 'unsectioned') return;

        try {
            await updateSection(sectionId, { isCollapsed: isNowCollapsed });
        } catch (err) {
            setCollapsedSections(prev => {
                const next = new Set(prev);
                if (isNowCollapsed) next.delete(sectionId);
                else next.add(sectionId);
                return next;
            });
            setFormError(err instanceof Error ? err.message : 'Failed to update section');
        }
    };

    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId);
        setCollapsedSections(prev => {
            if (prev.has(sectionId)) {
                const next = new Set(prev);
                next.delete(sectionId);
                return next;
            }
            return prev;
        });
        const el = sectionRefs.current[sectionId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Filter todos by search query & criteria, then group/sort by section
    const filteredTodos = filterTodosByCriteria(todos, searchQuery, filterState);
    const todoIds = new Set(filteredTodos.map(todo => todo.id));
    const isRootOrOrphan = (todo: Todo) => !todo.parentTodoId || !todoIds.has(todo.parentTodoId);

    const unsectionedRaw = filteredTodos.filter(t => !t.sectionId && isRootOrOrphan(t));
    const unsectionedTodos = sortTodos(unsectionedRaw, sectionSorts['unsectioned'] || 'manual');

    const sortedSections = [...sections].sort((a, b) => a.order - b.order);
    const displaySections = draggedSectionId ? localSections : sortedSections;

    const getTodosForSection = (sectionId: string) => {
        const raw = filteredTodos.filter(t => t.sectionId === sectionId && isRootOrOrphan(t));
        return sortTodos(raw, sectionSorts[sectionId] || 'manual');
    };

    const getSubTodos = (parentId: string) => {
        const parent = filteredTodos.find(t => t.id === parentId);
        const sectionId = parent?.sectionId || 'unsectioned';
        const raw = filteredTodos.filter(t => t.parentTodoId === parentId);
        return sortTodos(raw, sectionSorts[sectionId] || 'manual');
    };

    const handleUpdateTodo = async (updates: Partial<any>) => {
        try {
            await updateTodo(updates.id, updates);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to update todo');
        }
    };

    const handleDeleteTodo = async (todoId: string) => {
        const targetTodo = todos.find(t => t.id === todoId);
        const titleText = targetTodo?.title ? `Delete "${targetTodo.title}"` : 'Delete task';
        showConfirm(titleText, 'Are you sure you want to delete this task? This action cannot be undone.', async () => {
            try {
                await deleteTodo(todoId);
            } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Failed to delete todo');
            }
        });
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
        if (sectionId === 'unsectioned') return;
        const targetSection = sections.find(s => s.id === sectionId);
        const sectionName = targetSection?.name || 'this section';
        showConfirm('Delete section', `Are you sure you want to delete section "${sectionName}" and all its tasks?`, async () => {
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
            <div className="flex w-full flex-1 min-h-0 relative bg-white overflow-hidden h-full">
                <div className="flex-1 flex flex-col min-w-0 transition-all min-h-0 h-full w-full overflow-x-hidden">
                {/* Header (Static Top Header Bar) */}
                <div className="w-full shrink-0 bg-white z-10 border-b border-gray-100">
                    <div className={`w-full ${activeTodoId ? 'max-w-none' : 'max-w-7xl mx-auto'} px-3 sm:px-6 md:px-8 h-14 flex items-center justify-between gap-3`}>
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                            {isSidebarCollapsed && (
                                <button
                                    onClick={toggleSidebar}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                                    title="Open sidebar"
                                >
                                    <PanelLeft className="w-4 h-4" />
                                </button>
                            )}
                            <h1 className="text-base md:text-lg font-bold text-gray-900 truncate" title="Inbox">
                                Inbox
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            {/* Search Input */}
                            <ProjectSearchInput value={searchQuery} onChange={setSearchQuery} />

                            {/* Filter Popover */}
                            <ProjectFilterPopover todos={todos} filterState={filterState} onFilterChange={setFilterState} />

                            {/* Mobile View Dropdown (< md) */}
                            <div className="relative md:hidden">
                                <button
                                    type="button"
                                    onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
                                    className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
                                    title="Switch view mode"
                                >
                                    {viewType === 'list' && <ListTodo className="w-4 h-4" />}
                                    {viewType === 'board' && <Kanban className="w-4 h-4" />}
                                    {viewType === 'calendar' && <CalendarIcon className="w-4 h-4" />}
                                </button>
                                {viewDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setViewDropdownOpen(false)} />
                                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 animate-in fade-in duration-100">
                                            <button
                                                onClick={() => { setViewType('list'); setViewDropdownOpen(false); }}
                                                className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs font-semibold ${viewType === 'list' ? 'text-rose-600 bg-rose-50' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <ListTodo className="w-3.5 h-3.5" />
                                                List
                                            </button>
                                            <button
                                                onClick={() => { setViewType('board'); setViewDropdownOpen(false); }}
                                                className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs font-semibold ${viewType === 'board' ? 'text-rose-600 bg-rose-50' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <Kanban className="w-3.5 h-3.5" />
                                                Board
                                            </button>
                                            <button
                                                onClick={() => { setViewType('calendar'); setViewDropdownOpen(false); }}
                                                className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs font-semibold ${viewType === 'calendar' ? 'text-rose-600 bg-rose-50' : 'text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                Calendar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Desktop View Switcher (>= md) */}
                            <div className="hidden md:flex bg-gray-100 p-1 rounded-lg shrink-0 gap-0.5">
                                <button
                                    onClick={() => setViewType('list')}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${viewType === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    <ListTodo className="w-3.5 h-3.5" />
                                    List
                                </button>
                                <button
                                    onClick={() => setViewType('board')}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${viewType === 'board' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    <Kanban className="w-3.5 h-3.5" />
                                    Board
                                </button>
                                <button
                                    onClick={() => setViewType('calendar')}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${viewType === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                    Calendar
                                </button>
                            </div>

                            <button
                                onClick={() => openCreateTodoModal('none', (activeSection && activeSection !== 'unsectioned') ? activeSection : undefined)}
                                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                                title="Add task"
                            >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span className="hidden md:inline">Add task</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {(todosError || formError || successMessage) && (
                    <div className={`w-full ${activeTodoId ? 'max-w-none' : 'max-w-7xl mx-auto'} px-6 md:px-8 pt-3`}>
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
                    </div>
                )}

                {/* View Content Body Container */}
                <div className={`flex-1 min-h-0 w-full ${viewType === 'board' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
                    <div className={`h-full ${activeTodoId || viewType === 'board' ? 'w-full' : 'max-w-7xl mx-auto'} px-3 sm:px-6 md:px-8 py-4 ${viewType === 'board' ? 'flex flex-col' : ''}`}>

                        {viewType === 'board' ? (
                            <BoardView
                                project={{ id: 'inbox', name: 'Inbox', viewType }}
                                todos={filteredTodos}
                                sections={sections}
                                todosLoading={todosLoading}
                                sectionsLoading={sectionsLoading}
                                updateTodo={updateTodo}
                                deleteTodo={deleteTodo}
                                moveTodo={moveTodo}
                                addSection={addSection}
                                updateSection={updateSection}
                                deleteSection={deleteSection}
                                reorderSections={reorderSections}
                                openCreateTodoModal={openCreateTodoModal}
                                onTodoClick={setActiveTodoId}
                            />
                        ) : viewType === 'calendar' ? (
                            <CalendarView 
                                project={{ id: 'inbox', name: 'Inbox', viewType }}
                                todos={filteredTodos}
                                onTodoClick={setActiveTodoId}
                            />
                        ) : (
                            <div className="flex gap-6 items-start">
                                {/* ─── Sidebar ─── */}
                                <div className="hidden md:block w-48 flex-shrink-0 sticky top-8">
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

                                {/* ─── Main Content (Vertical Sections) ─── */}
                                <div className="flex-1 min-w-0">
                                    {/* Mobile Section Selector (< md) */}
                                    <div className="block md:hidden mb-4 relative">
                                        <button
                                            type="button"
                                            onClick={() => setSectionDropdownOpenMobile(!sectionDropdownOpenMobile)}
                                            className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 transition-colors text-left"
                                        >
                                            <span className="text-xs font-bold text-gray-900 truncate">
                                                {activeSection === null || activeSection === 'unsectioned'
                                                    ? `General (${unsectionedTodos.length})`
                                                    : `${sections.find(s => s.id === activeSection)?.name || 'Section'} (${getTodosForSection(activeSection || '').length})`
                                                }
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
                                        </button>

                                        {sectionDropdownOpenMobile && (
                                            <>
                                                <div className="fixed inset-0 z-20" onClick={() => setSectionDropdownOpenMobile(false)} />
                                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-30 animate-in fade-in duration-100">
                                                    <div className="max-h-60 overflow-y-auto">
                                                        <button
                                                            onClick={() => {
                                                                setActiveSection('unsectioned');
                                                                scrollToSection('unsectioned');
                                                                setSectionDropdownOpenMobile(false);
                                                            }}
                                                            className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${activeSection === 'unsectioned' || activeSection === null ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                                        >
                                                            General ({unsectionedTodos.length})
                                                        </button>
                                                        {displaySections.map(section => (
                                                            <button
                                                                key={section.id}
                                                                onClick={() => {
                                                                    scrollToSection(section.id);
                                                                    setSectionDropdownOpenMobile(false);
                                                                }}
                                                                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors truncate ${activeSection === section.id ? 'bg-rose-50 text-rose-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                                            >
                                                                {section.name} ({getTodosForSection(section.id).length})
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="my-1.5 border-t border-gray-100" />

                                                    <form
                                                        onSubmit={async (e) => {
                                                            e.preventDefault();
                                                            const form = e.currentTarget;
                                                            const input = form.elements.namedItem('newSectionName') as HTMLInputElement;
                                                            if (input && input.value.trim()) {
                                                                const name = input.value.trim();
                                                                await handleAddSection(name);
                                                                input.value = '';
                                                                setSectionDropdownOpenMobile(false);
                                                            }
                                                        }}
                                                        className="px-2.5 pt-1 pb-0.5 flex items-center gap-1.5"
                                                    >
                                                        <input
                                                            name="newSectionName"
                                                            type="text"
                                                            placeholder="+ Create section..."
                                                            className="flex-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white placeholder-gray-400 text-gray-800 font-medium"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-sm"
                                                        >
                                                            Add
                                                        </button>
                                                    </form>
                                                </div>
                                            </>
                                        )}
                                    </div>

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
                                                <div className="group/header flex items-center gap-2 py-2 border-b border-gray-200">
                                                    <div className="w-4 h-4 flex-shrink-0" />
                                                    <button
                                                        onClick={() => toggleSectionCollapse('unsectioned')}
                                                        className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                        title={collapsedSections.has('unsectioned') ? "Expand section" : "Collapse section"}
                                                    >
                                                        {collapsedSections.has('unsectioned') ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                    <h2 
                                                        onClick={() => toggleSectionCollapse('unsectioned')}
                                                        className="text-sm font-bold text-gray-800 cursor-pointer select-none hover:text-gray-900 flex-1"
                                                    >
                                                        General
                                                        <span className="ml-2 text-xs font-normal text-gray-400">{unsectionedTodos.length}</span>
                                                    </h2>

                                                    {/* Section Sort */}
                                                    <SectionSortDropdown
                                                        currentSort={sectionSorts['unsectioned'] || 'manual'}
                                                        onSortChange={(sort) => setSectionSorts(prev => ({ ...prev, unsectioned: sort }))}
                                                        iconOnly
                                                    />

                                                    {/* Add Task in Section */}
                                                    <button
                                                        onClick={() => openCreateTodoModal('none', undefined)}
                                                        className="opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100 p-1 text-gray-400 hover:text-rose-500 rounded transition-all"
                                                        title="Add task in section"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>

                                                    {/* Options Menu for General (without Delete) */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setSectionDropdownId(sectionDropdownId === 'unsectioned' ? null : 'unsectioned')}
                                                            className="opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded transition-all"
                                                            title="Section options"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                        {sectionDropdownId === 'unsectioned' && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setSectionDropdownId(null)} />
                                                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 text-xs">
                                                                    <button
                                                                        onClick={() => {
                                                                            toggleSectionCollapse('unsectioned');
                                                                            setSectionDropdownId(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                                                                    >
                                                                        {collapsedSections.has('unsectioned') ? 'Expand section' : 'Collapse section'}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {!collapsedSections.has('unsectioned') && (
                                                    <div className="divide-y divide-gray-50 pl-1 sm:pl-4 md:pl-6">
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
                                                                            className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                                            title={isCollapsed ? "Expand section" : "Collapse section"}
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
                                                                                className="flex-1 text-sm font-bold text-gray-800 cursor-pointer select-none hover:text-gray-900 px-1 py-0.5 rounded transition-colors"
                                                                                onClick={() => toggleSectionCollapse(section.id)}
                                                                            >
                                                                                {section.name}
                                                                                <span className="ml-2 text-xs font-normal text-gray-400">{sectionTodos.length}</span>
                                                                            </span>
                                                                        )}

                                                                        <button
                                                                            onClick={() => openCreateTodoModal('none', section.id)}
                                                                            className="opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100 p-1 text-gray-400 hover:text-rose-500 rounded transition-all"
                                                                            title="Add task in section"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                        <SectionSortDropdown
                                                                            currentSort={sectionSorts[section.id] || 'manual'}
                                                                            onSortChange={(sort) => setSectionSorts(prev => ({ ...prev, [section.id]: sort }))}
                                                                            iconOnly
                                                                        />


                                                                        <div className="relative">
                                                                            <button
                                                                                onClick={() => setSectionDropdownId(sectionDropdownId === section.id ? null : section.id)}
                                                                                className="opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100 p-1 text-gray-400 hover:text-gray-700 rounded transition-all"
                                                                                title="Section options"
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
                                                                                <div className="divide-y divide-gray-50 pl-1 sm:pl-4 md:pl-6">
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
                        )}
                    </div>
                </div>
            
            {activeTodoId && (
                <div 
                    className="fixed inset-0 z-50 w-full h-full bg-white flex flex-row shadow-2xl md:relative md:inset-auto md:z-30 md:flex-shrink-0 md:self-stretch md:h-full md:min-h-0 md:border-l md:border-gray-200 md:shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]" 
                    style={isMobile ? { width: '100%', height: '100%' } : { width: sidebarWidth, height: '100%', maxWidth: '100vw' }}
                >
                    <div 
                        className="hidden md:block w-1.5 cursor-col-resize hover:bg-rose-400 active:bg-rose-500 transition-colors bg-transparent h-full -ml-[3px] z-10 flex-shrink-0"
                        onMouseDown={handleSidebarMouseDown} 
                    />
                    <div className="flex-1 min-w-0 min-h-0 h-full w-full overflow-hidden flex flex-col relative">
                        <TaskSidebar 
                            key={activeTodoId}
                            todo={todos.find(t => String(t.id) === String(activeTodoId))} 
                            project={{ id: 'inbox', name: 'Inbox', viewType }}
                            onClose={() => setActiveTodoId(null)}
                            onSave={async (updates) => {
                                await updateTodo(activeTodoId, updates);
                            }}
                        />
                    </div>
                </div>
            )}
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
