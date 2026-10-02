import { Router } from "express";
import { authController } from "../controllers/AuthController";
import { validateRequest } from "../middleware/validators";
import { registerSchema, loginSchema } from "../validators";

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
    "/register",
    validateRequest(registerSchema, "body"),
    authController.register
);

/**
 * POST /api/auth/login
 * Login user and get token
 */
router.post(
    "/login",
    validateRequest(loginSchema, "body"),
    authController.login
);

/**
 * POST /api/auth/refresh
 * Refresh access and refresh tokens
 */
router.post("/refresh", authController.refresh);

export default router;
