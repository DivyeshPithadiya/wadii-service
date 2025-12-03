import { PurchaseOrder } from "../models/PurchaseOrder";
import { Transaction } from "../models/Transaction";
import { Booking } from "../models/Booking";
import { Types } from "mongoose";
import {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderQueryParams,
  POSummary,
} from "../types/purchaseorder-types";

const oid = (id: string) => new Types.ObjectId(id);

export class PurchaseOrderService {
  /**
   * Generate PO Number
   * Format: PO-YYYY-MM-NNNN (e.g., PO-2025-01-0001)
   */
  static async generatePONumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Find the last PO for this month
    const prefix = `PO-${year}-${month}-`;
    const lastPO = await PurchaseOrder.findOne({
      poNumber: { $regex: `^${prefix}` },
    })
      .sort({ poNumber: -1 })
      .limit(1)
      .lean();

    let sequence = 1;
    if (lastPO) {
      const lastSequence = parseInt(lastPO.poNumber.split("-").pop() || "0");
      sequence = lastSequence + 1;
    }

    const poNumber = `${prefix}${String(sequence).padStart(4, "0")}`;
    return poNumber;
  }

  /**
   * Create Purchase Order
   */
  static async createPurchaseOrder(
    input: CreatePurchaseOrderInput
  ): Promise<any> {
    try {
      const {
        bookingId,
        venueId,
        vendorType,
        vendorDetails,
        vendorReference,
        lineItems,
        totalAmount,
        issueDate,
        dueDate,
        termsAndConditions,
        notes,
        internalNotes,
        createdBy,
      } = input;

      // Validate booking exists
      const booking = await Booking.findById(oid(bookingId));
      if (!booking) {
        throw new Error("Booking not found");
      }

      // Generate PO number
      const poNumber = await this.generatePONumber();

      // Create PO
      const purchaseOrder = await PurchaseOrder.create({
        poNumber,
        bookingId: oid(bookingId),
        venueId: oid(venueId),
        vendorType,
        vendorDetails,
        vendorReference,
        lineItems,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        status: "draft",
        issueDate: issueDate || new Date(),
        dueDate,
        termsAndConditions,
        notes,
        internalNotes,
        createdBy: createdBy ? oid(createdBy) : undefined,
      });

      return purchaseOrder;
    } catch (error: any) {
      throw new Error(`Error creating purchase order: ${error.message}`);
    }
  }

  /**
   * Get PO by ID
   */
  static async getPOById(poId: string): Promise<any> {
    try {
      const po = await PurchaseOrder.findById(oid(poId))
        .populate("bookingId", "clientName contactNo email eventStartDateTime")
        .populate("venueId", "venueName address")
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .populate("approvedBy", "name email")
        .lean();

      if (!po) {
        throw new Error("Purchase Order not found");
      }

      // Fetch related transactions
      const transactions = await Transaction.find({
        purchaseOrderId: oid(poId),
        status: "success",
        direction: "outbound",
      })
        .select("amount mode paidAt notes referenceId createdAt")
        .sort({ paidAt: 1 })
        .lean();

      return {
        ...po,
        transactionTrail: transactions,
      };
    } catch (error: any) {
      throw new Error(`Error fetching purchase order: ${error.message}`);
    }
  }

  /**
   * Get POs with filtering
   */
  static async getPurchaseOrders(
    params: PurchaseOrderQueryParams
  ): Promise<any> {
    try {
      const {
        bookingId,
        venueId,
        vendorType,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        searchVendor,
        page = 1,
        limit = 50,
      } = params;

      // Build query
      const query: any = {};

      if (bookingId) query.bookingId = oid(bookingId);
      if (venueId) query.venueId = oid(venueId);
      if (vendorType) query.vendorType = vendorType;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.issueDate = {};
        if (startDate) query.issueDate.$gte = new Date(startDate);
        if (endDate) query.issueDate.$lte = new Date(endDate);
      }

      if (minAmount !== undefined || maxAmount !== undefined) {
        query.totalAmount = {};
        if (minAmount !== undefined) query.totalAmount.$gte = minAmount;
        if (maxAmount !== undefined) query.totalAmount.$lte = maxAmount;
      }

      if (searchVendor) {
        query["vendorDetails.name"] = { $regex: searchVendor, $options: "i" };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [pos, total] = await Promise.all([
        PurchaseOrder.find(query)
          .populate("bookingId", "clientName contactNo eventStartDateTime")
          .populate("venueId", "venueName")
          .populate("createdBy", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PurchaseOrder.countDocuments(query),
      ]);

      // Fetch transaction trails for each PO
      const posWithTransactions = await Promise.all(
        pos.map(async (po) => {
          const transactions = await Transaction.find({
            purchaseOrderId: po._id,
            status: "success",
            direction: "outbound",
          })
            .select("amount mode paidAt notes referenceId createdAt")
            .sort({ paidAt: 1 })
            .lean();

          return {
            ...po,
            transactionTrail: transactions,
          };
        })
      );

      return {
        pos: posWithTransactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      throw new Error(`Error fetching purchase orders: ${error.message}`);
    }
  }

  /**
   * Update Purchase Order
   */
  static async updatePurchaseOrder(
    poId: string,
    input: UpdatePurchaseOrderInput
  ): Promise<any> {
    try {
      const po = await PurchaseOrder.findById(oid(poId));

      if (!po) {
        throw new Error("Purchase Order not found");
      }

      // Update fields
      if (input.vendorDetails) po.vendorDetails = input.vendorDetails;
      if (input.lineItems) po.lineItems = input.lineItems;
      if (input.totalAmount !== undefined) po.totalAmount = input.totalAmount;
      if (input.status) po.status = input.status;
      if (input.dueDate) po.dueDate = input.dueDate;
      if (input.termsAndConditions !== undefined)
        po.termsAndConditions = input.termsAndConditions;
      if (input.notes !== undefined) po.notes = input.notes;
      if (input.internalNotes !== undefined)
        po.internalNotes = input.internalNotes;
      if (input.cancellationReason !== undefined)
        po.cancellationReason = input.cancellationReason;
      if (input.updatedBy) po.updatedBy = oid(input.updatedBy);

      // Handle approval
      if (input.approvedBy) {
        po.approvedBy = oid(input.approvedBy);
        po.approvedAt = new Date();
        if (po.status === "draft" || po.status === "pending") {
          po.status = "approved";
        }
      }

      // Handle cancellation
      if (input.status === "cancelled" && !po.cancelledAt) {
        po.cancelledAt = new Date();
      }

      await po.save();

      return po;
    } catch (error: any) {
      throw new Error(`Error updating purchase order: ${error.message}`);
    }
  }

  /**
   * Approve Purchase Order
   */
  static async approvePO(poId: string, approvedBy: string): Promise<any> {
    try {
      const po = await PurchaseOrder.findById(oid(poId));

      if (!po) {
        throw new Error("Purchase Order not found");
      }

      if (po.status === "cancelled") {
        throw new Error("Cannot approve a cancelled PO");
      }

      if (po.status === "paid") {
        throw new Error("PO is already paid");
      }

      po.status = "approved";
      po.approvedBy = oid(approvedBy);
      po.approvedAt = new Date();

      await po.save();

      return po;
    } catch (error: any) {
      throw new Error(`Error approving purchase order: ${error.message}`);
    }
  }

  /**
   * Cancel Purchase Order
   */
  static async cancelPO(
    poId: string,
    reason: string,
    cancelledBy: string
  ): Promise<any> {
    try {
      const po = await PurchaseOrder.findById(oid(poId));

      if (!po) {
        throw new Error("Purchase Order not found");
      }

      if (po.status === "paid") {
        throw new Error("Cannot cancel a paid PO");
      }

      po.status = "cancelled";
      po.cancelledAt = new Date();
      po.cancellationReason = reason;
      po.updatedBy = oid(cancelledBy);

      await po.save();

      return po;
    } catch (error: any) {
      throw new Error(`Error cancelling purchase order: ${error.message}`);
    }
  }

  /**
   * Update PO payment status from transactions
   */
  static async updatePOPaymentStatus(poId: string): Promise<void> {
    try {
      const po = await PurchaseOrder.findById(oid(poId));
      if (!po) {
        throw new Error("Purchase Order not found");
      }

      // Calculate total paid from successful transactions
      const transactions = await Transaction.find({
        purchaseOrderId: oid(poId),
        status: "success",
      });

      const totalPaid = transactions.reduce((sum, txn) => sum + txn.amount, 0);

      po.paidAmount = totalPaid;
      await po.save(); // Pre-save hook will update status and balanceAmount
    } catch (error: any) {
      throw new Error(
        `Error updating PO payment status: ${error.message}`
      );
    }
  }

  /**
   * Get PO Summary
   */
  static async getPOSummary(params: PurchaseOrderQueryParams): Promise<POSummary> {
    try {
      const { venueId, startDate, endDate } = params;

      // Build match stage
      const matchStage: any = {};

      if (venueId) matchStage.venueId = oid(venueId);

      if (startDate || endDate) {
        matchStage.issueDate = {};
        if (startDate) matchStage.issueDate.$gte = new Date(startDate);
        if (endDate) matchStage.issueDate.$lte = new Date(endDate);
      }

      // Aggregate summary
      const summary = await PurchaseOrder.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalPOs: { $sum: 1 },
            draftPOs: {
              $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
            },
            pendingPOs: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            approvedPOs: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            paidPOs: {
              $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
            },
            cancelledPOs: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
            totalPOAmount: { $sum: "$totalAmount" },
            totalPaidAmount: { $sum: "$paidAmount" },
            totalBalanceAmount: { $sum: "$balanceAmount" },
          },
        },
      ]);

      // Aggregate by vendor type
      const byVendorType = await PurchaseOrder.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$vendorType",
            count: { $sum: 1 },
            amount: { $sum: "$totalAmount" },
            paid: { $sum: "$paidAmount" },
          },
        },
      ]);

      const vendorTypeSummary = {
        catering: { count: 0, amount: 0, paid: 0 },
        service: { count: 0, amount: 0, paid: 0 },
      };

      byVendorType.forEach((item) => {
        vendorTypeSummary[item._id as "catering" | "service"] = {
          count: item.count,
          amount: item.amount,
          paid: item.paid,
        };
      });

      const result = summary[0] || {
        totalPOs: 0,
        draftPOs: 0,
        pendingPOs: 0,
        approvedPOs: 0,
        paidPOs: 0,
        cancelledPOs: 0,
        totalPOAmount: 0,
        totalPaidAmount: 0,
        totalBalanceAmount: 0,
      };

      return {
        ...result,
        byVendorType: vendorTypeSummary,
      };
    } catch (error: any) {
      throw new Error(`Error generating PO summary: ${error.message}`);
    }
  }

  /**
   * Get all POs for a booking
   */
  static async getPOsByBooking(bookingId: string): Promise<any[]> {
    try {
      const pos = await PurchaseOrder.find({
        bookingId: oid(bookingId),
      })
        .populate("createdBy", "name email")
        .populate("approvedBy", "name email")
        .sort({ createdAt: 1 })
        .lean();

      return pos;
    } catch (error: any) {
      throw new Error(`Error fetching POs by booking: ${error.message}`);
    }
  }
}
