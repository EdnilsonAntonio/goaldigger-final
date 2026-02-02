import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// DELETE - Excluir conta do usuário
export async function DELETE(req: NextRequest) {
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
      include: { Subscription: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Cancelar subscrição no Stripe se existir
    if (user.customerId) {
      try {
        // Buscar todas as subscrições ativas do cliente
        const subscriptions = await stripe.subscriptions.list({
          customer: user.customerId,
          status: "active",
        });

        // Cancelar todas as subscrições ativas
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id);
        }
      } catch (stripeError) {
        console.error("Error canceling Stripe subscription:", stripeError);
        // Continuar mesmo se houver erro no Stripe
      }
    }

    // Excluir usuário (cascade vai excluir todos os dados relacionados)
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { message: "Error deleting account" },
      { status: 500 }
    );
  }
}

