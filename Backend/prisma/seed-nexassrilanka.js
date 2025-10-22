"use strict";

/**
 * prisma/seed-nexa-srilanka.js
 *
 * Idempotent seed script to create Nexa-branded hotels across Sri Lanka and attach rooms.
 *
 * Usage:
 * 1) Ensure your prisma schema has the Hotel and Room models (with @@unique([hotelId, number])) and migrations applied:
 *    - npx prisma migrate dev --name add-hotel-model
 *    - npx prisma generate
 *
 * 2) Run this script:
 *    - node prisma/seed-nexa-srilanka.js
 *
 * Notes:
 * - Hotels are upserted by slug so the script is safe to run multiple times.
 * - Rooms are upserted per-hotel using the composite unique (hotelId + number).
 * - Make sure DATABASE_URL is set in your environment before running.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* List of Nexa hotels in different Sri Lanka cities */
const HOTELS = [
    {
        name: "Nexa Colombo Bay",
        slug: "nexa-colombo-bay",
        description: "Modern waterfront hotel in the heart of Colombo with premium facilities.",
        address: "Marine Drive, Colombo",
        city: "Colombo",
        country: "Sri Lanka",
        starRating: 4.7,
        amenities: ["wifi", "pool", "spa", "gym", "restaurant"],
        images: ["/images/nexa-colombo-1.jpg"],
        phone: "+94-11-123-0001",
        email: "stay@nexa-colombo.example",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        currency: "LKR",
        tags: ["city", "waterfront"],
        rooms: [
            // a few example rooms
            { number: "101", type: "Standard", status: "available", pricePerNight: 18000 },
            { number: "102", type: "Standard", status: "available", pricePerNight: 18000 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 28000 },
            { number: "202", type: "Deluxe", status: "occupied", pricePerNight: 28000 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 48000 },
            { number: "302", type: "Suite", status: "available", pricePerNight: 48000 },
        ],
    },
    {
        name: "Nexa Kandy Hills",
        slug: "nexa-kandy-hills",
        description: "Peaceful hillside property overlooking Kandy's scenic valleys.",
        address: "Sabaragamuwa Road, Kandy",
        city: "Kandy",
        country: "Sri Lanka",
        starRating: 4.5,
        amenities: ["wifi", "breakfast", "garden"],
        images: ["/images/nexa-kandy-1.jpg"],
        phone: "+94-81-123-0002",
        email: "stay@nexa-kandy.example",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        currency: "LKR",
        tags: ["hills", "relax"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 15000 },
            { number: "102", type: "Standard", status: "available", pricePerNight: 15000 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 23000 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 38000 },
        ],
    },
    {
        name: "Nexa Galle Fort",
        slug: "nexa-galle-fort",
        description: "Boutique hotel inside the historic Galle Fort with coastal views.",
        address: "Pedlar Street, Galle",
        city: "Galle",
        country: "Sri Lanka",
        starRating: 4.6,
        amenities: ["wifi", "breakfast", "bar"],
        images: ["/images/nexa-galle-1.jpg"],
        phone: "+94-91-123-0003",
        email: "stay@nexa-galle.example",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        currency: "LKR",
        tags: ["historic", "coastal"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 14000 },
            { number: "102", type: "Standard", status: "maintenance", pricePerNight: 14000 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 21000 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 35000 },
        ],
    },
    {
        name: "Nexa Bentota Beach",
        slug: "nexa-bentota-beach",
        description: "Beachfront escape with water sports and family-friendly facilities.",
        address: "Beach Road, Bentota",
        city: "Bentota",
        country: "Sri Lanka",
        starRating: 4.4,
        amenities: ["wifi", "pool", "water-sports", "restaurant"],
        images: ["/images/nexa-bentota-1.jpg"],
        phone: "+94-34-123-0004",
        email: "stay@nexa-bentota.example",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        currency: "LKR",
        tags: ["beachfront", "family"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 16000 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 24000 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 42000 },
            { number: "302", type: "Residential Suite", status: "available", pricePerNight: 60000 },
        ],
    },
    {
        name: "Nexa Nuwara Eliya Retreat",
        slug: "nexa-nuwara-eliya",
        description: "Cool-climate retreat among tea estates with classic colonial charm.",
        address: "Tea Estate Road, Nuwara Eliya",
        city: "Nuwara Eliya",
        country: "Sri Lanka",
        starRating: 4.3,
        amenities: ["wifi", "breakfast", "garden"],
        images: ["/images/nexa-nuwara-1.jpg"],
        phone: "+94-52-123-0005",
        email: "stay@nexa-nuwara.example",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        currency: "LKR",
        tags: ["tea-estate", "scenic"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 13000 },
            { number: "102", type: "Standard", status: "available", pricePerNight: 13000 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 20000 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 33000 },
        ],
    },
    {
        name: "Nexa Trinco Bay",
        slug: "nexa-trinco-bay",
        description: "Laid back coastal hotel near pristine beaches and coral bays.",
        address: "Trinco Beach Road, Trincomalee",
        city: "Trincomalee",
        country: "Sri Lanka",
        starRating: 4.4,
        amenities: ["wifi", "pool", "snorkeling"],
        images: ["/images/nexa-trinco-1.jpg"],
        phone: "+94-26-123-0006",
        email: "stay@nexa-trinco.example",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        currency: "LKR",
        tags: ["beachfront", "diving"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 15000 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 23000 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 36000 },
            { number: "302", type: "Residential Suite", status: "available", pricePerNight: 58000 },
        ],
    },
    {
        name: "Nexa Jaffna Gateway",
        slug: "nexa-jaffna-gateway",
        description: "Comfortable modern hotel conveniently placed for exploring Jaffna.",
        address: "K.K.S Road, Jaffna",
        city: "Jaffna",
        country: "Sri Lanka",
        starRating: 4.2,
        amenities: ["wifi", "breakfast"],
        images: ["/images/nexa-jaffna-1.jpg"],
        phone: "+94-21-123-0007",
        email: "stay@nexa-jaffna.example",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        currency: "LKR",
        tags: ["city", "culture"],
        rooms: [
            { number: "101", type: "Standard", status: "available", pricePerNight: 12000 },
            { number: "201", type: "Deluxe", status: "available", pricePerNight: 19000 },
            { number: "301", type: "Suite", status: "available", pricePerNight: 32000 },
        ],
    },
];

