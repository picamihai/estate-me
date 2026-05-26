const permissionService = require("../services/permissionService");
const prisma = require("../prismaClient");

describe("Permission service", () => {
    let adminId;
    let userId;

    beforeAll(async () => {
        const admin = await prisma.user.findUnique({
            where: { username: "admin" },
        });

        const user = await prisma.user.findUnique({
            where: { username: "user" },
        });

        adminId = admin.id;
        userId = user.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("returns empty permissions for missing user id", async () => {
        const permissions = await permissionService.getUserPermissions(null);

        expect(permissions).toEqual([]);
    });

    it("returns empty permissions for non-existing user", async () => {
        const permissions = await permissionService.getUserPermissions(
            "00000000-0000-0000-0000-000000000000"
        );

        expect(permissions).toEqual([]);
    });

    it("returns full permissions for admin", async () => {
        const permissions = await permissionService.getUserPermissions(adminId);

        expect(permissions).toContain("CREATE_PROPERTY");
        expect(permissions).toContain("READ_PROPERTY");
        expect(permissions).toContain("UPDATE_PROPERTY");
        expect(permissions).toContain("DELETE_PROPERTY");
    });

    it("returns restricted permissions for normal user", async () => {
        const permissions = await permissionService.getUserPermissions(userId);

        expect(permissions).toContain("READ_PROPERTY");
        expect(permissions).not.toContain("CREATE_PROPERTY");
        expect(permissions).not.toContain("UPDATE_PROPERTY");
        expect(permissions).not.toContain("DELETE_PROPERTY");
    });

    it("hasPermission returns true when user has permission", async () => {
        const result = await permissionService.hasPermission(
            adminId,
            "CREATE_PROPERTY"
        );

        expect(result).toBe(true);
    });

    it("hasPermission returns false when user does not have permission", async () => {
        const result = await permissionService.hasPermission(
            userId,
            "CREATE_PROPERTY"
        );

        expect(result).toBe(false);
    });
});