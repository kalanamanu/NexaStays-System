const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerProfileRoutes = require("./routes/customer-profile");
const reservationRoutes = require("./routes/reservation");
require('./cron/reservationTasks');
const blockBookingRoutes = require("./routes/block-bookings");
const roomRoutes = require("./routes/room");
const analyticsRoutes = require("./routes/analytics");


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/customer-profile', customerProfileRoutes);
app.use("/api/reservations", reservationRoutes);
app.use('/api/block-bookings', blockBookingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});