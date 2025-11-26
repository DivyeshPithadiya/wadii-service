import { Request, Response } from "express";
import { ReportService } from "../services/reportService";
import {
  CashLedgerQueryParams,
  IncomeExpenditureQueryParams,
} from "../types/report-types";

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
}
