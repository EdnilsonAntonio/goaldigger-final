import prisma from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";

// Função auxiliar para enviar emails de forma segura (sem quebrar se o módulo falhar)
async function sendEmailsSafely(userEmail: string, title: string, description: string, category: string) {
  try {
    const emailModule = await import("@/lib/email");
    if (emailModule.sendSupportRequestNotification && emailModule.sendSupportRequestConfirmation) {
      console.log("📧 Sending support request notification email...");
      const notificationResult = await emailModule.sendSupportRequestNotification({
        title: title.trim(),
        description: description.trim(),
        category: category,
        email: userEmail,
      });
      console.log("📧 Notification email result:", notificationResult);

      console.log("📧 Sending support request confirmation email...");
      const confirmationResult = await emailModule.sendSupportRequestConfirmation(userEmail, title.trim(), category);
      console.log("📧 Confirmation email result:", confirmationResult);
    } else {
      console.error("❌ Email functions not available in module");
    }
  } catch (emailError: any) {
    console.error("❌ Error importing/using email module:", emailError?.message || emailError);
    if (emailError instanceof Error) {
      console.error("Email error stack:", emailError.stack);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("📧 Support request POST received");
    const {
      userId,
      title,
      description,
      category,
      email,
    } = await req.json();
    
    console.log("📧 Support request data:", { userId, title, category, email: email ? "provided" : "not provided" });

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
    
    console.log("📧 Category validated:", category);

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
    console.log("📧 Creating support request in database...");
    let supportRequest;
    try {
      const supportRequestData = {
        userId: finalUserId || undefined,
        title: title.trim(),
        description: description.trim(),
        category: category as "billing" | "technical" | "account" | "feature" | "general" | "other",
        email: email?.trim() || undefined,
        status: "pending" as const,
      };
      
      console.log("📧 Support request data to create:", {
        ...supportRequestData,
        description: supportRequestData.description.substring(0, 50) + "...", // Log apenas início da descrição
      });
      
      supportRequest = await prisma.supportRequest.create({
        data: supportRequestData,
      });
      console.log("✅ Support request created successfully:", supportRequest.id);
    } catch (dbError) {
      console.error("❌ Database error creating support request:", dbError);
      if (dbError instanceof Error) {
        console.error("Database error message:", dbError.message);
        console.error("Database error stack:", dbError.stack);
      }
      throw dbError; // Re-throw para ser capturado pelo catch externo
    }

    // Enviar emails (não bloqueia a resposta se falhar)
    const userEmail = email?.trim() || "";
    console.log("📧 User email for notifications:", userEmail || "not provided");
    
    if (userEmail) {
      console.log("📧 Attempting to send emails...");
      // Enviar emails de forma assíncrona (não bloqueia a resposta)
      sendEmailsSafely(userEmail, title.trim(), description.trim(), category)
        .then((result) => {
          console.log("📧 Email sending completed:", result);
        })
        .catch((error) => {
          console.error("❌ Error in sendEmailsSafely:", error);
          if (error instanceof Error) {
            console.error("Error details:", error.message, error.stack);
          }
        });
      console.log("📧 Email sending initiated (async)");
    } else {
      console.log("⚠️ No email provided, skipping email notifications");
    }

    return NextResponse.json(
      {
        message: "Support request submitted successfully!",
        supportRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating support request:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return NextResponse.json(
        { 
          message: "Error creating support request!",
          error: error.message,
          details: process.env.NODE_ENV === "development" ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        message: "Error creating support request!",
        error: "Unknown error"
      },
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

