import Database from "../config/db";
import { UserBusinessRole } from "../models/UserBusinessRole";
import { User } from "../models/User";
import { JWTUtils } from "../utils/jwt";
import { ROLE_TO_PERMS } from "../middlewares/roles";

async function debugPermissions() {
  try {
    // Connect to database
    const database = Database.getInstance();
    await database.connect();
    console.log("✅ Connected to database");

    console.log("\n🔍 DEBUGGING PERMISSIONS ISSUE\n");

    // Check all users and their roles
    console.log("1. 👤 All Users:");
    const users = await User.find({}).select("email firstName lastName role").lean();
    users.forEach(user => {
      console.log(`   ${user.email} - Role: ${user.role} (${user.firstName} ${user.lastName})`);
    });

    console.log("\n2. 🏢 All UserBusinessRoles (without populate):");
    const userRoles = await UserBusinessRole.find({}).lean();
    console.log(`   Found ${userRoles.length} role assignments`);
    
    userRoles.forEach((role: any, index) => {
      console.log(`   ${index + 1}. User ID: ${role.userId}`);
      console.log(`      Business ID: ${role.businessId}`);
      console.log(`      Venue ID: ${role.venueId || "null (business-level)"}`);
      console.log(`      Role: ${role.role}`);
      console.log(`      Scope: ${role.scope || "business"}`);
      console.log(`      Permissions: [${role.permissions?.join(", ") || "none"}]`);
      console.log(`      ---`);
    });

    console.log("\n3. 🔐 Expected Permissions by Role:");
    Object.entries(ROLE_TO_PERMS).forEach(([role, perms]) => {
      console.log(`   ${role.toUpperCase()}: ${perms.length} permissions`);
      if (role === "owner") {
        console.log(`      Manager permissions: ${perms.filter(p => p.startsWith("manager.")).join(", ")}`);
      }
    });

    console.log("\n4. 🧪 Test JWT Token Generation:");
    // Find an owner user to test with
    const ownerUser = users.find(u => u.role === "owner");
    if (ownerUser) {
      const testToken = JWTUtils.generateToken({
        userId: ownerUser._id.toString(),
        email: ownerUser.email,
        role: ownerUser.role,
      });
      console.log(`   Generated JWT for ${ownerUser.email}: ${testToken.substring(0, 50)}...`);
      
      // Verify the token
      const decoded = JWTUtils.verifyToken(testToken);
      console.log(`   Decoded token:`, decoded);
    } else {
      console.log("   No owner user found to test with");
    }

    console.log("\n5. 🔧 Suggested Fixes:");
    console.log("   a) Run the role migration: npm run migrate:roles");
    console.log("   b) Update existing owner permissions (see script below)");
    console.log("   c) Make sure ROLE_TO_PERMS includes manager.* permissions for owners");

  } catch (error) {
    console.error("Debug failed:", error);
  } finally {
    process.exit(0);
  }
}

debugPermissions();
