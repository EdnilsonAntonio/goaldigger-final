import { NextRequest, NextResponse } from "next/server";
import { executeTasksReset, logResetExecution } from "@/lib/background-reset";

export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição tem autorização (opcional: pode adicionar um token secreto)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Executar o reset usando o serviço centralizado
    const result = await executeTasksReset();
    
    // Registrar a execução (opcional)
    try {
      await logResetExecution(result);
    } catch (logError) {
      console.warn("Não foi possível registrar o log do reset:", logError);
    }

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error("Error resetting tasks:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar status (opcional)
export async function GET() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasksToReset = await prisma.task.count({
      where: {
        repeat: true,
        resetDay: {
          not: null
        },
        state: "done"
      }
    });

    await prisma.$disconnect();

    return NextResponse.json({
      tasksToReset,
      currentDate: today.toISOString(),
      message: "Reset tasks endpoint is working"
    });

  } catch (error) {
    console.error("Error checking tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}