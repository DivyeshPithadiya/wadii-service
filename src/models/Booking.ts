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
      default: null,
    },
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
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    package: {
      type: {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: false,
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
      required: false,
    },
    cateringServiceVendor: {
      type: {
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
      required: false,
    },
    services: [
      {
        service: {
          type: String,
          required: true,
          trim: true,
        },
        vendor: {
          type: {
            name: {
              type: String,
              required: false,
              trim: true,
            },
            email: {
              type: String,
              required: false,
              trim: true,
              lowercase: true,
            },
            phone: {
              type: String,
              required: false,
              trim: true,
            },
          },
          required: false,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],
    timeSlot: {
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
    // Payment Details (Booking-specific)
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
    notes: {
      type: String,
      default: "",
    },
    internalNotes: {
      type: String,
      default: "",
    },
    // Tracking (Booking-specific)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
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
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ contactNo: 1 });
bookingSchema.index({ "timeSlot.date": 1 });
bookingSchema.index({ "payment.paymentStatus": 1 });

// Compound indexes for common queries
bookingSchema.index({ venueId: 1, bookingStatus: 1 });
bookingSchema.index({ venueId: 1, "timeSlot.date": 1 });
bookingSchema.index({ venueId: 1, "payment.paymentStatus": 1 });

// Pre-save hook for payment status
bookingSchema.pre("save", function (next) {
  if (this.payment) {
    if (this.payment.advanceAmount >= this.payment.totalAmount) {
      this.payment.paymentStatus = "paid";
    } else if (this.payment.advanceAmount > 0) {
      this.payment.paymentStatus = "partially_paid";
    } else {
      this.payment.paymentStatus = "unpaid";
    }
  }
  next();
});

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