/* helper to provide a default if price missing */
function defaultPriceFor(type) {
    const t = (type || "").toLowerCase();
    if (t.includes("residential")) return 60000;
    if (t.includes("suite")) return 40000;
    if (t.includes("deluxe")) return 25000;
    return 15000;
}

/* upsert one hotel and its rooms */
async function upsertHotelAndRooms(hotelData) {
    const hotel = await prisma.hotel.upsert({
        where: { slug: hotelData.slug },
        update: {
            name: hotelData.name,
            description: hotelData.description,
            address: hotelData.address,
            city: hotelData.city,
            country: hotelData.country,
            starRating: hotelData.starRating,
            amenities: hotelData.amenities,
            images: hotelData.images,
            phone: hotelData.phone,
            email: hotelData.email,
            checkInTime: hotelData.checkInTime,
            checkOutTime: hotelData.checkOutTime,
            currency: hotelData.currency,
            tags: hotelData.tags,
            updatedAt: new Date(),
        },
        create: {
            name: hotelData.name,
            slug: hotelData.slug,
            description: hotelData.description,
            address: hotelData.address,
            city: hotelData.city,
            country: hotelData.country,
            starRating: hotelData.starRating,
            amenities: hotelData.amenities,
            images: hotelData.images,
            phone: hotelData.phone,
            email: hotelData.email,
            checkInTime: hotelData.checkInTime,
            checkOutTime: hotelData.checkOutTime,
            currency: hotelData.currency,
            tags: hotelData.tags,
        },
    });

    const hotelId = hotel.id;
    console.log(`Upserted hotel: ${hotel.name} (id=${hotelId})`);

    for (const r of hotelData.rooms || []) {
        const price = r.pricePerNight ?? defaultPriceFor(r.type);
        try {
            await prisma.room.upsert({
                where: {
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
            console.log(`  Upserted room ${r.number} (${r.type}) for hotel ${hotel.slug}`);
        } catch (err) {
            console.error(`  Failed to upsert room ${r.number} for ${hotel.slug}:`, err.message || err);
        }
    }
}

async function main() {
    console.log("Starting seeding Nexa hotels (Sri Lanka)...");
    try {
        for (const h of HOTELS) {
            await upsertHotelAndRooms(h);
        }
        console.log("Seeding completed successfully.");
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();