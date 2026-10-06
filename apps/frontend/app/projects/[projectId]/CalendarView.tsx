'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { Todo } from '@/lib/api-client';

interface CalendarViewProps {
    project: any;
    todos: Todo[];
    onTodoClick?: (id: string) => void;
}

export default function CalendarView({ project, todos, onTodoClick }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeDate, setActiveDate] = useState<number | null>(null);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
        setActiveDate(null);
    };
    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
        setActiveDate(null);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Group todos by date (todos are already filtered by the main search bar)
    const todosByDate: Record<number, Todo[]> = {};
    todos.forEach(todo => {
        if (todo.dueDate) {
            const date = new Date(todo.dueDate);
            if (date.getFullYear() === year && date.getMonth() === month) {
                const day = date.getDate();
                if (!todosByDate[day]) todosByDate[day] = [];
                todosByDate[day].push(todo);
            }
        }
    });

    const getPriorityColor = (todos: Todo[]) => {
        if (todos.some(t => t.priority === 'high')) return 'bg-rose-500';
        if (todos.some(t => t.priority === 'medium')) return 'bg-orange-400';
        return 'bg-blue-400';
    };

    const activeDayTodos = activeDate ? (todosByDate[activeDate] || []) : [];

    return (
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm w-full min-h-[500px]">
            <div className="flex-1 flex flex-col min-w-0">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">{monthNames[month]} {year}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => { setCurrentDate(new Date()); setActiveDate(new Date().getDate()); }} className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="flex-1 p-3 sm:p-6 flex flex-col overflow-x-auto">
                    <div className="min-w-[600px] flex flex-col flex-1">
                        <div className="grid grid-cols-7 mb-2">
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2 sm:gap-3 flex-1 auto-rows-[minmax(90px,1fr)]">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[90px] rounded-xl bg-gray-50/30 border border-transparent" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dayTodos = todosByDate[day] || [];
                                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                                const isActive = activeDate === day;
                                
                                return (
                                    <div 
                                        key={day} 
                                        onClick={() => setActiveDate(day)}
                                        className={`min-h-[90px] rounded-xl border p-2 flex flex-col transition-all cursor-pointer hover:border-gray-300 hover:shadow-sm bg-white
                                            ${isActive ? 'border-rose-400 ring-1 ring-rose-400 bg-rose-50/30' : isToday ? 'border-rose-200 bg-rose-50/10' : 'border-gray-100'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white' : isActive ? 'text-rose-600 bg-rose-100' : 'text-gray-700'}`}>
                                                {day}
                                            </span>
                                        </div>
                                        <div className="flex-1 flex flex-wrap content-start gap-1 mt-1">
                                            {dayTodos.map(todo => (
                                                <div 
                                                    key={todo.id} 
                                                    className={`w-2 h-2 rounded-full ${
                                                        todo.priority === 'high' ? 'bg-rose-500' : 
                                                        todo.priority === 'medium' ? 'bg-orange-400' : 'bg-blue-400'
                                                    }`}
                                                    title={todo.title}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Date Details Sidebar (>= md) */}
            {activeDate && (
                <div className="hidden md:flex w-80 border-l border-gray-100 bg-gray-50/50 flex-col flex-shrink-0 animate-in slide-in-from-right-4 duration-200">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-rose-500" />
                            <h3 className="font-bold text-gray-900">
                                {monthNames[month]} {activeDate}
                            </h3>
                        </div>
                        <button 
                            onClick={() => setActiveDate(null)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeDayTodos.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No tasks scheduled for this day
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeDayTodos.map(todo => (
                                    <div 
                                        key={todo.id}
                                        onClick={() => onTodoClick?.(todo.id)}
                                        className="bg-white border border-gray-100 p-3 rounded-xl cursor-pointer hover:border-rose-200 hover:shadow-sm transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={`text-sm font-semibold truncate flex-1 ${todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-rose-600'}`}>
                                                {todo.title}
                                            </span>
                                        </div>
                                        {todo.priority && todo.priority !== 'low' && (
                                            <span className={`inline-block mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${todo.priority === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'}`}>
                                                {todo.priority.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Full-Screen Date Details Modal (< md) */}
            {activeDate && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:hidden animate-in fade-in duration-150">
                    <div className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg rounded-none sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                                    <CalendarIcon className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 leading-tight">
                                        {monthNames[month]} {activeDate}, {year}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {activeDayTodos.length} {activeDayTodos.length === 1 ? 'task' : 'tasks'} scheduled
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActiveDate(null)}
                                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors shrink-0"
                                title="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                            {activeDayTodos.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                        <CalendarIcon className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">No tasks scheduled</p>
                                    <p className="text-xs text-gray-400 mt-1">Enjoy your free day!</p>
                                </div>
                            ) : (
                                activeDayTodos.map(todo => (
                                    <div 
                                        key={todo.id}
                                        onClick={() => {
                                            setActiveDate(null);
                                            onTodoClick?.(todo.id);
                                        }}
                                        className="bg-white border border-gray-200 p-3.5 rounded-xl cursor-pointer hover:border-rose-300 hover:shadow-sm transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={`text-sm font-semibold leading-snug ${todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-800 group-hover:text-rose-600'}`}>
                                                {todo.title}
                                            </span>
                                        </div>
                                        {todo.description && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{todo.description}</p>
                                        )}
                                        {todo.priority && todo.priority !== 'low' && (
                                            <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md ${todo.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-200/60' : 'bg-amber-50 text-amber-600 border border-amber-200/60'}`}>
                                                {todo.priority.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
