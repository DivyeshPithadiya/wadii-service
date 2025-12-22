import { Request, Response } from "express";
import { TransactionService } from "../services/transactionService";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionQueryParams,
} from "../types/transaction-types";

export class TransactionController {
  /**
   * Create a new transaction
   * POST /api/transactions
   */
  static async createTransaction(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const {
        bookingId,
        amount,
        mode,
        status,
        type,
        direction,
        vendorId,
        vendorType,
        purchaseOrderId,
        referenceId,
        notes,
        paidAt,
      } = req.body;

      console.log("Creating transaction with data:", req.body);

      // Validate required fields
      if (!bookingId || !amount || !mode) {
        res.status(400).json({
          success: false,
          message: "bookingId, amount, and mode are required",
        });
        return;
      }

      // Validate amount
      if (amount <= 0) {
        res.status(400).json({
          success: false,
          message: "Amount must be greater than 0",
        });
        return;
      }

      // Validate payment mode
      if (
        !["cash", "card", "upi", "bank_transfer", "cheque", "other"].includes(
          mode
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid payment mode",
        });
        return;
      }

      // Build input
      const input: CreateTransactionInput = {
        bookingId,
        amount: parseFloat(amount),
        mode,
        status,
        type,
        direction,
        referenceId,
        notes,
        paidAt: paidAt ? new Date(paidAt) : undefined,
        createdBy: req.user.userId,
      };

      // Only include vendor fields if they are provided (for outbound transactions)
      if (vendorId) input.vendorId = vendorId;
      if (vendorType) input.vendorType = vendorType;
      if (purchaseOrderId) input.purchaseOrderId = purchaseOrderId;

      // Create transaction
      const transaction = await TransactionService.createTransaction(input);

      res.status(201).json({
        success: true,
        data: transaction,
        message: "Transaction created successfully",
      });
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create transaction",
      });
    }
  }

  /**
   * Get transactions with filtering
   * GET /api/transactions
   */
  static async getTransactions(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const {
        bookingId,
        startDate,
        endDate,
        mode,
        status,
        type,
        minAmount,
        maxAmount,
        page,
        limit,
      } = req.query;

      // Build query params
      const params: TransactionQueryParams = {};

      if (bookingId) params.bookingId = bookingId as string;
      if (startDate) params.startDate = startDate as string;
      if (endDate) params.endDate = endDate as string;
      if (mode) params.mode = mode as any;
      if (status) params.status = status as any;
      if (type) params.type = type as any;
      if (minAmount) params.minAmount = parseFloat(minAmount as string);
      if (maxAmount) params.maxAmount = parseFloat(maxAmount as string);
      if (page) params.page = parseInt(page as string);
      if (limit) params.limit = parseInt(limit as string);

      // Fetch transactions
      const result = await TransactionService.getTransactions(params);

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch transactions",
      });
    }
  }

  /**
   * Get transaction by ID
   * GET /api/transactions/:id
   */
  static async getTransactionById(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      const transaction = await TransactionService.getTransactionById(id);

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error: any) {
      console.error("Error fetching transaction:", error);
      res.status(error.message === "Transaction not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch transaction",
      });
    }
  }

  /**
   * Get booking for a transaction
   * GET /api/transactions/:id/booking
   */
  static async getBookingForTransaction(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      const booking = await TransactionService.getBookingForTransaction(id);

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      console.error("Error fetching booking for transaction:", error);
      res.status(
        error.message.includes("not found") ? 404 : 500
      ).json({
        success: false,
        message: error.message || "Failed to fetch booking for transaction",
      });
    }
  }

  /**
   * Update transaction
   * PATCH /api/transactions/:id
   */
  static async updateTransaction(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const { amount, mode, status, type, referenceId, notes, paidAt } =
        req.body;

      // Build input
      const input: UpdateTransactionInput = {
        updatedBy: req.user.userId,
      };

      if (amount !== undefined) input.amount = parseFloat(amount);
      if (mode) input.mode = mode;
      if (status) input.status = status;
      if (type) input.type = type;
      if (referenceId !== undefined) input.referenceId = referenceId;
      if (notes !== undefined) input.notes = notes;
      if (paidAt) input.paidAt = new Date(paidAt);

      // Validate payment mode if provided
      if (
        mode &&
        !["cash", "card", "upi", "bank_transfer", "cheque", "other"].includes(
          mode
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid payment mode",
        });
        return;
      }

      // Update transaction
      const transaction = await TransactionService.updateTransaction(
        id,
        input
      );

      res.status(200).json({
        success: true,
        data: transaction,
        message: "Transaction updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      res.status(error.message === "Transaction not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update transaction",
      });
    }
  }

  /**
   * Get transactions for a specific booking
   * GET /api/transactions/booking/:bookingId
   */
  static async getTransactionsByBooking(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;

      const transactions = await TransactionService.getTransactionsByBooking(
        bookingId
      );

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      console.error("Error fetching transactions by booking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch transactions",
      });
    }
  }
}
