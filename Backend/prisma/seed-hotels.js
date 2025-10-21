"use strict";

/**
 * prisma/seed-hotels.js
 *
 * Seed script to create sample hotels and rooms (idempotent).
 *
 * Usage:
 *  - Ensure prisma migrations have been applied:
 *      npx prisma migrate dev --name add-hotel-model
 *  - Run this script:
 *      node prisma/seed-hotels.js
 *
 * Notes:
 *  - This script upserts hotels by `slug`.
 *  - Rooms are upserted per-hotel using the composite unique (hotelId + number)
 *    using the compound selector `hotelId_number`.
 *  - Adjust the HOTELS array below to match your desired seeded data.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const HOTELS = [
    {
        name: "Oceanview Resort",
        slug: "oceanview-resort",
        description: "A beachfront resort with stunning sea views and premium facilities.",
        address: "1 Seaside Ave",
        city: "Maldives",
        country: "Maldives",
        starRating: 4.8,
        amenities: ["wifi", "pool", "spa", "restaurant", "gym"],
        images: ["/images/hotel-1.jpg"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 120 },
            { number: "102", type: "Standard", status: "available", pricePerNight: 120 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 180 },
            { number: "202", type: "Deluxe", status: "occupied", pricePerNight: 180 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 280 },
            { number: "401", type: "Residential Suite", status: "available", pricePerNight: 450 },
        ],
    },
    {
        name: "Skyline Grand",
        slug: "skyline-grand",
        description: "Central city hotel with rooftop bar and business facilities.",
        address: "200 Midtown Blvd",
        city: "New York",
        country: "USA",
        starRating: 4.6,
        amenities: ["wifi", "gym", "parking", "bar"],
        images: ["/images/hotel-2.jpg"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 140 },
            { number: "102", type: "Standard", status: "available", pricePerNight: 140 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 220 },
            { number: "202", type: "Deluxe", status: "available", pricePerNight: 220 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 320 },
            { number: "302", type: "Suite", status: "available", pricePerNight: 320 },
        ],
    },
    {
        name: "Serene Bay Hotel",
        slug: "serene-bay-hotel",
        description: "Clifftop views and boutique service in a picturesque island setting.",
        address: "12 Ocean Cliff Road",
        city: "Santorini",
        country: "Greece",
        starRating: 4.9,
        amenities: ["wifi", "pool", "spa", "breakfast"],
        images: ["/images/hotel-3.jpg"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 150 },
            { number: "102", type: "Standard", status: "maintenance", pricePerNight: 150 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 260 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 380 },
        ],
    },
    {
        name: "Cityscape Suites",
        slug: "cityscape-suites",
        description: "Comfortable stays with easy access to major attractions.",
        address: "45 Queen St",
        city: "London",
        country: "UK",
        starRating: 4.5,
        amenities: ["wifi", "concierge", "parking"],
        images: ["/images/hotel-4.jpg"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 130 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 200 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 300 },
        ],
    },
];

function defaultPriceFor(type) {
    const t = (type || "").toLowerCase();
    if (t.includes("residential")) return 450;
    if (t.includes("suite")) return 280;
    if (t.includes("deluxe")) return 180;
    return 120;
}

async function upsertHotelAndRooms(h) {
    // 1) Upsert hotel by slug (create or update basic fields)
    const hotel = await prisma.hotel.upsert({
        where: { slug: h.slug },
        update: {
            name: h.name,
            description: h.description,
            address: h.address,
            city: h.city,
            country: h.country,
            starRating: h.starRating,
            amenities: h.amenities,
            images: h.images,
            updatedAt: new Date(),
        },
        create: {
            name: h.name,
            slug: h.slug,
            description: h.description,
            address: h.address,
            city: h.city,
            country: h.country,
            starRating: h.starRating,
            amenities: h.amenities,
            images: h.images,
        },
    });

    const hotelId = hotel.id;
    console.log(`Hotel upserted: ${hotel.name} (id=${hotelId})`);

    // 2) Upsert rooms for this hotel using the composite unique hotelId + number
    for (const r of (h.rooms || [])) {
        const price = r.pricePerNight ?? defaultPriceFor(r.type);
        try {
            await prisma.room.upsert({
                where: {
                    // Prisma generates a compound field name based on the @@unique fields
                    // (hotelId + number) -> hotelId_number
                    hotelId_number: { hotelId, number: r.number },
                },
                update: {
                    type: r.type,
                    status: r.status,
                    pricePerNight: price,
                },
                create: {
                    number: r.number,
                    type: r.type,
                    status: r.status,
                    pricePerNight: price,
                    hotel: { connect: { id: hotelId } },
                },
            });
            console.log(`  Room upserted: ${r.number} (${r.type}) -> hotel ${hotel.slug}`);
        } catch (err) {
            console.error(`  Failed to upsert room ${r.number} for hotel ${hotel.slug}:`, err.message || err);
        }
    }
}

async function main() {
    console.log("Starting hotels seed...");

    for (const h of HOTELS) {
        await upsertHotelAndRooms(h);
    }

    console.log("Hotels & rooms seeding completed.");
}

main()
    .catch((err) => {
        console.error("Seed failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });