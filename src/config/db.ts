import mongoose from "mongoose";

class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      const mongoURI = process.env.MONGO_URI;

      if (!mongoURI) {
        throw new Error("MONGO_URI environment variable is not defined");
      }

      await mongoose.connect(mongoURI);

      console.log("📦 MongoDB connected successfully");

      mongoose.connection.on("error", (error) => {
        console.error(" MongoDB connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        console.log(" MongoDB disconnected");
      });

      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed through app termination");
        process.exit(0);
      });
    } catch (error) {
      console.error(" MongoDB connection failed:", error);
      process.exit(1);
    }
  }
}

export default Database;
