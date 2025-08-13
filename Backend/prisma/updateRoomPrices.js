const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Update Standard rooms
    await prisma.room.updateMany({
        where: { type: "Standard" },
        data: { pricePerNight: 120 },
    });
    // Update Deluxe rooms
    await prisma.room.updateMany({
        where: { type: "Deluxe" },
        data: { pricePerNight: 180 },
    });
    // Update Suite rooms
    await prisma.room.updateMany({
        where: { type: "Suite" },
        data: { pricePerNight: 280 },
    });
    // Update Residential Suite rooms
    await prisma.room.updateMany({
        where: { type: "Residential Suite" },
        data: { pricePerNight: 450 },
    });

    console.log("Room prices updated successfully!");
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });