import { Router, Request, Response, NextFunction } from "express";
import { projectController } from "../controllers/ProjectController";
import { sectionController } from "../controllers/SectionController";
import { boardSectionController } from "../controllers/BoardSectionController";
import { validateRequest } from "../middleware/validators";
import {
    createProjectSchema,
    updateProjectSchema,
    projectPaginationSchema,
} from "../validators";

// ============================================================================
// PROJECT ROUTES
// ============================================================================

const router = Router();

/**
 * POST /api/projects
 * Create a new project
 */
router.post(
    "/",
    validateRequest(createProjectSchema, "body"),
    projectController.createProject
);

/**
 * GET /api/projects
 * List projects for current user
 */
router.get(
    "/",
    validateRequest(projectPaginationSchema, "query"),
    projectController.getProjects
);

/**
 * GET /api/projects/:id
 * Get a specific project
 */
router.get("/:id", projectController.getProject);

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put(
    "/:id",
    validateRequest(updateProjectSchema, "body"),
    projectController.updateProject
);

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete("/:id", projectController.deleteProject);

/**
 * GET /api/projects/:id/sections
 * Alias: Get all sections for a project
 */
router.get(
    "/:id/sections",
    (req: Request, _res: Response, next: NextFunction) => {
        req.params.projectId = req.params.id;
        next();
    },
    sectionController.getProjectSections
);

/**
 * GET /api/projects/:id/boardSections
 * Alias: Get all board sections for a project
 */
router.get(
    "/:id/boardSections",
    (req: Request, _res: Response, next: NextFunction) => {
        req.params.projectId = req.params.id;
        next();
    },
    boardSectionController.getProjectBoardSections
);

export default router;
