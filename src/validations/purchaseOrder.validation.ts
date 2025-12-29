import { z } from "zod";

// PO Status enum
export const POStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "partially_paid",
  "paid",
  "cancelled",
]);

// Vendor type enum
export const POVendorTypeSchema = z.enum(["catering", "service"]);

/**
 * Bank Details Schema
 */
export const BankDetailsSchema = z.object({
  accountNumber: z.string().max(20, "Account number is too long").optional(),

  accountHolderName: z
    .string()
    .max(100, "Account holder name is too long")
    .optional(),

  ifscCode: z.string().max(11, "IFSC code must be 11 characters").optional(),

  bankName: z.string().max(100, "Bank name is too long").optional(),

  branchName: z.string().max(100, "Branch name is too long").optional(),

  upiId: z
    .string()
    .max(50, "UPI ID is too long")
    .regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID format")
    .optional(),
});

/**
 * Vendor Details Schema
 */
export const VendorDetailsSchema = z.object({
  name: z
    .string()
    .min(1, "Vendor name is required")
    .max(100, "Vendor name is too long"),

  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email is too long")
    .optional(),

  phone: z
    .string()
    .regex(/^[+]?[\d\s()-]{10,15}$/, "Invalid phone number format")
    .optional(),

  bankDetails: BankDetailsSchema.optional(),
});

/**
 * PO Line Item Schema
 */
export const POLineItemSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description is too long"),

  serviceType: z
    .string()
    .max(100, "Service type is too long")
    .optional(),

  quantity: z
    .number()
    .int("Quantity must be an integer")
    .nonnegative("Quantity cannot be negative")
    .optional(),

  unitPrice: z
    .number()
    .nonnegative("Unit price cannot be negative")
    .optional(),

  totalPrice: z
    .number()
    .positive("Total price must be greater than 0")
    .max(10000000, "Total price is too large"),
});

/**
 * Create Purchase Order Schema
 */
export const CreatePurchaseOrderSchema = z.object({
  bookingId: z
    .string()
    .min(1, "Booking ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format"),

  venueId: z
    .string()
    .min(1, "Venue ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid venue ID format"),

  vendorType: POVendorTypeSchema,

  vendorDetails: VendorDetailsSchema,

  vendorReference: z
    .string()
    .max(100, "Vendor reference is too long")
    .optional(),

  lineItems: z
    .array(POLineItemSchema)
    .min(1, "At least one line item is required")
    .max(50, "Too many line items"),

  totalAmount: z
    .number()
    .positive("Total amount must be greater than 0")
    .max(10000000, "Total amount is too large"),

  issueDate: z
    .string()
    .datetime("Invalid issue date format")
    .or(z.date())
    .optional(),

  dueDate: z
    .string()
    .datetime("Invalid due date format")
    .or(z.date())
    .optional(),

  termsAndConditions: z
    .string()
    .max(2000, "Terms and conditions are too long")
    .optional(),

  notes: z
    .string()
    .max(500, "Notes are too long")
    .optional(),

  internalNotes: z
    .string()
    .max(500, "Internal notes are too long")
    .optional(),

  createdBy: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
    .optional(),
}).superRefine((data, ctx) => {
  // Validate dueDate is after issueDate
  if (data.issueDate && data.dueDate) {
    const issue = typeof data.issueDate === 'string' ? new Date(data.issueDate) : data.issueDate;
    const due = typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate;

    if (due <= issue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date must be after issue date",
        path: ["dueDate"],
      });
    }
  }

  // Validate totalAmount matches sum of line items
  const lineItemsTotal = data.lineItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  const diff = Math.abs(lineItemsTotal - data.totalAmount);

  if (diff > 0.01) { // Allow for small floating point differences
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total amount (${data.totalAmount}) does not match sum of line items (${lineItemsTotal})`,
      path: ["totalAmount"],
    });
  }
});

/**
 * Update Purchase Order Schema
 */
export const UpdatePurchaseOrderSchema = z.object({
  vendorDetails: VendorDetailsSchema.optional(),

  lineItems: z
    .array(POLineItemSchema)
    .min(1, "At least one line item is required")
    .max(50, "Too many line items")
    .optional(),

  totalAmount: z
    .number()
    .positive("Total amount must be greater than 0")
    .max(10000000, "Total amount is too large")
    .optional(),

  status: POStatusSchema.optional(),

  dueDate: z
    .string()
    .datetime("Invalid due date format")
    .or(z.date())
    .optional(),

  termsAndConditions: z
    .string()
    .max(2000, "Terms and conditions are too long")
    .optional(),

  notes: z
    .string()
    .max(500, "Notes are too long")
    .optional(),

  internalNotes: z
    .string()
    .max(500, "Internal notes are too long")
    .optional(),

  cancellationReason: z
    .string()
    .max(500, "Cancellation reason is too long")
    .optional(),

  approvedBy: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
    .optional(),

  updatedBy: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
    .optional(),
});

/**
 * Cancel PO Schema
 */
export const CancelPOSchema = z.object({
  reason: z
    .string()
    .min(1, "Cancellation reason is required")
    .max(500, "Cancellation reason is too long"),
});

/**
 * Purchase Order Query Parameters Schema
 */
export const PurchaseOrderQuerySchema = z.object({
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format")
    .optional(),

  venueId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid venue ID format")
    .optional(),

  vendorType: POVendorTypeSchema.optional(),

  status: POStatusSchema.optional(),

  startDate: z
    .string()
    .datetime("Invalid start date format")
    .optional(),

  endDate: z
    .string()
    .datetime("Invalid end date format")
    .optional(),

  minAmount: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().nonnegative("Min amount must be non-negative"))
    .optional(),

  maxAmount: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().positive("Max amount must be positive"))
    .optional(),

  searchVendor: z
    .string()
    .max(100, "Search term is too long")
    .optional(),

  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive("Page must be a positive integer"))
    .optional(),

  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int()
        .positive("Limit must be a positive integer")
        .max(100, "Limit cannot exceed 100")
    )
    .optional(),
});

/**
 * PO ID Parameter Schema
 */
export const POIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid purchase order ID format"),
});

/**
 * Booking ID Parameter Schema for PO
 */
export const POBookingIdParamSchema = z.object({
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format"),
});

// Export types inferred from schemas
export type CreatePurchaseOrderInput = z.infer<typeof CreatePurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof UpdatePurchaseOrderSchema>;
export type CancelPOInput = z.infer<typeof CancelPOSchema>;
export type PurchaseOrderQueryInput = z.infer<typeof PurchaseOrderQuerySchema>;
export type POIdParam = z.infer<typeof POIdParamSchema>;
export type POBookingIdParam = z.infer<typeof POBookingIdParamSchema>;
