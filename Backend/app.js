"use strict";

const express = require("express");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const customerProfileRoutes = require("./routes/customerProfileRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
require("./cron/reservationTasks");
const blockBookingRoutes = require("./routes/blockBookingRoutes");
const roomRoutes = require("./routes/roomRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const hotelsRouter = require("./routes/hotels");
const clerkReportRoutes = require("./routes/clerkReport");

// Error handlers (404 + general)
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Basic middleware
app.use(express.json());
app.use(morgan("dev"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/customer-profile", customerProfileRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/block-bookings", blockBookingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/hotels", hotelsRouter);
app.use("/api/reports", clerkReportRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// 404 and error handlers (must come after routes)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;