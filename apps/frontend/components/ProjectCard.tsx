'use client';

import { Project } from '@/lib/api-client';
import { ChevronRight, Trash2, LayoutList, Grid3x3 } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
    project: Project;
    onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
    return (
        <Link href={`/projects/${project.id}`}>
            <div className="group p-6 border border-gray-200 rounded-xl hover:shadow-lg hover:border-[#E08870] transition-all cursor-pointer bg-white">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-[#E08870] transition-colors">
                            {project.name}
                        </h3>
                        {project.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {project.description}
                            </p>
                        )}
                    </div>
                    {project.color && (
                        <div
                            className="w-4 h-4 rounded-full flex-shrink-0 ml-3"
                            style={{ backgroundColor: project.color }}
                        />
                    )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        {project.viewType === 'board' ? (
                            <>
                                <Grid3x3 className="w-4 h-4" />
                                <span>Board</span>
                            </>
                        ) : (
                            <>
                                <LayoutList className="w-4 h-4" />
                                <span>List</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {onDelete && (
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    onDelete(project.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#E08870] transition-colors" />
                    </div>
                </div>
            </div>
        </Link>
    );
}

interface ProjectFormProps {
    onSubmit: (data: { name: string; viewType: 'list' | 'board'; description?: string; color?: string }) => void;
    isLoading?: boolean;
}

export function ProjectForm({ onSubmit, isLoading = false }: ProjectFormProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const viewType = (formData.get('viewType') as 'list' | 'board') || 'list';
        const description = formData.get('description') as string;
        const color = formData.get('color') as string;

        if (name.trim()) {
            onSubmit({
                name,
                viewType,
                description: description || undefined,
                color: color || undefined,
            });
            e.currentTarget.reset();
        }
    };

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#6C5CE7', '#A29BFE'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white border border-gray-200 rounded-xl">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Project name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E08870] text-sm"
                    disabled={isLoading}
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                </label>
                <textarea
                    id="description"
                    name="description"
                    placeholder="What's this project about?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E08870] text-sm resize-none"
                    disabled={isLoading}
                />
            </div>

            <div>
                <label htmlFor="viewType" className="block text-sm font-medium text-gray-700 mb-2">
                    Layout
                </label>
                <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer group">
                        <input
                            type="radio"
                            name="viewType"
                            value="list"
                            defaultChecked
                            className="hidden"
                            disabled={isLoading}
                        />
                        <div className="p-3 border-2 border-gray-300 rounded-lg group-has-[:checked]:border-[#E08870] group-has-[:checked]:bg-orange-50 transition-colors text-center">
                            <LayoutList className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">List</span>
                        </div>
                    </label>
                    <label className="flex-1 cursor-pointer group">
                        <input
                            type="radio"
                            name="viewType"
                            value="board"
                            className="hidden"
                            disabled={isLoading}
                        />
                        <div className="p-3 border-2 border-gray-300 rounded-lg group-has-[:checked]:border-[#E08870] group-has-[:checked]:bg-orange-50 transition-colors text-center">
                            <Grid3x3 className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Board</span>
                        </div>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color (optional)</label>
                <div className="flex gap-2 flex-wrap">
                    {colors.map(color => (
                        <label key={color} className="cursor-pointer group">
                            <input
                                type="radio"
                                name="color"
                                value={color}
                                className="hidden"
                                disabled={isLoading}
                            />
                            <div
                                className="w-8 h-8 rounded-full border-2 border-gray-300 group-has-[:checked]:border-gray-900 transition-all"
                                style={{ backgroundColor: color }}
                            />
                        </label>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-[#E08870] text-white rounded-lg hover:bg-[#D67860] disabled:bg-gray-400 transition-colors font-medium text-sm"
            >
                {isLoading ? 'Creating...' : 'Add'}
            </button>
        </form>
    );
}

interface ProjectListProps {
    projects: Project[];
    isLoading?: boolean;
    onDelete?: (id: string) => void;
}

export function ProjectList({ projects, isLoading, onDelete }: ProjectListProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E08870]" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white rounded-xl border border-gray-100">
                <div className="mb-4">
                    <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <p className="font-semibold text-lg text-gray-700 mb-2">No projects yet</p>
                <p className="text-sm text-gray-600">Create your first project to get started!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} onDelete={onDelete} />
            ))}
        </div>
    );
}
