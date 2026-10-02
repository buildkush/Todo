import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../types";

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

export const errorHandler = (
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("Error:", error);

    if (error instanceof ValidationError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.code,
            message: error.message,
            fields: error.fields,
        });
    }

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.code,
            message: error.message,
        });
    }

    // Unknown error
    res.status(500).json({
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
    });
};

// ============================================================================
// ASYNC ERROR WRAPPER
// ============================================================================

export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
        (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };

// ============================================================================
// NOT FOUND MIDDLEWARE
// ============================================================================

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: `Route ${req.method} ${req.path} not found`,
    });
};
