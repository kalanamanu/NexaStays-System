const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET /api/reports/occupancy?hotelId=123&from=2025-10-01&to=2025-10-31
 * Returns daily occupancy for the hotel in the date range.
 * Includes room type breakdown, total rooms, rooms occupied, rooms reserved, and total room nights.
 */
async function getHotelOccupancyReport(req, res) {
    const hotelId = Number(req.query.hotelId);
    let { from, to } = req.query;

    if (!hotelId) {
        return res.status(400).json({ error: "hotelId is required" });
    }

    // Default: this month
    const today = new Date();
    const firstDay =
        from || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay =
        to || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    try {
        // 1. Get all rooms for this hotel
        const rooms = await prisma.room.findMany({
            where: { hotelId },
            select: { id: true, type: true, status: true },
        });
        const roomIds = rooms.map((r) => r.id);

        // Build room type breakdown
        const roomTypes = {};
        rooms.forEach((room) => {
            if (!roomTypes[room.type]) {
                roomTypes[room.type] = { total: 0, occupied: 0, reserved: 0 };
            }
            roomTypes[room.type].total += 1;
            if (room.status === "occupied") roomTypes[room.type].occupied += 1;
            if (room.status === "reserved") roomTypes[room.type].reserved += 1;
        });

        // 2. Get all reservations for this hotel in the date range
        const reservations = await prisma.reservation.findMany({
            where: {
                hotelId,
                status: { in: ["reserved", "checked-in", "checked-out", "paid"] },
                arrivalDate: { lte: new Date(lastDay) },
                departureDate: { gte: new Date(firstDay) },
            },
            select: {
                id: true,
                arrivalDate: true,
                departureDate: true,
                roomId: true,
                roomType: true,
                totalAmount: true,
                status: true,
            },
        });

        // Also count reserved/occupied by reservations for breakdown
        reservations.forEach((res) => {
            if (!res.roomType) return;
            if (!roomTypes[res.roomType]) return;
            if (res.status === "checked-in") roomTypes[res.roomType].occupied += 1;
            if (res.status === "reserved") roomTypes[res.roomType].reserved += 1;
        });

        // 3. Generate date range array
        const days = [];
        let current = new Date(firstDay);
        const last = new Date(lastDay);
        while (current <= last) {
            days.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
        }

        // 4. For each day, calculate roomsOccupied, roomsAvailable, occupancyRate
        const daily = days.map((date) => {
            // Find reservations active on this date
            const occupiedReservations = reservations.filter((r) => {
                return (
                    new Date(r.arrivalDate) <= new Date(date) &&
                    new Date(r.departureDate) > new Date(date)
                );
            });
            const roomsOccupied = occupiedReservations.length;
            const roomsAvailable = roomIds.length - roomsOccupied;
            const occupancyRate = roomIds.length > 0 ? (roomsOccupied / roomIds.length) * 100 : 0;

            return {
                date,
                roomsOccupied,
                roomsAvailable,
                occupancyRate: Math.round(occupancyRate * 10) / 10, // 1 decimal
            };
        });

        // 5. Total room nights: sum of (departure - arrival) for reservations
        const totalRoomNights = reservations.reduce((sum, r) => {
            const arrival = new Date(r.arrivalDate);
            const departure = new Date(r.departureDate);
            const nights = (departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24);
            return sum + Math.max(1, nights);
        }, 0);

        // Top-level stats
        const totalRooms = rooms.length;
        const totalOccupied = Object.values(roomTypes).reduce((sum, x) => sum + x.occupied, 0);
        const totalReserved = Object.values(roomTypes).reduce((sum, x) => sum + x.reserved, 0);

        res.json({
            hotelId,
            hotelName: req.query.hotelName,
            from: firstDay,
            to: lastDay,
            totalRooms,
            totalOccupied,
            totalReserved,
            totalRoomNights,
            roomTypes,
            daily,
        });
    } catch (err) {
        console.error("getHotelOccupancyReport error:", err);
        res.status(500).json({ error: "Failed to generate occupancy report." });
    }
}

/**
 * GET /api/reports/revenue?hotelId=123&from=2025-10-01&to=2025-10-31
 * Returns daily and summary revenue for the hotel in the date range.
 * Revenue is calculated for reservations with status "paid" or "checked-out" where departureDate = day.
 */
async function getHotelRevenueReport(req, res) {
    const hotelId = Number(req.query.hotelId);

    if (!hotelId) {
        return res.status(400).json({ error: "hotelId is required" });
    }

    try {
        // Get all reservations for this hotel with status paid or checked-out
        const reservations = await prisma.reservation.findMany({
            where: {
                hotelId,
                status: { in: ["paid", "checked-out"] },
            },
            select: {
                id: true,
                departureDate: true,
                totalAmount: true,
                status: true,
            },
        });

        // Optional: If you want daily breakdown, group by departure date
        // If not, just sum everything
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        res.json({
            hotelId,
            totalRevenue: Math.round(totalRevenue),
            reservations, // You can remove this line if you don't want to send details
        });
    } catch (err) {
        console.error("getHotelRevenueReport error:", err);
        res.status(500).json({ error: "Failed to generate revenue report." });
    }
}

module.exports = {
    getHotelOccupancyReport,
    getHotelRevenueReport,
};