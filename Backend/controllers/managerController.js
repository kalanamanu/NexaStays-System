const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET /api/manager/reports/occupancy?hotelId=123&from=2025-10-01&to=2025-10-31
 * Returns daily occupancy stats, projections, and room type breakdown for the selected hotel and date range.
 */
async function getManagerOccupancyReport(req, res) {
    const hotelId = Number(req.query.hotelId);
    let { from, to } = req.query;

    if (!hotelId) {
        return res.status(400).json({ error: "hotelId is required" });
    }

    // Default to current month if not provided
    const today = new Date();
    const firstDay =
        from || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay =
        to || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    try {
        // Get all rooms for this hotel, include type and status for breakdown
        const rooms = await prisma.room.findMany({
            where: { hotelId },
            select: { id: true, type: true, status: true },
        });
        const roomIds = rooms.map((r) => r.id);

        // Room type breakdown (for roomTypes table)
        const roomTypes = {};
        rooms.forEach((room) => {
            if (!roomTypes[room.type]) {
                roomTypes[room.type] = { total: 0, occupied: 0, reserved: 0 };
            }
            roomTypes[room.type].total += 1;
            if (room.status === "occupied") roomTypes[room.type].occupied += 1;
            if (room.status === "reserved") roomTypes[room.type].reserved += 1;
        });

        // Get all reservations for this hotel in the date range
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

        // Generate date range array
        const days = [];
        let current = new Date(firstDay);
        const last = new Date(lastDay);
        while (current <= last) {
            days.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
        }

        // For each day, calculate roomsOccupied, roomsAvailable, occupancyRate
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

            return {
                date,
                roomsOccupied,
                roomsAvailable,
                occupancyRate: Math.round(occupancyRate * 10) / 10, // 1 decimal
            };
        });

        res.json({
            hotelId,
            from: firstDay,
            to: lastDay,
            daily: report,
            roomTypes,
        });
    } catch (err) {
        console.error("getManagerOccupancyReport error:", err);
        res.status(500).json({ error: "Failed to generate occupancy report." });
    }
}

/**
 * GET /api/manager/reports/revenue?hotelId=123&from=2025-10-01&to=2025-10-31
 * Returns daily and summary revenue for the hotel in the date range.
 * Revenue is calculated for reservations with status "paid" or "checked-out".
 */
async function getManagerRevenueReport(req, res) {
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
        // Get all paid/checked-out reservations for this hotel
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

        // Generate date range array
        const days = [];
        let current = new Date(firstDay);
        const last = new Date(lastDay);
        while (current <= last) {
            days.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
        }

        // For each day, sum totalAmount of reservations with departureDate on that day
        const daily = days.map((date) => {
            const revenue = reservations
                .filter((r) => {
                    if (!r.departureDate) return false;
                    const depDate = new Date(r.departureDate).toISOString().slice(0, 10);
                    return depDate === date;
                })
                .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
            return {
                date,
                revenue: Math.round(revenue),
            };
        });

        // Summary stats
        const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        const avgDailyRevenue = daily.length > 0 ? totalRevenue / daily.length : 0;
        const maxRevenue = daily.length > 0 ? Math.max(...daily.map(d => d.revenue)) : 0;
        const minRevenue = daily.length > 0 ? Math.min(...daily.map(d => d.revenue)) : 0;

        res.json({
            hotelId,
            from: firstDay,
            to: lastDay,
            daily,
            totalRevenue: Math.round(totalRevenue),
            avgDailyRevenue: Math.round(avgDailyRevenue),
            maxRevenue,
            minRevenue,
        });
    } catch (err) {
        console.error("getManagerRevenueReport error:", err);
        res.status(500).json({ error: "Failed to generate revenue report." });
    }
}

/**
 * GET /api/manager/reservations?hotelId=123&from=2025-10-01&to=2025-10-31
 * Returns reservations for the hotel in the date range.
 */
