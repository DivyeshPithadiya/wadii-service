import { Request, Response } from "express";
import {
  ManagerService,
  ICreateManagerData,
  IAssignManagerData,
} from "../services/managerService";

type CreateManagerReq = Request<{}, any, ICreateManagerData>;
type AssignManagerReq = Request<{}, any, IAssignManagerData>;
type BusinessManagersReq = Request<{ businessId: string }>;
type VenueManagersReq = Request<{ venueId: string }>;
type RemoveAssignmentReq = Request<{ assignmentId: string }>;

export class ManagerController {
  /**
   * Create a new manager user for a business
   */
  static async createManager(
    req: CreateManagerReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const result = await ManagerService.createManager(
        req.body,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Manager created successfully",
        data: {
          user: result.user,
          tempPassword: result.tempPassword, //SECURITY: Send the temporary password via a secure channel (email, SMS)
        },
      });
    } catch (error: any) {
      const status = /exists/i.test(error?.message) ? 409 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * List all managers for a business
   */
  static async getManagersByBusiness(
    req: BusinessManagersReq,
    res: Response
  ): Promise<void> {

    console.log("user id from controller", req.user?.userId);
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { businessId } = req.params;
      const managers = await ManagerService.getManagersByBusiness(
        businessId,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: "Managers retrieved successfully",
        data: managers,
        total: managers.length,
      });
    } catch (error: any) {
      const status = /access denied/i.test(error?.message) ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * List all managers assigned to a specific venue
   */
  static async getManagersByVenue(
    req: VenueManagersReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      const managers = await ManagerService.getManagersByVenue(
        venueId,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: "Venue managers retrieved successfully",
        data: managers,
        total: managers.length,
      });
    } catch (error: any) {
      const status = /access denied/i.test(error?.message) ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * Assign existing manager to a venue
   */
  static async assignManagerToVenue(
    req: AssignManagerReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const assignment = await ManagerService.assignManagerToVenue(
        req.body,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: "Manager assigned successfully",
        data: assignment,
      });
    } catch (error: any) {
      const status = /already assigned|not found/i.test(error?.message)
        ? 409
        : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * Remove manager assignment
   */
  static async removeManagerAssignment(
    req: RemoveAssignmentReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { assignmentId } = req.params;
      await ManagerService.removeManagerAssignment(
        assignmentId,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: "Manager assignment removed successfully",
      });
    } catch (error: any) {
      const status = /permission denied|not found/i.test(error?.message)
        ? 403
        : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  /**
   * List all available managers in a business (for assignment purposes)
   */
  static async getAvailableManagers(
    req: BusinessManagersReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { businessId } = req.params;
      const managers = await ManagerService.getAvailableManagers(
        businessId,
        req.user.userId
      );

      res.status(200).json({
        success: true,
        message: "Available managers retrieved successfully",
        data: managers,
        total: managers.length,
      });
    } catch (error: any) {
      const status = /access denied/i.test(error?.message) ? 403 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }
  /**
   * Update manager by id (owner scope)
   */
  static async updateManager(
    req: BusinessManagersReq,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const result = await ManagerService.updateManager(req.body);

      res.status(201).json({
        success: true,
        message: "Manager updated successfully",
        data: {
          user: result.user,
        },
      });
    } catch (error: any) {
      const status = /exists/i.test(error?.message) ? 409 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }
}
