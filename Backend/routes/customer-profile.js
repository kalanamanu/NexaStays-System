const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateToken } = require("../middleware/authenticateToken"); // <-- Import from your new combined file

// Update customer profile
router.put("/customer-profile/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        firstName,
        lastName,
        phone,
        country,
        nic,
        birthDay,
        address,
    } = req.body;

    try {
        // Confirm that the profile belongs to the logged in user!
        const profile = await prisma.customerProfile.findUnique({
            where: { id: parseInt(id, 10) },
        });

        if (!profile) {
            return res.status(404).json({ message: "Customer profile not found" });
        }

        // Extra security: check the user matches the profile
        if (profile.userId !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedProfile = await prisma.customerProfile.update({
            where: { id: parseInt(id, 10) },
            data: {
                firstName,
                lastName,
                phone,
                country,
                nic,
                birthDay: birthDay ? new Date(birthDay) : undefined,
                address,
            },
        });

        res.json({ message: "Profile updated", profile: updatedProfile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Could not update profile", error: error.message });
    }
});

module.exports = router;