import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar preferências do usuário
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

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: kindeUser.email },
      include: { Preferences: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Se não houver preferências, criar com valores padrão
    if (!user.Preferences) {
      const defaultPreferences = await prisma.userPreferences.create({
        data: {
          userId: user.id,
        },
      });
      return NextResponse.json({ preferences: defaultPreferences });
    }

    return NextResponse.json({ preferences: user.Preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { message: "Error fetching preferences" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar preferências do usuário
export async function PATCH(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      pomodoroFocusTime,
      pomodoroShortBreak,
      pomodoroLongBreak,
      pomodoroFocusBeforeLong,
      pomodoroAlarmSound,
      pomodoroTickingEnabled,
      cashFlowDefaultCurrency,
      cashFlowNumberFormat,
      cashFlowDefaultCategories,
    } = body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: kindeUser.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};

    // Preferências de Pomodoro
    if (pomodoroFocusTime !== undefined) {
      updateData.pomodoroFocusTime = Number(pomodoroFocusTime);
    }
    if (pomodoroShortBreak !== undefined) {
      updateData.pomodoroShortBreak = Number(pomodoroShortBreak);
    }
    if (pomodoroLongBreak !== undefined) {
      updateData.pomodoroLongBreak = Number(pomodoroLongBreak);
    }
    if (pomodoroFocusBeforeLong !== undefined) {
      updateData.pomodoroFocusBeforeLong = Number(pomodoroFocusBeforeLong);
    }
    if (pomodoroAlarmSound !== undefined) {
      updateData.pomodoroAlarmSound = pomodoroAlarmSound;
    }
    if (pomodoroTickingEnabled !== undefined) {
      updateData.pomodoroTickingEnabled = Boolean(pomodoroTickingEnabled);
    }

    // Preferências de Cash Flow
    if (cashFlowDefaultCurrency !== undefined) {
      updateData.cashFlowDefaultCurrency = cashFlowDefaultCurrency;
    }
    if (cashFlowNumberFormat !== undefined) {
      updateData.cashFlowNumberFormat = cashFlowNumberFormat;
    }
    if (cashFlowDefaultCategories !== undefined) {
      updateData.cashFlowDefaultCategories = cashFlowDefaultCategories;
    }

    // Se não houver nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    // Criar ou atualizar preferências
    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { message: "Error updating preferences" },
      { status: 500 }
    );
  }
}

