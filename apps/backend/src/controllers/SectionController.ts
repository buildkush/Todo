import { Request, Response } from "express";
import { sectionService } from "../services/SectionService";
import { asyncHandler } from "../middleware/errorHandler";
import { CreateSectionDto, UpdateSectionDto } from "../types";

// ============================================================================
// SECTION CONTROLLER
// ============================================================================

export class SectionController {
    /**
     * POST /api/sections
     * Create a new section
     */
    createSection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const data: CreateSectionDto = req.body;

        const section = await sectionService.createSection(userId, data);

        res.status(201).json({
            success: true,
            data: section,
        });
    });

    /**
     * GET /api/projects/:projectId/sections
     * Get all sections for a project
     */
    getProjectSections = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId } = req.params;

        const sections = await sectionService.getProjectSections(userId, projectId);

        res.json({
            success: true,
            data: sections,
        });
    });

    /**
     * GET /api/sections/:id
     * Get a specific section
     */
    getSection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        const section = await sectionService.getSection(id, userId);

        res.json({
            success: true,
            data: section,
        });
    });

    /**
     * PUT /api/sections/:id
     * Update a section
     */
    updateSection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;
        const data: UpdateSectionDto = req.body;

        const section = await sectionService.updateSection(id, userId, data);

        res.json({
            success: true,
            data: section,
        });
    });

    /**
     * PATCH /api/sections/batch/reorder
     * Reorder multiple sections
     */
    reorderSections = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { sections } = req.body;

        const updated = await sectionService.reorderSections(userId, sections);

        res.json({
            success: true,
            data: updated,
        });
    });

    /**
     * DELETE /api/sections/:id
     * Delete a section (soft delete)
     */
    deleteSection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        await sectionService.deleteSection(id, userId);

        res.json({
            success: true,
            message: "Section deleted successfully",
        });
    });
}

export const sectionController = new SectionController();
