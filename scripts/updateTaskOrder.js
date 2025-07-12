const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTaskOrder() {
    try {
        // Get all tasks grouped by tasksListId
        const tasksLists = await prisma.tasksList.findMany({
            include: {
                tasks: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        for (const tasksList of tasksLists) {
            console.log(`Updating tasks for list: ${tasksList.title}`);

            // Update each task with its order based on creation date
            for (let i = 0; i < tasksList.tasks.length; i++) {
                const task = tasksList.tasks[i];
                await prisma.task.update({
                    where: { id: task.id },
                    data: { order: i }
                });
                console.log(`  Updated task "${task.title}" with order ${i}`);
            }
        }

        console.log('Task order update completed successfully!');
    } catch (error) {
        console.error('Error updating task order:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateTaskOrder(); 