async function getManagerReservationHistory(req, res) {
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
        const reservations = await prisma.reservation.findMany({
            where: {
                hotelId,
                arrivalDate: { lte: new Date(lastDay) },
                departureDate: { gte: new Date(firstDay) },
            },
            select: {
                id: true,
                guestName: true,
                guestEmail: true,
                guestPhone: true,
                roomNumber: true,
                roomType: true,
                arrivalDate: true,
                departureDate: true,
                totalAmount: true,
                status: true,
            },
            orderBy: { arrivalDate: 'asc' },
        });

        res.json({ reservations });
    } catch (err) {
        console.error("getManagerReservationHistory error:", err);
        res.status(500).json({ error: "Failed to fetch reservation history." });
    }
}


/**
 * GET /api/manager/reports/suites?hotelId=123&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns daily Residential Suite occupancy and revenue for the hotel.
 */
async function getManagerSuiteReport(req, res) {
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
        // Find all Residential Suite rooms for this hotel
        const suiteRooms = await prisma.room.findMany({
            where: { hotelId, type: "Residential Suite" },
            select: { id: true },
        });
        const suiteRoomIds = suiteRooms.map((r) => r.id);

        // Find all Residential Suite reservations in date range and paid/checked-out
        const reservations = await prisma.reservation.findMany({
            where: {
                hotelId,
                roomType: "Residential Suite",
                status: { in: ["paid", "checked-out"] },
                departureDate: { gte: new Date(firstDay), lte: new Date(lastDay) },
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

        // Generate date range array
        const days = [];
        let current = new Date(firstDay);
        const last = new Date(lastDay);
        while (current <= last) {
            days.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
        }

        // For each day, calculate suite occupancy and revenue
        const daily = days.map((date) => {
            // Find reservations active on this day
            const occupiedReservations = reservations.filter((r) => {
                return (
                    new Date(r.arrivalDate) <= new Date(date) &&
                    new Date(r.departureDate) > new Date(date)
                );
            });
            const suitesOccupied = occupiedReservations.length;
            const suitesAvailable = suiteRoomIds.length - suitesOccupied;
            const occupancyRate = suiteRoomIds.length > 0 ? (suitesOccupied / suiteRoomIds.length) * 100 : 0;

            // Calculate revenue for reservations whose departureDate is that day
            const revenue = reservations
                .filter((r) => {
                    const depDateStr = new Date(r.departureDate).toISOString().slice(0, 10);
                    return depDateStr === date;
                })
                .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

            return {
                date,
                suitesOccupied,
                suitesAvailable,
                occupancyRate: Math.round(occupancyRate * 10) / 10,
                revenue: Math.round(revenue),
            };
        });

        res.json({
            hotelId,
            from: firstDay,
            to: lastDay,
            daily,
        });
    } catch (err) {
        console.error("getManagerSuiteReport error:", err);
        res.status(500).json({ error: "Failed to generate suite report." });
    }
}


/**
 * GET /api/manager/travel-companies/block-bookings?hotelId=123&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns block bookings for travel companies for the hotel/date range.
 */
async function getTravelCompanyBlockBookings(req, res) {
    const hotelId = Number(req.query.hotelId);
    let { from, to } = req.query;

    if (!hotelId) return res.status(400).json({ error: "hotelId is required" });

    // Default: this month
    const today = new Date();
    const firstDay = from || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = to || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    try {
        const blockBookings = await prisma.blockBooking.findMany({
            where: {
                hotelId,
                arrivalDate: { lte: new Date(lastDay) },
                departureDate: { gte: new Date(firstDay) },
            },
            include: {
                travelCompany: {
                    select: { companyName: true, companyRegNo: true, phone: true }
                },
                roomTypes: true,
                hotel: { select: { name: true } }
            },
            orderBy: { arrivalDate: 'asc' },
        });

        res.json({ blockBookings });
    } catch (err) {
        console.error("getTravelCompanyBlockBookings error:", err);
        res.status(500).json({ error: "Failed to fetch block bookings." });
    }
}

/**
 * POST /api/manager/travel-companies/block-bookings/:id/approve
 * Approves a block booking by setting status to "reserved"
 */
async function approveTravelCompanyBlockBooking(req, res) {
    const blockBookingId = Number(req.params.id);
    if (!blockBookingId) return res.status(400).json({ error: "blockBookingId is required" });

    try {
        const updated = await prisma.blockBooking.update({
            where: { id: blockBookingId },
            data: { status: "reserved" }
        });
        res.json({ success: true, blockBooking: updated });
    } catch (err) {
        console.error("approveTravelCompanyBlockBooking error:", err);
        res.status(500).json({ error: "Failed to approve block booking." });
    }
}

/**
 * POST /api/manager/travel-companies/block-bookings/:id/reject
 * Rejects a block booking by setting status to "rejected"
 */
async function rejectTravelCompanyBlockBooking(req, res) {
    const blockBookingId = Number(req.params.id);
    if (!blockBookingId) return res.status(400).json({ error: "blockBookingId is required" });

    try {
        const updated = await prisma.blockBooking.update({
            where: { id: blockBookingId },
            data: { status: "rejected" }
        });
        res.json({ success: true, blockBooking: updated });
    } catch (err) {
        console.error("rejectTravelCompanyBlockBooking error:", err);
        res.status(500).json({ error: "Failed to reject block booking." });
    }
}


/**
 * GET /api/manager/get-all-reservations
 * Returns all reservations for hotels managed by the manager.
 * If you want to filter by manager, use req.user.id (from JWT) and the hotel.travelCompanyId.
 */
async function getAllReservationsManager(req, res) {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                customer: true,
                room: true,
                hotel: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ reservations });
    } catch (err) {
        console.error("getAllReservationsManager error:", err);
        res.status(500).json({ error: "Failed to fetch all reservations for manager." });
    }
}


