import { Response } from "express";
import { Types } from "mongoose";
import { BookingService } from "../services/bookingService";
import { TransactionService } from "../services/transactionService";
import {
  CreateBookingReq,
  GetBookingReq,
  GetBookingsByVenueReq,
  UpdateBookingReq,
  CancelBookingReq,
  ConfirmBookingReq,
  UpdatePaymentReq,
  CheckAvailabilityReq,
  DeleteBookingReq,
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
      console.log("---- CREATE BOOKING REQUEST RECEIVED ----");
      console.log("User:", req.user);
      console.log("Body:", req.body);

      if (!req.user?.userId) {
        console.log("Unauthorized request: Missing userId");
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Check slot availability before creating
      if (!req.body.eventStartDateTime || !req.body.eventEndDateTime) {
        console.log("❌ Invalid datetime range");
        res.status(400).json({ success: false, message: "Invalid datetime range" });
        return;
      }

      console.log("Checking slot availability...");
      console.log("Venue ID:", req.body.venueId);
      console.log("Start DateTime:", req.body.eventStartDateTime);
      console.log("End DateTime:", req.body.eventEndDateTime);

      const isAvailable = await BookingService.checkSlotAvailability(
        req.body.venueId,
        new Date(req.body.eventStartDateTime),
        new Date(req.body.eventEndDateTime)
      );

      console.log("Slot Available:", isAvailable);

      if (!isAvailable) {
        console.log("❌ Time slot unavailable");
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

      console.log("Creating booking with data:", bookingData);

      const booking = await BookingService.createBooking(bookingData);

      console.log("✅ Booking created successfully");
      console.log("Booking ID:", booking._id);

      // Create initial transaction if advance amount is provided
      if (req.body.payment?.advanceAmount && req.body.payment.advanceAmount > 0) {
        console.log("Creating initial transaction for advance payment...");
        try {
          await TransactionService.createTransaction({
            bookingId: booking._id.toString(),
            amount: req.body.payment.advanceAmount,
            mode: req.body.payment.paymentMode,
            status: "success",
            notes: "Initial advance payment",
            paidAt: new Date(),
            createdBy: req.user.userId,
          });
          console.log("✅ Initial transaction created");
        } catch (txnError: any) {
          console.error("⚠️ Warning: Failed to create initial transaction:", txnError.message);
          // Don't fail the booking creation if transaction creation fails
        }
      }

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking,
      });
    } catch (error: any) {
      console.error("❌ Error in createBooking:", error);
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
      console.log("---- UPDATE BOOKING REQUEST RECEIVED ----");
      console.log("User:", req.user);
      console.log("Params:", req.params);
      console.log("Body:", req.body);

      if (!req.user?.userId) {
        console.log("Unauthorized request: Missing userId");
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;

      console.log("Booking ID:", bookingId);

      // If updating time slot, check availability
      if (req.body.eventStartDateTime || req.body.eventEndDateTime) {
        console.log("DateTime update detected. Checking availability…");

        const currentBooking = await BookingService.getBookingById(bookingId);
        console.log("Current Booking:", currentBooking);

        if (!currentBooking) {
          console.log("❌ Booking not found");
          res
            .status(404)
            .json({ success: false, message: "Booking not found" });
          return;
        }

        // Use existing values if not provided in update
        const startDateTime = req.body.eventStartDateTime
          ? new Date(req.body.eventStartDateTime)
          : currentBooking.eventStartDateTime;
        const endDateTime = req.body.eventEndDateTime
          ? new Date(req.body.eventEndDateTime)
          : currentBooking.eventEndDateTime;

        const isAvailable = await BookingService.checkSlotAvailability(
          (currentBooking.venueId as any)._id?.toString() || currentBooking.venueId.toString(),
          startDateTime,
          endDateTime,
          bookingId
        );

        console.log("Slot Available:", isAvailable);

        if (!isAvailable) {
          console.log("❌ Time slot unavailable");
          res.status(409).json({
            success: false,
            message: "Time slot is not available for this venue",
          });
          return;
        }
      }

      const updateData: any = {
        ...req.body,
        updatedBy: oid(req.user.userId),
      };

      console.log("Final Update Data:", updateData);

      const booking = await BookingService.updateBooking(bookingId, updateData);

      console.log("Update Result:", booking);

      if (!booking) {
        console.log("❌ Booking not found on update");
        res.status(404).json({ success: false, message: "Booking not found" });
        return;
      }

      console.log("✅ Booking updated successfully");

      res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        data: booking,
      });
    } catch (error: any) {
      console.error("❌ Error in updateBooking:", error);
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
      const { eventStartDateTime, eventEndDateTime, excludeBookingId } = req.query;

      if (!eventStartDateTime || !eventEndDateTime) {
        res.status(400).json({
          success: false,
          message: "Event start and end datetime are required",
        });
        return;
      }

      const isAvailable = await BookingService.checkSlotAvailability(
        venueId,
        new Date(eventStartDateTime as string),
        new Date(eventEndDateTime as string),
        excludeBookingId as string
      );

      res.status(200).json({
        success: true,
        data: { available: isAvailable },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete booking (hard delete)
   */
  static async deleteBooking(
    req: DeleteBookingReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;

      const booking = await BookingService.deleteBooking(bookingId);

      if (!booking) {
        res.status(404).json({ success: false, message: "Booking not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Booking deleted successfully",
        data: booking,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
