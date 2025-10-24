const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authenticateToken");
const {
    getManagerOccupancyReport,
    getManagerRevenueReport,
    getManagerReservationHistory,
    getManagerSuiteReport,
    getTravelCompanyBlockBookings,
    approveTravelCompanyBlockBooking,
    rejectTravelCompanyBlockBooking,
} = require("../controllers/managerController");

router.get("/reports/occupancy", authenticateToken, getManagerOccupancyReport);
router.get("/reports/revenue", authenticateToken, getManagerRevenueReport);
router.get("/reservations", authenticateToken, getManagerReservationHistory);
router.get("/reports/suites", authenticateToken, getManagerSuiteReport);
router.get("/travel-companies/block-bookings", authenticateToken, getTravelCompanyBlockBookings);
router.post("/travel-companies/block-bookings/:id/approve", authenticateToken, approveTravelCompanyBlockBooking);
router.post("/travel-companies/block-bookings/:id/reject", authenticateToken, rejectTravelCompanyBlockBooking);

module.exports = router;