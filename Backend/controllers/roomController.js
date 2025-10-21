const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Room controller
 * - getAllRooms: returns all rooms with pricePerNight
 * - getAvailableRooms: returns only rooms with status === "available"
 *
 * Note: Consider re-using a single PrismaClient instance across the app
 * (for example export prisma from a db.js) to avoid too many connections.
 */

async function getAllRooms(req, res) {
    try {
        const rooms = await prisma.room.findMany({
            orderBy: [
                { type: "asc" },
                { number: "asc" },
            ],
            select: {
                id: true,
                number: true,
                type: true,
                status: true,
                pricePerNight: true,
            },
        });
        res.json(rooms);
    } catch (error) {
        console.error("getAllRooms error:", error);
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
}

async function getAvailableRooms(req, res) {
    try {
        const rooms = await prisma.room.findMany({
            where: { status: "available" },
            orderBy: [
                { type: "asc" },
                { number: "asc" },
            ],
            select: {
                id: true,
                number: true,
                type: true,
                status: true,
                pricePerNight: true,
            },
        });
        res.json(rooms);
    } catch (error) {
        console.error("getAvailableRooms error:", error);
        res.status(500).json({ error: "Failed to fetch available rooms" });
    }
}

module.exports = {
    getAllRooms,
    getAvailableRooms,
};