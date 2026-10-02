'use client';

import Link from 'next/link';
import { Plus, LogOut, Inbox as InboxIcon, FolderOpen, PanelLeft, CheckSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useProjects } from '@/hooks/useProjectsHook';
import { useApp } from '@/context/AppContext';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { CreateTodoModal } from '@/components/CreateTodoModal';

interface LayoutProps {
    children: React.ReactNode;
    showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);
    const { isSidebarCollapsed, setSidebarCollapsed, toggleSidebar } = useApp();

    useEffect(() => {
        if (!apiClient.isAuthenticated()) {
            router.push('/login');
        } else {
            setAuthChecked(true);
        }
    }, [router]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarCollapsed(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setSidebarCollapsed]);

    if (!authChecked) {
        return (
            <div className="flex h-screen bg-white items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white font-sans text-gray-800 relative">
            {showSidebar && <Sidebar />}
            {!isSidebarCollapsed && showSidebar && (
                <div
                    onClick={toggleSidebar}
                    className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30 md:hidden animate-in fade-in duration-200"
                />
            )}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {isSidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute top-5 left-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-md transition-colors z-20"
                        title="Open sidebar"
                    >
                        <PanelLeft className="w-4 h-4" />
                    </button>
                )}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
            <CreateProjectModal />
            <CreateTodoModal />
        </div>
    );
}

export function Sidebar() {
    const { projects, loading } = useProjects();
    const { isSidebarCollapsed, setCreateProjectModalOpen, openCreateTodoModal, toggleSidebar } = useApp();
    const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        setUser(apiClient.getCurrentUser());
    }, []);

    const userInitial = user?.name
        ? user.name.charAt(0).toUpperCase()
        : user?.email
        ? user.email.charAt(0).toUpperCase()
        : 'U';
    const userName = user?.name || user?.email?.split('@')[0] || 'User';

    const getActiveProjectId = () => {
        if (pathname?.startsWith('/projects/')) {
            return pathname.split('/')[2];
        }
        return 'none';
    };

    return (
        <aside
            className={`bg-[#fff8f8] flex flex-col h-full transition-all duration-200 ease-in-out overflow-hidden border-r border-rose-100/40 select-none shadow-xl md:shadow-none
                fixed md:relative inset-y-0 left-0 z-40 md:z-auto
                ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-0' : 'translate-x-0 w-56 md:w-56'}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-rose-500 rounded-md flex items-center justify-center flex-shrink-0">
                        <CheckSquare className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                    </div>
                    <span className="font-bold text-sm text-gray-900 tracking-tight">Doneify</span>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-rose-100/30 rounded transition-colors"
                    title="Collapse"
                >
                    <PanelLeft className="w-4 h-4" />
                </button>
            </div>

            {/* Add Task */}
            <div className="px-3 pb-3">
                <button
                    onClick={() => openCreateTodoModal(getActiveProjectId())}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Add task
                </button>
            </div>

            {/* Nav */}
            <nav className="px-2 space-y-0.5">
                <SidebarLink
                    href="/"
                    icon={<InboxIcon className="w-4 h-4" />}
                    label="Inbox"
                    active={pathname === '/'}
                />
            </nav>

            {/* Projects */}
            <div className="mt-5 px-2 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Projects
                    </span>
                    <button
                        onClick={() => setCreateProjectModalOpen(true)}
                        className="p-0.5 text-gray-400 hover:text-gray-700 hover:bg-rose-100/30 rounded transition-colors"
                        title="New project"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="space-y-0.5">
                    {loading ? (
                        <p className="text-xs text-gray-400 px-2 py-1">Loading…</p>
                    ) : projects.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2 py-1">No projects yet</p>
                    ) : (
                        projects.map(project => {
                            const isActive = pathname === `/projects/${project.id}`;
                            return (
                                <SidebarLink
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    icon={<FolderOpen className="w-4 h-4" />}
                                    label={project.id.startsWith('optimistic-project-') ? `${project.name}...` : project.name}
                                    active={isActive}
                                    disabled={project.id.startsWith('optimistic-project-')}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* User */}
            <div className="p-3 border-t border-rose-100/50">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate leading-none">{userName}</p>
                        <p className="text-[10px] text-gray-400 truncate leading-none mt-0.5">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => {
                            apiClient.logout();
                            window.location.href = '/login';
                        }}
                        className="p-1 text-gray-400 hover:text-rose-500 rounded transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

interface SidebarLinkProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
    disabled?: boolean;
}

function SidebarLink({ href, icon, label, active, disabled = false }: SidebarLinkProps) {
    const className = `flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
        disabled
            ? 'text-gray-400 cursor-wait'
            : active
                ? 'bg-rose-50/80 text-rose-600'
                : 'text-gray-600 hover:bg-rose-50/40 hover:text-gray-900'
    }`;

    if (disabled) {
        return (
            <div className={className} aria-disabled="true">
                <span className="text-gray-400">{icon}</span>
                <span className="truncate">{label}</span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={className}
        >
            <span className={active ? 'text-rose-500' : 'text-gray-400'}>{icon}</span>
            <span className="truncate">{label}</span>
        </Link>
    );
}

export function Header() {
    return null;
}

interface LoadingProps {
    message?: string;
}

export function LoadingSpinner({ message }: LoadingProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-rose-200 border-t-rose-500 animate-spin" />
            {message && <p className="text-xs text-gray-400">{message}</p>}
        </div>
    );
}

interface ErrorAlertProps {
    title?: string;
    message: string;
    onDismiss?: () => void;
}

export function ErrorAlert({ title, message, onDismiss }: ErrorAlertProps) {
    return (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4 flex items-start justify-between">
            <div>
                {title && <p className="text-xs font-semibold text-red-700 mb-0.5">{title}</p>}
                <p className="text-xs text-red-600">{message}</p>
            </div>
            {onDismiss && (
                <button onClick={onDismiss} className="text-red-400 hover:text-red-600 ml-3 text-sm leading-none">
                    ✕
                </button>
            )}
        </div>
    );
}

interface SuccessAlertProps {
    message: string;
    onDismiss?: () => void;
}

export function SuccessAlert({ message, onDismiss }: SuccessAlertProps) {
    return (
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 mb-4 flex items-start justify-between">
            <p className="text-xs text-green-700">✓ {message}</p>
            {onDismiss && (
                <button onClick={onDismiss} className="text-green-400 hover:text-green-600 ml-3 text-sm leading-none">
                    ✕
                </button>
            )}
        </div>
    );
}
