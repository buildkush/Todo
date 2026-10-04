'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Todo } from '@/lib/api-client';

interface CalendarViewProps {
    project: any;
    todos: Todo[];
    onTodoClick?: (id: string) => void;
}

export default function CalendarView({ project, todos, onTodoClick }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

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

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

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

    return (
        <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm w-full">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">{monthNames[month]} {year}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        Today
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 p-6">
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
                        
                        return (
                            <div key={day} className={`min-h-[100px] rounded-xl border ${isToday ? 'border-rose-200 bg-rose-50/10' : 'border-gray-100'} p-2 flex flex-col transition-all hover:border-gray-300`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white' : 'text-gray-700'}`}>
                                        {day}
                                    </span>
                                    {dayTodos.length > 0 && (
                                        <div className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(dayTodos)}`} title={`${dayTodos.length} tasks`} />
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col gap-1.5 mt-1">
                                    {dayTodos.slice(0, 3).map(todo => (
                                        <div 
                                            key={todo.id}
                                            onClick={() => onTodoClick?.(todo.id)}
                                            className="text-xs truncate bg-gray-50 hover:bg-rose-50 text-gray-700 hover:text-rose-700 px-1.5 py-1 rounded cursor-pointer border border-gray-100 hover:border-rose-200 transition-colors"
                                        >
                                            {todo.title}
                                        </div>
                                    ))}
                                    {dayTodos.length > 3 && (
                                        <div className="text-[10px] font-semibold text-gray-400 pl-1 pt-1">
                                            + {dayTodos.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
