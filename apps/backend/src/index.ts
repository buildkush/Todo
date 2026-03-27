import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS Configuration
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// TODO: Add routes
// app.use('/api/projects', projectRoutes);
// app.use('/api/todos', todoRoutes);
// app.use('/api/sections', sectionRoutes);
// app.use('/api/boardSections', boardSectionRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.path} not found`,
  });
});

// Error handler
app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "InternalServerError",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    });
  }
);

// ============================================================================
// SERVER START
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Todo App Backend                  ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || "development"}          ║
║   CORS Origin: ${FRONTEND_URL}    ║
╚════════════════════════════════════════╝
  `);
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("✅ Server stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
