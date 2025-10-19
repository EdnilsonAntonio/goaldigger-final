import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db/prisma";

// GET - Obter todos os goals do usuário
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Criar um novo goal
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, isNumeric, target, unit, deadline } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Se for numérico, validar target e unit
    if (isNumeric) {
      if (target === undefined || target === null || target <= 0) {
        return NextResponse.json(
          { error: "Target must be a positive number for numeric goals" },
          { status: 400 }
        );
      }
      if (!unit) {
        return NextResponse.json(
          { error: "Unit is required for numeric goals" },
          { status: 400 }
        );
      }
    }

    const goal = await prisma.goal.create({
      data: {
        user: { connect: { id: userId } },
        title,
        description,
        isNumeric,
        target: isNumeric ? target : null,
        unit: isNumeric ? unit : null,
        deadline: deadline ? new Date(deadline) : null,
        state: "inProgress",
        current: 0,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um goal
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      goalId,
      title,
      description,
      target,
      current,
      unit,
      deadline,
      state,
    } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    // Verificar se o goal pertence ao usuário
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (target !== undefined) updateData.target = target;
    if (unit !== undefined) updateData.unit = unit;
    if (deadline !== undefined)
      updateData.deadline = deadline ? new Date(deadline) : null;
    if (state !== undefined) updateData.state = state;

    // Se for goal numérico, sempre reavaliar o estado baseado no target e current
    if (existingGoal.isNumeric) {
      // Usar o novo target se foi fornecido, senão usar o existente
      const targetToCheck = target !== undefined ? target : existingGoal.target;
      // Usar o novo current se foi fornecido, senão usar o existente
      const currentToCheck =
        current !== undefined ? current : existingGoal.current;

      if (targetToCheck && currentToCheck >= targetToCheck) {
        updateData.state = "achieved";
      } else {
        updateData.state = "inProgress";
      }
    }

    // Adicionar current ao updateData se foi fornecido
    if (current !== undefined) {
      updateData.current = current;
    }

    const updatedGoal = await prisma.goal.update({
      where: {
        id: goalId,
      },
      data: updateData,
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar um goal
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { goalId } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    // Verificar se o goal pertence ao usuário
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: userId,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await prisma.goal.delete({
      where: {
        id: goalId,
      },
    });

    return NextResponse.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
