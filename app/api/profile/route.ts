import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Buscar informações do perfil do usuário
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

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { email: kindeUser.email },
      include: {
        Subscription: true,
        _count: {
          select: {
            tasks: true,
            goals: true,
            pomotasks: true,
            transactions: true,
            bugReports: true,
            supportRequests: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Separar nome em given_name e family_name
    const nameParts = user.name?.split(' ') ?? [];
    const given_name = nameParts[0] ?? null;
    const family_name = nameParts.slice(1).join(' ') || null;

    // Verificar se o email é de um provedor OAuth comum
    const oauthProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'me.com', 'mac.com'];
    const emailDomain = user.email.split('@')[1]?.toLowerCase();
    const isOAuthEmail = oauthProviders.includes(emailDomain || '');

    // Calcular tempo de subscrição
    let subscriptionDuration = null;
    if (user.Subscription) {
      const startDate = user.Subscription.startDate;
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        subscriptionDuration = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        subscriptionDuration = `${months} month${months !== 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        subscriptionDuration = `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months !== 1 ? 's' : ''}` : ''}`;
      }
    }

    // Calcular tempo de conta
    const accountAge = Math.floor((new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    let accountAgeFormatted = '';
    if (accountAge < 30) {
      accountAgeFormatted = `${accountAge} day${accountAge !== 1 ? 's' : ''}`;
    } else if (accountAge < 365) {
      const months = Math.floor(accountAge / 30);
      accountAgeFormatted = `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(accountAge / 365);
      const months = Math.floor((accountAge % 365) / 30);
      accountAgeFormatted = `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        given_name,
        family_name,
        image: user.image,
        plan: user.plan,
        customerId: user.customerId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isOAuthEmail,
      },
      subscription: user.Subscription ? {
        plan: user.Subscription.plan,
        period: user.Subscription.period,
        startDate: user.Subscription.startDate,
        endDate: user.Subscription.endDate,
        duration: subscriptionDuration,
      } : null,
      stats: {
        tasks: user._count.tasks,
        goals: user._count.goals,
        pomotasks: user._count.pomotasks,
        transactions: user._count.transactions,
        bugReports: user._count.bugReports,
        supportRequests: user._count.supportRequests,
        reviews: user._count.reviews,
      },
      accountAge: accountAgeFormatted,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { message: "Error fetching profile" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar informações do perfil
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
    const { name, email, image } = body;

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { email: kindeUser.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Verificar se o email é de um provedor OAuth
    const oauthProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'me.com', 'mac.com'];
    const emailDomain = currentUser.email.split('@')[1]?.toLowerCase();
    const isOAuthEmail = oauthProviders.includes(emailDomain || '');

    // Preparar dados para atualização
    const updateData: any = {};

    // Atualizar nome se fornecido
    if (name !== undefined && name !== null) {
      const trimmedName = name.trim();
      if (trimmedName.length > 0) {
        updateData.name = trimmedName;
      }
    }

    // Atualizar email apenas se não for OAuth
    if (email !== undefined && email !== null) {
      if (isOAuthEmail) {
        return NextResponse.json(
          { message: "Cannot update email for OAuth accounts. Please update your email in your OAuth provider settings." },
          { status: 400 }
        );
      }

      const trimmedEmail = email.trim().toLowerCase();
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { message: "Invalid email format" },
          { status: 400 }
        );
      }

      // Verificar se o email já está em uso por outro usuário
      const existingUser = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { message: "Email already in use" },
          { status: 400 }
        );
      }

      updateData.email = trimmedEmail;
    }

    // Atualizar imagem se fornecida
    if (image !== undefined && image !== null) {
      const trimmedImage = image.trim();
      // Validar se é uma URL válida ou data URL (base64)
      if (trimmedImage.length > 0) {
        const isUrl = trimmedImage.startsWith('http://') || trimmedImage.startsWith('https://');
        const isDataUrl = trimmedImage.startsWith('data:image/');
        
        if (isUrl || isDataUrl) {
          updateData.image = trimmedImage;
        } else {
          return NextResponse.json(
            { message: "Image must be a valid URL or base64 data URL" },
            { status: 400 }
          );
        }
      } else {
        // Permitir remover a imagem
        updateData.image = null;
      }
    }

    // Se não houver nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        plan: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { message: "Error updating profile" },
      { status: 500 }
    );
  }
}

