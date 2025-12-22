import { Router } from "express";
import { BookingController } from "../controllers/bookingController";
import { validate } from "../middlewares/validate";
import { requirePerm } from "../middlewares/roles";
import { ROLE_PERMS } from "../middlewares/roles";
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  updatePaymentSchema,
  bookingQuerySchema,
  checkAvailabilitySchema,
} from "../validators/booking-validator";
import { authMiddleware } from "../middlewares/auth";



const bookingRoutes = Router();


bookingRoutes.use(authMiddleware);

/**
 * Create a new booking
 * POST /api/bookings
 * Required: booking.create permission
 */
bookingRoutes.post(
  "/",
  validate("body", createBookingSchema),
  requirePerm(ROLE_PERMS.BOOKING_CREATE),
  BookingController.createBooking
);

/**
 * Get booking by ID
 * GET /api/bookings/:venueId/booking/:bookingId
 * Required: booking.read permission
 */
bookingRoutes.get(
  "/:venueId/booking/:bookingId",
  requirePerm(ROLE_PERMS.BOOKING_READ),
  BookingController.getBookingById
);

/**
 * Get all bookings for a venue
 * GET /api/bookings/venue/:venueId
 * Required: booking.read permission
 */
bookingRoutes.get(
  "/venue/:venueId",
  validate("query", bookingQuerySchema),
  requirePerm(ROLE_PERMS.BOOKING_READ),
  BookingController.getBookingsByVenue
);

/**
 * Update booking
 * PUT /api/bookings/:venueId/booking/:bookingId
 * Required: booking.update permission
 */
bookingRoutes.put(
  "/:venueId/booking/:bookingId",
  validate("body", updateBookingSchema),
  requirePerm(ROLE_PERMS.BOOKING_UPDATE),
  BookingController.updateBooking
);

/**
 * Cancel booking (soft delete)
 * POST /api/bookings/:venueId/booking/:bookingId/cancel
 * Required: booking.delete permission
 */
bookingRoutes.post(
  "/:venueId/booking/:bookingId/cancel",
  validate("body", cancelBookingSchema),
  requirePerm(ROLE_PERMS.BOOKING_DELETE),
  BookingController.cancelBooking
);

/**
 * Confirm booking
 * POST /api/bookings/:venueId/booking/:bookingId/confirm
 * Required: booking.update permission
 */
bookingRoutes.post(
  "/:venueId/booking/:bookingId/confirm",
  requirePerm(ROLE_PERMS.BOOKING_UPDATE),
  BookingController.confirmBooking
);

/**
 * Update payment
 * PATCH /api/bookings/:venueId/booking/:bookingId/payment
 * Required: booking.update permission
 */
bookingRoutes.patch(
  "/:venueId/booking/:bookingId/payment",
  validate("body", updatePaymentSchema),
  requirePerm(ROLE_PERMS.BOOKING_UPDATE),
  BookingController.updatePayment
);

/**
 * Check slot availability
 * GET /api/bookings/venue/:venueId/availability
 * Required: booking.read permission
 */
bookingRoutes.get(
  "/venue/:venueId/availability",
  validate("query", checkAvailabilitySchema),
  requirePerm(ROLE_PERMS.BOOKING_READ),
  BookingController.checkAvailability
);

/**
 * Delete booking (soft delete)
 * DELETE /api/bookings/:venueId/booking/:bookingId
 * Required: booking.delete permission
 */
bookingRoutes.delete(
  "/:venueId/booking/:bookingId",
  requirePerm(ROLE_PERMS.BOOKING_DELETE),
  BookingController.deleteBooking
);

/**
 * Get deleted bookings (admin/dev only)
 * GET /api/bookings/deleted
 * Required: booking.read permission
 */
bookingRoutes.get(
  "/deleted",
  requirePerm(ROLE_PERMS.BOOKING_READ),
  BookingController.getDeletedBookings
);

/**
 * Restore a soft-deleted booking
 * POST /api/bookings/:bookingId/restore
 * Required: booking.update permission
 */
bookingRoutes.post(
  "/:bookingId/restore",
  requirePerm(ROLE_PERMS.BOOKING_UPDATE),
  BookingController.restoreBooking
);

export default bookingRoutes;
