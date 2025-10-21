const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Update customer profile controller
 * - Ensures the profile exists
 * - Ensures the authenticated user owns the profile
 * - Updates allowed fields
 */
async function updateCustomerProfile(req, res) {
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
        const profileId = parseInt(id, 10);
        if (Number.isNaN(profileId)) {
            return res.status(400).json({ message: "Invalid profile id" });
        }

        // Fetch profile
        const profile = await prisma.customerProfile.findUnique({
            where: { id: profileId },
        });

        if (!profile) {
            return res.status(404).json({ message: "Customer profile not found" });
        }

        // Accept either req.user.userId or req.user.id depending on your auth payload
        const authenticatedUserId = req.user && (req.user.userId || req.user.id);
        if (!authenticatedUserId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Ensure the profile belongs to the logged in user
        if (profile.userId !== authenticatedUserId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedProfile = await prisma.customerProfile.update({
            where: { id: profileId },
            data: {
                // Only update fields that exist in the request body (allow partial updates)
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(phone !== undefined && { phone }),
                ...(country !== undefined && { country }),
                ...(nic !== undefined && { nic }),
                ...(birthDay !== undefined && { birthDay: birthDay ? new Date(birthDay) : null }),
                ...(address !== undefined && { address }),
            },
        });

        res.json({ message: "Profile updated", profile: updatedProfile });
    } catch (error) {
        console.error("updateCustomerProfile error:", error);
        res.status(500).json({ message: "Could not update profile", error: error.message });
    }
}

module.exports = {
    updateCustomerProfile,
};