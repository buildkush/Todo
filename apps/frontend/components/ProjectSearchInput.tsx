'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface ProjectSearchInputProps {
    value: string;
    onChange: (query: string) => void;
    placeholder?: string;
}

export function ProjectSearchInput({ value, onChange, placeholder = 'Search tasks...' }: ProjectSearchInputProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isMobileOpen && mobileInputRef.current) {
            mobileInputRef.current.focus();
        }
    }, [isMobileOpen]);

    return (
        <div className="relative flex items-center">
            {/* Desktop Input (>= md) */}
            <div className="hidden md:flex items-center relative min-w-[180px] lg:min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white focus:border-rose-300 transition-all"
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        title="Clear search"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Mobile Icon Button (< md) */}
            <div className="md:hidden">
                {!isMobileOpen ? (
                    <button
                        type="button"
                        onClick={() => setIsMobileOpen(true)}
                        className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-medium ${
                            value
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                        }`}
                        title="Search tasks"
                    >
                        <Search className="w-4 h-4" />
                        {value && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                    </button>
                ) : (
                    <div className="fixed inset-x-0 top-0 h-14 bg-white border-b border-gray-200 px-4 flex items-center gap-2 z-50 animate-in slide-in-from-top-2 duration-150 shadow-md">
                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            ref={mobileInputRef}
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 py-1.5 bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                        />
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange('')}
                                className="p-1 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold shrink-0"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
