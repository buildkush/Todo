'use client';

import { useRef, useCallback } from 'react';
import { Todo } from '@/lib/api-client';
import { Trash2, CheckCircle2, Circle, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

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

export function TodoItem({ 
    todo, 
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
    const isPending = todo.id.startsWith('optimistic-todo-');
    const itemRef = useRef<HTMLDivElement>(null);

    // Calculate drop position from drag event
    const getDropPosition = useCallback((e: React.DragEvent): DropPosition => {
        if (!itemRef.current) return 'below';
        const rect = itemRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        if (y < height * 0.35) return 'above';
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
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        if (onDragStart) onDragStart(e, todo.id);
    }, [todo.id, onDragStart]);

    return (
        <div
            ref={itemRef}
            draggable={!isPending}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`group flex items-start gap-2.5 rounded-lg px-2 -mx-2 transition-colors relative ${
                isDragging ? 'h-0 overflow-hidden opacity-0 py-0 my-0 border-0 pointer-events-none' : 'py-2.5 hover:bg-gray-50'
            }`}
        >
            <div className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 transition-opacity mt-0.5">
                <GripVertical className="w-4 h-4" />
            </div>
            
            {hasChildren && onToggleCollapse ? (
                <button onClick={onToggleCollapse} disabled={isPending} className="text-gray-400 hover:text-gray-600 disabled:opacity-50 mt-0.5">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            ) : (
                <div className="w-4" />
            )}

            <button
                onClick={() => onToggle(todo.id)}
                disabled={isPending}
                className="flex-shrink-0 text-gray-300 hover:text-rose-400 transition-colors disabled:opacity-50 mt-0.5"
            >
                {todo.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-rose-400 fill-rose-50" />
                ) : (
                    <Circle className="w-4 h-4" />
                )}
            </button>

            <div className="flex-1 min-w-0 cursor-pointer mr-3 sm:mr-5" onClick={() => !isPending && onClick?.()}>
                <p className={`text-sm ${todo.isCompleted ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                    {todo.title}
                </p>
                {todo.description && (
                    <p className={`text-xs line-clamp-2 break-words mt-0.5 leading-relaxed ${todo.isCompleted ? 'line-through text-gray-300' : 'text-gray-400'}`}>
                        {todo.description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                {todo.tags && todo.tags.length > 0 && (
                    <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                        title={todo.tags.join(', ')}
                    >
                        <span>{todo.tags[0]}</span>
                        {todo.tags.length > 1 && (
                            <span className="text-[9px] font-bold px-1 py-0.2 bg-indigo-100/90 text-indigo-800 rounded">
                                +{todo.tags.length - 1}
                            </span>
                        )}
                    </span>
                )}
                {todo.priority && todo.priority !== 'low' && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${todo.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                        {todo.priority}
                    </span>
                )}
                
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }} 
                    disabled={isPending} 
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all disabled:cursor-wait"
                    title="Delete task"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
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
