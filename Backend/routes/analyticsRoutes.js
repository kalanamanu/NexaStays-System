const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const { isAdmin } = require('../middleware/adminAuth');

// Protect analytics endpoints (optional) — remove router.use(isAdmin) if not desired
router.use(isAdmin);

// Endpoints
router.get('/occupancy', analyticsController.occupancy);
router.get('/revenue', analyticsController.revenue);
router.get('/guests', analyticsController.guests);

module.exports = router;