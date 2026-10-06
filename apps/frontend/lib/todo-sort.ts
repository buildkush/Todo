import { Todo } from '@/lib/api-client';
import { SortOption } from '@/components/SectionSortDropdown';

const PRIORITY_ORDER: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
};

export function sortTodos(todos: Todo[], sortOption: SortOption): Todo[] {
    const list = [...todos];

    switch (sortOption) {
        case 'priority_desc':
            return list.sort((a, b) => {
                const pA = PRIORITY_ORDER[a.priority || 'low'] || 1;
                const pB = PRIORITY_ORDER[b.priority || 'low'] || 1;
                if (pB !== pA) return pB - pA;
                return a.order - b.order;
            });

        case 'priority_asc':
            return list.sort((a, b) => {
                const pA = PRIORITY_ORDER[a.priority || 'low'] || 1;
                const pB = PRIORITY_ORDER[b.priority || 'low'] || 1;
                if (pA !== pB) return pA - pB;
                return a.order - b.order;
            });

        case 'date_asc':
            return list.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return a.order - b.order;
                if (!a.dueDate) return 1; // items with no due date go to bottom
                if (!b.dueDate) return -1;
                const dateA = new Date(a.dueDate).getTime();
                const dateB = new Date(b.dueDate).getTime();
                return dateA - dateB;
            });

        case 'date_desc':
            return list.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return a.order - b.order;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                const dateA = new Date(a.dueDate).getTime();
                const dateB = new Date(b.dueDate).getTime();
                return dateB - dateA;
            });

        case 'title_asc':
            return list.sort((a, b) => a.title.localeCompare(b.title));

        case 'title_desc':
            return list.sort((a, b) => b.title.localeCompare(a.title));

        case 'created_desc':
            return list.sort((a, b) => {
                const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tB - tA;
            });

        case 'created_asc':
            return list.sort((a, b) => {
                const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tA - tB;
            });

        case 'tags_asc':
            return list.sort((a, b) => {
                const tagA = a.tags && a.tags.length > 0 ? a.tags[0].toLowerCase() : 'zzz';
                const tagB = b.tags && b.tags.length > 0 ? b.tags[0].toLowerCase() : 'zzz';
                if (tagA !== tagB) return tagA.localeCompare(tagB);
                return a.order - b.order;
            });

        case 'manual':
        default:
            return list.sort((a, b) => a.order - b.order);
    }
}

export function filterTodosBySearch(todos: Todo[], searchQuery: string): Todo[] {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return todos;

    // Match todo title, description, or tags
    const directMatches = new Set<string>();

    todos.forEach((todo) => {
        const titleMatch = todo.title.toLowerCase().includes(query);
        const descMatch = todo.description ? todo.description.toLowerCase().includes(query) : false;
        const tagMatch = todo.tags ? todo.tags.some((tag) => tag.toLowerCase().includes(query)) : false;

        if (titleMatch || descMatch || tagMatch) {
            directMatches.add(todo.id);
        }
    });

    // Also include parents or children so context is preserved in list view
    const visibleIds = new Set<string>(directMatches);

    // Keep parent of matched child visible
    todos.forEach((todo) => {
        if (directMatches.has(todo.id)) {
            let parentId = todo.parentTodoId;
            while (parentId) {
                visibleIds.add(parentId);
                const parent = todos.find((t) => t.id === parentId);
                parentId = parent ? parent.parentTodoId : undefined;
            }
        }
    });

    return todos.filter((todo) => visibleIds.has(todo.id));
}

export function filterTodosByCriteria(
    todos: Todo[],
    searchQuery: string,
    filterState?: any
): Todo[] {
    let result = filterTodosBySearch(todos, searchQuery);

    if (!filterState) return result;

    // Project Filter
    if (filterState.projectIds && filterState.projectIds.length > 0) {
        result = result.filter((todo) => {
            const pId = todo.projectId || 'inbox';
            return filterState.projectIds.includes(pId);
        });
    }

    // Multi-Tags Filter
    if (filterState.tags && filterState.tags.length > 0) {
        const selectedTagsLower = filterState.tags.map((t: string) => t.toLowerCase());
        result = result.filter((todo) => {
            if (!todo.tags || todo.tags.length === 0) return false;
            return todo.tags.some((tag) => selectedTagsLower.includes(tag.toLowerCase()));
        });
    }

    // Priority Filter
    if (filterState.priorities && filterState.priorities.length > 0) {
        result = result.filter((todo) => {
            const taskPriority = todo.priority || 'low';
            return filterState.priorities.includes(taskPriority);
        });
    }

    // Date Range / Preset Filter
    if (filterState.datePreset && filterState.datePreset !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        result = result.filter((todo) => {
            if (!todo.dueDate) {
                return false;
            }

            const dueDate = new Date(todo.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const dueTime = dueDate.getTime();

            switch (filterState.datePreset) {
                case 'today':
                    return dueTime === todayTime;
                case 'tomorrow': {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    return dueTime === tomorrow.getTime();
                }
                case 'this_week': {
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    return dueTime >= startOfWeek.getTime() && dueTime <= endOfWeek.getTime();
                }
                case 'next_7_days': {
                    const next7Days = new Date(today);
                    next7Days.setDate(today.getDate() + 7);
                    return dueTime >= todayTime && dueTime <= next7Days.getTime();
                }
                case 'overdue':
                    return dueTime < todayTime && !todo.isCompleted;
                case 'custom': {
                    if (filterState.startDate) {
                        const start = new Date(filterState.startDate);
                        start.setHours(0, 0, 0, 0);
                        if (dueTime < start.getTime()) return false;
                    }
                    if (filterState.endDate) {
                        const end = new Date(filterState.endDate);
                        end.setHours(23, 59, 59, 999);
                        if (dueDate.getTime() > end.getTime()) return false;
                    }
                    return true;
                }
                default:
                    return true;
            }
        });
    }

    return result;
}
