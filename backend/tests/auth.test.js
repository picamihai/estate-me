const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = require("../app");
const authService = require("../services/authService");
const prisma = require("../prismaClient");

describe("Authentication Silver", () => {
    beforeEach(async () => {
        await prisma.authCode.deleteMany();
        await prisma.observationList.deleteMany();
        await prisma.actionLog.deleteMany();
    });

    afterAll(async () => {
        await prisma.authCode.deleteMany();
        await prisma.$disconnect();
    });

    it("login with valid admin credentials requires verification code", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
                username: "admin",
                password: "admin",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.requiresVerification).toBe(true);
        expect(res.body.loginSessionId).toBeDefined();
        expect(res.body.devCode).toBeDefined();
        expect(res.body.message).toBe("Verification code required");

        const codeInDb = await prisma.authCode.findUnique({
            where: { id: res.body.loginSessionId },
        });

        expect(codeInDb).toBeDefined();
        expect(codeInDb.username).toBe("admin");
        expect(codeInDb.type).toBe("LOGIN_OTP");
        expect(codeInDb.used).toBe(false);
    });

    it("verify login code returns JWT token and user", async () => {
        const login = await request(app)
            .post("/auth/login")
            .send({
                username: "admin",
                password: "admin",
            });

        const verify = await request(app)
            .post("/auth/login/verify")
            .send({
                loginSessionId: login.body.loginSessionId,
                code: login.body.devCode,
            });

        expect(verify.statusCode).toBe(200);
        expect(verify.body.token).toBeDefined();
        expect(verify.body.user).toBeDefined();

        expect(verify.body.user.username).toBe("admin");
        expect(verify.body.user.role).toBe("ADMIN");
        expect(verify.body.user.permissions).toContain("CREATE_PROPERTY");
        expect(verify.body.user.permissions).toContain("READ_PROPERTY");
        expect(verify.body.user.permissions).toContain("UPDATE_PROPERTY");
        expect(verify.body.user.permissions).toContain("DELETE_PROPERTY");

        const decoded = jwt.decode(verify.body.token);

        expect(decoded.username).toBe("admin");
        expect(decoded.role).toBe("ADMIN");
        expect(decoded.permissions).toContain("CREATE_PROPERTY");
    });

    it("verify login code marks auth code as used", async () => {
        const login = await request(app)
            .post("/auth/login")
            .send({
                username: "admin",
                password: "admin",
            });

        await request(app)
            .post("/auth/login/verify")
            .send({
                loginSessionId: login.body.loginSessionId,
                code: login.body.devCode,
            });

        const codeInDb = await prisma.authCode.findUnique({
            where: { id: login.body.loginSessionId },
        });

        expect(codeInDb.used).toBe(true);
    });

    it("rejects wrong verification code", async () => {
        const login = await request(app)
            .post("/auth/login")
            .send({
                username: "admin",
                password: "admin",
            });

        const verify = await request(app)
            .post("/auth/login/verify")
            .send({
                loginSessionId: login.body.loginSessionId,
                code: "000000",
            });

        expect(verify.statusCode).toBe(401);
        expect(verify.body.error).toBe("Invalid or expired verification code");
    });

    it("rejects missing verification fields", async () => {
        const res = await request(app)
            .post("/auth/login/verify")
            .send({
                code: "123456",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Session id and code required");
    });

    it("rejects login with missing username or password", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
                username: "admin",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Username and password required");
    });

    it("rejects login with invalid username", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
                username: "wrong",
                password: "wrong",
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Invalid credentials");
    });

    it("rejects login with invalid password", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
                username: "admin",
                password: "wrong",
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Invalid credentials");
    });

    it("registers a new user with USER role and JWT token", async () => {
        const username = `test_register_${Date.now()}`;

        const res = await request(app)
            .post("/auth/register")
            .send({
                username,
                password: "testpass",
            });

        expect(res.statusCode).toBe(201);

        expect(res.body.token).toBeDefined();
        expect(res.body.user.username).toBe(username);
        expect(res.body.user.role).toBe("USER");
        expect(res.body.user.permissions).toContain("READ_PROPERTY");
        expect(res.body.user.permissions).not.toContain("CREATE_PROPERTY");

        const dbUser = await prisma.user.findUnique({
            where: { username },
        });

        expect(dbUser).toBeDefined();
        expect(dbUser.password).not.toBe("testpass");

        const passwordMatches = await bcrypt.compare("testpass", dbUser.password);
        expect(passwordMatches).toBe(true);

        await prisma.user.delete({
            where: { username },
        });
    });

    it("rejects register with missing fields", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                username: "abc",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Username and password required");
    });

    it("rejects register with short username", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                username: "ab",
                password: "testpass",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Username must be at least 3 characters");
    });

    it("rejects register with short password", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                username: "validuser",
                password: "123",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Password must be at least 4 characters");
    });

    it("rejects duplicate username registration", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                username: "admin",
                password: "admin",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Username already exists");
    });

    it("forgot password creates reset code", async () => {
        const res = await request(app)
            .post("/auth/forgot-password")
            .send({
                username: "user",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Password reset code created");
        expect(res.body.devCode).toBeDefined();

        const resetCode = await prisma.authCode.findFirst({
            where: {
                username: "user",
                type: "PASSWORD_RESET",
                used: false,
            },
        });

        expect(resetCode).toBeDefined();
        expect(resetCode.code).toBe(res.body.devCode);
    });

    it("forgot password fails for missing username", async () => {
        const res = await request(app)
            .post("/auth/forgot-password")
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Username required");
    });

    it("forgot password fails for unknown user", async () => {
        const res = await request(app)
            .post("/auth/forgot-password")
            .send({
                username: "missing-user",
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("User not found");
    });

    it("reset password updates the password hash", async () => {
        const username = `reset_user_${Date.now()}`;

        await authService.register(username, "oldpass");

        const forgot = await request(app)
            .post("/auth/forgot-password")
            .send({
                username,
            });

        const reset = await request(app)
            .post("/auth/reset-password")
            .send({
                username,
                code: forgot.body.devCode,
                newPassword: "newpass",
            });

        expect(reset.statusCode).toBe(200);
        expect(reset.body.message).toBe("Password reset successful");

        const user = await prisma.user.findUnique({
            where: { username },
        });

        expect(user.password).not.toBe("newpass");

        const oldPasswordWorks = await bcrypt.compare("oldpass", user.password);
        const newPasswordWorks = await bcrypt.compare("newpass", user.password);

        expect(oldPasswordWorks).toBe(false);
        expect(newPasswordWorks).toBe(true);

        await prisma.user.delete({
            where: { username },
        });
    });

    it("reset password fails with invalid reset code", async () => {
        const res = await request(app)
            .post("/auth/reset-password")
            .send({
                username: "user",
                code: "000000",
                newPassword: "newpass",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Invalid reset code");
    });

    it("reset password fails with missing fields", async () => {
        const res = await request(app)
            .post("/auth/reset-password")
            .send({
                username: "user",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Username, code and new password required");
    });

    it("reset password fails with short new password", async () => {
        const res = await request(app)
            .post("/auth/reset-password")
            .send({
                username: "user",
                code: "123456",
                newPassword: "123",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Password must be at least 4 characters");
    });

    it("authService returns null for missing user", async () => {
        const result = await authService.login("missing-user", "password");
        expect(result).toBeNull();
    });

    it("authService returns null for wrong password", async () => {
        const result = await authService.login("admin", "wrong");
        expect(result).toBeNull();
    });
});