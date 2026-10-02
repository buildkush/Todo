import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError, UnauthorizedError } from "../types";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
// Short access token expiration (15 minutes)
const ACCESS_TOKEN_EXPIRES_IN = "15m";
// Long refresh token duration (7 days)
const REFRESH_TOKEN_DAYS = 7;

export class AuthController {
    /**
     * Helper to generate tokens and store refresh token
     */
    private async generateAndStoreTokens(userId: string) {
        // Generate short-lived Access Token
        const token = jwt.sign({ userId }, JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        });

        // Generate long-lived cryptographically secure Refresh Token
        const refreshToken = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

        // Store Refresh Token in DB
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });

        return { token, refreshToken };
    }

    /**
     * POST /api/auth/register
     * Register a new user
     */
    register = asyncHandler(async (req: Request, res: Response) => {
        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new AppError(400, "Email is already registered", "EMAIL_ALREADY_EXISTS");
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create the user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
        });

        // Generate tokens
        const { token, refreshToken } = await this.generateAndStoreTokens(user.id);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    theme: user.theme,
                    language: user.language,
                },
                token,
                refreshToken,
            },
        });
    });

    /**
     * POST /api/auth/login
     * Authenticate user and return JWT + Refresh Token
     */
    login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedError("Invalid email or password");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid email or password");
        }

        // Generate tokens
        const { token, refreshToken } = await this.generateAndStoreTokens(user.id);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    theme: user.theme,
                    language: user.language,
                },
                token,
                refreshToken,
            },
        });
    });

    /**
     * POST /api/auth/refresh
     * Refresh access and refresh tokens
     */
    refresh = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new UnauthorizedError("Refresh token is required");
        }

        // Find refresh token in DB and ensure it's not expired
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                expiresAt: { gt: new Date() },
            },
        });

        if (!storedToken) {
            throw new UnauthorizedError("Invalid or expired refresh token");
        }

        // Delete the old refresh token (token rotation)
        await prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        // Generate new token pair
        const tokens = await this.generateAndStoreTokens(storedToken.userId);

        res.json({
            success: true,
            data: tokens,
        });
    });
}

export const authController = new AuthController();
