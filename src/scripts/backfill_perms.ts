// scripts/backfill-ubr-permissions.ts
import mongoose from "mongoose";
import { UserBusinessRole } from "../models/UserBusinessRole";
import { ROLE_TO_PERMS } from "../middlewares/roles";
import Database from "../config/db";

async function run() {
  const db = Database.getInstance();
  await db.connect();
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cursor = UserBusinessRole.find().cursor();
      let updated = 0,
        skipped = 0,
        invalid = 0;

      for await (const doc of cursor) {
        const role = doc.role as keyof typeof ROLE_TO_PERMS;
        const base = ROLE_TO_PERMS[role];

        if (!base) {
          invalid++;
          continue;
        }

        const next = [...base].sort();
        const same =
          Array.isArray(doc.permissions) &&
          doc.permissions.length === next.length &&
          doc.permissions.every((p, i) => p === next[i]);

        if (same) {
          skipped++;
          continue;
        }

        await UserBusinessRole.updateOne(
          { _id: doc._id },
          { $set: { permissions: next } },
          { session }
        );
        updated++;
      }
      console.log({ updated, skipped, invalid });
    });

    console.log("✅ Backfill complete");
  } catch (e) {
    console.error("Backfill failed:", e);
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
