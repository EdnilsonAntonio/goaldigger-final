/**
 * Serviço de background para reset de tarefas repetitivas
 * Este arquivo contém utilitários para executar o reset de tarefas em background
 */

import { PrismaClient } from "@prisma/client";
import { getNextResetDay } from "./utils";

const prisma = new PrismaClient();

export interface ResetTasksResult {
  success: boolean;
  updatedCount: number;
  message: string;
  date: string;
  errors?: string[];
}

/**
 * Executa o reset de tarefas repetitivas
 * Esta função pode ser chamada de qualquer lugar (API routes, cron jobs, etc.)
 */
export async function executeTasksReset(overrideToday?: Date): Promise<ResetTasksResult> {
  const errors: string[] = [];
  let updatedCount = 0;

  try {
    const today = overrideToday || new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    console.log(`[${new Date().toISOString()}] Iniciando reset de tarefas para ${todayStr}`);

    // Buscar todas as tarefas que precisam ser resetadas hoje
    const tasksToReset = await prisma.task.findMany({
      where: {
        repeat: true,
        resetDay: {
          not: null
        },
        state: "done"
      },
      include: {
        tasksList: {
          select: {
            name: true,
            userId: true
          }
        }
      }
    });

    console.log(`Encontradas ${tasksToReset.length} tarefas para verificação`);

    for (const task of tasksToReset) {
      try {
        if (!task.resetDay) continue;

        // Comparar apenas ano, mês e dia
        const resetDate = new Date(task.resetDay);
        resetDate.setHours(0, 0, 0, 0);
        const resetStr = resetDate.getFullYear() + '-' +
            String(resetDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(resetDate.getDate()).padStart(2, '0');

        if (resetStr === todayStr) {
          console.log(`Resetando tarefa: ${task.title} (ID: ${task.id})`);

          // Calcular próximo resetDay
          const nextResetDay = getNextResetDay({
            repeatUnit: task.repeatUnit,
            repeatInterval: task.repeatInterval,
            repeatDays: task.repeatDays as string[],
            startDate: task.startDate,
            endDate: task.endDate,
            occurences: (typeof task.occurences === 'number' && task.occurences > 0)
              ? task.occurences - 1
              : task.occurences,
            updatedAt: today,
          }, today);

          // Atualizar tarefa
          await prisma.task.update({
            where: { id: task.id },
            data: {
              state: "undone",
              occurences: (typeof task.occurences === 'number' && task.occurences > 0)
                ? task.occurences - 1
                : task.occurences,
              resetDay: nextResetDay ? nextResetDay.toISOString() : null,
            }
          });

          updatedCount++;
        }
      } catch (taskError) {
        const errorMsg = `Erro ao resetar tarefa ${task.id}: ${taskError instanceof Error ? taskError.message : 'Erro desconhecido'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    const message = `${updatedCount} tarefas foram resetadas com sucesso`;
    console.log(`[${new Date().toISOString()}] ${message}`);

    return {
      success: true,
      updatedCount,
      message,
      date: todayStr,
      ...(errors.length > 0 && { errors })
    };

  } catch (error) {
    const errorMsg = `Erro geral no reset de tarefas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    console.error(errorMsg);
    
    return {
      success: false,
      updatedCount,
      message: errorMsg,
      date: new Date().toISOString().slice(0, 10),
      errors: [errorMsg, ...errors]
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verifica se o reset já foi executado hoje
 * Usa uma tabela de log ou localStorage dependendo do ambiente
 */
export async function wasResetExecutedToday(): Promise<boolean> {
  try {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    // Verificar se existe uma tabela de logs no banco
    // Se não existir, sempre retorna false para executar o reset
    try {
      const lastReset = await prisma.$queryRaw`
        SELECT MAX(created_at) as last_reset 
        FROM task_reset_logs 
        WHERE DATE(created_at) = DATE(${today})
      ` as any[];
      
      return lastReset && lastReset.length > 0 && lastReset[0].last_reset;
    } catch {
      // Tabela não existe ou erro na query, assumir que não foi executado
      return false;
    }
  } catch (error) {
    console.error("Erro ao verificar último reset:", error);
    return false;
  }
}

/**
 * Registra a execução do reset para evitar duplicações
 */
export async function logResetExecution(result: ResetTasksResult): Promise<void> {
  try {
    // Tentar criar um log da execução
    // Se a tabela não existir, falha silenciosamente
    await prisma.$executeRaw`
      INSERT INTO task_reset_logs (executed_at, updated_count, success, message)
      VALUES (${new Date()}, ${result.updatedCount}, ${result.success}, ${result.message})
    `;
  } catch (error) {
    // Falha silenciosa se a tabela de logs não existir
    console.log("Log de reset não pôde ser salvo (tabela pode não existir):", error instanceof Error ? error.message : 'Erro desconhecido');
  }
}