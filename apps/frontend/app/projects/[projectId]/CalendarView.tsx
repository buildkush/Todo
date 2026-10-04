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

    // Group todos by date
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
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm w-full h-full overflow-hidden">
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

                {/* Calendar Grid */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-7 mb-2">
                        {dayNames.map(day => (
                            <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[100px] rounded-xl bg-gray-50/30 border border-transparent" />
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
                                    className={`min-h-[100px] rounded-xl border p-2 flex flex-col transition-all cursor-pointer hover:border-gray-300 hover:shadow-sm
                                        ${isActive ? 'border-rose-400 ring-1 ring-rose-400 bg-rose-50/30' : isToday ? 'border-rose-200 bg-rose-50/10' : 'border-gray-100'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white' : isActive ? 'text-rose-600 bg-rose-100' : 'text-gray-700'}`}>
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

            {/* Date Details Sidebar */}
            {activeDate && (
                <div className="w-80 border-l border-gray-100 bg-gray-50/50 flex flex-col flex-shrink-0 animate-in slide-in-from-right-4 duration-200">
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
        </div>
    );
}
