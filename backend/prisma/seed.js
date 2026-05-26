const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");

async function main() {
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    const create = await prisma.permission.create({
        data: { name: "CREATE_PROPERTY" },
    });

    const read = await prisma.permission.create({
        data: { name: "READ_PROPERTY" },
    });

    const update = await prisma.permission.create({
        data: { name: "UPDATE_PROPERTY" },
    });

    const remove = await prisma.permission.create({
        data: { name: "DELETE_PROPERTY" },
    });

    const adminRole = await prisma.role.create({
        data: { name: "ADMIN" },
    });

    const userRole = await prisma.role.create({
        data: { name: "USER" },
    });

    for (const permission of [create, read, update, remove]) {
        await prisma.rolePermission.create({
            data: {
                roleId: adminRole.id,
                permissionId: permission.id,
            },
        });
    }

    await prisma.rolePermission.create({
        data: {
            roleId: userRole.id,
            permissionId: read.id,
        },
    });

    const adminPassword = await bcrypt.hash("admin", 10);
    const userPassword = await bcrypt.hash("user", 10);

    await prisma.user.create({
        data: {
            username: "admin",
            password: adminPassword,
            roleId: adminRole.id,
        },
    });

    await prisma.user.create({
        data: {
            username: "user",
            password: userPassword,
            roleId: userRole.id,
        },
    });

    console.log("Seed completed");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });