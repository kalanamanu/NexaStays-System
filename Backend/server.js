require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const app = require('./app');
const stripeWebhookRoutes = require('./routes/stripeWebhookRoutes');

// === ADD THIS LINE to always run your scheduled cron jobs ===
require('./cron'); // <-- This line ensures your scheduled jobs run with the server

const PORT = process.env.PORT || 5000;
const serverApp = express();

serverApp.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

/**
 * Stripe webhooks must be parsed as raw body, BEFORE json/urlencoded middleware.
 * Place this route FIRST.
 */
serverApp.use('/webhooks/stripe', stripeWebhookRoutes);

/**
 * Main app: parse JSON, mount routes.
 * Place after webhook to avoid bodyParser interfering with Stripe signature.
 */
serverApp.use(express.json());
serverApp.use('/', app);

const server = http.createServer(serverApp);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/**
 * Graceful shutdown for SIGINT/SIGTERM.
 */
const shutdown = (signal) => {
    console.info(`${signal} received, shutting down server...`);
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));