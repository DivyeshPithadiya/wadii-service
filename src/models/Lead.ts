import mongoose, { Schema, Document } from "mongoose";
import { ILead } from "../types/lead-types";

const leadSchema = new Schema<ILead>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
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
    // occasionDate: {
    //   type: Date,
    //   required: true,
    // },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1,
    },
    leadStatus: {
      type: String,
      enum: ["cold", "warm", "hot"],
      default: "cold",
    },
    package: {
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
    cateringServiceVendor: {
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
    services: [
      {
        service: {
          type: String,
          required: true,
          trim: true,
        },
        vendor: {
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
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
leadSchema.index({ venueId: 1 });

leadSchema.index({ leadStatus: 1 });
leadSchema.index({ occasionDate: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ contactNo: 1 });

// Compound indexes for common queries
leadSchema.index({ venueId: 1, leadStatus: 1 });
leadSchema.index({ venueId: 1, occasionDate: 1 });

export const Lead = mongoose.model<ILead>("Lead", leadSchema);
