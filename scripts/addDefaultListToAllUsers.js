const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();

    for (const user of users) {
        // 1. Find or create the Default list for this user
        let defaultList = await prisma.tasksList.findFirst({
            where: {
                userId: user.id,
                title: "Default",
            },
        });

        if (!defaultList) {
            defaultList = await prisma.tasksList.create({
                data: {
                    userId: user.id,
                    title: "Default",
                },
            });
            console.log(`Created Default list for user ${user.email}`);
        }

        // 2. Assign all tasks without a list to this Default list
        const updated = await prisma.task.updateMany({
            where: {
                userId: user.id,
                tasksListId: null,
            },
            data: {
                tasksListId: defaultList.id,
            },
        });

        if (updated.count > 0) {
            console.log(`Assigned ${updated.count} tasks to Default list for user ${user.email}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 