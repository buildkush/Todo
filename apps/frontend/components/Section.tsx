'use client';

import { Section, BoardSection, Todo } from '@/lib/api-client';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface SectionHeaderProps {
    section: Section;
    todoCount: number;
    isCollapsed: boolean;
    onToggleCollapse: (id: string) => void;
    onDelete: (id: string) => void;
}

export function SectionHeader({
    section,
    todoCount,
    isCollapsed,
    onToggleCollapse,
    onDelete,
}: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center gap-3 flex-1">
                <button
                    onClick={() => onToggleCollapse(section.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-600"
                >
                    {isCollapsed ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>

                {section.color && (
                    <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: section.color }}
                    />
                )}

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{section.name}</h3>
                    {section.description && (
                        <p className="text-xs text-gray-600 truncate">{section.description}</p>
                    )}
                </div>

                <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                    {todoCount}
                </span>
            </div>

            <button
                onClick={() => onDelete(section.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors ml-2"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

interface BoardColumnProps {
    boardSection: BoardSection;
    todos: Todo[];
    onAddTodo: (title: string) => void;
    onUpdateTodo: (todo: Partial<Todo>) => void;
    onDeleteTodo: (id: string) => void;
    onMoveTodo?: (todoId: string, boardSectionId?: string, order?: number) => void;
    isLoading?: boolean;
}

interface DraggableTodoCardProps {
    todo: Todo;
    onUpdateTodo: (todo: Partial<Todo>) => void;
    onDeleteTodo: (id: string) => void;
}

export function DraggableTodoCard({ todo, onUpdateTodo, onDeleteTodo }: DraggableTodoCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: todo.id,
    });

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: 1,
        cursor: 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-rose-100 transition-all cursor-grab active:cursor-grabbing select-none"
        >
            <p className={`text-sm ${todo.isCompleted ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                {todo.title}
            </p>
            {todo.description && (
                <p className="text-xs text-gray-400 mt-1">{todo.description}</p>
            )}
            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onDeleteTodo(todo.id)}
                    className="text-[10px] font-semibold px-2 py-0.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50/30 rounded transition-colors"
                >
                    Delete
                </button>
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onUpdateTodo({ ...todo, isCompleted: !todo.isCompleted })}
                    className="text-[10px] font-semibold px-2 py-0.5 text-rose-500 hover:bg-rose-50 rounded transition-colors ml-auto"
                >
                    {todo.isCompleted ? 'Reopen' : 'Complete'}
                </button>
            </div>
        </div>
    );
}

export function BoardColumn({
    boardSection,
    todos,
    onAddTodo,
    onUpdateTodo,
    onDeleteTodo,
    onMoveTodo,
    isLoading,
}: BoardColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: boardSection.id,
    });

    return (
        <div 
            ref={setNodeRef}
            className={`flex flex-col bg-gray-50 rounded-xl border min-h-96 w-80 flex-shrink-0 transition-all ${
                isOver ? 'border-rose-300 bg-rose-50/20 shadow-inner' : 'border-gray-200/60'
            }`}
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    {boardSection.color && (
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: boardSection.color }}
                        />
                    )}
                    <h3 className="font-semibold text-gray-900 text-xs">{boardSection.name}</h3>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full">
                        {todos.length}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {todos.map(todo => (
                    <DraggableTodoCard
                        key={todo.id}
                        todo={todo}
                        onUpdateTodo={onUpdateTodo}
                        onDeleteTodo={onDeleteTodo}
                    />
                ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-white rounded-b-xl">
                <button
                    onClick={() => {
                        const title = prompt('Enter todo title:');
                        if (title) onAddTodo(title);
                    }}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-xs font-semibold text-gray-500 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    + Add Todo
                </button>
            </div>
        </div>
    );
}
