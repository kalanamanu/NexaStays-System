const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const customerProfileRoutes = require('./routes/customerProfileRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
require('./cron/reservationTasks');
const blockBookingRoutes = require('./routes/blockBookingRoutes');
const roomRoutes = require('./routes/roomRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/customer-profile', customerProfileRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/block-bookings', blockBookingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = app;