'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Flag, ChevronDown, Inbox, Hash, FolderOpen, X } from 'lucide-react';
import { apiClient, Section, Todo } from '@/lib/api-client';
import { ErrorAlert } from './Layout';

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
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-normal text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
                <Flag className="w-3 h-3" style={{ color: current.flag }} />
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // All location options (Inbox + projects + their sections)
    const [locationOptions, setLocationOptions] = useState<LocationOption[]>([
        { id: 'inbox', label: 'Inbox', icon: 'inbox' },
    ]);

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
                    boardSectionId: createTodoModalState.mode === 'board' ? createTodoModalState.boardSectionId : undefined,
                    parentTodoId: createTodoModalState.mode === 'subtask' ? createTodoModalState.parentId : undefined,
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
                            rows={1}
                            disabled={isLoading}
                            className="w-full text-sm text-gray-500 placeholder-gray-300 border-none outline-none bg-transparent resize-none mt-1"
                        />
                        {/* Option chips */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <PriorityDropdown value={priority} onChange={setPriority} />
                            
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-normal text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors outline-none h-[28px] bg-transparent"
                                />
                            </div>

                            <div className="relative flex-1 min-w-[120px]">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                                                setTags([...tags, tagInput.trim()]);
                                                setTagInput('');
                                            }
                                        }
                                    }}
                                    placeholder="Add tag & press Enter"
                                    className="w-full px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-normal text-gray-600 hover:border-gray-300 focus:border-rose-300 outline-none h-[28px] bg-transparent"
                                />
                            </div>
                        </div>

                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[10px] font-semibold flex items-center gap-1">
                                        {tag}
                                        <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-rose-800">
                                            <X className="w-2.5 h-2.5" />
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
