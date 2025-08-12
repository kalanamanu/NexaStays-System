const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerProfileRoutes = require("./routes/customer-profile");
const reservationRoutes = require("./routes/reservation");

// Import and start the reservation cron job for auto-cancel/no-show/reporting
require('./cron/reservationTasks');

const app = express();

app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/customer-profile', customerProfileRoutes);
app.use("/api/reservations", reservationRoutes);

// Health check route (optional, for uptime monitoring)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});