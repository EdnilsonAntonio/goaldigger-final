import prisma from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      title,
      description,
      category,
      email,
    } = await req.json();

    // Validação básica
    if (!title || !description || !category) {
      return NextResponse.json(
        { message: "Title, description, and category are required!" },
        { status: 400 }
      );
    }

    // Validar categoria
    const validCategories = ["billing", "technical", "account", "feature", "general", "other"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { message: "Invalid category!" },
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

    // Criar o support request
    const supportRequest = await prisma.supportRequest.create({
      data: {
        userId: finalUserId || undefined,
        title: title.trim(),
        description: description.trim(),
        category: category as any,
        email: email?.trim() || undefined,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        message: "Support request submitted successfully!",
        supportRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating support request:", error);
    return NextResponse.json(
      { message: "Error creating support request!" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("userId");
    const status = req.nextUrl.searchParams.get("status");
    const category = req.nextUrl.searchParams.get("category");

    // Se houver userId, retornar apenas os requests desse usuário
    // Caso contrário, retornar todos (para admin)
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }

    const supportRequests = await prisma.supportRequest.findMany({
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

    return NextResponse.json(supportRequests, { status: 200 });
  } catch (error) {
    console.error("Error fetching support requests:", error);
    return NextResponse.json(
      { message: "Error fetching support requests!" },
      { status: 500 }
    );
  }
}

