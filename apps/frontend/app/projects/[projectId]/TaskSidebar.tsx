'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { X, Check, Tag, Calendar, AlertCircle, Plus, Trash2, ChevronRight, Save } from 'lucide-react';
import { Todo } from '@/lib/api-client';

interface TaskSidebarProps {
    todo: Todo | undefined;
    project: any;
    onClose: () => void;
    onSave: (updates: Partial<Todo>) => Promise<void>;
}

export default function TaskSidebar({ todo, project, onClose, onSave }: TaskSidebarProps) {
    const [draftTodo, setDraftTodo] = useState<Partial<Todo>>({});
    const [tagInput, setTagInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const tagDropdownRef = useRef<HTMLDivElement>(null);
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    useEffect(() => {
        if (todo) {
            setDraftTodo({
                title: todo.title,
                description: todo.description || '',
                priority: todo.priority || 'low',
                dueDate: todo.dueDate,
                tags: todo.tags || [],
                customSections: todo.customSections || {}
            });
        }
    }, [todo]);

    // Close tag dropdown on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
                setShowTagDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (!todo) return null;

    const isDirty = JSON.stringify({
        title: draftTodo.title,
        description: draftTodo.description || '',
        priority: draftTodo.priority || 'low',
        dueDate: draftTodo.dueDate,
        tags: draftTodo.tags || [],
        customSections: draftTodo.customSections || {}
    }) !== JSON.stringify({
        title: todo.title,
        description: todo.description || '',
        priority: todo.priority || 'low',
        dueDate: todo.dueDate,
        tags: todo.tags || [],
        customSections: todo.customSections || {}
    });

    const handleSave = async () => {
        if (!isDirty || isSaving) return;
        setIsSaving(true);
        try {
            await onSave(draftTodo);
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: keyof Todo, value: any) => {
        setDraftTodo(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = (tag: string) => {
        const currentTags = draftTodo.tags as string[] || [];
        if (tag.trim() && !currentTags.includes(tag.trim())) {
            updateField('tags', [...currentTags, tag.trim()]);
        }
        setTagInput('');
        setShowTagDropdown(false);
    };

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(tagInput);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        updateField('tags', (draftTodo.tags as string[]).filter(t => t !== tagToRemove));
    };

    const handleSectionChange = (key: string, value: string) => {
        setDraftTodo(prev => ({
            ...prev,
            customSections: {
                ...(prev.customSections as Record<string, string> || {}),
                [key]: value
            }
        }));
    };

    const addSection = () => {
        const name = prompt("Enter new section name:");
        if (name && name.trim()) {
            handleSectionChange(name.trim(), "");
        }
    };

    const removeSection = (key: string) => {
        if (confirm(`Remove section "${key}"?`)) {
            const sections = { ...(draftTodo.customSections as Record<string, string> || {}) };
            delete sections[key];
            setDraftTodo(prev => ({ ...prev, customSections: sections }));
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-gray-800 shadow-xl border-l border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    {isDirty && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'thin' }}>
                
                {/* Title */}
                <div>
                    <input 
                        type="text"
                        value={draftTodo.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="w-full text-2xl font-bold text-gray-900 border-none focus:ring-0 outline-none pb-1 bg-transparent px-0 placeholder-gray-300"
                        placeholder="Task title..."
                    />
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-1 gap-5 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    {/* Priority */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-500 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-gray-400" /> Priority
                        </div>
                        <select
                            value={draftTodo.priority as string || 'low'}
                            onChange={(e) => updateField('priority', e.target.value)}
                            className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 transition-all cursor-pointer"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" /> Date
                        </div>
                        <input
                            type="date"
                            value={draftTodo.dueDate ? new Date(draftTodo.dueDate as any).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateField('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 transition-all cursor-pointer"
                        />
                    </div>

                    {/* Tags */}
                    <div className="flex items-start gap-4">
                        <div className="w-24 text-sm font-medium text-gray-500 flex items-center gap-2 mt-2">
                            <Tag className="w-4 h-4 text-gray-400" /> Tags
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {(draftTodo.tags as string[] || []).map(tag => (
                                    <span key={tag} className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                                        {tag}
                                        <button 
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:bg-rose-200 text-rose-500 hover:text-rose-800 rounded p-0.5 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            
                            <div className="relative" ref={tagDropdownRef}>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => {
                                        setTagInput(e.target.value);
                                        setShowTagDropdown(true);
                                    }}
                                    onFocus={() => setShowTagDropdown(true)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Type & press enter..."
                                    className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 transition-all"
                                />
                                {showTagDropdown && project?.availableTags && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-40 overflow-y-auto">
                                        {project.availableTags
                                            .filter((t: string) => t.toLowerCase().includes(tagInput.toLowerCase()) && !(draftTodo.tags as string[] || []).includes(t))
                                            .map((t: string) => (
                                            <button
                                                key={t}
                                                onClick={() => handleAddTag(t)}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                {t}
                                            </button>
                                        ))}
                                        {tagInput.trim() && !project.availableTags.includes(tagInput.trim()) && (
                                            <button
                                                onClick={() => handleAddTag(tagInput)}
                                                className="w-full text-left px-3 py-2 text-sm text-rose-600 font-medium hover:bg-rose-50 transition-colors border-t border-gray-100"
                                            >
                                                Create "{tagInput.trim()}"
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Description</h3>
                    <textarea
                        value={draftTodo.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        className="w-full min-h-[120px] text-sm text-gray-700 bg-gray-50/50 border border-gray-200 rounded-xl p-4 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 transition-all resize-y placeholder-gray-400"
                        placeholder="Add a more detailed description..."
                    />
                </div>

                {/* Custom Sections */}
                <div className="pt-2">
                    <div className="flex items-center justify-between mb-4 pl-1">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Custom Sections</h3>
                        <button 
                            onClick={addSection}
                            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Section
                        </button>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(draftTodo.customSections as Record<string, string> || {}).map(([key, value]) => (
                            <div key={key} className="group relative">
                                <div className="flex items-center justify-between mb-2 pl-1">
                                    <h4 className="text-sm font-semibold text-gray-700">{key}</h4>
                                    <button 
                                        onClick={() => removeSection(key)}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 transition-opacity p-1 bg-white rounded-md hover:bg-rose-50"
                                        title="Remove section"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <textarea
                                    value={value}
                                    onChange={(e) => handleSectionChange(key, e.target.value)}
                                    className="w-full min-h-[80px] text-sm text-gray-700 bg-gray-50/50 border border-gray-200 rounded-xl p-4 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20 transition-all resize-y placeholder-gray-400"
                                    placeholder={`Write your ${key}...`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Padding at bottom */}
                <div className="h-4"></div>
            </div>
        </div>
    );
}
