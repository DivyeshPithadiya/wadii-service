import mongoose from "mongoose";
import { User } from "../models/User";
import { PasswordUtils } from "../utils/password";

const MONGO_URI =
  "mongodb+srv://divyeshpithadiya:8aKA8RWQRN3xsZg@techsolution.pidwsxo.mongodb.net/?retryWrites=true&w=majority&appName=TechSolution"; // align with your app DB!

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to DB:", MONGO_URI);

  const pwHash = await PasswordUtils.hashPassword("password123");

  // Always lowercase emails in seed data - using NEW role names
  const usersToSeed = [
    {
      email: "developer@test.com".toLowerCase(),
      password: pwHash,
      firstName: "Super",
      lastName: "Developer",
      role: "developer", // new role name (was superadmin)
    },
    {
      email: "manager@test.com".toLowerCase(),
      password: pwHash,
      firstName: "System",
      lastName: "Manager",
      role: "manager", // new role name (was admin)
    },
    {
      email: "owner@test.com".toLowerCase(),
      password: pwHash,
      firstName: "Business",
      lastName: "Owner",
      role: "user", // will become owner after creating a business
    },
  ] as const;

  const results: any[] = [];

  for (const u of usersToSeed) {
    // Use upsert to create or update in one go; ensure email stays lowercased
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      {
        $set: {
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName ?? null,
          role: (u as any).role ?? "user",
          // ALWAYS set password to a known hash to avoid “invalid creds”
          password: u.password,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).select("+password"); // so we can see it's hashed

    results.push({
      email: doc.email,
      role: (doc as any).role,
      passwordStartsWith: String(doc.password).slice(0, 4), // should be "$2b$"
    });
  }

  console.log("🎉 Seeded/Updated users:");
  console.table(results);

  await mongoose.disconnect();
  console.log("🔌 Disconnected from DB");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
