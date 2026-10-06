// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    skip: number;
    take: number;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface CreateProjectDto {
    name: string;
    description?: string;
    viewType: "list" | "board" | "calendar";
    color?: string;
    icon?: string;
    availableTags?: string[];
}

export interface UpdateProjectDto {
    name?: string;
    description?: string;
    viewType?: "list" | "board" | "calendar";
    color?: string;
    icon?: string;
    defaultSortOrder?: string;
    showCompletedTodos?: boolean;
    allowDragDropBetweenSections?: boolean;
    availableTags?: string[];
}

export interface ProjectResponse {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    viewType: string;
    status: string;
    color: string | null;
    icon: string | null;
    defaultSortOrder: string | null;
    showCompletedTodos: boolean;
    allowDragDropBetweenSections: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// ============================================================================
// TODO TYPES
// ============================================================================

export interface CreateTodoDto {
    title: string;
    description?: string;
    projectId?: string;
    sectionId?: string;
    boardSectionId?: string;
    parentTodoId?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
    order?: number;
    tags?: string[];
    customSections?: Record<string, any>;
}

export interface UpdateTodoDto {
    title?: string;
    description?: string;
    isCompleted?: boolean;
    projectId?: string;
    sectionId?: string;
    parentTodoId?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
    order?: number;
    tags?: string[];
    customSections?: Record<string, any>;
}

export interface TodoResponse {
    id: string;
    userId: string;
    projectId: string | null;
    sectionId: string | null;
    boardSectionId: string | null;
    parentTodoId: string | null;
    title: string;
    description: string | null;
    isCompleted: boolean;
    priority: string | null;
    dueDate: string | null;
    tags?: string[];
    customSections?: Record<string, any> | null;
    order: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// ============================================================================
// SECTION TYPES
// ============================================================================

export interface CreateSectionDto {
    projectId: string;
    name: string;
    order?: number;
}

export interface UpdateSectionDto {
    name?: string;
    order?: number;
}

export interface SectionResponse {
    id: string;
    projectId: string | null;
    userId: string;
    name: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// ============================================================================
// BOARD SECTION TYPES
// ============================================================================

export interface CreateBoardSectionDto {
    projectId: string;
    name: string;
    color?: string;
    order?: number;
}

export interface UpdateBoardSectionDto {
    name?: string;
    color?: string;
    order?: number;
}

export interface BoardSectionResponse {
    id: string;
    projectId: string;
    userId: string;
    name: string;
    color: string | null;
    order: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code: string = "INTERNAL_ERROR"
    ) {
        super(message);
        this.name = "AppError";
    }
}

export class ValidationError extends AppError {
    constructor(message: string, public fields?: Record<string, string>) {
        super(400, message, "VALIDATION_ERROR");
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(404, `${resource} not found`, "NOT_FOUND");
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(401, message, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(403, message, "FORBIDDEN");
    }
}
