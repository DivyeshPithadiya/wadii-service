// validations/booking-validation.ts
import { z } from "zod";

/**
 * Time format validation regex (HH:mm)
 */
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Time slot schema
 */
const timeSlotSchema = z.object({
  date: z.coerce.date(),
  startTime: z
    .string()
    .regex(timeRegex, "Start time must be in HH:mm format (e.g., 09:00)"),
  endTime: z
    .string()
    .regex(timeRegex, "End time must be in HH:mm format (e.g., 17:00)"),
  slotType: z
    .enum(["setup", "event", "cleanup", "full_day"])
    .default("event")
    .optional(),
});

/**
 * Package schema
 */
const packageSchema = z.object({
  name: z.string().trim().min(1, "Package name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  priceType: z.enum(["flat", "per_guest"]),
});

/**
 * Service schema
 */
const serviceSchema = z.object({
  service: z.string().trim().min(1, "Service name is required"),
  vendor: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().min(10).optional(),
    })
    .optional(),
  price: z.number().min(0, "Price must be positive").default(0),
});

/**
 * Create booking validation schema
 */
export const createBookingSchema = z
  .object({
    venueId: z.string().min(1, "Venue ID is required"),
    leadId: z.string().optional().nullable(),
    clientName: z.string().trim().min(1, "Client name is required"),
    contactNo: z.string().trim().min(1, "Contact number is required"),
    email: z.string().trim().toLowerCase().email("Invalid email format"),
    occasionType: z.string().trim().min(1, "Occasion type is required"),
    numberOfGuests: z
      .number()
      .int()
      .min(1, "Number of guests must be at least 1"),
    bookingStatus: z
      .enum(["pending", "confirmed", "cancelled", "completed"])
      .default("pending")
      .optional(),
    timeSlot: timeSlotSchema,
    package: packageSchema.optional(),
    cateringServiceVendor: z
      .object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      })
      .optional(),
    services: z.array(serviceSchema).optional(),
    payment: z.object({
      totalAmount: z.number().min(0, "Total amount must be positive"),
      advanceAmount: z
        .number()
        .min(0, "Advance amount must be positive")
        .default(0),
      paymentStatus: z
        .enum(["unpaid", "partially_paid", "paid"])
        .default("unpaid")
        .optional(),
    }),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
  })
  .refine((data) => data.payment.advanceAmount <= data.payment.totalAmount, {
    message: "Advance amount cannot exceed total amount",
    path: ["payment", "advanceAmount"],
  });

/**
 * Update booking validation schema
 */
export const updateBookingSchema = z
  .object({
    venueId: z.string().optional(),
    clientName: z.string().trim().min(1).optional(),
    contactNo: z.string().trim().min(1).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    occasionType: z.string().trim().min(1).optional(),
    numberOfGuests: z.number().int().min(1).optional(),
    bookingStatus: z
      .enum(["pending", "confirmed", "cancelled", "completed"])
      .optional(),
    timeSlot: timeSlotSchema.optional(),
    package: packageSchema.optional(),
    cateringServiceVendor: z
      .object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      })
      .optional(),
    services: z.array(serviceSchema).optional(),
    payment: z
      .object({
        totalAmount: z
          .number()
          .min(0, "Total amount must be positive")
          .optional(),
        advanceAmount: z
          .number()
          .min(0, "Advance amount must be positive")
          .optional(),
        paymentStatus: z.enum(["unpaid", "partially_paid", "paid"]).optional(),
      })
      .optional(),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
  })
  .partial();

/**
 * Cancel booking validation schema
 */
export const cancelBookingSchema = z.object({
  cancellationReason: z.string().optional().default(""),
});

/**
 * Update payment validation schema
 */
export const updatePaymentSchema = z.object({
  advanceAmount: z.number().min(0, "Advance amount must be positive or zero"),
});

/**
 * Booking query filters schema
 */
export const bookingQuerySchema = z.object({
  bookingStatus: z
    .enum(["pending", "confirmed", "cancelled", "completed"])
    .optional(),
  paymentStatus: z.enum(["unpaid", "partially_paid", "paid"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  skip: z.coerce.number().int().min(0).default(0).optional(),
});

/**
 * Check availability query schema
 */
export const checkAvailabilitySchema = z.object({
  date: z.string().min(1, "Date is required"),
  excludeBookingId: z.string().optional(),
});

// Export types
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
