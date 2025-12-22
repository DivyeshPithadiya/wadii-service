import { Request, Response } from "express";
import BlackoutDayService from "../services/blackoutDayService";
import {
  CreateBlackoutDayDTO,
  UpdateBlackoutDayDTO,
  BlackoutDayQueryFilters,
} from "../types/blackout-types";

type CreateBlackoutDayReq = Request<{}, any, CreateBlackoutDayDTO>;
type UpdateBlackoutDayReq = Request<
  { blackoutDayId: string },
  any,
  UpdateBlackoutDayDTO
>;
type GetBlackoutDayReq = Request<{ blackoutDayId: string }>;
type GetBlackoutDaysByVenueReq = Request<
  { venueId: string },
  any,
  any,
  BlackoutDayQueryFilters
>;
type DeleteBlackoutDayReq = Request<{ blackoutDayId: string }>;
type CheckConflictReq = Request<
  {},
  any,
  any,
  { venueId: string; startDate: string; endDate: string }
>;
type GetUpcomingReq = Request<{ venueId: string }, any, any, { limit?: string }>;
type GetByDateRangeReq = Request<
  {},
  any,
  any,
  { startDate: string; endDate: string; venueId?: string }
>;
type BulkUpdateStatusReq = Request<
  {},
  any,
  { ids: string[]; status: "active" | "inactive" }
>;

export class BlackoutDayController {
  /**
   * Create a new blackout day
   */
  static async createBlackoutDay(
    req: CreateBlackoutDayReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const blackoutDay = await BlackoutDayService.createBlackoutDay(
        req.body,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Blackout day created successfully",
        data: blackoutDay,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get blackout day by ID
   */
  static async getBlackoutDayById(
    req: GetBlackoutDayReq,
    res: Response
  ): Promise<void> {
    try {
      const { blackoutDayId } = req.params;

      const blackoutDay = await BlackoutDayService.getBlackoutDayById(
        blackoutDayId
      );

      if (!blackoutDay) {
        res
          .status(404)
          .json({ success: false, message: "Blackout day not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: blackoutDay,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all blackout days for a specific venue
   */
  static async getBlackoutDaysByVenue(
    req: GetBlackoutDaysByVenueReq,
    res: Response
  ): Promise<void> {
    try {
      const { venueId } = req.params;
      const filters: BlackoutDayQueryFilters = {
        status: req.query.status as any,
        startDate: req.query.startDate
          ? new Date(req.query.startDate)
          : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        skip: req.query.skip ? Number(req.query.skip) : 0,
      };

      const result = await BlackoutDayService.getBlackoutDaysByVenue(
        venueId,
        filters
      );

      res.status(200).json({
        success: true,
        data: result.blackoutDays,
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
   * Update blackout day
   */
  static async updateBlackoutDay(
    req: UpdateBlackoutDayReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { blackoutDayId } = req.params;

      const blackoutDay = await BlackoutDayService.updateBlackoutDay(
        blackoutDayId,
        req.body,
        req.user.userId
      );

      if (!blackoutDay) {
        res
          .status(404)
          .json({ success: false, message: "Blackout day not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Blackout day updated successfully",
        data: blackoutDay,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete blackout day
   */
  static async deleteBlackoutDay(
    req: DeleteBlackoutDayReq,
    res: Response
  ): Promise<void> {
    try {
      const { blackoutDayId } = req.params;

      const deleted = await BlackoutDayService.deleteBlackoutDay(blackoutDayId);

      if (!deleted) {
        res
          .status(404)
          .json({ success: false, message: "Blackout day not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Blackout day deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Check if a date range conflicts with blackout days
   */
  static async checkBlackoutConflict(
    req: CheckConflictReq,
    res: Response
  ): Promise<void> {
    try {
      const { venueId, startDate, endDate } = req.query;

      if (!venueId || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "venueId, startDate, and endDate are required",
        });
        return;
      }

      const result = await BlackoutDayService.checkBlackoutConflict(
        venueId,
        new Date(startDate),
        new Date(endDate)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get upcoming blackout days for a venue
   */
  static async getUpcomingBlackoutDays(
    req: GetUpcomingReq,
    res: Response
  ): Promise<void> {
    try {
      const { venueId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;

      const blackoutDays = await BlackoutDayService.getUpcomingBlackoutDays(
        venueId,
        limit
      );

      res.status(200).json({
        success: true,
        data: blackoutDays,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get blackout days by date range
   */
  static async getBlackoutDaysByDateRange(
    req: GetByDateRangeReq,
    res: Response
  ): Promise<void> {
    try {
      const { startDate, endDate, venueId } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
        return;
      }

      const blackoutDays = await BlackoutDayService.getBlackoutDaysByDateRange(
        new Date(startDate),
        new Date(endDate),
        venueId
      );

      res.status(200).json({
        success: true,
        data: blackoutDays,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Bulk update blackout day status
   */
  static async bulkUpdateStatus(
    req: BulkUpdateStatusReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { ids, status } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: "IDs array is required",
        });
        return;
      }

      if (!["active", "inactive"].includes(status)) {
        res.status(400).json({
          success: false,
          message: "Invalid status. Must be active or inactive",
        });
        return;
      }

      const modifiedCount = await BlackoutDayService.bulkUpdateStatus(
        ids,
        status,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: `${modifiedCount} blackout days updated successfully`,
        data: { modifiedCount },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
