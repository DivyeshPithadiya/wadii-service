import mongoose from "mongoose";
import { Lead } from "../models/Lead";
import { Booking } from "../models/Booking";
import { Service } from "../models/Service";

/**
 * Migration script to convert service string references to ObjectId references
 *
 * This script:
 * 1. Finds all Services and creates a mapping of service name -> ObjectId
 * 2. Updates all Leads with service strings to use Service ObjectIds
 * 3. Updates all Bookings with service strings to use Service ObjectIds
 */

async function migrateServicesToObjectId() {
  try {
    console.log(
      "🚀 Starting migration: Converting service strings to ObjectIds...\n"
    );

    // Step 1: Get all services and create a name -> ID mapping
    const services = await Service.find({});
    const serviceMap = new Map<string, mongoose.Types.ObjectId>();

    services.forEach((service) => {
      serviceMap.set(service.name.toLowerCase().trim(), service._id);
    });

    console.log(`📋 Found ${services.length} services in the database`);
    console.log(`Services: ${Array.from(serviceMap.keys()).join(", ")}\n`);

    // Step 2: Migrate Leads
    console.log("🔄 Migrating Leads...");
    const leads = await Lead.find({ "services.service": { $type: "string" } });
    console.log(`Found ${leads.length} leads with string service references`);

    let leadsUpdated = 0;
    for (const lead of leads) {
      let needsUpdate = false;

      if (lead.services && lead.services.length > 0) {
        for (let i = 0; i < lead.services.length; i++) {
          const serviceItem = lead.services[i];
          const serviceName = serviceItem.service as any as string;

          if (typeof serviceName === "string") {
            const serviceId = serviceMap.get(serviceName.toLowerCase().trim());

            if (serviceId) {
              lead.services[i].service = serviceId as any;
              needsUpdate = true;
              console.log(
                `  ✓ Lead ${lead._id}: "${serviceName}" -> ${serviceId}`
              );
            } else {
              console.log(
                `    Lead ${lead._id}: Service "${serviceName}" not found in Service collection`
              );
            }
          }
        }
      }

      if (needsUpdate) {
        await lead.save();
        leadsUpdated++;
      }
    }

    console.log(` Updated ${leadsUpdated} leads\n`);

    // Step 3: Migrate Bookings
    console.log("🔄 Migrating Bookings...");
    const bookings = await Booking.find({
      "services.service": { $type: "string" },
    });
    console.log(
      `Found ${bookings.length} bookings with string service references`
    );

    let bookingsUpdated = 0;
    for (const booking of bookings) {
      let needsUpdate = false;

      if (booking.services && booking.services.length > 0) {
        for (let i = 0; i < booking.services.length; i++) {
          const serviceItem = booking.services[i];
          const serviceName = serviceItem.service as any as string;

          if (typeof serviceName === "string") {
            const serviceId = serviceMap.get(serviceName.toLowerCase().trim());

            if (serviceId) {
              booking.services[i].service = serviceId as any;
              needsUpdate = true;
              console.log(
                `  ✓ Booking ${booking._id}: "${serviceName}" -> ${serviceId}`
              );
            } else {
              console.log(
                `    Booking ${booking._id}: Service "${serviceName}" not found in Service collection`
              );
            }
          }
        }
      }

      if (needsUpdate) {
        await booking.save();
        bookingsUpdated++;
      }
    }

    console.log(` Updated ${bookingsUpdated} bookings\n`);

    // Summary
    console.log("🎉 Migration completed successfully!");
    console.log(`Summary:`);
    console.log(`  - Leads updated: ${leadsUpdated}`);
    console.log(`  - Bookings updated: ${bookingsUpdated}`);
    console.log(
      `  - Total documents updated: ${leadsUpdated + bookingsUpdated}`
    );
  } catch (error: any) {
    console.error("Migration failed:", error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/wadii";

  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log(" Connected to MongoDB\n");
      return migrateServicesToObjectId();
    })
    .then(() => {
      console.log("\n Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateServicesToObjectId };
