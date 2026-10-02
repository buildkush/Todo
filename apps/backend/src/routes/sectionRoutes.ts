import { Router } from "express";
import { sectionController } from "../controllers/SectionController";
import { validateRequest } from "../middleware/validators";
import {
    createSectionSchema,
    updateSectionSchema,
    reorderSectionsSchema,
} from "../validators";

// ============================================================================
// SECTION ROUTES
// ============================================================================

const router = Router();

/**
 * POST /api/sections
 * Create a new section
 */
router.post(
    "/",
    validateRequest(createSectionSchema, "body"),
    sectionController.createSection
);

/**
 * GET /api/projects/:projectId/sections
 * Get all sections for a project
 */
router.get("/project/:projectId", sectionController.getProjectSections);

/**
 * GET /api/sections/:id
 * Get a specific section
 */
router.get("/:id", sectionController.getSection);

/**
 * PUT /api/sections/:id
 * Update a section
 */
router.put(
    "/:id",
    validateRequest(updateSectionSchema, "body"),
    sectionController.updateSection
);

/**
 * PATCH /api/sections/batch/reorder
 * Reorder multiple sections
 */
router.patch(
    "/batch/reorder",
    validateRequest(reorderSectionsSchema, "body"),
    sectionController.reorderSections
);

/**
 * DELETE /api/sections/:id
 * Delete a section
 */
router.delete("/:id", sectionController.deleteSection);

export default router;
