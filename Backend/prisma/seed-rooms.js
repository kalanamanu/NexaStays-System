"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Seed script: creates (or reuses) a "main" hotel and upserts rooms for that hotel.
 *
 * Notes:
 * - After you added Hotel and the @@unique([hotelId, number]) constraint to Room,
 *   room numbers are unique per-hotel. This script upserts by the composite key.
 * - Run with: node prisma/seed-rooms.js
 * - Or add to package.json prisma.seed and run via: npx prisma db seed (if configured)
 */

async function main() {
    // 1) Ensure a hotel exists to attach rooms to
    const hotelSlug = "nexa-stays-main";
    const hotel = await prisma.hotel.upsert({
        where: { slug: hotelSlug },
        update: {},
        create: {
            name: "Nexa Stays - Main Hotel",
            slug: hotelSlug,
            description: "Primary seeded hotel for development and testing.",
            address: "123 Harbor Drive, Suite 400",
            city: "Cityname",
            country: "Country",
            starRating: 4.6,
            amenities: ["wifi", "pool", "gym"],
            images: ["/images/hotel-1.jpg"],
        },
    });

    const hotelId = hotel.id;
    console.log(`Using hotel id=${hotelId} (slug=${hotelSlug})`);

    // 2) Rooms to create / upsert (same as you provided; all will be attached to the hotel above)
    const rooms = [
        // Existing rooms
        { number: "101", type: "Standard", status: "available" },
        { number: "102", type: "Standard", status: "available" },
        { number: "103", type: "Standard", status: "available" },
        { number: "104", type: "Standard", status: "maintenance" },
        { number: "201", type: "Deluxe", status: "available" },
        { number: "202", type: "Deluxe", status: "available" },
        { number: "203", type: "Deluxe", status: "occupied" },
        { number: "301", type: "Suite", status: "available" },
        { number: "302", type: "Suite", status: "available" },
        { number: "401", type: "Residential Suite", status: "available" },
        { number: "402", type: "Residential Suite", status: "maintenance" },

        // 50 New rooms (all available)
        // Standard Rooms (13 new)
        { number: "105", type: "Standard", status: "available" },
        { number: "106", type: "Standard", status: "available" },
        { number: "107", type: "Standard", status: "available" },
        { number: "108", type: "Standard", status: "available" },
        { number: "109", type: "Standard", status: "available" },
        { number: "110", type: "Standard", status: "available" },
        { number: "111", type: "Standard", status: "available" },
        { number: "112", type: "Standard", status: "available" },
        { number: "113", type: "Standard", status: "available" },
        { number: "114", type: "Standard", status: "available" },
        { number: "115", type: "Standard", status: "available" },
        { number: "116", type: "Standard", status: "available" },
        { number: "117", type: "Standard", status: "available" },

        // Deluxe Rooms (13 new)
        { number: "204", type: "Deluxe", status: "available" },
        { number: "205", type: "Deluxe", status: "available" },
        { number: "206", type: "Deluxe", status: "available" },
        { number: "207", type: "Deluxe", status: "available" },
        { number: "208", type: "Deluxe", status: "available" },
        { number: "209", type: "Deluxe", status: "available" },
        { number: "210", type: "Deluxe", status: "available" },
        { number: "211", type: "Deluxe", status: "available" },
        { number: "212", type: "Deluxe", status: "available" },
        { number: "213", type: "Deluxe", status: "available" },
        { number: "214", type: "Deluxe", status: "available" },
        { number: "215", type: "Deluxe", status: "available" },
        { number: "216", type: "Deluxe", status: "available" },

        // Suite Rooms (12 new)
        { number: "303", type: "Suite", status: "available" },
        { number: "304", type: "Suite", status: "available" },
        { number: "305", type: "Suite", status: "available" },
        { number: "306", type: "Suite", status: "available" },
        { number: "307", type: "Suite", status: "available" },
        { number: "308", type: "Suite", status: "available" },
        { number: "309", type: "Suite", status: "available" },
        { number: "310", type: "Suite", status: "available" },
        { number: "311", type: "Suite", status: "available" },
        { number: "312", type: "Suite", status: "available" },
        { number: "313", type: "Suite", status: "available" },
        { number: "314", type: "Suite", status: "available" },

        // Residential Suite Rooms (12 new)
        { number: "403", type: "Residential Suite", status: "available" },
        { number: "404", type: "Residential Suite", status: "available" },
        { number: "405", type: "Residential Suite", status: "available" },
        { number: "406", type: "Residential Suite", status: "available" },
        { number: "407", type: "Residential Suite", status: "available" },
        { number: "408", type: "Residential Suite", status: "available" },
        { number: "409", type: "Residential Suite", status: "available" },
        { number: "410", type: "Residential Suite", status: "available" },
        { number: "411", type: "Residential Suite", status: "available" },
        { number: "412", type: "Residential Suite", status: "available" },
        { number: "413", type: "Residential Suite", status: "available" },
        { number: "414", type: "Residential Suite", status: "available" },
    ];

    // Helper to pick a sensible default price if none provided
    function defaultPriceFor(type) {
        const t = (type || "").toLowerCase();
        if (t.includes("residential")) return 450;
        if (t.includes("suite")) return 280;
        if (t.includes("deluxe")) return 180;
        return 120;
    }

    // 3) Upsert each room using the composite unique (hotelId + number).
    //    Prisma supports composite upsert where we use the compound name hotelId_number.
    for (const r of rooms) {
        const price = r.pricePerNight ?? defaultPriceFor(r.type);
        try {
            await prisma.room.upsert({
                where: {
                    // compound unique field generated from @@unique([hotelId, number])
                    hotelId_number: { hotelId: hotelId, number: r.number },
                },
                update: {
                    type: r.type,
                    status: r.status,
                    pricePerNight: price,
                    // keep the hotel relation intact (no change)
                },
                create: {
                    number: r.number,
                    type: r.type,
                    status: r.status,
                    pricePerNight: price,
                    hotel: { connect: { id: hotelId } },
                },
            });
            console.log(`Upserted room ${r.number}`);
        } catch (err) {
            console.error(`Failed to upsert room ${r.number}:`, err.message || err);
        }
    }

    console.log("Rooms seeded/updated for hotel:", hotel.name);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });