import { Router } from "express";

import { LeadController } from "../controllers/leadController";
import { authMiddleware } from "../middlewares/auth";
import { rolesMiddleware, requirePerm, ROLE_PERMS } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  bulkUpdateStatusSchema,
  leadIdParams,
  venueIdParams,
  searchQuerySchema,
  dateRangeQuerySchema,
  leadQuerySchema,
} from "../validators/lead-validator";

const leadRoutes = Router();

// All lead routes require authentication + role resolution
leadRoutes.use(authMiddleware, rolesMiddleware);

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
