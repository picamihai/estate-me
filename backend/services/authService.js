const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const { getRequiredEnv, getOptionalEnv } = require("../config/env");

const JWT_SECRET = getRequiredEnv("JWT_SECRET");
const JWT_EXPIRES_IN = getOptionalEnv("JWT_EXPIRES_IN", "30m");

function getPermissions(user) {
    return user.role.permissions.map((rp) => rp.permission.name);
}

function createToken(user) {
    const permissions = getPermissions(user);

    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role.name,
            roleId: user.roleId,
            permissions,
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );
}

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

async function findUserWithRole(username) {
    return prisma.user.findUnique({
        where: { username },
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
}

exports.login = async (username, password) => {
    const user = await findUserWithRole(username);

    if (!user) return null;

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) return null;

    await prisma.authCode.updateMany({
        where: {
            username,
            type: "LOGIN_OTP",
            used: false,
        },
        data: {
            used: true,
        },
    });

    const code = generateCode();

    const authCode = await prisma.authCode.create({
        data: {
            username,
            code,
            type: "LOGIN_OTP",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
    });

    return {
        requiresVerification: true,
        loginSessionId: authCode.id,
        message: "Verification code required",
        devCode: code,
    };
};

exports.verifyLoginCode = async (loginSessionId, code) => {
    const authCode = await prisma.authCode.findUnique({
        where: { id: loginSessionId },
    });

    if (!authCode || authCode.used) {
        return null;
    }

    if (authCode.type !== "LOGIN_OTP") {
        return null;
    }

    if (authCode.expiresAt < new Date()) {
        return null;
    }

    if (authCode.code !== code) {
        return null;
    }

    const user = await findUserWithRole(authCode.username);

    if (!user) {
        return null;
    }

    await prisma.authCode.update({
        where: { id: loginSessionId },
        data: { used: true },
    });

    const permissions = getPermissions(user);
    const token = createToken(user);

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role.name,
            roleId: user.roleId,
            permissions,
        },
    };
};

exports.register = async (username, password) => {
    const existing = await prisma.user.findUnique({
        where: { username },
    });

    if (existing) {
        return {
            error: "Username already exists",
        };
    }

    const userRole = await prisma.role.findUnique({
        where: { name: "USER" },
    });

    if (!userRole) {
        return {
            error: "Default USER role missing",
        };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            roleId: userRole.id,
        },
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

    const permissions = getPermissions(createdUser);
    const token = createToken(createdUser);

    return {
        token,
        user: {
            id: createdUser.id,
            username: createdUser.username,
            role: createdUser.role.name,
            roleId: createdUser.roleId,
            permissions,
        },
    };
};

exports.forgotPassword = async (username) => {
    const user = await prisma.user.findUnique({
        where: { username },
    });

    if (!user) {
        return {
            error: "User not found",
        };
    }

    await prisma.authCode.updateMany({
        where: {
            username,
            type: "PASSWORD_RESET",
            used: false,
        },
        data: {
            used: true,
        },
    });

    const code = generateCode();

    await prisma.authCode.create({
        data: {
            username,
            code,
            type: "PASSWORD_RESET",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
    });

    return {
        message: "Password reset code created",
        devCode: code,
    };
};

exports.resetPassword = async (username, code, newPassword) => {
    const authCode = await prisma.authCode.findFirst({
        where: {
            username,
            code,
            type: "PASSWORD_RESET",
            used: false,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    if (!authCode) {
        return {
            error: "Invalid reset code",
        };
    }

    if (authCode.expiresAt < new Date()) {
        return {
            error: "Reset code expired",
        };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { username },
        data: {
            password: hashedPassword,
        },
    });

    await prisma.authCode.update({
        where: { id: authCode.id },
        data: {
            used: true,
        },
    });

    return {
        message: "Password reset successful",
    };
};