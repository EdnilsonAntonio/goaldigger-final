const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOccurencesNull() {
    try {
        // Buscar tarefas com occurences = null
        const tasksWithNullOccurences = await prisma.task.findMany({
            where: {
                occurences: null,
                repeat: true
            }
        });

        console.log(`Encontradas ${tasksWithNullOccurences.length} tarefas com occurences = null:`);

        for (const task of tasksWithNullOccurences) {
            console.log(`- Tarefa: ${task.title}`);
            console.log(`  ID: ${task.id}`);
            console.log(`  Occurences: ${task.occurences}`);
            console.log(`  Repeat: ${task.repeat}`);
            console.log(`  RepeatUnit: ${task.repeatUnit}`);
            console.log('---');
        }

        // Verificar se há tarefas com occurences = 0 que deveriam ser null
        const tasksWithZeroOccurences = await prisma.task.findMany({
            where: {
                occurences: 0,
                repeat: true
            }
        });

        console.log(`\nEncontradas ${tasksWithZeroOccurences.length} tarefas com occurences = 0:`);

        for (const task of tasksWithZeroOccurences) {
            console.log(`- Tarefa: ${task.title}`);
            console.log(`  ID: ${task.id}`);
            console.log(`  Occurences: ${task.occurences}`);
            console.log(`  Repeat: ${task.repeat}`);
            console.log(`  RepeatUnit: ${task.repeatUnit}`);
            console.log('---');
        }

        // Verificar se há tarefas com occurences = 1 que deveriam ser null
        const tasksWithOneOccurences = await prisma.task.findMany({
            where: {
                occurences: 1,
                repeat: true
            }
        });

        console.log(`\nEncontradas ${tasksWithOneOccurences.length} tarefas com occurences = 1 (possivelmente deveriam ser null):`);

        for (const task of tasksWithOneOccurences) {
            console.log(`- Tarefa: ${task.title}`);
            console.log(`  ID: ${task.id}`);
            console.log(`  Occurences: ${task.occurences}`);
            console.log(`  Repeat: ${task.repeat}`);
            console.log(`  RepeatUnit: ${task.repeatUnit}`);
            console.log('---');
        }

    } catch (error) {
        console.error('Erro ao testar occurences:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testOccurencesNull(); 