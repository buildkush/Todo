import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Import middleware
import {
    errorHandler,
    notFoundHandler,
} from "./middleware/errorHandler";
import {
    requestIdMiddleware,
    jwtAuthMiddleware,
} from "./middleware/validators";

// Import routes
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import todoRoutes from "./routes/todoRoutes";
import sectionRoutes from "./routes/sectionRoutes";
import boardSectionRoutes from "./routes/boardSectionRoutes";

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Request ID tracking
app.use(requestIdMiddleware);

// CORS Configuration
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const isLocal = origin.startsWith("http://localhost") || 
                            origin.startsWith("http://127.0.0.1") || 
                            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
                            /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
                            /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin);
            if (isLocal) {
                callback(null, true);
            } else {
                callback(null, [FRONTEND_URL]);
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-request-id"],
    })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint (Public)
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "OK",
        message: "Backend is running",
        timestamp: new Date().toISOString(),
    });
});

// Public Auth API Routes
app.use("/api/auth", authRoutes);

// Apply JWT Authentication globally to all subsequent routes
app.use(jwtAuthMiddleware);

// Protected API Routes
app.use("/api/projects", projectRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/boardSections", boardSectionRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 Not Found
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

const startServer = async () => {
    try {
        // Verify database connection
        await prisma.$connect();
        console.log("✅ Database connected successfully");

        // Start Express server
        app.listen(Number(PORT), "0.0.0.0", () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
            console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
            console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n📵 Shutting down gracefully...");
    await prisma.$disconnect();
    process.exit(0);
});

startServer();

export default app;
export { prisma };
// Trigger restart

