import { Router } from "express";
import { z } from "zod";

import { BlackoutDayController } from "../controllers/blackoutDayController";
import { authMiddleware } from "../middlewares/auth";
import {
  rolesMiddleware,
  requirePerm,
  ROLE_PERMS,
} from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { objectId } from "../utils/validator";

const blackoutDayRoutes = Router();

// All blackout day routes require authentication + role resolution
blackoutDayRoutes.use(authMiddleware, rolesMiddleware);

// ----- Validation Schemas -----

const recurrencePatternSchema = z.object({
  frequency: z.enum(["yearly", "monthly", "weekly"]),
  interval: z.number().min(1).default(1),
  endRecurrence: z.coerce.date().optional(),
});

const createBlackoutDaySchema = z
  .object({
    venueId: objectId,
    title: z.string().min(1, "Title is required"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurrencePattern: recurrencePatternSchema.optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.recurrencePattern) {
        return false;
      }
      return true;
    },
    {
      message: "Recurrence pattern is required when isRecurring is true",
      path: ["recurrencePattern"],
    }
  );

const updateBlackoutDaySchema = z
  .object({
    title: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    reason: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurrencePattern: recurrencePatternSchema.optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .optional();

const blackoutDayIdParams = z.object({
  blackoutDayId: objectId,
});

const venueIdParams = z.object({
  venueId: objectId,
});

const blackoutDayQuerySchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional(),
  skip: z.string().optional(),
});

const checkConflictQuerySchema = z.object({
  venueId: objectId,
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

const upcomingQuerySchema = z.object({
  limit: z.string().optional(),
});

const dateRangeQuerySchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  venueId: objectId.optional(),
});

const bulkUpdateStatusSchema = z.object({
  ids: z.array(objectId).min(1, "At least one ID is required"),
  status: z.enum(["active", "inactive"]),
});

// ----- Routes -----

/**
 * Create a new blackout day
 * POST /api/blackout-days
 * Required: venue.update permission (as it affects venue availability)
 */
blackoutDayRoutes.post(
  "/",
  validate("body", createBlackoutDaySchema),
  // requirePerm(ROLE_PERMS.VENUE_UPDATE),
  BlackoutDayController.createBlackoutDay
);

/**
 * Get blackout day by ID
 * GET /api/blackout-days/:blackoutDayId
 * Required: venue.read permission
 */
blackoutDayRoutes.get(
  "/:blackoutDayId",
  validate("params", blackoutDayIdParams),
  // requirePerm(ROLE_PERMS.VENUE_READ),
  BlackoutDayController.getBlackoutDayById
);

/**
 * Update blackout day
 * PUT /api/blackout-days/:blackoutDayId
 * Required: venue.update permission
 */
blackoutDayRoutes.put(
  "/:blackoutDayId",
  validate("params", blackoutDayIdParams),
  validate("body", updateBlackoutDaySchema),
  // requirePerm(ROLE_PERMS.VENUE_UPDATE),
  BlackoutDayController.updateBlackoutDay
);

/**
 * Delete blackout day
 * DELETE /api/blackout-days/:blackoutDayId
 * Required: venue.delete permission
 */
blackoutDayRoutes.delete(
  "/:blackoutDayId",
  validate("params", blackoutDayIdParams),
  // requirePerm(ROLE_PERMS.VENUE_DELETE),
  BlackoutDayController.deleteBlackoutDay
);

/**
 * Get all blackout days for a venue
 * GET /api/blackout-days/venue/:venueId
 * Required: venue.read permission
 */
blackoutDayRoutes.get(
  "/venue/:venueId",
  validate("params", venueIdParams),
  validate("query", blackoutDayQuerySchema),
  // requirePerm(ROLE_PERMS.VENUE_READ),
  BlackoutDayController.getBlackoutDaysByVenue
);

/**
 * Get upcoming blackout days for a venue
 * GET /api/blackout-days/venue/:venueId/upcoming
 * Required: venue.read permission
 */
blackoutDayRoutes.get(
  "/venue/:venueId/upcoming",
  validate("params", venueIdParams),
  validate("query", upcomingQuerySchema),
  // requirePerm(ROLE_PERMS.VENUE_READ),
  BlackoutDayController.getUpcomingBlackoutDays
);

/**
 * Check if date range conflicts with blackout days
 * GET /api/blackout-days/check-conflict
 * Required: venue.read permission
 */
blackoutDayRoutes.get(
  "/check-conflict",
  validate("query", checkConflictQuerySchema),
  // requirePerm(ROLE_PERMS.VENUE_READ),
  BlackoutDayController.checkBlackoutConflict
);

/**
 * Get blackout days by date range
 * GET /api/blackout-days/date-range
 * Required: venue.read permission
 */
blackoutDayRoutes.get(
  "/date-range",
  validate("query", dateRangeQuerySchema),
  // requirePerm(ROLE_PERMS.VENUE_READ),
  BlackoutDayController.getBlackoutDaysByDateRange
);

/**
 * Bulk update blackout day status
 * POST /api/blackout-days/bulk-update-status
 * Required: venue.update permission
 */
blackoutDayRoutes.post(
  "/bulk-update-status",
  validate("body", bulkUpdateStatusSchema),
  // requirePerm(ROLE_PERMS.VENUE_UPDATE),
  BlackoutDayController.bulkUpdateStatus
);

export default blackoutDayRoutes;
