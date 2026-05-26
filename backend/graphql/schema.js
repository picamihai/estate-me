const { graphqlHTTP } = require("express-graphql");
const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLSchema,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
} = require("graphql");

const jwt = require("jsonwebtoken");
const propertyService = require("../services/propertyService");
const logService = require("../services/logService");
const prisma = require("../prismaClient");
const { getRequiredEnv } = require("../config/env");

const JWT_SECRET = getRequiredEnv("JWT_SECRET");

const getUserFromRequest = (req) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) return null;

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        return {
            id: decoded.id,
            username: decoded.username,
            role: {
                name: decoded.role,
            },
            roleId: decoded.roleId,
            permissions: decoded.permissions || [],
        };
    } catch {
        return null;
    }
};

const mapProperty = (property) => {
    if (!property) return null;

    return {
        id: property.id,
        title: property.title,
        description: property.description,
        price: property.price,
        location: property.location?.city || "",
        status: property.status,
        createdAt: property.createdAt,
    };
};

const requireAuthenticated = (context) => {
    const user = context?.user;

    if (!user) {
        throw new Error("Not authenticated");
    }

    return user;
};

const requireGraphQLPermission = async (context, permission) => {
    const user = requireAuthenticated(context);

    const allowed = user.permissions.includes(permission);

    if (!allowed) {
        await logService.logAction({
            userId: user.id,
            username: user.username,
            groupId: user.roleId,
            role: user.role?.name,
            actionInformation: `FORBIDDEN GraphQL attempt for ${permission}`,
            resource: "GraphQL",
        });

        throw new Error("Forbidden");
    }

    return user;
};

const requireAdmin = async (context) => {
    const user = requireAuthenticated(context);

    if (user.role?.name !== "ADMIN") {
        await logService.logAction({
            userId: user.id,
            username: user.username,
            groupId: user.roleId,
            role: user.role?.name,
            actionInformation: "FORBIDDEN GraphQL admin-only attempt",
            resource: "GraphQL",
        });

        throw new Error("Admin only");
    }

    return user;
};

const validateViewingInput = ({ propertyId, date, client }) => {
    const errors = [];

    if (!propertyId || String(propertyId).trim().length === 0) {
        errors.push("Property is required");
    }

    if (!client || String(client).trim().length < 2) {
        errors.push("Client name must be at least 2 characters");
    }

    if (!date || String(date).trim().length === 0) {
        errors.push("Viewing date is required");
    } else {
        const parsedDate = new Date(String(date).replace(" ", "T"));

        if (Number.isNaN(parsedDate.getTime())) {
            errors.push("Invalid viewing date");
        } else if (parsedDate < new Date()) {
            errors.push("Viewing date cannot be in the past");
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join(". "));
    }
};

const ViewingType = new GraphQLObjectType({
    name: "Viewing",
    fields: {
        id: { type: GraphQLString },
        propertyId: { type: GraphQLString },
        date: { type: GraphQLString },
        client: { type: GraphQLString },
        status: { type: GraphQLString },
        requestedById: { type: GraphQLString },
        requestedByUsername: { type: GraphQLString },
    },
});

const PropertyType = new GraphQLObjectType({
    name: "Property",
    fields: () => ({
        id: { type: GraphQLString },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        price: { type: GraphQLInt },
        location: { type: GraphQLString },
        status: { type: GraphQLString },
        createdAt: { type: GraphQLString },

        viewings: {
            type: new GraphQLList(ViewingType),
            async resolve(parent) {
                return prisma.viewing.findMany({
                    where: {
                        propertyId: String(parent.id),
                    },
                    orderBy: {
                        date: "asc",
                    },
                });
            },
        },
    }),
});

const StatsType = new GraphQLObjectType({
    name: "Stats",
    fields: {
        total: { type: GraphQLInt },
        totalValue: { type: GraphQLInt },
        average: { type: GraphQLInt },
        available: { type: GraphQLInt },
        sold: { type: GraphQLInt },
    },
});

const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        properties: {
            type: new GraphQLList(PropertyType),
            args: {
                page: { type: GraphQLInt },
                size: { type: GraphQLInt },
                status: { type: GraphQLString },
                location: { type: GraphQLString },
                minPrice: { type: GraphQLInt },
                maxPrice: { type: GraphQLInt },
            },
            async resolve(_, args) {
                const page = args.page || 0;
                const size = args.size || 5;

                const filters = {
                    status: args.status,
                    location: args.location,
                    minPrice: args.minPrice,
                    maxPrice: args.maxPrice,
                };

                const properties = await propertyService.getAll(page, size, filters);
                return properties.map(mapProperty);
            },
        },

        property: {
            type: PropertyType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args) {
                const property = await propertyService.getById(args.id);
                return mapProperty(property);
            },
        },

        stats: {
            type: StatsType,
            async resolve() {
                return propertyService.getStats();
            },
        },

        viewings: {
            type: new GraphQLList(ViewingType),
            async resolve(_, args, context) {
                requireAuthenticated(context);

                return prisma.viewing.findMany({
                    orderBy: {
                        date: "asc",
                    },
                });
            },
        },
    },
});

