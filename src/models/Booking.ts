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
        bankDetails: {
          type: {
            accountNumber: {
              type: String,
              required: false,
              trim: true,
            },
            accountHolderName: {
              type: String,
              required: false,
              trim: true,
            },
            ifscCode: {
              type: String,
              required: false,
              trim: true,
            },
            bankName: {
              type: String,
              required: false,
              trim: true,
            },
            branchName: {
              type: String,
              required: false,
              trim: true,
            },
            upiId: {
              type: String,
              required: false,
              trim: true,
            },
          },
          required: false,
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
            bankDetails: {
              type: {
                accountNumber: {
                  type: String,
                  required: false,
                  trim: true,
                },
                accountHolderName: {
                  type: String,
                  required: false,
                  trim: true,
                },
                ifscCode: {
                  type: String,
                  required: false,
                  trim: true,
                },
                bankName: {
                  type: String,
                  required: false,
                  trim: true,
                },
                branchName: {
                  type: String,
                  required: false,
                  trim: true,
                },
                upiId: {
                  type: String,
                  required: false,
                  trim: true,
                },
              },
              required: false,
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
    // DateTime Range (Updated Structure)
    eventStartDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    eventEndDateTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: any, value: Date): boolean {
          // Skip validation if eventStartDateTime is not set (during partial updates)
          if (!this.eventStartDateTime) {
            return true;
          }
          return value > this.eventStartDateTime;
        },
        message: "End datetime must be after start datetime",
      },
    },
    slotType: {
      type: String,
      enum: ["setup", "event", "cleanup", "full_day"],
      default: "event",
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
      paymentMode: {
        type: String,
        enum: ["cash", "card", "upi", "bank_transfer", "cheque", "other"],
        required: true,
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
bookingSchema.index({ eventStartDateTime: 1 });
bookingSchema.index({ eventEndDateTime: 1 });
bookingSchema.index({ "payment.paymentStatus": 1 });

// Compound indexes for common queries
bookingSchema.index({ venueId: 1, bookingStatus: 1 });
bookingSchema.index({ venueId: 1, eventStartDateTime: 1 });
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
