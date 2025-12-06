import prisma from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  sendReviewNotification,
  sendReviewConfirmation,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      rating,
      comment,
      name,
      email,
    } = await req.json();

    // Validação básica
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be between 1 and 5!" },
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

    // Se não houver userId nem email/name, retornar erro
    if (!finalUserId && !email && !name) {
      return NextResponse.json(
        { message: "Name or email is required for unauthenticated users!" },
        { status: 400 }
      );
    }

    // Criar a review
    const review = await prisma.review.create({
      data: {
        userId: finalUserId || undefined,
        rating: Number(rating),
        comment: comment?.trim() || undefined,
        name: name?.trim() || undefined,
        email: email?.trim() || undefined,
        approved: false, // Reviews precisam ser aprovadas antes de serem exibidas
      },
    });

    // Enviar emails (não bloqueia a resposta se falhar)
    const userEmail = email?.trim() || "";
    if (userEmail) {
      // Enviar notificação para admin
      sendReviewNotification({
        rating: Number(rating),
        comment: comment?.trim() || undefined,
        name: name?.trim() || undefined,
        email: userEmail,
      }).catch((error) => {
        console.error("Failed to send review notification email:", error);
      });

      // Enviar confirmação para o usuário
      sendReviewConfirmation(userEmail, Number(rating)).catch((error) => {
        console.error("Failed to send review confirmation email:", error);
      });
    }

    return NextResponse.json(
      {
        message: "Review submitted successfully! Thank you for your feedback.",
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { message: "Error creating review!" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const approved = req.nextUrl.searchParams.get("approved");
    const userId = req.headers.get("userId");

    // Se houver userId, retornar apenas as reviews desse usuário
    // Caso contrário, retornar apenas reviews aprovadas (para exibição pública)
    const where: any = {};
    if (userId) {
      where.userId = userId;
    } else {
      // Para exibição pública, apenas reviews aprovadas
      where.approved = approved === "true" ? true : approved === "false" ? false : true;
    }

    const reviews = await prisma.review.findMany({
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
            image: true,
          },
        },
      },
    });

    // Calcular média de ratings
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return NextResponse.json(
      {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { message: "Error fetching reviews!" },
      { status: 500 }
    );
  }
}