const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        addProperty: {
            type: PropertyType,
            args: {
                title: { type: new GraphQLNonNull(GraphQLString) },
                description: { type: GraphQLString },
                price: { type: new GraphQLNonNull(GraphQLInt) },
                location: { type: new GraphQLNonNull(GraphQLString) },
                status: { type: GraphQLString },
            },
            async resolve(_, args, context) {
                await requireGraphQLPermission(context, "CREATE_PROPERTY");

                const property = await propertyService.create({
                    title: args.title,
                    description: args.description || "",
                    price: args.price,
                    location: args.location,
                    status: args.status || "AVAILABLE",
                });

                return mapProperty(property);
            },
        },

        updateProperty: {
            type: PropertyType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
                title: { type: GraphQLString },
                description: { type: GraphQLString },
                price: { type: GraphQLInt },
                location: { type: GraphQLString },
                status: { type: GraphQLString },
            },
            async resolve(_, args, context) {
                await requireGraphQLPermission(context, "UPDATE_PROPERTY");

                const existing = await propertyService.getById(args.id);

                if (!existing) {
                    throw new Error("Property not found");
                }

                const property = await propertyService.update(args.id, {
                    title: args.title ?? existing.title,
                    description: args.description ?? existing.description,
                    price: args.price ?? existing.price,
                    location: args.location ?? existing.location.city,
                    status: args.status ?? existing.status,
                });

                return mapProperty(property);
            },
        },

        deleteProperty: {
            type: GraphQLString,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context) {
                await requireGraphQLPermission(context, "DELETE_PROPERTY");

                const deleted = await propertyService.remove(args.id);

                if (!deleted) {
                    throw new Error("Property not found");
                }

                return "Deleted";
            },
        },

        requestViewing: {
            type: ViewingType,
            args: {
                propertyId: { type: new GraphQLNonNull(GraphQLString) },
                date: { type: new GraphQLNonNull(GraphQLString) },
                client: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context) {
                const user = await requireGraphQLPermission(context, "READ_PROPERTY");

                validateViewingInput(args);

                const property = await propertyService.getById(args.propertyId);

                if (!property) {
                    throw new Error("Property not found");
                }

                return prisma.viewing.create({
                    data: {
                        propertyId: args.propertyId,
                        date: args.date,
                        client: args.client.trim(),
                        status: "PENDING",
                        requestedById: user.id,
                        requestedByUsername: user.username,
                    },
                });
            },
        },

        addViewing: {
            type: ViewingType,
            args: {
                propertyId: { type: new GraphQLNonNull(GraphQLString) },
                date: { type: new GraphQLNonNull(GraphQLString) },
                client: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context) {
                const user = await requireAdmin(context);

                validateViewingInput(args);

                const property = await propertyService.getById(args.propertyId);

                if (!property) {
                    throw new Error("Property not found");
                }

                return prisma.viewing.create({
                    data: {
                        propertyId: args.propertyId,
                        date: args.date,
                        client: args.client.trim(),
                        status: "APPROVED",
                        requestedById: user.id,
                        requestedByUsername: user.username,
                    },
                });
            },
        },

        updateViewing: {
            type: ViewingType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
                propertyId: { type: new GraphQLNonNull(GraphQLString) },
                date: { type: new GraphQLNonNull(GraphQLString) },
                client: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context) {
                await requireAdmin(context);

                validateViewingInput(args);

                const existingViewing = await prisma.viewing.findUnique({
                    where: {
                        id: String(args.id),
                    },
                });

                if (!existingViewing) {
                    throw new Error("Viewing not found");
                }

                const property = await propertyService.getById(args.propertyId);

                if (!property) {
                    throw new Error("Property not found");
                }

                return prisma.viewing.update({
                    where: {
                        id: String(args.id),
                    },
                    data: {
                        propertyId: args.propertyId,
                        date: args.date,
                        client: args.client.trim(),
                    },
                });
            },
        },

        approveViewing: {
            type: ViewingType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context) {
                await requireAdmin(context);

                const existingViewing = await prisma.viewing.findUnique({
                    where: {
                        id: String(args.id),
                    },
                });

                if (!existingViewing) {
                    throw new Error("Viewing not found");
                }

                return prisma.viewing.update({
                    where: {
                        id: String(args.id),
                    },
                    data: {
                        status: "APPROVED",
                    },
                });
            },
        },

        rejectViewing: {
            type: ViewingType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context) {
                await requireAdmin(context);

                const existingViewing = await prisma.viewing.findUnique({
                    where: {
                        id: String(args.id),
                    },
                });

                if (!existingViewing) {
                    throw new Error("Viewing not found");
                }

                return prisma.viewing.update({
                    where: {
                        id: String(args.id),
                    },
                    data: {
                        status: "REJECTED",
                    },
                });
            },
        },

        completeViewing: {
            type: ViewingType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context) {
                await requireAdmin(context);

                const existingViewing = await prisma.viewing.findUnique({
                    where: {
                        id: String(args.id),
                    },
                });

                if (!existingViewing) {
                    throw new Error("Viewing not found");
                }

                return prisma.viewing.update({
                    where: {
                        id: String(args.id),
                    },
                    data: {
                        status: "COMPLETED",
                    },
                });
            },
        },

        deleteViewing: {
            type: GraphQLString,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context) {
                await requireAdmin(context);

                const existingViewing = await prisma.viewing.findUnique({
                    where: {
                        id: String(args.id),
                    },
                });

                if (!existingViewing) {
                    throw new Error("Viewing not found");
                }

                await prisma.viewing.delete({
                    where: {
                        id: String(args.id),
                    },
                });

                return "Deleted";
            },
        },
    },
});

const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});

module.exports = graphqlHTTP((req) => ({
    schema,
    graphiql: true,
    context: {
        user: getUserFromRequest(req),
    },
}));