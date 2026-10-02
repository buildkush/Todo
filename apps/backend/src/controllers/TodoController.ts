import { Request, Response } from "express";
import { todoService } from "../services/TodoService";
import { asyncHandler } from "../middleware/errorHandler";
import { CreateTodoDto, UpdateTodoDto } from "../types";

// ============================================================================
// TODO CONTROLLER
// ============================================================================

export class TodoController {
    /**
     * POST /api/todos
     * Create a new todo
     */
    createTodo = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const data: CreateTodoDto = req.body;

        const todo = await todoService.createTodo(userId, data);

        res.status(201).json({
            success: true,
            data: todo,
        });
    });

    /**
     * GET /api/todos
     * List todos with filtering
     */
    getTodos = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const params = (req as any).query;

        const result = await todoService.getTodos(userId, params);

        res.json({
            success: true,
            data: result.data,
            total: result.total,
            skip: result.skip,
            take: result.take,
        });
    });

    /**
     * GET /api/todos/:id
     * Get a specific todo
     */
    getTodo = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        const todo = await todoService.getTodo(id, userId);

        res.json({
            success: true,
            data: todo,
        });
    });

    /**
     * GET /api/todos/:id/subtodos
     * Get sub-todos of a parent todo
     */
    getSubTodos = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        const todos = await todoService.getSubTodos(id, userId);

        res.json({
            success: true,
            data: todos,
        });
    });

    /**
     * PUT /api/todos/:id
     * Update a todo
     */
    updateTodo = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;
        const data: UpdateTodoDto = req.body;

        const todo = await todoService.updateTodo(id, userId, data);

        res.json({
            success: true,
            data: todo,
        });
    });

    /**
     * PATCH /api/todos/:id/move
     * Move todo to a different section
     */
    moveTodo = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;
        const data = req.body;

        const todo = await todoService.moveTodo(id, userId, data);

        res.json({
            success: true,
            data: todo,
        });
    });

    /**
     * DELETE /api/todos/:id
     * Delete a todo (soft delete)
     */
    deleteTodo = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        await todoService.deleteTodo(id, userId);

        res.json({
            success: true,
            message: "Todo deleted successfully",
        });
    });
}

export const todoController = new TodoController();
