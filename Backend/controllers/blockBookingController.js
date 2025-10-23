const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createBlockBooking(req, res) {
    try {
        if (!req.user || req.user.role !== "travel-company") {
            return res.status(403).json({ error: "Unauthorized" });
        }
        const { hotelId, roomTypes, arrivalDate, departureDate, discountRate, totalAmount } = req.body;
        const travelCompanyId = req.user.travelCompanyProfileId;

        if (!travelCompanyId) {
            return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
        }
        if (!hotelId) {
            return res.status(400).json({ error: "Missing hotel." });
        }
        if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
            return res.status(400).json({ error: "At least one room type must be selected." });
        }
        if (!arrivalDate || !departureDate || discountRate == null || totalAmount == null) {
            return res.status(400).json({ error: "Missing required fields." });
        }
        // Validate all roomTypes
        let totalRooms = 0;
        for (const rt of roomTypes) {
            if (!rt.roomType || typeof rt.rooms !== "number" || rt.rooms < 1) {
                return res.status(400).json({ error: "All roomTypes must have a roomType and at least 1 room." });
            }
            totalRooms += rt.rooms;
        }
        if (totalRooms < 3) {
            return res.status(400).json({ error: "Block booking must be for at least 3 rooms total." });
        }

        const blockBooking = await prisma.blockBooking.create({
            data: {
                travelCompanyId,
                hotelId: Number(hotelId),
                arrivalDate: new Date(arrivalDate),
                departureDate: new Date(departureDate),
                discountRate,
                totalAmount,
                status: "pending",
                roomTypes: {
                    create: roomTypes.map(rt => ({
                        roomType: rt.roomType,
                        rooms: rt.rooms,
                    })),
                }
            },
            include: { roomTypes: true }
        });

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
            return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
        }

        const blockBookings = await prisma.blockBooking.findMany({
            where: { travelCompanyId },
            orderBy: { createdAt: "desc" },
            include: { roomTypes: true, hotel: true },
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
        const { hotelId, roomTypes, arrivalDate, departureDate, discountRate, totalAmount } = req.body;
        const travelCompanyId = req.user.travelCompanyProfileId;

        if (!travelCompanyId) {
            return res.status(400).json({ error: "Missing travel company profile. Please contact support." });
        }

        if (!hotelId || !Array.isArray(roomTypes) || roomTypes.length === 0 || !arrivalDate || !departureDate || discountRate == null || totalAmount == null) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        let totalRooms = 0;
        for (const rt of roomTypes) {
            if (!rt.roomType || typeof rt.rooms !== "number" || rt.rooms < 1) {
                return res.status(400).json({ error: "All roomTypes must have a roomType and at least 1 room." });
            }
            totalRooms += rt.rooms;
        }
        if (totalRooms < 3) {
            return res.status(400).json({ error: "Block booking must be for at least 3 rooms total." });
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

        // Update main block booking
        const blockBooking = await prisma.blockBooking.update({
            where: { id: Number(id) },
            data: {
                hotelId: Number(hotelId),
                arrivalDate: new Date(arrivalDate),
                departureDate: new Date(departureDate),
                discountRate,
                totalAmount,
            },
        });

        // Remove previous room types and add new ones
        await prisma.blockBookingRoomType.deleteMany({
            where: { blockBookingId: blockBooking.id }
        });
        await prisma.blockBookingRoomType.createMany({
            data: roomTypes.map(rt => ({
                blockBookingId: blockBooking.id,
                roomType: rt.roomType,
                rooms: rt.rooms,
            })),
        });

        // Return updated with new roomTypes
        const updated = await prisma.blockBooking.findUnique({
            where: { id: blockBooking.id },
            include: { roomTypes: true, hotel: true }
        });

        res.json({ blockBooking: updated });
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

        // Delete all related roomTypes first due to FK constraint
        await prisma.blockBookingRoomType.deleteMany({
            where: { blockBookingId: Number(id) }
        });

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
            include: {
                roomTypes: true,
                hotel: {
                    include: {
                        rooms: true,
                    },
                },
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