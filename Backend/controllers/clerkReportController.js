const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET /api/reports/occupancy?hotelId=123&from=2025-10-01&to=2025-10-31
 * Returns daily occupancy and revenue for the hotel in the date range.
 * Revenue is calculated only from reservations with status "paid" or "checked-out".
 */
async function getHotelOccupancyRevenueReport(req, res) {
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
            select: { id: true },
        });
        const roomIds = rooms.map((r) => r.id);

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
                totalAmount: true,
                status: true,
            },
        });

        // 3. Generate date range array
        const days = [];
        let current = new Date(firstDay);
        const last = new Date(lastDay);
        while (current <= last) {
            days.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
        }

        // 4. For each day, calculate roomsOccupied, roomsAvailable, occupancyRate, revenue
        const report = days.map((date) => {
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

            // Revenue: only count reservations with status "paid" or "checked-out"
            let revenue = 0;
            occupiedReservations.forEach((r) => {
                if (r.status === "paid" || r.status === "checked-out") {
                    const nights =
                        (new Date(r.departureDate).getTime() -
                            new Date(r.arrivalDate).getTime()) /
                        (1000 * 60 * 60 * 24);
                    if (nights > 0) {
                        revenue += r.totalAmount / nights;
                    }
                }
            });

            return {
                date,
                roomsOccupied,
                roomsAvailable,
                occupancyRate: Math.round(occupancyRate * 10) / 10, // 1 decimal
                revenue: Math.round(revenue),
            };
        });

        res.json({ report, hotelId, from: firstDay, to: lastDay });
    } catch (err) {
        console.error("getHotelOccupancyRevenueReport error:", err);
        res.status(500).json({ error: "Failed to generate report." });
    }
}

module.exports = {
    getHotelOccupancyRevenueReport,
};