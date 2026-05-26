const request = require("supertest");
const app = require("../app");
const prisma = require("../prismaClient");
const { getAdminToken, getUserToken } = require("./testUtils");

describe("Property Controller", () => {
    let adminToken;
    let userToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
        userToken = await getUserToken();
    });

    beforeEach(async () => {
        await prisma.viewing.deleteMany();
        await prisma.property.deleteMany();
        await prisma.location.deleteMany();
        await prisma.observationList.deleteMany();
        await prisma.actionLog.deleteMany();
    });

    afterAll(async () => {
        await prisma.viewing.deleteMany();
        await prisma.property.deleteMany();
        await prisma.location.deleteMany();
        await prisma.observationList.deleteMany();
        await prisma.actionLog.deleteMany();
        await prisma.$disconnect();
    });

    it("GET /properties returns data without authentication", async () => {
        const res = await request(app).get("/properties");

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("POST /properties creates property as admin", async () => {
        const res = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "New House",
                description: "Nice place",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe("New House");
        expect(res.body.price).toBe(100000);
        expect(res.body.location).toBe("Cluj");
        expect(res.body.status).toBe("AVAILABLE");
    });

    it("POST /properties fails without authentication", async () => {
        const res = await request(app)
            .post("/properties")
            .send({
                title: "No Auth House",
                price: 100000,
                location: "Cluj",
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Not authenticated");
    });

    it("POST /properties fails for normal user", async () => {
        const res = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                title: "User House",
                price: 100000,
                location: "Cluj",
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Forbidden");
    });

    it("GET /properties/:id success", async () => {
        const create = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Controller Test",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        const res = await request(app).get(`/properties/${create.body.id}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(create.body.id);
        expect(res.body.title).toBe("Controller Test");
    });

    it("GET /properties/:id not found", async () => {
        const res = await request(app).get(
            "/properties/00000000-0000-0000-0000-000000000000"
        );

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Not found");
    });

    it("POST validation fails as admin", async () => {
        const res = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "",
                price: -10,
                location: "",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Invalid data");
    });

    it("PUT validation fails as admin", async () => {
        const create = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Valid Property",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        const res = await request(app)
            .put(`/properties/${create.body.id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "",
                price: -10,
                location: "",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Invalid data");
    });

    it("PUT /properties/:id updates property as admin", async () => {
        const create = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Old Title",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        const res = await request(app)
            .put(`/properties/${create.body.id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Updated Title",
                description: "Updated desc",
                price: 150000,
                location: "Amsterdam",
                status: "SOLD",
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe("Updated Title");
        expect(res.body.price).toBe(150000);
        expect(res.body.location).toBe("Amsterdam");
        expect(res.body.status).toBe("SOLD");
    });

    it("PUT /properties/:id fails for normal user", async () => {
        const create = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Old Title",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        const res = await request(app)
            .put(`/properties/${create.body.id}`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                title: "User Update",
                price: 150000,
                location: "Amsterdam",
                status: "SOLD",
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Forbidden");
    });

    it("PUT /properties/:id returns 404 when property does not exist as admin", async () => {
        const res = await request(app)
            .put("/properties/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Valid Title",
                description: "Valid desc",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Not found");
    });

    it("DELETE /properties/:id deletes property as admin", async () => {
        const create = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Delete Me",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        const res = await request(app)
            .delete(`/properties/${create.body.id}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(204);
    });

    it("DELETE /properties/:id fails for normal user", async () => {
        const create = await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Delete Me",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        const res = await request(app)
            .delete(`/properties/${create.body.id}`)
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Forbidden");
    });

    it("DELETE /properties/:id returns 404 when property does not exist as admin", async () => {
        const res = await request(app)
            .delete("/properties/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Not found");
    });

    it("GET /properties/statistics returns database statistics", async () => {
        await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Available House",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Sold House",
                price: 300000,
                location: "Amsterdam",
                status: "SOLD",
            });

        const res = await request(app).get("/properties/statistics");

        expect(res.statusCode).toBe(200);
        expect(res.body.total).toBe(2);
        expect(res.body.totalValue).toBe(400000);
        expect(res.body.average).toBe(200000);
        expect(res.body.available).toBe(1);
        expect(res.body.sold).toBe(1);
    });

    it("GET /properties filters by status, location, and price", async () => {
        await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Cheap Available",
                price: 100000,
                location: "Cluj",
                status: "AVAILABLE",
            });

        await request(app)
            .post("/properties")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Expensive Sold",
                price: 500000,
                location: "Amsterdam",
                status: "SOLD",
            });

        const res = await request(app)
            .get("/properties")
            .query({
                status: "AVAILABLE",
                location: "cluj",
                minPrice: 50000,
                maxPrice: 150000,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].title).toBe("Cheap Available");
    });

    it("GET /properties handles invalid pagination", async () => {
        const res = await request(app).get("/properties?page=-1&size=0");

        expect(res.statusCode).toBe(200);
        expect(res.body.page).toBe(0);
        expect(res.body.size).toBe(5);
    });

    it("starts and stops generator as admin", async () => {
        const start = await request(app)
            .post("/properties/start-generator")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(start.statusCode).toBe(200);
        expect(start.body.message).toBe("Started");

        const startAgain = await request(app)
            .post("/properties/start-generator")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(startAgain.statusCode).toBe(400);
        expect(startAgain.body.error).toBe("Running");

        const stop = await request(app)
            .post("/properties/stop-generator")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(stop.statusCode).toBe(200);
        expect(stop.body.message).toBe("Stopped");

        const stopAgain = await request(app)
            .post("/properties/stop-generator")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(stopAgain.statusCode).toBe(400);
        expect(stopAgain.body.error).toBe("Not running");
    });

    it("generator fails for normal user", async () => {
        const res = await request(app)
            .post("/properties/start-generator")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Forbidden");
    });
});