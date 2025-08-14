const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { parseISO, eachDayOfInterval, format, startOfMonth, endOfMonth } = require("date-fns");

// Occupancy by day and type
router.get("/occupancy", async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });

    const start = parseISO(from);
    const end = parseISO(to);

    // Load all rooms and their types/statuses
    const rooms = await prisma.room.findMany();
    const roomTypes = Array.from(new Set(rooms.map(r => r.type)));
    // Calculate total rooms per type
    const roomsByType = {};
    roomTypes.forEach(type => {
        roomsByType[type] = rooms.filter(r => r.type === type).length;
    });

    const days = eachDayOfInterval({ start, end });
    const data = [];

    for (const day of days) {
        const byType = {};
        for (const type of roomTypes) {
            byType[type] = rooms.filter(r => r.type === type && r.status === "occupied").length;
        }

        // For chart: calculate occupancy percentage using rooms with status 'occupied'
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => r.status === "occupied").length;

        data.push({
            date: format(day, "yyyy-MM-dd"),
            occupancy: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            rooms: totalRooms,
            byType,
            roomsByType,
        });
    }

    res.json(data);
});

// Revenue by year-month (room, restaurant, other) from BillingRecord
router.get("/revenue", async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });

    const start = parseISO(from);
    const end = parseISO(to);

    // All billings in range
    const billings = await prisma.billingRecord.findMany({
        where: {
            createdAt: { gte: start, lte: end },
        },
    });

    // Group by year and month
    const months = {};
    for (const billing of billings) {
        // Format: "2025-08" (YYYY-MM)
        const month = format(billing.createdAt, "yyyy-MM");
        if (!months[month]) {
            months[month] = { room: 0, restaurant: 0, other: 0 };
        }
        months[month].room += billing.roomCharges || 0;
        months[month].restaurant += billing.restaurant || 0;
        months[month].other +=
            (billing.roomService || 0) +
            (billing.laundry || 0) +
            (billing.telephone || 0) +
            (billing.club || 0) +
            (billing.other || 0) +
            (billing.lateCheckout || 0);
    }

    // Prepare for chart: month label should be "Aug 2025"
    const data = Object.entries(months).map(([month, values]) => ({
        // Format label for chart
        month: format(parseISO(month + "-01"), "MMM yyyy"),
        ...values,
    }));

    res.json(data);
});

// Guest count (unique guests)
router.get("/guests", async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to are required" });

    const start = parseISO(from);
    const end = parseISO(to);

    const reservations = await prisma.reservation.findMany({
        where: { arrivalDate: { gte: start, lte: end } },
        select: { guestPhone: true, guestEmail: true, customerId: true },
    });

    const uniqueGuests = new Set();
    for (const r of reservations) {
        if (r.customerId) uniqueGuests.add(`customer:${r.customerId}`);
        else if (r.guestPhone) uniqueGuests.add(`phone:${r.guestPhone}`);
        else if (r.guestEmail) uniqueGuests.add(`email:${r.guestEmail}`);
    }

    res.json({ totalGuests: uniqueGuests.size });
});

module.exports = router;