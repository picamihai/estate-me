const request = require("supertest");
const app = require("../app");
const prisma = require("../prismaClient");
const logService = require("../services/logService");
const { getAdminToken, getUserToken } = require("./testUtils");

describe("Gold logging and observation endpoints", () => {
    let adminToken;
    let userToken;
    let adminId;
    let userId;

    beforeAll(async () => {
        adminToken = await getAdminToken();
        userToken = await getUserToken();

        const admin = await prisma.user.findUnique({
            where: { username: "admin" },
        });

        const user = await prisma.user.findUnique({
            where: { username: "user" },
        });

        adminId = admin.id;
        userId = user.id;
    });

    beforeEach(async () => {
        await prisma.observationList.deleteMany();
        await prisma.actionLog.deleteMany();
    });

    afterAll(async () => {
        await prisma.observationList.deleteMany();
        await prisma.actionLog.deleteMany();
        await prisma.$disconnect();
    });

    it("GET /logs returns action logs for admin", async () => {
        await logService.logAction({
            userId: adminId,
            username: "admin",
            groupId: "ADMIN_GROUP",
            role: "ADMIN",
            actionInformation: "TEST_ADMIN_ACTION",
            resource: "Test",
            resourceId: "123",
            ipAddress: "127.0.0.1",
        });

        const res = await request(app)
            .get("/logs")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].actionInformation).toBe("TEST_ADMIN_ACTION");
    });

    it("GET /logs fails without authentication", async () => {
        const res = await request(app).get("/logs");

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Not authenticated");
    });

    it("GET /logs fails for normal user", async () => {
        const res = await request(app)
            .get("/logs")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Admin only");
    });

    it("GET /logs fails for invalid token", async () => {
        const res = await request(app)
            .get("/logs")
            .set("Authorization", "Bearer invalid-token");

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Invalid or expired token");
    });

    it("creates observation after 3 forbidden actions and admin can view it", async () => {
        for (let i = 0; i < 3; i++) {
            await logService.logAction({
                userId,
                username: "user",
                groupId: "USER_GROUP",
                role: "USER",
                actionInformation: "FORBIDDEN attempt for CREATE_PROPERTY",
                resource: "/properties",
                ipAddress: "127.0.0.1",
            });
        }

        const res = await request(app)
            .get("/logs/observations")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].username).toBe("user");
        expect(res.body[0].role).toBe("USER");
        expect(res.body[0].resolved).toBe(false);
    });

    it("GET /logs/observations fails without authentication", async () => {
        const res = await request(app).get("/logs/observations");

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Not authenticated");
    });

    it("GET /logs/observations fails for normal user", async () => {
        const res = await request(app)
            .get("/logs/observations")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Admin only");
    });

    it("admin can resolve observation", async () => {
        for (let i = 0; i < 3; i++) {
            await logService.logAction({
                userId,
                username: "user",
                groupId: "USER_GROUP",
                role: "USER",
                actionInformation: "FORBIDDEN attempt for DELETE_PROPERTY",
                resource: "/properties",
                ipAddress: "127.0.0.1",
            });
        }

        const observation = await prisma.observationList.findFirst({
            where: {
                userId,
                resolved: false,
            },
        });

        const res = await request(app)
            .put(`/logs/observations/${observation.id}/resolve`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(observation.id);
        expect(res.body.resolved).toBe(true);
    });

    it("resolve observation fails for normal user", async () => {
        const observation = await prisma.observationList.create({
            data: {
                userId,
                username: "user",
                groupId: "USER_GROUP",
                role: "USER",
                reason: "Test suspicious behavior",
            },
        });

        const res = await request(app)
            .put(`/logs/observations/${observation.id}/resolve`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Admin only");
    });
});