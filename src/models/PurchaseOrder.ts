import mongoose, { Schema } from "mongoose";
import { IPurchaseOrder } from "../types/purchaseorder-types";

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Format: PO-YYYY-MM-NNNN (e.g., PO-2025-01-0001)
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
      index: true,
    },
    // Vendor Information
    vendorType: {
      type: String,
      enum: ["catering", "service"],
      required: true,
      index: true,
    },
    vendorDetails: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      bankDetails: {
        accountNumber: {
          type: String,
          trim: true,
        },
        accountHolderName: {
          type: String,
          trim: true,
        },
        ifscCode: {
          type: String,
          trim: true,
        },
        bankName: {
          type: String,
          trim: true,
        },
        branchName: {
          type: String,
          trim: true,
        },
        upiId: {
          type: String,
          trim: true,
        },
      },
    },
    vendorReference: {
      type: String,
      trim: true,
    },
    // PO Details
    lineItems: [
      {
        description: {
          type: String,
          required: true,
          trim: true,
        },
        serviceType: {
          type: String,
          trim: true,
        },
        quantity: {
          type: Number,
          min: 0,
        },
        unitPrice: {
          type: Number,
          min: 0,
        },
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      default: function (this: any) {
        return this.totalAmount - (this.paidAmount || 0);
      },
    },
    // Status & Dates
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "partially_paid", "paid", "cancelled"],
      default: "draft",
      required: true,
      index: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    // Notes
    termsAndConditions: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    internalNotes: {
      type: String,
      trim: true,
    },
    // Tracking
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
purchaseOrderSchema.index({ poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ bookingId: 1 });
purchaseOrderSchema.index({ venueId: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ vendorType: 1 });
purchaseOrderSchema.index({ issueDate: -1 });
purchaseOrderSchema.index({ createdAt: -1 });

// Compound indexes
purchaseOrderSchema.index({ venueId: 1, status: 1 });
purchaseOrderSchema.index({ bookingId: 1, vendorType: 1 });
purchaseOrderSchema.index({ status: 1, issueDate: -1 });
purchaseOrderSchema.index({ vendorType: 1, status: 1 });

// Text index for vendor name search
purchaseOrderSchema.index({ "vendorDetails.name": "text" });

// Pre-save hook to calculate balanceAmount
purchaseOrderSchema.pre("save", function (next) {
  this.balanceAmount = this.totalAmount - (this.paidAmount || 0);
  next();
});

// Pre-save hook to auto-update status based on payment
purchaseOrderSchema.pre("save", function (next) {
  if (this.status === "cancelled") {
    next();
    return;
  }

  if (this.paidAmount >= this.totalAmount && this.status !== "paid") {
    this.status = "paid";
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.status = "partially_paid";
  }

  next();
});

export const PurchaseOrder = mongoose.model<IPurchaseOrder>(
  "PurchaseOrder",
  purchaseOrderSchema
);
