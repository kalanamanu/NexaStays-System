const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get customer profile by ID or by current user (me)
 */
async function getCustomerProfile(req, res) {
    try {
        let profile;
        // If the "me" route is hit, req.params.id will be undefined
        if (!req.params.id) {
            const authenticatedUserId = req.user && (req.user.userId || req.user.id);
            if (!authenticatedUserId) {
                return res.status(401).json({ message: "Authentication required" });
            }
            profile = await prisma.customerProfile.findUnique({
                where: { userId: authenticatedUserId },
            });
        } else {
            const profileId = parseInt(req.params.id, 10);
            if (Number.isNaN(profileId)) {
                return res.status(400).json({ message: "Invalid profile id" });
            }
            profile = await prisma.customerProfile.findUnique({
                where: { id: profileId },
            });
        }
        if (!profile) {
            return res.status(404).json({ message: "Customer profile not found" });
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        console.error("getCustomerProfile error:", error);
        res.status(500).json({ message: "Could not fetch profile", error: error.message });
    }
}

async function updateCustomerProfile(req, res) {
    const { id } = req.params;
    const { firstName, lastName, phone, country, nic, birthDay, address } = req.body;

    try {
        const profileId = parseInt(id, 10);
        if (Number.isNaN(profileId)) {
            return res.status(400).json({ message: "Invalid profile id" });
        }

        const profile = await prisma.customerProfile.findUnique({
            where: { id: profileId },
        });

        if (!profile) {
            return res.status(404).json({ message: "Customer profile not found" });
        }

        const authenticatedUserId = req.user && (req.user.userId || req.user.id);
        if (!authenticatedUserId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (profile.userId !== authenticatedUserId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedProfile = await prisma.customerProfile.update({
            where: { id: profileId },
            data: {
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

async function deleteCustomerProfile(req, res) {
    const { id } = req.params;
    try {
        const profileId = parseInt(id, 10);
        if (Number.isNaN(profileId)) {
            return res.status(400).json({ message: "Invalid profile id" });
        }

        const profile = await prisma.customerProfile.findUnique({
            where: { id: profileId },
        });

        if (!profile) {
            return res.status(404).json({ message: "Customer profile not found" });
        }

        const authenticatedUserId = req.user && (req.user.userId || req.user.id);
        if (!authenticatedUserId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (profile.userId !== authenticatedUserId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await prisma.customerProfile.delete({
            where: { id: profileId },
        });

        res.json({ message: "Profile deleted" });
    } catch (error) {
        console.error("deleteCustomerProfile error:", error);
        res.status(500).json({ message: "Could not delete profile", error: error.message });
    }
}

module.exports = {
    getCustomerProfile,
    updateCustomerProfile,
    deleteCustomerProfile,
};