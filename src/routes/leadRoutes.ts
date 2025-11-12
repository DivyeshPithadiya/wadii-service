import { Router } from "express";
import { z } from "zod";

import { LeadController } from "../controllers/leadController";
import { authMiddleware } from "../middlewares/auth";
import { rolesMiddleware, requirePerm, ROLE_PERMS } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { objectId } from "../utils/validator";

const leadRoutes = Router();

// All lead routes require authentication + role resolution
leadRoutes.use(authMiddleware, rolesMiddleware);

// ----- Validation Schemas -----

/**
 * Package schema
 */
const packageSchema = z.object({
  packageId: z.string().optional(),
  descrition: z.string().optional(),
  name: z.string().trim().min(1, "Package name is required"),
  price: z.number().min(0, "Price must be positive"),
  priceType: z.enum(["flat", "per_guest"]),
});

/**
 * Service schema
 */
const serviceSchema = z.object({
  service: z.string().trim().min(1, "Service ID is required"),
  vendor: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  price: z.number().min(0, "Price must be positive").default(0),
});

const createLeadSchema = z.object({
  venueId: objectId,
  clientName: z.string().min(1, "Client name is required"),
  contactNo: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email format"),
  occasionType: z.string().min(1, "Occasion type is required"),
  numberOfGuests: z.number().min(1, "Number of guests must be at least 1"),
  leadStatus: z.enum(["cold", "warm", "hot"]).default("cold"),
  eventStartDateTime: z.coerce.date(),
  eventEndDateTime: z.coerce.date(),
  slotType: z.enum(["setup", "event", "cleanup", "full_day"]).default("event"),
  package: packageSchema.optional(),
  services: z.array(serviceSchema).optional(),
  notes: z.string().optional(),
  cateringServiceVendor: z
    .object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
    })
    .optional(),
}).refine(
  (data) => new Date(data.eventEndDateTime) > new Date(data.eventStartDateTime),
  {
    message: "End datetime must be after start datetime",
    path: ["eventEndDateTime"],
  }
);

const updateLeadSchema = z
  .object({
    clientName: z.string().min(1).optional(),
    contactNo: z.string().min(1).optional(),
    email: z.string().email().optional(),
    occasionType: z.string().min(1).optional(),
    numberOfGuests: z.number().min(1).optional(),
    leadStatus: z.enum(["cold", "warm", "hot"]).optional(),
    eventStartDateTime: z.coerce.date().optional(),
    eventEndDateTime: z.coerce.date().optional(),
    slotType: z.enum(["setup", "event", "cleanup", "full_day"]).optional(),
    package: packageSchema.optional(),
    services: z.array(serviceSchema).optional(),
    cateringServiceVendor: z
      .object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      })
      .optional(),
    notes: z.string().optional(),
  })
  .optional();

const updateLeadStatusSchema = z.object({
  status: z.enum(["cold", "warm", "hot"]),
});

const bulkUpdateStatusSchema = z.object({
  leadIds: z.array(objectId).min(1, "At least one lead ID is required"),
  status: z.enum(["cold", "warm", "hot"]),
});

const leadIdParams = z.object({
  leadId: objectId,
});

const venueIdParams = z.object({
  venueId: objectId,
});

const businessIdParams = z.object({
  businessId: objectId,
});

const searchQuerySchema = z.object({
  searchTerm: z.string().min(1, "Search term is required"),
  venueId: objectId.optional(),
  businessId: objectId.optional(),
});

const dateRangeQuerySchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  venueId: objectId.optional(),
  businessId: objectId.optional(),
});

const leadQuerySchema = z.object({
  leadStatus: z.enum(["cold", "warm", "hot"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional(),
  skip: z.string().optional(),
  venueId: objectId.optional(),
});

// ----- Routes -----

/**
 * Create a new lead
 * POST /api/leads
 * Required: lead.create permission
 */
leadRoutes.post(
  "/",
  validate("body", createLeadSchema),
  requirePerm(ROLE_PERMS.LEAD_CREATE),
  LeadController.createLead
);

/**
 * Get lead by ID
 * GET /api/leads/:leadId
 * Required: lead.read permission
 */
leadRoutes.get(
  "/:leadId",
  validate("params", leadIdParams),
  requirePerm(ROLE_PERMS.LEAD_READ),
  LeadController.getLeadById
);

/**
 * Update lead
 * PUT /api/leads/:leadId
 * Required: lead.update permission
 */
leadRoutes.put(
  "/:leadId",
  validate("params", leadIdParams),
  validate("body", updateLeadSchema),
  requirePerm(ROLE_PERMS.LEAD_UPDATE),
  LeadController.updateLead
);

/**
 * Delete lead
 * DELETE /api/leads/:leadId
 * Required: lead.delete permission
 */
leadRoutes.delete(
  "/:leadId",
  validate("params", leadIdParams),
  requirePerm(ROLE_PERMS.LEAD_DELETE),
  LeadController.deleteLead
);

/**
 * Update lead status
 * PATCH /api/leads/:leadId/status
 * Required: lead.update permission
 */
leadRoutes.patch(
  "/:leadId/status",
  validate("params", leadIdParams),
  validate("body", updateLeadStatusSchema),
  requirePerm(ROLE_PERMS.LEAD_UPDATE),
  LeadController.updateLeadStatus
);

/**
 * Bulk update lead statuses
 * POST /api/leads/bulk-update-status
 * Required: lead.update permission
 */
leadRoutes.post(
  "/bulk-update-status",
  validate("body", bulkUpdateStatusSchema),
  requirePerm(ROLE_PERMS.LEAD_UPDATE),
  LeadController.bulkUpdateLeadStatus
);

/**
 * Search leads
 * GET /api/leads/search
 * Required: lead.read permission
 */
leadRoutes.get(
  "/search",
  validate("query", searchQuerySchema),
  requirePerm(ROLE_PERMS.LEAD_READ),
  LeadController.searchLeads
);

/**
 * Get leads by date range
 * GET /api/leads/date-range
 * Required: lead.read permission
 */
leadRoutes.get(
  "/date-range",
  validate("query", dateRangeQuerySchema),
  requirePerm(ROLE_PERMS.LEAD_READ),
  LeadController.getLeadsByDateRange
);

/**
 * Get all leads for a specific venue
 * GET /api/venues/:venueId/leads
 * Required: lead.read permission
 */
leadRoutes.get(
  "/venues/:venueId/leads",
  validate("params", venueIdParams),
  validate("query", leadQuerySchema),
  requirePerm(ROLE_PERMS.LEAD_READ),
  LeadController.getLeadsByVenue
);

/**
 * Get venue lead statistics
 * GET /api/venues/:venueId/leads/stats
 * Required: lead.read permission
 */
leadRoutes.get(
  "/venues/:venueId/leads/stats",
  validate("params", venueIdParams),
  requirePerm(ROLE_PERMS.LEAD_READ),
  LeadController.getVenueLeadStats
);

export default leadRoutes;
