require('dotenv').config();
const http = require('http');
const express = require('express');
const app = require('./app');
const stripeWebhookRoutes = require('./routes/stripeWebhookRoutes');

const PORT = process.env.PORT || 5000;
const serverApp = express();


serverApp.use('/webhooks/stripe', stripeWebhookRoutes);
serverApp.use(express.json());

serverApp.use('/', app);

const server = http.createServer(serverApp);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
    console.info('SIGINT received, shutting down server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
process.on('SIGTERM', () => {
    console.info('SIGTERM received, shutting down server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});