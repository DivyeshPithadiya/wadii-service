// validators/foodMenu-validator.ts
import { z } from "zod";

/**
 * Food menu item schema
 */
const foodMenuItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required'),
  description: z.string().trim().optional(),
  isAvailable: z.boolean().default(true),
})

/**
 * Food menu section schema for creation
 */
export const createFoodMenuSectionSchema = z
  .object({
    sectionName: z.string().trim().min(1, "Section name is required"),
    selectionType: z
      .enum(["free", "limit", "all_included"])
      .optional()
      .default("free"),
    maxSelectable: z.number().int().min(1).optional(),
    defaultPrice: z
      .number()
      .min(0, "Default price must be non-negative")
      .optional(),
    items: z
      .array(foodMenuItemSchema)
      .min(1, "At least one item is required")
      .refine(
        (items) => {
          const names = items.map((item) => item.name.toLowerCase());
          return names.length === new Set(names).size;
        },
        {
          message: "Item names must be unique within a section",
        }
      ),
  })
  .refine(
    (data) => {
      if (data.selectionType === "limit") {
        return data.maxSelectable !== undefined && data.maxSelectable > 0;
      }
      return true;
    },
    {
      message:
        "maxSelectable is required and must be greater than 0 when selectionType is 'limit'",
      path: ["maxSelectable"],
    }
  );

/**
 * Food menu section schema for update
 */
export const updateFoodMenuSectionSchema = z
  .object({
    sectionName: z.string().trim().min(1).optional(),
    selectionType: z.enum(['free', 'limit', 'all_included']).optional(),
    maxSelectable: z.number().int().min(1).optional(),
    defaultPrice: z
      .number()
      .min(0, 'Default price must be non-negative')
      .optional(),
    items: z
      .array(foodMenuItemSchema)
      .min(1, 'At least one item is required')
      .optional()
      .refine(
        (items) => {
          if (!items) return true
          const names = items.map((item) => item.name.toLowerCase())
          return names.length === new Set(names).size
        },
        {
          message: 'Item names must be unique within a section',
        }
      ),
  })
  .refine(
    (data) => {
      if (data.selectionType === 'limit') {
        return data.maxSelectable !== undefined && data.maxSelectable > 0
      }
      return true
    },
    {
      message: "maxSelectable is required when selectionType is 'limit'",
      path: ['maxSelectable'],
    }
  )

/**
 * Add item to section schema
 */
export const addItemToSectionSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  description: z.string().trim().optional(),
  isAvailable: z.boolean().default(true),
});

/**
 * Update item schema
 */
export const updateItemSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  isAvailable: z.boolean().optional(),
});

// Export types
export type CreateFoodMenuSectionInput = z.infer<typeof createFoodMenuSectionSchema>;
export type UpdateFoodMenuSectionInput = z.infer<typeof updateFoodMenuSectionSchema>;
export type AddItemToSectionInput = z.infer<typeof addItemToSectionSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
