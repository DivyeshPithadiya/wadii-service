import { PurchaseOrderService } from "./purchaseOrderService";
import { Booking } from "../models/Booking";
import { Types } from "mongoose";
import { CreatePurchaseOrderInput } from "../types/purchaseorder-types";

const oid = (id: string) => new Types.ObjectId(id);

export class BookingPOService {
  /**
   * Auto-generate Purchase Orders for a booking
   * Creates POs for catering vendor and all service vendors
   */
  static async generatePOsForBooking(
    bookingId: string,
    createdBy?: string
  ): Promise<any[]> {
    try {
      const booking = await Booking.findById(oid(bookingId));

      if (!booking) {
        throw new Error("Booking not found");
      }

      const purchaseOrders: any[] = [];

      // 1. Generate PO for Catering Vendor (if exists)
      if (booking.cateringServiceVendor) {
        const cateringVendor = booking.cateringServiceVendor;

        const cateringPO: CreatePurchaseOrderInput = {
          bookingId: booking._id.toString(),
          venueId: booking.venueId.toString(),
          vendorType: "catering",
          vendorDetails: {
            name: cateringVendor.name,
            email: cateringVendor.email,
            phone: cateringVendor.phone,
            bankDetails: cateringVendor.bankDetails,
          },
          vendorReference: "catering",
          lineItems: [
            {
              description: "Catering Services",
              serviceType: "Catering",
              quantity: booking.numberOfGuests,
              totalPrice: booking.package?.price || 0,
            },
          ],
          totalAmount: booking.package?.price || 0,
          issueDate: new Date(),
          dueDate: new Date(booking.eventStartDateTime),
          notes: `Catering for ${booking.occasionType} - ${booking.numberOfGuests} guests`,
          createdBy,
        };

        const po = await PurchaseOrderService.createPurchaseOrder(cateringPO);
        purchaseOrders.push(po);
      }

      // 2. Generate POs for Service Vendors
      if (booking.services && booking.services.length > 0) {
        for (const service of booking.services) {
          if (service.vendor) {
            const servicePO: CreatePurchaseOrderInput = {
              bookingId: booking._id.toString(),
              venueId: booking.venueId.toString(),
              vendorType: "service",
              vendorDetails: {
                name: service.vendor.name,
                email: service.vendor.email,
                phone: service.vendor.phone,
                bankDetails: service.vendor.bankDetails,
              },
              vendorReference: `service_${service.service}`,
              lineItems: [
                {
                  description: service.service,
                  serviceType: service.service,
                  totalPrice: service.price,
                },
              ],
              totalAmount: service.price,
              issueDate: new Date(),
              dueDate: new Date(booking.eventStartDateTime),
              notes: `${service.service} for ${booking.occasionType}`,
              createdBy,
            };

            const po = await PurchaseOrderService.createPurchaseOrder(
              servicePO
            );
            purchaseOrders.push(po);
          }
        }
      }

      return purchaseOrders;
    } catch (error: any) {
      throw new Error(`Error generating POs for booking: ${error.message}`);
    }
  }

  /**
   * Generate PO for specific vendor in a booking
   */
  static async generatePOForVendor(
    bookingId: string,
    vendorType: "catering" | "service",
    serviceIndex?: number,
    createdBy?: string
  ): Promise<any> {
    try {
      const booking = await Booking.findById(oid(bookingId));

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (vendorType === "catering") {
        if (!booking.cateringServiceVendor) {
          throw new Error("No catering vendor found in booking");
        }

        const cateringVendor = booking.cateringServiceVendor;

        const cateringPO: CreatePurchaseOrderInput = {
          bookingId: booking._id.toString(),
          venueId: booking.venueId.toString(),
          vendorType: "catering",
          vendorDetails: {
            name: cateringVendor.name,
            email: cateringVendor.email,
            phone: cateringVendor.phone,
            bankDetails: cateringVendor.bankDetails,
          },
          vendorReference: "catering",
          lineItems: [
            {
              description: "Catering Services",
              serviceType: "Catering",
              quantity: booking.numberOfGuests,
              totalPrice: booking.package?.price || 0,
            },
          ],
          totalAmount: booking.package?.price || 0,
          issueDate: new Date(),
          dueDate: new Date(booking.eventStartDateTime),
          notes: `Catering for ${booking.occasionType} - ${booking.numberOfGuests} guests`,
          createdBy,
        };

        return await PurchaseOrderService.createPurchaseOrder(cateringPO);
      }

      if (vendorType === "service") {
        if (serviceIndex === undefined) {
          throw new Error("serviceIndex is required for service vendor PO");
        }

        if (!booking.services || !booking.services[serviceIndex]) {
          throw new Error("Service not found at the specified index");
        }

        const service = booking.services[serviceIndex];

        if (!service.vendor) {
          throw new Error("No vendor found for this service");
        }

        const servicePO: CreatePurchaseOrderInput = {
          bookingId: booking._id.toString(),
          venueId: booking.venueId.toString(),
          vendorType: "service",
          vendorDetails: {
            name: service.vendor.name,
            email: service.vendor.email,
            phone: service.vendor.phone,
            bankDetails: service.vendor.bankDetails,
          },
          vendorReference: `service_${service.service}_${serviceIndex}`,
          lineItems: [
            {
              description: service.service,
              serviceType: service.service,
              totalPrice: service.price,
            },
          ],
          totalAmount: service.price,
          issueDate: new Date(),
          dueDate: new Date(booking.eventStartDateTime),
          notes: `${service.service} for ${booking.occasionType}`,
          createdBy,
        };

        return await PurchaseOrderService.createPurchaseOrder(servicePO);
      }
    } catch (error: any) {
      throw new Error(`Error generating PO for vendor: ${error.message}`);
    }
  }

  /**
   * Check if POs already exist for a booking
   */
  static async checkExistingPOs(bookingId: string): Promise<{
    hasExistingPOs: boolean;
    poCount: number;
    pos: any[];
  }> {
    try {
      const pos = await PurchaseOrderService.getPOsByBooking(bookingId);

      return {
        hasExistingPOs: pos.length > 0,
        poCount: pos.length,
        pos,
      };
    } catch (error: any) {
      throw new Error(`Error checking existing POs: ${error.message}`);
    }
  }
}
