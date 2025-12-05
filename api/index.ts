import express from "express";
import cors from "cors";
import helmet from "helmet";
import Database from "../src/config/db";
import EnvironmentConfig from "../src/config/env";
import routes from "../src/routes";
import { errorHandler, notFoundHandler } from "../src/middlewares/errorHandler";

// Initialize Express app
const app = express();
const envConfig = EnvironmentConfig.getInstance().config;

// Initialize database connection (async, but Vercel will handle it)
Database.getInstance().connect().catch(console.error);

// CORS configuration
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware (development only)
if (envConfig.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(
       "${req.method} ${req.path} - ${new Date().toISOString()}"
    );
    next();
  });
}

// API routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🎉 Welcome to Banquet Booking System API",
    version: "1.0.0",
    documentation: "/api/docs",
    health: "/api/health",
    environment: envConfig.NODE_ENV,
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Export for Vercel serverless
export default app;