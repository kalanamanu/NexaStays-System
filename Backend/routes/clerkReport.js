const express = require("express");
const router = express.Router();
const { authenticateClerkToken } = require("../middleware/authenticateToken");
const clerkReportController = require("../controllers/clerkReportController");

router.get("/occupancy", authenticateClerkToken, clerkReportController.getHotelOccupancyReport);
router.get("/revenue", authenticateClerkToken, clerkReportController.getHotelRevenueReport);

module.exports = router;