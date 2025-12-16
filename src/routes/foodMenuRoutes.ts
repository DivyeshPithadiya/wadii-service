// src/routes/foodMenuRoutes.ts
import { Router } from "express";
import { z } from "zod";
import { FoodMenuController } from "../controllers/foodMenuController";
import { authMiddleware } from "../middlewares/auth";
import { rolesMiddleware, requirePerm, ROLE_PERMS } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import {
  createFoodMenuSectionSchema,
  updateFoodMenuSectionSchema,
  addItemToSectionSchema,
  updateItemSchema,
} from "../validators/foodMenu-validator";

const foodMenuRoutes = Router();

// All food menu routes require authentication + role snapshot
foodMenuRoutes.use(authMiddleware, rolesMiddleware);

// ----- Zod param schemas -----
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const paramsWithVenueId = z.object({ venueId: objectId });
const paramsWithVenueAndSection = z.object({
  venueId: objectId,
  sectionId: objectId,
});
const paramsWithVenueSectionAndItem = z.object({
  venueId: objectId,
  sectionId: objectId,
  itemId: objectId,
});

// ----- Section Management Routes -----

/**
 * Create new section
 * POST /api/venues/:venueId/food-menu/sections
 */
foodMenuRoutes.post(
  "/:venueId/food-menu/sections",
  validate("params", paramsWithVenueId),
  validate("body", createFoodMenuSectionSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  FoodMenuController.createSection
);

/**
 * Get all sections (food menu)
 * GET /api/venues/:venueId/food-menu/sections
 */
foodMenuRoutes.get(
  "/:venueId/food-menu/sections",
  validate("params", paramsWithVenueId),
  requirePerm(ROLE_PERMS.VENUE_READ),
  FoodMenuController.getFoodMenu
);

/**
 * Get specific section
 * GET /api/venues/:venueId/food-menu/sections/:sectionId
 */
foodMenuRoutes.get(
  "/:venueId/food-menu/sections/:sectionId",
  validate("params", paramsWithVenueAndSection),
  requirePerm(ROLE_PERMS.VENUE_READ),
  FoodMenuController.getSection
);

/**
 * Update section
 * PUT /api/venues/:venueId/food-menu/sections/:sectionId
 */
foodMenuRoutes.put(
  "/:venueId/food-menu/sections/:sectionId",
  validate("params", paramsWithVenueAndSection),
  validate("body", updateFoodMenuSectionSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  FoodMenuController.updateSection
);

/**
 * Delete section
 * DELETE /api/venues/:venueId/food-menu/sections/:sectionId
 */
foodMenuRoutes.delete(
  "/:venueId/food-menu/sections/:sectionId",
  validate("params", paramsWithVenueAndSection),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  FoodMenuController.deleteSection
);

// ----- Item Management Routes -----

/**
 * Add item to section
 * POST /api/venues/:venueId/food-menu/sections/:sectionId/items
 */
foodMenuRoutes.post(
  "/:venueId/food-menu/sections/:sectionId/items",
  validate("params", paramsWithVenueAndSection),
  validate("body", addItemToSectionSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  FoodMenuController.addItemToSection
);

/**
 * Update item
 * PUT /api/venues/:venueId/food-menu/sections/:sectionId/items/:itemId
 */
foodMenuRoutes.put(
  "/:venueId/food-menu/sections/:sectionId/items/:itemId",
  validate("params", paramsWithVenueSectionAndItem),
  validate("body", updateItemSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  FoodMenuController.updateItem
);

/**
 * Delete item
 * DELETE /api/venues/:venueId/food-menu/sections/:sectionId/items/:itemId
 */
foodMenuRoutes.delete(
  "/:venueId/food-menu/sections/:sectionId/items/:itemId",
  validate("params", paramsWithVenueSectionAndItem),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  FoodMenuController.deleteItem
);

export default foodMenuRoutes;
