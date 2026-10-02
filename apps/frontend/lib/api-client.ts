/**
 * API Client Wrapper (Axios-based)
 * 
 * Centralizes all API calls to the backend
 * Handles CORS, authentication headers, automatic token refresh, error responses
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
    private axiosInstance: AxiosInstance;
    private isRefreshing = false;
    private failedQueue: any[] = [];

    constructor(baseUrl: string = API_URL) {
        this.axiosInstance = axios.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to attach bearer token
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // Resolve hostname dynamically if on different device
                if (typeof window !== 'undefined') {
                    const hostname = window.location.hostname;
                    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                        config.baseURL = `http://${hostname}:5000/api`;
                    }
                    const token = localStorage.getItem('todo_token');
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle 401 Unauthorized / Token Expiry
        this.axiosInstance.interceptors.response.use(
            (response) => response.data,
            async (error) => {
                const originalRequest = error.config;

                // Handle 401 errors
                if (error.response?.status === 401 && !originalRequest._retry) {
                    // Check if this failed request was to refresh token itself
                    if (originalRequest.url === '/auth/refresh') {
                        this.logout();
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        }
                        return Promise.reject(error);
                    }

                    if (this.isRefreshing) {
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        })
                            .then((token) => {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                                return this.axiosInstance(originalRequest);
                            })
                            .catch((err) => Promise.reject(err));
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('todo_refresh_token') : null;

                    if (!refreshToken) {
                        this.logout();
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        }
                        return Promise.reject(error);
                    }

                    try {
                        const response = await this.axiosInstance.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', {
                            refreshToken,
                        });

                        const data = response as unknown as ApiResponse<{ token: string; refreshToken: string }>;

                        if (data.success && data.data) {
                            const newAccessToken = data.data.token;
                            const newRefreshToken = data.data.refreshToken;

                            if (typeof window !== 'undefined') {
                                localStorage.setItem('todo_token', newAccessToken);
                                localStorage.setItem('todo_refresh_token', newRefreshToken);
                            }

                            this.processQueue(null, newAccessToken);
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            return this.axiosInstance(originalRequest);
                        } else {
                            throw new Error('Refresh token invalid');
                        }
                    } catch (refreshError) {
                        this.processQueue(refreshError, null);
                        this.logout();
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login';
                        }
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                // Format other API errors matching our app pattern
                const apiError = error.response?.data?.message || error.message;
                return Promise.reject(new Error(apiError));
            }
        );
    }

    private processQueue(error: any, token: string | null = null) {
        this.failedQueue.forEach((prom) => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        this.failedQueue = [];
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, options?: any): Promise<T> {
        return this.axiosInstance.get<any, T>(endpoint, options);
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, data?: any, options?: any): Promise<T> {
        return this.axiosInstance.post<any, T>(endpoint, data, options);
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, data?: any, options?: any): Promise<T> {
        return this.axiosInstance.put<any, T>(endpoint, data, options);
    }

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, data?: any, options?: any): Promise<T> {
        return this.axiosInstance.patch<any, T>(endpoint, data, options);
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string, options?: any): Promise<T> {
        return this.axiosInstance.delete<any, T>(endpoint, options);
    }

    // ==================== Projects ====================

    async createProject(
        name: string,
        viewType: 'list' | 'board' = 'list',
        description?: string,
        color?: string
    ) {
        return this.post<ApiResponse<Project>>('/projects', {
            name,
            viewType,
            description,
            color,
        });
    }

    async getProjects() {
        return this.get<ApiResponse<Project[]>>('/projects');
    }

    async getProject(projectId: string) {
        return this.get<ApiResponse<Project>>(`/projects/${projectId}`);
    }

    async updateProject(projectId: string, updates: Partial<Project>) {
        return this.put<ApiResponse<Project>>(`/projects/${projectId}`, updates);
    }

    async deleteProject(projectId: string) {
        return this.delete<ApiResponse<{ id: string }>>(`/projects/${projectId}`);
    }

    // ==================== Sections ====================

    async createSection(
        projectId: string,
        name: string,
        description?: string,
        color?: string
    ) {
        return this.post<ApiResponse<Section>>('/sections', {
            projectId,
            name,
            description,
            color,
        });
    }

    async getSections(projectId: string) {
        return this.get<ApiResponse<Section[]>>(`/sections/project/${projectId}`);
    }

    async getSection(sectionId: string) {
        return this.get<ApiResponse<Section>>(`/sections/${sectionId}`);
    }

    async updateSection(sectionId: string, updates: Partial<Section>) {
        return this.put<ApiResponse<Section>>(`/sections/${sectionId}`, updates);
    }

    async reorderSections(sections: Array<{ id: string; order: number }>) {
        return this.patch<ApiResponse<Section[]>>('/sections/batch/reorder', {
            sections,
        });
    }

    async deleteSection(sectionId: string) {
        return this.delete<ApiResponse<{ id: string }>>(`/sections/${sectionId}`);
    }

    // ==================== Todos ====================

    async createTodo(
        title: string,
        projectId?: string,
        sectionId?: string,
        data?: Partial<Todo>
    ) {
        return this.post<ApiResponse<Todo>>('/todos', {
            title,
            projectId: projectId === 'none' ? undefined : projectId,
            sectionId,
            ...data,
        });
    }

    async getTodos(projectId?: string) {
        const query = projectId ? `?projectId=${projectId}` : '';
        return this.get<ApiResponse<Todo[]>>(`/todos${query}`);
    }

    async getTodo(todoId: string) {
        return this.get<ApiResponse<Todo>>(`/todos/${todoId}`);
    }

    async updateTodo(todoId: string, updates: Partial<Todo>) {
        return this.put<ApiResponse<Todo>>(`/todos/${todoId}`, updates);
    }

    async moveTodo(
        todoId: string,
        newSectionId?: string,
        newBoardSectionId?: string,
        order?: number,
        projectId?: string
    ) {
        return this.patch<ApiResponse<Todo>>(`/todos/${todoId}/move`, {
            sectionId: newSectionId === 'unsectioned' ? null : newSectionId,
            boardSectionId: newBoardSectionId,
            order,
            projectId,
        });
    }

    async deleteTodo(todoId: string) {
        return this.delete<ApiResponse<{ id: string }>>(`/todos/${todoId}`);
    }

    // ==================== Board Sections ====================

    async createBoardSection(
        projectId: string,
        name: string,
        description?: string,
        color?: string
    ) {
        return this.post<ApiResponse<BoardSection>>('/boardSections', {
            projectId,
            name,
            description,
            color,
        });
    }

    async getBoardSections(projectId: string) {
        return this.get<ApiResponse<BoardSection[]>>(
            `/boardSections/project/${projectId}`
        );
    }

    async getBoardSection(boardSectionId: string) {
        return this.get<ApiResponse<BoardSection>>(
            `/boardSections/${boardSectionId}`
        );
    }

    async updateBoardSection(
        boardSectionId: string,
        updates: Partial<BoardSection>
    ) {
        return this.put<ApiResponse<BoardSection>>(
            `/boardSections/${boardSectionId}`,
            updates
        );
    }

    async reorderBoardSections(
        sections: Array<{ id: string; order: number }>
    ) {
        return this.patch<ApiResponse<BoardSection[]>>(
            '/boardSections/batch/reorder',
            { sections }
        );
    }

    async deleteBoardSection(boardSectionId: string) {
        return this.delete<ApiResponse<{ id: string }>>(
            `/boardSections/${boardSectionId}`
        );
    }

    // ==================== Authentication ====================

    async login(email: string, password: string) {
        const response = await this.post<ApiResponse<{ user: any; token: string; refreshToken: string }>>('/auth/login', {
            email,
            password,
        });

        if (response.success && response.data && typeof window !== 'undefined') {
            localStorage.setItem('todo_token', response.data.token);
            localStorage.setItem('todo_refresh_token', response.data.refreshToken);
            localStorage.setItem('todo_user', JSON.stringify(response.data.user));
            window.dispatchEvent(new Event('auth-changed'));
        }

        return response;
    }

    async register(email: string, password: string, name?: string) {
        const response = await this.post<ApiResponse<{ user: any; token: string; refreshToken: string }>>('/auth/register', {
            email,
            password,
            name,
        });

        if (response.success && response.data && typeof window !== 'undefined') {
            localStorage.setItem('todo_token', response.data.token);
            localStorage.setItem('todo_refresh_token', response.data.refreshToken);
            localStorage.setItem('todo_user', JSON.stringify(response.data.user));
            window.dispatchEvent(new Event('auth-changed'));
        }

        return response;
    }

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('todo_token');
            localStorage.removeItem('todo_refresh_token');
            localStorage.removeItem('todo_user');
            window.dispatchEvent(new Event('auth-changed'));
        }
    }

    getCurrentUser() {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('todo_user');
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    isAuthenticated(): boolean {
        if (typeof window !== 'undefined') {
            return !!localStorage.getItem('todo_token');
        }
        return false;
    }
}


/**
 * Type definitions for API responses
 */
export interface Project {
    id: string;
    userId: string;
    name: string;
    description?: string;
    viewType: 'list' | 'board';
    color?: string;
    icon?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface Todo {
    id: string;
    userId: string;
    projectId: string;
    sectionId?: string;
    boardSectionId?: string;
    parentTodoId?: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    order: number;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    deletedAt: string | null;
}

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

export interface BoardSection {
    id: string;
    userId: string;
    projectId: string;
    name: string;
    description?: string;
    order: number;
    color?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    fields?: Record<string, any>;
}

export const apiClient = new ApiClient();
