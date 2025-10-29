import { Router } from "express";
import authRoutes from "./userRoutes";
import businessRoutes from "./businessRoutes";
import venueRoutes from "./venueRoutes";
import managerRoutes from "./managerRoutes";
import leadRoutes from "./leadRoutes";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Banquet Booking API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

router.use("/auth", authRoutes);
router.use("/businesses", businessRoutes);
router.use("/venues", venueRoutes);
router.use("/managers", managerRoutes);
router.use("/leads", leadRoutes);



export default router;
