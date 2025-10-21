const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authenticateToken");
const blockBookingController = require("../controllers/blockBookingController");

// Logging middleware for this router
router.use((req, res, next) => {
    console.log("Block Booking API - req.user:", req.user);
    next();
});

// Routes
router.post("/", authenticateToken, blockBookingController.createBlockBooking);
router.get("/", authenticateToken, blockBookingController.getBlockBookings);
router.put("/:id", authenticateToken, blockBookingController.updateBlockBooking);
router.delete("/:id", authenticateToken, blockBookingController.deleteBlockBooking);

module.exports = router;