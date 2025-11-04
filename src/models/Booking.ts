import mongoose, { Schema, Document } from "mongoose";
import { IBooking } from "../types/booking-types";

const bookingSchema = new Schema<IBooking>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      default: null, // null if booking created directly without a lead
    },

    // Client Details (from Lead)
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNo: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Event Details
    occasionType: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },

    // Date Range & Timing
    eventDateRange: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    timeSlots: [
      {
        date: {
          type: Date,
          required: true,
        },
        startTime: {
          type: String, // Format: "HH:mm" (e.g., "09:00")
          required: true,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        endTime: {
          type: String, // Format: "HH:mm" (e.g., "17:00")
          required: true,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        slotType: {
          type: String,
          enum: ["setup", "event", "cleanup", "full_day"],
          default: "event",
        },
      },
    ],

    // Booking Status
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    // Package Details (from Lead)
    package: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      priceType: {
        type: String,
        enum: ["flat", "per_guest"],
        required: true,
      },
    },

    // Services
    services: [
      {
        service: {
          type: String,
          required: true,
          trim: true,
          vendors: [
            {
              name: {
                type: String,
                required: true,
                trim: true,
              },
              email: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
              },
              phone: {
                type: String,
                required: true,
                trim: true,
              },
            },
          ],
        },
      },
    ],

    // Payment Details
    payment: {
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      advanceAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
   
      paymentStatus: {
        type: String,
        enum: ["unpaid", "partially_paid", "paid"],
        default: "unpaid",
      },
    },

    // Notes
    notes: {
      type: String,
      default: "",
    },
    internalNotes: {
      type: String,
      default: "",
    },

    // Tracking
    createdBy: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
bookingSchema.index({ venueId: 1 });
bookingSchema.index({ leadId: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ "eventDateRange.startDate": 1 });
bookingSchema.index({ "eventDateRange.endDate": 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ contactNo: 1 });
bookingSchema.index({ "payment.paymentStatus": 1 });

// Compound indexes for common queries
bookingSchema.index({ venueId: 1, bookingStatus: 1 });
bookingSchema.index({ venueId: 1, "eventDateRange.startDate": 1 });
bookingSchema.index({ venueId: 1, "payment.paymentStatus": 1 });

// Pre-save middleware to calculate payment amounts
bookingSchema.pre("save", function (next) {
  if (this.payment) {
  
    

    // Update payment status
 if (this.payment.advanceAmount > 0) {
      this.payment.paymentStatus = "partially_paid";
    } else {
      this.payment.paymentStatus = "unpaid";
    }
  }
  next();
});

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
