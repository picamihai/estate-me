const prisma = require("../prismaClient");

exports.logAction = async ({
                               userId = null,
                               username = null,
                               groupId = null,
                               role = null,
                               actionInformation,
                               resource = null,
                               resourceId = null,
                               ipAddress = null,
                           }) => {
    try {
        const log = await prisma.actionLog.create({
            data: {
                userId,
                username,
                groupId,
                role,
                actionInformation,
                resource,
                resourceId,
                ipAddress,
            },
        });

        if (userId) {
            await exports.detectSuspiciousBehavior({
                userId,
                username,
                groupId,
                role,
            });
        }

        return log;
    } catch (error) {
        console.error("Log error:", error);
        return null;
    }
};

exports.detectSuspiciousBehavior = async ({ userId, username, groupId, role }) => {
    const since = new Date(Date.now() - 5 * 60 * 1000);

    const forbiddenAttempts = await prisma.actionLog.count({
        where: {
            userId,
            actionInformation: {
                contains: "FORBIDDEN",
            },
            timestamp: {
                gte: since,
            },
        },
    });

    if (forbiddenAttempts >= 3) {
        const existing = await prisma.observationList.findFirst({
            where: {
                userId,
                resolved: false,
            },
        });

        if (!existing) {
            await prisma.observationList.create({
                data: {
                    userId,
                    username,
                    groupId,
                    role,
                    reason: "User performed 3 or more forbidden actions within 5 minutes.",
                },
            });
        }
    }
};

exports.getLogs = async () => {
    return prisma.actionLog.findMany({
        orderBy: {
            timestamp: "desc",
        },
        take: 100,
    });
};

exports.getObservationList = async () => {
    return prisma.observationList.findMany({
        where: {
            resolved: false,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

exports.resolveObservation = async (id) => {
    return prisma.observationList.update({
        where: { id: String(id) },
        data: { resolved: true },
    });
};