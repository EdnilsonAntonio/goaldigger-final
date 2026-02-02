import { NextRequest, NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/db/prisma";
import { stripe } from "@/lib/stripe";

// Função para garantir que a configuração do portal permite mudanças de plano
async function ensurePortalConfiguration() {
  try {
    // Obter os Price IDs dos planos disponíveis
    const priceIds = [
      process.env.STRIPE_MONTHLY_PLUS_PRICE_ID,
      process.env.STRIPE_MONTHLY_PRO_PRICE_ID,
      process.env.STRIPE_YEARLY_PLUS_PRICE_ID,
      process.env.STRIPE_YEARLY_PRO_PRICE_ID,
    ].filter(Boolean) as string[];

    if (priceIds.length === 0) {
      console.warn("No price IDs found in environment variables");
      return null;
    }

    // Buscar informações dos preços para obter os produtos
    const prices = await Promise.all(
      priceIds.map(async (priceId) => {
        try {
          return await stripe.prices.retrieve(priceId, {
            expand: ["product"],
          });
        } catch (error) {
          console.error(`Error retrieving price ${priceId}:`, error);
          return null;
        }
      })
    );

    const validPrices = prices.filter((p) => p !== null) as any[];
    if (validPrices.length === 0) {
      console.warn("No valid prices found");
      return null;
    }

    // Agrupar preços por produto
    const productsMap = new Map<string, string[]>();
    validPrices.forEach((price) => {
      const productId =
        typeof price.product === "string" ? price.product : price.product.id;
      if (!productsMap.has(productId)) {
        productsMap.set(productId, []);
      }
      productsMap.get(productId)!.push(price.id);
    });

    // Criar array de produtos com seus preços
    const products = Array.from(productsMap.entries()).map(([productId, priceIds]) => ({
      product: productId,
      prices: priceIds,
    }));

    // Listar configurações existentes
    const configurations = await stripe.billingPortal.configurations.list({
      limit: 1,
    });

    const subscriptionUpdateConfig: any = {
      enabled: true,
      default_allowed_updates: ["price", "quantity", "promotion_code"],
      proration_behavior: "create_prorations",
    };

    // Adicionar produtos disponíveis para mudança de plano
    if (products.length > 0) {
      subscriptionUpdateConfig.products = products;
      console.log("Portal configuration - Products configured:", products);
    } else {
      console.warn("No products to configure for subscription updates");
    }

    let configuration;

    if (configurations.data.length > 0) {
      // Atualizar configuração existente
      configuration = await stripe.billingPortal.configurations.update(
        configurations.data[0].id,
        {
          features: {
            subscription_update: subscriptionUpdateConfig,
            subscription_cancel: {
              enabled: true,
              mode: "at_period_end",
            },
            payment_method_update: {
              enabled: true,
            },
            invoice_history: {
              enabled: true,
            },
          },
        }
      );
    } else {
      // Criar nova configuração
      configuration = await stripe.billingPortal.configurations.create({
        features: {
          subscription_update: subscriptionUpdateConfig,
          subscription_cancel: {
            enabled: true,
            mode: "at_period_end",
          },
          payment_method_update: {
            enabled: true,
          },
          invoice_history: {
            enabled: true,
          },
        },
      });
    }

    return configuration;
  } catch (error) {
    console.error("Error ensuring portal configuration:", error);
    // Se houver erro, continuar sem configuração personalizada
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Autenticar usuário
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
      select: {
        id: true,
        customerId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.customerId) {
      return NextResponse.json(
        { message: "No Stripe customer ID found. Please subscribe first." },
        { status: 400 }
      );
    }

    // Obter o tipo de portal (subscription ou payment_method)
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "subscription";

    // Garantir que a configuração do portal permite mudanças de plano
    const portalConfiguration = await ensurePortalConfiguration();

    // Configuração base do portal
    const portalConfig: any = {
      customer: user.customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings`,
    };

    // Se houver uma configuração personalizada, usá-la
    if (portalConfiguration) {
      portalConfig.configuration = portalConfiguration.id;
    }

    // Criar sessão do Customer Portal
    const portalSession = await stripe.billingPortal.sessions.create(portalConfig);

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { message: error.message || "Error creating portal session" },
      { status: 500 }
    );
  }
}

