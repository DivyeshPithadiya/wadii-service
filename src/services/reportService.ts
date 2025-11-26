import { Booking } from "../models/Booking";
import { Types } from "mongoose";
import {
  CashLedgerQueryParams,
  CashLedgerReportData,
  PaymentModeSummary,
  DebtorInfo,
  CreditorInfo,
  IncomeExpenditureQueryParams,
  IncomeExpenditureReportData,
  BreakdownItem,
} from "../types/report-types";

const oid = (id: string) => new Types.ObjectId(id);

export class ReportService {
  /**
   * Generate Cash Ledger Report
   * Tracks payments by mode with debtor/creditor status
   */
  static async getCashLedgerReport(
    params: CashLedgerQueryParams
  ): Promise<CashLedgerReportData> {
    try {
      const { venueId, startDate, endDate, paymentMode } = params;

      // Build query
      const query: any = {
        venueId: oid(venueId),
      };

      // Add date filters if provided
      if (startDate || endDate) {
        query.eventStartDateTime = {};
        if (startDate) {
          query.eventStartDateTime.$gte = new Date(startDate);
        }
        if (endDate) {
          query.eventStartDateTime.$lte = new Date(endDate);
        }
      }

      // Add payment mode filter if provided
      if (paymentMode) {
        query["payment.paymentMode"] = paymentMode;
      }

      // Fetch bookings
      const bookings = await Booking.find(query).sort({
        eventStartDateTime: 1,
      });

      // Initialize summary
      const summary = {
        totalReceived: 0,
        totalPending: 0,
        byPaymentMode: {
          cash: { received: 0, pending: 0 },
          upi: { received: 0, pending: 0 },
          bank_transfer: { received: 0, pending: 0 },
          card: { received: 0, pending: 0 },
          cheque: { received: 0, pending: 0 },
          other: { received: 0, pending: 0 },
        },
      };

      const debtors: DebtorInfo[] = [];
      const creditors: CreditorInfo[] = [];

      // Process each booking
      for (const booking of bookings) {
        const { payment } = booking;
        const totalAmount = payment.totalAmount || 0;
        const advanceAmount = payment.advanceAmount || 0;
        const pendingAmount = totalAmount - advanceAmount;
        const mode = payment.paymentMode as keyof typeof summary.byPaymentMode;

        // Update totals
        summary.totalReceived += advanceAmount;
        summary.totalPending += pendingAmount;

        // Update by payment mode
        if (summary.byPaymentMode[mode]) {
          summary.byPaymentMode[mode].received += advanceAmount;
          summary.byPaymentMode[mode].pending += pendingAmount;
        }

        // Add to debtors if pending amount exists
        if (pendingAmount > 0) {
          debtors.push({
            bookingId: booking._id,
            clientName: booking.clientName,
            contactNo: booking.contactNo,
            email: booking.email,
            totalAmount,
            advanceAmount,
            pendingAmount,
            eventDate: booking.eventStartDateTime,
            paymentMode: payment.paymentMode,
            occasionType: booking.occasionType,
          });
        }

        // Process services for creditors
        if (booking.services && booking.services.length > 0) {
          for (const service of booking.services) {
            if (service.vendor) {
              creditors.push({
                bookingId: booking._id,
                serviceName: service.service,
                vendorName: service.vendor.name,
                amountDue: service.price,
                eventDate: booking.eventStartDateTime,
                bankDetails: service.vendor.bankDetails,
              });
            }
          }
        }
      }

      return {
        summary,
        debtors,
        creditors,
      };
    } catch (error: any) {
      throw new Error(`Error generating cash ledger report: ${error.message}`);
    }
  }

