// types/booking-types.ts
import { Document, Types } from "mongoose";

export interface ITimeSlot {
  startDateTime: Date;
  endDateTime: Date;
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
  timeSlots: ITimeSlot;

  // Booking Status
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";

  // Package
  package: {
    name: string;
    description: string;
    price: number;
    priceType: "flat" | "per_guest";
  };
  cateringServiceVendor: {
    name: {
      type: String;
      required: true;
      trim: true;
    };
    email: {
      type: String;
      required: true;
      trim: true;
      lowercase: true;
    };
    phone: {
      type: String;
      required: true;
      trim: true;
    };
  };
  services: [
    {
      service: {
        type: String;
        required: true;
        trim: true;
      };
      vendor: {
        name: {
          type: String;
          required: true;
          trim: true;
        };
        email: {
          type: String;
          required: true;
          trim: true;
          lowercase: true;
        };
        phone: {
          type: String;
          required: true;
          trim: true;
        };
      };
    }
  ];

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
