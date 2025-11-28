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
            _id: false,
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
                _id: false,
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
leadSchema.index({ createdAt: -1 });
leadSchema.index({ email: 1 });
leadSchema.index({ contactNo: 1 });
leadSchema.index({ eventStartDateTime: 1 });
leadSchema.index({ eventEndDateTime: 1 });

// Compound indexes for common queries
leadSchema.index({ venueId: 1, leadStatus: 1 });
leadSchema.index({ venueId: 1, eventStartDateTime: 1 });

export const Lead = mongoose.model<ILead>("Lead", leadSchema);
