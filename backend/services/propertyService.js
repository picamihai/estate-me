const prisma = require("../prismaClient");
const { faker } = require("@faker-js/faker");
const { getIo } = require("../socket");

let intervalId = null;

function validatePropertyData(data, { partial = false } = {}) {
    const errors = [];

    if (!partial || data.title !== undefined) {
        if (!data.title || String(data.title).trim().length < 2) {
            errors.push("Title must be at least 2 characters");
        }
    }

    if (!partial || data.location !== undefined) {
        if (!data.location || String(data.location).trim().length < 2) {
            errors.push("Location must be at least 2 characters");
        }
    }

    if (!partial || data.price !== undefined) {
        const price = Number(data.price);

        if (!Number.isFinite(price) || price <= 0) {
            errors.push("Price must be a positive number");
        }
    }

    if (data.status !== undefined && data.status !== null && data.status !== "") {
        const allowedStatuses = ["AVAILABLE", "SOLD"];

        if (!allowedStatuses.includes(data.status)) {
            errors.push("Invalid property status");
        }
    }

    if (errors.length > 0) {
        const error = new Error(errors.join(". "));
        error.statusCode = 400;
        throw error;
    }
}

function mapPropertyInput(data) {
    return {
        title: String(data.title).trim(),
        description: data.description ? String(data.description).trim() : "",
        price: Number(data.price),
        status: data.status || "AVAILABLE",
        location: String(data.location).trim(),
        address: data.address ? String(data.address).trim() : null,
    };
}

// CRUD
exports.getAll = async (page = 0, size = 5, filters = {}) => {
    const where = {};

    const safePage = Math.max(0, Number(page) || 0);
    const safeSize = Math.min(Math.max(Number(size) || 5, 1), 100);

    if (filters.status) {
        if (!["AVAILABLE", "SOLD"].includes(filters.status)) {
            throw new Error("Invalid property status filter");
        }

        where.status = filters.status;
    }

    if (filters.location) {
        where.location = {
            city: {
                contains: String(filters.location),
                mode: "insensitive",
            },
        };
    }

    if (filters.minPrice !== undefined && filters.minPrice !== "") {
        const minPrice = Number(filters.minPrice);

        if (Number.isFinite(minPrice) && minPrice >= 0) {
            where.price = {
                ...(where.price || {}),
                gte: minPrice,
            };
        }
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
        const maxPrice = Number(filters.maxPrice);

        if (Number.isFinite(maxPrice) && maxPrice >= 0) {
            where.price = {
                ...(where.price || {}),
                lte: maxPrice,
            };
        }
    }

    return prisma.property.findMany({
        where,
        skip: safePage * safeSize,
        take: safeSize,
        orderBy: { createdAt: "desc" },
        include: {
            location: true,
        },
    });
};

exports.getById = async (id) => {
    if (!id) return null;

    return prisma.property.findUnique({
        where: { id: String(id) },
        include: {
            location: true,
        },
    });
};

exports.create = async (data) => {
    validatePropertyData(data);

    const mapped = mapPropertyInput(data);

    return prisma.property.create({
        data: {
            title: mapped.title,
            description: mapped.description,
            price: mapped.price,
            status: mapped.status,

            location: {
                create: {
                    city: mapped.location,
                    address: mapped.address,
                },
            },
        },
        include: {
            location: true,
        },
    });
};

exports.update = async (id, data) => {
    try {
        if (!id) return null;

        const existing = await exports.getById(id);

        if (!existing) return null;

        const merged = {
            title: data.title ?? existing.title,
            description: data.description ?? existing.description,
            price: data.price ?? existing.price,
            status: data.status ?? existing.status,
            location: data.location ?? existing.location?.city,
            address: data.address ?? existing.location?.address,
        };

        validatePropertyData(merged);

        const mapped = mapPropertyInput(merged);

        return await prisma.property.update({
            where: { id: String(id) },
            data: {
                title: mapped.title,
                description: mapped.description,
                price: mapped.price,
                status: mapped.status,

                location: {
                    update: {
                        city: mapped.location,
                        address: mapped.address,
                    },
                },
            },
            include: {
                location: true,
            },
        });
    } catch (error) {
        if (error.statusCode === 400) {
            throw error;
        }

        return null;
    }
};

exports.remove = async (id) => {
    try {
        if (!id) return false;

        await prisma.property.delete({
            where: { id: String(id) },
        });

        return true;
    } catch {
        return false;
    }
};

// STATS
exports.getStats = async () => {
    const total = await prisma.property.count();

    const prices = await prisma.property.aggregate({
        _sum: { price: true },
        _avg: { price: true },
    });

    const available = await prisma.property.count({
        where: { status: "AVAILABLE" },
    });

    const sold = await prisma.property.count({
        where: { status: "SOLD" },
    });

    return {
        total,
        totalValue: prices._sum.price || 0,
        average: Math.round(prices._avg.price || 0),
        available,
        sold,
    };
};

// GENERATOR
function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function createGeneratedPropertyData() {
    const streets = [
        "Oak Avenue",
        "Maple Street",
        "River Lane",
        "Central Park Road",
        "Sunset Boulevard",
        "Green Valley Street",
        "King Street",
        "Lake View Road",
    ];

    const cities = [
        "Groningen",
        "Amsterdam",
        "Cluj",
        "Utrecht",
        "Rotterdam",
        "Eindhoven",
        "The Hague",
    ];

    const propertyTypes = [
        "Modern Apartment",
        "Family House",
        "City Studio",
        "Luxury Villa",
        "Cozy Home",
        "Downtown Loft",
        "Suburban House",
    ];

    return {
        title: `${randomFrom(propertyTypes)} on ${randomFrom(streets)}`,
        location: randomFrom(cities),
        description: "Automatically generated property listing.",
        price: faker.number
            ? faker.number.int({ min: 50000, max: 500000 })
            : Math.floor(Math.random() * (500000 - 50000 + 1)) + 50000,
        status: Math.random() > 0.5 ? "AVAILABLE" : "SOLD",
    };
}

exports.startGenerator = () => {
    if (intervalId) return false;

    intervalId = setInterval(async () => {
        try {
            const newProp = await exports.create(createGeneratedPropertyData());

            const mappedProp = {
                id: newProp.id,
                title: newProp.title,
                description: newProp.description,
                price: newProp.price,
                status: newProp.status,
                createdAt: newProp.createdAt,
                location: newProp.location?.city || "",
                address: newProp.location?.address || "",
            };

            const io = getIo();
            if (io) io.emit("propertyCreated", mappedProp);

            console.log("Generated:", mappedProp);
        } catch (error) {
            console.error("Generator error:", error);
        }
    }, 3000);

    return true;
};

exports.stopGenerator = () => {
    if (!intervalId) return false;

    clearInterval(intervalId);
    intervalId = null;
    return true;
};