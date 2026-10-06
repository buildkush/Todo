'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';

export type SortOption =
    | 'manual'
    | 'priority_desc'
    | 'priority_asc'
    | 'date_asc'
    | 'date_desc'
    | 'title_asc'
    | 'title_desc'
    | 'created_desc'
    | 'created_asc'
    | 'tags_asc';

export interface SortDropdownProps {
    currentSort: SortOption;
    onSortChange: (sort: SortOption) => void;
    compact?: boolean;
    iconOnly?: boolean;
}

const SORT_OPTIONS: { id: SortOption; label: string; group: string }[] = [
    { id: 'manual', label: 'Manual Order (Default)', group: 'Default' },
    { id: 'priority_desc', label: 'Priority: High → Low', group: 'Priority' },
    { id: 'priority_asc', label: 'Priority: Low → High', group: 'Priority' },
    { id: 'date_asc', label: 'Due Date: Earliest First', group: 'Due Date' },
    { id: 'date_desc', label: 'Due Date: Latest First', group: 'Due Date' },
    { id: 'title_asc', label: 'Title: A → Z', group: 'Title' },
    { id: 'title_desc', label: 'Title: Z → A', group: 'Title' },
    { id: 'created_desc', label: 'Created: Newest First', group: 'Created' },
    { id: 'created_asc', label: 'Created: Oldest First', group: 'Created' },
    { id: 'tags_asc', label: 'Tags: Alphabetical', group: 'Tags' },
];

export function SectionSortDropdown({ currentSort, onSortChange, compact = false, iconOnly = false }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const activeOption = SORT_OPTIONS.find(o => o.id === currentSort) || SORT_OPTIONS[0];

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {iconOnly ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-1 rounded transition-all relative ${
                        currentSort !== 'manual'
                            ? 'opacity-100 text-rose-600 bg-rose-50 hover:bg-rose-100/80'
                            : 'opacity-100 sm:opacity-0 sm:group-hover/header:opacity-100 text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title={currentSort === 'manual' ? 'Sort tasks' : `Sort: ${activeOption.label}`}
                >
                    <ArrowUpDown className="w-4 h-4" />
                    {currentSort !== 'manual' && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 border border-white" />
                    )}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-1.5 rounded-lg border font-medium transition-colors ${
                        currentSort !== 'manual'
                            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100/70'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                    } ${compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'}`}
                    title="Sort tasks"
                >
                    <ArrowUpDown className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">
                        {currentSort === 'manual' ? 'Sort' : activeOption.label}
                    </span>
                </button>
            )}

            {isOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in duration-100 text-xs select-none">
                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        Sort Section Tasks By
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
                        {SORT_OPTIONS.map((option) => {
                            const isSelected = currentSort === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        onSortChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-rose-50 text-rose-600 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <span>{option.label}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
