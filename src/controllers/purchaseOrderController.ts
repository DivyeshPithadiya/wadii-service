import { Request, Response } from "express";
import { PurchaseOrderService } from "../services/purchaseOrderService";
import { BookingPOService } from "../services/bookingPOService";
import {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderQueryParams,
} from "../types/purchaseorder-types";

export class PurchaseOrderController {
  /**
   * Create Purchase Order
   * POST /api/purchase-orders
   */
  static async createPO(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

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
      } = req.body;

      // Validate required fields
      if (!bookingId || !venueId || !vendorType || !vendorDetails || !lineItems || !totalAmount) {
        res.status(400).json({
          success: false,
          message: "bookingId, venueId, vendorType, vendorDetails, lineItems, and totalAmount are required",
        });
        return;
      }

      // Validate vendor type
      if (!["catering", "service"].includes(vendorType)) {
        res.status(400).json({
          success: false,
          message: "Invalid vendorType. Must be: catering or service",
        });
        return;
      }

      // Build input
      const input: CreatePurchaseOrderInput = {
        bookingId,
        venueId,
        vendorType,
        vendorDetails,
        vendorReference,
        lineItems,
        totalAmount: parseFloat(totalAmount),
        issueDate: issueDate ? new Date(issueDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        termsAndConditions,
        notes,
        internalNotes,
        createdBy: req.user.userId,
      };

      // Create PO
      const po = await PurchaseOrderService.createPurchaseOrder(input);

      res.status(201).json({
        success: true,
        data: po,
        message: "Purchase Order created successfully",
      });
    } catch (error: any) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create purchase order",
      });
    }
  }

  /**
   * Get Purchase Orders with filtering
   * GET /api/purchase-orders
   */
  static async getPOs(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

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
        page,
        limit,
      } = req.query;

      // Build query params
      const params: PurchaseOrderQueryParams = {};

      if (bookingId) params.bookingId = bookingId as string;
      if (venueId) params.venueId = venueId as string;
      if (vendorType) params.vendorType = vendorType as any;
      if (status) params.status = status as any;
      if (startDate) params.startDate = startDate as string;
      if (endDate) params.endDate = endDate as string;
      if (minAmount) params.minAmount = parseFloat(minAmount as string);
      if (maxAmount) params.maxAmount = parseFloat(maxAmount as string);
      if (searchVendor) params.searchVendor = searchVendor as string;
      if (page) params.page = parseInt(page as string);
      if (limit) params.limit = parseInt(limit as string);

      // Fetch POs
      const result = await PurchaseOrderService.getPurchaseOrders(params);

      res.status(200).json({
        success: true,
        data: result.pos,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch purchase orders",
      });
    }
  }

  /**
   * Get Purchase Order by ID
   * GET /api/purchase-orders/:id
   */
  static async getPOById(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      const po = await PurchaseOrderService.getPOById(id);

      res.status(200).json({
        success: true,
        data: po,
      });
    } catch (error: any) {
      console.error("Error fetching purchase order:", error);
      res.status(error.message === "Purchase Order not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch purchase order",
      });
    }
  }

  /**
   * Update Purchase Order
   * PATCH /api/purchase-orders/:id
   */
  static async updatePO(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const {
        vendorDetails,
        lineItems,
        totalAmount,
        status,
        dueDate,
        termsAndConditions,
        notes,
        internalNotes,
        cancellationReason,
      } = req.body;

      // Build input
      const input: UpdatePurchaseOrderInput = {
        updatedBy: req.user.userId,
      };

      if (vendorDetails) input.vendorDetails = vendorDetails;
      if (lineItems) input.lineItems = lineItems;
      if (totalAmount !== undefined) input.totalAmount = parseFloat(totalAmount);
      if (status) input.status = status;
      if (dueDate) input.dueDate = new Date(dueDate);
      if (termsAndConditions !== undefined) input.termsAndConditions = termsAndConditions;
      if (notes !== undefined) input.notes = notes;
      if (internalNotes !== undefined) input.internalNotes = internalNotes;
      if (cancellationReason !== undefined) input.cancellationReason = cancellationReason;

      // Update PO
      const po = await PurchaseOrderService.updatePurchaseOrder(id, input);

      res.status(200).json({
        success: true,
        data: po,
        message: "Purchase Order updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating purchase order:", error);
      res.status(error.message === "Purchase Order not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update purchase order",
      });
    }
  }

  /**
   * Approve Purchase Order
   * POST /api/purchase-orders/:id/approve
   */
  static async approvePO(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      const po = await PurchaseOrderService.approvePO(id, req.user.userId);

      res.status(200).json({
        success: true,
        data: po,
        message: "Purchase Order approved successfully",
      });
    } catch (error: any) {
      console.error("Error approving purchase order:", error);
      res.status(error.message.includes("not found") ? 404 : 400).json({
        success: false,
        message: error.message || "Failed to approve purchase order",
      });
    }
  }

  /**
   * Cancel Purchase Order
   * POST /api/purchase-orders/:id/cancel
   */
  static async cancelPO(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: "Cancellation reason is required",
        });
        return;
      }

      const po = await PurchaseOrderService.cancelPO(id, reason, req.user.userId);

      res.status(200).json({
        success: true,
        data: po,
        message: "Purchase Order cancelled successfully",
      });
    } catch (error: any) {
      console.error("Error cancelling purchase order:", error);
      res.status(error.message.includes("not found") ? 404 : 400).json({
        success: false,
        message: error.message || "Failed to cancel purchase order",
      });
    }
  }

  /**
   * Get POs by Booking
   * GET /api/purchase-orders/booking/:bookingId
   */
  static async getPOsByBooking(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;

      const pos = await PurchaseOrderService.getPOsByBooking(bookingId);

      res.status(200).json({
        success: true,
        data: pos,
      });
    } catch (error: any) {
      console.error("Error fetching POs by booking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch purchase orders",
      });
    }
  }

  /**
   * Get PO Summary
   * GET /api/purchase-orders/summary
   */
  static async getPOSummary(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, startDate, endDate } = req.query;

      const params: PurchaseOrderQueryParams = {};

      if (venueId) params.venueId = venueId as string;
      if (startDate) params.startDate = startDate as string;
      if (endDate) params.endDate = endDate as string;

      const summary = await PurchaseOrderService.getPOSummary(params);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error("Error generating PO summary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate PO summary",
      });
    }
  }

  /**
   * Auto-generate POs for Booking
   * POST /api/purchase-orders/generate/:bookingId
   */
  static async generatePOsForBooking(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { bookingId } = req.params;

      // Check if POs already exist
      const existingCheck = await BookingPOService.checkExistingPOs(bookingId);

      if (existingCheck.hasExistingPOs) {
        res.status(400).json({
          success: false,
          message: `${existingCheck.poCount} PO(s) already exist for this booking`,
          data: existingCheck.pos,
        });
        return;
      }

      // Generate POs
      const pos = await BookingPOService.generatePOsForBooking(bookingId, req.user.userId);

      res.status(201).json({
        success: true,
        data: pos,
        message: `${pos.length} Purchase Order(s) generated successfully`,
      });
    } catch (error: any) {
      console.error("Error generating POs for booking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate purchase orders",
      });
    }
  }

  /**
   * Delete orphaned POs (POs whose bookings no longer exist)
   * DELETE /api/purchase-orders/cleanup/orphaned
   */
  static async deleteOrphanedPOs(req: Request, res: Response): Promise<void> {
    try {
      // Verify user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const result = await PurchaseOrderService.deleteOrphanedPOs();

      res.status(200).json({
        success: true,
        data: result,
        message: `${result.deletedCount} orphaned purchase order(s) deleted successfully`,
      });
    } catch (error: any) {
      console.error("Error deleting orphaned POs:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete orphaned purchase orders",
      });
    }
  }
}
