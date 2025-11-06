// src/routes/venueRoutes.ts
import { Router } from "express";
import { z } from "zod";

import { VenueController } from "../controllers/venueController";
import { authMiddleware } from "../middlewares/auth";
import { rolesMiddleware, requirePerm, ROLE_PERMS } from "../middlewares/roles";
import { validate } from "../middlewares/validate";
import { venueValidationSchemas } from "../utils/validator";

const venueRoutes = Router();






const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
});

const foodPackageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  priceType: z.enum(["flat", "per_guest"]),
  inclusions: z.array(z.string().min(1)).optional(),
});

const removeVendorSchema = z.object({
  vendorEmail: z.string().email("Valid email is required"),
});

const deletePackageSchema = z.object({
  packageId: z.string().min(1, "Package Id is required"),
});
const updatePackageSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  priceType: z.enum(["flat", "per_guest"]).optional(),
  inclusions: z.array(z.string().min(1)).optional(),
});
const createServiceSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
});

const updateServiceSchema = z.object({
  serviceName: z.string().min(1, "Service Id is required"),
});

const serviceParam = z.object({
  serviceId: z.string().min(1, "ServiceId is required"),
  venueId: z.string().min(1, "VenueId is required"),
});

const packageParam = z.object({
  venueId: z.string().min(1, "VenueId is required"),
  packageId: z.string().min(1, "PackageId is required"),
});

// All venue routes require authentication + role snapshot
venueRoutes.use(authMiddleware, rolesMiddleware);

// ----- Zod param schemas -----
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const paramsWithBusinessId = z.object({ businessId: objectId });
const paramsWithVenueId = z.object({ venueId: objectId });
const paramsWithVenueAndService = z.object({
  venueId: objectId,
  serviceName: z.string().min(1, "Service name is required"),
});

// Create venue — needs venue.create
venueRoutes.post(
  "/",
  validate("body", venueValidationSchemas.create),
  requirePerm(ROLE_PERMS.VENUE_CREATE),
  VenueController.createVenue
);

// Get all venues Superad
venueRoutes.get(
  "/",
  requirePerm(ROLE_PERMS.VENUE_CREATE),
  VenueController.getAllVenues
);

// Get venues by business — needs venue.read
venueRoutes.get(
  "/business/:businessId",
  validate("params", paramsWithBusinessId),
  requirePerm(ROLE_PERMS.VENUE_READ),
  VenueController.getVenuesByBusiness
);

// Get specific venue — needs venue.read
venueRoutes.get(
  "/:venueId",
  validate("params", paramsWithVenueId),
  requirePerm(ROLE_PERMS.VENUE_READ),
  VenueController.getVenueById
);

// Update venue — needs venue.update
venueRoutes.put(
  "/:venueId",
  validate("params", paramsWithVenueId),
  validate("body", venueValidationSchemas.update),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.updateVenue
);

// Delete venue — needs venue.delete
venueRoutes.delete(
  "/:venueId",
  validate("params", paramsWithVenueId),
  requirePerm(ROLE_PERMS.VENUE_DELETE),
  VenueController.deleteVenue
);

// ----- Service Management Routes -----

// Create a new service - needs venue.update
venueRoutes.post(
  "/:venueId/services",
  validate("params", paramsWithVenueId),
  validate("body", createServiceSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.createService
);

// Remove a service - needs venue.update
venueRoutes.delete(
  "/:venueId/services/:serviceId",
  validate("params", serviceParam),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.deleteService
);
venueRoutes.put(
  "/:venueId/services/:serviceId",
  validate("params", serviceParam),
  validate("body", updateServiceSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.updateService
);

// List all services - needs venue.read
venueRoutes.get(
  "/:venueId/services",
  validate("params", paramsWithVenueId),
  requirePerm(ROLE_PERMS.VENUE_READ),
  VenueController.listServices
);

// ----- Service Vendor Routes -----

// Add vendor to service - needs venue.update
venueRoutes.post(
  "/:venueId/services/:serviceName/vendors",
  validate("params", paramsWithVenueAndService),
  validate("body", vendorSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.addServiceVendor
);

// Remove vendor from service - needs venue.update
venueRoutes.delete(
  "/:venueId/services/:serviceName/vendors",
  validate("params", paramsWithVenueAndService),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.removeServiceVendor
);

// List vendors for a service - needs venue.read
venueRoutes.get(
  "/:venueId/services/:serviceName/vendors",
  validate("params", paramsWithVenueAndService),
  requirePerm(ROLE_PERMS.VENUE_READ),
  VenueController.listServiceVendors
);

// ----- Food Package Routes -----

// Add food package - needs venue.update
venueRoutes.post(
  "/:venueId/packages",
  validate("params", paramsWithVenueId),
  validate("body", foodPackageSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.addFoodPackage
);

// Remove food package - needs venue.update
venueRoutes.delete(
  "/:venueId/packages/:packageId",
  validate("params", packageParam),
  validate("body", deletePackageSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.removeFoodPackage
);

venueRoutes.put(
  "/:venueId/packages/:packageId",
  validate("params", packageParam),
  validate("body", updatePackageSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.updateFoodPackage
);

// List food packages - needs venue.read
venueRoutes.get(
  "/:venueId/packages",
  validate("params", paramsWithVenueId),
  requirePerm(ROLE_PERMS.VENUE_READ),
  VenueController.listFoodPackages
);

// ----- Catering Service Vendor Routes -----

// Add catering vendor - needs venue.update
venueRoutes.post(
  "/:venueId/catering-vendors",
  validate("params", paramsWithVenueId),
  validate("body", vendorSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.addCateringVendor
);

// Remove catering vendor - needs venue.update
venueRoutes.delete(
  "/:venueId/catering-vendors",
  validate("params", paramsWithVenueId),
  validate("body", removeVendorSchema),
  requirePerm(ROLE_PERMS.VENUE_UPDATE),
  VenueController.removeCateringVendor
);

// List catering vendors - needs venue.read
venueRoutes.get(
  "/:venueId/catering-vendors",
  validate("params", paramsWithVenueId),
  requirePerm(ROLE_PERMS.VENUE_READ),
  VenueController.listCateringVendors
);


export default venueRoutes;
