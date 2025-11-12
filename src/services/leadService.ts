import { Lead } from "../models/Lead";
import { ILead } from "../types/lead-types";
import mongoose, { Types } from "mongoose";
import { oid } from "../utils/helper";





export class LeadService {
  /**
   * Create a new lead
   */
  async createLead(leadData: Partial<ILead>): Promise<ILead> {
    try {
      const lead = new Lead(leadData);
      await lead.save();
      return lead;
    } catch (error:any) {
      throw new Error(`Error creating lead: ${error.message}`);
    }
  }

  /**
   * Get lead by ID
   */
  async getLeadById(leadId: string): Promise<ILead | null> {
    try {
      const lead = await Lead.findById(oid(leadId))
        .populate("venueId", "venueName venueType address")
      return lead;
    } catch (error:any) {
      throw new Error(`Error fetching lead: ${error.message}`);
    }
  }

  /**
   * Get all leads for a specific venue
   */
  async getLeadsByVenue(
    venueId: string,
    filters?: {
      leadStatus?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ leads: ILead[]; total: number }> {
    try {
      const query: any = { venueId };

      if (filters?.leadStatus) {
        query.leadStatus = filters.leadStatus;
      }

      if (filters?.startDate || filters?.endDate) {
        query["eventStartDateTime"] = {};
        if (filters.startDate) {
          query["eventStartDateTime"].$gte = filters.startDate;
        }
        if (filters.endDate) {
          query["eventStartDateTime"].$lte = filters.endDate;
        }
      }

      const total = await Lead.countDocuments(query);
      const leads = await Lead.find(query)
        .sort({ createdAt: -1 })
        .limit(filters?.limit || 50)
        .skip(filters?.skip || 0)
        .populate("venueId", "venueName venueType")
        .populate("updatedBy", "firstName lastName")
        .populate("createdBy", "firstName lastName email");

      return { leads, total };
    } catch (error:any) {
      throw new Error(`Error fetching leads by venue: ${error.message}`);
    }
  }

  /**
   * Get all leads for a business
   */
  async getLeadsByBusiness(
    businessId: string,
    filters?: {
      venueId?: string;
      leadStatus?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ leads: ILead[]; total: number }> {
    try {
      const query: any = { businessId };

      if (filters?.venueId) {
        query.venueId = filters.venueId;
      }

      if (filters?.leadStatus) {
        query.leadStatus = filters.leadStatus;
      }

      if (filters?.startDate || filters?.endDate) {
        query["eventStartDateTime"] = {};
        if (filters.startDate) {
          query["eventStartDateTime"].$gte = filters.startDate;
        }
        if (filters.endDate) {
          query["eventStartDateTime"].$lte = filters.endDate;
        }
      }

      const total = await Lead.countDocuments(query);
      const leads = await Lead.find(query)
        .sort({ createdAt: -1 })
        .limit(filters?.limit || 50)
        .skip(filters?.skip || 0)
        .populate("venueId", "venueName venueType");

      return { leads, total };
    } catch (error:any) {
      throw new Error(`Error fetching leads by business: ${error.message}`);
    }
  }

  /**
   * Update lead
   */
  async updateLead(
    leadId: string,
    updateData: Partial<ILead>
  ): Promise<ILead | null> {
    try {
      console.log("Updating lead:", leadId, updateData);
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate("venueId", "venueName venueType")
        .populate("updatedBy", "firstName lastName");

      return lead;
    } catch (error:any) {
      throw new Error(`Error updating lead: ${error.message}`);
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(
    leadId: string,
    status: "cold" | "warm" | "hot",
    updatedBy?: string
  ): Promise<ILead | null> {
    try {
      const lead = await Lead.findByIdAndUpdate(
        leadId,
        { leadStatus: status, updatedBy, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      return lead;
    } catch (error:any) {
      throw new Error(`Error updating lead status: ${error.message}`);
    }
  }

  /**
   * Delete lead (soft delete by marking as inactive or hard delete)
   */
  async deleteLead(leadId: string): Promise<boolean> {
    try {
      const result = await Lead.findByIdAndDelete(leadId);
      return !!result;
    } catch (error:any) {
      throw new Error(`Error deleting lead: ${error.message}`);
    }
  }

  /**
   * Search leads by client name, email, or contact
   */
  async searchLeads(
    searchTerm: string,
    venueId?: string,
    businessId?: string
  ): Promise<ILead[]> {
    try {
      const query: any = {
        $or: [
          { clientName: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { contactNo: { $regex: searchTerm, $options: "i" } },
        ],
      };

      if (venueId) {
        query.venueId = venueId;
      }

      if (businessId) {
        query.businessId = businessId;
      }

      const leads = await Lead.find(query)
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("venueId", "venueName venueType");

      return leads;
    } catch (error:any) {
      throw new Error(`Error searching leads: ${error.message}`);
    }
  }

  /**
   * Get leads by occasion date range
   */
  async getLeadsByDateRange(
    startDate: Date,
    endDate: Date,
    venueId?: string,
    businessId?: string
  ): Promise<ILead[]> {
    try {
      const query: any = {
        eventStartDateTime: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      if (venueId) {
        query.venueId = venueId;
      }

      if (businessId) {
        query.businessId = businessId;
      }

      const leads = await Lead.find(query)
        .sort({ eventStartDateTime: 1 })
        .populate("venueId", "venueName venueType");

      return leads;
    } catch (error:any) {
      throw new Error(`Error fetching leads by date range: ${error.message}`);
    }
  }

  /**
   * Get lead statistics for a venue
   */
  async getVenueLeadStats(venueId: string): Promise<{
    total: number;
    cold: number;
    warm: number;
    hot: number;
    upcomingEvents: number;
  }> {
    try {
      const total = await Lead.countDocuments({ venueId });
      const cold = await Lead.countDocuments({ venueId, leadStatus: "cold" });
      const warm = await Lead.countDocuments({ venueId, leadStatus: "warm" });
      const hot = await Lead.countDocuments({ venueId, leadStatus: "hot" });
      const upcomingEvents = await Lead.countDocuments({
        venueId,
        eventStartDateTime: { $gte: new Date() },
      });

      return { total, cold, warm, hot, upcomingEvents };
    } catch (error:any) {
      throw new Error(`Error fetching lead statistics: ${error.message}`);
    }
  }


  /**
   * Bulk update lead statuses
   */
  async bulkUpdateLeadStatus(
    leadIds: string[],
    status: "cold" | "warm" | "hot",
    updatedBy?: string
  ): Promise<number> {
    try {
      const result = await Lead.updateMany(
        { _id: { $in: leadIds } },
        { leadStatus: status, updatedBy, updatedAt: new Date() }
      );

      return result.modifiedCount;
    } catch (error:any) {
      throw new Error(`Error bulk updating lead status: ${error.message}`);
    }
  }
}

export default new LeadService();
