import Database from "../config/db";
import { UserBusinessRole } from "../models/UserBusinessRole";
import { ROLE_TO_PERMS } from "../middlewares/roles";

async function updateOwnerPermissions() {
  try {
    // Connect to database
    const database = Database.getInstance();
    await database.connect();
    console.log(" Connected to database");

    console.log("\n UPDATING OWNER PERMISSIONS\n");

    // Get current owner role assignments
    const ownerRoles = await UserBusinessRole.find({ role: "owner" }).lean();
    console.log(`Found ${ownerRoles.length} owner role assignments`);

    if (ownerRoles.length === 0) {
      console.log(
        " No owner roles found. Make sure you have owner users with business assignments."
      );
      return;
    }

    // Get the expected permissions for owners
    const expectedOwnerPerms = ROLE_TO_PERMS.owner;
    console.log(`Expected owner permissions (${expectedOwnerPerms.length}):`);
    console.log(`   ${expectedOwnerPerms.join(", ")}`);

    let updatedCount = 0;

    for (const ownerRole of ownerRoles) {
      const currentPerms = ownerRole.permissions || [];
      const missingPerms = expectedOwnerPerms.filter(perm => !currentPerms.includes(perm));
      
      if (missingPerms.length > 0) {
        console.log(`\\n📝 Updating owner ${ownerRole.userId}:`);
        console.log(`   Current permissions: ${currentPerms.length}`);
        console.log(`   Missing permissions: ${missingPerms.join(", ")}`);
        
        // Update with all expected permissions
        await UserBusinessRole.findByIdAndUpdate(
          ownerRole._id,
          { 
            $set: { 
              permissions: [...expectedOwnerPerms] // Set to full expected permissions
            } 
          }
        );
        
        updatedCount++;
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`\\n✨ Owner ${ownerRole.userId} already has all required permissions`);
      }
    }

    console.log(`\\n📊 Summary:`);
    console.log(`   Total owners: ${ownerRoles.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already up-to-date: ${ownerRoles.length - updatedCount}`);

    // Verify the updates
    console.log(`\\n🔍 Verification:`);
    const updatedOwnerRoles = await UserBusinessRole.find({ role: "owner" }).lean();
    updatedOwnerRoles.forEach((role: any, index) => {
      const managerPerms = role.permissions.filter((p: string) => p.startsWith("manager."));
      console.log(`   Owner ${index + 1}: ${role.permissions.length} total permissions, ${managerPerms.length} manager permissions`);
      console.log(`      Manager perms: ${managerPerms.join(", ")}`);
    });

    console.log(`\\n🎉 Owner permissions updated successfully!`);
    console.log(`\\n🧪 Test your manager creation endpoint now:`);
    console.log(`   POST /api/managers`);
    console.log(`   With your owner JWT token`);

  } catch (error) {
    console.error("❌ Update failed:", error);
  } finally {
    process.exit(0);
  }
}

updateOwnerPermissions();
