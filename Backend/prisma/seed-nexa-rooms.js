"use strict";

/**
 * prisma/seed-nexa-rooms.js
 *
 * Upserts room rows into the Room table using hotel slugs to find hotelId.
 * Run after you have run seed-nexa-hotels.js:
 *   node prisma/seed-nexa-rooms.js
 *
 * Idempotent: uses upsert by composite unique (hotelId + number).
 * Will add new rooms if not present, does NOT override existing rooms.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Map of hotel slug -> rooms array.
 * Existing rooms will be kept, new numbers will be added.
 * Now, each hotel will have at least 10 rooms for testing block bookings.
 */
const ROOMS_BY_HOTEL = {
    "nexa-colombo-bay": [
        { number: "101", type: "Standard", status: "available", pricePerNight: 18000 },
        { number: "102", type: "Standard", status: "available", pricePerNight: 18000 },
        { number: "103", type: "Standard", status: "available", pricePerNight: 18000 },
        { number: "104", type: "Standard", status: "available", pricePerNight: 18000 },
        { number: "201", type: "Deluxe", status: "available", pricePerNight: 28000 },
        { number: "202", type: "Deluxe", status: "occupied", pricePerNight: 28000 },
        { number: "203", type: "Deluxe", status: "available", pricePerNight: 28000 },
        { number: "204", type: "Deluxe", status: "available", pricePerNight: 28000 },
        { number: "301", type: "Suite", status: "available", pricePerNight: 48000 },
        { number: "302", type: "Suite", status: "available", pricePerNight: 48000 },
    ],
    "nexa-kandy-hills": [
        { number: "101", type: "Standard", status: "available", pricePerNight: 15000 },
        { number: "102", type: "Standard", status: "available", pricePerNight: 15000 },
        { number: "103", type: "Standard", status: "available", pricePerNight: 15000 },
        { number: "104", type: "Standard", status: "available", pricePerNight: 15000 },
        { number: "201", type: "Deluxe", status: "available", pricePerNight: 23000 },
        { number: "202", type: "Deluxe", status: "available", pricePerNight: 23000 },
        { number: "203", type: "Deluxe", status: "available", pricePerNight: 23000 },
        { number: "301", type: "Suite", status: "available", pricePerNight: 38000 },
        { number: "302", type: "Suite", status: "available", pricePerNight: 38000 },
        { number: "303", type: "Suite", status: "available", pricePerNight: 38000 },
    ],
    "nexa-galle-fort": [
        { number: "101", type: "Standard", status: "available", pricePerNight: 14000 },
        { number: "102", type: "Standard", status: "maintenance", pricePerNight: 14000 },
        { number: "103", type: "Standard", status: "available", pricePerNight: 14000 },
        { number: "201", type: "Deluxe", status: "available", pricePerNight: 21000 },
        { number: "202", type: "Deluxe", status: "available", pricePerNight: 21000 },
        { number: "203", type: "Deluxe", status: "available", pricePerNight: 21000 },
        { number: "301", type: "Suite", status: "available", pricePerNight: 35000 },
        { number: "302", type: "Suite", status: "available", pricePerNight: 35000 },
        { number: "401", type: "Residential Suite", status: "available", pricePerNight: 60000 },
        { number: "402", type: "Residential Suite", status: "available", pricePerNight: 60000 },
    ],
    "nexa-bentota-beach": [
        { number: "101", type: "Standard", status: "available", pricePerNight: 16000 },
        { number: "102", type: "Standard", status: "available", pricePerNight: 16000 },
        { number: "103", type: "Standard", status: "available", pricePerNight: 16000 },
        { number: "201", type: "Deluxe", status: "available", pricePerNight: 24000 },
        { number: "202", type: "Deluxe", status: "available", pricePerNight: 24000 },
        { number: "203", type: "Deluxe", status: "available", pricePerNight: 24000 },
        { number: "301", type: "Suite", status: "available", pricePerNight: 42000 },
        { number: "302", type: "Residential Suite", status: "available", pricePerNight: 60000 },
        { number: "303", type: "Suite", status: "available", pricePerNight: 42000 },
        { number: "304", type: "Suite", status: "available", pricePerNight: 42000 },
    ],
    "nexa-nuwara-eliya": [
        { number: "101", type: "Standard", status: "available", pricePerNight: 13000 },
        { number: "102", type: "Standard", status: "available", pricePerNight: 13000 },
        { number: "103", type: "Standard", status: "available", pricePerNight: 13000 },
        { number: "104", type: "Standard", status: "available", pricePerNight: 13000 },
        { number: "201", type: "Deluxe", status: "available", pricePerNight: 20000 },
        { number: "202", type: "Deluxe", status: "available", pricePerNight: 20000 },
        { number: "301", type: "Suite", status: "available", pricePerNight: 33000 },
        { number: "302", type: "Suite", status: "available", pricePerNight: 33000 },
        { number: "401", type: "Residential Suite", status: "available", pricePerNight: 50000 },
        { number: "402", type: "Residential Suite", status: "available", pricePerNight: 50000 },
    ],
    "nexa-trinco-bay": [
        { number: "101", type: "Standard", status: "available", pricePerNight: 15000 },
        { number: "102", type: "Standard", status: "available", pricePerNight: 15000 },
        { number: "201", type: "Deluxe", status: "available", pricePerNight: 23000 },
        { number: "202", type: "Deluxe", status: "available", pricePerNight: 23000 },
        { number: "301", type: "Suite", status: "available", pricePerNight: 36000 },
        { number: "302", type: "Residential Suite", status: "available", pricePerNight: 58000 },
        { number: "303", type: "Suite", status: "available", pricePerNight: 36000 },
        { number: "304", type: "Residential Suite", status: "available", pricePerNight: 58000 },
        { number: "401", type: "Suite", status: "available", pricePerNight: 36000 },
        { number: "402", type: "Suite", status: "available", pricePerNight: 36000 },
    ],
    "nexa-jaffna-gateway": [
        { number: "101", type: "Standard", status: "available", pricePerNight: 12000 },
        { number: "102", type: "Standard", status: "available", pricePerNight: 12000 },
        { number: "201", type: "Deluxe", status: "available", pricePerNight: 19000 },
        { number: "202", type: "Deluxe", status: "available", pricePerNight: 19000 },
        { number: "203", type: "Deluxe", status: "available", pricePerNight: 19000 },
        { number: "301", type: "Suite", status: "available", pricePerNight: 32000 },
        { number: "302", type: "Suite", status: "available", pricePerNight: 32000 },
        { number: "303", type: "Suite", status: "available", pricePerNight: 32000 },
        { number: "401", type: "Residential Suite", status: "available", pricePerNight: 48000 },
        { number: "402", type: "Residential Suite", status: "available", pricePerNight: 48000 },
    ],
};