  /**
   * Generate Income & Expenditure Report
   * Category-wise financial breakdown
   */
  static async getIncomeExpenditureReport(
    params: IncomeExpenditureQueryParams
  ): Promise<IncomeExpenditureReportData> {
    try {
      const { venueId, startDate, endDate, groupBy = "service" } = params;

      // Build query
      const query: any = {
        venueId: oid(venueId),
        eventStartDateTime: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

      let breakdown: BreakdownItem[] = [];

      if (groupBy === "service") {
        // Group by service
        breakdown = await this.getBreakdownByService(query);
      } else if (groupBy === "occasionType") {
        // Group by occasion type
        breakdown = await this.getBreakdownByOccasionType(query);
      } else if (groupBy === "month") {
        // Group by month
        breakdown = await this.getBreakdownByMonth(query);
      }

      // Calculate totals
      const summary = {
        totalIncome: breakdown.reduce((sum, item) => sum + item.income, 0),
        totalExpenditure: breakdown.reduce(
          (sum, item) => sum + item.expenditure,
          0
        ),
        netProfit: 0,
      };
      summary.netProfit = summary.totalIncome - summary.totalExpenditure;

      return {
        summary,
        breakdown,
        period: {
          startDate,
          endDate,
        },
      };
    } catch (error: any) {
      throw new Error(
        `Error generating income & expenditure report: ${error.message}`
      );
    }
  }

  /**
   * Helper: Get breakdown by service
   */
  private static async getBreakdownByService(
    query: any
  ): Promise<BreakdownItem[]> {
    const bookings = await Booking.find(query);

    // Calculate venue charges (booking revenue)
    const venueIncome = bookings.reduce(
      (sum, booking) => sum + (booking.payment?.totalAmount || 0),
      0
    );
    const venueBookingsCount = bookings.length;

    const breakdown: BreakdownItem[] = [
      {
        category: "Booking Revenue",
        categoryType: "venue_charges",
        income: venueIncome,
        expenditure: 0,
        net: venueIncome,
        bookingsCount: venueBookingsCount,
      },
    ];

    // Group services
    const serviceMap = new Map<
      string,
      { income: number; expenditure: number; count: number }
    >();

    for (const booking of bookings) {
      if (booking.services && booking.services.length > 0) {
        for (const service of booking.services) {
          const serviceName = service.service;
          const servicePrice = service.price || 0;

          if (!serviceMap.has(serviceName)) {
            serviceMap.set(serviceName, {
              income: 0,
              expenditure: 0,
              count: 0,
            });
          }

          const serviceData = serviceMap.get(serviceName)!;
          // If vendor exists, it's an expenditure; otherwise, it's income
          if (service.vendor) {
            serviceData.expenditure += servicePrice;
          } else {
            serviceData.income += servicePrice;
          }
          serviceData.count += 1;
        }
      }
    }

    // Convert map to breakdown items
    serviceMap.forEach((data, serviceName) => {
      breakdown.push({
        category: serviceName,
        categoryType: "service",
        income: data.income,
        expenditure: data.expenditure,
        net: data.income - data.expenditure,
        bookingsCount: data.count,
      });
    });

    return breakdown;
  }

  /**
   * Helper: Get breakdown by occasion type
   */
  private static async getBreakdownByOccasionType(
    query: any
  ): Promise<BreakdownItem[]> {
    const bookings = await Booking.find(query);

    const occasionMap = new Map<
      string,
      { income: number; expenditure: number; count: number }
    >();

    for (const booking of bookings) {
      const occasionType = booking.occasionType;
      const income = booking.payment?.totalAmount || 0;
      let expenditure = 0;

      // Calculate expenditure from services
      if (booking.services && booking.services.length > 0) {
        expenditure = booking.services.reduce(
          (sum, service) => sum + (service.price || 0),
          0
        );
      }

      if (!occasionMap.has(occasionType)) {
        occasionMap.set(occasionType, {
          income: 0,
          expenditure: 0,
          count: 0,
        });
      }

      const occasionData = occasionMap.get(occasionType)!;
      occasionData.income += income;
      occasionData.expenditure += expenditure;
      occasionData.count += 1;
    }

    const breakdown: BreakdownItem[] = [];
    occasionMap.forEach((data, occasionType) => {
      breakdown.push({
        category: occasionType,
        categoryType: "occasion",
        income: data.income,
        expenditure: data.expenditure,
        net: data.income - data.expenditure,
        bookingsCount: data.count,
      });
    });

    return breakdown;
  }

  /**
   * Helper: Get breakdown by month
   */
  private static async getBreakdownByMonth(
    query: any
  ): Promise<BreakdownItem[]> {
    const bookings = await Booking.find(query);

    const monthMap = new Map<
      string,
      { income: number; expenditure: number; count: number }
    >();

    for (const booking of bookings) {
      const eventDate = new Date(booking.eventStartDateTime);
      const monthKey = `${eventDate.getFullYear()}-${String(
        eventDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const income = booking.payment?.totalAmount || 0;
      let expenditure = 0;

      // Calculate expenditure from services
      if (booking.services && booking.services.length > 0) {
        expenditure = booking.services.reduce(
          (sum, service) => sum + (service.price || 0),
          0
        );
      }

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          income: 0,
          expenditure: 0,
          count: 0,
        });
      }

      const monthData = monthMap.get(monthKey)!;
      monthData.income += income;
      monthData.expenditure += expenditure;
      monthData.count += 1;
    }

    const breakdown: BreakdownItem[] = [];
    monthMap.forEach((data, monthKey) => {
      breakdown.push({
        category: monthKey,
        categoryType: "occasion",
        income: data.income,
        expenditure: data.expenditure,
        net: data.income - data.expenditure,
        bookingsCount: data.count,
      });
    });

    return breakdown.sort((a, b) => a.category.localeCompare(b.category));
  }
}
