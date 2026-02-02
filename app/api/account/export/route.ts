import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Exportar todos os dados do usuário
export async function GET(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Buscar usuário com todos os dados relacionados
    const user = await prisma.user.findUnique({
      where: { email: kindeUser.email },
      include: {
        tasks: {
          include: {
            tasksList: true,
          },
        },
        tasksLists: {
          include: {
            tasks: true,
          },
        },
        goals: true,
        pomotasks: true,
        transactions: true,
        bugReports: true,
        supportRequests: true,
        reviews: true,
        Subscription: true,
        Preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Preparar dados para exportação (remover informações sensíveis se necessário)
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      subscription: user.Subscription,
      preferences: user.Preferences,
      tasks: user.tasks,
      tasksLists: user.tasksLists,
      goals: user.goals,
      pomotasks: user.pomotasks,
      transactions: user.transactions,
      bugReports: user.bugReports.map((br) => ({
        ...br,
        email: undefined, // Remover email dos bug reports por privacidade
      })),
      supportRequests: user.supportRequests.map((sr) => ({
        ...sr,
        email: undefined, // Remover email dos support requests por privacidade
      })),
      reviews: user.reviews.map((r) => ({
        ...r,
        email: undefined, // Remover email das reviews por privacidade
      })),
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json(exportData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="goaldigger-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { message: "Error exporting data" },
      { status: 500 }
    );
  }
}

