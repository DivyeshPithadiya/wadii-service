import { Document, Types } from "mongoose";

export type PaymentMode =
  | "cash"
  | "card"
  | "upi"
  | "bank_transfer"
  | "cheque"
  | "other";

export type TransactionStatus = "initiated" | "success" | "failed" | "refunded";

export type TransactionType = "advance" | "partial" | "full" | "vendor_payment";

export type TransactionDirection = "inbound" | "outbound";

export type VendorType = "catering" | "service";

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId;
  amount: number;
  mode: PaymentMode;
  status: TransactionStatus;
  type: TransactionType;
  direction: TransactionDirection; // inbound (customer → venue) | outbound (venue → vendor)

  // Vendor payment fields (only for outbound transactions)
  vendorId?: Types.ObjectId; // Reference to vendor from booking.services or cateringServiceVendor
  vendorType?: VendorType; // "catering" | "service"
  purchaseOrderId?: Types.ObjectId; // Reference to PurchaseOrder

  referenceId?: string;
  notes?: string;
  paidAt: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionInput {
  bookingId: string;
  amount: number;
  mode: PaymentMode;
  status?: TransactionStatus;
  type?: TransactionType;
  direction?: TransactionDirection; // defaults to "inbound"

  // Vendor payment fields
  vendorId?: string;
  vendorType?: VendorType;
  purchaseOrderId?: string;

  referenceId?: string;
  notes?: string;
  paidAt?: Date;
  createdBy?: string;
}

export interface UpdateTransactionInput {
  amount?: number;
  mode?: PaymentMode;
  status?: TransactionStatus;
  type?: TransactionType;
  referenceId?: string;
  notes?: string;
  paidAt?: Date;
  updatedBy?: string;
}

export interface TransactionQueryParams {
  bookingId?: string;
  startDate?: string;
  endDate?: string;
  mode?: PaymentMode;
  status?: TransactionStatus;
  type?: TransactionType;
  direction?: TransactionDirection;
  vendorId?: string;
  vendorType?: VendorType;
  purchaseOrderId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalSuccessfulAmount: number;
  advancePayments: number;
  partialPayments: number;
  fullPayments: number;
  byPaymentMode: {
    [key in PaymentMode]: {
      count: number;
      amount: number;
    };
  };
}
