import { Request, Response, NextFunction } from "express";

export interface IAppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: IAppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (error.name === "MongoServerError" && (error as any).code === 11000) {
    statusCode = 409;
    message = "Duplicate field value";
  }

  console.error(` Error: ${message}`, {
    path: req.path,
    method: req.method,
    statusCode,
    stack: error.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

/**
 * 404 Not Found middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
