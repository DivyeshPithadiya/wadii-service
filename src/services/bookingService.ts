import { Booking } from "../models/Booking";
import { IBooking } from "../types/booking-types";
import { Types } from "mongoose";

const oid = (id: string) => new Types.ObjectId(id);

export class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(bookingData: Partial<IBooking>): Promise<IBooking> {
    try {
      const booking = new Booking(bookingData);
      await booking.save();
      return booking;
    } catch (error: any) {
      throw new Error(`Error creating booking: ${error.message}`);
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string): Promise<IBooking | null> {
    try {
      const booking = await Booking.findById(oid(bookingId))
        .populate("venueId", "venueName venueType address")
        .populate("leadId", "clientName contactNo email leadStatus");
      return booking;
    } catch (error: any) {
      throw new Error(`Error fetching booking: ${error.message}`);
    }
  }

  /**
   * Get all bookings for a specific venue
   */
  static async getBookingsByVenue(
    venueId: string,
    filters?: {
      bookingStatus?: string;
      paymentStatus?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ bookings: IBooking[]; total: number }> {
    try {
      const query: any = {
        venueId,
        bookingStatus: { $ne: "cancelled" }, // Exclude soft-deleted bookings
      };

      if (filters?.bookingStatus) {
        query.bookingStatus = filters.bookingStatus;
      }

      if (filters?.paymentStatus) {
        query["payment.paymentStatus"] = filters.paymentStatus;
      }

      if (filters?.startDate || filters?.endDate) {
        query["eventDateRange.startDate"] = {};
        if (filters.startDate) {
          query["eventDateRange.startDate"].$gte = filters.startDate;
        }
        if (filters.endDate) {
          query["eventDateRange.startDate"].$lte = filters.endDate;
        }
      }

      const total = await Booking.countDocuments(query);
      const bookings = await Booking.find(query)
        .sort({ "eventDateRange.startDate": 1 })
        .limit(filters?.limit || 50)
        .skip(filters?.skip || 0)
        .populate("venueId", "venueName venueType")
        .populate("leadId", "clientName email");

      return { bookings, total };
    } catch (error: any) {
      throw new Error(`Error fetching bookings by venue: ${error.message}`);
    }
  }

  /**
   * Update booking
   */
  static async updateBooking(
    bookingId: string,
    updateData: Partial<IBooking>
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findByIdAndUpdate(
        oid(bookingId),
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );
      return booking;
    } catch (error: any) {
      throw new Error(`Error updating booking: ${error.message}`);
    }
  }

  /**
   * Soft delete booking (cancel)
   */
  static async softDeleteBooking(
    bookingId: string,
    cancellationReason?: string,
    userId?: string
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findByIdAndUpdate(
        oid(bookingId),
        {
          bookingStatus: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: cancellationReason || "",
          updatedBy: userId,
        },
        { new: true }
      );
      return booking;
    } catch (error: any) {
      throw new Error(`Error cancelling booking: ${error.message}`);
    }
  }

  /**
   * Confirm booking
   */
  static async confirmBooking(
    bookingId: string,
    userId?: string
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findByIdAndUpdate(
        oid(bookingId),
        {
          bookingStatus: "confirmed",
          confirmedAt: new Date(),
          updatedBy: userId,
        },
        { new: true }
      );
      return booking;
    } catch (error: any) {
      throw new Error(`Error confirming booking: ${error.message}`);
    }
  }

  /**
   * Update payment details
   */
  static async updatePayment(
    bookingId: string,
    advanceAmount: number,
    userId?: string
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findById(oid(bookingId));
      if (!booking) {
        throw new Error("Booking not found");
      }

      booking.payment.advanceAmount = advanceAmount;
      booking.updatedBy = userId as any;
      await booking.save(); // Triggers pre-save hook for payment calculation

      return booking;
    } catch (error: any) {
      throw new Error(`Error updating payment: ${error.message}`);
    }
  }

  /**
   * Check if time slot is available for venue
   */
  static async checkSlotAvailability(
    venueId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    try {
      const query: any = {
        venueId,
        bookingStatus: { $in: ["pending", "confirmed"] },
        $or: [
          {
            "eventDateRange.startDate": { $lte: endDate },
            "eventDateRange.endDate": { $gte: startDate },
          },
        ],
      };

      if (excludeBookingId) {
        query._id = { $ne: oid(excludeBookingId) };
      }

      const conflictingBookings = await Booking.countDocuments(query);
      return conflictingBookings === 0;
    } catch (error: any) {
      throw new Error(`Error checking slot availability: ${error.message}`);
    }
  }
}

export default new BookingService();
