import prisma from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      title,
      description,
      email,
      browserInfo,
      userAgent,
      url,
    } = await req.json();

    // Validação básica
    if (!title || !description) {
      return NextResponse.json(
        { message: "Title and description are required!" },
        { status: 400 }
      );
    }

    // Se não houver userId, tentar buscar pelo email
    let finalUserId = userId;
    if (!finalUserId && email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email.trim() },
          select: { id: true },
        });
        if (user) {
          finalUserId = user.id;
        }
      } catch (error) {
        console.error("Error finding user by email:", error);
        // Continuar sem userId se não encontrar
      }
    }

    // Se não houver userId nem email, retornar erro
    if (!finalUserId && !email) {
      return NextResponse.json(
        { message: "Email is required for unauthenticated users!" },
        { status: 400 }
      );
    }

    // Criar o bug report
    const bugReport = await prisma.bugReport.create({
      data: {
        userId: finalUserId || undefined,
        title: title.trim(),
        description: description.trim(),
        email: email?.trim() || undefined,
        browserInfo: browserInfo || undefined,
        userAgent: userAgent || undefined,
        url: url || undefined,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        message: "Bug report submitted successfully!",
        bugReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bug report:", error);
    return NextResponse.json(
      { message: "Error creating bug report!" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("userId");
    const status = req.nextUrl.searchParams.get("status");

    // Se houver userId, retornar apenas os reports desse usuário
    // Caso contrário, retornar todos (para admin)
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    const bugReports = await prisma.bugReport.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(bugReports, { status: 200 });
  } catch (error) {
    console.error("Error fetching bug reports:", error);
    return NextResponse.json(
      { message: "Error fetching bug reports!" },
      { status: 500 }
    );
  }
}

