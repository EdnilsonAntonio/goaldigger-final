import prisma from "@/db/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import {
  sendSubscriptionRenewalEmail,
  sendPaymentFailedEmail,
} from "@/lib/email";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Tipos customizados baseados no seu schema
type PlanType = "free" | "plus" | "pro";
type PeriodType = "monthly" | "yearly";

// Mapeamento dos Price IDs para planos e períodos
const PRICE_PLAN_MAP: Record<string, { plan: PlanType; period: PeriodType }> = {
  [process.env.STRIPE_MONTHLY_PLUS_PRICE_ID!]: {
    plan: "plus",
    period: "monthly",
  },
  [process.env.STRIPE_MONTHLY_PRO_PRICE_ID!]: {
    plan: "pro",
    period: "monthly",
  },
  [process.env.STRIPE_YEARLY_PLUS_PRICE_ID!]: {
    plan: "plus",
    period: "yearly",
  },
  [process.env.STRIPE_YEARLY_PRO_PRICE_ID!]: {
    plan: "pro",
    period: "yearly",
  },
};

// Função para calcular data de expiração
function calculateEndDate(period: PeriodType): Date {
  const endDate = new Date();
  if (period === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate;
}

export async function POST(req: Request) {
  console.log("🔥 Webhook received!");

  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
    console.log("✅ Webhook signature verified. Event type:", event.type);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed.", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("📦 Processing event:", {
    type: event.type,
    id: event.id,
    created: new Date(event.created * 1000).toISOString(),
  });

  // Cuida do evento
  try {
    switch (event.type) {
      case "checkout.session.completed":
        console.log("💳 Processing checkout.session.completed");

        const session = await stripe.checkout.sessions.retrieve(
          (event.data.object as Stripe.Checkout.Session).id,
          {
            expand: ["line_items"],
          }
        );

        console.log("📋 Session details:", {
          id: session.id,
          customer: session.customer,
          customerEmail: session.customer_details?.email,
          paymentStatus: session.payment_status,
          mode: session.mode,
        });

        const customerId = session.customer as string;
        const customerDetails = session.customer_details;

        if (customerDetails?.email) {
          console.log("🔍 Looking for user with email:", customerDetails.email);

          const user = await prisma.user.findUnique({
            where: { email: customerDetails.email },
          });

          if (!user) {
            console.error(
              "❌ User not found for email:",
              customerDetails.email
            );
            // Listar todos os usuários para debug
            const allUsers = await prisma.user.findMany({
              select: { email: true, id: true },
            });
            console.log("📊 All users in database:", allUsers);
            throw new Error("User not found");
          }

          console.log("✅ User found:", {
            id: user.id,
            email: user.email,
            currentPlan: user.plan,
          });

          // Atualiza o customerId se não existir
          if (!user.customerId) {
            console.log("🔄 Updating user customerId...");
            await prisma.user.update({
              where: { id: user.id },
              data: { customerId },
            });
            console.log("✅ CustomerId updated");
          }

          const lineItems = session.line_items?.data || [];
          console.log("🛒 Line items count:", lineItems.length);

          for (const [index, item] of lineItems.entries()) {
            console.log(`📦 Processing item ${index + 1}:`, {
              priceId: item.price?.id,
              type: item.price?.type,
              quantity: item.quantity,
            });

            const priceId = item.price?.id;
            const isSubscription = item.price?.type === "recurring";

            if (isSubscription && priceId) {
              // Verificar se o priceId é válido
              const planInfo = PRICE_PLAN_MAP[priceId];
              console.log("🗺️ Price mapping result:", { priceId, planInfo });

              if (!planInfo) {
                console.error("❌ Invalid priceId:", priceId);
                console.log(
                  "📋 Available price IDs:",
                  Object.keys(PRICE_PLAN_MAP)
                );
                throw new Error(`Invalid priceId: ${priceId}`);
              }

              const { plan, period } = planInfo;
              const endDate = calculateEndDate(period);

              console.log(`🔄 Processing subscription for user ${user.id}:`, {
                plan,
                period,
                startDate: new Date().toISOString(),
                endDate: endDate.toISOString(),
              });

              // Verificar se já existe uma subscrição (para detectar renovação)
              const existingSubscription = await prisma.subscription.findUnique({
                where: { userId: user.id },
              });
              const wasRenewal = existingSubscription !== null && user.plan !== "free";

              // Cria ou atualiza a subscrição
              const subscription = await prisma.subscription.upsert({
                where: { userId: user.id },
                create: {
                  userId: user.id,
                  startDate: new Date(),
                  endDate: endDate,
                  plan: plan,
                  period: period,
                },
                update: {
                  plan: plan,
                  period: period,
                  startDate: new Date(),
                  endDate: endDate,
                },
              });

              console.log("✅ Subscription upserted:", subscription);

              // Atualiza o plano do usuário
              const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { plan: plan },
              });

              console.log("✅ User plan updated:", {
                userId: updatedUser.id,
                oldPlan: user.plan,
                newPlan: updatedUser.plan,
              });

              // Enviar email de renovação se for uma renovação
              if (wasRenewal) {
                sendSubscriptionRenewalEmail(
                  user.email,
                  plan,
                  period,
                  endDate
                ).catch((error) => {
                  console.error("Failed to send subscription renewal email:", error);
                });
              }

              console.log(
                `🎉 Successfully updated user ${user.id} to ${plan} ${period} plan`
              );
            } else {
              console.log(
                "ℹ️ One-time purchase detected, not processing subscription"
              );
            }
          }
        } else {
          console.error("❌ No customer email in session");
        }
        break;

      case "customer.subscription.updated": {
        console.log("🔄 Processing customer.subscription.updated");

        const stripeSubscription = event.data.object as Stripe.Subscription;
        console.log("📋 Subscription details:", {
          id: stripeSubscription.id,
          customer: stripeSubscription.customer,
          status: stripeSubscription.status,
        });

        const user = await prisma.user.findUnique({
          where: { customerId: stripeSubscription.customer as string },
        });

        if (user && stripeSubscription.items.data.length > 0) {
          const priceId = stripeSubscription.items.data[0].price.id;
          const planInfo = PRICE_PLAN_MAP[priceId];

          if (planInfo) {
            const { plan, period } = planInfo;
            const endDate = calculateEndDate(period);

            await prisma.subscription.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                startDate: new Date(),
                endDate: endDate,
                plan: plan,
                period: period,
              },
              update: {
                plan: plan,
                period: period,
                endDate: endDate,
              },
            });

            await prisma.user.update({
              where: { id: user.id },
              data: { plan: plan },
            });

            console.log(
              `✅ Updated user ${user.id} subscription to ${plan} ${period}`
            );
          }
        }
        break;
      }

      // Caso a subscrição do usuário seja apagada - Usuário passa para o plano free
      case "customer.subscription.deleted": {
        console.log("🗑️ Processing customer.subscription.deleted");

        const stripeSubscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findUnique({
          where: { customerId: stripeSubscription.customer as string },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: "free" },
          });

          await prisma.subscription.updateMany({
            where: { userId: user.id },
            data: {
              endDate: new Date(),
            },
          });

          console.log(
            `✅ User ${user.id} subscription cancelled, reverted to free plan`
          );
        } else {
          console.error(
            "❌ User not found for the subscription deleted event."
          );
          throw new Error("User not found for the subscription deleted event.");
        }
        break;
      }

      // Caso o pagamento falhe - Usuário permanece ou volta para o plano free
      case "invoice.payment_failed": {
        console.log("❌ Processing invoice.payment_failed");
        const invoice = event.data.object as Stripe.Invoice;
        const user = await prisma.user.findFirst({
          where: { customerId: invoice.customer as string },
          include: { Subscription: true },
        });
        if (user) {
          console.log(
            `💸 Payment failed for user ${user.id}, reverting to free plan`
          );
          
          // Guardar informações da subscrição antes de atualizar
          const previousPlan = user.plan;
          const previousPeriod = user.Subscription?.period;

          // Atualiza o plano do usuário para "free"
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: "free" },
          });
          // Opcional: atualiza a assinatura para marcar o fim imediato
          await prisma.subscription.updateMany({
            where: { userId: user.id },
            data: { endDate: new Date() },
          });
          console.log(
            `✅ User ${user.id} downgraded to free plan due to payment failure`
          );

          // Enviar email de falha de pagamento
          if (previousPlan && previousPlan !== "free") {
            sendPaymentFailedEmail(
              user.email,
              previousPlan,
              previousPeriod || undefined
            ).catch((error) => {
              console.error("Failed to send payment failed email:", error);
            });
          }
        } else {
          console.warn(
            "⚠️ User not found for invoice.payment_failed",
            invoice.customer
          );
        }
        break;
      }

      // Caso o pagamento seja bem sucecido - Atualiza o plano do usuário (renovação automática)
      case "invoice.payment_succeeded": {
        console.log("✅ Processing invoice.payment_succeeded");
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice customer:", invoice.customer);
        const user = await prisma.user.findFirst({
          where: { customerId: invoice.customer as string },
          include: { Subscription: true },
        });
        if (!user) {
          console.warn(
            "⚠️ User not found for invoice.payment_succeeded",
            invoice.customer
          );
          return new Response("User not found", { status: 200 });
        }
        console.log(`💰 Payment succeeded for user ${user.id}`);

        // Se o usuário tem uma subscrição ativa, é uma renovação
        if (user.Subscription && invoice.subscription) {
          const subscription = user.Subscription;
          const plan = subscription.plan;
          const period = subscription.period;
          const endDate = subscription.endDate;

          // Enviar email de renovação
          sendSubscriptionRenewalEmail(
            user.email,
            plan,
            period,
            endDate
          ).catch((error) => {
            console.error("Failed to send subscription renewal email:", error);
          });
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    console.log("✅ Webhook processed successfully");
    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("💥 Error handling webhook event:", error);

    // Log adicional para debug
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }

    return new Response("Webhook Error", { status: 400 });
  }
}
