const service = require("../services/propertyService");
const prisma = require("../prismaClient");

describe("Service extra coverage", () => {
    beforeEach(async () => {
        await prisma.viewing.deleteMany();
        await prisma.property.deleteMany();
        await prisma.location.deleteMany();
    });

    afterAll(async () => {
        await prisma.viewing.deleteMany();
        await prisma.property.deleteMany();
        await prisma.location.deleteMany();
        await prisma.$disconnect();
    });

    it("update returns null when id not found", async () => {
        const res = await service.update(
            "00000000-0000-0000-0000-000000000000",
            {
                title: "X",
                description: "X",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            }
        );

        expect(res).toBeNull();
    });

    it("remove returns false when id not found", async () => {
        const res = await service.remove(
            "00000000-0000-0000-0000-000000000000"
        );

        expect(res).toBe(false);
    });

    it("getStats handles empty database", async () => {
        const stats = await service.getStats();

        expect(stats).toEqual({
            total: 0,
            totalValue: 0,
            average: 0,
            available: 0,
            sold: 0,
        });
    });

    it("creates property through service", async () => {
        const property = await service.create({
            title: "Service House",
            description: "Created by service",
            price: 120000,
            location: "Groningen",
            status: "AVAILABLE",
        });

        expect(property.title).toBe("Service House");
        expect(property.price).toBe(120000);
        expect(property.location.city).toBe("Groningen");
    });

    it("gets all properties with filters through service", async () => {
        await service.create({
            title: "Cheap Available",
            description: "A",
            price: 100000,
            location: "Cluj",
            status: "AVAILABLE",
        });

        await service.create({
            title: "Expensive Sold",
            description: "B",
            price: 500000,
            location: "Amsterdam",
            status: "SOLD",
        });

        const result = await service.getAll(0, 5, {
            status: "AVAILABLE",
            location: "cluj",
            minPrice: 50000,
            maxPrice: 150000,
        });

        expect(result.length).toBe(1);
        expect(result[0].title).toBe("Cheap Available");
    });
});