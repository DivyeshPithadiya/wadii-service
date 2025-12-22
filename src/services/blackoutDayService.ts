import { BlackoutDay } from "../models/BlackoutDay";
import {
  CreateBlackoutDayDTO,
  UpdateBlackoutDayDTO,
  BlackoutDayQueryFilters,
  IBlackoutDay,
  BlackoutDayConflictResult,
} from "../types/blackout-types";
import { oid } from "../utils/helper";
import mongoose from "mongoose";

class BlackoutDayService {
  /**
   * Create a new blackout day
   */
  async createBlackoutDay(
    data: CreateBlackoutDayDTO,
    userId: string
  ): Promise<IBlackoutDay> {
    const blackoutDay = new BlackoutDay({
      ...data,
      venueId: oid(data.venueId),
      createdBy: oid(userId),
    });

    await blackoutDay.save();
    return blackoutDay;
  }

  /**
   * Get blackout day by ID
   */
  async getBlackoutDayById(id: string): Promise<IBlackoutDay | null> {
    return await BlackoutDay.findById(id)
      .populate("venueId", "venueName venueType")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");
  }

  /**
   * Get all blackout days for a venue
   */
  async getBlackoutDaysByVenue(
    venueId: string,
    filters: BlackoutDayQueryFilters = {}
  ): Promise<{ blackoutDays: IBlackoutDay[]; total: number }> {
    const query: any = { venueId: oid(venueId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.$or = [];

      if (filters.startDate && filters.endDate) {
        query.$or.push({
          $and: [
            { startDate: { $lte: filters.endDate } },
            { endDate: { $gte: filters.startDate } },
          ],
        });
      } else if (filters.startDate) {
        query.$or.push({ endDate: { $gte: filters.startDate } });
      } else if (filters.endDate) {
        query.$or.push({ startDate: { $lte: filters.endDate } });
      }
    }

    const limit = filters.limit || 50;
    const skip = filters.skip || 0;

    const [blackoutDays, total] = await Promise.all([
      BlackoutDay.find(query)
        .populate("venueId", "venueName venueType")
        .populate("createdBy", "name email")
        .sort({ startDate: 1 })
        .limit(limit)
        .skip(skip),
      BlackoutDay.countDocuments(query),
    ]);

    return { blackoutDays, total };
  }

  /**
   * Update blackout day
   */
  async updateBlackoutDay(
    id: string,
    data: UpdateBlackoutDayDTO,
    userId: string
  ): Promise<IBlackoutDay | null> {
    const updateData = {
      ...data,
      updatedBy: oid(userId),
    };

    const blackoutDay = await BlackoutDay.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("venueId", "venueName venueType")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return blackoutDay;
  }

  /**
   * Delete blackout day
   */
  async deleteBlackoutDay(id: string): Promise<boolean> {
    const result = await BlackoutDay.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Check if a date range conflicts with blackout days
   */
  async checkBlackoutConflict(
    venueId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BlackoutDayConflictResult> {
    const conflictingDays = await BlackoutDay.find({
      venueId: oid(venueId),
      status: "active",
      $or: [
        {
          $and: [
            { startDate: { $lte: endDate } },
            { endDate: { $gte: startDate } },
          ],
        },
      ],
    });

    // Check for recurring blackout days
    const recurringBlackouts = await BlackoutDay.find({
      venueId: oid(venueId),
      status: "active",
      isRecurring: true,
    });

    for (const recurring of recurringBlackouts) {
      if (this.isRecurringDateInRange(recurring, startDate, endDate)) {
        conflictingDays.push(recurring);
      }
    }

    return {
      hasConflict: conflictingDays.length > 0,
      conflictingDays:
        conflictingDays.length > 0 ? conflictingDays : undefined,
    };
  }

  /**
   * Check if recurring blackout day falls within date range
   */
  private isRecurringDateInRange(
    blackoutDay: IBlackoutDay,
    rangeStart: Date,
    rangeEnd: Date
  ): boolean {
    if (!blackoutDay.isRecurring || !blackoutDay.recurrencePattern) {
      return false;
    }

    const { frequency, interval, endRecurrence } = blackoutDay.recurrencePattern;
    let currentDate = new Date(blackoutDay.startDate);
    const blackoutDuration =
      blackoutDay.endDate.getTime() - blackoutDay.startDate.getTime();

    while (currentDate <= rangeEnd) {
      if (endRecurrence && currentDate > endRecurrence) {
        break;
      }

      const currentEndDate = new Date(
        currentDate.getTime() + blackoutDuration
      );

      if (currentDate <= rangeEnd && currentEndDate >= rangeStart) {
        return true;
      }

      switch (frequency) {
        case "weekly":
          currentDate.setDate(currentDate.getDate() + 7 * interval);
          break;
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + interval);
          break;
      }
    }

    return false;
  }

  /**
   * Get upcoming blackout days for a venue
   */
  async getUpcomingBlackoutDays(
    venueId: string,
    limit: number = 10
  ): Promise<IBlackoutDay[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await BlackoutDay.find({
      venueId: oid(venueId),
      status: "active",
      endDate: { $gte: today },
    })
      .populate("venueId", "venueName venueType")
      .sort({ startDate: 1 })
      .limit(limit);
  }

  /**
   * Get blackout days by date range
   */
  async getBlackoutDaysByDateRange(
    startDate: Date,
    endDate: Date,
    venueId?: string
  ): Promise<IBlackoutDay[]> {
    const query: any = {
      status: "active",
      $or: [
        {
          $and: [
            { startDate: { $lte: endDate } },
            { endDate: { $gte: startDate } },
          ],
        },
      ],
    };

    if (venueId) {
      query.venueId = oid(venueId);
    }

    return await BlackoutDay.find(query)
      .populate("venueId", "venueName venueType")
      .sort({ startDate: 1 });
  }

  /**
   * Bulk update blackout day status
   */
  async bulkUpdateStatus(
    ids: string[],
    status: "active" | "inactive",
    userId: string
  ): Promise<number> {
    const result = await BlackoutDay.updateMany(
      { _id: { $in: ids.map((id) => oid(id)) } },
      {
        status,
        updatedBy: oid(userId),
      }
    );

    return result.modifiedCount;
  }
}

export default new BlackoutDayService();
