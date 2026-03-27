/**
 * API Client Wrapper
 * 
 * Centralizes all API calls to the backend
 * Handles CORS, authentication headers, error responses
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-OK responses
      if (!response.ok) {
        const error: ApiErrorResponse = await response.json().catch(() => ({
          error: 'UnknownError',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message);
      }

      // Parse and return response
      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: Record<string, any>,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: Record<string, any>,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: Record<string, any>,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

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
