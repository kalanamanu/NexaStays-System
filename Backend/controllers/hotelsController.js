"use strict";

const hotelService = require("../services/hotelService");

/**
 * GET /api/hotels
 * Returns hotels optimized for hotel "card" listings.
 */
async function getHotels(req, res, next) {
    try {
        const params = {
            q: req.query.q,
            city: req.query.city,
            country: req.query.country,
            onlyAvailable: req.query.onlyAvailable === "1" || req.query.onlyAvailable === "true",
            page: Number(req.query.page) || 1,
            pageSize: Number(req.query.pageSize) || 12,
            sort: req.query.sort || undefined,
        };

        const result = await hotelService.findHotelsForCards(params);
        res.json({ success: true, data: result.data, meta: result.meta });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/hotels/:id
 * Full hotel details (used by hotel details page).
 * Validate the id parameter and return 400 if invalid.
 */
async function getHotelById(req, res, next) {
    try {
        const idRaw = req.params.id;
        const id = Number(idRaw);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, error: "Invalid hotel id" });
        }

        const hotel = await hotelService.findHotelById(id);
        if (!hotel) return res.status(404).json({ success: false, error: "Hotel not found" });
        res.json({ success: true, data: hotel });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/hotels/slug/:slug
 * Full hotel details by slug.
 */
async function getHotelBySlug(req, res, next) {
    try {
        const slug = req.params.slug;
        if (!slug || typeof slug !== "string") {
            return res.status(400).json({ success: false, error: "Invalid slug" });
        }
        const hotel = await hotelService.findHotelBySlug(slug);
        if (!hotel) return res.status(404).json({ success: false, error: "Hotel not found" });
        res.json({ success: true, data: hotel });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getHotels,
    getHotelById,
    getHotelBySlug,
};