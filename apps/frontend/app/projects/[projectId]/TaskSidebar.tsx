'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { X, Check, Tag, Calendar, AlertCircle, Plus, Trash2, ChevronRight, Save, Flag, CheckCircle2, Circle, Hash, FolderOpen, Edit2 } from 'lucide-react';
import { Todo, apiClient } from '@/lib/api-client';
import { DatePicker } from '@/components/DatePicker';

interface TaskSidebarProps {
    todo: Todo | undefined;
    project: any;
    onClose: () => void;
    onSave: (updates: Partial<Todo>) => Promise<void>;
}

const PRIORITIES = [
    { value: 'high', label: 'Priority 1 (High)', flagColor: '#ef4444' },
    { value: 'medium', label: 'Priority 2 (Medium)', flagColor: '#f59e0b' },
    { value: 'low', label: 'Priority 3 (Low)', flagColor: '#6b7280' },
] as const;

function PrioritySelect({ value, onChange }: { value: string; onChange: (v: 'low' | 'medium' | 'high') => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = PRIORITIES.find(p => p.value === value) || PRIORITIES[2];

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={ref} className="relative flex-1">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-50 transition-all h-[34px]"
            >
                <div className="flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: current.flagColor }} />
                    <span className="truncate">{current.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 rotate-90 flex-shrink-0 ml-1" />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in duration-100">
                    {PRIORITIES.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => { onChange(p.value as any); setOpen(false); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-rose-50/50 hover:text-rose-600 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Flag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: p.flagColor }} />
                                <span>{p.label}</span>
                            </div>
                            {value === p.value && <Check className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── GitLab / Linear Style Inline Tag Field with Read vs Edit Mode ─── */
function TagSelector({
    tags,
    availableTags,
    onAddTag,
    onRemoveTag,
    onToggleTag,
}: {
    tags: string[];
    availableTags: string[];
    onAddTag: (t: string) => void;
    onRemoveTag: (t: string) => void;
    onToggleTag: (t: string) => void;
}) {
    const [tagInput, setTagInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setIsEditing(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim()) {
                onAddTag(tagInput.trim());
                setTagInput('');
            }
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            onRemoveTag(tags[tags.length - 1]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setIsEditing(false);
        }
    };

    const filteredAvailable = availableTags.filter(t =>
        t.toLowerCase().includes(tagInput.toLowerCase().trim())
    );

    if (!isEditing) {
        return (
            <div
                onClick={() => {
                    setIsEditing(true);
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 10);
                }}
                className="flex-1 flex flex-wrap items-center gap-1.5 min-h-[34px] cursor-pointer group/tags p-0.5"
            >
                {tags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50/80 text-indigo-700 border border-indigo-200/80 rounded-md text-xs font-semibold shadow-sm"
                    >
                        <Tag className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTag(tag);
                            }}
                            className="hover:text-indigo-900 rounded p-0.5 ml-0.5 transition-colors"
                            title="Remove tag"
                        >
                            <X className="w-3 h-3 text-indigo-500" />
                        </button>
                    </span>
                ))}
                
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                        setIsOpen(true);
                        setTimeout(() => inputRef.current?.focus(), 10);
                    }}
                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Edit tags"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
                
                {tags.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No tags</span>
                )}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative flex-1">
            <div
                className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-indigo-300 ring-2 ring-indigo-50 rounded-lg transition-all min-h-[34px] cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {/* Tag chips inside input area in Edit mode */}
                {tags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50/80 text-indigo-700 border border-indigo-200/80 rounded-md text-xs font-medium transition-colors"
                    >
                        <Tag className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTag(tag);
                            }}
                            className="hover:text-rose-900 rounded p-0.5 ml-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* Inline input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => {
                        setTagInput(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? "Type & press Enter..." : ""}
                    className="flex-1 min-w-[70px] bg-transparent border-none outline-none text-xs text-gray-700 placeholder-gray-400 py-0.5 px-1"
                />

                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        setIsEditing(false);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Done"
                >
                    <Check className="w-3.5 h-3.5 text-rose-500" />
                </button>
            </div>

            {/* Filter Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-48 overflow-y-auto animate-in fade-in duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Select Tags
                    </div>
                    {filteredAvailable.map(t => {
                        const isSelected = tags.some(sel => sel.toLowerCase() === t.toLowerCase());
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    onToggleTag(t);
                                    setTagInput('');
                                }}
                                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium transition-colors text-left ${
                                    isSelected ? 'bg-rose-50/80 text-rose-600 font-semibold' : 'text-gray-700 hover:bg-rose-50 hover:text-rose-600'
                                }`}
                            >
                                <span className="flex items-center gap-1.5 truncate">
                                    <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    {t}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />}
                            </button>
                        );
                    })}

                    {tagInput.trim() && !availableTags.some(t => t.toLowerCase() === tagInput.trim().toLowerCase()) && !tags.some(t => t.toLowerCase() === tagInput.trim().toLowerCase()) && (
                        <button
                            type="button"
                            onClick={() => {
                                onAddTag(tagInput.trim());
                                setTagInput('');
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-gray-100 flex items-center gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                            Create "{tagInput.trim()}"
                        </button>
                    )}

                    {filteredAvailable.length === 0 && !tagInput.trim() && (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center italic">
                            No matching tags
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Description Section with Read Mode / Edit Mode + Read More ─── */
function DescriptionSection({
    description,
    onChange,
}: {
    description: string;
    onChange: (val: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isLong = (description || '').length > 150 || (description || '').split('\n').length > 4;

    useEffect(() => {
        if (isEditing) {
            setTimeout(() => textareaRef.current?.focus(), 10);
        }
    }, [isEditing]);

    return (
        <div className="space-y-1.5 w-full overflow-hidden">
            <div className="flex items-center justify-between pl-0.5">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Description</h3>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors flex items-center gap-1"
                    >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-2">
                    <textarea
                        ref={textareaRef}
                        value={description}
                        onChange={(e) => onChange(e.target.value)}
                        rows={4}
                        className="w-full min-h-[90px] max-h-[180px] text-sm text-gray-700 bg-transparent border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-50 rounded-lg p-2.5 outline-none transition-all resize-none placeholder-gray-400 overflow-y-auto break-words"
                        placeholder="Add a description..."
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-sm"
                        >
                            Done
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => setIsEditing(true)}
                    className="group relative cursor-pointer px-1 py-1 rounded-lg hover:bg-gray-50/80 transition-colors w-full overflow-hidden"
                >
                    {description.trim() ? (
                        <div className="w-full overflow-hidden">
                            <p className={`text-sm text-gray-700 font-normal leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${!isExpanded && isLong ? 'line-clamp-4' : ''}`}>
                                {description}
                            </p>
                            {isLong && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExpanded(!isExpanded);
                                    }}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline mt-1.5 inline-block"
                                >
                                    {isExpanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic">Add a description...</p>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Custom Section Item Component (View Mode / Inline Edit Mode) ─── */
function CustomSectionItem({
    sectionKey,
    value,
    onChange,
    onRemove,
}: {
    sectionKey: string;
    value: string;
    onChange: (oldKey: string, newKey: string, newValue: string) => void;
    onRemove: (key: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(sectionKey);
    const [editValue, setEditValue] = useState(value);

    useEffect(() => {
        setEditName(sectionKey);
        setEditValue(value);
    }, [sectionKey, value]);

    const handleSave = () => {
        const trimmedName = editName.trim();
        const trimmedVal = editValue.trim();
        if (!trimmedName || !trimmedVal) return;
        onChange(sectionKey, trimmedName, trimmedVal);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-200 space-y-2.5">
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Section Name
                    </label>
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-50"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Section Description
                    </label>
                    <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={4}
                        className="w-full max-h-[110px] text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-50 transition-all resize-none overflow-y-auto placeholder-gray-400"
                    />
                </div>
                <div className="flex items-center justify-between pt-1">
                    <button
                        type="button"
                        onClick={() => onRemove(sectionKey)}
                        className="text-xs font-medium text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setEditName(sectionKey);
                                setEditValue(value);
                                setIsEditing(false);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!editName.trim() || !editValue.trim()}
                            className="px-3 py-1 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="cursor-pointer py-1 w-full overflow-hidden"
        >
            <h4 className="text-xs font-bold text-gray-800 mb-1">{sectionKey}</h4>
            <p className="text-xs text-gray-600 font-normal leading-relaxed whitespace-pre-wrap break-words">
                {value}
            </p>
        </div>
    );
}

export default function TaskSidebar({ todo, project, onClose, onSave }: TaskSidebarProps) {
    const [draftTodo, setDraftTodo] = useState<Partial<Todo>>(() => todo ? {
        title: todo.title,
        description: todo.description || '',
        priority: todo.priority || 'low',
        isCompleted: todo.isCompleted || false,
        dueDate: todo.dueDate,
        tags: todo.tags || [],
        customSections: todo.customSections || {}
    } : {});
    const [isSaving, setIsSaving] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionDescription, setNewSectionDescription] = useState('');

    useEffect(() => {
        if (todo) {
            setDraftTodo({
                title: todo.title,
                description: todo.description || '',
                priority: todo.priority || 'low',
                isCompleted: todo.isCompleted || false,
                dueDate: todo.dueDate,
                tags: todo.tags || [],
                customSections: todo.customSections || {}
            });
            setIsAddingSection(false);
            setNewSectionName('');
            setNewSectionDescription('');
        }
    }, [todo?.id]);

    // Load project tags and all user tags from API
    useEffect(() => {
        const loadTags = async () => {
            const projectTags: string[] = project?.availableTags || [];
            try {
                const res = await apiClient.getTodos();
                const todoTags = (res.data || []).flatMap((t: Todo) => t.tags || []);
                const all = [...projectTags, ...todoTags].filter(Boolean);
                const uniqueMap = new Map<string, string>();
                for (const t of all) {
                    if (!uniqueMap.has(t.toLowerCase())) {
                        uniqueMap.set(t.toLowerCase(), t);
                    }
                }
                setAvailableTags(Array.from(uniqueMap.values()));
            } catch {
                const uniqueMap = new Map<string, string>();
                for (const t of projectTags.filter(Boolean)) {
                    if (!uniqueMap.has(t.toLowerCase())) {
                        uniqueMap.set(t.toLowerCase(), t);
                    }
                }
                setAvailableTags(Array.from(uniqueMap.values()));
            }
        };
        loadTags();
    }, [project]);

    if (!todo) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500 bg-white">
                <p className="text-xs font-medium text-gray-400 mb-3">Task details unavailable</p>
                <button
                    onClick={onClose}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                >
                    Close Panel
                </button>
            </div>
        );
    }

    const isDirty = JSON.stringify({
        title: draftTodo.title,
        description: draftTodo.description || '',
        priority: draftTodo.priority || 'low',
        isCompleted: draftTodo.isCompleted || false,
        dueDate: draftTodo.dueDate,
        tags: draftTodo.tags || [],
        customSections: draftTodo.customSections || {}
    }) !== JSON.stringify({
        title: todo.title,
        description: todo.description || '',
        priority: todo.priority || 'low',
        isCompleted: todo.isCompleted || false,
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
        const trimmed = tag.trim();
        if (!trimmed) return;
        const currentTags = (draftTodo.tags as string[]) || [];
        const exists = currentTags.some(t => t.toLowerCase() === trimmed.toLowerCase());
        if (!exists) {
            const existingTagInAvailable = availableTags.find(t => t.toLowerCase() === trimmed.toLowerCase());
            const finalTag = existingTagInAvailable || trimmed;
            updateField('tags', [...currentTags, finalTag]);
            if (!availableTags.some(t => t.toLowerCase() === finalTag.toLowerCase())) {
                setAvailableTags(prev => [...prev, finalTag]);
            }
        }
    };

    const handleToggleTag = (tag: string) => {
        const currentTags = (draftTodo.tags as string[]) || [];
        const exists = currentTags.some(t => t.toLowerCase() === tag.toLowerCase());
        if (exists) {
            updateField('tags', currentTags.filter(t => t.toLowerCase() !== tag.toLowerCase()));
        } else {
            handleAddTag(tag);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const currentTags = (draftTodo.tags as string[]) || [];
        updateField('tags', currentTags.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase()));
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

    const handleSaveNewSection = async () => {
        const name = newSectionName.trim();
        const desc = newSectionDescription.trim();
        if (!name || !desc) return;

        const updatedSections = {
            ...(draftTodo.customSections as Record<string, string> || {}),
            [name]: desc
        };

        setDraftTodo(prev => ({
            ...prev,
            customSections: updatedSections
        }));

        setIsAddingSection(false);
        setNewSectionName('');
        setNewSectionDescription('');

        try {
            await onSave({ customSections: updatedSections });
        } catch (error) {
            console.error('Failed to save section', error);
        }
    };

    const removeSection = async (key: string) => {
        const sections = { ...(draftTodo.customSections as Record<string, string> || {}) };
        delete sections[key];
        setDraftTodo(prev => ({ ...prev, customSections: sections }));
        try {
            await onSave({ customSections: sections });
        } catch (error) {
            console.error('Failed to remove section', error);
        }
    };

    const handleUpdateSection = async (oldKey: string, newKey: string, newValue: string) => {
        const sections = { ...(draftTodo.customSections as Record<string, string> || {}) };
        if (oldKey !== newKey) {
            delete sections[oldKey];
        }
        sections[newKey] = newValue;
        setDraftTodo(prev => ({ ...prev, customSections: sections }));
        try {
            await onSave({ customSections: sections });
        } catch (error) {
            console.error('Failed to update section', error);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0 w-full max-w-full bg-white text-gray-800 select-none overflow-x-hidden">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white sticky top-0 z-10 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        title="Close panel"
                    >
                        <ChevronRight className="w-4 h-4 hidden md:block" />
                        <X className="w-5 h-5 md:hidden text-gray-600" />
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate min-w-0 flex-1">
                        <FolderOpen className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-700 truncate">{project?.name || 'Project'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isDirty ? (
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={async () => {
                                const newStatus = !draftTodo.isCompleted;
                                updateField('isCompleted', newStatus);
                                try {
                                    await onSave({ isCompleted: newStatus });
                                } catch (e) {
                                    console.error('Failed to update completion status', e);
                                }
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                                draftTodo.isCompleted
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {draftTodo.isCompleted ? (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Done
                                </>
                            ) : (
                                <>
                                    <Circle className="w-3.5 h-3.5 text-gray-400" /> Mark Complete
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5 space-y-6 min-w-0">
                
                {/* 1. Title */}
                <div className="min-w-0">
                    <input 
                        type="text"
                        value={draftTodo.title || ''}
                        onChange={(e) => updateField('title', e.target.value)}
                        className="w-full text-lg sm:text-xl font-bold text-gray-900 border border-transparent hover:border-gray-200 focus:border-rose-300 focus:bg-white rounded-lg px-2 py-1 outline-none transition-all placeholder-gray-300"
                        placeholder="Task title..."
                    />
                </div>

                {/* 2. Description (Placed directly below Title!) */}
                <DescriptionSection
                    description={draftTodo.description || ''}
                    onChange={(val) => updateField('description', val)}
                />

                {/* 3. Property Meta Grid (Priority, Due Date, Tags) */}
                <div className="bg-gray-50/60 p-3 sm:p-3.5 rounded-xl border border-gray-100 space-y-3 min-w-0">
                    {/* Priority Row */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-20 shrink-0 text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-gray-400" /> Priority
                        </div>
                        <PrioritySelect
                            value={draftTodo.priority as string || 'low'}
                            onChange={(v) => updateField('priority', v)}
                        />
                    </div>

                    {/* Date Row */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-20 shrink-0 text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" /> Due Date
                        </div>
                        <DatePicker
                            value={(() => {
                                if (!draftTodo.dueDate) return '';
                                try {
                                    const d = new Date(draftTodo.dueDate as any);
                                    if (isNaN(d.getTime())) return '';
                                    return d.toISOString().split('T')[0];
                                } catch {
                                    return '';
                                }
                            })()}
                            onChange={(d) => updateField('dueDate', d ? new Date(d).toISOString() : null)}
                            className="flex-1 min-w-0"
                        />
                    </div>

                    {/* Tags Row */}
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                        <div className="w-20 shrink-0 text-xs font-semibold text-gray-500 flex items-center gap-1.5 mt-2">
                            <Tag className="w-3.5 h-3.5 text-gray-400" /> Tags
                        </div>
                        <TagSelector
                            tags={draftTodo.tags as string[] || []}
                            availableTags={availableTags}
                            onAddTag={handleAddTag}
                            onRemoveTag={handleRemoveTag}
                            onToggleTag={handleToggleTag}
                        />
                    </div>
                </div>

                {/* 4. Custom Sections */}
                <div className="pt-1 space-y-4">
                    {/* Dashed Add Section Area / New Section Form (POSITIONS AT TOP ABOVE SECTIONS) */}
                    {isAddingSection ? (
                        <div className="p-3.5 bg-gray-50/60 rounded-xl border border-gray-200 space-y-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Section Name
                                </label>
                                <input
                                    type="text"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    placeholder="e.g. Hook, Key Takeaways..."
                                    className="w-full text-xs text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-50 transition-all placeholder-gray-400"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Section Description
                                </label>
                                <textarea
                                    value={newSectionDescription}
                                    onChange={(e) => setNewSectionDescription(e.target.value)}
                                    placeholder="Enter section description..."
                                    rows={4}
                                    className="w-full max-h-[110px] text-xs text-gray-800 bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-50 transition-all resize-none overflow-y-auto placeholder-gray-400"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingSection(false);
                                        setNewSectionName('');
                                        setNewSectionDescription('');
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveNewSection}
                                    disabled={!newSectionName.trim() || !newSectionDescription.trim()}
                                    className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-all ${
                                        newSectionName.trim() && newSectionDescription.trim()
                                            ? 'bg-rose-500 hover:bg-rose-600 shadow-sm'
                                            : 'bg-rose-300 cursor-not-allowed opacity-60'
                                    }`}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setIsAddingSection(true);
                                setNewSectionName('');
                                setNewSectionDescription('');
                            }}
                            className="w-full p-3.5 border-2 border-dashed border-gray-200 hover:border-rose-300 hover:bg-rose-50/30 rounded-xl text-center text-xs font-semibold text-gray-500 hover:text-rose-600 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                        >
                            <Plus className="w-4 h-4 text-gray-400 group-hover:text-rose-600 transition-colors" />
                            <span>Add Section</span>
                        </button>
                    )}

                    {/* Added Custom Sections (DISPLAYED BELOW THE ADD SECTION AREA) */}
                    {Object.entries(draftTodo.customSections as Record<string, string> || {}).map(([key, value]) => (
                        <CustomSectionItem
                            key={key}
                            sectionKey={key}
                            value={value}
                            onChange={handleUpdateSection}
                            onRemove={removeSection}
                        />
                    ))}
                </div>

                <div className="h-4"></div>
            </div>
        </div>
    );
}
