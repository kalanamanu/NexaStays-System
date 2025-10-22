"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Build a Prisma where object based on filters.
 */
function buildWhere({ q, city, country, onlyAvailable }) {
    const where = {};

    if (q) {
        const search = q.trim();
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { country: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    if (city) {
        where.city = { equals: city, mode: "insensitive" };
    }

    if (country) {
        where.country = { equals: country, mode: "insensitive" };
    }

    if (onlyAvailable) {
        // hotel has at least one room with status 'available'
        where.rooms = { some: { status: { equals: "available", mode: "insensitive" } } };
    }

    return where;
}

/**
 * Find hotels for listing cards.
 *
 * Returns minimal payload optimized for hotel cards:
 *  - id, name, slug, city, country, images (first image used as thumbnail)
 *  - description (short), starRating, ratingCount
 *  - startingPrice (from Hotel.startingPrice if set, otherwise minimum room.pricePerNight)
 *
 * Supports pagination and the same filters as findHotels.
 *
 * Returns { data: hotels[], meta: { total, page, pageSize, totalPages } }
 */
async function findHotelsForCards(params = {}) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 12));
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where = buildWhere(params);

    // total count
    const total = await prisma.hotel.count({ where });

    // fetch hotels with minimal fields and a single cheapest room (if startingPrice not stored)
    // We use a small include to grab the cheapest room price (roomsMin).
    const hotels = await prisma.hotel.findMany({
        where,
        orderBy: [{ starRating: "desc" }, { name: "asc" }],
        skip,
        take,
        select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            description: true,
            starRating: true,
            ratingCount: true,
            images: true,
            startingPrice: true,
            // grab the cheapest room price (if present) to compute an on-the-fly starting price fallback
            rooms: {
                select: { pricePerNight: true, status: true, type: true, number: true },
                orderBy: { pricePerNight: "asc" },
                take: 1,
            },
        },
    });

    // Map results to card-friendly shape
    const data = hotels.map((h) => {
        // derive thumbnail (first image or null)
        const thumbnail = Array.isArray(h.images) && h.images.length > 0 ? h.images[0] : null;

        // prefer explicit startingPrice if > 0, otherwise fallback to cheapest room price
        let computedStarting = (typeof h.startingPrice === "number" && h.startingPrice > 0)
            ? h.startingPrice
            : (h.rooms && h.rooms[0] && typeof h.rooms[0].pricePerNight === "number")
                ? h.rooms[0].pricePerNight
                : 0;

        // shortDescription: prefer description but truncate to ~160 chars (frontend can override)
        const shortDescription = h.description ? (h.description.length > 160 ? h.description.slice(0, 157) + "..." : h.description) : "";

        return {
            id: h.id,
            name: h.name,
            slug: h.slug,
            city: h.city,
            country: h.country,
            thumbnail,
            shortDescription,
            starRating: h.starRating ?? null,
            ratingCount: h.ratingCount ?? 0,
            startingPrice: computedStarting,
        };
    });

    return {
        data,
        meta: {
            total,
            page,
            pageSize: take,
            totalPages: Math.ceil(total / take),
        },
    };
}

/**
 * Find hotel by numeric id (includes rooms and reservations count).
 */
async function findHotelById(id) {
    if (!id) return null;
    const hotel = await prisma.hotel.findUnique({
        where: { id },
        include: {
            rooms: { orderBy: { number: "asc" } },
            reservations: { orderBy: { arrivalDate: "desc" }, take: 5 },
        },
    });
    return hotel;
}

/**
 * Find hotel by slug
 */
async function findHotelBySlug(slug) {
    if (!slug) return null;
    const hotel = await prisma.hotel.findUnique({
        where: { slug },
        include: {
            rooms: { orderBy: { number: "asc" } },
            reservations: { orderBy: { arrivalDate: "desc" }, take: 5 },
        },
    });
    return hotel;
}

module.exports = {
    findHotelsForCards,
    findHotelById,
    findHotelBySlug,
};