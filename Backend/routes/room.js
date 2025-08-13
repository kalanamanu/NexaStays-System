const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/rooms - fetch all rooms with pricePerNight
router.get("/", async (req, res) => {
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
            }
        });
        res.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ error: "Failed to fetch rooms" });
    }
});

module.exports = router;