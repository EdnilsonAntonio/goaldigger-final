import prisma from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getNextResetDay } from "@/lib/utils";

/**
 * API route para resetar tarefas recorrentes baseado no resetDay
 * Esta rota deve ser chamada diariamente à meia-noite por um cron job
 *
 * Proteção: Verifica se há um secret token no header ou query param
 * para evitar chamadas não autorizadas
 */
export async function GET(req: NextRequest) {
  // Verificar se há um secret token para proteção
  const authHeader = req.headers.get("authorization");
  const secretToken = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  // Se houver um secret configurado, validar
  if (expectedSecret) {
    const providedSecret = authHeader?.replace("Bearer ", "") || secretToken;
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

    // Buscar todas as tarefas repetitivas que têm resetDay definido
    const tasks = await prisma.task.findMany({
      where: {
        repeat: true,
        resetDay: {
          not: null,
        },
        state: "done", // Só resetar tarefas que estão concluídas
      },
    });

    let resetCount = 0;
    const errors: string[] = [];

    for (const task of tasks) {
      if (!task.resetDay) continue;

      // Comparar apenas ano, mês e dia
      const resetDate = new Date(task.resetDay);
      resetDate.setHours(0, 0, 0, 0);
      const resetStr =
        resetDate.getFullYear() +
        "-" +
        String(resetDate.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(resetDate.getDate()).padStart(2, "0");

      // Se o resetDay é hoje, resetar a tarefa
      if (resetStr === todayStr) {
        try {
          // Calcular próximo resetDay
          const nextResetDay = getNextResetDay(
            {
              repeatUnit: task.repeatUnit ? String(task.repeatUnit) : undefined,
              repeatInterval: task.repeatInterval || undefined,
              repeatDays: task.repeatDays
                ? task.repeatDays.map((d) => String(d))
                : undefined,
              startDate: task.startDate || undefined,
              endDate: task.endDate || undefined,
              occurences:
                typeof task.occurences === "number" && task.occurences > 0
                  ? task.occurences - 1
                  : task.occurences,
              updatedAt: today,
            },
            today
          );

          // Atualizar a tarefa
          await prisma.task.update({
            where: { id: task.id },
            data: {
              state: "undone",
              occurences:
                typeof task.occurences === "number" && task.occurences > 0
                  ? task.occurences - 1
                  : task.occurences,
              resetDay: nextResetDay ? nextResetDay : null,
              updatedAt: today,
            },
          });

          resetCount++;
        } catch (error) {
          const errorMessage = `Error resetting task ${task.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          errors.push(errorMessage);
          console.error(errorMessage, error);
        }
      }
    }

    return NextResponse.json(
      {
        message: "Cron job executed successfully",
        date: todayStr,
        tasksChecked: tasks.length,
        tasksReset: resetCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in reset-tasks cron job:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Também suporta POST para compatibilidade com alguns serviços de cron
export async function POST(req: NextRequest) {
  return GET(req);
}
