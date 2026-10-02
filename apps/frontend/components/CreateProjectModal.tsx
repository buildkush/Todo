'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { X, LayoutList, Grid3x3 } from 'lucide-react';
import { ErrorAlert } from './Layout';

const COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7'];

export function CreateProjectModal() {
    const { isCreateProjectModalOpen, setCreateProjectModalOpen, addProject } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCreateProjectModalOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isCreateProjectModalOpen]);

    if (!isCreateProjectModalOpen) return null;

    const close = () => {
        setCreateProjectModalOpen(false);
        setName('');
        setError(null);
    };

    const canSubmit = name.trim().length > 0 && !isLoading;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const viewType = (formData.get('viewType') as 'list' | 'board') || 'list';
        const description = formData.get('description') as string;
        const color = formData.get('color') as string;

        if (!name.trim()) {
            setError('Project name is required');
            setIsLoading(false);
            return;
        }

        try {
            await addProject(name.trim(), viewType, description?.trim() || undefined, color || undefined);
            close();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={close} />

            <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">New Project</h3>
                    <button onClick={close} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

                    {/* Name */}
                    <div>
                        <label htmlFor="proj-name" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            id="proj-name"
                            name="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Website Redesign"
                            required
                            disabled={isLoading}
                            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 placeholder-gray-300 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="proj-desc" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Description <span className="text-gray-300 normal-case">(optional)</span>
                        </label>
                        <textarea
                            id="proj-desc"
                            name="description"
                            placeholder="Brief description…"
                            rows={2}
                            disabled={isLoading}
                            className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 placeholder-gray-300 resize-none transition-all"
                        />
                    </div>

                    {/* View type */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Default View
                        </label>
                        <div className="flex gap-3">
                            <label className="flex-1 cursor-pointer">
                                <input type="radio" name="viewType" value="list" defaultChecked className="peer sr-only" disabled={isLoading} />
                                <div className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 peer-checked:border-rose-400 peer-checked:bg-rose-50 peer-checked:text-rose-600 hover:bg-gray-50 transition-all cursor-pointer">
                                    <LayoutList className="w-4 h-4" />
                                    List
                                </div>
                            </label>
                            <label className="flex-1 cursor-pointer">
                                <input type="radio" name="viewType" value="board" className="peer sr-only" disabled={isLoading} />
                                <div className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 peer-checked:border-rose-400 peer-checked:bg-rose-50 peer-checked:text-rose-600 hover:bg-gray-50 transition-all cursor-pointer">
                                    <Grid3x3 className="w-4 h-4" />
                                    Board
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Colors */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Color
                        </label>
                        <div className="flex items-center gap-2.5">
                            {COLORS.map(color => (
                                <label key={color} className="cursor-pointer">
                                    <input type="radio" name="color" value={color} className="peer sr-only" disabled={isLoading} />
                                    <div
                                        className="w-7 h-7 rounded-full ring-2 ring-transparent peer-checked:ring-gray-900 peer-checked:ring-offset-2 hover:scale-110 transition-all"
                                        style={{ backgroundColor: color }}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={close}
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
                                canSubmit
                                    ? 'bg-rose-500 hover:bg-rose-600'
                                    : 'bg-rose-300 cursor-not-allowed'
                            }`}
                        >
                            {isLoading ? 'Creating…' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
