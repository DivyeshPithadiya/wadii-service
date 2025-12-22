import { Router } from "express";
import { TransactionController } from "../controllers/transactionController";
import { authMiddleware } from "../middlewares/auth";
import { requirePerm, ROLE_PERMS } from "../middlewares/roles";
import { validateRequest } from "../middlewares/validateRequest";
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionQuerySchema,
  TransactionIdParamSchema,
  BookingIdParamSchema,
} from "../validations/transaction.validation";

const transactionRoutes = Router();

// Apply authentication middleware to all transaction routes
transactionRoutes.use(authMiddleware);

/**
 * Create a new transaction
 * POST /api/transactions
 * Required: booking.write permission
 */
transactionRoutes.post(
  "/",
  validateRequest({ body: CreateTransactionSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_CREATE),
  TransactionController.createTransaction
);

/**
 * Get transactions with filtering
 * GET /api/transactions
 * Query params: bookingId, startDate, endDate, mode, status, type, minAmount, maxAmount, page, limit
 * Required: booking.read permission
 */
transactionRoutes.get(
  "/",
  validateRequest({ query: TransactionQuerySchema }),
  // requirePerm(ROLE_PERMS.BOOKING_READ),
  TransactionController.getTransactions
);

/**
 * Get transactions for a specific booking
 * GET /api/transactions/booking/:bookingId
 * Required: booking.read permission
 */
transactionRoutes.get(
  "/booking/:bookingId",
  validateRequest({ params: BookingIdParamSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_READ),
  TransactionController.getTransactionsByBooking
);

/**
 * Get transaction by ID
 * GET /api/transactions/:id
 * Required: booking.read permission
 */
transactionRoutes.get(
  "/:id",
  validateRequest({ params: TransactionIdParamSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_READ),
  TransactionController.getTransactionById
);

/**
 * Get booking for a transaction
 * GET /api/transactions/:id/booking
 * Required: booking.read permission
 */
transactionRoutes.get(
  "/:id/booking",
  validateRequest({ params: TransactionIdParamSchema }),
  // requirePerm(ROLE_PERMS.BOOKING_READ),
  TransactionController.getBookingForTransaction
);

/**
 * Update transaction
 * PATCH /api/transactions/:id
 * Required: booking.write permission
 */
transactionRoutes.patch(
  "/:id",
  validateRequest({
    params: TransactionIdParamSchema,
    body: UpdateTransactionSchema,
  }),
  // requirePerm(ROLE_PERMS.BOOKING_UPDATE),
  TransactionController.updateTransaction
);

export default transactionRoutes;
