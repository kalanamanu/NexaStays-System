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
app.use('/api', authRoutes);
app.use('/api', customerProfileRoutes);
app.use("/api/reservations", reservationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});