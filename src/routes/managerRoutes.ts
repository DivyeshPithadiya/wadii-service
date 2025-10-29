import { Router } from "express";
import { z } from "zod";

import { ManagerController } from "../controllers/managerController";
import { authMiddleware } from "../middlewares/auth";
import { rolesMiddleware, requirePerm, ROLE_PERMS } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { objectId } from "../utils/validator";

const managerRoutes = Router();

// All manager routes require authentication + role resolution
managerRoutes.use(authMiddleware, rolesMiddleware);

// ----- Validation Schemas -----
const createManagerSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  businessId: objectId,
  password: z.string().optional(),
});
const updateManagerSchema = z.object({
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  managerId: objectId,
  businessId: objectId,
});

const assignManagerSchema = z.object({
  managerId: objectId,
  businessId: objectId,
  venueId: objectId.optional(),
  scope: z.enum(["business", "venue"]),
});

const businessIdParams = z.object({
  businessId: objectId,
});

const venueIdParams = z.object({
  venueId: objectId,
});

const assignmentIdParams = z.object({
  assignmentId: objectId,
});

// ----- Routes -----

/**
 * Create a new manager for a business
 * POST /api/managers
 * Required: manager.create permission (Owner/Developer only)
 */
managerRoutes.post(
  "/",
  validate("body", createManagerSchema),
  requirePerm(ROLE_PERMS.MANAGER_CREATE),
  ManagerController.createManager
);

/**
 * List all managers for a business
 * GET /api/managers/business/:businessId
 * Required: manager.read permission
 */
managerRoutes.get(
  "/business/:businessId",
  validate("params", businessIdParams),
  requirePerm(ROLE_PERMS.MANAGER_READ),
  ManagerController.getManagersByBusiness
);

/**
 * List available managers for assignment (shows current assignments)
 * GET /api/managers/business/:businessId/available
 * Required: manager.read permission
 */
managerRoutes.get(
  "/business/:businessId/available",
  validate("params", businessIdParams),
  requirePerm(ROLE_PERMS.MANAGER_READ),
  ManagerController.getAvailableManagers
);

/**
 * List all managers assigned to a specific venue
 * GET /api/managers/venue/:venueId
 * Required: manager.read permission
 */
managerRoutes.get(
  "/venue/:venueId",
  validate("params", venueIdParams),
  requirePerm(ROLE_PERMS.MANAGER_READ),
  ManagerController.getManagersByVenue
);

/**
 * Assign existing manager to a venue/business scope
 * POST /api/managers/assign
 * Required: manager.assign permission (Owner/Developer only)
 */
managerRoutes.post(
  "/assign",
  validate("body", assignManagerSchema),
  requirePerm(ROLE_PERMS.MANAGER_ASSIGN),
  ManagerController.assignManagerToVenue
);

/**
 * Update existing manager
 * POST /api/managers/update
 * Required: manager.update permission (Owner/Developer only)
 */
managerRoutes.put(
  "/update",
  validate("body", updateManagerSchema),
  requirePerm(ROLE_PERMS.MANAGER_UPDATE),
  ManagerController.updateManager
);

/**
 * Remove manager assignment
 * DELETE /api/managers/assignments/:assignmentId
 * Required: manager.delete permission (Owner/Developer only)
 */
managerRoutes.delete(
  "/assignments/:assignmentId",
  validate("params", assignmentIdParams),
  requirePerm(ROLE_PERMS.MANAGER_DELETE),
  ManagerController.removeManagerAssignment
);

export default managerRoutes;
