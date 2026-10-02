import { PrismaClient } from "@prisma/client";
import {
    CreateProjectDto,
    UpdateProjectDto,
    ProjectResponse,
    PaginatedResponse,
    NotFoundError,
    ForbiddenError,
} from "../types";

const prisma = new PrismaClient();

// ============================================================================
// PROJECT SERVICE
// ============================================================================

export class ProjectService {
    /**
     * Create a new project
     */
    async createProject(
        userId: string,
        data: CreateProjectDto
    ): Promise<ProjectResponse> {
        const project = await prisma.project.create({
            data: {
                userId,
                name: data.name,
                description: data.description || null,
                viewType: data.viewType,
                color: data.color || null,
                icon: data.icon || null,
                status: "active",
                defaultSortOrder: "manual",
                showCompletedTodos: true,
                allowDragDropBetweenSections: true,
            },
        });

        return this.formatProjectResponse(project);
    }

    /**
     * Get all projects for a user
     */
    async getProjects(
        userId: string,
        params: {
            skip: number;
            take: number;
            sortBy: "createdAt" | "name";
            sortOrder: "asc" | "desc";
        }
    ): Promise<PaginatedResponse<ProjectResponse>> {
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where: {
                    userId,
                    deletedAt: null,
                },
                skip: params.skip,
                take: params.take,
                orderBy: {
                    [params.sortBy]: params.sortOrder,
                },
            }),
            prisma.project.count({
                where: {
                    userId,
                    deletedAt: null,
                },
            }),
        ]);

        return {
            data: projects.map((p) => this.formatProjectResponse(p)),
            total,
            skip: params.skip,
            take: params.take,
        };
    }

    /**
     * Get a single project
     */
    async getProject(projectId: string, userId: string): Promise<ProjectResponse> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project || project.deletedAt) {
            throw new NotFoundError("Project");
        }

        if (project.userId !== userId) {
            throw new ForbiddenError("You don't have access to this project");
        }

        return this.formatProjectResponse(project);
    }

    /**
     * Update a project
     */
    async updateProject(
        projectId: string,
        userId: string,
        data: UpdateProjectDto
    ): Promise<ProjectResponse> {
        // Verify ownership
        await this.getProject(projectId, userId);

        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                name: data.name,
                description: data.description,
                viewType: data.viewType,
                color: data.color,
                icon: data.icon,
                defaultSortOrder: data.defaultSortOrder,
                showCompletedTodos: data.showCompletedTodos,
                allowDragDropBetweenSections: data.allowDragDropBetweenSections,
            },
        });

        return this.formatProjectResponse(project);
    }

    /**
     * Soft delete a project
     */
    async deleteProject(projectId: string, userId: string): Promise<void> {
        // Verify ownership
        await this.getProject(projectId, userId);

        await prisma.project.update({
            where: { id: projectId },
            data: { deletedAt: new Date() },
        });
    }

    /**
     * Format project response
     */
    private formatProjectResponse(project: any): ProjectResponse {
        return {
            id: project.id,
            userId: project.userId,
            name: project.name,
            description: project.description,
            viewType: project.viewType,
            status: project.status,
            color: project.color,
            icon: project.icon,
            defaultSortOrder: project.defaultSortOrder,
            showCompletedTodos: project.showCompletedTodos,
            allowDragDropBetweenSections: project.allowDragDropBetweenSections,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            deletedAt: project.deletedAt ? project.deletedAt.toISOString() : null,
        };
    }
}

export const projectService = new ProjectService();
