"use strict";

/**
 * backend/routes/hotels.js
 *
 * Routes for hotels endpoints:
 *  - GET /api/hotels                -> list hotels (card-optimized)
 *  - GET /api/hotels/slug/:slug     -> get hotel details by slug
 *  - GET /api/hotels/:id            -> get hotel details by numeric id
 *
 * Note: slug route is declared before the id route so slugs that
 * contain non-numeric characters won't be misrouted to the :id handler.
 * We do NOT use inline regex in the route path to avoid path-to-regexp issues.
 */

const express = require("express");
const router = express.Router();
const hotelsController = require("../controllers/hotelsController");

// List hotels (card-friendly payload, supports filters & pagination)
router.get("/", hotelsController.getHotels);

// Get hotel by slug (placed before the id route)
router.get("/slug/:slug", hotelsController.getHotelBySlug);

// Get hotel by numeric id (validate inside controller)
router.get("/:id", hotelsController.getHotelById);

module.exports = router;