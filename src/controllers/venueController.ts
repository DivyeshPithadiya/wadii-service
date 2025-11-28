import { Request, Response } from "express";
import {
  VenueService,
  RoleSnapshot,
  ICreateVenueData,
} from "../services/venueService";

// Route shapes
type Params = {
  businessId?: string;
  venueId?: string;
  serviceName?: string;
  serviceId?: string;
  packageId?: string;
};
type Query = Record<string, unknown>;
type Body = ICreateVenueData;
interface ServicesAndVendorsBody {
  name?: string;
  email?: string;
  phone?: string;
  bankDetails?: {
    accountNumber?: string;
    accountHolderName?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
    upiId?: string;
  };
  description?: string;
  price?: number;
  priceType?: "flat" | "per_guest";
  inclusions?: [""];
  service?: string;
  serviceName?: string;
  vendorEmail?: string;
  packageName?: string;
}

export class VenueController {
  /**
   * Create a new venue
   * POST /businesses/:businessId/venues (or body.businessId)
   */
  static async createVenue(
    req: Request<Params, any, Body, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Allow businessId via params to avoid duplicating in body
      const businessId = req.params.businessId ?? req.body.businessId;
      if (!businessId) {
        res
          .status(400)
          .json({ success: false, message: "businessId is required" });
        return;
      }

      const venue = await VenueService.createVenue(
        { ...req.body, businessId },
        req.user.userId, // createdBy
        req.user.userId, // userId (for scoped checks)
        req.userRole as RoleSnapshot | undefined
      );

      res.status(201).json({
        success: true,
        message: "Venue created successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all venues for a business
   * GET /businesses/:businessId/venues
   */
  static async getVenuesByBusiness(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { businessId } = req.params;
      if (!businessId) {
        res
          .status(400)
          .json({ success: false, message: "businessId is required" });
        return;
      }

      const venues = await VenueService.getVenuesByBusiness(
        businessId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Venues retrieved successfully",
        data: venues,
        total: venues.length,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get venue by ID
   * GET /venues/:venueId
   */
  static async getVenueById(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      if (!venueId) {
        res
          .status(400)
          .json({ success: false, message: "venueId is required" });
        return;
      }

      const venue = await VenueService.getVenueById(
        venueId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      if (!venue) {
        res.status(404).json({ success: false, message: "Venue not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Venue retrieved successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getAllVenues(
    req: Request<Params, any, any, Query>,
    res: Response
  ) {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const venues = await VenueService.getAllVenues(
        req.user.userId,
        req.userRole, // added by auth middleware
        req.query ?? {}
      );

      res.status(200).json({
        success: true,
        message: "Venues retrieved successfully",
        data: venues,
        total: venues.length,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update venue
   * PUT /venues/:venueId
   */
  static async updateVenue(
    req: Request<Params, any, Partial<Body>, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      if (!venueId) {
        res
          .status(400)
          .json({ success: false, message: "venueId is required" });
        return;
      }

      const venue = await VenueService.updateVenue(
        venueId,
        req.body,
        req.user.userId, // updatedBy
        req.user.userId, // userId for checks
        req.userRole as RoleSnapshot | undefined
      );

      if (!venue) {
        res.status(404).json({ success: false, message: "Venue not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Venue updated successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete venue
   * DELETE /venues/:venueId
   */
  static async deleteVenue(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      if (!venueId) {
        res
          .status(400)
          .json({ success: false, message: "venueId is required" });
        return;
      }

      await VenueService.deleteVenue(
        venueId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res
        .status(200)
        .json({ success: true, message: "Venue deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Add a vendor to a service
   * POST /venues/:venueId/services/:serviceName/vendors
   */
  static async addServiceVendor(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, serviceName } = req.params;
      const { name, email, phone, bankDetails } = req.body;

      if (!venueId || !serviceName) {
        res.status(400).json({
          success: false,
          message: "venueId and serviceName are required",
        });
        return;
      }

      if (!name || !email || !phone) {
        res.status(400).json({
          success: false,
          message: "name, email, and phone are required",
        });
        return;
      }

      const venue = await VenueService.addServiceVendor(
        venueId,
        serviceName,
        { name, email, phone, bankDetails },
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Vendor added to service successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  /**
   * Remove a vendor from a service
   * DELETE /venues/:venueId/services/:serviceName/vendors
   */
  static async removeServiceVendor(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, serviceName } = req.params;
      const { vendorEmail } = req.body;

      if (!venueId || !serviceName || !vendorEmail) {
        res.status(400).json({
          success: false,
          message: "venueId, serviceName, and vendorEmail are required",
        });
        return;
      }

      const venue = await VenueService.removeServiceVendor(
        venueId,
        serviceName,
        vendorEmail,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Vendor removed from service successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * List vendors for a specific service
   * GET /venues/:venueId/services/:serviceName/vendors
   */
  static async listServiceVendors(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, serviceName } = req.params;

      if (!venueId || !serviceName) {
        res.status(400).json({
          success: false,
          message: "venueId and serviceName are required",
        });
        return;
      }

      const vendors = await VenueService.listServiceVendors(
        venueId,
        serviceName,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        data: vendors,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Add a food package
   * POST /venues/:venueId/packages
   */
  static async addFoodPackage(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      const { name, description, price, priceType, inclusions } = req.body;

      if (!venueId) {
        res
          .status(400)
          .json({ success: false, message: "venueId is required" });
        return;
      }

      if (!name || !description || !price || !priceType) {
        res.status(400).json({
          success: false,
          message: "name, description, price, and priceType are required",
        });
        return;
      }

      const venue = await VenueService.addFoodPackage(
        venueId,
        { name, description, price, priceType, inclusions },
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Food package added successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Remove a food package
   * DELETE /venues/:venueId/packages/:packageId
   */
  static async removeFoodPackage(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, packageId } = req.params;

      if (!venueId || !packageId) {
        res.status(400).json({
          success: false,
          message: "venueId and packageId are required",
        });
        return;
      }

      const venue = await VenueService.removeFoodPackage(
        venueId,
        packageId,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Food package removed successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * List all food packages
   * GET /venues/:venueId/packages
   */
  static async listFoodPackages(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;

      if (!venueId) {
        res
          .status(400)
          .json({ success: false, message: "venueId is required" });
        return;
      }

      const packages = await VenueService.listFoodPackages(
        venueId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        data: packages,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Add a catering service vendor
   * POST /venues/:venueId/catering-vendors
   */
  static async addCateringVendor(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;

      console.log("========== CONTROLLER: ADD CATERING VENDOR ==========");
      console.log("[CONTROLLER] Full request body:", JSON.stringify(req.body, null, 2));
      console.log("[CONTROLLER] Request headers:", {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
      });

      const { name, email, phone, bankDetails } = req.body;

      console.log("[CONTROLLER] Extracted fields:", {
        name,
        email,
        phone,
        bankDetails,
        hasBankDetails: !!bankDetails,
      });

      if (!venueId) {
        res
          .status(400)
          .json({ success: false, message: "venueId is required" });
        return;
      }

      if (!name || !email || !phone) {
        res.status(400).json({
          success: false,
          message: "name, email, and phone are required",
        });
        return;
      }

      const venue = await VenueService.addCateringVendor(
        venueId,
        { name, email, phone, bankDetails },
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Catering vendor added successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Remove a catering service vendor
   * DELETE /venues/:venueId/catering-vendors
   */
  static async removeCateringVendor(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      const { vendorEmail } = req.body;

      if (!venueId || !vendorEmail) {
        res.status(400).json({
          success: false,
          message: "venueId and vendorEmail are required",
        });
        return;
      }

      const venue = await VenueService.removeCateringVendor(
        venueId,
        vendorEmail,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Catering vendor removed successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * List all catering service vendors
   * GET /venues/:venueId/catering-vendors
   */
  static async listCateringVendors(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;

      if (!venueId) {
        res
          .status(400)
          .json({ success: false, message: "venueId is required" });
        return;
      }

      const vendors = await VenueService.listCateringVendors(
        venueId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        data: vendors,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Create a new service
   * POST /venues/:venueId/services
   */
  static async createService(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      const { serviceName } = req.body;

      if (!venueId || !serviceName) {
        res.status(400).json({
          success: false,
          message: "venueId and serviceName are required",
        });
        return;
      }

      const venue = await VenueService.createService(
        venueId,
        serviceName,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Remove a service
   * DELETE /venues/:venueId/services
   */
  static async removeService(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      const { serviceName } = req.body;

      if (!venueId || !serviceName) {
        res.status(400).json({
          success: false,
          message: "venueId and serviceName are required",
        });
        return;
      }

      const venue = await VenueService.removeService(
        venueId,
        serviceName,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Service removed successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * List all services
   * GET /venues/:venueId/services
   */
  static async listServices(
    req: Request<Params, any, ServicesAndVendorsBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;

      if (!venueId) {
        res
          .status(400)
          .json({ success: false, message: "venueId is required" });
        return;
      }

      const services = await VenueService.listServices(
        venueId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update a food package
   * PUT /venues/:venueId/packages/:packageId
   */
  static async updateFoodPackage(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, packageId } = req.params;
      const { name, description, price, priceType, inclusions } = req.body;

      if (!venueId || !packageId) {
        res.status(400).json({
          success: false,
          message: "venueId and packageId are required",
        });
        return;
      }

      const venue = await VenueService.updateFoodPackage(
        venueId,
        packageId,
        { name, description, price, priceType, inclusions },
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Food package updated successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete a food package
   * DELETE /venues/:venueId/packages/:packageId
   */
  static async deleteFoodPackage(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, packageId } = req.params;

      if (!venueId || !packageId) {
        res.status(400).json({
          success: false,
          message: "venueId and packageId are required",
        });
        return;
      }

      const venue = await VenueService.deleteFoodPackage(
        venueId,
        packageId,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Food package deleted successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update a service
   * PUT /venues/:venueId/services/:serviceId
   */
  static async updateService(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, serviceId } = req.params;
      const { serviceName } = req.body;

      if (!venueId || !serviceId) {
        res.status(400).json({
          success: false,
          message: "venueId and serviceId are required",
        });
        return;
      }

      if (!serviceName) {
        res.status(400).json({
          success: false,
          message: "serviceName is required",
        });
        return;
      }

      const venue = await VenueService.updateService(
        venueId,
        serviceId,
        serviceName,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete a service
   * DELETE /venues/:venueId/services/:serviceId
   */
  static async deleteService(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, serviceId } = req.params;

      if (!venueId || !serviceId) {
        res.status(400).json({
          success: false,
          message: "venueId and serviceId are required",
        });
        return;
      }

      const venue = await VenueService.deleteService(
        venueId,
        serviceId,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
