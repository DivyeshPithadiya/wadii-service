import { Document, Types } from "mongoose";

export interface ILead extends Document {
  _id: Types.ObjectId;
  venueId: Types.ObjectId;
  clientName: string;
  contactNo: string;
  email: string;
  occasionType: string;
  occasionDate: Date;
  numberOfGuests: number;
  leadStatus: "cold" | "warm" | "hot";
  package: {
    name: string;
    description: string;
    price: number;
    priceType: "flat" | "per_guest";
  };
  services: Array<{
    service: string;
  }>;
  notes?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for creating a new lead
export interface CreateLeadDTO {
  venueId: Types.ObjectId;
  clientName: string;
  contactNo: string;
  email: string;
  occasionType: string;
  occasionDate: Date | undefined;
  numberOfGuests: number;
  leadStatus?: "cold" | "warm" | "hot";
  package: {
    name: string;
    description: string;
    price: number;
    priceType: "flat" | "per_guest";
  };
  services?: Array<{
    service: string;
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
  occasionDate?: Date | undefined;
  numberOfGuests?: number;
  leadStatus?: "cold" | "warm" | "hot";
  package?: {
    name: string;
    description: string;
    price: number;
    priceType: "flat" | "per_guest";
  };
  services?: Array<{
    service: string;
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
