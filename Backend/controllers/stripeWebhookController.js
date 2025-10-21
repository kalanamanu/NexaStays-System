const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * handleStripeWebhook
 * - Expects raw body (Buffer) to be available in req.body (via express.raw)
 * - Verifies signature using STRIPE_WEBHOOK_SECRET
 * - Handles payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
 * - Performs safe updates (skips if already applied)
 */
async function handleStripeWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error("Stripe webhook secret is not configured (STRIPE_WEBHOOK_SECRET)");
        return res.status(500).send("Webhook not configured");
    }

    let event;
    try {
        // When express.raw is used, req.body is a Buffer (or string) — pass it directly
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error("Stripe webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        const type = event.type;
        console.log(`Stripe webhook received: ${type} (id: ${event.id})`);

        switch (type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const paymentIntentId = paymentIntent.id;
                console.log("PaymentIntent succeeded:", paymentIntentId);

                // Check if any reservation is already marked paid
                const alreadyPaid = await prisma.reservation.findFirst({
                    where: { paymentIntentId, status: "paid" },
                });
                if (alreadyPaid) {
                    console.log("Reservation(s) already marked paid for paymentIntent:", paymentIntentId);
                    break;
                }

                // Mark reservations linked to this PaymentIntent as paid
                const update = await prisma.reservation.updateMany({
                    where: { paymentIntentId },
                    data: { status: "paid", updatedAt: new Date() },
                });
                console.log(`Updated ${update.count} reservation(s) to 'paid' for PaymentIntent: ${paymentIntentId}`);
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                const paymentIntentId = paymentIntent.id;
                console.log("PaymentIntent failed:", paymentIntentId);

                await prisma.reservation.updateMany({
                    where: { paymentIntentId },
                    data: { status: "payment_failed", updatedAt: new Date() },
                });
                console.log(`Updated reservations to 'payment_failed' for PaymentIntent: ${paymentIntentId}`);
                break;
            }

            case "charge.refunded": {
                const charge = event.data.object;
                const paymentIntentId = charge.payment_intent;
                console.log("Charge refunded for payment_intent:", paymentIntentId);

                if (paymentIntentId) {
                    // Optionally mark reservation or create refund record - here we mark status and log
                    await prisma.reservation.updateMany({
                        where: { paymentIntentId },
                        data: { status: "refunded", updatedAt: new Date() },
                    });
                    console.log(`Marked reservations as 'refunded' for PaymentIntent: ${paymentIntentId}`);
                } else {
                    console.log("Refund charge did not contain payment_intent:", charge.id);
                }
                break;
            }

            default:
                console.log(`Unhandled Stripe event type: ${type}`);
        }

        // Acknowledge receipt of the event
        return res.status(200).json({ received: true });
    } catch (err) {
        console.error("Error processing stripe webhook event:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    handleStripeWebhook,
};