/**
 * GET /api/manager/reports/travel-company-revenue
 * Query params:
 *   - hotelId (optional): filter by hotel
 *   - from, to (optional): filter by date range (arrivalDate)
 */
async function getTravelCompanyBookingsRevenue(req, res) {
    const { hotelId, from, to } = req.query;

    // Build query filters
    const filters = {
        status: "reserved",
    };
    if (hotelId) filters.hotelId = Number(hotelId);
    if (from) filters.arrivalDate = { ...(filters.arrivalDate || {}), gte: new Date(from) };
    if (to) filters.arrivalDate = { ...(filters.arrivalDate || {}), lte: new Date(to) };

    try {
        // Get all reserved block bookings with travel company and hotel info
        const bookings = await prisma.blockBooking.findMany({
            where: filters,
            include: {
                travelCompany: { select: { id: true, companyName: true } },
                hotel: { select: { id: true, name: true } },
            },
        });

        // Total revenue
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Revenue per travel company
        const companyMap = new Map();
        bookings.forEach(b => {
            if (!b.travelCompany) return;
            const key = b.travelCompany.id;
            if (!companyMap.has(key)) {
                companyMap.set(key, { companyId: key, companyName: b.travelCompany.companyName, revenue: 0 });
            }
            companyMap.get(key).revenue += b.totalAmount || 0;
        });
        const perCompany = Array.from(companyMap.values());

        // Revenue per hotel (optional)
        const hotelMap = new Map();
        bookings.forEach(b => {
            if (!b.hotel) return;
            const key = b.hotel.id;
            if (!hotelMap.has(key)) {
                hotelMap.set(key, { hotelId: key, hotelName: b.hotel.name, revenue: 0 });
            }
            hotelMap.get(key).revenue += b.totalAmount || 0;
        });
        const perHotel = Array.from(hotelMap.values());

        res.json({
            totalRevenue,
            perCompany,
            perHotel,
        });
    } catch (err) {
        console.error("getTravelCompanyBookingsRevenue error:", err);
        res.status(500).json({ error: "Failed to fetch travel company bookings revenue." });
    }
}


module.exports = {
    getManagerOccupancyReport,
    getManagerRevenueReport,
    getManagerReservationHistory,
    getManagerSuiteReport,
    getTravelCompanyBlockBookings,
    approveTravelCompanyBlockBooking,
    rejectTravelCompanyBlockBooking,
    getAllReservationsManager,
    getTravelCompanyBookingsRevenue
};