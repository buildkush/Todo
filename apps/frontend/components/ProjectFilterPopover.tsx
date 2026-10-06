'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, X, Calendar as CalendarIcon, Tag as TagIcon, AlertCircle, RefreshCw, Folder } from 'lucide-react';
import { Todo } from '@/lib/api-client';

export interface FilterState {
    tags: string[];
    priorities: ('high' | 'medium' | 'low')[];
    datePreset: 'all' | 'today' | 'tomorrow' | 'this_week' | 'next_7_days' | 'overdue' | 'custom';
    startDate?: string | null;
    endDate?: string | null;
    projectIds?: string[];
}

export const DEFAULT_FILTER_STATE: FilterState = {
    tags: [],
    priorities: [],
    datePreset: 'all',
    startDate: null,
    endDate: null,
    projectIds: [],
};

interface ProjectFilterPopoverProps {
    todos: Todo[];
    filterState: FilterState;
    onFilterChange: (newState: FilterState) => void;
    projects?: { id: string; name: string; color?: string }[];
}

export function ProjectFilterPopover({ todos, filterState, onFilterChange, projects }: ProjectFilterPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Extract all unique available tags from current todos
    const availableTags = Array.from(new Set(todos.flatMap((t) => t.tags || []))).filter(Boolean);

    // Count active filters
    const activeCount =
        filterState.tags.length +
        filterState.priorities.length +
        (filterState.projectIds?.length || 0) +
        (filterState.datePreset !== 'all' ? 1 : 0);

    const togglePriority = (p: 'high' | 'medium' | 'low') => {
        const current = filterState.priorities;
        const updated = current.includes(p) ? current.filter((item) => item !== p) : [...current, p];
        onFilterChange({ ...filterState, priorities: updated });
    };

    const toggleTag = (tag: string) => {
        const current = filterState.tags;
        const updated = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
        onFilterChange({ ...filterState, tags: updated });
    };

    const toggleProject = (projectId: string) => {
        const current = filterState.projectIds || [];
        const updated = current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId];
        onFilterChange({ ...filterState, projectIds: updated });
    };

    const setDatePreset = (preset: FilterState['datePreset']) => {
        onFilterChange({
            ...filterState,
            datePreset: preset,
            ...(preset !== 'custom' ? { startDate: null, endDate: null } : {}),
        });
    };

    const handleClearAll = () => {
        onFilterChange(DEFAULT_FILTER_STATE);
    };

    return (
        <div className="relative inline-block text-left" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    activeCount > 0
                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100/70'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
                title="Filter tasks"
            >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden md:inline">Filter</span>
                {activeCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {activeCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in duration-150 text-xs space-y-4 select-none">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                            <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                            Filter Tasks
                        </div>
                        {activeCount > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                            >
                                <RefreshCw className="w-3 h-3" /> Clear all
                            </button>
                        )}
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            <AlertCircle className="w-3.5 h-3.5" /> Priority
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { id: 'high', label: 'High', color: 'bg-rose-50 text-rose-600 border-rose-200' },
                                { id: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                                { id: 'low', label: 'Low', color: 'bg-gray-50 text-gray-700 border-gray-200' },
                            ].map((p) => {
                                const selected = filterState.priorities.includes(p.id as any);
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => togglePriority(p.id as any)}
                                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                                            selected
                                                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                                                : `${p.color} hover:bg-gray-100`
                                        }`}
                                    >
                                        {selected && <Check className="w-3 h-3" />}
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range Presets */}
                    <div>
                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            <CalendarIcon className="w-3.5 h-3.5" /> Due Date Range
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { id: 'all', label: 'All Dates' },
                                { id: 'today', label: 'Today' },
                                { id: 'tomorrow', label: 'Tomorrow' },
                                { id: 'this_week', label: 'This Week' },
                                { id: 'next_7_days', label: 'Next 7 Days' },
                                { id: 'overdue', label: 'Overdue' },
                                { id: 'custom', label: 'Custom Range' },
                            ].map((preset) => {
                                const isSelected = filterState.datePreset === preset.id;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setDatePreset(preset.id as any)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                                            isSelected
                                                ? 'bg-rose-500 text-white border-rose-500 font-semibold'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Date Pickers */}
                        {filterState.datePreset === 'custom' && (
                            <div className="mt-2.5 grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in duration-100">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From</label>
                                    <input
                                        type="date"
                                        value={filterState.startDate || ''}
                                        onChange={(e) =>
                                            onFilterChange({ ...filterState, startDate: e.target.value || null })
                                        }
                                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-rose-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To</label>
                                    <input
                                        type="date"
                                        value={filterState.endDate || ''}
                                        onChange={(e) =>
                                            onFilterChange({ ...filterState, endDate: e.target.value || null })
                                        }
                                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-rose-300"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Project Filter (when projects prop provided) */}
                    {projects && projects.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                <Folder className="w-3.5 h-3.5" /> Filter by Project
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                                {projects.map((proj) => {
                                    const selected = filterState.projectIds?.includes(proj.id);
                                    return (
                                        <button
                                            key={proj.id}
                                            type="button"
                                            onClick={() => toggleProject(proj.id)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-all ${
                                                selected
                                                    ? 'bg-rose-500 text-white border-rose-500 font-semibold shadow-xs'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {selected && <Check className="w-3 h-3" />}
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color || '#f43f5e' }} />
                                            {proj.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tags Multi-select Filter */}
                    <div>
                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            <TagIcon className="w-3.5 h-3.5" /> Filter by Tags
                        </div>
                        {availableTags.length === 0 ? (
                            <p className="text-gray-400 text-[11px] italic">No tags in this view yet</p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                                {availableTags.map((tag) => {
                                    const isSelected = filterState.tags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-all ${
                                                isSelected
                                                    ? 'bg-rose-500 text-white border-rose-500 font-semibold shadow-xs'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {isSelected && <Check className="w-3 h-3" />}
                                            #{tag}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-gray-500">
                            {activeCount > 0 ? `${activeCount} filter(s) active` : 'No filters applied'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
