'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
    value?: string | null;
    onChange: (date: string | null) => void;
    placeholder?: string;
    className?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Due date', className = '' }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selectedDate = value ? new Date(value) : null;
    const isValidSelected = selectedDate && !isNaN(selectedDate.getTime());

    const [viewDate, setViewDate] = useState<Date>(() => selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date());

    useEffect(() => {
        if (selectedDate && !isNaN(selectedDate.getTime())) {
            setViewDate(selectedDate);
        }
    }, [value]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1);
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalCells = (firstDayOfMonth + daysInMonth) > 35 ? 42 : 35;
    const nextMonthDays = Array.from({ length: totalCells - (firstDayOfMonth + daysInMonth) }, (_, i) => i + 1);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const handleSelectDay = (day: number, monthOffset: number = 0) => {
        const targetDate = new Date(viewYear, viewMonth + monthOffset, day);
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${d}`);
        setOpen(false);
    };

    const handleQuickPreset = (preset: 'today' | 'tomorrow' | 'nextWeek') => {
        const now = new Date();
        const target = new Date();
        if (preset === 'tomorrow') {
            target.setDate(now.getDate() + 1);
        } else if (preset === 'nextWeek') {
            target.setDate(now.getDate() + 7);
        }
        const year = target.getFullYear();
        const month = String(target.getMonth() + 1).padStart(2, '0');
        const d = String(target.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${d}`);
        setOpen(false);
    };

    const formatDisplay = () => {
        if (!isValidSelected) return placeholder;
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const isToday = selectedDate.toDateString() === today.toDateString();
        const isTomorrow = selectedDate.toDateString() === tomorrow.toDateString();

        if (isToday) return 'Today';
        if (isTomorrow) return 'Tomorrow';

        const sameYear = selectedDate.getFullYear() === today.getFullYear();
        return selectedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: sameYear ? undefined : 'numeric'
        });
    };

    const todayDate = new Date();
    const isSelected = (day: number, monthOffset: number = 0) => {
        if (!isValidSelected) return false;
        const cellDate = new Date(viewYear, viewMonth + monthOffset, day);
        return cellDate.toDateString() === selectedDate.toDateString();
    };

    const isTodayCell = (day: number, monthOffset: number = 0) => {
        const cellDate = new Date(viewYear, viewMonth + monthOffset, day);
        return cellDate.toDateString() === todayDate.toDateString();
    };

    return (
        <div ref={ref} className={`relative inline-block ${className}`}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen(!open)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(!open); }}
                className={`flex items-center gap-1.5 px-2.5 border rounded-lg text-xs font-normal transition-colors h-[28px] cursor-pointer select-none ${
                    isValidSelected
                        ? 'border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
                <Calendar className={`w-3.5 h-3.5 ${isValidSelected ? 'text-rose-500' : 'text-gray-400'}`} />
                <span>{formatDisplay()}</span>
                {isValidSelected && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                onChange(null);
                            }
                        }}
                        className="ml-0.5 hover:text-rose-800 rounded p-0.5 cursor-pointer"
                    >
                        <X className="w-2.5 h-2.5" />
                    </span>
                )}
            </div>

            {open && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
                    {/* Presets */}
                    <div className="flex items-center gap-1 pb-2 mb-2 border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => handleQuickPreset('today')}
                            className="flex-1 py-1 text-[11px] font-medium text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-center"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickPreset('tomorrow')}
                            className="flex-1 py-1 text-[11px] font-medium text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-center"
                        >
                            Tomorrow
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickPreset('nextWeek')}
                            className="flex-1 py-1 text-[11px] font-medium text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-center"
                        >
                            Next week
                        </button>
                    </div>

                    {/* Month Nav */}
                    <div className="flex items-center justify-between px-1 mb-2">
                        <span className="text-xs font-semibold text-gray-800">
                            {monthNames[viewMonth]} {viewYear}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-1 text-center">
                        {daysOfWeek.map(d => (
                            <span key={d} className="text-[10px] font-semibold text-gray-400 py-1">
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-0.5 text-center">
                        {prevMonthDays.map(day => (
                            <button
                                key={`prev-${day}`}
                                type="button"
                                onClick={() => handleSelectDay(day, -1)}
                                className="h-7 w-7 m-auto text-xs text-gray-300 hover:bg-gray-50 rounded-lg flex items-center justify-center"
                            >
                                {day}
                            </button>
                        ))}
                        {currentMonthDays.map(day => {
                            const selected = isSelected(day, 0);
                            const today = isTodayCell(day, 0);
                            return (
                                <button
                                    key={`curr-${day}`}
                                    type="button"
                                    onClick={() => handleSelectDay(day, 0)}
                                    className={`h-7 w-7 m-auto text-xs rounded-lg flex items-center justify-center transition-all ${
                                        selected
                                            ? 'bg-rose-500 text-white font-semibold shadow-sm'
                                            : today
                                            ? 'text-rose-600 font-bold bg-rose-50/80 hover:bg-rose-100'
                                            : 'text-gray-700 hover:bg-rose-50 hover:text-rose-600'
                                    }`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                        {nextMonthDays.map(day => (
                            <button
                                key={`next-${day}`}
                                type="button"
                                onClick={() => handleSelectDay(day, 1)}
                                className="h-7 w-7 m-auto text-xs text-gray-300 hover:bg-gray-50 rounded-lg flex items-center justify-center"
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    {/* Clear Footer */}
                    {isValidSelected && (
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(null);
                                    setOpen(false);
                                }}
                                className="text-[11px] font-medium text-gray-400 hover:text-rose-600 transition-colors"
                            >
                                Clear date
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
