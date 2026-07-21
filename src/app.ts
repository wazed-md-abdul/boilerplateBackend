import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createRemoteJWKSet, jwtVerify } from "jose";

// --- CUSTOM OPERATIONAL ERROR CLASS ---
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// --- JWKS CLIENT CONFIGURATION ---
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const JWKS = createRemoteJWKSet(new URL(`${BASE_URL}/api/auth/jwks`));

/**
 * JWT Verification Middleware using JWKS from the BetterAuth frontend host
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "unauthorized access" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    // Attach verification payload to res.locals for use in downstream endpoints
    res.locals.user = payload;
    return next();
  } catch {
    return res.status(403).json({ message: "forbidden access" });
  }
};

// --- EXPRESS APPLICATION SETUP ---
const app = express();

// 1. Security & Protection Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Rate Limiter: 100 requests per 15 mins for all /api routes
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
app.use("/api", rateLimiter);

// 2. Health Check Endpoint
app.get("/api/v1/health", (req: Request, res: Response): void => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    environment: process.env.NODE_ENV || "development",
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
  });
});

// Root route redirect to health check
app.get("/", (req: Request, res: Response): void => {
  res.redirect("/api/v1/health");
});

// 3. Fallback Route matching (404)
app.use((req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// 4. Global Error Handling Middleware
const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    const error = { ...err };
    error.message = err.message;
    error.name = err.name;

    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    } else {
      console.error("[Error] Unexpected execution exception: ", err);
      res.status(500).json({
        status: "error",
        message: "Something went wrong on the server.",
      });
    }
  }
};
app.use(globalErrorHandler);

export default app;
