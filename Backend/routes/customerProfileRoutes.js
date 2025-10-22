const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authenticateToken");
const {
    getCustomerProfile,
    updateCustomerProfile,
    deleteCustomerProfile,
} = require("../controllers/customerProfileController");

// GET /api/customer-profile/me - get current authenticated user's profile
router.get("/me", authenticateToken, getCustomerProfile);

// GET /api/customer-profile/:id - get customer profile by id (requires auth)
router.get("/:id", authenticateToken, getCustomerProfile);

// PUT /api/customer-profile/:id - update customer profile (requires auth)
router.put("/:id", authenticateToken, updateCustomerProfile);

// DELETE /api/customer-profile/:id - delete customer profile (requires auth)
router.delete("/:id", authenticateToken, deleteCustomerProfile);

module.exports = router;