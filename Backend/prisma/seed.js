const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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
        { number: "414", type: "Residential Suite", status: "available" }
    ];

    for (const room of rooms) {
        await prisma.room.upsert({
            where: { number: room.number },
            update: {},
            create: room,
        });
    }
    console.log('Rooms seeded!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });