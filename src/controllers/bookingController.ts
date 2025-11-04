import { Response } from "express";
import { Types } from "mongoose";
import { BookingService } from "../services/bookingService";
import {
  CreateBookingReq,
  GetBookingReq,
  GetBookingsByVenueReq,
  UpdateBookingReq,
  CancelBookingReq,
  ConfirmBookingReq,
  UpdatePaymentReq,
  CheckAvailabilityReq,
  BookingQueryFilters,
} from "../types/booking-request-types";
import { parseNumberParam } from "../utils/helper";
import { success } from "zod";

const oid = (id: string) => new Types.ObjectId(id);

export class BookingController {
  /**
   * Create a new booking
   */
  static async createBooking(
    req: CreateBookingReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      if (
  !req.body.eventDateRange ||
  !req.body.eventDateRange.startDate ||
  !req.body.eventDateRange.endDate
) {
  res.status(400).json({ success: false, message: "Invalid event date range" });
  return;
}

const isAvailable = await BookingService.checkSlotAvailability(
  req.body.venueId,
  new Date(req.body.eventDateRange.startDate),
  new Date(req.body.eventDateRange.endDate)
);
      // Check slot availability before creating

      if (!isAvailable) {
        res.status(409).json({
          success: false,
          message: "Time slot is not available for this venue",
        });
        return;
      }

      const bookingData = {
        ...req.body,
        createdBy: oid(req.user.userId),
        venueId: oid(req.body.venueId),
        leadId: req.body.leadId ? oid(req.body.leadId) : null,
      };

      const booking = await BookingService.createBooking(bookingData);

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(
    req: GetBookingReq,
    res: Response
  ): Promise<void> {
    try {
      const { bookingId } = req.params;

      const booking = await BookingService.getBookingById(bookingId);

      if (!booking) {
        res.status(404).json({ success: false, message: "Booking not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all bookings for a specific venue
   */
  static async getBookingsByVenue(
    req: GetBookingsByVenueReq,
    res: Response
  ): Promise<void> {
    try {
      const { venueId } = req.params;
     const filters: BookingQueryFilters = {
       bookingStatus: req.query.bookingStatus as any,
       paymentStatus: req.query.paymentStatus as any,
       startDate: req.query.startDate
         ? new Date(req.query.startDate)
         : undefined,
       endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
       limit: req.query.limit ? parseNumberParam(req.query.limit, 10) : 10,
       skip: req.query.skip ? parseNumberParam(req.query.skip, 0) : 0,
     };

      const result = await BookingService.getBookingsByVenue(venueId, filters);

      res.status(200).json({
        success: true,
        data: result.bookings,
        pagination: {
          total: result.total,
          limit: filters.limit,
          skip: filters.skip,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update booking
   */
  static async updateBooking(
    req: UpdateBookingReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;

     if (!req.body.venueId) {
       res
         .status(400)
         .json({ success: false, message: "Venue ID is required" });
       return;
     }

      // If updating date range, check availability
      if (req.body.eventDateRange) {
        const isAvailable = await BookingService.checkSlotAvailability(
          req.body.venueId,
          new Date(req.body.eventDateRange.startDate),
          new Date(req.body.eventDateRange.endDate),
          bookingId
        );

        if (!isAvailable) {
          res.status(409).json({
            success: false,
            message: "Time slot is not available for this venue",
          });
          return;
        }
      }

      const updateData = {
        ...req.body,
        updatedBy: oid(req.user.userId),
      };

      const booking = await BookingService.updateBooking(bookingId, updateData);

      if (!booking) {
        res.status(404).json({ success: false, message: "Booking not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Cancel booking (soft delete)
   */
  static async cancelBooking(
    req: CancelBookingReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;
      const { cancellationReason } = req.body;

      const booking = await BookingService.softDeleteBooking(
        bookingId,
        cancellationReason,
        req.user.userId
      );

      if (!booking) {
        res.status(404).json({ success: false, message: "Booking not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Confirm booking
   */
  static async confirmBooking(
    req: ConfirmBookingReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;

      const booking = await BookingService.confirmBooking(
        bookingId,
        req.user.userId
      );

      if (!booking) {
        res.status(404).json({ success: false, message: "Booking not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Booking confirmed successfully",
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update payment
   */
  static async updatePayment(
    req: UpdatePaymentReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;
      const { advanceAmount } = req.body;

      if (advanceAmount < 0) {
        res.status(400).json({
          success: false,
          message: "Advance amount cannot be negative",
        });
        return;
      }

      const booking = await BookingService.updatePayment(
        bookingId,
        advanceAmount,
        req.user.userId
      );

      if (!booking) {
        res.status(404).json({ success: false, message: "Booking not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Payment updated successfully",
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Check slot availability
   */
  static async checkAvailability(
    req: CheckAvailabilityReq,
    res: Response
  ): Promise<void> {
    try {
      const { venueId } = req.params;
      const { startDate, endDate, excludeBookingId } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
        return;
      }

      const isAvailable = await BookingService.checkSlotAvailability(
        venueId,
        new Date(startDate),
        new Date(endDate),
        excludeBookingId
      );

      res.status(200).json({
        success: true,
        data: { available: isAvailable },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
