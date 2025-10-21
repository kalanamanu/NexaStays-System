const { authenticateToken } = require("./authenticateToken");

function isAdmin(req, res, next) {
    // Use authenticateToken to ensure req.user is populated and token is valid.
    authenticateToken(req, res, function (err) {
        if (err) {
            // If authenticateToken passed an error to the callback, forward it.
            return next(err);
        }

        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const hasAdminRole =
            (user.role && String(user.role).toLowerCase() === "admin") ||
            (Array.isArray(user.roles) && user.roles.map(String).includes("admin")) ||
            user.isAdmin === true;

        if (hasAdminRole) {
            return next();
        }

        return res.status(403).json({ error: "Admin access required" });
    });
}

module.exports = { isAdmin };