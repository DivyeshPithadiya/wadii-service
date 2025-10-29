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
    occasionDate: {
      type: Date,
      required: true,
    },
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
    services: [
      {
        service: {
          type: String,
          required: true,
          trim: true,
        },
      
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      default: undefined,
    },
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
