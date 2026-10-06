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
    addSection: (name: string) => Promise<Section>;
    updateSection?: (sectionId: string, updates: Partial<Section>) => Promise<Section>;
    deleteSection?: (sectionId: string) => Promise<void>;
    reorderSections: (reorderPayload: Array<{ id: string; order: number }>) => Promise<void>;
    openCreateTodoModal: (projectId: string, sectionId?: string) => void;
    onTodoClick?: (id: string) => void;
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
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    openCreateTodoModal,
    onTodoClick,
}: BoardViewProps) {
    const [showNewSection, setShowNewSection] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Section Edit & Options State
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const [sectionDropdownId, setSectionDropdownId] = useState<string | null>(null);

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

    const todoIds = new Set(todos.map(todo => todo.id));
    const rootTodos = todos.filter(todo => !todo.parentTodoId || !todoIds.has(todo.parentTodoId));
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

    const handleEditSection = async (sectionId: string) => {
        if (!editingSectionName.trim() || !updateSection) { setEditingSectionId(null); return; }
        try {
            await updateSection(sectionId, { name: editingSectionName });
            setEditingSectionId(null);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to update section');
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        if (!deleteSection) return;
        if (confirm('Are you sure you want to delete this section and all its tasks?')) {
            try {
                await deleteSection(sectionId);
            } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Failed to delete section');
            }
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
        
        const activeDraggedId = draggedTodoId;
        const activeDropTarget = todoDropTarget;
        
        setDraggedTodoId(null);
        setDraggedSectionId(null);
        setTodoDropTarget(null);
        setSectionDropTarget(null);
        setDragOverSectionId(null);

        if (!activeDraggedId) return;

        let newOrder: number | undefined;
        let newSectionId = targetSectionId;

        if (activeDropTarget) {
            const targetTodo = rootTodos.find(t => t.id === activeDropTarget.todoId);
            if (targetTodo) {
                newSectionId = targetTodo.sectionId || null;
                const sectionTodos = rootTodos
                    .filter(t => (t.sectionId || null) === newSectionId)
                    .sort((a, b) => a.order - b.order);
                
                const targetIndex = sectionTodos.findIndex(t => t.id === targetTodo.id);
                if (activeDropTarget.position === 'before') {
                    newOrder = Math.round(targetIndex === 0 ? targetTodo.order / 2 : (sectionTodos[targetIndex - 1].order + targetTodo.order) / 2);
                } else {
                    newOrder = Math.round(targetIndex === sectionTodos.length - 1 ? targetTodo.order + 100 : (targetTodo.order + sectionTodos[targetIndex + 1].order) / 2);
                }
            }
        }

        try {
            const sectionIdParam = newSectionId === null ? 'unsectioned' : newSectionId;
            await moveTodo(activeDraggedId, sectionIdParam, undefined, newOrder);
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
        
        const activeDraggedSectionId = draggedSectionId;
        
        setDraggedTodoId(null);
        setDraggedSectionId(null);
        setTodoDropTarget(null);
        setSectionDropTarget(null);
        setDragOverSectionId(null);

        if (!activeDraggedSectionId || activeDraggedSectionId === targetSectionId || !targetSectionId) return;

        const currentSections = [...sections];
        const draggedIndex = currentSections.findIndex(s => s.id === activeDraggedSectionId);
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
                className="flex flex-col w-[290px] min-w-[290px] flex-shrink-0 transition-all h-full min-h-[300px] bg-gray-50/60 border border-gray-100/80 rounded-2xl p-3"
            >
                {/* Column Header */}
                <div 
                    draggable={!!sectionId && editingSectionId !== sectionId}
                    onDragStart={(e) => sectionId && handleSectionDragStart(e, sectionId)}
                    className={`flex items-center justify-between py-2 mb-2 select-none ${sectionId && editingSectionId !== sectionId ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                        {editingSectionId === sectionId ? (
                            <input
                                type="text"
                                value={editingSectionName}
                                onChange={e => setEditingSectionName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleEditSection(sectionId as string);
                                    if (e.key === 'Escape') setEditingSectionId(null);
                                }}
                                onBlur={() => setEditingSectionId(null)}
                                autoFocus
                                className="w-full bg-white border border-gray-200 rounded px-1.5 py-0.5 text-sm font-bold focus:outline-none focus:border-rose-300"
                            />
                        ) : (
                            <span 
                                onDoubleClick={() => {
                                    if (sectionId) {
                                        setEditingSectionName(name);
                                        setEditingSectionId(sectionId);
                                    }
                                }}
                                className="font-bold text-gray-900 text-sm capitalize truncate cursor-text hover:bg-gray-50 rounded px-1 transition-colors -ml-1"
                                title={sectionId ? "Double click to edit" : ""}
                            >
                                {name}
                            </span>
                        )}
                        <span className="text-gray-400 text-xs font-normal">
                            {columnTodos.length}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button 
                            onClick={() => openCreateTodoModal(project.id, sectionId || undefined)}
                            className="p-1 text-gray-400 hover:text-rose-500 rounded transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        {sectionId && (
                            <div className="relative">
                                <button 
                                    onClick={() => setSectionDropdownId(sectionDropdownId === sectionId ? null : sectionId)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                                >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                                {sectionDropdownId === sectionId && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setSectionDropdownId(null)} />
                                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                            <button
                                                onClick={() => {
                                                    setEditingSectionId(sectionId);
                                                    setEditingSectionName(name);
                                                    setSectionDropdownId(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                                            >
                                                Edit section
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSectionDropdownId(null);
                                                    handleDeleteSection(sectionId);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                                            >
                                                Delete section
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto py-2 space-y-3 min-h-[300px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {columnTodos.map(todo => {
                        const { total, completed } = getSubtaskCount(todo.id);
                        const isDropTarget = todoDropTarget?.todoId === todo.id;
                        const isDragging = draggedTodoId === todo.id;
                        const isPending = todo.id.startsWith('optimistic-todo-');

                        return (
                            <div key={todo.id} className="relative todo-card">
                                {isDropTarget && todoDropTarget.position === 'before' && renderPlaceholderCard(draggedTodoId)}
                                
                                <div
                                    draggable={!isPending}
                                    onClick={() => onTodoClick?.(todo.id)}
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
                                            disabled={isPending}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateTodo(todo.id, { isCompleted: !todo.isCompleted }).catch(err => {
                                                    setFormError(err instanceof Error ? err.message : 'Failed to update task');
                                                });
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
                                            {todo.tags && todo.tags.length > 0 && (
                                                <div className="flex items-center gap-1 mt-2">
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
                                                </div>
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
            {formError || successMessage ? (
                <div className="flex-shrink-0 mb-4">
                    {formError && <ErrorAlert message={formError} onDismiss={() => setFormError(null)} />}
                    {successMessage && <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />}
                </div>
            ) : null}

            {/* Board Horizontal Scroll Area */}
            <div 
                className="flex-1 flex flex-col min-h-0 overflow-x-auto pb-2" 
                ref={scrollContainerRef}
                style={{ scrollbarWidth: 'thin' }}
            >
                <div className="flex gap-6 flex-1 min-h-0 items-start justify-start px-1 w-full">
                    {/* General/Unsectioned Column: Only render if there are tasks with sectionId == null */}
                    {hasUnsectionedTodos && renderColumn(null, "No section")}

                    {/* Sectioned Columns */}
                    {sections.map(section => renderColumn(section.id, section.name))}

                    {/* Add Column Button */}
                    <div className="flex-shrink-0 w-[200px] pt-1 animate-in fade-in duration-200 self-start text-left">
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
