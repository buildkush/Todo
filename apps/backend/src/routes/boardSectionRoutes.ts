import { Router } from "express";
import { boardSectionController } from "../controllers/BoardSectionController";
import { validateRequest } from "../middleware/validators";
import {
    createBoardSectionSchema,
    updateBoardSectionSchema,
    reorderBoardSectionsSchema,
} from "../validators";

// ============================================================================
// BOARD SECTION ROUTES
// ============================================================================

const router = Router();

/**
 * POST /api/boardSections
 * Create a new board section
 */
router.post(
    "/",
    validateRequest(createBoardSectionSchema, "body"),
    boardSectionController.createBoardSection
);

/**
 * GET /api/projects/:projectId/boardSections
 * Get all board sections for a project
 */
router.get("/project/:projectId", boardSectionController.getProjectBoardSections);

/**
 * GET /api/boardSections/:id
 * Get a specific board section
 */
router.get("/:id", boardSectionController.getBoardSection);

/**
 * PUT /api/boardSections/:id
 * Update a board section
 */
router.put(
    "/:id",
    validateRequest(updateBoardSectionSchema, "body"),
    boardSectionController.updateBoardSection
);

/**
 * PATCH /api/boardSections/batch/reorder
 * Reorder multiple board sections
 */
router.patch(
    "/batch/reorder",
    validateRequest(reorderBoardSectionsSchema, "body"),
    boardSectionController.reorderBoardSections
);

/**
 * DELETE /api/boardSections/:id
 * Delete a board section
 */
router.delete("/:id", boardSectionController.deleteBoardSection);

export default router;
