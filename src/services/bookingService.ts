import { Booking } from "../models/Booking";
import { Transaction } from "../models/Transaction";
import { IBooking } from "../types/booking-types";
import { Types } from "mongoose";
import BlackoutDayService from "./blackoutDayService";
import {
  calculateFoodCost,
  calculateTotals,
  recalcFoodPackage,
} from "../utils/helper";

const oid = (id: string) => new Types.ObjectId(id);

export class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(
    bookingData: Partial<IBooking>
  ): Promise<IBooking> {
    try {
      if (
        bookingData.venueId &&
        bookingData.eventStartDateTime &&
        bookingData.eventEndDateTime
      ) {
        const conflictResult = await BlackoutDayService.checkBlackoutConflict(
          bookingData.venueId.toString(),
          bookingData.eventStartDateTime,
          bookingData.eventEndDateTime
        );

        if (conflictResult.hasConflict) {
          const conflictDates = conflictResult.conflictingDays
            ?.map(
              (bd) =>
                `${bd.title} (${new Date(
                  bd.startDate
                ).toLocaleDateString()} - ${new Date(
                  bd.endDate
                ).toLocaleDateString()})`
            )
            .join(", ");
          throw new Error(
            `Cannot create booking. The selected dates conflict with blackout days: ${conflictDates}`
          );
        }
      }
      if (bookingData.foodPackage && bookingData.numberOfGuests) {
        bookingData.foodPackage = recalcFoodPackage(bookingData.foodPackage);

        const totals = calculateTotals({
          foodPackage: bookingData.foodPackage,
          numberOfGuests: bookingData.numberOfGuests,
          services: bookingData.services,
        });

        bookingData.foodCostTotal = totals.foodCostTotal;

        bookingData.payment = {
          ...bookingData.payment,
          totalAmount: Number(totals.totalAmount),
          advanceAmount: bookingData.payment?.advanceAmount ?? 0,
          paymentStatus: bookingData.payment?.paymentStatus ?? "unpaid",
          paymentMode: bookingData.payment?.paymentMode ?? "cash",
        };
      }

      const booking = new Booking(bookingData);
      console.log("Booking instance created, saving to database...");

      await booking.save();
      console.log("Booking saved successfully. ID:", booking._id);

      // Populate and return
      console.log("Populating related fields...");
      await booking.populate([
        { path: "venueId", select: "venueName venueType address" },
        { path: "leadId", select: "clientName contactNo email leadStatus" },
        { path: "createdBy", select: "_id email firstName lastName" },
        { path: "updatedBy", select: "_id email firstName lastName" },
      ]);

      console.log("Population complete. Returning booking.");
      return booking;
    } catch (error: any) {
      console.error("Error in BookingService.createBooking:", error);
      throw new Error(`Error creating booking: ${error.message}`);
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string): Promise<any> {
    try {
      const booking = await Booking.findOne({
        _id: oid(bookingId),
        isDeleted: false,
      })
        .populate("venueId", "venueName venueType address")
        .populate("leadId", "clientName contactNo email leadStatus")
        .populate("createdBy", "_id email firstName lastName")
        .populate("updatedBy", "_id email firstName lastName")
        .lean();

      if (!booking) {
        return null;
      }

      // Fetch transaction trail (all inbound transactions)
      const transactionTrail = await Transaction.find({
        bookingId: oid(bookingId),
        direction: "inbound",
      })
        .select("amount mode status type paidAt notes referenceId createdAt")
        .sort({ paidAt: 1, createdAt: 1 })
        .lean();

      return {
        ...booking,
        transactionTrail,
      };
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
  ): Promise<{ bookings: any[]; total: number }> {
    try {
      const query: any = {
        venueId,
        isDeleted: false, // Exclude soft-deleted bookings
      };

      if (filters?.bookingStatus) {
        query.bookingStatus = filters.bookingStatus;
      }

      if (filters?.paymentStatus) {
        query["payment.paymentStatus"] = filters.paymentStatus;
      }

      if (filters?.startDate || filters?.endDate) {
        query["eventStartDateTime"] = {};
        if (filters.startDate) {
          query["eventStartDateTime"].$gte = filters.startDate;
        }
        if (filters.endDate) {
          query["eventStartDateTime"].$lte = filters.endDate;
        }
      }

      const total = await Booking.countDocuments(query);
      const bookings = await Booking.find(query)
        .sort({ eventStartDateTime: 1 })
        .limit(filters?.limit || 50)
        .skip(filters?.skip || 0)
        .populate("venueId", "venueName venueType")
        .populate("leadId", "clientName email")
        .populate("createdBy", "_id email firstName lastName")
        .populate("updatedBy", "_id email firstName lastName")
        .lean();

      // Fetch transaction trails for each booking
      const bookingsWithTransactions = await Promise.all(
        bookings.map(async (booking) => {
          const transactionTrail = await Transaction.find({
            bookingId: booking._id,
            direction: "inbound",
          })
            .select(
              "amount mode status type paidAt notes referenceId createdAt"
            )
            .sort({ paidAt: 1, createdAt: 1 })
            .lean();

          return {
            ...booking,
            transactionTrail,
          };
        })
      );

      return { bookings: bookingsWithTransactions, total };
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
      // Get current booking to check for changes
      const currentBooking = await Booking.findOne({
        _id: oid(bookingId),
        isDeleted: false,
      });

      if (!currentBooking) {
        throw new Error("Booking not found");
      }

      if (updateData.foodPackage && updateData.numberOfGuests) {
        updateData.foodPackage = recalcFoodPackage(updateData.foodPackage);

        updateData.foodCostTotal = calculateFoodCost(
          updateData.foodPackage,
          updateData.numberOfGuests
        );
      }

      const booking = await Booking.findOneAndUpdate(
        { _id: oid(bookingId), isDeleted: false },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      )
        .populate("venueId", "venueName venueType address")
        .populate("leadId", "clientName contactNo email leadStatus")
        .populate("createdBy", "_id email firstName lastName")
        .populate("updatedBy", "_id email firstName lastName");

      // If numberOfGuests changed, update the catering PO
      if (
        booking &&
        updateData.numberOfGuests &&
        updateData.numberOfGuests !== currentBooking.numberOfGuests
      ) {
        await this.updateCateringPO(booking);
      }

      return booking;
    } catch (error: any) {
      throw new Error(`Error updating booking: ${error.message}`);
    }
  }

  /**
   * Update catering PO when booking numberOfGuests changes
   */
  private static async updateCateringPO(booking: IBooking): Promise<void> {
    try {
      const { PurchaseOrder } = await import("../models/PurchaseOrder");

      // Find the catering PO for this booking
      const cateringPO = await PurchaseOrder.findOne({
        bookingId: booking._id,
        vendorType: "catering",
      });

      if (cateringPO && booking.foodPackage) {
        // Build line items from food package sections
        const lineItems: any[] = [];

        // Add main catering service line
        const unitPrice = booking.foodPackage.totalPricePerPerson || 0;
        const totalPrice = unitPrice * booking.numberOfGuests;

        lineItems.push({
          description: `Catering Services - ${booking.foodPackage.name}`,
          serviceType: "Catering",
          quantity: booking.numberOfGuests,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });

        // Add detailed line items for each section if applicable
        if (booking.foodPackage.sections && booking.foodPackage.sections.length > 0) {
          for (const section of booking.foodPackage.sections) {
            if (section.items && section.items.length > 0) {
              // Add section as a line item
              lineItems.push({
                description: `${section.sectionName} (${section.items.length} items)`,
                serviceType: section.sectionName,
                quantity: booking.numberOfGuests,
                unitPrice: section.sectionTotalPerPerson || 0,
                totalPrice: (section.sectionTotalPerPerson || 0) * booking.numberOfGuests,
              });
            }
          }
        }

        // Add inclusions as a line item if present
        if (booking.foodPackage.inclusions && booking.foodPackage.inclusions.length > 0) {
          lineItems.push({
            description: `Inclusions: ${booking.foodPackage.inclusions.join(", ")}`,
            serviceType: "Inclusions",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
          });
        }

        cateringPO.lineItems = lineItems;
        cateringPO.totalAmount = totalPrice;

        await cateringPO.save();
        console.log(
          `Updated catering PO ${cateringPO.poNumber} with new guest count: ${booking.numberOfGuests}`
        );
      }
    } catch (error: any) {
      // Log error but don't fail the booking update
      console.error(`Error updating catering PO: ${error.message}`);
    }
  }

  /**
   * Cancel booking (update status to cancelled)
   */
  static async softDeleteBooking(
    bookingId: string,
    cancellationReason?: string,
    userId?: string
  ): Promise<IBooking | null> {
    try {
      const booking = await Booking.findOneAndUpdate(
        { _id: oid(bookingId), isDeleted: false },
        {
          bookingStatus: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: cancellationReason || "",
          updatedBy: userId,
        },
        { new: true }
      )
        .populate("venueId", "venueName venueType address")
        .populate("leadId", "clientName contactNo email leadStatus")
        .populate("createdBy", "_id email firstName lastName")
        .populate("updatedBy", "_id email firstName lastName");
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
      const booking = await Booking.findOneAndUpdate(
        { _id: oid(bookingId), isDeleted: false },
        {
          bookingStatus: "confirmed",
          confirmedAt: new Date(),
          updatedBy: userId,
        },
        { new: true }
      )
        .populate("venueId", "venueName venueType address")
        .populate("leadId", "clientName contactNo email leadStatus")
        .populate("createdBy", "_id email firstName lastName")
        .populate("updatedBy", "_id email firstName lastName");
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
      const booking = await Booking.findOne({
        _id: oid(bookingId),
        isDeleted: false,
      });
      if (!booking) {
        throw new Error("Booking not found");
      }

      booking.payment.advanceAmount = advanceAmount;
      booking.updatedBy = userId as any;
      await booking.save(); // Triggers pre-save hook for payment calculation

      // Populate and return
      await booking.populate([
        { path: "venueId", select: "venueName venueType address" },
        { path: "leadId", select: "clientName contactNo email leadStatus" },
        { path: "createdBy", select: "_id email firstName lastName" },
        { path: "updatedBy", select: "_id email firstName lastName" },
      ]);

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
    eventStartDateTime: Date,
    eventEndDateTime: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    try {
      const query: any = {
        venueId,
        isDeleted: false,
        bookingStatus: { $in: ["pending", "confirmed"] },
        $or: [
          // New booking starts during an existing booking
          {
            eventStartDateTime: { $lte: eventStartDateTime },
            eventEndDateTime: { $gt: eventStartDateTime },
          },
          // New booking ends during an existing booking
          {
            eventStartDateTime: { $lt: eventEndDateTime },
            eventEndDateTime: { $gte: eventEndDateTime },
          },
          // New booking completely encompasses an existing booking
          {
            eventStartDateTime: { $gte: eventStartDateTime },
            eventEndDateTime: { $lte: eventEndDateTime },
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

  /**
   * Soft delete booking (sets isDeleted flag)
   */
  static async deleteBooking(
    bookingId: string,
    userId?: string
  ): Promise<IBooking | null> {
    try {
      // Check if there are any purchase orders associated with this booking
      const { PurchaseOrder } = await import("../models/PurchaseOrder");
      const associatedPOs = await PurchaseOrder.countDocuments({
        bookingId: oid(bookingId),
      });

      if (associatedPOs > 0) {
        console.warn(
          ` Soft deleting booking ${bookingId} which has ${associatedPOs} associated Purchase Order(s). POs will remain but no new payments can be made.`
        );
      }

      // Check if there are any transactions
      const transactionCount = await Transaction.countDocuments({
        bookingId: oid(bookingId),
      });

      if (transactionCount > 0) {
        console.warn(
          ` Soft deleting booking ${bookingId} which has ${transactionCount} transaction(s). Transactions will remain for audit purposes.`
        );
      }

      // Soft delete the booking
      const booking = await Booking.findOneAndUpdate(
        { _id: oid(bookingId), isDeleted: false },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId ? oid(userId) : null,
        },
        { new: true }
      );

      if (!booking) {
        throw new Error("Booking not found or already deleted");
      }

      return booking;
    } catch (error: any) {
      throw new Error(`Error deleting booking: ${error.message}`);
    }
  }

  /**
   * Get deleted bookings (for dev/admin use only)
   */
  static async getDeletedBookings(filters?: {
    limit?: number;
    skip?: number;
  }): Promise<{ bookings: any[]; total: number }> {
    try {
      const query = { isDeleted: true };

      const total = await Booking.countDocuments(query);
      const bookings = await Booking.find(query)
        .sort({ deletedAt: -1 })
        .limit(filters?.limit || 50)
        .skip(filters?.skip || 0)
        .populate("venueId", "venueName venueType")
        .populate("deletedBy", "email firstName lastName")
        .lean();

      return { bookings, total };
    } catch (error: any) {
      throw new Error(`Error fetching deleted bookings: ${error.message}`);
    }
  }

  /**
   * Restore a soft-deleted booking
   */
  static async restoreBooking(bookingId: string): Promise<IBooking | null> {
    try {
      const booking = await Booking.findOneAndUpdate(
        { _id: oid(bookingId), isDeleted: true },
        {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        },
        { new: true }
      )
        .populate("venueId", "venueName venueType address")
        .populate("leadId", "clientName contactNo email leadStatus");

      if (!booking) {
        throw new Error("Deleted booking not found");
      }

      return booking;
    } catch (error: any) {
      throw new Error(`Error restoring booking: ${error.message}`);
    }
  }
}

export default new BookingService();
