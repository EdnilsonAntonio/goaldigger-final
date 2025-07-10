const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find all tasks
    const tasks = await prisma.task.findMany();

    let updatedCount = 0;

    for (const task of tasks) {
        if (typeof task.tasksListId === 'undefined') {
            await prisma.task.update({
                where: { id: task.id },
                data: { tasksListId: null },
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} tasks to set tasksListId: null`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 