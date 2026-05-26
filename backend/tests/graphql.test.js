const request = require("supertest");
const app = require("../app");
const prisma = require("../prismaClient");
const { getAdminToken, getUserToken } = require("./testUtils");

function futureDate() {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 16).replace("T", " ");
}

describe("GraphQL", () => {
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

    async function createProperty() {
        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation {
                        addProperty(
                            title: "GraphQL Property"
                            price: 100000
                            location: "Cluj"
                            status: "AVAILABLE"
                        ) {
                            id
                            title
                            price
                            location
                            status
                        }
                    }
                `,
            });

        expect(res.body.errors).toBeUndefined();
        return res.body.data.addProperty;
    }

    it("gets properties without authentication", async () => {
        const res = await request(app)
            .post("/graphql")
            .send({
                query: `
                    query {
                        properties {
                            id
                            title
                        }
                    }
                `,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.properties).toBeDefined();
        expect(Array.isArray(res.body.data.properties)).toBe(true);
    });

    it("adds property as admin", async () => {
        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation {
                        addProperty(
                            title: "GraphQL Test"
                            price: 100000
                            location: "Cluj"
                        ) {
                            id
                            title
                            price
                            location
                            status
                        }
                    }
                `,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.addProperty.title).toBe("GraphQL Test");
        expect(res.body.data.addProperty.price).toBe(100000);
        expect(res.body.data.addProperty.location).toBe("Cluj");
        expect(res.body.data.addProperty.status).toBe("AVAILABLE");
    });

    it("add property fails without authentication", async () => {
        const res = await request(app)
            .post("/graphql")
            .send({
                query: `
                    mutation {
                        addProperty(
                            title: "No Auth"
                            price: 100000
                            location: "Cluj"
                        ) {
                            id
                        }
                    }
                `,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors[0].message).toBe("Not authenticated");
    });

    it("add property fails for normal user and creates forbidden log", async () => {
        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    mutation {
                        addProperty(
                            title: "Forbidden"
                            price: 100000
                            location: "Cluj"
                        ) {
                            id
                        }
                    }
                `,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors[0].message).toBe("Forbidden");

        const log = await prisma.actionLog.findFirst({
            where: {
                actionInformation: {
                    contains: "FORBIDDEN GraphQL attempt",
                },
            },
        });

        expect(log).toBeDefined();
    });

    it("updates property as admin", async () => {
        const property = await createProperty();

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($id: String!) {
                        updateProperty(
                            id: $id
                            title: "Updated"
                        ) {
                            id
                            title
                        }
                    }
                `,
                variables: { id: property.id },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.updateProperty.title).toBe("Updated");
    });

    it("update property fails for normal user", async () => {
        const property = await createProperty();

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    mutation ($id: String!) {
                        updateProperty(
                            id: $id
                            title: "Updated"
                        ) {
                            id
                            title
                        }
                    }
                `,
                variables: { id: property.id },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors[0].message).toBe("Forbidden");
    });

    it("deletes property as admin", async () => {
        const property = await createProperty();

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($id: String!) {
                        deleteProperty(id: $id)
                    }
                `,
                variables: { id: property.id },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.deleteProperty).toBe("Deleted");
    });

    it("delete property fails for normal user", async () => {
        const property = await createProperty();

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    mutation ($id: String!) {
                        deleteProperty(id: $id)
                    }
                `,
                variables: { id: property.id },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors[0].message).toBe("Forbidden");
    });

    it("gets stats", async () => {
        await createProperty();

        const res = await request(app)
            .post("/graphql")
            .send({
                query: `
                    query {
                        stats {
                            total
                            totalValue
                            average
                            available
                            sold
                        }
                    }
                `,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.stats.total).toBe(1);
        expect(res.body.data.stats.totalValue).toBe(100000);
        expect(res.body.data.stats.average).toBe(100000);
        expect(res.body.data.stats.available).toBe(1);
        expect(res.body.data.stats.sold).toBe(0);
    });

    it("filters properties", async () => {
        await createProperty();

        await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation {
                        addProperty(
                            title: "Other Property"
                            price: 500000
                            location: "Amsterdam"
                            status: "SOLD"
                        ) {
                            id
                        }
                    }
                `,
            });

        const res = await request(app)
            .post("/graphql")
            .send({
                query: `
                    query {
                        properties(
                            status: "AVAILABLE"
                            location: "cluj"
                            minPrice: 50000
                            maxPrice: 150000
                        ) {
                            id
                            title
                            price
                            location
                            status
                        }
                    }
                `,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.properties.length).toBe(1);
        expect(res.body.data.properties[0].title).toBe("GraphQL Property");
    });

    it("normal user can request viewing with pending status", async () => {
        const property = await createProperty();

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    mutation ($propertyId: String!, $date: String!) {
                        requestViewing(
                            propertyId: $propertyId
                            date: $date
                            client: "user"
                        ) {
                            id
                            propertyId
                            client
                            status
                            requestedByUsername
                        }
                    }
                `,
                variables: {
                    propertyId: property.id,
                    date: futureDate(),
                },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.requestViewing.propertyId).toBe(property.id);
        expect(res.body.data.requestViewing.client).toBe("user");
        expect(res.body.data.requestViewing.status).toBe("PENDING");
        expect(res.body.data.requestViewing.requestedByUsername).toBe("user");
    });

    it("admin can add approved viewing", async () => {
        const property = await createProperty();

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($propertyId: String!, $date: String!) {
                        addViewing(
                            propertyId: $propertyId
                            date: $date
                            client: "John Doe"
                        ) {
                            id
                            propertyId
                            client
                            status
                            requestedByUsername
                        }
                    }
                `,
                variables: {
                    propertyId: property.id,
                    date: futureDate(),
                },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.addViewing.client).toBe("John Doe");
        expect(res.body.data.addViewing.status).toBe("APPROVED");
        expect(res.body.data.addViewing.requestedByUsername).toBe("admin");
    });

    it("addViewing fails for normal user", async () => {
        const property = await createProperty();

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    mutation ($propertyId: String!, $date: String!) {
                        addViewing(
                            propertyId: $propertyId
                            date: $date
                            client: "John Doe"
                        ) {
                            id
                        }
                    }
                `,
                variables: {
                    propertyId: property.id,
                    date: futureDate(),
                },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors[0].message).toBe("Admin only");
    });

    it("viewings query requires authentication", async () => {
        const res = await request(app)
            .post("/graphql")
            .send({
                query: `
                    query {
                        viewings {
                            id
                        }
                    }
                `,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors[0].message).toBe("Not authenticated");
    });

    it("authenticated user can see all viewings", async () => {
        const property = await createProperty();

        await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($propertyId: String!, $date: String!) {
                        addViewing(
                            propertyId: $propertyId
                            date: $date
                            client: "John Doe"
                        ) {
                            id
                        }
                    }
                `,
                variables: {
                    propertyId: property.id,
                    date: futureDate(),
                },
            });

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    query {
                        viewings {
                            id
                            propertyId
                            client
                            status
                        }
                    }
                `,
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.viewings.length).toBe(1);
        expect(res.body.data.viewings[0].client).toBe("John Doe");
    });

    it("admin can approve, reject, complete, update, and delete viewing", async () => {
        const property = await createProperty();

        const requested = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    mutation ($propertyId: String!, $date: String!) {
                        requestViewing(
                            propertyId: $propertyId
                            date: $date
                            client: "user"
                        ) {
                            id
                            status
                        }
                    }
                `,
                variables: {
                    propertyId: property.id,
                    date: futureDate(),
                },
            });

        const viewingId = requested.body.data.requestViewing.id;

        const approve = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($id: String!) {
                        approveViewing(id: $id) {
                            id
                            status
                        }
                    }
                `,
                variables: { id: viewingId },
            });

        expect(approve.body.data.approveViewing.status).toBe("APPROVED");

        const update = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($id: String!, $propertyId: String!, $date: String!) {
                        updateViewing(
                            id: $id
                            propertyId: $propertyId
                            date: $date
                            client: "Updated Client"
                        ) {
                            id
                            client
                        }
                    }
                `,
                variables: {
                    id: viewingId,
                    propertyId: property.id,
                    date: futureDate(),
                },
            });

        expect(update.body.data.updateViewing.client).toBe("Updated Client");

        const complete = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($id: String!) {
                        completeViewing(id: $id) {
                            id
                            status
                        }
                    }
                `,
                variables: { id: viewingId },
            });

        expect(complete.body.data.completeViewing.status).toBe("COMPLETED");

        const deleteRes = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($id: String!) {
                        deleteViewing(id: $id)
                    }
                `,
                variables: { id: viewingId },
            });

        expect(deleteRes.body.data.deleteViewing).toBe("Deleted");
    });

    it("admin can reject pending viewing", async () => {
        const property = await createProperty();

        const requested = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    mutation ($propertyId: String!, $date: String!) {
                        requestViewing(
                            propertyId: $propertyId
                            date: $date
                            client: "user"
                        ) {
                            id
                            status
                        }
                    }
                `,
                variables: {
                    propertyId: property.id,
                    date: futureDate(),
                },
            });

        const viewingId = requested.body.data.requestViewing.id;

        const reject = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($id: String!) {
                        rejectViewing(id: $id) {
                            id
                            status
                        }
                    }
                `,
                variables: { id: viewingId },
            });

        expect(reject.body.data.rejectViewing.status).toBe("REJECTED");
    });

    it("rejects viewing date in the past", async () => {
        const property = await createProperty();

        const res = await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
                query: `
                    mutation ($propertyId: String!) {
                        requestViewing(
                            propertyId: $propertyId
                            date: "2020-01-01 10:00"
                            client: "user"
                        ) {
                            id
                        }
                    }
                `,
                variables: {
                    propertyId: property.id,
                },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors[0].message).toBe("Viewing date cannot be in the past");
    });

    it("gets property with viewings", async () => {
        const property = await createProperty();

        await request(app)
            .post("/graphql")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                query: `
                    mutation ($propertyId: String!, $date: String!) {
                        addViewing(
                            propertyId: $propertyId
                            date: $date
                            client: "John Doe"
                        ) {
                            id
                        }
                    }
                `,
                variables: {
                    propertyId: property.id,
                    date: futureDate(),
                },
            });

        const res = await request(app)
            .post("/graphql")
            .send({
                query: `
                    query ($id: String!) {
                        property(id: $id) {
                            id
                            title
                            viewings {
                                id
                                client
                                date
                                status
                            }
                        }
                    }
                `,
                variables: { id: property.id },
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.property.id).toBe(property.id);
        expect(res.body.data.property.viewings.length).toBe(1);
        expect(res.body.data.property.viewings[0].client).toBe("John Doe");
        expect(res.body.data.property.viewings[0].status).toBe("APPROVED");
    });
});