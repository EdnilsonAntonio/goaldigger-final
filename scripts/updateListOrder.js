const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateListOrder() {
    try {
        // Get all users
        const users = await prisma.user.findMany();

        for (const user of users) {
            console.log(`Updating lists for user: ${user.email}`);

            // Get all lists for this user ordered by creation date
            const tasksLists = await prisma.tasksList.findMany({
                where: {
                    userId: user.id
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            // Update each list with its order based on creation date
            for (let i = 0; i < tasksLists.length; i++) {
                const tasksList = tasksLists[i];
                await prisma.tasksList.update({
                    where: { id: tasksList.id },
                    data: { order: i }
                });
                console.log(`  Updated list "${tasksList.title}" with order ${i}`);
            }
        }

        console.log('List order update completed successfully!');
    } catch (error) {
        console.error('Error updating list order:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateListOrder(); 