import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { UserBusinessRole } from "../models/UserBusinessRole";
import { Venue } from "../models/Venue";
import { User } from "../models/User";

// Updated role types for the new system
export type RoleSnapshot = {
  role: "developer" | "owner" | "manager";
  permissions?: string[];
};

// Comprehensive permission constants - organized by domain
export const PERMS = {
  // User management
  USER_CREATE: "user.create",
  USER_READ: "user.read",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",

  // Business management
  BUSINESS_CREATE: "business.create",
  BUSINESS_READ: "business.read",
  BUSINESS_UPDATE: "business.update",
  BUSINESS_DELETE: "business.delete",

  // Venue management
  VENUE_CREATE: "venue.create",
  VENUE_READ: "venue.read",
  VENUE_UPDATE: "venue.update",
  VENUE_DELETE: "venue.delete",

  // Package management
  PACKAGE_CREATE: "package.create",
  PACKAGE_READ: "package.read",
  PACKAGE_UPDATE: "package.update",
  PACKAGE_DELETE: "package.delete",

  // Vendor management
  VENDOR_CREATE: "vendor.create",
  VENDOR_READ: "vendor.read",
  VENDOR_UPDATE: "vendor.update",
  VENDOR_DELETE: "vendor.delete",

  // Booking management (future-ready)
  BOOKING_CREATE: "booking.create",
  BOOKING_READ: "booking.read",
  BOOKING_UPDATE: "booking.update",
  BOOKING_DELETE: "booking.delete",

  // Notes management (future-ready)
  NOTES_CREATE: "notes.create",
  NOTES_READ: "notes.read",
  NOTES_UPDATE: "notes.update",
  NOTES_DELETE: "notes.delete",

  // Timeslot management (future-ready)
  TIMESLOT_CREATE: "timeslot.create",
  TIMESLOT_READ: "timeslot.read",
  TIMESLOT_UPDATE: "timeslot.update",
  TIMESLOT_DELETE: "timeslot.delete",

  // Manager assignment (for venue-level management)
  MANAGER_CREATE: "manager.create",
  MANAGER_READ: "manager.read",
  MANAGER_ASSIGN: "manager.assign",
  MANAGER_UPDATE: "manager.update",
  MANAGER_DELETE: "manager.delete",

  LEAD_CREATE: "lead.create",
  LEAD_READ: "lead.read",
  LEAD_ASSIGN: "lead.assign",
  LEAD_UPDATE: "lead.update",
  LEAD_DELETE: "lead.delete",
} as const;

// Role to permissions mapping - easily extensible
export const ROLE_TO_PERMS = {
  // DEVELOPER: Full system access (like superadmin)
  developer: [
    // All user permissions
    "user.create",
    "user.read",
    "user.update",
    "user.delete",
    // All business permissions
    "business.create",
    "business.read",
    "business.update",
    "business.delete",
    // All venue permissions
    "venue.create",
    "venue.read",
    "venue.update",
    "venue.delete",
    // All package permissions
    "package.create",
    "package.read",
    "package.update",
    "package.delete",
    // All vendor permissions
    "vendor.create",
    "vendor.read",
    "vendor.update",
    "vendor.delete",
    // All booking permissions
    "booking.create",
    "booking.read",
    "booking.update",
    "booking.delete",
    // All notes permissions
    "notes.create",
    "notes.read",
    "notes.update",
    "notes.delete",
    // All timeslot permissions
    "timeslot.create",
    "timeslot.read",
    "timeslot.update",
    "timeslot.delete",
    // All manager permissions
    "manager.create",
    "manager.read",
    "manager.assign",
    "manager.update",
    "manager.delete",
  ],

  // OWNER: Can manage their own business and everything within it
  owner: [
    // Limited user management (can manage users in their business)
    "user.read",
    "user.update",
    // Full business management for their business
    "business.read",
    "business.update",
    // Full venue management
    "venue.create",
    "venue.read",
    "venue.update",
    "venue.delete",
    // Full package management
    "package.create",
    "package.read",
    "package.update",
    "package.delete",
    // Full vendor management
    "vendor.create",
    "vendor.read",
    "vendor.update",
    "vendor.delete",
    // Full booking management
    "booking.create",
    "booking.read",
    "booking.update",
    "booking.delete",
    // Full notes management
    "notes.create",
    "notes.read",
    "notes.update",
    "notes.delete",
    // Full timeslot management
    "timeslot.create",
    "timeslot.read",
    "timeslot.update",
    "timeslot.delete",
    // Full manager management
    "manager.create",
    "manager.read",
    "manager.assign",
    "manager.update",
    "manager.delete",
    "lead.create",
    "lead.read",
    "lead.assign",
    "lead.update",
    "lead.delete",
  ],

  // MANAGER: Can access and modify all data but with some restrictions
  manager: [
    // Read all, create/update most (but not delete users or businesses)
    "user.read",
    "user.update",
    "business.read",
    "business.update",
    // Full venue management
    "venue.create",
    "venue.read",
    "venue.update",
    "venue.delete",
    // Full package management
    "package.create",
    "package.read",
    "package.update",
    "package.delete",
    // Full vendor management
    "vendor.create",
    "vendor.read",
    "vendor.update",
    "vendor.delete",
    // Full booking management
    "booking.create",
    "booking.read",
    "booking.update",
    "booking.delete",
    // Full notes management
    "notes.create",
    "notes.read",
    "notes.update",
    "notes.delete",
    // Full timeslot management
    "timeslot.create",
    "timeslot.read",
    "timeslot.update",
    "timeslot.delete",
    // Manager read access only
    "manager.read",
    // Full lead management
    "lead.create",
    "lead.read",
    "lead.assign",
    "lead.update",
    "lead.delete",
  ],
} as const;

