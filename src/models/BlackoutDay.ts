import mongoose, { Schema, Document } from "mongoose";
import { IBlackoutDay } from "../types/blackout-types";

const blackoutDaySchema = new Schema<IBlackoutDay>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: any, value: Date): boolean {
          if (!this.startDate) {
            return true;
          }
          return value >= this.startDate;
        },
        message: "End date must be on or after start date",
      },
    },
    reason: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: {
        frequency: {
          type: String,
          enum: ["yearly", "monthly", "weekly"],
          required: function (this: any) {
            return this.isRecurring;
          },
        },
        interval: {
          type: Number,
          min: 1,
          default: 1,
        },
        endRecurrence: {
          type: Date,
          required: false,
        },
      },
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
blackoutDaySchema.index({ venueId: 1 });
blackoutDaySchema.index({ status: 1 });
blackoutDaySchema.index({ startDate: 1, endDate: 1 });
blackoutDaySchema.index({ venueId: 1, status: 1, startDate: 1 });

export const BlackoutDay = mongoose.model<IBlackoutDay>(
  "BlackoutDay",
  blackoutDaySchema
);
