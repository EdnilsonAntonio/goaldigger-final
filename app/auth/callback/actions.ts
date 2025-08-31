"use server";

import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function checkAuthStatus() {
    try {
        // Obtém o usuário 
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        if (!user || !user.email) {
            return { success: false };
        }

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

        return { success: true };
    } catch (error) {
        console.error("Error in checkAuthStatus:", error);
        return { success: false, error: "Failed to process authentication" };
    }
}
