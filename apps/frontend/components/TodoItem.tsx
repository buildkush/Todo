'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Todo } from '@/lib/api-client';
import { Trash2, CheckCircle2, Circle, MoreHorizontal, GripVertical, ChevronDown, ChevronRight, Flag } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api-client';

// Drop position types
export type DropPosition = 'above' | 'below' | 'child';

interface TodoItemProps {
    todo: Todo;
    onUpdate: (todo: Partial<Todo>) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string) => void;
    hasChildren?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    onDrop?: (targetId: string, draggedId: string, position: DropPosition) => void;
    onDragStart?: (e: React.DragEvent, todoId: string) => void;
    draggedTodoId?: string | null;
    checkIsDescendant?: (targetId: string) => boolean;
    onDragOverItem?: (
        todoId: string,
        position: DropPosition,
        clientX: number,
        rect: { left: number; top: number; height: number }
    ) => void;
    isDragging?: boolean;
    onClick?: () => void;
}

const PRIORITIES = [
    { value: 'high',   label: 'Priority 1', color: '#ef4444', flag: '#ef4444' },
    { value: 'medium', label: 'Priority 2', color: '#f59e0b', flag: '#f59e0b' },
    { value: 'low',    label: 'Priority 3', color: '#6b7280', flag: '#9ca3af' },
] as const;

