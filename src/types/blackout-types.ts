import { Document, Types } from "mongoose";

export interface IBlackoutDay extends Document {
  _id: Types.ObjectId;
  venueId: Types.ObjectId;
  title: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: "yearly" | "monthly" | "weekly";
    interval: number;
    endRecurrence?: Date;
  };
  status: "active" | "inactive";
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlackoutDayDTO {
  venueId: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  reason?: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    frequency: "yearly" | "monthly" | "weekly";
    interval?: number;
    endRecurrence?: Date | string;
  };
}

export interface UpdateBlackoutDayDTO {
  title?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  reason?: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    frequency: "yearly" | "monthly" | "weekly";
    interval?: number;
    endRecurrence?: Date | string;
  };
  status?: "active" | "inactive";
}

export interface BlackoutDayQueryFilters {
  status?: "active" | "inactive";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

export interface BlackoutDayConflictResult {
  hasConflict: boolean;
  conflictingDays?: IBlackoutDay[];
}
