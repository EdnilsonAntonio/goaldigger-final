import "../globals.css";
import Sidebar from "@/components/Sidebar";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/db/prisma";
import { redirect } from "next/navigation";
import { UserProvider } from "@/components/providers/UserProvider";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  const prismaUser = await prisma.user.findFirst({
    where: { email: kindeUser?.email ?? undefined },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      plan: true,
      customerId: true,
    }
  });

  if (prismaUser?.plan === "free") {
    console.log("You must be a premium member to access this area!");
    redirect("/pricing");
  }

  // Separar o nome completo em given_name e family_name
  const nameParts = prismaUser?.name?.split(' ') ?? [];
  const given_name = nameParts[0] ?? null;
  const family_name = nameParts.slice(1).join(' ') || null;

  const userData = prismaUser ? {
    ...prismaUser,
    given_name,
    family_name,
  } : null;

  return (
    <UserProvider user={userData}>
      <div className="h-screen flex">
        <Sidebar />
        <main className="flex-1 h-full overflow-auto bg-neutral-900 text-white">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}