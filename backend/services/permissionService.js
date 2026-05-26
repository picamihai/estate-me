const prisma = require("../prismaClient");

exports.getUserPermissions = async (userId) => {
    if (!userId) return [];

    const user = await prisma.user.findUnique({
        where: { id: String(userId) },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) return [];

    return user.role.permissions.map((rp) => rp.permission.name);
};

exports.hasPermission = async (userId, permission) => {
    const permissions = await exports.getUserPermissions(userId);
    return permissions.includes(permission);
};