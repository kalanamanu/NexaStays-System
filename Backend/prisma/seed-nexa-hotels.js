"use strict";

/**
 * prisma/seed-nexa-hotels.js
 *
 * Upserts Nexa-branded hotels across Sri Lanka (hotels only — no rooms).
 * Run first: node prisma/seed-nexa-hotels.js
 *
 * Safe to re-run (uses upsert by slug).
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
    },
];

async function upsertHotels() {
    for (const h of HOTELS) {
        try {
            await prisma.hotel.upsert({
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
                    phone: h.phone,
                    email: h.email,
                    checkInTime: h.checkInTime,
                    checkOutTime: h.checkOutTime,
                    currency: h.currency,
                    tags: h.tags,
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
                    phone: h.phone,
                    email: h.email,
                    checkInTime: h.checkInTime,
                    checkOutTime: h.checkOutTime,
                    currency: h.currency,
                    tags: h.tags,
                },
            });
            console.log(`Upserted hotel: ${h.slug}`);
        } catch (err) {
            console.error(`Failed to upsert hotel ${h.slug}:`, err.message || err);
        }
    }
}

async function main() {
    console.log("Seeding Nexa hotels (hotels only)...");
    try {
        await upsertHotels();
        console.log("Hotels seeding completed.");
    } catch (err) {
        console.error("Seeding hotels failed:", err);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();