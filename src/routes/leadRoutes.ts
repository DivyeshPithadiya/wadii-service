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

const createLeadSchema = z.object({
  venueId: objectId,
  clientName: z.string().min(1, "Client name is required"),
  contactNo: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email format"),
  occasionType: z.string().min(1, "Occasion type is required"),
  occasionDate: z.string().or(z.date()),
  numberOfGuests: z.number().min(1, "Number of guests must be at least 1"),
  leadStatus: z.enum(["cold", "warm", "hot"]).optional(),
  package: z.object({
    name: z.string().min(1, "Package name is required"),
    description: z.string().min(1, "Package description is required"),
    price: z.number().min(0, "Price must be non-negative"),
    priceType: z.enum(["flat", "per_guest"]),
  }),
  services: z
    .array(
      z.object({
        service: z.string().min(1, "Service name is required"),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

const updateLeadSchema = z.object({
  clientName: z.string().min(1).optional(),
  contactNo: z.string().min(1).optional(),
  email: z.string().email().optional(),
  occasionType: z.string().min(1).optional(),
  occasionDate: z.string().or(z.date()).optional(),
  numberOfGuests: z.number().min(1).optional(),
  leadStatus: z.enum(["cold", "warm", "hot"]).optional(),
  package: z
    .object({
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().min(0),
      priceType: z.enum(["flat", "per_guest"]),
    })
    .optional(),
  services: z
    .array(
      z.object({
        service: z.string().min(1),
        vendor: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().min(1),
        }),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

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
