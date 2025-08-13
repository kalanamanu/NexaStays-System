const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authenticateToken = require("../middleware/authenticateToken");

// Middleware to log incoming requests and user info for easier debugging
router.use((req, res, next) => {
    console.log("Block Booking API - req.user:", req.user);
    next();
});

// POST: Create a block booking
router.post("/", authenticateToken, async (req, res) => {
    if (!req.user || req.user.role !== "travel-company") {
        return res.status(403).json({ error: "Unauthorized" });
    }
    const { rooms, roomType, arrivalDate, departureDate, discountRate, totalAmount } = req.body;
    const travelCompanyId = req.user.travelCompanyProfileId;

    if (!travelCompanyId) {
        console.error("Block Booking POST: Missing travelCompanyProfileId in req.user:", req.user);
        return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
    }

    if (!rooms || !roomType || !arrivalDate || !departureDate || discountRate == null || totalAmount == null) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        const blockBooking = await prisma.blockBooking.create({
            data: {
                travelCompanyId,
                rooms,
                roomType,
                arrivalDate: new Date(arrivalDate),
                departureDate: new Date(departureDate),
                discountRate,
                totalAmount,
                status: "pending",
            },
        });
        console.log("Block Booking Created:", blockBooking);
        res.json({ blockBooking });
    } catch (err) {
        console.error("Block booking error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Get all block bookings for this travel company
router.get("/", authenticateToken, async (req, res) => {
    if (!req.user || req.user.role !== "travel-company") {
        return res.status(403).json({ error: "Unauthorized" });
    }
    const travelCompanyId = req.user.travelCompanyProfileId;

    if (!travelCompanyId) {
        console.error("Block Booking GET: Missing travelCompanyProfileId in req.user:", req.user);
        return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
    }

    try {
        const blockBookings = await prisma.blockBooking.findMany({
            where: { travelCompanyId },
            orderBy: { createdAt: "desc" },
        });
        res.json({ blockBookings });
    } catch (err) {
        console.error("Block booking error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;