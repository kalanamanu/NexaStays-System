const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authenticateToken");
const { updateCustomerProfile } = require("../controllers/customerProfileController");

// PUT /customer-profile/:id - update customer profile (requires auth)
router.put("/customer-profile/:id", authenticateToken, updateCustomerProfile);

module.exports = router;