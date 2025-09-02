
import "../globals.css";
import Sidebar from "@/components/Sidebar";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/db/prisma";
import { redirect } from "next/navigation";
import { UserPlanProvider } from "@/components/providers/UserPlanProvider";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // Restringir acesso
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const prismaUser = await prisma.user.findFirst({
    where: { email: user?.email ?? undefined }
  });

  if (prismaUser?.plan === "free") {
    console.log("You must be a premium member to access this area!");
    redirect("/pricing");
  }

  const userPlan = await prismaUser?.plan;

  return (

    <UserPlanProvider userPlan={userPlan ?? null}>
      <div className="h-screen flex">
        <Sidebar />
        <main className="flex-1 h-full overflow-auto bg-neutral-900 text-white">
          {children}
        </main>
      </div>
    </UserPlanProvider>

  );

}