const oid = (id: string | Types.ObjectId) =>
  typeof id === "string" ? new Types.ObjectId(id) : id;

const hasPerm = (role?: RoleSnapshot, perm?: string): boolean => {
  if (!role) return false;

  // DEVELOPER has full access
  if (role.role === "developer") return true;

  if (!perm) return false;

  // First check explicit permissions from database (if any)
  if (Array.isArray(role.permissions) && role.permissions.length > 0) {
    return role.permissions.includes(perm);
  }

  // Fall back to role-based permissions
  const rolePerms = ROLE_TO_PERMS[role.role] as readonly string[];
  return rolePerms ? rolePerms.includes(perm) : false;
};

/**
 * Try to infer the businessId for this request.
 * Priority:
 *   1) req.params.businessId
 *   2) req.params.venueId -> look up Venue.businessId
 *   3) req.params.packageId -> look up Package.venueId -> Venue.businessId
 *   4) req.body.businessId
 *   5) req.body.venueId -> look up Venue.businessId
 */
export async function resolveBusinessId(
  req: Request
): Promise<string | undefined> {
  const start = Date.now();
  const p = req.params ?? {};
  const b = req.body ?? {};
  console.log("\n────────── resolveBusinessId ──────────");
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("req.params:", p);
  console.log("req.body:", req.body);

  try {
    // (1) Direct businessId param
    const bFromParams = p["businessId"];
    if (bFromParams) {
      console.log("🟢 Found businessId in params:", bFromParams);
      console.log(`resolveBusinessId completed in ${Date.now() - start}ms`);
      console.log("──────────────────────────────────────────────\n");
      return bFromParams;
    }

    // (2) venueId param
    const vFromParams = p["venueId"];
    if (vFromParams) {
      console.log("🔍 Found venueId in params:", vFromParams);
      const venue = await Venue.findById(oid(vFromParams))
        .select("businessId")
        .lean();
      console.log("Venue lookup result:", venue);
      const businessId = venue ? String(venue.businessId) : undefined;
      console.log("Resolved businessId:", businessId);
      console.log(`resolveBusinessId completed in ${Date.now() - start}ms`);
      console.log("──────────────────────────────────────────────\n");
      return businessId;
    }

    // (3) packageId param

    // (4) businessId in body
    const bFromBody = (req.body as any)?.businessId;
    if (bFromBody) {
      console.log("🟢 Found businessId in body:", bFromBody);
      console.log(`resolveBusinessId completed in ${Date.now() - start}ms`);
      console.log("──────────────────────────────────────────────\n");
      return bFromBody;
    }

    // (5) venueId in body
    const vFromBody = (req.body as any)?.venueId;
    if (vFromBody) {
      console.log("🔍 Found venueId in body:", vFromBody);
      const venue = await Venue.findById(oid(vFromBody))
        .select("businessId")
        .lean();
      console.log("manager lookup result:", venue);
      const businessId = venue ? String(venue.businessId) : undefined;
      console.log("Resolved businessId:", businessId);
      console.log(`resolveBusinessId completed in ${Date.now() - start}ms`);
      console.log("──────────────────────────────────────────────\n");
      return businessId;
    }

    console.warn(
      "⚠️ No businessId or related identifiers found → returning undefined"
    );
    console.log(`resolveBusinessId completed in ${Date.now() - start}ms`);
    console.log("──────────────────────────────────────────────\n");
    return undefined;
  } catch (err: any) {
    console.error("💥 resolveBusinessId error:", err);
    console.log(`resolveBusinessId failed after ${Date.now() - start}ms`);
    console.log("──────────────────────────────────────────────\n");
    return undefined;
  }
}

