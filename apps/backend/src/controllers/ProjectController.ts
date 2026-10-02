import { Request, Response } from "express";
import { projectService } from "../services/ProjectService";
import { asyncHandler } from "../middleware/errorHandler";
import { CreateProjectDto, UpdateProjectDto } from "../types";

// ============================================================================
// PROJECT CONTROLLER
// ============================================================================

export class ProjectController {
    /**
     * POST /api/projects
     * Create a new project
     */
    createProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const data: CreateProjectDto = req.body;

        const project = await projectService.createProject(userId, data);

        res.status(201).json({
            success: true,
            data: project,
        });
    });

    /**
     * GET /api/projects
     * List projects for current user
     */
    getProjects = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const params = (req as any).query;

        const result = await projectService.getProjects(userId, params);

        res.json({
            success: true,
            data: result.data,
            total: result.total,
            skip: result.skip,
            take: result.take,
        });
    });

    /**
     * GET /api/projects/:id
     * Get a specific project
     */
    getProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        const project = await projectService.getProject(id, userId);

        res.json({
            success: true,
            data: project,
        });
    });

    /**
     * PUT /api/projects/:id
     * Update a project
     */
    updateProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;
        const data: UpdateProjectDto = req.body;

        const project = await projectService.updateProject(id, userId, data);

        res.json({
            success: true,
            data: project,
        });
    });

    /**
     * DELETE /api/projects/:id
     * Delete a project (soft delete)
     */
    deleteProject = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        await projectService.deleteProject(id, userId);

        res.json({
            success: true,
            message: "Project deleted successfully",
        });
    });
}

export const projectController = new ProjectController();
