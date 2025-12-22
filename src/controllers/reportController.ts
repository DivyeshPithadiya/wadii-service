import { Request, Response } from "express";
import { ReportService } from "../services/reportService";
import { TransactionService } from "../services/transactionService";
import { PurchaseOrderService } from "../services/purchaseOrderService";
import {
  CashLedgerQueryParams,
  IncomeExpenditureQueryParams,
} from "../types/report-types";
import { TransactionQueryParams } from "../types/transaction-types";
import { PurchaseOrderQueryParams } from "../types/purchaseorder-types";

export class ReportController {
  /**
   * Get Cash Ledger Report
   * Track payments by mode with debtor/creditor status
   *
   * GET /api/reports/cash-ledger?venueId=xxx&startDate=xxx&endDate=xxx&paymentMode=xxx
   */
  static async getCashLedgerReport(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Validate required parameters
      const { venueId, startDate, endDate, paymentMode } = req.query;

      if (!venueId) {
        res.status(400).json({
          success: false,
          message: "venueId is required",
        });
        return;
      }

      // Validate payment mode if provided
      if (
        paymentMode &&
        !["cash", "card", "upi", "bank_transfer", "cheque", "other"].includes(
          paymentMode as string
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid paymentMode",
        });
        return;
      }

      // Build query params
      const params: CashLedgerQueryParams = {
        venueId: venueId as string,
      };

      if (startDate) {
        params.startDate = startDate as string;
      }

      if (endDate) {
        params.endDate = endDate as string;
      }

      if (paymentMode) {
        params.paymentMode = paymentMode as
          | "cash"
          | "card"
          | "upi"
          | "bank_transfer"
          | "cheque"
          | "other";
      }

      // Generate report
      const reportData = await ReportService.getCashLedgerReport(params);

      res.status(200).json({
        success: true,
        data: reportData,
      });
    } catch (error: any) {
      console.error("Error generating cash ledger report:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate cash ledger report",
      });
    }
  }

  /**
   * Get Income & Expenditure Report
   * Category-wise financial breakdown
   *
   * GET /api/reports/income-expenditure?venueId=xxx&startDate=xxx&endDate=xxx&groupBy=xxx
   */
  static async getIncomeExpenditureReport(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Validate required parameters
      const { venueId, startDate, endDate, groupBy } = req.query;

      if (!venueId || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "venueId, startDate, and endDate are required",
        });
        return;
      }

      // Validate groupBy if provided
      if (
        groupBy &&
        !["service", "month", "occasionType"].includes(groupBy as string)
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid groupBy value. Must be: service, month, or occasionType",
        });
        return;
      }

      // Build query params
      const params: IncomeExpenditureQueryParams = {
        venueId: venueId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };

      if (groupBy) {
        params.groupBy = groupBy as "service" | "month" | "occasionType";
      }

      // Generate report
      const reportData = await ReportService.getIncomeExpenditureReport(
        params
      );

      res.status(200).json({
        success: true,
        data: reportData,
      });
    } catch (error: any) {
      console.error("Error generating income & expenditure report:", error);
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to generate income & expenditure report",
      });
    }
  }

  /**
   * Get Transactions Summary Report
   * Aggregated transaction metrics
   *
   * GET /api/reports/transactions-summary?startDate=xxx&endDate=xxx&bookingId=xxx
   */
  static async getTransactionsSummary(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Build query params
      const { startDate, endDate, bookingId } = req.query;

      const params: TransactionQueryParams = {};

      if (startDate) {
        params.startDate = startDate as string;
      }

      if (endDate) {
        params.endDate = endDate as string;
      }

      if (bookingId) {
        params.bookingId = bookingId as string;
      }

      // Generate summary
      const summary = await TransactionService.getTransactionSummary(params);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error("Error generating transactions summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate transactions summary",
      });
    }
  }

  /**
   * Get Vendor Payments Report
   * Track all outbound vendor transactions
   *
   * GET /api/reports/vendor-payments?venueId=xxx&startDate=xxx&endDate=xxx&vendorType=xxx
   */
  static async getVendorPaymentsReport(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, startDate, endDate, vendorType } = req.query;

      // Get PO summary
      const poParams: PurchaseOrderQueryParams = {};
      if (venueId) poParams.venueId = venueId as string;
      if (startDate) poParams.startDate = startDate as string;
      if (endDate) poParams.endDate = endDate as string;
      if (vendorType) poParams.vendorType = vendorType as any;

      const poSummary = await PurchaseOrderService.getPOSummary(poParams);

      // Get vendor transaction summary
      const txnParams: TransactionQueryParams = {
        direction: "outbound",
      };
      if (startDate) txnParams.startDate = startDate as string;
      if (endDate) txnParams.endDate = endDate as string;
      if (vendorType) txnParams.vendorType = vendorType as any;

      const txnSummary = await TransactionService.getTransactionSummary(txnParams);

      res.status(200).json({
        success: true,
        data: {
          purchaseOrders: poSummary,
          transactions: txnSummary,
          overallSummary: {
            totalPOAmount: poSummary.totalPOAmount,
            totalPaid: txnSummary.totalSuccessfulAmount,
            balanceDue: poSummary.totalBalanceAmount,
          },
        },
      });
    } catch (error: any) {
      console.error("Error generating vendor payments report:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate vendor payments report",
      });
    }
  }
}
