/**
 * Shared Types for Todo App
 * Used by both frontend and backend
 * 
 * This ensures type consistency across the API boundary
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  theme?: 'light' | 'dark';
  language?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export type ProjectViewType = 'list' | 'board';

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  viewType: ProjectViewType;
  status?: 'active' | 'archived';
  color?: string;
  icon?: string;
  defaultSortOrder?: string;
  showCompletedTodos?: boolean;
  allowDragDropBetweenSections?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  viewType: ProjectViewType;
  color?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: 'active' | 'archived';
  showCompletedTodos?: boolean;
  allowDragDropBetweenSections?: boolean;
}

// ============================================================================
// TODO TYPES
// ============================================================================

export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  userId: string;
  projectId: string;
  sectionId?: string;
  boardSectionId?: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  order: number;
  dueDate?: string;
  priority?: Priority;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deletedAt: string | null;
}

export interface CreateTodoInput {
  projectId: string;
  sectionId?: string;
  boardSectionId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  dueDate?: string;
  priority?: Priority;
}

export interface MoveTodoInput {
  sectionId?: string;
  boardSectionId?: string;
  newOrder?: number;
}

// ============================================================================
// SECTION TYPES (List View)
// ============================================================================

export interface Section {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  isCollapsed: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateSectionInput {
  projectId: string;
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateSectionInput {
  name?: string;
  description?: string;
  color?: string;
  isCollapsed?: boolean;
}

export interface ReorderSectionInput {
  id: string;
  newOrder: number;
}

// ============================================================================
// BOARD SECTION TYPES (Board View)
// ============================================================================

export interface BoardSection {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  wip?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateBoardSectionInput {
  projectId: string;
  name: string;
  description?: string;
  color?: string;
  wip?: number;
}

export interface UpdateBoardSectionInput {
  name?: string;
  description?: string;
  color?: string;
  wip?: number;
}

export interface ReorderBoardSectionInput {
  id: string;
  newOrder: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  total?: number;
  skip?: number;
  take?: number;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  skip?: number;
  take?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}
