import { Document, Types } from "mongoose";

export interface ILead extends Document {
  _id: Types.ObjectId;
  venueId: Types.ObjectId;
  clientName: string;
  contactNo: string;
  email: string;
  occasionType: string;
  numberOfGuests: number;
  leadStatus: "cold" | "warm" | "hot";
  timeSlot: TimeSlot;
  package?: {
    name: string;
    description?: string;
    price: number;
    priceType: "flat" | "per_guest";
  };
  cateringServiceVendor?: {
    name: string;
    email: string;
    phone: string;
  };
  services?: Array<{
    service: string;
    vendor?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    price: number;
  }>;
  notes?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeSlot {
  date: Date;
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  slotType?: "setup" | "event" | "cleanup" | "full_day";
}

// DTO for creating a new lead
export interface CreateLeadDTO {
  venueId: Types.ObjectId;
  clientName: string;
  contactNo: string;
  email: string;
  occasionType: string;
  numberOfGuests: number;
  leadStatus?: "cold" | "warm" | "hot";
  timeSlot: TimeSlot;
  package?: {
    name: string;
    description?: string;
    price: number;
    priceType: "flat" | "per_guest";
  };
  cateringServiceVendor?: {
    name: string;
    email: string;
    phone: string;
  };
  services?: Array<{
    service: string;
    vendor?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    price: number;
  }>;
  notes?: string;
  createdBy?: Types.ObjectId;
}

// DTO for updating a lead
export interface UpdateLeadDTO {
  clientName?: string;
  contactNo?: string;
  email?: string;
  occasionType?: string;
  timeSlot?: TimeSlot;
  numberOfGuests?: number;
  leadStatus?: "cold" | "warm" | "hot";
  package?: {
    name: string;
    description?: string;
    price: number;
    priceType: "flat" | "per_guest";
  };
  cateringServiceVendor?: {
    name: string;
    email: string;
    phone: string;
  };
  services?: Array<{
    service: string;
    vendor?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    price: number;
  }>;
  notes?: string;
  updatedBy?: Types.ObjectId;
}

// Query filters for fetching leads
export interface LeadQueryFilters {
  venueId?: Types.ObjectId;
  leadStatus?: "cold" | "warm" | "hot";
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  limit?: number;
  skip?: number;
  page?: number;
}

// Response for paginated leads
export interface LeadListResponse {
  leads: ILead[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Lead statistics response
export interface LeadStatsResponse {
  total: number;
  cold: number;
  warm: number;
  hot: number;
  upcomingEvents: number;
}

// Business lead statistics response
export interface BusinessLeadStatsResponse extends LeadStatsResponse {
  byVenue: Array<{
    venueId: Types.ObjectId;
    venueName: string;
    count: number;
  }>;
}

// Lead with populated fields
export interface ILeadPopulated extends Omit<ILead, "venueId" | "businessId"> {
  venueId: {
    _id: Types.ObjectId;
    venueName: string;
    venueType: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
    };
  };
  businessId: {
    _id: Types.ObjectId;
    businessName: string;
  };
}
