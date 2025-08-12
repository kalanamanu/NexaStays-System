const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Run every day at 7 PM server time
cron.schedule("0 19 * * *", async () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Cancel all pending reservations for today (no payment)
    await prisma.reservation.updateMany({
        where: {
            arrivalDate: {
                gte: new Date(todayStr),
                lt: new Date(todayStr + "T23:59:59"),
            },
            status: "pending",
        },
        data: { status: "cancelled" },
    });

    // Mark no-shows and create billing records for reservations with arrivalDate today, not checked in, and require payment
    const noShows = await prisma.reservation.findMany({
        where: {
            arrivalDate: {
                gte: new Date(todayStr),
                lt: new Date(todayStr + "T23:59:59"),
            },
            status: "pending_payment",
        },
    });

    for (const reservation of noShows) {
        // Mark as no-show
        await prisma.reservation.update({
            where: { id: reservation.id },
            data: { status: "no_show" },
        });
        // Create a billing record, implement your Billing model as needed.
        // await prisma.billing.create({ ... });
    }

    // Generate occupancy/revenue report for previous night
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterStr = yesterday.toISOString().slice(0, 10);
    const paidReservations = await prisma.reservation.findMany({
        where: {
            arrivalDate: {
                gte: new Date(yesterStr),
                lt: new Date(yesterStr + "T23:59:59"),
            },
            status: { in: ["paid", "no_show"] },
        },
    });
    const totalOccupancy = paidReservations.reduce((sum, r) => sum + r.guests, 0);
    const totalRevenue = paidReservations.reduce((sum, r) => sum + r.totalAmount, 0);

    // Save or log the report as needed
    console.log(
        `[Report for ${yesterStr}]: Occupancy=${totalOccupancy}, Revenue=$${totalRevenue}`
    );
});

module.exports = {}; // So you can require this file in app.js