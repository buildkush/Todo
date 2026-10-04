'use client';

import { useState, useEffect } from 'react';
import { X, Check, Tag, Calendar, AlertCircle, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Todo } from '@/lib/api-client';

interface TaskSidebarProps {
    todo: Todo | undefined;
    project: any;
    onClose: () => void;
    onSave: (updates: Partial<Todo>) => Promise<void>;
}

export default function TaskSidebar({ todo, project, onClose, onSave }: TaskSidebarProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draftTodo, setDraftTodo] = useState<Partial<Todo>>({});
    
    // Reset draft when todo changes
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
            setIsEditing(false);
        }
    }, [todo]);

    if (!todo) return null;

    const handleSave = async () => {
        try {
            await onSave(draftTodo);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save', error);
        }
    };

    const handleCancel = () => {
        setDraftTodo({
            title: todo.title,
            description: todo.description || '',
            priority: todo.priority || 'low',
            dueDate: todo.dueDate,
            tags: todo.tags || [],
            customSections: todo.customSections || {}
        });
        setIsEditing(false);
    };

    const updateField = (field: keyof Todo, value: any) => {
        setDraftTodo(prev => ({ ...prev, [field]: value }));
        setIsEditing(true);
    };

    const handleSectionChange = (key: string, value: string) => {
        setDraftTodo(prev => ({
            ...prev,
            customSections: {
                ...(prev.customSections as Record<string, string> || {}),
                [key]: value
            }
        }));
        setIsEditing(true);
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
            setIsEditing(true);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                    {isEditing && (
                        <div className="flex items-center gap-1 mr-2 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                            <span className="text-xs font-semibold text-rose-600 mr-1">Unsaved changes</span>
                            <button onClick={handleSave} className="p-1 bg-white hover:bg-green-50 text-green-600 rounded-md transition-colors shadow-sm" title="Save">
                                <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={handleCancel} className="p-1 bg-white hover:bg-gray-50 text-gray-500 rounded-md transition-colors shadow-sm" title="Cancel">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'thin' }}>
                
                {/* Title */}
                <div>
                    {isEditing ? (
                        <input 
                            type="text"
                            value={draftTodo.title || ''}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full text-2xl font-bold text-gray-900 border-b border-rose-200 focus:border-rose-500 outline-none pb-1 bg-transparent"
                            placeholder="Task title..."
                            autoFocus
                        />
                    ) : (
                        <h2 
                            onDoubleClick={() => setIsEditing(true)}
                            className="text-2xl font-bold text-gray-900 cursor-text hover:bg-gray-50 rounded px-1 -ml-1 transition-colors"
                            title="Double click to edit"
                        >
                            {draftTodo.title}
                        </h2>
                    )}
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Priority */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" /> Priority
                        </div>
                        {isEditing ? (
                            <select
                                value={draftTodo.priority as string || 'low'}
                                onChange={(e) => updateField('priority', e.target.value)}
                                className="text-sm bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-rose-400"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        ) : (
                            <div 
                                onDoubleClick={() => setIsEditing(true)}
                                className="text-sm font-medium cursor-text hover:bg-gray-50 px-2 py-1 rounded -ml-2 transition-colors capitalize"
                            >
                                {draftTodo.priority || 'Low'}
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-500 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" /> Due Date
                        </div>
                        {isEditing ? (
                            <input
                                type="date"
                                value={draftTodo.dueDate ? new Date(draftTodo.dueDate as any).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateField('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                className="text-sm bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-rose-400"
                            />
                        ) : (
                            <div 
                                onDoubleClick={() => setIsEditing(true)}
                                className="text-sm font-medium cursor-text hover:bg-gray-50 px-2 py-1 rounded -ml-2 transition-colors"
                            >
                                {draftTodo.dueDate ? new Date(draftTodo.dueDate as any).toLocaleDateString() : 'No date'}
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex items-start gap-4">
                        <div className="w-24 text-sm font-medium text-gray-500 flex items-center gap-1.5 mt-1">
                            <Tag className="w-4 h-4" /> Tags
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2">
                                {(draftTodo.tags as string[] || []).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-xs font-semibold flex items-center gap-1">
                                        {tag}
                                        {isEditing && (
                                            <button 
                                                onClick={() => updateField('tags', (draftTodo.tags as string[]).filter(t => t !== tag))}
                                                className="hover:text-rose-800"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {isEditing && (
                                    <select 
                                        className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2 py-1 outline-none"
                                        onChange={(e) => {
                                            if (e.target.value && !(draftTodo.tags as string[] || []).includes(e.target.value)) {
                                                updateField('tags', [...(draftTodo.tags as string[] || []), e.target.value]);
                                            }
                                            e.target.value = "";
                                        }}
                                    >
                                        <option value="">+ Add tag</option>
                                        {(project?.availableTags || []).map((t: string) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            {!isEditing && (draftTodo.tags as string[] || []).length === 0 && (
                                <div 
                                    onDoubleClick={() => setIsEditing(true)}
                                    className="text-sm text-gray-400 italic cursor-text hover:bg-gray-50 px-2 py-1 rounded -ml-2 transition-colors inline-block"
                                >
                                    Double click to add tags
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Description */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                    {isEditing ? (
                        <textarea
                            value={draftTodo.description || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            className="w-full min-h-[100px] text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-rose-400 resize-y"
                            placeholder="Add a more detailed description..."
                        />
                    ) : (
                        <div 
                            onDoubleClick={() => setIsEditing(true)}
                            className="text-sm text-gray-700 whitespace-pre-wrap cursor-text hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors min-h-[60px]"
                        >
                            {draftTodo.description || <span className="text-gray-400 italic">No description provided. Double click to add one.</span>}
                        </div>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* Custom Sections */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Custom Sections</h3>
                        {isEditing && (
                            <button 
                                onClick={addSection}
                                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Section
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {Object.entries(draftTodo.customSections as Record<string, string> || {}).map(([key, value]) => (
                            <div key={key} className="group">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="text-sm font-semibold text-gray-800">{key}</h4>
                                    {isEditing && (
                                        <button 
                                            onClick={() => removeSection(key)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-500 transition-opacity p-1"
                                            title="Remove section"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={value}
                                        onChange={(e) => handleSectionChange(key, e.target.value)}
                                        className="w-full min-h-[80px] text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-rose-400 resize-y"
                                        placeholder={`Enter ${key}...`}
                                    />
                                ) : (
                                    <div 
                                        onDoubleClick={() => setIsEditing(true)}
                                        className="text-sm text-gray-700 whitespace-pre-wrap cursor-text hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors min-h-[40px] bg-gray-50/50"
                                    >
                                        {value || <span className="text-gray-400 italic">Empty section. Double click to edit.</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                        {Object.keys(draftTodo.customSections as Record<string, string> || {}).length === 0 && !isEditing && (
                            <div className="text-sm text-gray-400 italic">
                                No custom sections yet. Double click anywhere to enter edit mode and add sections like "Plot", "Hook", or "Script".
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
