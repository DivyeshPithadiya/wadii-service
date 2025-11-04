// types/booking-request-types.ts
import { Request } from "express";
import { IBooking } from "./booking-types";

export interface BookingQueryFilters {
  bookingStatus?: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus?: "unpaid" | "partially_paid" | "paid";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

export interface CreateBookingReq extends Request {
  body: Partial<IBooking> & {
    venueId: string;
    leadId?: string;
  };
  user?: {
    userId: string;
  };
}

export interface GetBookingReq extends Request {
  params: {
    bookingId: string;
  };
}

export interface GetBookingsByVenueReq extends Request {
  params: {
    venueId: string;
  };
  query: {
    bookingStatus?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    limit?: string;
    skip?: string;
  };
}

export interface UpdateBookingReq extends Request {
  params: {
    bookingId: string;
  };
  body: Partial<IBooking> & {
    venueId?: string;
  };
  user?: {
    userId: string;
  };
}

export interface CancelBookingReq extends Request {
  params: {
    bookingId: string;
  };
  body: {
    cancellationReason?: string;
  };
  user?: {
    userId: string;
  };
}

export interface ConfirmBookingReq extends Request {
  params: {
    bookingId: string;
  };
  user?: {
    userId: string;
  };
}

export interface UpdatePaymentReq extends Request {
  params: {
    bookingId: string;
  };
  body: {
    advanceAmount: number;
  };
  user?: {
    userId: string;
  };
}

export interface CheckAvailabilityReq extends Request {
  params: {
    venueId: string;
  };
  query: {
    startDate: string;
    endDate: string;
    excludeBookingId?: string;
  };
}