export function TodoItem({ 
    todo, 
    onUpdate, 
    onDelete, 
    onToggle, 
    hasChildren,
    isCollapsed,
    onToggleCollapse,
    onDrop,
    onDragStart,
    draggedTodoId,
    checkIsDescendant,
    onDragOverItem,
    isDragging,
    onClick,
}: TodoItemProps) {
    const { projects } = useApp();
    const isPending = todo.id.startsWith('optimistic-todo-');
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [editDescription, setEditDescription] = useState(todo.description || '');
    const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>(todo.priority || 'low');
    const [editLocation, setEditLocation] = useState<string>(
        todo.sectionId ? `sec:${todo.projectId}:${todo.sectionId}` : 
        todo.projectId ? `proj:${todo.projectId}` : 'inbox'
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    
    const itemRef = useRef<HTMLDivElement>(null);
    
    // For location dropdown
    const [locationOptions, setLocationOptions] = useState<Array<{id: string, label: string}>>([
        { id: 'inbox', label: 'Inbox' }
    ]);
    const [isLocOpen, setIsLocOpen] = useState(false);
    const [locationOptionsLoading, setLocationOptionsLoading] = useState(false);
    const [locationOptionsError, setLocationOptionsError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLocOpen) return;

        let cancelled = false;
        const buildOptions = async () => {
            const opts = [{ id: 'inbox', label: 'Inbox' }];
            const projectOptions = await Promise.all(projects
                .filter(project => !project.id.startsWith('optimistic-project-'))
                .map(async project => {
                const projectOpts = [{ id: `proj:${project.id}`, label: project.name }];
                const res = await apiClient.getSectionsForLocation(project.id);
                for (const sec of res.data || []) {
                    projectOpts.push({ id: `sec:${project.id}:${sec.id}`, label: `${project.name} / ${sec.name}` });
                }
                return projectOpts;
            }));
            for (const projectOption of projectOptions) {
                opts.push(...projectOption);
            }
            if (!cancelled) {
                setLocationOptions(opts);
                setLocationOptionsError(null);
            }
        };

        setLocationOptionsLoading(true);
        setLocationOptionsError(null);
        buildOptions()
            .catch(err => {
                if (!cancelled) {
                    setLocationOptionsError(err instanceof Error ? err.message : 'Failed to load locations');
                }
            })
            .finally(() => {
                if (!cancelled) setLocationOptionsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isLocOpen, projects]);

    const handleSave = () => {
        let projectId: string | null = undefined as any;
        let sectionId: string | null = undefined as any;
        
        if (editLocation === 'inbox') {
            projectId = null;
            sectionId = null;
        } else if (editLocation.startsWith('proj:')) {
            projectId = editLocation.slice(5);
            sectionId = null;
        } else if (editLocation.startsWith('sec:')) {
            const parts = editLocation.slice(4).split(':');
            projectId = parts[0];
            sectionId = parts[1];
        }

        const updates: Partial<Todo> = {
            id: todo.id,
            title: editTitle.trim(),
            description: editDescription.trim() || undefined,
            priority: editPriority,
        };

        if (projectId !== undefined) updates.projectId = projectId as any;
        if (sectionId !== undefined) updates.sectionId = sectionId as any;

        onUpdate(updates);
        setIsEditing(false);
    };

    // Calculate drop position from drag event
    const getDropPosition = useCallback((e: React.DragEvent): DropPosition => {
        if (!itemRef.current) return 'below';
        const rect = itemRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        if (y < height * 0.35) {
            return 'above';
        }
        return 'below';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedTodoId || draggedTodoId === todo.id || (checkIsDescendant && checkIsDescendant(todo.id))) {
            return;
        }
        e.dataTransfer.dropEffect = 'move';
        const rect = itemRef.current?.getBoundingClientRect();
        const pos = getDropPosition(e);
        if (onDragOverItem && rect) {
            onDragOverItem(todo.id, pos, e.clientX, {
                left: rect.left,
                top: rect.top,
                height: rect.height,
            });
        }
    }, [draggedTodoId, todo.id, getDropPosition, checkIsDescendant, onDragOverItem]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('todoId') || draggedTodoId;
        const position = getDropPosition(e);
        if (draggedId && draggedId !== todo.id && onDrop) {
            onDrop(todo.id, draggedId, position);
        }
    }, [todo.id, onDrop, getDropPosition, draggedTodoId]);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('todoId', todo.id);
        e.dataTransfer.effectAllowed = 'move';
        
        // Hide browser default drag image using transparent 1x1 GIF
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);

        if (onDragStart) onDragStart(e, todo.id);
    }, [todo.id, onDragStart]);

    if (isEditing) {
        return (
            <div className="py-2.5 px-2 -mx-2">
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent mb-2"
                        placeholder="Task title"
                        autoFocus
                        onKeyDown={e => {
                            if (e.key === 'Escape') setIsEditing(false);
                        }}
                    />
                    <textarea
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        className="w-full text-xs text-gray-500 placeholder-gray-300 border-none outline-none bg-transparent resize-none mb-3"
                        placeholder="Description"
                        rows={2}
                    />
                    
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                        <div className="flex items-center gap-2">
                            {/* Priority Dropdown */}
                            <div className="relative">
                                <button onClick={() => setIsPriorityOpen(!isPriorityOpen)} className="flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-50">
                                    <Flag className="w-3 h-3" style={{ color: PRIORITIES.find(p => p.value === editPriority)?.flag }} />
                                </button>
                                {isPriorityOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsPriorityOpen(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow z-20">
                                            {PRIORITIES.map(p => (
                                                <button key={p.value} onClick={() => { setEditPriority(p.value as any); setIsPriorityOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2">
                                                    <Flag className="w-3 h-3" style={{ color: p.flag }} />
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Location Dropdown */}
                            <div className="relative">
                                <button onClick={() => setIsLocOpen(!isLocOpen)} className="flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 max-w-[150px] truncate">
                                    {locationOptions.find(o => o.id === editLocation)?.label || 'Inbox'}
                                </button>
                                {isLocOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsLocOpen(false)} />
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow z-20 max-h-48 overflow-y-auto">
                                            {locationOptionsLoading ? (
                                                <div className="px-3 py-1.5 text-xs text-gray-400">Loading locations...</div>
                                            ) : locationOptionsError ? (
                                                <div className="px-3 py-1.5 text-xs text-red-500">{locationOptionsError}</div>
                                            ) : locationOptions.map(opt => (
                                                <button key={opt.id} onClick={() => { setEditLocation(opt.id); setIsLocOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 truncate">
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleSave} className="px-3 py-1.5 text-xs text-white bg-rose-500 hover:bg-rose-600 rounded-lg font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={itemRef}
            draggable={!isPending}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`group flex items-center gap-2 rounded-lg px-2 -mx-2 transition-colors relative ${
                isDragging ? 'h-0 overflow-hidden opacity-0 py-0 my-0 border-0 pointer-events-none' : 'py-2.5 hover:bg-gray-50'
            }`}
        >
            <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 transition-opacity">
                <GripVertical className="w-4 h-4" />
            </div>
            
            {hasChildren && onToggleCollapse ? (
                <button onClick={onToggleCollapse} disabled={isPending} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            ) : (
                <div className="w-4" />
            )}

            <button
                onClick={() => onToggle(todo.id)}
                disabled={isPending}
                className="flex-shrink-0 text-gray-300 hover:text-rose-400 transition-colors disabled:opacity-50"
            >
                {todo.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-rose-400 fill-rose-50" />
                ) : (
                    <Circle className="w-4 h-4" />
                )}
            </button>

            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isPending && onClick?.()} onDoubleClick={() => !isPending && setIsEditing(true)}>
                <p className={`text-sm truncate ${todo.isCompleted ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                    {todo.title}
                </p>
                {todo.description && (
                    <p className={`text-xs truncate mt-0.5 ${todo.isCompleted ? 'line-through text-gray-300' : 'text-gray-400'}`}>
                        {todo.description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                {todo.priority && todo.priority !== 'low' && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${todo.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                        {todo.priority}
                    </span>
                )}

                <div className="relative">
                    <button onClick={() => !isPending && setIsDropdownOpen(!isDropdownOpen)} disabled={isPending} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all disabled:cursor-wait">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                <button onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); setIsEditing(true); }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                                    Edit task
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); onDelete(todo.id); }} className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50">
                                    Delete task
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TodoFormProps {
    onSubmit: (title: string, description?: string) => void;
    isLoading?: boolean;
}

export function TodoForm({ onSubmit, isLoading = false }: TodoFormProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        if (title.trim()) {
            onSubmit(title, description || undefined);
            e.currentTarget.reset();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-white border border-gray-200 rounded-lg">
            <input type="text" name="title" placeholder="Add a new todo..." required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm placeholder-gray-300" disabled={isLoading} />
            <textarea name="description" placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm resize-none placeholder-gray-300" disabled={isLoading} />
            <button type="submit" disabled={isLoading} className="w-full px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors font-semibold text-xs">
                {isLoading ? 'Adding...' : 'Add task'}
            </button>
        </form>
    );
}
