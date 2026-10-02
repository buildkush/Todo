import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import jwt from "jsonwebtoken";
import { ValidationError, UnauthorizedError } from "../types";

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export const validateRequest =
    (schema: ZodSchema, source: "body" | "query" | "params" = "body") =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                const dataToValidate = source === "body" ? req.body : req[source];
                const result = schema.safeParse(dataToValidate);

                if (!result.success) {
                    const fields: Record<string, string> = {};
                    result.error.errors.forEach((error) => {
                        const path = error.path.join(".");
                        fields[path] = error.message;
                    });

                    throw new ValidationError("Validation failed", fields);
                }

                // Attach validated data to request
                if (source === "body") {
                    req.body = result.data;
                } else if (source === "query") {
                    (req as any).query = result.data;
                } else if (source === "params") {
                    (req as any).params = result.data;
                }

                next();
            } catch (error) {
                next(error);
            }
        };

// ============================================================================
// REQUEST ID MIDDLEWARE
// ============================================================================

export const requestIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId =
        req.headers["x-request-id"] || `req-${Date.now()}-${Math.random()}`;
    (req as any).id = requestId;
    res.setHeader("x-request-id", requestId);
    next();
};

// ============================================================================
// JWT AUTH MIDDLEWARE
// ============================================================================

export const jwtAuthMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedError("Access token is missing or invalid");
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET || "dev-secret-key-change-in-production";

        try {
            const decoded = jwt.verify(token, secret) as { userId: string };
            (req as any).userId = decoded.userId;
            next();
        } catch (err) {
            throw new UnauthorizedError("Access token is missing or invalid");
        }
    } catch (error) {
        next(error);
    }
};
