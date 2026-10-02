import { PrismaClient } from "@prisma/client";
import {
    CreateTodoDto,
    UpdateTodoDto,
    TodoResponse,
    PaginatedResponse,
    NotFoundError,
    ForbiddenError,
    ValidationError,
} from "../types";

const prisma = new PrismaClient();

// ============================================================================
// TODO SERVICE
// ============================================================================

export class TodoService {
    /**
     * Create a new todo
     */
    async createTodo(
        userId: string,
        data: CreateTodoDto
    ): Promise<TodoResponse> {
        // Verify project ownership if projectId provided
        if (data.projectId) {
            const project = await prisma.project.findUnique({
                where: { id: data.projectId },
            });

            if (!project || project.userId !== userId || project.deletedAt) {
                throw new ForbiddenError("Invalid or inaccessible project");
            }
        }

        // Get the next order for the todo
        let order = data.order ?? 0;
        if (!data.order) {
            const lastTodo = await prisma.todo.findFirst({
                where: {
                    userId,
                    sectionId: data.sectionId || null,
                    boardSectionId: data.boardSectionId || null,
                    deletedAt: null,
                },
                orderBy: { order: "desc" },
            });
            order = (lastTodo?.order ?? -1) + 1;
        }

        const todo = await prisma.todo.create({
            data: {
                userId,
                projectId: data.projectId || null,
                sectionId: data.sectionId || null,
                boardSectionId: data.boardSectionId || null,
                parentTodoId: data.parentTodoId || null,
                title: data.title,
                description: data.description || null,
                priority: data.priority || null,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                order,
                isCompleted: false,
            },
        });

        return this.formatTodoResponse(todo);
    }

    /**
     * Get todos with filtering and pagination
     */
    async getTodos(
        userId: string,
        params: {
            skip: number;
            take: number;
            projectId?: string;
            sectionId?: string;
            boardSectionId?: string;
            isCompleted?: boolean;
            sortBy: "createdAt" | "order" | "priority";
            sortOrder: "asc" | "desc";
        }
    ): Promise<PaginatedResponse<TodoResponse>> {
        const where: any = {
            userId,
            deletedAt: null,
        };

        if (params.projectId) {
            if (params.projectId === "none") {
                where.projectId = null;
            } else {
                where.projectId = params.projectId;
            }
        }
        if (params.sectionId) where.sectionId = params.sectionId;
        if (params.boardSectionId) where.boardSectionId = params.boardSectionId;
        if (params.isCompleted !== undefined) where.isCompleted = params.isCompleted;

        const [todos, total] = await Promise.all([
            prisma.todo.findMany({
                where,
                skip: params.skip,
                take: params.take,
                orderBy: {
                    [params.sortBy]: params.sortOrder,
                },
            }),
            prisma.todo.count({ where }),
        ]);

        return {
            data: todos.map((t) => this.formatTodoResponse(t)),
            total,
            skip: params.skip,
            take: params.take,
        };
    }

    /**
     * Get a single todo
     */
    async getTodo(todoId: string, userId: string): Promise<TodoResponse> {
        const todo = await prisma.todo.findUnique({
            where: { id: todoId },
        });

        if (!todo || todo.deletedAt) {
            throw new NotFoundError("Todo");
        }

        if (todo.userId !== userId) {
            throw new ForbiddenError("You don't have access to this todo");
        }

        return this.formatTodoResponse(todo);
    }

    /**
     * Update a todo
     */
    async updateTodo(
        todoId: string,
        userId: string,
        data: UpdateTodoDto
    ): Promise<TodoResponse> {
        // Verify ownership
        const currentTodo = await this.getTodo(todoId, userId);

        if (data.parentTodoId) {
            if (data.parentTodoId === todoId) {
                throw new ValidationError("A task cannot be a sub-task of itself");
            }
            let currentParentId: string | null = data.parentTodoId;
            const visited = new Set<string>([todoId]);
            while (currentParentId) {
                if (visited.has(currentParentId)) {
                    throw new ValidationError("Cyclic task hierarchy detected");
                }
                visited.add(currentParentId);
                const parentTodo: { parentTodoId: string | null } | null = await prisma.todo.findUnique({
                    where: { id: currentParentId },
                    select: { parentTodoId: true }
                });
                currentParentId = parentTodo?.parentTodoId || null;
            }
        }

        let targetOrder = data.order;
        if (targetOrder === undefined && (data.projectId !== undefined || data.sectionId !== undefined || data.parentTodoId !== undefined)) {
            const projId = data.projectId !== undefined ? data.projectId : currentTodo.projectId;
            const secId = data.sectionId !== undefined ? data.sectionId : currentTodo.sectionId;
            const parentId = data.parentTodoId !== undefined ? data.parentTodoId : currentTodo.parentTodoId;
            
            const lastTodo = await prisma.todo.findFirst({
                where: {
                    userId,
                    projectId: projId || null,
                    sectionId: secId || null,
                    parentTodoId: parentId || null,
                    deletedAt: null,
                },
                orderBy: { order: "desc" }
            });
            targetOrder = (lastTodo?.order ?? -1) + 1;
        }

        const todo = await prisma.todo.update({
            where: { id: todoId },
            data: {
                title: data.title,
                description: data.description,
                isCompleted: data.isCompleted,
                projectId: data.projectId !== undefined ? data.projectId : undefined,
                sectionId: data.sectionId !== undefined ? data.sectionId : undefined,
                boardSectionId: null, // Clear deprecated field
                parentTodoId: data.parentTodoId !== undefined ? data.parentTodoId : undefined,
                priority: data.priority,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                order: targetOrder !== undefined ? targetOrder : undefined,
            },
        });

        if (targetOrder !== undefined) {
            await this.reorderSiblings(userId, todo.id, todo.projectId, todo.sectionId, todo.parentTodoId, targetOrder);
        }

        // Auto-complete parent if all siblings are done
        if (data.isCompleted && todo.parentTodoId) {
            const siblings = await prisma.todo.findMany({
                where: { parentTodoId: todo.parentTodoId, deletedAt: null }
            });
            const allDone = siblings.every(s => s.isCompleted);
            if (allDone) {
                await prisma.todo.update({
                    where: { id: todo.parentTodoId },
                    data: { isCompleted: true }
                });
            }
        }

        return this.formatTodoResponse(todo);
    }

