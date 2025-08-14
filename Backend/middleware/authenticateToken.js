const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        next(err);
    }
}

function authenticateClerkToken(req, res, next) {
    authenticateToken(req, res, function () {
        if (req.user && req.user.role === "clerk") {
            next();
        } else {
            res.status(403).json({ error: "Forbidden: Clerk access only" });
        }
    });
}

module.exports = {
    authenticateToken,
    authenticateClerkToken
};