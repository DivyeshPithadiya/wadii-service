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

      console.log("BookingPOService.generatePOsForBooking - booking:", booking);

      if (!booking) {
        throw new Error("Booking not found");
      }

      const purchaseOrders: any[] = [];

      if (booking.cateringServiceVendor && booking.foodPackage) {
        const cateringVendor = booking.cateringServiceVendor;
        const lineItems: any[] = [];

        // Add main catering service line
        const unitPrice = booking.foodPackage.totalPricePerPerson || 0;
        const totalPrice = unitPrice * booking.numberOfGuests;

        lineItems.push({
          description: `Catering Services - ${booking.foodPackage.name}`,
          serviceType: "Catering",
          quantity: booking.numberOfGuests,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });

        // Add detailed line items for each section if applicable
        if (booking.foodPackage.sections && booking.foodPackage.sections.length > 0) {
          for (const section of booking.foodPackage.sections) {
            if (section.items && section.items.length > 0) {
              lineItems.push({
                description: `${section.sectionName} (${section.items.length} items)`,
                serviceType: section.sectionName,
                quantity: booking.numberOfGuests,
                unitPrice: section.sectionTotalPerPerson || 0,
                totalPrice: (section.sectionTotalPerPerson || 0) * booking.numberOfGuests,
              });
            }
          }
        }

        // Add inclusions as a line item if present
        if (booking.foodPackage.inclusions && booking.foodPackage.inclusions.length > 0) {
          lineItems.push({
            description: `Inclusions: ${booking.foodPackage.inclusions.join(", ")}`,
            serviceType: "Inclusions",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
          });
        }

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
          lineItems: lineItems,
          totalAmount: totalPrice,
          issueDate: new Date(),
          dueDate: new Date(booking.eventStartDateTime),
          notes: `Catering for ${booking.occasionType} - ${booking.numberOfGuests} guests`,
          createdBy,
        };
        console.log("Catering PO data:", cateringPO);
        const po = await PurchaseOrderService.createPurchaseOrder(cateringPO);
        purchaseOrders.push(po);
        console.log(po, " Catering PO created");
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
                name: service.vendor.name || "vendor name",
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

        if (!booking.foodPackage) {
          throw new Error("No food package found in booking");
        }

        const cateringVendor = booking.cateringServiceVendor;
        const lineItems: any[] = [];

        // Add main catering service line
        const unitPrice = booking.foodPackage.totalPricePerPerson || 0;
        const totalPrice = unitPrice * booking.numberOfGuests;

        lineItems.push({
          description: `Catering Services - ${booking.foodPackage.name}`,
          serviceType: "Catering",
          quantity: booking.numberOfGuests,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });

        // Add detailed line items for each section if applicable
        if (booking.foodPackage.sections && booking.foodPackage.sections.length > 0) {
          for (const section of booking.foodPackage.sections) {
            if (section.items && section.items.length > 0) {
              lineItems.push({
                description: `${section.sectionName} (${section.items.length} items)`,
                serviceType: section.sectionName,
                quantity: booking.numberOfGuests,
                unitPrice: section.sectionTotalPerPerson || 0,
                totalPrice: (section.sectionTotalPerPerson || 0) * booking.numberOfGuests,
              });
            }
          }
        }

        // Add inclusions as a line item if present
        if (booking.foodPackage.inclusions && booking.foodPackage.inclusions.length > 0) {
          lineItems.push({
            description: `Inclusions: ${booking.foodPackage.inclusions.join(", ")}`,
            serviceType: "Inclusions",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
          });
        }

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
          lineItems: lineItems,
          totalAmount: totalPrice,
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
            name: service.vendor.name || "vendor name",
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

  /**
   * Auto-generate Purchase Orders for a booking
   * Creates POs for catering vendor and all service vendors
   */
  static async updatePOsForBooking(
    bookingId: string,
    poId: string,
    createdBy?: string
  ): Promise<any[]> {
    try {
      const booking = await Booking.findById(oid(bookingId));

      console.log("BookingPOService.generatePOsForBooking - booking:", booking);

      if (!booking) {
        throw new Error("Booking not found");
      }

      const purchaseOrders: any[] = [];

      if (booking.cateringServiceVendor && booking.foodPackage) {
        const cateringVendor = booking.cateringServiceVendor;
        const lineItems: any[] = [];

        // Add main catering service line
        const unitPrice = booking.foodPackage.totalPricePerPerson || 0;
        const totalPrice = unitPrice * booking.numberOfGuests;

        lineItems.push({
          description: `Catering Services - ${booking.foodPackage.name}`,
          serviceType: "Catering",
          quantity: booking.numberOfGuests,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });

        // Add detailed line items for each section if applicable
        if (booking.foodPackage.sections && booking.foodPackage.sections.length > 0) {
          for (const section of booking.foodPackage.sections) {
            if (section.items && section.items.length > 0) {
              lineItems.push({
                description: `${section.sectionName} (${section.items.length} items)`,
                serviceType: section.sectionName,
                quantity: booking.numberOfGuests,
                unitPrice: section.sectionTotalPerPerson || 0,
                totalPrice: (section.sectionTotalPerPerson || 0) * booking.numberOfGuests,
              });
            }
          }
        }

        // Add inclusions as a line item if present
        if (booking.foodPackage.inclusions && booking.foodPackage.inclusions.length > 0) {
          lineItems.push({
            description: `Inclusions: ${booking.foodPackage.inclusions.join(", ")}`,
            serviceType: "Inclusions",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
          });
        }

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
          lineItems: lineItems,
          totalAmount: totalPrice,
          issueDate: new Date(),
          dueDate: new Date(booking.eventStartDateTime),
          notes: `Catering for ${booking.occasionType} - ${booking.numberOfGuests} guests`,
          createdBy,
        };
        console.log("Catering PO data:", cateringPO);
        const po = await PurchaseOrderService.updatePurchaseOrder(
          poId,
          cateringPO
        );
        purchaseOrders.push(po);
        console.log(po, " Catering PO updated");
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
                name: service.vendor.name || "vendor name",
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
}