    /**
     * Move todo to a different section
     */
    async moveTodo(
        todoId: string,
        userId: string,
        data: {
            projectId?: string | null;
            sectionId?: string | null;
            boardSectionId?: string | null;
            parentTodoId?: string | null;
            order?: number;
        }
    ): Promise<TodoResponse> {
        // Verify ownership
        await this.getTodo(todoId, userId);

        if (data.parentTodoId) {
            if (data.parentTodoId === todoId) {
                throw new ValidationError("A task cannot be a sub-task of itself");
            }
            let currentParentId: string | null = data.parentTodoId;
            const visited = new Set<string>([todoId]);
            while (currentParentId) {
                if (visited.has(currentParentId)) {
                    throw new ValidationError("Cyclic task hierarchy detected");
                }
                visited.add(currentParentId);
                const parentTodo: { parentTodoId: string | null } | null = await prisma.todo.findUnique({
                    where: { id: currentParentId },
                    select: { parentTodoId: true }
                });
                currentParentId = parentTodo?.parentTodoId || null;
            }
        }

        let targetOrder = data.order;
        if (targetOrder === undefined && (data.projectId !== undefined || data.sectionId !== undefined || data.parentTodoId !== undefined)) {
            const currentTodo = await prisma.todo.findUnique({ where: { id: todoId } });
            if (currentTodo) {
                const projId = data.projectId !== undefined ? data.projectId : currentTodo.projectId;
                const secId = data.sectionId !== undefined ? data.sectionId : currentTodo.sectionId;
                const parentId = data.parentTodoId !== undefined ? data.parentTodoId : currentTodo.parentTodoId;
                
                const lastTodo = await prisma.todo.findFirst({
                    where: {
                        userId,
                        projectId: projId || null,
                        sectionId: secId || null,
                        parentTodoId: parentId || null,
                        deletedAt: null,
                    },
                    orderBy: { order: "desc" }
                });
                targetOrder = (lastTodo?.order ?? -1) + 1;
            }
        }

        const updateData: any = {};
        if (data.sectionId !== undefined) updateData.sectionId = data.sectionId;
        if (data.boardSectionId !== undefined) updateData.boardSectionId = data.boardSectionId;
        if (data.parentTodoId !== undefined) updateData.parentTodoId = data.parentTodoId;
        if (data.projectId !== undefined) updateData.projectId = data.projectId;
        if (targetOrder !== undefined) updateData.order = targetOrder;
        updateData.boardSectionId = null; // Clear deprecated field on move

        const todo = await prisma.todo.update({
            where: { id: todoId },
            data: updateData,
        });

        if (targetOrder !== undefined) {
            await this.reorderSiblings(userId, todo.id, todo.projectId, todo.sectionId, todo.parentTodoId, targetOrder);
            const finalTodo = await prisma.todo.findUnique({ where: { id: todoId } });
            return this.formatTodoResponse(finalTodo);
        }

        return this.formatTodoResponse(todo);
    }

    /**
     * Soft delete a todo
     */
    async deleteTodo(todoId: string, userId: string): Promise<void> {
        // Verify ownership
        await this.getTodo(todoId, userId);

        await prisma.todo.update({
            where: { id: todoId },
            data: { deletedAt: new Date() },
        });
    }

    private async reorderSiblings(
        userId: string,
        todoId: string,
        projectId: string | null,
        sectionId: string | null,
        parentTodoId: string | null,
        targetOrder: number
    ): Promise<void> {
        const siblings = await prisma.todo.findMany({
            where: {
                userId,
                projectId,
                sectionId,
                parentTodoId,
                deletedAt: null,
                NOT: { id: todoId }
            },
            orderBy: { order: 'asc' }
        });

        const reordered = [...siblings];
        const insertIndex = Math.min(Math.max(0, targetOrder), reordered.length);
        reordered.splice(insertIndex, 0, { id: todoId } as any);

        await Promise.all(
            reordered.map((todo, index) => 
                prisma.todo.update({
                    where: { id: todo.id },
                    data: { order: index }
                })
            )
        );
    }

    /**
     * Format todo response
     */
    private formatTodoResponse(todo: any): TodoResponse {
        return {
            id: todo.id,
            userId: todo.userId,
            projectId: todo.projectId,
            sectionId: todo.sectionId,
            boardSectionId: todo.boardSectionId,
            parentTodoId: todo.parentTodoId || null,
            title: todo.title,
            description: todo.description,
            isCompleted: todo.isCompleted,
            priority: todo.priority,
            dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
            order: todo.order,
            createdAt: todo.createdAt.toISOString(),
            updatedAt: todo.updatedAt.toISOString(),
            deletedAt: todo.deletedAt ? todo.deletedAt.toISOString() : null,
        };
    }

    async getSubTodos(todoId: string, userId: string): Promise<TodoResponse[]> {
        const todos = await prisma.todo.findMany({
            where: { parentTodoId: todoId, userId, deletedAt: null },
            orderBy: { order: 'asc' },
        });
        return todos.map(t => this.formatTodoResponse(t));
    }
}

export const todoService = new TodoService();
