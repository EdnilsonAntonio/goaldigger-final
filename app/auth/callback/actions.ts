"use server";

import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function checkAuthStatus() {
    try {
        // Obtém o usuário 
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user || !user.email) {
            return { success: false };
        }

        // Verificar se o usuário já existe antes do upsert
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
        });

        const isNewUser = !existingUser;
        console.log("🔍 Auth check:", {
            email: user.email,
            isNewUser,
            existingUserId: existingUser?.id,
        });

        // Opção 1: Usar upsert (recomendado)
        await prisma.user.upsert({
            where: { 
                email: user.email // Usar email como identificador único
            },
            update: {
                // Atualizar dados se o usuário já existe
                name: user.given_name + " " + user.family_name,
                image: user.picture,
            },
            create: {
                // Criar novo usuário se não existe
                id: user.id,
                email: user.email,
                name: user.given_name + " " + user.family_name,
                image: user.picture,
            },
        });

        // Enviar email de boas-vindas apenas para novos usuários
        if (isNewUser) {
            console.log("📧 New user detected! Sending welcome email to:", user.email);
            const userName = user.given_name ? `${user.given_name}${user.family_name ? ` ${user.family_name}` : ""}` : undefined;
            sendWelcomeEmail(user.email, userName)
                .then((result) => {
                    if (result.success) {
                        console.log("✅ Welcome email sent successfully to:", user.email);
                    } else {
                        console.error("❌ Failed to send welcome email:", result.error);
                    }
                })
                .catch((error) => {
                    console.error("❌ Error sending welcome email:", error);
                    if (error instanceof Error) {
                        console.error("Error details:", error.message, error.stack);
                    }
                });
        } else {
            console.log("ℹ️ Existing user, skipping welcome email");
        }

        return { success: true };
    } catch (error) {
        console.error("Error in checkAuthStatus:", error);
        return { success: false, error: "Failed to process authentication" };
    }
}
