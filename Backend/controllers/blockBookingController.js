const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Controller for Block Bookings
 * Exports: createBlockBooking, getBlockBookings, updateBlockBooking, deleteBlockBooking
 *
 * Note: routes should apply authenticateToken middleware before these handlers.
 */

async function createBlockBooking(req, res) {
    try {
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
        console.error("Block booking create error:", err);
        res.status(500).json({ error: err.message });
    }
}

async function getBlockBookings(req, res) {
    try {
        if (!req.user || req.user.role !== "travel-company") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const travelCompanyId = req.user.travelCompanyProfileId;
        if (!travelCompanyId) {
            console.error("Block Booking GET: Missing travelCompanyProfileId in req.user:", req.user);
            return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
        }

        const blockBookings = await prisma.blockBooking.findMany({
            where: { travelCompanyId },
            orderBy: { createdAt: "desc" },
        });

        res.json({ blockBookings });
    } catch (err) {
        console.error("Block booking get error:", err);
        res.status(500).json({ error: err.message });
    }
}

async function updateBlockBooking(req, res) {
    try {
        if (!req.user || req.user.role !== "travel-company") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const { rooms, roomType, arrivalDate, departureDate, discountRate, totalAmount } = req.body;
        const travelCompanyId = req.user.travelCompanyProfileId;

        if (!travelCompanyId) {
            console.error("Block Booking PUT: Missing travelCompanyProfileId in req.user:", req.user);
            return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
        }

        if (!rooms || !roomType || !arrivalDate || !departureDate || discountRate == null || totalAmount == null) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const existing = await prisma.blockBooking.findFirst({
            where: {
                id: Number(id),
                travelCompanyId,
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Block booking not found." });
        }

        const blockBooking = await prisma.blockBooking.update({
            where: { id: Number(id) },
            data: {
                rooms,
                roomType,
                arrivalDate: new Date(arrivalDate),
                departureDate: new Date(departureDate),
                discountRate,
                totalAmount,
            },
        });

        res.json({ blockBooking });
    } catch (err) {
        console.error("Block booking update error:", err);
        res.status(500).json({ error: err.message });
    }
}

async function deleteBlockBooking(req, res) {
    try {
        if (!req.user || req.user.role !== "travel-company") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const travelCompanyId = req.user.travelCompanyProfileId;

        if (!travelCompanyId) {
            console.error("Block Booking DELETE: Missing travelCompanyProfileId in req.user:", req.user);
            return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
        }

        const existing = await prisma.blockBooking.findFirst({
            where: {
                id: Number(id),
                travelCompanyId,
            },
        });
        if (!existing) {
            return res.status(404).json({ error: "Block booking not found." });
        }

        await prisma.blockBooking.delete({
            where: { id: Number(id) },
        });

        res.json({ message: "Block booking deleted." });
    } catch (err) {
        console.error("Block booking delete error:", err);
        res.status(500).json({ error: err.message });
    }
}

async function getBlockBookingById(req, res) {
    try {
        if (!req.user || req.user.role !== "travel-company") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const travelCompanyId = req.user.travelCompanyProfileId;

        if (!travelCompanyId) {
            return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
        }

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ error: "Invalid block booking ID." });
        }

        const blockBooking = await prisma.blockBooking.findFirst({
            where: {
                id: Number(id),
                travelCompanyId,
            },
        });

        if (!blockBooking) {
            return res.status(404).json({ error: "Block booking not found." });
        }

        res.json({ blockBooking });
    } catch (err) {
        console.error("Block booking get by id error:", err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    createBlockBooking,
    getBlockBookings,
    updateBlockBooking,
    deleteBlockBooking,
    getBlockBookingById
};