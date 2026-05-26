const logService = require("../services/logService");

module.exports = function requirePermission(permission) {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                await logService.logAction({
                    actionInformation: `NOT_AUTHENTICATED attempt for ${permission}`,
                    resource: req.originalUrl,
                    ipAddress: req.ip,
                });

                return res.status(401).json({ error: "Not authenticated" });
            }

            const allowed = user.permissions.includes(permission);

            if (!allowed) {
                await logService.logAction({
                    userId: user.id,
                    username: user.username,
                    groupId: user.roleId,
                    role: user.role?.name,
                    actionInformation: `FORBIDDEN attempt for ${permission}`,
                    resource: req.originalUrl,
                    ipAddress: req.ip,
                });

                return res.status(403).json({ error: "Forbidden" });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Server error" });
        }
    };
};