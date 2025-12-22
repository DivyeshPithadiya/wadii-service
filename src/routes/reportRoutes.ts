import { Router } from "express";
import { ReportController } from "../controllers/reportController";
import { authMiddleware } from "../middlewares/auth";
import { requirePerm, ROLE_PERMS } from "../middlewares/roles";

const reportRoutes = Router();

// Apply authentication middleware to all report routes
reportRoutes.use(authMiddleware);

/**
 * Get Cash Ledger Report
 * GET /api/reports/cash-ledger
 * Query params: venueId (required), startDate (optional), endDate (optional), paymentMode (optional)
 * Required: booking.read permission (reports use same permissions as bookings)
 */
reportRoutes.get(
  "/cash-ledger",
  requirePerm(ROLE_PERMS.BOOKING_READ),
  ReportController.getCashLedgerReport
);

/**
 * Get Income & Expenditure Report
 * GET /api/reports/income-expenditure
 * Query params: venueId (required), startDate (required), endDate (required), groupBy (optional)
 * Required: booking.read permission (reports use same permissions as bookings)
 */
reportRoutes.get(
  "/income-expenditure",
  requirePerm(ROLE_PERMS.BOOKING_READ),
  ReportController.getIncomeExpenditureReport
);

/**
 * Get Transactions Summary Report
 * GET /api/reports/transactions-summary
 * Query params: startDate (optional), endDate (optional), bookingId (optional)
 * Required: booking.read permission (reports use same permissions as bookings)
 */
reportRoutes.get(
  "/transactions-summary",
  requirePerm(ROLE_PERMS.BOOKING_READ),
  ReportController.getTransactionsSummary
);

/**
 * Get Vendor Payments Report
 * GET /api/reports/vendor-payments
 * Query params: venueId (optional), startDate (optional), endDate (optional), vendorType (optional)
 * Required: booking.read permission
 */
reportRoutes.get(
  "/vendor-payments",
  requirePerm(ROLE_PERMS.BOOKING_READ),
  ReportController.getVendorPaymentsReport
);

export default reportRoutes;
