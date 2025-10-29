import mongoose from "mongoose";
import { User } from "../models/User";
import { UserBusinessRole } from "../models/UserBusinessRole";
import Database from "../config/db";

/**
 * Migration script to update roles from old system to new system:
 * - superadmin → developer
 * - admin → manager  
 * - owner → owner (no change)
 */

interface MigrationSummary {
  usersUpdated: number;
  userBusinessRolesUpdated: number;
  errors: string[];
}

async function migrateRoles(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    usersUpdated: 0,
    userBusinessRolesUpdated: 0,
    errors: []
  };

  try {
    // Connect to database
    const database = Database.getInstance();
    await database.connect();
    console.log("✅ Connected to database");

    // Step 1: Update User model roles
    console.log("\n🔄 Step 1: Migrating User roles...");
    
    const userRoleUpdates = [
      { oldRole: "superadmin", newRole: "developer" },
      { oldRole: "admin", newRole: "manager" },
      // owner stays the same
    ];

    for (const { oldRole, newRole } of userRoleUpdates) {
      try {
        const result = await User.updateMany(
          { role: oldRole },
          { $set: { role: newRole } }
        );
        
        console.log(`   📝 Updated ${result.modifiedCount} users: ${oldRole} → ${newRole}`);
        summary.usersUpdated += result.modifiedCount;
      } catch (error) {
        const errorMsg = `Failed to update User roles ${oldRole} → ${newRole}: ${error}`;
        console.error(`   ❌ ${errorMsg}`);
        summary.errors.push(errorMsg);
      }
    }

    // Step 2: Update UserBusinessRole model roles
    console.log("\n🔄 Step 2: Migrating UserBusinessRole roles...");
    
    for (const { oldRole, newRole } of userRoleUpdates) {
      try {
        const result = await UserBusinessRole.updateMany(
          { role: oldRole },
          { $set: { role: newRole } }
        );
        
        console.log(`   📝 Updated ${result.modifiedCount} user-business roles: ${oldRole} → ${newRole}`);
        summary.userBusinessRolesUpdated += result.modifiedCount;
      } catch (error) {
        const errorMsg = `Failed to update UserBusinessRole roles ${oldRole} → ${newRole}: ${error}`;
        console.error(`   ❌ ${errorMsg}`);
        summary.errors.push(errorMsg);
      }
    }

    // Step 3: Verify migration
    console.log("\n🔍 Step 3: Verifying migration results...");
    
    // Check User collection
    const userRoleCounts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log("   👤 User roles after migration:");
    userRoleCounts.forEach(({ _id, count }) => {
      console.log(`      ${_id}: ${count} users`);
    });

    // Check UserBusinessRole collection
    const businessRoleCounts = await UserBusinessRole.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log("   🏢 Business roles after migration:");
    businessRoleCounts.forEach(({ _id, count }) => {
      console.log(`      ${_id}: ${count} business roles`);
    });

    // Check for any remaining old roles
    const oldUserRoles = await User.find({ 
      role: { $in: ["superadmin", "admin"] } 
    }).countDocuments();
    
    const oldBusinessRoles = await UserBusinessRole.find({ 
      role: { $in: ["superadmin", "admin"] } 
    }).countDocuments();

    if (oldUserRoles > 0 || oldBusinessRoles > 0) {
      const warningMsg = `⚠️  Warning: Found ${oldUserRoles} users and ${oldBusinessRoles} business roles still using old role names`;
      console.log(`   ${warningMsg}`);
      summary.errors.push(warningMsg);
    } else {
      console.log("   ✅ No old role names found - migration complete!");
    }

    return summary;

  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(`❌ ${errorMsg}`);
    summary.errors.push(errorMsg);
    return summary;
  }
}

async function main() {
  console.log("🚀 Starting Role Migration");
  console.log("   superadmin → developer");
  console.log("   admin → manager");
  console.log("   owner → owner (no change)");
  console.log("=" .repeat(50));

  const startTime = Date.now();
  
  try {
    const summary = await migrateRoles();
    
    const duration = Date.now() - startTime;
    
    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   👤 Users updated: ${summary.usersUpdated}`);
    console.log(`   🏢 Business roles updated: ${summary.userBusinessRolesUpdated}`);
    console.log(`   ❌ Errors: ${summary.errors.length}`);
    
    if (summary.errors.length > 0) {
      console.log("\n📝 Errors encountered:");
      summary.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (summary.errors.length === 0 && (summary.usersUpdated > 0 || summary.userBusinessRolesUpdated > 0)) {
      console.log("\n🎉 Migration completed successfully!");
    } else if (summary.usersUpdated === 0 && summary.userBusinessRolesUpdated === 0 && summary.errors.length === 0) {
      console.log("\n✨ No migration needed - all roles are already up to date!");
    } else {
      console.log("\n⚠️  Migration completed with issues - please review errors above");
    }

  } catch (error) {
    console.error(`\n💥 Critical migration error: ${error}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Run the migration
main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
