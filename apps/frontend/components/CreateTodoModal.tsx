'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Flag, ChevronDown, Inbox, Hash, FolderOpen, X, Tag, Plus, Check } from 'lucide-react';
import { apiClient, Section, Todo } from '@/lib/api-client';
import { ErrorAlert } from './Layout';
import { DatePicker } from './DatePicker';

const PRIORITIES = [
    { value: 'high',   label: 'Priority 1', color: '#ef4444', flag: '#ef4444' },
    { value: 'medium', label: 'Priority 2', color: '#f59e0b', flag: '#f59e0b' },
    { value: 'low',    label: 'Priority 3', color: '#6b7280', flag: '#9ca3af' },
] as const;

function PriorityDropdown({ value, onChange }: { value: string; onChange: (v: 'low' | 'medium' | 'high') => void }) {
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
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2.5 border border-gray-200 rounded-lg text-xs font-normal text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors h-[28px]"
            >
                <Flag className="w-3.5 h-3.5" style={{ color: current.flag }} />
                Priority
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1.5 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {PRIORITIES.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => { onChange(p.value as any); setOpen(false); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Flag className="w-3.5 h-3.5" style={{ color: p.flag }} />
                                {p.label}
                            </div>
                            {value === p.value && (
                                <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Location Picker (Project / Section dropdown) ─── */

interface LocationOption {
    id: string;
    label: string;
    projectId?: string;
    sectionId?: string;
    icon: 'inbox' | 'project' | 'section';
    indent?: boolean;
}

function LocationPicker({
    value,
    onChange,
    options,
    disabled,
}: {
    value: string;
    onChange: (id: string) => void;
    options: LocationOption[];
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.id === value) || options[0];

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const getIcon = (icon: string) => {
        switch (icon) {
            case 'inbox': return <Inbox className="w-3.5 h-3.5 text-blue-500" />;
            case 'project': return <Hash className="w-3.5 h-3.5 text-gray-400" />;
            case 'section': return <FolderOpen className="w-3.5 h-3.5 text-gray-400" />;
            default: return null;
        }
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className="flex items-center gap-2 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors min-w-0"
            >
                {getIcon(selected?.icon || 'inbox')}
                <span className="truncate max-w-[180px]">{selected?.label || 'Inbox'}</span>
                <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
            </button>

            {open && (
                <div className="absolute bottom-full left-0 mb-1.5 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
                    {options.map(opt => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => { onChange(opt.id); setOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50 ${
                                opt.indent ? 'pl-7' : ''
                            } ${value === opt.id ? 'text-rose-600 bg-rose-50/50' : 'text-gray-700'}`}
                        >
                            {getIcon(opt.icon)}
                            <span className="truncate">{opt.label}</span>
                            {value === opt.id && (
                                <svg className="w-3.5 h-3.5 text-rose-500 ml-auto flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Main Modal ─── */

export function CreateTodoModal() {
    const {
        isCreateTodoModalOpen,
        setCreateTodoModalOpen,
        projects,
        defaultTodoProjectId,
        defaultTodoSectionId,
    } = useApp();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationId, setLocationId] = useState<string>('inbox');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
    const [dueDate, setDueDate] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const tagDropdownRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // All location options (Inbox + projects + their sections)
    const [locationOptions, setLocationOptions] = useState<LocationOption[]>([
        { id: 'inbox', label: 'Inbox', icon: 'inbox' },
    ]);

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

    // Load existing tags from projects and user todos
    useEffect(() => {
        if (!isCreateTodoModalOpen) {
            setTags([]);
            setTagInput('');
            setShowTagDropdown(false);
            return;
        }

        const loadExistingTags = async () => {
            const projectTags = projects.flatMap(p => p.availableTags || []);
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
                const all = projectTags.filter(Boolean);
                const uniqueMap = new Map<string, string>();
                for (const t of all) {
                    if (!uniqueMap.has(t.toLowerCase())) {
                        uniqueMap.set(t.toLowerCase(), t);
                    }
                }
                setAvailableTags(Array.from(uniqueMap.values()));
            }
        };

        loadExistingTags();
    }, [isCreateTodoModalOpen, projects]);

    useEffect(() => {
        if (!isCreateTodoModalOpen) {
            setTitle('');
            setDescription('');
            setPriority('low');
            setLocationId('inbox');
            setError(null);
            return;
        }

        if (defaultTodoSectionId && defaultTodoProjectId) {
            setLocationId(`sec:${defaultTodoProjectId}:${defaultTodoSectionId}`);
        } else if (defaultTodoProjectId) {
            setLocationId(`proj:${defaultTodoProjectId}`);
        } else {
            setLocationId('inbox');
        }

        const buildOptions = async () => {
            const opts: LocationOption[] = [
                { id: 'inbox', label: 'Inbox', icon: 'inbox' },
            ];

            for (const project of projects.filter(item => !item.id.startsWith('optimistic-project-'))) {
                opts.push({
                    id: `proj:${project.id}`,
                    label: project.name,
                    projectId: project.id,
                    icon: 'project',
                });

                try {
                    const res = await apiClient.getSectionsForLocation(project.id);
                    const sections = res.data || [];
                    for (const section of sections) {
                        opts.push({
                            id: `sec:${project.id}:${section.id}`,
                            label: `${project.name} / ${section.name}`,
                            projectId: project.id,
                            sectionId: section.id,
                            icon: 'section',
                            indent: true,
                        });
                    }
                } catch { /* ignore */ }
            }

            setLocationOptions(opts);
        };

        buildOptions();
    }, [isCreateTodoModalOpen, projects]);

    // Set the default location when modal opens
    useEffect(() => {
        if (!isCreateTodoModalOpen) return;

        const sectionId = (defaultTodoSectionId && defaultTodoSectionId !== 'unsectioned') ? defaultTodoSectionId : undefined;

        if (sectionId && defaultTodoProjectId) {
            setLocationId(`sec:${defaultTodoProjectId}:${sectionId}`);
        } else if (defaultTodoProjectId && defaultTodoProjectId !== 'none') {
            setLocationId(`proj:${defaultTodoProjectId}`);
        } else {
            setLocationId('inbox');
        }

        setTitle('');
        setDescription('');
        setPriority('low');
        setDueDate('');
        setTags([]);
        setTagInput('');
        setShowTagDropdown(false);
        setError(null);
        setTimeout(() => {
            titleInputRef.current?.focus();
        }, 50);
    }, [defaultTodoProjectId, defaultTodoSectionId, isCreateTodoModalOpen]);

    if (!isCreateTodoModalOpen) return null;

    // Parse location into projectId + sectionId
    const parseLocation = (loc: string) => {
        if (loc === 'inbox') return { projectId: undefined, sectionId: undefined };
        if (loc.startsWith('proj:')) return { projectId: loc.slice(5), sectionId: undefined };
        if (loc.startsWith('sec:')) {
            const parts = loc.slice(4).split(':');
            return { projectId: parts[0], sectionId: parts[1] };
        }
        return { projectId: undefined, sectionId: undefined };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isLoading) return;
        let temporaryId: string | undefined;
        try {
            setIsLoading(true);
            setError(null);
            const { projectId, sectionId } = parseLocation(locationId);
            const now = new Date().toISOString();
            temporaryId = `optimistic-todo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const user = apiClient.getCurrentUser();
            const optimisticTodo: Todo = {
                id: temporaryId,
                userId: user?.id || '',
                projectId: projectId || 'none',
                sectionId,
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                tags: tags.length > 0 ? tags : undefined,
                isCompleted: false,
                order: 0,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
            };
            window.dispatchEvent(new CustomEvent('todo-created', {
                detail: { todo: optimisticTodo },
            }));

            const response = await apiClient.createTodo(
                title.trim(),
                projectId,
                sectionId,
                { 
                    description: description.trim() || undefined, 
                    priority,
                    dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                    tags: tags.length > 0 ? tags : undefined
                }
            );
            if (!response.data) throw new Error('The server did not return the created task');
            window.dispatchEvent(new CustomEvent('todo-created', {
                detail: { todo: response.data, temporaryId },
            }));
            setCreateTodoModalOpen(false);
        } catch (err) {
            if (temporaryId) {
                window.dispatchEvent(new CustomEvent('todo-create-failed', {
                    detail: { temporaryId },
                }));
            }
            setError(err instanceof Error ? err.message : 'Failed to create task');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTag = (tagToAdd: string) => {
        const trimmed = tagToAdd.trim();
        if (!trimmed) return;

        const alreadySelected = tags.some(t => t.toLowerCase() === trimmed.toLowerCase());
        if (alreadySelected) {
            setTagInput('');
            setShowTagDropdown(false);
            return;
        }

        const existingInAvailable = availableTags.find(t => t.toLowerCase() === trimmed.toLowerCase());
        const finalTag = existingInAvailable || trimmed;

        setTags(prev => [...prev, finalTag]);

        if (!availableTags.some(t => t.toLowerCase() === finalTag.toLowerCase())) {
            setAvailableTags(prev => [...prev, finalTag]);
        }
        setTagInput('');
        setShowTagDropdown(false);
    };

    const handleToggleTag = (tagToToggle: string) => {
        const trimmed = tagToToggle.trim();
        const isSelected = tags.some(t => t.toLowerCase() === trimmed.toLowerCase());
        if (isSelected) {
            setTags(prev => prev.filter(t => t.toLowerCase() !== trimmed.toLowerCase()));
        } else {
            handleAddTag(trimmed);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim()) {
                handleAddTag(tagInput);
            }
        } else if (e.key === 'Escape') {
            setShowTagDropdown(false);
        }
    };

    const filteredAvailableTags = availableTags.filter(
        t => t.toLowerCase().includes(tagInput.toLowerCase().trim())
    );

    const close = () => setCreateTodoModalOpen(false);
    const canSubmit = title.trim().length > 0 && !isLoading;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={close} />

            <div className="relative bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-200">
                <form onSubmit={handleSubmit}>
                    {/* Title + description */}
                    <div className="px-5 pt-5 pb-2">
                        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Finish landing page design by Friday"
                            required
                            disabled={isLoading}
                            className="w-full text-[15px] font-medium text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent"
                        />
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Description"
                            rows={3}
                            disabled={isLoading}
                            className="w-full text-sm text-gray-600 placeholder-gray-300 border-none outline-none bg-transparent resize-none mt-1 min-h-[72px] max-h-[110px] overflow-y-auto"
                        />
                        {/* Option chips */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <PriorityDropdown value={priority} onChange={setPriority} />
                            
                            <DatePicker
                                value={dueDate}
                                onChange={(d) => setDueDate(d || '')}
                            />

                            <div className="relative flex-1 min-w-[140px]" ref={tagDropdownRef}>
                                <div className="relative flex items-center">
                                    <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={e => {
                                            setTagInput(e.target.value);
                                            setShowTagDropdown(true);
                                        }}
                                        onFocus={() => setShowTagDropdown(true)}
                                        onClick={() => setShowTagDropdown(true)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="Add tag..."
                                        className="w-full pl-8 pr-6 py-1 border border-gray-200 rounded-lg text-xs font-normal text-gray-600 hover:border-gray-300 focus:border-rose-300 outline-none h-[28px] bg-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowTagDropdown(!showTagDropdown)}
                                        className="absolute right-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {showTagDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-44 overflow-y-auto">
                                        {filteredAvailableTags.length > 0 && (
                                            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                                Existing Tags
                                            </div>
                                        )}
                                        {filteredAvailableTags.map(t => {
                                            const isSelected = tags.some(sel => sel.toLowerCase() === t.toLowerCase());
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => handleToggleTag(t)}
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
                                                onClick={() => handleAddTag(tagInput)}
                                                className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-gray-100 flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                                                Create "{tagInput.trim()}"
                                            </button>
                                        )}

                                        {filteredAvailableTags.length === 0 && !tagInput.trim() && (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center italic">
                                                No existing tags found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1.5 px-2.5 h-[28px] bg-rose-50 text-rose-600 border border-rose-200/80 rounded-lg text-xs font-normal transition-colors">
                                        <Tag className="w-3.5 h-3.5 text-rose-400" />
                                        {tag}
                                        <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-rose-800 ml-0.5 p-0.5 rounded">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom bar */}
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-xl">
                        {/* Location picker */}
                        <LocationPicker
                            value={locationId}
                            onChange={setLocationId}
                            options={locationOptions}
                            disabled={isLoading}
                        />

                        {/* Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={close}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors ${
                                    canSubmit
                                        ? 'bg-rose-500 hover:bg-rose-600'
                                        : 'bg-rose-300 cursor-not-allowed'
                                }`}
                            >
                                {isLoading ? 'Adding…' : 'Add task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
