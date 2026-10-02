import { Request, Response } from "express";
import { boardSectionService } from "../services/BoardSectionService";
import { asyncHandler } from "../middleware/errorHandler";
import { CreateBoardSectionDto, UpdateBoardSectionDto } from "../types";

// ============================================================================
// BOARD SECTION CONTROLLER
// ============================================================================

export class BoardSectionController {
    /**
     * POST /api/boardSections
     * Create a new board section
     */
    createBoardSection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const data: CreateBoardSectionDto = req.body;

        const boardSection = await boardSectionService.createBoardSection(
            userId,
            data
        );

        res.status(201).json({
            success: true,
            data: boardSection,
        });
    });

    /**
     * GET /api/projects/:projectId/boardSections
     * Get all board sections for a project
     */
    getProjectBoardSections = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { projectId } = req.params;

        const boardSections = await boardSectionService.getProjectBoardSections(
            userId,
            projectId
        );

        res.json({
            success: true,
            data: boardSections,
        });
    });

    /**
     * GET /api/boardSections/:id
     * Get a specific board section
     */
    getBoardSection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        const boardSection = await boardSectionService.getBoardSection(id, userId);

        res.json({
            success: true,
            data: boardSection,
        });
    });

    /**
     * PUT /api/boardSections/:id
     * Update a board section
     */
    updateBoardSection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;
        const data: UpdateBoardSectionDto = req.body;

        const boardSection = await boardSectionService.updateBoardSection(
            id,
            userId,
            data
        );

        res.json({
            success: true,
            data: boardSection,
        });
    });

    /**
     * PATCH /api/boardSections/batch/reorder
     * Reorder multiple board sections
     */
    reorderBoardSections = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { boardSections } = req.body;

        const updated = await boardSectionService.reorderBoardSections(
            userId,
            boardSections
        );

        res.json({
            success: true,
            data: updated,
        });
    });

    /**
     * DELETE /api/boardSections/:id
     * Delete a board section (soft delete)
     */
    deleteBoardSection = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).userId;
        const { id } = req.params;

        await boardSectionService.deleteBoardSection(id, userId);

        res.json({
            success: true,
            message: "Board section deleted successfully",
        });
    });
}

export const boardSectionController = new BoardSectionController();
