import { Request, Response } from "express";
import LeadService from "../services/leadService";
import { CreateLeadDTO, UpdateLeadDTO, LeadQueryFilters } from "../types/lead-types";
import { oid } from "../utils/helper";

type CreateLeadReq = Request<{}, any, CreateLeadDTO>;
type UpdateLeadReq = Request<{ leadId: string }, any, UpdateLeadDTO>;
type GetLeadReq = Request<{ leadId: string }>;
type GetLeadsByVenueReq = Request<
  { venueId: string },
  any,
  any,
  LeadQueryFilters
>;

type UpdateLeadStatusReq = Request<
  { leadId: string },
  any,
  { status: "cold" | "warm" | "hot" }
>;
type DeleteLeadReq = Request<{ leadId: string }>;
type SearchLeadsReq = Request<
  {},
  any,
  any,
  { searchTerm: string; venueId?: string; businessId?: string }
>;
type GetLeadsByDateRangeReq = Request<
  {},
  any,
  any,
  { startDate: string; endDate: string; venueId?: string; businessId?: string }
>;
type GetVenueStatsReq = Request<{ venueId: string }>;

type BulkUpdateStatusReq = Request<
  {},
  any,
  { leadIds: string[]; status: "cold" | "warm" | "hot" }
>;

export class LeadController {
  /**
   * Create a new lead
   */
  static async createLead(req: CreateLeadReq, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const leadData = {
        ...req.body,
        createdBy: oid(req.user.userId),
        venueId: oid(req.body.venueId),
      };

      const lead = await LeadService.createLead(leadData);

      res.status(201).json({
        success: true,
        message: "Lead created successfully",
        data: lead,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get lead by ID
   */
  static async getLeadById(req: GetLeadReq, res: Response): Promise<void> {
    try {
      const { leadId } = req.params;

      const lead = await LeadService.getLeadById(leadId);

      if (!lead) {
        res.status(404).json({ success: false, message: "Lead not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: lead,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all leads for a specific venue
   */
  static async getLeadsByVenue(
    req: GetLeadsByVenueReq,
    res: Response
  ): Promise<void> {
    try {
      const { venueId } = req.params;
      const filters: LeadQueryFilters = {
        leadStatus: req.query.leadStatus as any,
        startDate: req.query.startDate
          ? new Date(req.query.startDate )
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate )
          : undefined,
        limit: req.query.limit ? req.query.limit : 50,
        skip: req.query.skip ? req.query.skip : 0,
      };

      const result = await LeadService.getLeadsByVenue(venueId, filters);

      res.status(200).json({
        success: true,
        data: result.leads,
        pagination: {
          total: result.total,
          limit: filters.limit,
          skip: filters.skip,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update lead
   */
  static async updateLead(req: UpdateLeadReq, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { leadId } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: oid(req.user.userId),
      };

      const lead = await LeadService.updateLead(leadId, updateData);

      if (!lead) {
        res.status(404).json({ success: false, message: "Lead not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Lead updated successfully",
        data: lead,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update lead status
   */
  static async updateLeadStatus(
    req: UpdateLeadStatusReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { leadId } = req.params;
      const { status } = req.body;

      if (!["cold", "warm", "hot"].includes(status)) {
        res.status(400).json({
          success: false,
          message: "Invalid status. Must be cold, warm, or hot",
        });
        return;
      }

      const lead = await LeadService.updateLeadStatus(
        leadId,
        status,
        req.user.userId
      );

      if (!lead) {
        res.status(404).json({ success: false, message: "Lead not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Lead status updated successfully",
        data: lead,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete lead
   */
  static async deleteLead(req: DeleteLeadReq, res: Response): Promise<void> {
    try {
      const { leadId } = req.params;

      const deleted = await LeadService.deleteLead(leadId);

      if (!deleted) {
        res.status(404).json({ success: false, message: "Lead not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Lead deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Search leads
   */
  static async searchLeads(req: SearchLeadsReq, res: Response): Promise<void> {
    try {
      const { searchTerm, venueId, businessId } = req.query;

      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: "Search term is required",
        });
        return;
      }

      const leads = await LeadService.searchLeads(
        searchTerm as string,
        venueId as string,
        businessId as string
      );

      res.status(200).json({
        success: true,
        data: leads,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get leads by date range
   */
  static async getLeadsByDateRange(
    req: GetLeadsByDateRangeReq,
    res: Response
  ): Promise<void> {
    try {
      const { startDate, endDate, venueId, businessId } = req.query;

      console.log("hitting lead controller");

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
        return;
      }

      const leads = await LeadService.getLeadsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
        venueId as string,
        businessId as string
      );

      res.status(200).json({
        success: true,
        data: leads,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get venue lead statistics
   */
  static async getVenueLeadStats(
    req: GetVenueStatsReq,
    res: Response
  ): Promise<void> {
    try {
      const { venueId } = req.params;

      const stats = await LeadService.getVenueLeadStats(venueId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

 
  /**
   * Bulk update lead statuses
   */
  static async bulkUpdateLeadStatus(
    req: BulkUpdateStatusReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { leadIds, status } = req.body;

      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "Lead IDs array is required",
        });
        return;
      }

      if (!["cold", "warm", "hot"].includes(status)) {
        res.status(400).json({
          success: false,
          message: "Invalid status. Must be cold, warm, or hot",
        });
        return;
      }

      const modifiedCount = await LeadService.bulkUpdateLeadStatus(
        leadIds,
        status,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: `${modifiedCount} leads updated successfully`,
        data: { modifiedCount },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
