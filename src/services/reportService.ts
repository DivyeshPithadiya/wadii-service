import { Booking } from "../models/Booking";
import { Transaction } from "../models/Transaction";
import { PurchaseOrder } from "../models/PurchaseOrder";
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
   * Generate Cash Ledger Report (Refactored to use Transaction model)
   * Tracks payments by mode with debtor/creditor status
   */
  static async getCashLedgerReport(
    params: CashLedgerQueryParams
  ): Promise<CashLedgerReportData> {
    try {
      const { venueId, startDate, endDate, paymentMode } = params;

      // Build booking query
      const bookingQuery: any = {
        venueId: oid(venueId),
      };

      // Add date filters if provided
      if (startDate || endDate) {
        bookingQuery.eventStartDateTime = {};
        if (startDate) {
          bookingQuery.eventStartDateTime.$gte = new Date(startDate);
        }
        if (endDate) {
          bookingQuery.eventStartDateTime.$lte = new Date(endDate);
        }
      }

      // Fetch bookings
      const bookings = await Booking.find(bookingQuery).sort({
        eventStartDateTime: 1,
      });

      const bookingIds = bookings.map((b) => b._id);

      // Build transaction query
      const transactionQuery: any = {
        bookingId: { $in: bookingIds },
        status: "success",
      };

      if (paymentMode) {
        transactionQuery.mode = paymentMode;
      }

      // Fetch all successful transactions for these bookings
      const transactions = await Transaction.find(transactionQuery);

      // Group transactions by booking
      const transactionsByBooking = new Map<string, typeof transactions>();
      transactions.forEach((txn) => {
        const bookingId = txn.bookingId.toString();
        if (!transactionsByBooking.has(bookingId)) {
          transactionsByBooking.set(bookingId, []);
        }
        transactionsByBooking.get(bookingId)!.push(txn);
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
        const bookingId = booking._id.toString();
        const bookingTransactions = transactionsByBooking.get(bookingId) || [];

        // Calculate total paid from transactions
        const totalPaid = bookingTransactions.reduce(
          (sum, txn) => sum + txn.amount,
          0
        );

        const totalAmount = booking.payment.totalAmount || 0;
        const pendingAmount = totalAmount - totalPaid;

        // Update totals
        summary.totalReceived += totalPaid;
        summary.totalPending += pendingAmount;

        // Update by payment mode (from transactions)
        bookingTransactions.forEach((txn) => {
          const mode = txn.mode as keyof typeof summary.byPaymentMode;
          if (summary.byPaymentMode[mode]) {
            summary.byPaymentMode[mode].received += txn.amount;
          }
        });

        // Distribute pending amount across payment modes (proportionally or use primary mode)
        if (pendingAmount > 0) {
          const mode = booking.payment
            .paymentMode as keyof typeof summary.byPaymentMode;
          if (summary.byPaymentMode[mode]) {
            summary.byPaymentMode[mode].pending += pendingAmount;
          }
        }

        // Add to debtors if pending amount exists
        if (pendingAmount > 0) {
          debtors.push({
            bookingId: booking._id,
            clientName: booking.clientName,
            contactNo: booking.contactNo,
            email: booking.email,
            totalAmount,
            advanceAmount: totalPaid,
            pendingAmount,
            eventDate: booking.eventStartDateTime,
            paymentMode: booking.payment.paymentMode,
            occasionType: booking.occasionType,
          });
        }
      }

      // Fetch creditors from PurchaseOrders (not from booking services)
      const poQuery: any = {
        bookingId: { $in: bookingIds },
        status: { $nin: ["cancelled"] }, // Exclude cancelled POs
      };

      const purchaseOrders = await PurchaseOrder.find(poQuery).lean();

      for (const po of purchaseOrders) {
        // Get the booking for event date
        const booking = bookings.find((b) => b._id.toString() === po.bookingId.toString());

        // Calculate amount due (balance amount)
        const amountDue = po.balanceAmount || 0;

        // Only add as creditor if there's a balance due
        if (amountDue > 0) {
          creditors.push({
            bookingId: po.bookingId,
            serviceName: po.lineItems.map((item) => item.description).join(", "),
            vendorName: po.vendorDetails.name,
            amountDue: amountDue,
            eventDate: booking?.eventStartDateTime || po.issueDate,
            bankDetails: po.vendorDetails.bankDetails,
            poNumber: po.poNumber,
            poTotalAmount: po.totalAmount,
            poPaidAmount: po.paidAmount,
            poStatus: po.status,
            vendorType: po.vendorType,
          });
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
   * Generate Income & Expenditure Report (Refactored to use Transaction model)
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
        breakdown = await this.getBreakdownByService(query, startDate, endDate);
      } else if (groupBy === "occasionType") {
        // Group by occasion type
        breakdown = await this.getBreakdownByOccasionType(query, startDate, endDate);
      } else if (groupBy === "month") {
        // Group by month
        breakdown = await this.getBreakdownByMonth(query, startDate, endDate);
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
   * Helper: Get breakdown by service (Refactored to use Transaction model)
   */
  private static async getBreakdownByService(
    query: any,
    startDate: string,
    endDate: string
  ): Promise<BreakdownItem[]> {
    const bookings = await Booking.find(query);
    const bookingIds = bookings.map((b) => b._id);

    // Fetch all successful transactions for these bookings
    const transactions = await Transaction.find({
      bookingId: { $in: bookingIds },
      status: "success",
      paidAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    // Calculate venue charges (booking revenue from transactions)
    const venueIncome = transactions.reduce(
      (sum, txn) => sum + txn.amount,
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
   * Helper: Get breakdown by occasion type (Refactored to use Transaction model)
   */
  private static async getBreakdownByOccasionType(
    query: any,
    startDate: string,
    endDate: string
  ): Promise<BreakdownItem[]> {
    const bookings = await Booking.find(query);
    const bookingIds = bookings.map((b) => b._id);

    // Fetch all successful transactions for these bookings
    const transactions = await Transaction.find({
      bookingId: { $in: bookingIds },
      status: "success",
      paidAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    // Group transactions by booking
    const transactionsByBooking = new Map<string, number>();
    transactions.forEach((txn) => {
      const bookingId = txn.bookingId.toString();
      transactionsByBooking.set(
        bookingId,
        (transactionsByBooking.get(bookingId) || 0) + txn.amount
      );
    });

    const occasionMap = new Map<
      string,
      { income: number; expenditure: number; count: number }
    >();

    for (const booking of bookings) {
      const occasionType = booking.occasionType;
      const bookingId = booking._id.toString();
      const income = transactionsByBooking.get(bookingId) || 0;
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
   * Helper: Get breakdown by month (Refactored to use Transaction model)
   */
  private static async getBreakdownByMonth(
    query: any,
    startDate: string,
    endDate: string
  ): Promise<BreakdownItem[]> {
    const bookings = await Booking.find(query);
    const bookingIds = bookings.map((b) => b._id);

    // Fetch all successful transactions for these bookings
    const transactions = await Transaction.find({
      bookingId: { $in: bookingIds },
      status: "success",
      paidAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    // Group transactions by booking
    const transactionsByBooking = new Map<string, number>();
    transactions.forEach((txn) => {
      const bookingId = txn.bookingId.toString();
      transactionsByBooking.set(
        bookingId,
        (transactionsByBooking.get(bookingId) || 0) + txn.amount
      );
    });

    const monthMap = new Map<
      string,
      { income: number; expenditure: number; count: number }
    >();

    for (const booking of bookings) {
      const eventDate = new Date(booking.eventStartDateTime);
      const monthKey = `${eventDate.getFullYear()}-${String(
        eventDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const bookingId = booking._id.toString();
      const income = transactionsByBooking.get(bookingId) || 0;
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
