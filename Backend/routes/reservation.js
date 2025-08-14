const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { authenticateToken, authenticateClerkToken } = require("../middleware/authenticateToken");

// Create hotel room reservation
router.post("/", authenticateToken, async (req, res) => {
    const {
        roomType,
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        skipCreditCard,
        fullName,
        email,
        phone
    } = req.body;
    const customerId = req.user.customerProfileId;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        let paymentIntent = null;
        let status = "pending";
        let paymentIntentId = null;
        let clientSecret = null;

        if (!skipCreditCard) {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount * 100),
                currency: "usd",
                metadata: { integration_check: "accept_a_payment" },
            });
            status = "pending_payment";
            paymentIntentId = paymentIntent.id;
            clientSecret = paymentIntent.client_secret;
        }

        const reservation = await prisma.reservation.create({
            data: {
                customerId,
                roomType,
                arrivalDate: new Date(arrivalDate),
                departureDate: new Date(departureDate),
                guests,
                totalAmount,
                status,
                paymentIntentId,
            },
        });

        res.json({ reservation, clientSecret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Create residential suite reservation (weekly/monthly)
router.post("/residential", authenticateToken, async (req, res) => {
    const {
        roomType, // should be "residential"
        durationType, // "week" or "month"
        durationCount,
        arrivalDate,
        departureDate, // can be calculated on frontend and sent in request
        guests,
        totalAmount,
        skipCreditCard,
        fullName,
        email,
        phone
    } = req.body;
    const customerId = req.user.customerProfileId;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        let paymentIntent = null;
        let status = "pending";
        let paymentIntentId = null;
        let clientSecret = null;

        if (!skipCreditCard) {
            paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount * 100),
                currency: "usd",
                metadata: { integration_check: "accept_a_payment" },
            });
            status = "pending_payment";
            paymentIntentId = paymentIntent.id;
            clientSecret = paymentIntent.client_secret;
        }

        const reservation = await prisma.reservation.create({
            data: {
                customerId,
                roomType: "residential",
                arrivalDate: new Date(arrivalDate),
                departureDate: departureDate ? new Date(departureDate) : null,
                guests,
                totalAmount,
                status,
                paymentIntentId,
                durationType,
                durationCount,
            },
        });

        res.json({ reservation, clientSecret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: All Reservations for Customer
router.get("/", authenticateToken, async (req, res) => {
    const customerId = req.user.customerProfileId;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        const reservations = await prisma.reservation.findMany({
            where: { customerId },
            orderBy: { createdAt: "desc" },
        });
        res.json({ reservations });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch reservations." });
    }
});

// PUT: Edit Reservation by ID
router.put("/:id", authenticateToken, async (req, res) => {
    const reservationId = Number(req.params.id);
    const customerId = req.user.customerProfileId;
    const {
        roomType,
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        durationType,
        durationCount,
    } = req.body;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        // Ensure the reservation belongs to the logged-in customer
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
        });

        if (!reservation || reservation.customerId !== customerId) {
            return res.status(403).json({ error: "Unauthorized or reservation not found." });
        }

        const updatedReservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                roomType,
                arrivalDate: new Date(arrivalDate),
                departureDate: departureDate ? new Date(departureDate) : null,
                guests,
                totalAmount,
                durationType,
                durationCount,
            }
        });

        res.json({ reservation: updatedReservation });
    } catch (err) {
        console.error("Reservation update error:", err);
        res.status(500).json({ error: "Failed to update reservation.", details: err.message });
    }
});

// DELETE: Delete Reservation by ID
router.delete("/:id", authenticateToken, async (req, res) => {
    const reservationId = Number(req.params.id);
    const customerId = req.user.customerProfileId;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        // Ensure the reservation exists and belongs to the logged-in customer
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
        });

        if (!reservation || reservation.customerId !== customerId) {
            return res.status(403).json({ error: "Unauthorized or reservation not found." });
        }

        await prisma.reservation.delete({
            where: { id: reservationId },
        });

        res.json({ message: "Reservation deleted successfully." });
    } catch (err) {
        console.error("Reservation delete error:", err);
        res.status(500).json({ error: "Failed to delete reservation.", details: err.message });
    }
});

// GET: All Reservations (for clerk)

router.get("/all", authenticateClerkToken, async (req, res) => {
    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                customer: true, // This gives you firstName, lastName, phone, etc.
                room: true      // Optional, for room info
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({ reservations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch all reservations." });
    }
});


// Clerk creates a reservation for a guest (walk-in)
// POST: Clerk creates (walk-in or phone) reservation for a guest
router.post("/clerk", authenticateClerkToken, async (req, res) => {
    const {
        guestName,
        guestPhone,
        guestEmail,
        roomType,
        roomNumber,
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        status
    } = req.body;

    if (
        !guestName ||
        !guestPhone ||
        !roomType ||
        !arrivalDate ||
        !departureDate ||
        !guests ||
        totalAmount == null ||
        !status ||
        (status === "checked-in" && !roomNumber)
    ) {
        return res.status(400).json({ error: "All required fields must be filled." });
    }

    try {
        const reservation = await prisma.reservation.create({
            data: {
                guestName,
                guestPhone,
                guestEmail,
                roomType,
                roomNumber: roomNumber || null,
                arrivalDate: new Date(arrivalDate),
                departureDate: new Date(departureDate),
                guests,
                totalAmount,
                status
            },
        });

        // Update room status if walk-in/checked-in
        if (status === "checked-in" && roomNumber) {
            await prisma.room.update({
                where: { number: roomNumber },
                data: { status: "occupied" }
            });
        }

        res.json({ reservation });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// PATCH /api/reservations/checkin
router.patch("/checkin", authenticateClerkToken, async (req, res) => {
    const { reservationId, roomNumber } = req.body;
    if (!reservationId || !roomNumber) {
        return res.status(400).json({ error: "Missing fields." });
    }
    try {
        const reservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: "checked-in", roomNumber }
        });
        await prisma.room.update({
            where: { number: roomNumber },
            data: { status: "occupied" }
        });
        res.json({ reservation });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Check-out API
router.post("/checkout", authenticateClerkToken, async (req, res) => {
    const { reservationId, paymentMethod, bill } = req.body;
    if (!reservationId || !bill) {
        return res.status(400).json({ error: "Missing required fields." });
    }
    try {
        // Update reservation status
        const reservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: "checked-out", updatedAt: new Date().toISOString() }
        });
        // Make room available
        if (reservation.roomNumber) {
            await prisma.room.update({
                where: { number: reservation.roomNumber },
                data: { status: "available" }
            });
        }
        // Create billing record
        const billingRecord = await prisma.billingRecord.create({
            data: {
                reservationId: reservation.id,
                roomCharges: bill.roomCharges,
                restaurant: bill.restaurant,
                roomService: bill.roomService,
                laundry: bill.laundry,
                telephone: bill.telephone,
                club: bill.club,
                other: bill.other,
                lateCheckout: bill.lateCheckout,
                total: bill.total,
            },
        });
        res.json({ reservation, billingRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;