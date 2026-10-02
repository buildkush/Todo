import { Router } from "express";
import { todoController } from "../controllers/TodoController";
import { validateRequest } from "../middleware/validators";
import {
    createTodoSchema,
    updateTodoSchema,
    moveTodoSchema,
    todoPaginationSchema,
} from "../validators";

// ============================================================================
// TODO ROUTES
// ============================================================================

const router = Router();

/**
 * POST /api/todos
 * Create a new todo
 */
router.post(
    "/",
    validateRequest(createTodoSchema, "body"),
    todoController.createTodo
);

/**
 * GET /api/todos
 * List todos with filtering
 */
router.get(
    "/",
    validateRequest(todoPaginationSchema, "query"),
    todoController.getTodos
);

/**
 * GET /api/todos/:id/subtodos
 * Get sub-todos of a parent todo
 */
router.get("/:id/subtodos", todoController.getSubTodos);

/**
 * GET /api/todos/:id
 * Get a specific todo
 */
router.get("/:id", todoController.getTodo);


/**
 * PUT /api/todos/:id
 * Update a todo
 */
router.put(
    "/:id",
    validateRequest(updateTodoSchema, "body"),
    todoController.updateTodo
);

/**
 * PATCH /api/todos/:id/move
 * Move todo to a different section
 */
router.patch(
    "/:id/move",
    validateRequest(moveTodoSchema, "body"),
    todoController.moveTodo
);

/**
 * DELETE /api/todos/:id
 * Delete a todo
 */
router.delete("/:id", todoController.deleteTodo);

export default router;
