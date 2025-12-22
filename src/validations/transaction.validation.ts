import { z } from "zod";

// Payment mode enum
export const PaymentModeSchema = z.enum([
  "cash",
  "card",
  "upi",
  "bank_transfer",
  "cheque",
  "other",
]);

// Transaction status enum
export const TransactionStatusSchema = z.enum([
  "initiated",
  "success",
  "failed",
  "refunded",
]);

// Transaction type enum
export const TransactionTypeSchema = z.enum([
  "advance",
  "partial",
  "full",
  "vendor_payment",
]);

// Transaction direction enum
export const TransactionDirectionSchema = z.enum(["inbound", "outbound"]);

// Vendor type enum
export const VendorTypeSchema = z.enum(["catering", "service"]);

/**
 * Create Transaction Schema
 */
export const CreateTransactionSchema = z
  .object({
    bookingId: z
      .string()
      .min(1, "Booking ID is required")
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format"),

    amount: z
      .number()
      .positive("Amount must be greater than 0")
      .max(10000000, "Amount is too large"),

    mode: PaymentModeSchema,

    status: TransactionStatusSchema.optional().default("success"),

    type: TransactionTypeSchema.optional(),

    direction: TransactionDirectionSchema.optional().default("inbound"),

    // Vendor payment fields (required for outbound transactions)
    vendorId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid vendor ID format")
      .optional(),

    vendorType: VendorTypeSchema.optional(),

    purchaseOrderId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid purchase order ID format")
      .optional(),

    referenceId: z
      .string()
      .max(100, "Reference ID is too long")
      .optional(),

    notes: z
      .string()
      .max(500, "Notes are too long")
      .optional(),

    paidAt: z
      .string()
      .datetime("Invalid date format")
      .or(z.date())
      .optional(),

    createdBy: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
      .optional(),
  })
  .superRefine((data, ctx) => {
    // For outbound transactions (payments to vendors), vendorType is required
    // For inbound transactions (payments from customers), vendor fields are not needed
    if (data.direction === "outbound") {
      if (!data.vendorType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "vendorType is required for outbound transactions",
          path: ["vendorType"],
        });
      }
    }
  });

/**
 * Update Transaction Schema
 */
export const UpdateTransactionSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(10000000, "Amount is too large")
    .optional(),

  mode: PaymentModeSchema.optional(),

  status: TransactionStatusSchema.optional(),

  type: TransactionTypeSchema.optional(),

  referenceId: z
    .string()
    .max(100, "Reference ID is too long")
    .optional(),

  notes: z
    .string()
    .max(500, "Notes are too long")
    .optional(),

  paidAt: z
    .string()
    .datetime("Invalid date format")
    .or(z.date())
    .optional(),

  updatedBy: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
    .optional(),
});

/**
 * Transaction Query Parameters Schema
 */
export const TransactionQuerySchema = z.object({
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format")
    .optional(),

  startDate: z
    .string()
    .datetime("Invalid start date format")
    .optional(),

  endDate: z
    .string()
    .datetime("Invalid end date format")
    .optional(),

  mode: PaymentModeSchema.optional(),

  status: TransactionStatusSchema.optional(),

  type: TransactionTypeSchema.optional(),

  direction: TransactionDirectionSchema.optional(),

  vendorId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid vendor ID format")
    .optional(),

  vendorType: VendorTypeSchema.optional(),

  purchaseOrderId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid purchase order ID format")
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
 * Transaction ID Parameter Schema
 */
export const TransactionIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid transaction ID format"),
});

/**
 * Booking ID Parameter Schema
 */
export const BookingIdParamSchema = z.object({
  bookingId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID format"),
});

// Export types inferred from schemas
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type TransactionQueryInput = z.infer<typeof TransactionQuerySchema>;
export type TransactionIdParam = z.infer<typeof TransactionIdParamSchema>;
export type BookingIdParam = z.infer<typeof BookingIdParamSchema>;