function defaultPriceFor(type) {
    const t = (type || "").toLowerCase();
    if (t.includes("residential")) return 60000;
    if (t.includes("suite")) return 40000;
    if (t.includes("deluxe")) return 25000;
    return 15000;
}

async function upsertRoomsForHotelSlug(slug, rooms) {
    const hotel = await prisma.hotel.findUnique({ where: { slug } });
    if (!hotel) {
        console.warn(`Hotel not found for slug="${slug}", skipping ${rooms.length} rooms.`);
        return;
    }
    const hotelId = hotel.id;

    for (const r of rooms) {
        const price = r.pricePerNight ?? defaultPriceFor(r.type);
        try {
            await prisma.room.upsert({
                where: { hotelId_number: { hotelId, number: r.number } },
                update: {}, // Do NOT override existing rooms!
                create: {
                    number: r.number,
                    type: r.type,
                    status: r.status,
                    pricePerNight: price,
                    hotel: { connect: { id: hotelId } },
                },
            });
            console.log(`Upserted room ${r.number} (${r.type}) for hotel ${slug}`);
        } catch (err) {
            if (
                err.code === 'P2002' ||
                (err.message && err.message.includes('Unique constraint'))
            ) {
                // Already exists
                continue;
            }
            console.error(`Failed to upsert room ${r.number} for ${slug}:`, err.message || err);
        }
    }
}

async function main() {
    console.log("Seeding Nexa rooms (rooms only)...");
    try {
        for (const [slug, rooms] of Object.entries(ROOMS_BY_HOTEL)) {
            await upsertRoomsForHotelSlug(slug, rooms);
        }
        console.log("Rooms seeding completed.");
    } catch (err) {
        console.error("Seeding rooms failed:", err);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();