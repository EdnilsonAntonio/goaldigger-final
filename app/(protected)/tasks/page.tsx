import TasksLists from "@/components/TasksLists";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/db/prisma";
import { ListTodo } from "lucide-react";

export default async function TasksPage() {
    // Get the current user's session from Kinde
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    let userId: string | null = null;
    if (user?.email) {
        // Look up the user in Prisma by email
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true },
        });
        userId = dbUser?.id || null;
    }

    if (!userId) {
        return (
            <main className="flex flex-col items-center p-24">
                <section className="flex flex-col items-center justify-center p-4">
                    <h1 className="text-2xl font-bold mb-4">Tasks</h1>
                    <p>Could not find your user account. Please contact support.</p>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-neutral-900 text-white p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
                        <ListTodo className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">Tasks</h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Organize, track, and complete your goals with ease. Manage all your tasks in one beautiful dashboard.
                    </p>
                </div>
            </div>

            {/* Tasks Card */}
            <div className="max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                    <TasksLists userId={userId} />
                </div>
            </div>
        </main>
    );
}