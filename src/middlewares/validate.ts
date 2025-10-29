// src/middlewares/validate.ts
import { z } from "zod";
import { Request, Response, NextFunction } from "express";

type Part = "body" | "query" | "params";

/**
 * Validate req[part] with a Zod schema.
 * On success, replaces the data with the parsed value (strips unknowns).
 * On failure, returns 400 with flattened errors.
 */
export const validate =
  (part: Part, schema: z.ZodType<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse((req as any)[part]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
    }
    (req as any)[part] = result.data;
    next();
  };
