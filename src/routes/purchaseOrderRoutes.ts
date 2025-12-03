import { Router } from "express";
import { PurchaseOrderController } from "../controllers/purchaseOrderController";
import { authMiddleware } from "../middlewares/auth";
import { requirePerm, ROLE_PERMS } from "../middlewares/roles";
import { validateRequest } from "../middlewares/validateRequest";
import {
  CreatePurchaseOrderSchema,
  UpdatePurchaseOrderSchema,
  CancelPOSchema,
  PurchaseOrderQuerySchema,
  POIdParamSchema,
  POBookingIdParamSchema,
} from "../validations/purchaseOrder.validation";

const purchaseOrderRoutes = Router();

// Apply authentication middleware to all purchase order routes
purchaseOrderRoutes.use(authMiddleware);

/**
 * Create Purchase Order
 * POST /api/purchase-orders
 * Required: booking.create permission
 */
purchaseOrderRoutes.post(
  "/",
  validateRequest({ body: CreatePurchaseOrderSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_CREATE),
  PurchaseOrderController.createPO
);

/**
 * Get Purchase Orders with filtering
 * GET /api/purchase-orders
 * Query params: bookingId, venueId, vendorType, status, startDate, endDate, minAmount, maxAmount, searchVendor, page, limit
 * Required: booking.read permission
 */
purchaseOrderRoutes.get(
  "/",
  validateRequest({ query: PurchaseOrderQuerySchema }),
  // requirePerm(ROLE_PERMS.BOOKING_READ),
  PurchaseOrderController.getPOs
);

/**
 * Get PO Summary
 * GET /api/purchase-orders/summary
 * Query params: venueId, startDate, endDate
 * Required: booking.read permission
 */
purchaseOrderRoutes.get(
  "/summary",
  validateRequest({ query: PurchaseOrderQuerySchema }),
  // requirePerm(ROLE_PERMS.BOOKING_READ),
  PurchaseOrderController.getPOSummary
);

/**
 * Get POs by Booking
 * GET /api/purchase-orders/booking/:bookingId
 * Required: booking.read permission
 */
purchaseOrderRoutes.get(
  "/booking/:bookingId",
  validateRequest({ params: POBookingIdParamSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_READ),
  PurchaseOrderController.getPOsByBooking
);

/**
 * Get Purchase Order by ID
 * GET /api/purchase-orders/:id
 * Required: booking.read permission
 */
purchaseOrderRoutes.get(
  "/:id",
  validateRequest({ params: POIdParamSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_READ),
  PurchaseOrderController.getPOById
);

/**
 * Update Purchase Order
 * PATCH /api/purchase-orders/:id
 * Required: booking.update permission
 */
purchaseOrderRoutes.patch(
  "/:id",
  validateRequest({
    params: POIdParamSchema,
    body: UpdatePurchaseOrderSchema,
  }),
  // requirePerm(ROLE_PERMS.BOOKING_UPDATE),
  PurchaseOrderController.updatePO
);

/**
 * Approve Purchase Order
 * POST /api/purchase-orders/:id/approve
 * Required: booking.update permission
 */
purchaseOrderRoutes.post(
  "/:id/approve",
  validateRequest({ params: POIdParamSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_UPDATE),
  PurchaseOrderController.approvePO
);

/**
 * Cancel Purchase Order
 * POST /api/purchase-orders/:id/cancel
 * Required: booking.update permission
 */
purchaseOrderRoutes.post(
  "/:id/cancel",
  validateRequest({
    params: POIdParamSchema,
    body: CancelPOSchema,
  }),
  // requirePerm(ROLE_PERMS.BOOKING_UPDATE),
  PurchaseOrderController.cancelPO
);

/**
 * Auto-generate POs for Booking
 * POST /api/purchase-orders/generate/:bookingId
 * Required: booking.create permission
 */
purchaseOrderRoutes.post(
  "/generate/:bookingId",
  validateRequest({ params: POBookingIdParamSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_CREATE),
  PurchaseOrderController.generatePOsForBooking
);

export default purchaseOrderRoutes;
