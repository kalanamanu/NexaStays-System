const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");

// GET /api/rooms - fetch all rooms with pricePerNight
router.get("/", roomController.getAllRooms);

// GET /api/rooms/available - fetch only available rooms
router.get("/available", roomController.getAvailableRooms);

module.exports = router;