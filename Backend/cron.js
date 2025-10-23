// cron.js
// This script handles:
// 1. Auto-cancelling unpaid reservations ("pending" or "pending_payment") at 7 PM on arrival day.
// 2. Marking no-show customers and creating billing records at 7 PM for previous-day reservations not checked in.
// 3. Logging a simple occupancy and revenue report for the previous night.

const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function autoCancelUnpaidReservations() {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const arrivalStart = new Date(todayStr + "T00:00:00Z");
    const arrivalEnd = new Date(todayStr + "T23:59:59Z");

    // Find all today's reservations with "pending" or "pending_payment" status
    const toCancel = await prisma.reservation.findMany({
        where: {
            status: { in: ["pending", "pending_payment"] },
            arrivalDate: {
                gte: arrivalStart,
                lte: arrivalEnd,
            },
        },
    });

    for (const res of toCancel) {
        await prisma.reservation.update({
            where: { id: res.id },
            data: {
                status: "cancelled",
                cancelledAt: new Date(),
                cancellationReason: "Unpaid reservation auto-cancelled at 7 PM on arrival day.",
                customerNotified: false,
            },
        });
        console.log(
            `Auto-cancelled reservation #${res.id} (customerId: ${res.customerId}) due to non-payment`
        );
    }
    console.log(
        `Auto-cancelled ${toCancel.length} unpaid reservations at 7 PM (${todayStr})`
    );
}

async function markNoShowsAndBill() {
    // Previous day range
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterStr = yesterday.toISOString().split("T")[0];
    const prevStart = new Date(yesterStr + "T00:00:00Z");
    const prevEnd = new Date(yesterStr + "T23:59:59Z");

    // Find reservations for yesterday with "reserved" status (not checked-in)
    const noShows = await prisma.reservation.findMany({
        where: {
            status: "reserved",
            arrivalDate: {
                gte: prevStart,
                lte: prevEnd,
            },
        },
    });

    for (const res of noShows) {
        // Mark as no_show
        await prisma.reservation.update({
            where: { id: res.id },
            data: { status: "no_show" },
        });
        // Create a billing record if not already exists
        const existing = await prisma.billingRecord.findUnique({
            where: { reservationId: res.id },
        });
        if (!existing) {
            await prisma.billingRecord.create({
                data: {
                    reservationId: res.id,
                    roomCharges: res.totalAmount,
                    restaurant: 0,
                    roomService: 0,
                    laundry: 0,
                    telephone: 0,
                    club: 0,
                    other: 0,
                    lateCheckout: 0,
                    total: res.totalAmount,
                },
            });
            console.log(
                `Created billing record for no-show reservation #${res.id}, amount $${res.totalAmount}`
            );
        }
        console.log(`Marked reservation #${res.id} as no-show`);
    }
    console.log(
        `Processed ${noShows.length} no-show reservations for ${yesterStr}`
    );
}

async function printOccupancyAndRevenueReport() {
    // Previous night range
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterStr = yesterday.toISOString().split("T")[0];
    const prevStart = new Date(yesterStr + "T00:00:00Z");
    const prevEnd = new Date(yesterStr + "T23:59:59Z");

    // Count checked-in and no-show reservations for yesterday
    const [checkedIn, noShows] = await Promise.all([
        prisma.reservation.findMany({
            where: {
                status: "checked-in",
                arrivalDate: {
                    gte: prevStart,
                    lte: prevEnd,
                },
            },
            select: { totalAmount: true },
        }),
        prisma.reservation.findMany({
            where: {
                status: "no_show",
                arrivalDate: {
                    gte: prevStart,
                    lte: prevEnd,
                },
            },
            select: { totalAmount: true },
        }),
    ]);
    const totalOccupancy = checkedIn.length + noShows.length;
    const totalRevenue =
        checkedIn.reduce((sum, r) => sum + (r.totalAmount || 0), 0) +
        noShows.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    console.log(
        `--- Daily Occupancy/Revenue Report for ${yesterStr} ---\n` +
        `Total Occupancy (checked-in + no-shows): ${totalOccupancy}\n` +
        `Total Revenue: $${totalRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
        })}\n`
    );
}

// Schedule all tasks for 7 PM server time
cron.schedule("0 19 * * *", async () => {
    console.log("==== 7 PM Scheduled Tasks Running ====");
    await autoCancelUnpaidReservations();
    await markNoShowsAndBill();
    await printOccupancyAndRevenueReport();
    console.log("==== 7 PM Scheduled Tasks Complete ====");
});

// Keep process alive if running standalone
if (require.main === module) {
    console.log("Reservation cron scheduler started.");
    // Prevent process exit
    setInterval(() => { }, 1000 * 60 * 60);
}