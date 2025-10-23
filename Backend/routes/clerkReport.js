const express = require("express");
const router = express.Router();
const { authenticateClerkToken } = require("../middleware/authenticateToken");
const clerkReportController = require("../controllers/clerkReportController");

// GET /api/reports/occupancy?hotelId=123&from=2025-10-01&to=2025-10-31
router.get("/occupancy", authenticateClerkToken, clerkReportController.getHotelOccupancyRevenueReport);

module.exports = router;