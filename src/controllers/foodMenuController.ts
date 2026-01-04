// src/controllers/foodMenuController.ts
import { Request, Response } from "express";
import { FoodMenuService, RoleSnapshot } from "../services/foodMenuService";
import { IFoodMenuItem } from "../types";

type Params = {
  venueId?: string;
  sectionId?: string;
  itemId?: string;
};

type Query = Record<string, unknown>;

interface CreateSectionBody {
  sectionName: string;
  selectionType: "free" | "limit" | "all_included";
  maxSelectable?: number;
  defaultPrice?: number;
  items: IFoodMenuItem[];
}

interface UpdateSectionBody {
  sectionName?: string;
  selectionType?: "free" | "limit" | "all_included";
  maxSelectable?: number;
  defaultPrice?: number;
  items?: IFoodMenuItem[];
}

type AddItemBody = Omit<IFoodMenuItem, "_id">;
type UpdateItemBody = Partial<Omit<IFoodMenuItem, "_id">>;

export class FoodMenuController {
  /**
   * Create a new food menu section
   * POST /api/venues/:venueId/food-menu/sections
   */
  static async createSection(
    req: Request<Params, any, CreateSectionBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId } = req.params;
      if (!venueId) {
        res.status(400).json({ success: false, message: "venueId is required" });
        return;
      }

      const venue = await FoodMenuService.createSection(
        venueId,
        req.body,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(201).json({
        success: true,
        message: "Food menu section created successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update a food menu section
   * PUT /api/venues/:venueId/food-menu/sections/:sectionId
   */
  static async updateSection(
    req: Request<Params, any, UpdateSectionBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, sectionId } = req.params;
      if (!venueId || !sectionId) {
        res.status(400).json({
          success: false,
          message: "venueId and sectionId are required",
        });
        return;
      }

      const venue = await FoodMenuService.updateSection(
        venueId,
        sectionId,
        req.body,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Food menu section updated successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete a food menu section
   * DELETE /api/venues/:venueId/food-menu/sections/:sectionId
   */
  static async deleteSection(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, sectionId } = req.params;
      if (!venueId || !sectionId) {
        res.status(400).json({
          success: false,
          message: "venueId and sectionId are required",
        });
        return;
      }

      const venue = await FoodMenuService.deleteSection(
        venueId,
        sectionId,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Food menu section deleted successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Add item to a section
   * POST /api/venues/:venueId/food-menu/sections/:sectionId/items
   */
  static async addItemToSection(
    req: Request<Params, any, AddItemBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, sectionId } = req.params;
      if (!venueId || !sectionId) {
        res.status(400).json({
          success: false,
          message: "venueId and sectionId are required",
        });
        return;
      }

      const venue = await FoodMenuService.addItemToSection(
        venueId,
        sectionId,
        req.body,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(201).json({
        success: true,
        message: "Item added to section successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update an item in a section
   * PUT /api/venues/:venueId/food-menu/sections/:sectionId/items/:itemId
   */
  static async updateItem(
    req: Request<Params, any, UpdateItemBody, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, sectionId, itemId } = req.params;
      if (!venueId || !sectionId || !itemId) {
        res.status(400).json({
          success: false,
          message: "venueId, sectionId, and itemId are required",
        });
        return;
      }

      const venue = await FoodMenuService.updateItem(
        venueId,
        sectionId,
        itemId,
        req.body,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Item updated successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete an item from a section
   * DELETE /api/venues/:venueId/food-menu/sections/:sectionId/items/:itemId
   */
  static async deleteItem(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, sectionId, itemId } = req.params;
      if (!venueId || !sectionId || !itemId) {
        res.status(400).json({
          success: false,
          message: "venueId, sectionId, and itemId are required",
        });
        return;
      }

      const venue = await FoodMenuService.deleteItem(
        venueId,
        sectionId,
        itemId,
        req.user.userId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Item deleted successfully",
        data: venue,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all food menu sections for a venue
   * GET /api/venues/:venueId/food-menu/sections
   */
  static async getFoodMenu(
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
        res.status(400).json({ success: false, message: "venueId is required" });
        return;
      }

      const sections = await FoodMenuService.getFoodMenu(
        venueId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Food menu retrieved successfully",
        data: sections,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get a specific food menu section
   * GET /api/venues/:venueId/food-menu/sections/:sectionId
   */
  static async getSection(
    req: Request<Params, any, any, Query>,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { venueId, sectionId } = req.params;
      if (!venueId || !sectionId) {
        res.status(400).json({
          success: false,
          message: "venueId and sectionId are required",
        });
        return;
      }

      const section = await FoodMenuService.getSection(
        venueId,
        sectionId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Section retrieved successfully",
        data: section,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get default prices for all food menu items
   * GET /api/venues/:venueId/food-menu/default-prices
   */
  static async getDefaultPrice(
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
        res.status(400).json({ success: false, message: "venueId is required" });
        return;
      }

      const sectionsWithPrices = await FoodMenuService.getDefaultPrice(
        venueId,
        req.user.userId,
        req.userRole as RoleSnapshot | undefined
      );

      res.status(200).json({
        success: true,
        message: "Default prices retrieved successfully",
        data: sectionsWithPrices,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
