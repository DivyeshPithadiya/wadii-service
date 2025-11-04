// types/booking-types.ts
import { Document, Types } from "mongoose";

export interface ITimeSlot {
  date: Date;
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  slotType: "setup" | "event" | "cleanup" | "full_day";
}

export interface IBooking extends Document {
  venueId: Types.ObjectId;
  leadId?: Types.ObjectId | null;

  // Client Details
  clientName: string;
  contactNo: string;
  email: string;

  // Event Details
  occasionType: string;
  numberOfGuests: number;

  // Date Range & Timing
  eventDateRange: {
    startDate: Date;
    endDate: Date;
  };
  timeSlots: ITimeSlot[];

  // Booking Status
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";

  // Package
  package: {
    name: string;
    description: string;
    price: number;
    priceType: "flat" | "per_guest";
  };

  // Services
  services: Array<{
    service: string;
  }>;

  // Payment
  payment: {
    totalAmount: number;
    advanceAmount: number;
    paymentStatus: "unpaid" | "partially_paid" | "paid";
  };

  // Notes
  notes: string;
  internalNotes: string;

  // Tracking
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  confirmedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string;

  createdAt: Date;
  updatedAt: Date;
}
