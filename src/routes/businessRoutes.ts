
import { Router } from "express";
import { z } from "zod";

import { BusinessController } from "../controllers/businessController";
import { authMiddleware } from "../middlewares/auth";
import { rolesMiddleware, requirePerm, ROLE_PERMS } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { businessValidationSchemas, objectId } from "../utils/validator";

const businessRoutes = Router();

// All business routes require authentication + role snapshot
businessRoutes.use(authMiddleware, rolesMiddleware);

// ----- Schemas for params -----
const paramsWithBusinessId = z.object({ businessId: objectId });

// Create business — any authenticated user
businessRoutes.post(
  "/",
  validate("body", businessValidationSchemas.create),
  BusinessController.createBusiness
);

// Get all businesses — service already scopes non-developers to their businesses
businessRoutes.get("/", BusinessController.getAllBusinesses);

// Get specific business
businessRoutes.get(
  "/:businessId",
  validate("params", paramsWithBusinessId),
  // read permission enforced inside the service
  BusinessController.getBusinessById
);

// Update business
businessRoutes.put(
  "/:businessId",
  validate("params", paramsWithBusinessId),
  validate("body", businessValidationSchemas.update),
  requirePerm(ROLE_PERMS.BUSINESS_UPDATE),
  BusinessController.updateBusiness
);

// Delete business — permission checked by middleware
businessRoutes.delete(
  "/:businessId",
  validate("params", paramsWithBusinessId),
  requirePerm([ROLE_PERMS.BUSINESS_DELETE]), // Only developer can delete, or custom logic in controller
  BusinessController.deleteBusiness
);

export default businessRoutes;

