import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * Generic validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validateRequest = (schema: {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate query
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      // Validate params
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: formattedErrors,
        });
      }

      // Handle other errors
      return res.status(500).json({
        success: false,
        message: "Validation error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};

/**
 * Validate body only
 */
export const validateBody = (schema: z.ZodType<any>) => {
  return validateRequest({ body: schema });
};

/**
 * Validate query only
 */
export const validateQuery = (schema: z.ZodType<any>) => {
  return validateRequest({ query: schema });
};

/**
 * Validate params only
 */
export const validateParams = (schema: z.ZodType<any>) => {
  return validateRequest({ params: schema });
};

/**
 * Async wrapper for route handlers
 * Catches async errors and passes them to next()
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
