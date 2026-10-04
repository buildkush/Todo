import { z } from "zod";

// ============================================================================
// PROJECT VALIDATORS
// ============================================================================

export const createProjectSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    description: z.string().max(500, "Description too long").optional(),
    viewType: z.enum(["list", "board", "calendar"], {
        errorMap: () => ({ message: 'viewType must be "list", "board", or "calendar"' }),
    }),
    color: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
        .optional(),
    icon: z.string().max(50, "Icon name too long").optional(),
    availableTags: z.array(z.string()).optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    viewType: z.enum(["list", "board", "calendar"]).optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    icon: z.string().max(50).optional(),
    defaultSortOrder: z.string().optional(),
    showCompletedTodos: z.boolean().optional(),
    allowDragDropBetweenSections: z.boolean().optional(),
    availableTags: z.array(z.string()).optional(),
});

export const projectPaginationSchema = z.object({
    skip: z.coerce.number().int().min(0).default(0),
    take: z.coerce.number().int().min(1).max(100).default(50),
    sortBy: z.enum(["createdAt", "name"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// TODO VALIDATORS
// ============================================================================

export const createTodoSchema = z.object({
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().max(2000).optional(),
    projectId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    boardSectionId: z.string().uuid().optional(),
    parentTodoId: z.string().uuid().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    dueDate: z.string().datetime().optional(),
    order: z.number().int().min(0).optional(),
    tags: z.array(z.string()).optional(),
    customSections: z.record(z.any()).optional(),
});

export const updateTodoSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional(),
    isCompleted: z.boolean().optional(),
    projectId: z.string().uuid().nullable().optional(),
    sectionId: z.string().uuid().nullable().optional(),
    parentTodoId: z.string().uuid().nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    dueDate: z.string().datetime().optional(),
    order: z.number().int().min(0).optional(),
    tags: z.array(z.string()).optional(),
    customSections: z.record(z.any()).nullable().optional(),
});

export const moveTodoSchema = z.object({
    projectId: z.string().uuid().nullable().optional(),
    sectionId: z.string().uuid().nullable().optional(),
    boardSectionId: z.string().uuid().nullable().optional(),
    parentTodoId: z.string().uuid().nullable().optional(),
    order: z.number().int().min(0).optional(),
});

export const todoPaginationSchema = z.object({
    skip: z.coerce.number().int().min(0).default(0),
    take: z.coerce.number().int().min(1).max(100).default(50),
    projectId: z.string().optional(),
    sectionId: z.string().uuid().optional(),
    boardSectionId: z.string().uuid().optional(),
    isCompleted: z.coerce.boolean().optional(),
    sortBy: z.enum(["createdAt", "order", "priority"]).default("order"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ============================================================================
// SECTION VALIDATORS
// ============================================================================

export const createSectionSchema = z.object({
    projectId: z.string().uuid("Invalid project ID").or(z.literal("none")),
    name: z.string().min(1, "Name is required").max(100),
    order: z.number().int().min(0).optional(),
});

export const updateSectionSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    order: z.number().int().min(0).optional(),
});

export const reorderSectionsSchema = z.object({
    sections: z.array(
        z.object({
            id: z.string().uuid(),
            order: z.number().int().min(0),
        })
    ),
});

// ============================================================================
// BOARD SECTION VALIDATORS
// ============================================================================

export const createBoardSectionSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
    name: z.string().min(1, "Name is required").max(100),
    color: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
    order: z.number().int().min(0).optional(),
});

export const updateBoardSectionSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    order: z.number().int().min(0).optional(),
});

export const reorderBoardSectionsSchema = z.object({
    boardSections: z.array(
        z.object({
            id: z.string().uuid(),
            order: z.number().int().min(0),
        })
    ),
});

// ============================================================================
// AUTH VALIDATORS
// ============================================================================

export const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
    name: z.string().min(1, "Name is required").max(100).optional(),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

