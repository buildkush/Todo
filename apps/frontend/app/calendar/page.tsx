'use client';

import { useState, useEffect } from 'react';
import { Layout, LoadingSpinner, ErrorAlert } from '@/components/Layout';
import { apiClient, Todo } from '@/lib/api-client';
import { useProjects } from '@/hooks/useProjectsHook';
import { useApp } from '@/context/AppContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, PanelLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProjectSearchInput } from '@/components/ProjectSearchInput';
import { ProjectFilterPopover, FilterState, DEFAULT_FILTER_STATE } from '@/components/ProjectFilterPopover';
import { filterTodosBySearch, filterTodosByCriteria } from '@/lib/todo-sort';

export default function GlobalCalendarPage() {
    const { projects, loading: projectsLoading } = useProjects();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loadingTodos, setLoadingTodos] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeDate, setActiveDate] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);
    const { isSidebarCollapsed, toggleSidebar } = useApp();
    const router = useRouter();

    useEffect(() => {
        const fetchAllTodos = async () => {
            try {
                setLoadingTodos(true);
                // We'll fetch the inbox todos and project todos.
                // Currently apiClient.getTodos(projectId) requires a projectId.
                // If there's no endpoint to get ALL todos, we have to fetch them per project.
                // The inbox is effectively projectId = undefined or unassigned.
                // However, our backend might support getting all todos if projectId is not provided?
                // Let's assume we can fetch them per project since we have the projects list.
                
                // Fetch inbox
                const inboxRes = await apiClient.getTodos('none').catch(() => null);
                const inboxTodos = inboxRes?.data || [];
                
                // Fetch for each project
                const projectTodosPromises = projects.map(p => apiClient.getTodos(p.id).catch(() => null));
                const allProjectRes = await Promise.all(projectTodosPromises);
                const allProjectTodos = allProjectRes.map(res => res?.data || []);
                
                setTodos([...inboxTodos, ...allProjectTodos.flat()]);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load tasks');
            } finally {
                setLoadingTodos(false);
            }
        };

        if (!projectsLoading) {
            fetchAllTodos();
        }
    }, [projects, projectsLoading]);

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

    const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setActiveDate(null); };
    const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setActiveDate(null); };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Filter todos by search query & criteria, then group by date
    const filteredTodos = filterTodosByCriteria(todos, searchQuery, filterState);
    const todosByDate: Record<number, Todo[]> = {};
    filteredTodos.forEach(todo => {
        if (todo.dueDate) {
            const date = new Date(todo.dueDate);
            if (date.getFullYear() === year && date.getMonth() === month) {
                const day = date.getDate();
                if (!todosByDate[day]) todosByDate[day] = [];
                todosByDate[day].push(todo);
            }
        }
    });

    const getProjectColorClass = (projectId: string | undefined | null) => {
        if (!projectId || projectId === 'inbox') return 'bg-gray-400';
        const project = projects.find(p => p.id === projectId);
        if (!project || !project.color) return 'bg-rose-400';
        // Map hex to safe tailwind background or just use style
        return project.color;
    };

    const renderTodoItem = (todo: Todo) => {
        const color = getProjectColorClass(todo.projectId);
        const isHex = color.startsWith('#');
        const style = isHex ? { backgroundColor: color } : {};
        const className = `text-xs truncate text-white px-2 py-1 rounded cursor-pointer shadow-sm hover:opacity-90 transition-opacity ${!isHex ? color : ''}`;
        
        return (
            <div 
                key={todo.id}
                onClick={() => {
                    if (todo.projectId && todo.projectId !== 'inbox') {
                        router.push(`/projects/${todo.projectId}`);
                    } else {
                        router.push(`/`);
                    }
                }}
                className={className}
                style={style}
                title={todo.title}
            >
                {todo.title}
            </div>
        );
    };

    return (
        <Layout>
            <div className="flex w-full flex-1 min-h-0 relative bg-white overflow-hidden h-full flex-col">
                {/* Header (Static Top Header Bar) */}
                <div className="w-full shrink-0 bg-white z-10 border-b border-gray-100">
                    <div className="w-full max-w-7xl mx-auto px-6 md:px-8 h-14 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {isSidebarCollapsed && (
                                <button
                                    onClick={toggleSidebar}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                    title="Open sidebar"
                                >
                                    <PanelLeft className="w-4 h-4" />
                                </button>
                            )}
                            <h1 className="text-lg font-bold text-gray-900">Calendar</h1>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <ProjectSearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search calendar tasks..." />
                            <ProjectFilterPopover todos={todos} filterState={filterState} onFilterChange={setFilterState} projects={projects} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
                    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 flex-1 flex flex-col min-h-0">
                        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

                {loadingTodos || projectsLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="flex bg-white rounded-2xl border border-gray-100 shadow-xl w-full flex-1 mb-8">
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                                <h2 className="text-xl font-bold text-gray-900">{monthNames[month]} {year}</h2>
                                <div className="flex items-center gap-2">
                                    <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 border border-transparent hover:border-gray-200">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => { setCurrentDate(new Date()); setActiveDate(new Date().getDate()); }} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white shadow-sm border border-gray-200 hover:border-rose-300 rounded-lg transition-all hover:text-rose-600">
                                        Today
                                    </button>
                                    <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600 border border-transparent hover:border-gray-200">
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
                                                    className={`min-h-[90px] rounded-xl border p-2 flex flex-col transition-all cursor-pointer hover:border-gray-300 hover:shadow-md bg-white
                                                        ${isActive ? 'border-rose-400 ring-1 ring-rose-400 bg-rose-50/30' : isToday ? 'border-rose-200 bg-rose-50/10 shadow-sm' : 'border-gray-100'}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : isActive ? 'text-rose-600 bg-rose-100' : 'text-gray-700'}`}>
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
                                    {(todosByDate[activeDate] || []).length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm">
                                            No tasks scheduled for this day
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {(todosByDate[activeDate] || []).map(todo => (
                                                <div 
                                                    key={todo.id}
                                                    onClick={() => {
                                                        if (todo.projectId && todo.projectId !== 'inbox') {
                                                            router.push(`/projects/${todo.projectId}`);
                                                        } else {
                                                            router.push(`/`);
                                                        }
                                                    }}
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
                                                    {(todosByDate[activeDate] || []).length} {(todosByDate[activeDate] || []).length === 1 ? 'task' : 'tasks'} scheduled
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
                                        {(todosByDate[activeDate] || []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                                    <CalendarIcon className="w-6 h-6 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700">No tasks scheduled</p>
                                                <p className="text-xs text-gray-400 mt-1">Enjoy your free day!</p>
                                            </div>
                                        ) : (
                                            (todosByDate[activeDate] || []).map(todo => (
                                                <div 
                                                    key={todo.id}
                                                    onClick={() => {
                                                        setActiveDate(null);
                                                        if (todo.projectId && todo.projectId !== 'inbox') {
                                                            router.push(`/projects/${todo.projectId}`);
                                                        } else {
                                                            router.push(`/`);
                                                        }
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
                )}
            </div>
        </div>
    </div>
</Layout>
    );
}
