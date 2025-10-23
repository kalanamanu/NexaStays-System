const express = require("express");
const router = express.Router();
const { authenticateToken, authenticateClerkToken } = require("../middleware/authenticateToken");
const reservationController = require("../controllers/reservationController");

// Logging middleware
router.use((req, res, next) => {
    console.log("Reservations API - req.user:", req.user);
    next();
});

// Customer routes
router.post("/", authenticateToken, reservationController.createReservation);
router.post("/residential", authenticateToken, reservationController.createResidentialReservation);
router.get("/", authenticateToken, reservationController.getReservations);
router.get("/:id", authenticateToken, reservationController.getReservationById);
router.put("/:id", authenticateToken, reservationController.updateReservation);
router.delete("/:id", authenticateToken, reservationController.deleteReservation);
router.get("/:id/receipt", authenticateToken, reservationController.getReservationReceipt);
router.patch('/:id/mark-notified', authenticateToken, reservationController.markReservationNotified);

// Clerk routes
router.get("/all", authenticateClerkToken, reservationController.getAllReservations);
router.post("/clerk", authenticateClerkToken, reservationController.createClerkReservation);
router.patch("/checkin", authenticateClerkToken, reservationController.checkinReservation);
router.post("/checkout", authenticateClerkToken, reservationController.checkoutReservation);

module.exports = router;