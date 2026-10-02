'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, Circle, ListTodo, MoreHorizontal } from 'lucide-react';
import { Section, Todo } from '@/lib/api-client';
import { ErrorAlert, SuccessAlert } from '@/components/Layout';

interface BoardViewProps {
    project: any;
    todos: Todo[];
    sections: Section[];
    todosLoading: boolean;
    sectionsLoading: boolean;
    updateTodo: (id: string, updates: Partial<Todo>) => Promise<Todo>;
    deleteTodo: (id: string) => Promise<void>;
    moveTodo: (todoId: string, sectionId?: string, boardSectionId?: string, order?: number, targetProjectId?: string) => Promise<Todo>;
    refetchTodos: () => Promise<void>;
    addSection: (name: string) => Promise<Section>;
    reorderSections: (reorderPayload: Array<{ id: string; order: number }>) => Promise<void>;
    openCreateTodoModal: (projectId: string, sectionId?: string) => void;
}

export default function BoardView({
    project,
    todos,
    sections,
    todosLoading,
    sectionsLoading,
    updateTodo,
    deleteTodo,
    moveTodo,
    refetchTodos,
    addSection,
    reorderSections,
    openCreateTodoModal,
}: BoardViewProps) {
    const [showNewSection, setShowNewSection] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Drag State
    const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
    
    // Drop Targets
    const [todoDropTarget, setTodoDropTarget] = useState<{ todoId: string, position: 'before' | 'after' } | null>(null);
    const [sectionDropTarget, setSectionDropTarget] = useState<string | null>(null);
    const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<number | null>(null);

    const stopDragScroll = useCallback(() => {
        if (scrollIntervalRef.current) {
            window.clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    }, []);

    // Drag-scroll effect to scroll when dragging near viewport edges
    useEffect(() => {
        if (!draggedTodoId && !draggedSectionId) {
            stopDragScroll();
            return;
        }

        const handleGlobalDragOver = (e: DragEvent) => {
            if (!scrollContainerRef.current) return;
            const container = scrollContainerRef.current;
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX;

            const scrollSpeed = 12; // Speed of continuous scroll
            const threshold = 100;  // Threshold distance from edges (pixels)

            const leftDist = mouseX - rect.left;
            const rightDist = rect.right - mouseX;

            if (leftDist > 0 && leftDist < threshold) {
                if (!scrollIntervalRef.current) {
                    scrollIntervalRef.current = window.setInterval(() => {
                        container.scrollLeft -= scrollSpeed;
                    }, 16);
                }
            } else if (rightDist > 0 && rightDist < threshold) {
                if (!scrollIntervalRef.current) {
                    scrollIntervalRef.current = window.setInterval(() => {
                        container.scrollLeft += scrollSpeed;
                    }, 16);
                }
            } else {
                if (scrollIntervalRef.current) {
                    window.clearInterval(scrollIntervalRef.current);
                    scrollIntervalRef.current = null;
                }
            }
        };

        window.addEventListener('dragover', handleGlobalDragOver);
        window.addEventListener('dragend', stopDragScroll);
        window.addEventListener('drop', stopDragScroll);

        return () => {
            window.removeEventListener('dragover', handleGlobalDragOver);
            window.removeEventListener('dragend', stopDragScroll);
            window.removeEventListener('drop', stopDragScroll);
            stopDragScroll();
        };
    }, [draggedTodoId, draggedSectionId, stopDragScroll]);

    // Cleanup state
    useEffect(() => {
        const cleanDragState = () => {
            setDraggedTodoId(null);
            setDraggedSectionId(null);
            setTodoDropTarget(null);
            setSectionDropTarget(null);
            setDragOverSectionId(null);
        };
        window.addEventListener('dragend', cleanDragState);
        window.addEventListener('drop', cleanDragState);
        return () => {
            window.removeEventListener('dragend', cleanDragState);
            window.removeEventListener('drop', cleanDragState);
        };
    }, []);

    const rootTodos = todos.filter(t => !t.parentTodoId);
    const hasUnsectionedTodos = rootTodos.some(t => !t.sectionId);
    
    const getSubtaskCount = (todoId: string) => {
        const subtasks = todos.filter(t => t.parentTodoId === todoId);
        const completed = subtasks.filter(t => t.isCompleted).length;
        return { total: subtasks.length, completed };
    };

    const handleAddSection = async (name: string) => {
        try {
            await addSection(name);
            setShowNewSection(false);
            setSuccessMessage('Column added');
            setTimeout(() => setSuccessMessage(null), 1500);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to add column');
        }
    };

    // --- Drag and Drop Handlers ---
    
    // Task Dragging
    const handleTodoDragStart = (e: React.DragEvent, todoId: string) => {
        e.stopPropagation();
        setDraggedTodoId(todoId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', todoId);
        setTimeout(() => {
            if (e.target instanceof HTMLElement) {
                e.target.style.opacity = '0.4';
            }
        }, 0);
    };

    const handleTodoDragOver = (e: React.DragEvent, targetTodoId: string, sectionId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedTodoId || draggedTodoId === targetTodoId) return;

        setDragOverSectionId(sectionId);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const position = y < rect.height / 2 ? 'before' : 'after';

        setTodoDropTarget({ todoId: targetTodoId, position });
    };

    const handleSectionDragOver = (e: React.DragEvent, sectionId: string | null) => {
        e.preventDefault();
        if (draggedTodoId) {
            setDragOverSectionId(sectionId);
            if ((e.target as HTMLElement).closest('.todo-card')) return;
            setTodoDropTarget(null);
        } else if (draggedSectionId && draggedSectionId !== sectionId) {
            setSectionDropTarget(sectionId);
        }
    };

    const handleTodoDrop = async (e: React.DragEvent, targetSectionId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!draggedTodoId) return;

        let newOrder: number | undefined;
        let newSectionId = targetSectionId;

        if (todoDropTarget) {
            const targetTodo = rootTodos.find(t => t.id === todoDropTarget.todoId);
            if (targetTodo) {
                newSectionId = targetTodo.sectionId || null;
                const sectionTodos = rootTodos
                    .filter(t => (t.sectionId || null) === newSectionId)
                    .sort((a, b) => a.order - b.order);
                
                const targetIndex = sectionTodos.findIndex(t => t.id === targetTodo.id);
                if (todoDropTarget.position === 'before') {
                    newOrder = targetIndex === 0 ? targetTodo.order / 2 : (sectionTodos[targetIndex - 1].order + targetTodo.order) / 2;
                } else {
                    newOrder = targetIndex === sectionTodos.length - 1 ? targetTodo.order + 100 : (targetTodo.order + sectionTodos[targetIndex + 1].order) / 2;
                }
            }
        }

        try {
            const sectionIdParam = newSectionId === null ? 'unsectioned' : newSectionId;
            await moveTodo(draggedTodoId, sectionIdParam, undefined, newOrder);
            await refetchTodos();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to move task');
        }
    };

    // Section Dragging
    const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
        setDraggedSectionId(sectionId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            if (e.target instanceof HTMLElement) {
                e.target.style.opacity = '0.4';
            }
        }, 0);
    };

    const handleSectionDrop = async (e: React.DragEvent, targetSectionId: string | null) => {
        e.preventDefault();
        if (!draggedSectionId || draggedSectionId === targetSectionId || !targetSectionId) return;

        const currentSections = [...sections];
        const draggedIndex = currentSections.findIndex(s => s.id === draggedSectionId);
        const targetIndex = currentSections.findIndex(s => s.id === targetSectionId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;

        const updatedSections = [...currentSections];
        const [moved] = updatedSections.splice(draggedIndex, 1);
        updatedSections.splice(targetIndex, 0, moved);

        const reorderPayload = updatedSections.map((s, index) => ({
            id: s.id,
            order: (index + 1) * 100
        }));

        try {
            await reorderSections(reorderPayload);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to reorder sections');
        }
    };

    const renderPlaceholderCard = (todoId: string | null) => {
        const draggedTodo = todos.find(t => t.id === todoId);
        return (
            <div className="border border-dashed border-rose-350 bg-rose-50/10 rounded-xl p-4 opacity-50 select-none my-1 pointer-events-none">
                {draggedTodo ? (
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 animate-pulse" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight text-gray-800 truncate">{draggedTodo.title}</p>
                            {draggedTodo.description && (
                                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed font-normal">{draggedTodo.description}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-[72px]" />
                )}
            </div>
        );
    };

    const renderColumn = (sectionId: string | null, name: string) => {
        const columnTodos = rootTodos
            .filter(t => (t.sectionId || null) === sectionId)
            .sort((a, b) => a.order - b.order);

        return (
            <div 
                key={sectionId || 'unsectioned'}
                onDragOver={(e) => handleSectionDragOver(e, sectionId)}
                onDrop={(e) => draggedTodoId ? handleTodoDrop(e, sectionId) : handleSectionDrop(e, sectionId)}
                className="flex flex-col w-[280px] flex-shrink-0 transition-all max-h-full h-full pb-6"
            >
                {/* Column Header */}
                <div 
                    draggable={!!sectionId}
                    onDragStart={(e) => sectionId && handleSectionDragStart(e, sectionId)}
                    className={`flex items-center justify-between py-2 mb-2 select-none ${sectionId ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 text-sm capitalize">{name}</span>
                        <span className="text-gray-400 text-xs font-normal">
                            {columnTodos.length}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => openCreateTodoModal(project.id, sectionId || undefined)}
                            className="p-1 text-gray-400 hover:text-rose-500 rounded transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto py-2 space-y-3 min-h-[300px]">
                    {columnTodos.map(todo => {
                        const { total, completed } = getSubtaskCount(todo.id);
                        const isDropTarget = todoDropTarget?.todoId === todo.id;
                        const isDragging = draggedTodoId === todo.id;

                        return (
                            <div key={todo.id} className="relative todo-card">
                                {isDropTarget && todoDropTarget.position === 'before' && renderPlaceholderCard(draggedTodoId)}
                                
                                <div
                                    draggable
                                    onDragStart={(e) => handleTodoDragStart(e, todo.id)}
                                    onDragEnd={(e) => {
                                        if (e.currentTarget instanceof HTMLElement) {
                                            e.currentTarget.style.opacity = '';
                                        }
                                        setDraggedTodoId(null);
                                        setTodoDropTarget(null);
                                    }}
                                    onDragOver={(e) => handleTodoDragOver(e, todo.id, sectionId)}
                                    className={`p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing select-none group ${isDragging ? 'opacity-30' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateTodo(todo.id, { isCompleted: !todo.isCompleted });
                                            }}
                                            className={`mt-0.5 flex-shrink-0 transition-colors ${todo.isCompleted ? 'text-green-500' : 'text-gray-350 hover:text-green-500'}`}
                                        >
                                            {todo.isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold leading-tight ${todo.isCompleted ? 'line-through text-gray-400 font-normal' : 'text-gray-800'}`}>
                                                {todo.title}
                                            </p>
                                            {todo.description && (
                                                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed font-normal">{todo.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {total > 0 && (
                                        <div className="flex items-center gap-1.5 mt-3 pt-2 text-gray-450 border-t border-gray-50 text-[10px] font-medium">
                                            <ListTodo className="w-3.5 h-3.5 text-gray-400" />
                                            <span>
                                                {completed}/{total}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {isDropTarget && todoDropTarget.position === 'after' && renderPlaceholderCard(draggedTodoId)}
                            </div>
                        );
                    })}

                    {/* Empty list / bottom placeholder */}
                    {dragOverSectionId === sectionId && draggedTodoId && !todoDropTarget && renderPlaceholderCard(draggedTodoId)}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-white">
            {/* Messages */}
            <div className="flex-shrink-0 mb-4">
                {formError && <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />}
                {successMessage && <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />}
            </div>

            {/* Board Horizontal Scroll Area */}
            <div 
                className="flex-1 overflow-x-auto overflow-y-hidden pb-4" 
                ref={scrollContainerRef}
                style={{ scrollbarWidth: 'thin' }}
            >
                <div className="flex gap-8 h-full items-start px-1">
                    {/* General/Unsectioned Column: Only render if there are tasks with sectionId == null */}
                    {hasUnsectionedTodos && renderColumn(null, "No section")}

                    {/* Sectioned Columns */}
                    {sections.map(section => renderColumn(section.id, section.name))}

                    {/* Add Column Button */}
                    <div className="flex-shrink-0 w-[200px] pt-1 animate-in fade-in duration-200">
                        {!showNewSection ? (
                            <button
                                onClick={() => setShowNewSection(true)}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-650 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Section
                            </button>
                        ) : (
                            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        const input = (e.currentTarget.elements.namedItem('sectionName') as HTMLInputElement);
                                        if (input.value.trim()) {
                                            handleAddSection(input.value.trim());
                                            input.value = '';
                                        }
                                    }}
                                    className="space-y-3"
                                >
                                    <input
                                        name="sectionName"
                                        type="text"
                                        placeholder="Section name..."
                                        required
                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-rose-350 focus:ring-2 focus:ring-rose-50 text-xs placeholder-gray-400"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 py-1 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-semibold transition-colors"
                                        >
                                            Add
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewSection(false)}
                                            className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-semibold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
