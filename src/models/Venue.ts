import mongoose, { Schema, Document } from "mongoose";
import { IVenue } from "../types";

const venueSchema = new Schema<IVenue>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    venueName: {
      type: String,
      required: true,
      trim: true,
    },
    venueType: {
      type: String,
      enum: ["banquet", "lawn", "convention_center"],
      required: true,
    },
    capacity: {
      min: {
        type: Number,
        required: true,
        min: 1,
      },
      max: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
    },
    media: {
      coverImageUrl: {
        type: String,
        default: null,
      },
    },
    foodPackages: [
      {
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
        inclusions: {
          type: [String],
          default: [],
          required: false, // or true if you want it mandatory
        },
      },
    ],
    cateringServiceVendor: [
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
    services: [
      {
        service: {
          type: String,
          required: true,
          trim: true,
        },
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
        default: [],
      },
    ],
    bookingPreferences: {
      timings: {
        morning: {
          start: { type: String },
          end: { type: String },
        },
        evening: {
          start: { type: String },
          end: { type: String },
        },
        fullDay: {
          start: { type: String },
          end: { type: String },
        },
      },
      notes: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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
venueSchema.index({ businessId: 1 });
venueSchema.index({ status: 1 });
venueSchema.index({ venueType: 1 });
venueSchema.index({ createdAt: -1 });

// Validation: Ensure max capacity is greater than min capacity
venueSchema.pre("save", function (next) {
  if (this.capacity.max < this.capacity.min) {
    next(
      new Error(
        "Maximum capacity must be greater than or equal to minimum capacity"
      )
    );
  } else {
    next();
  }
});

export const Venue = mongoose.model<IVenue>("Venue", venueSchema);
