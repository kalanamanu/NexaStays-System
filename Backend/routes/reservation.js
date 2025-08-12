const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const authenticateToken = require("../middleware/authenticateToken");

// POST: Create reservation (your existing code)
router.post("/", authenticateToken, async (req, res) => {
    const {
        roomType,
        arrivalDate,
        departureDate,
        guests,
        totalAmount,
        skipCreditCard
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

// ==================== GET: All Reservations for Customer ====================
router.get("/", authenticateToken, async (req, res) => {
    const customerId = req.user.customerProfileId;

    if (!customerId) {
        return res.status(400).json({ error: "Customer profile not found. Please log in again." });
    }

    try {
        const reservations = await prisma.reservation.findMany({
            where: { customerId },
            orderBy: { createdAt: "desc" }, // latest first
        });
        res.json({ reservations });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch reservations." });
    }
});

module.exports = router;