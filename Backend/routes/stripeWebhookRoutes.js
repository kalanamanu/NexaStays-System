const express = require("express");
const router = express.Router();
const stripeWebhookController = require("../controllers/stripeWebhookController");

/**
 * IMPORTANT:
 * - This route must be mounted BEFORE any express.json() / body-parser middleware
 *   that would consume the request body.
 * - It uses express.raw({ type: 'application/json' }) so stripe.webhooks.constructEvent
 *   receives the raw payload required for signature verification.
 */
router.post("/", express.raw({ type: "application/json" }), stripeWebhookController.handleStripeWebhook);

module.exports = router;