import mongoose, { Schema } from "mongoose";
import { ITransaction } from "../types/transaction-types";

const transactionSchema = new Schema<ITransaction>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    mode: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "cheque", "other"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["initiated", "success", "failed", "refunded"],
      default: "initiated",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["advance", "partial", "full", "vendor_payment"],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      default: "inbound",
      required: true,
      index: true,
    },
    // Vendor payment fields (only for outbound transactions)
    vendorId: {
      type: Schema.Types.ObjectId,
      sparse: true,
      index: true,
    },
    vendorType: {
      type: String,
      enum: ["catering", "service"],
      sparse: true,
      index: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      sparse: true,
      index: true,
    },
    referenceId: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    paidAt: {
      type: Date,
      required: true,
      index: true,
    },
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

// Compound indexes for common queries
transactionSchema.index({ bookingId: 1, status: 1 });
transactionSchema.index({ bookingId: 1, paidAt: 1 });
transactionSchema.index({ paidAt: 1, status: 1 });
transactionSchema.index({ status: 1, mode: 1 });
transactionSchema.index({ createdAt: -1 });

// Index for amount range queries
transactionSchema.index({ amount: 1 });

// Compound index for filtering and sorting
transactionSchema.index({ status: 1, paidAt: -1 });
transactionSchema.index({ bookingId: 1, createdAt: -1 });

// Vendor transaction indexes
transactionSchema.index({ direction: 1, status: 1 });
transactionSchema.index({ vendorId: 1, status: 1 });
transactionSchema.index({ purchaseOrderId: 1, status: 1 });
transactionSchema.index({ direction: 1, vendorType: 1 });
transactionSchema.index({ bookingId: 1, direction: 1 });

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);
