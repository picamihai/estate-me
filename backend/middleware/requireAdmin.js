module.exports = async function requireAdmin(req, res, next) {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        if (user.role?.name !== "ADMIN") {
            return res.status(403).json({ error: "Admin only" });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};