import { Document, Types } from "mongoose";

export type POStatus =
  | "draft"
  | "pending"
  | "approved"
  | "partially_paid"
  | "paid"
  | "cancelled";

export type POVendorType = "catering" | "service";

export interface VendorDetails {
  name: string;
  email?: string;
  phone?: string;
  bankDetails?: {
    accountNumber?: string;
    accountHolderName?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
    upiId?: string;
  };
}

export interface POLineItem {
  description: string;
  serviceType?: string; // e.g., "Photography", "Decoration", "Catering"
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface IPurchaseOrder extends Document {
  _id: Types.ObjectId;
  poNumber: string; // Auto-generated: PO-YYYY-MM-NNNN
  bookingId: Types.ObjectId;
  venueId: Types.ObjectId;

  // Vendor Information
  vendorType: POVendorType;
  vendorDetails: VendorDetails;
  vendorReference?: string; // Reference to vendor in booking (for tracking)

  // PO Details
  lineItems: POLineItem[];
  totalAmount: number;
  paidAmount: number; // Calculated from transactions
  balanceAmount: number; // totalAmount - paidAmount

  // Status & Dates
  status: POStatus;
  issueDate: Date;
  dueDate?: Date;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;

  // Notes
  termsAndConditions?: string;
  notes?: string;
  internalNotes?: string;

  // Tracking
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePurchaseOrderInput {
  bookingId: string;
  venueId: string;
  vendorType: POVendorType;
  vendorDetails: VendorDetails;
  vendorReference?: string;
  lineItems: POLineItem[];
  totalAmount: number;
  issueDate?: Date;
  dueDate?: Date;
  termsAndConditions?: string;
  notes?: string;
  internalNotes?: string;
  createdBy?: string;
}

export interface UpdatePurchaseOrderInput {
  vendorDetails?: VendorDetails;
  lineItems?: POLineItem[];
  totalAmount?: number;
  status?: POStatus;
  dueDate?: Date;
  termsAndConditions?: string;
  notes?: string;
  internalNotes?: string;
  approvedBy?: string;
  cancellationReason?: string;
  updatedBy?: string;
}

export interface PurchaseOrderQueryParams {
  bookingId?: string;
  venueId?: string;
  vendorType?: POVendorType;
  status?: POStatus;
  startDate?: string; // Filter by issueDate
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchVendor?: string; // Search vendor name
  page?: number;
  limit?: number;
}

export interface POSummary {
  totalPOs: number;
  draftPOs: number;
  pendingPOs: number;
  approvedPOs: number;
  paidPOs: number;
  cancelledPOs: number;
  totalPOAmount: number;
  totalPaidAmount: number;
  totalBalanceAmount: number;
  byVendorType: {
    catering: { count: number; amount: number; paid: number };
    service: { count: number; amount: number; paid: number };
  };
}
