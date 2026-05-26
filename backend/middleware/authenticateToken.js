const jwt = require("jsonwebtoken");
const { getRequiredEnv } = require("../config/env");

const JWT_SECRET = getRequiredEnv("JWT_SECRET");

module.exports = function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "Invalid authorization header" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: {
                name: decoded.role,
            },
            roleId: decoded.roleId,
            permissions: decoded.permissions || [],
        };

        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};