/**
 * rolesMiddleware
 * - Requires auth middleware to have set req.user.userId
 * - Attaches a lightweight RoleSnapshot to req.userRole if a role for the resolved business exists.
 * - If no role found, leaves req.userRole undefined (controllers/services will enforce access).
 */
export async function rolesMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();
  const extReq = req as any; // Cast to avoid TypeScript issues

  console.log("\n────────── rolesMiddleware invoked ──────────");
  console.log(
    `[${new Date().toISOString()}] Request: ${req.method} ${req.originalUrl}`
  );
  console.log("Initial extReq.user:", extReq.user);
  console.log("Initial extReq.userRole:", extReq.userRole);

  try {
    // if already set (e.g., by a previous middleware), skip
    if (extReq.userRole) {
      console.log(
        "🟡 userRole already set in request → skipping role resolution"
      );
      return next();
    }

    if (!extReq.user?.userId) {
      console.warn("🔴 No userId found in extReq.user → Unauthorized");
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    console.log("🟢 userId found:", extReq.user.userId);

    // Check if user is a developer - grant full access
    if (extReq.user?.role === "developer") {
      console.log("👨‍💻 Developer detected → granting full access");
      extReq.userRole = {
        role: "developer",
        permissions: ["*"], // All permissions
      };
      console.log(`rolesMiddleware completed in ${Date.now() - start}ms`);
      console.log("──────────────────────────────── ─────────────\n");
      return next();
    }

    const businessId = await resolveBusinessId(req);
    console.log("Resolved businessId:", businessId);

    if (!businessId) {
      console.log("🟠 No businessId (route not business-scoped) → proceeding");
      return next();
    }

    console.log("🔍 Fetching UserBusinessRole for:", {
      userId: extReq.user.userId,
      businessId,
    });

    const roleDoc = await UserBusinessRole.findOne({
      userId: oid(extReq.user.userId),
      businessId: oid(businessId),
    })
      .select("role permissions")
      .lean();

    console.log("roleDoc result:", roleDoc);

    if (roleDoc) {
      extReq.userRole = {
        role: roleDoc.role,
        permissions: roleDoc.permissions ?? [],
      };
      console.log("✅ Assigned userRole:", extReq.userRole);
    } else {
      extReq.userRole = undefined;
      console.warn(
        "⚠️ No matching UserBusinessRole found → userRole undefined"
      );
    }

    console.log(`rolesMiddleware completed in ${Date.now() - start}ms`);
    console.log("──────────────────────────────── ─────────────\n");

    return next();
  } catch (err: any) {
    console.error("💥 rolesMiddleware error:", err);
    console.log(`rolesMiddleware failed after ${Date.now() - start}ms`);
    console.log("──────────────────────────────────────────────\n");

    return res
      .status(500)
      .json({ success: false, message: "Failed to resolve user role" });
  }
}

/**
 * requirePerm
 * - Route guard for specific permission(s).
 * - If user is superadmin, always  allowed.
 * - If no role on request, it tries to resolve businessId and load the role (same as rolesMiddleware).
 */

export function requirePerm(perm: string | string[]) {
  const perms = Array.isArray(perm) ? perm : [perm];

  return async (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const extReq = req as any;

    console.log("\n────────── requirePerm middleware ──────────");
    console.log(
      `[${new Date().toISOString()}] Request: ${req.method} ${req.originalUrl}`
    );
    console.log("🔸 Required permissions:", perms);
    console.log("🔹 Initial extReq.user:", extReq.user);
    console.log("🔹 Initial extReq.userRole:", extReq.userRole);

    try {
      // 🔐 Check user presence
      if (!extReq.user?.userId) {
        console.warn("🔴 No userId found in request → Unauthorized");
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      console.log("🟢 Authenticated userId:", extReq.user.userId);

      // 🧩 Ensure userRole is present (if not, fetch)
      if (!extReq.userRole) {
        console.log("🟠 userRole missing → attempting to resolve from DB...");
        const businessId = await resolveBusinessId(req);
        console.log("Resolved businessId:", businessId);

        if (businessId) {
          const roleDoc = await UserBusinessRole.findOne({
            userId: oid(extReq.user.userId),
            businessId: oid(businessId),
          })
            .select("role permissions")
            .lean();

          console.log("roleDoc result:", roleDoc);

          if (roleDoc) {
            extReq.userRole = {
              role: roleDoc.role,
              permissions: roleDoc.permissions ?? [],
            } as RoleSnapshot;
            console.log("✅ Assigned extReq.userRole:", extReq.userRole);
          } else {
            console.warn("⚠️ No roleDoc found for user/business combo");
          }
        } else {
          console.warn("⚠️ No businessId resolved → cannot assign role");
        }
      } else {
        console.log("🟡 userRole already exists → skipping DB lookup");
      }

      // 🧾 Developer bypass
      if (extReq.userRole?.role === "developer") {
        console.log("🧑‍💻 Developer role detected → full access granted");
        console.log(`requirePerm completed in ${Date.now() - start}ms`);
        console.log("──────────────────────────────────────────────\n");
        return next();
      }

      // 🧮 Permission check
      console.log("🔍 Checking permissions...");
      const ok = perms.every((p) =>
        hasPerm(extReq.userRole as RoleSnapshot | undefined, p)
      );
      console.log("Permission check result:", ok);

      if (!ok) {
        console.warn("⛔ Permission denied");
        console.log(`requirePerm completed in ${Date.now() - start}ms`);
        console.log("──────────────────────────────────────────────\n");

        return res.status(403).json({
          success: false,
          message: "Forbidden: insufficient permissions",
        });
      }

      console.log("✅ Permission granted");
      console.log(`requirePerm completed in ${Date.now() - start}ms`);
      console.log("──────────────────────────────────────────────\n");

      return next();
    } catch (err: any) {
      console.error("💥 requirePerm error:", err);
      console.log(`requirePerm failed after ${Date.now() - start}ms`);
      console.log("──────────────────────────────────────────────\n");

      return res
        .status(500)
        .json({ success: false, message: "Role/permission check failed" });
    }
  };
}

// Helper functions for role management
export const RoleHelper = {
  /**
   * Check if a role has a specific permission
   */
  hasPermission(role: string, permission: string): boolean {
    if (role === "developer") return true;
    const rolePerms = ROLE_TO_PERMS[
      role as keyof typeof ROLE_TO_PERMS
    ] as readonly string[];
    return rolePerms ? rolePerms.includes(permission) : false;
  },

  /**
   * Get all permissions for a role
   */
  getPermissionsForRole(role: string): string[] {
    if (role === "developer") {
      return Object.values(PERMS);
    }
    return [...(ROLE_TO_PERMS[role as keyof typeof ROLE_TO_PERMS] || [])];
  },

  /**
   * Check if user can access a specific business context
   */
  canAccessBusiness(
    userRole?: RoleSnapshot,
    requiredBusinessId?: string
  ): boolean {
    if (!userRole) return false;
    if (userRole.role === "developer") return true;
    // For now, all business-scoped roles can access their business
    // Future: implement business-specific access control
    return true;
  },

  /**
   * Create a requireRole middleware (alternative to requirePerm)
   */
  requireRole(roles: string | string[]) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const extReq = req as any; // Cast to avoid TypeScript issues

        if (!extReq.user?.userId) {
          return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
        }

        // Ensure role is resolved
        if (!extReq.userRole) {
          const businessId = await resolveBusinessId(req);
          if (businessId) {
            const roleDoc = await UserBusinessRole.findOne({
              userId: oid(extReq.user.userId),
              businessId: oid(businessId),
            })
              .select("role permissions")
              .lean();

            if (roleDoc) {
              extReq.userRole = {
                role: roleDoc.role,
                permissions: roleDoc.permissions ?? [],
              } as RoleSnapshot;
            }
          }
        }

        console.log(extReq);

        if (!extReq.userRole || !allowedRoles.includes(extReq.userRole.role)) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: insufficient role access",
          });
        }

        return next();
      } catch (err: any) {
        return res
          .status(500)
          .json({ success: false, message: "Role check failed" });
      }
    };
  },
};

// Export permission constants for convenience in routes
export const ROLE_PERMS = PERMS;
