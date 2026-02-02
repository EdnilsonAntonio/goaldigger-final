"use client";

import { useEffect, useState } from "react";
import { useUserId, useUserPlan, useUserName } from "@/components/providers/UserProvider";
import {
    Target,
    ListTodo,
    TrendingUp,
    TrendingDown,
    Wallet,
    Clock,
    Calendar,
    ArrowRight,
    BarChart3,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardStats {
    goals: {
        total: number;
        inProgress: number;
        achieved: number;
        completionRate: number;
    };
    tasks: {
        total: number;
        done: number;
        undone: number;
        completionRate: number;
    };
    transactions: {
        totalIncome: number;
        totalExpenses: number;
        netBalance: number;
        thisMonthIncome: number;
        thisMonthExpenses: number;
    };
    recentGoals: Array<{
        id: string;
        title: string;
        current: number;
        target?: number;
        unit?: string;
        progress: number;
        deadline?: string;
    }>;
    upcomingDeadlines: Array<{
        id: string;
        title: string;
        deadline: string;
        type: "goal" | "task";
    }>;
}

export default function DashboardPage() {
    const userId = useUserId();
    const userPlan = useUserPlan();
    const userName = useUserName();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchDashboardData = async () => {
            try {
                const [goalsRes, tasksRes, transactionsRes] = await Promise.all([
                    fetch("/api/goals", { headers: { userId } }),
                    fetch("/api/tasksLists", { headers: { userId } }),
                    fetch("/api/transactions", { headers: { userId } })
                ]);

                const goals = await goalsRes.json();
                const tasksLists = await tasksRes.json();
                const transactions = await transactionsRes.json();

                const totalGoals = goals.length || 0;
                const inProgressGoals = goals.filter((g: any) => g.state === "inProgress").length;
                const achievedGoals = goals.filter((g: any) => g.state === "achieved").length;
                const completionRate = totalGoals > 0 ? (achievedGoals / totalGoals) * 100 : 0;

                const recentGoals = goals
                    .filter((g: any) => g.state === "inProgress" && g.isNumeric && g.target)
                    .map((g: any) => ({
                        id: g.id,
                        title: g.title,
                        current: g.current || 0,
                        target: g.target,
                        unit: g.unit || undefined,
                        progress: g.target ? (g.current / g.target) * 100 : 0,
                        deadline: g.deadline
                    }))
                    .sort((a: any, b: any) => b.progress - a.progress)
                    .slice(0, 3);

                const allTasks = tasksLists.flatMap((list: any) => list.tasks || []);
                const totalTasks = allTasks.length;
                const doneTasks = allTasks.filter((t: any) => t.state === "done").length;
                const undoneTasks = totalTasks - doneTasks;
                const taskCompletionRate = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

                const now = new Date();
                const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const thisMonthTransactions = transactions.filter((t: any) => {
                    const tDate = new Date(t.date);
                    return tDate >= thisMonthStart;
                });

                const totalIncome = transactions
                    .filter((t: any) => t.type === "income")
                    .reduce((sum: number, t: any) => sum + t.amount, 0);
                const totalExpenses = transactions
                    .filter((t: any) => t.type === "expense")
                    .reduce((sum: number, t: any) => sum + t.amount, 0);
                const thisMonthIncome = thisMonthTransactions
                    .filter((t: any) => t.type === "income")
                    .reduce((sum: number, t: any) => sum + t.amount, 0);
                const thisMonthExpenses = thisMonthTransactions
                    .filter((t: any) => t.type === "expense")
                    .reduce((sum: number, t: any) => sum + t.amount, 0);

                const fetchTime = new Date();
                const upcomingDeadlines: Array<{ id: string; title: string; deadline: string; type: "goal" | "task" }> = [];

                goals.forEach((g: any) => {
                    if (g.deadline && g.state === "inProgress") {
                        const deadline = new Date(g.deadline);
                        if (deadline >= fetchTime) {
                            upcomingDeadlines.push({
                                id: g.id,
                                title: g.title,
                                deadline: g.deadline,
                                type: "goal"
                            });
                        }
                    }
                });

                allTasks.forEach((t: any) => {
                    if (t.endDate && t.state === "undone") {
                        const deadline = new Date(t.endDate);
                        if (deadline >= fetchTime) {
                            upcomingDeadlines.push({
                                id: t.id,
                                title: t.title,
                                deadline: t.endDate,
                                type: "task"
                            });
                        }
                    }
                });

                upcomingDeadlines.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

                setStats({
                    goals: {
                        total: totalGoals,
                        inProgress: inProgressGoals,
                        achieved: achievedGoals,
                        completionRate
                    },
                    tasks: {
                        total: totalTasks,
                        done: doneTasks,
                        undone: undoneTasks,
                        completionRate: taskCompletionRate
                    },
                    transactions: {
                        totalIncome,
                        totalExpenses,
                        netBalance: totalIncome - totalExpenses,
                        thisMonthIncome,
                        thisMonthExpenses
                    },
                    recentGoals,
                    upcomingDeadlines: upcomingDeadlines.slice(0, 5)
                });
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [userId]);

    if (loading) {
        return (
            <main className="min-h-screen bg-neutral-900 text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <Activity className="w-12 h-12 text-blue-400 animate-pulse mx-auto mb-4" />
                            <p className="text-neutral-400">Loading dashboard...</p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const renderTime = new Date();
    const validDeadlines = stats?.upcomingDeadlines.filter((item) => {
        const deadline = new Date(item.deadline);
        return deadline >= renderTime;
    }) || [];

    return (
        <main className="min-h-screen bg-neutral-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}!
                    </h1>
                    <p className="text-lg text-gray-400">
                        Here's an overview of your productivity and progress.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                <Target className="w-6 h-6 text-blue-400" />
                            </div>
                            <Link href="/goals">
                                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <h3 className="text-sm text-neutral-400 mb-1">Goals</h3>
                        <p className="text-3xl font-bold text-white mb-2">{stats?.goals.total || 0}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-400">{stats?.goals.achieved || 0} achieved</span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-blue-400">{stats?.goals.inProgress || 0} in progress</span>
                        </div>
                        <div className="mt-3 h-2 bg-neutral-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500"
                                style={{ width: `${stats?.goals.completionRate || 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                                <ListTodo className="w-6 h-6 text-green-400" />
                            </div>
                            <Link href="/tasks">
                                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <h3 className="text-sm text-neutral-400 mb-1">Tasks</h3>
                        <p className="text-3xl font-bold text-white mb-2">{stats?.tasks.total || 0}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-green-400">{stats?.tasks.done || 0} completed</span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-orange-400">{stats?.tasks.undone || 0} pending</span>
                        </div>
                        <div className="mt-3 h-2 bg-neutral-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-600 transition-all duration-500"
                                style={{ width: `${stats?.tasks.completionRate || 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                            <Link href="/cashflow">
                                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <h3 className="text-sm text-neutral-400 mb-1">This Month Income</h3>
                        <p className="text-3xl font-bold text-green-400 mb-2">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(stats?.transactions.thisMonthIncome || 0)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(stats?.transactions.totalIncome || 0)}</span>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-red-400" />
                            </div>
                            <Link href="/cashflow">
                                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <h3 className="text-sm text-neutral-400 mb-1">This Month Expenses</h3>
                        <p className="text-3xl font-bold text-red-400 mb-2">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(stats?.transactions.thisMonthExpenses || 0)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <TrendingDown className="w-3 h-3" />
                            <span>Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(stats?.transactions.totalExpenses || 0)}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Goals Progress</h2>
                                    <p className="text-sm text-neutral-400">Track your active goals</p>
                                </div>
                            </div>
                            <Link href="/goals">
                                <Button variant="outline" size="sm" className="border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700">
                                    View All
                                </Button>
                            </Link>
                        </div>
                        {stats?.recentGoals && stats.recentGoals.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentGoals.map((goal) => (
                                    <div key={goal.id} className="bg-neutral-900/50 rounded-lg p-4 border border-neutral-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-white">{goal.title}</h3>
                                            <span className="text-sm text-neutral-400">{Math.round(goal.progress)}%</span>
                                        </div>
                                        <div className="h-2 bg-neutral-700 rounded-full overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-blue-600 transition-all duration-500"
                                                style={{ width: `${goal.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-neutral-400">
                                            <span>
                                                {goal.current} / {goal.target} {goal.unit ? goal.unit : ''}
                                            </span>
                                            {goal.deadline && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Target className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                                <p className="text-neutral-400 mb-4">No active goals yet</p>
                                <Link href="/goals">
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        Create Your First Goal
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Upcoming</h2>
                                <p className="text-sm text-neutral-400">Deadlines & due dates</p>
                            </div>
                        </div>
                        {validDeadlines.length > 0 ? (
                            <div className="space-y-3">
                                {validDeadlines.map((item) => {
                                    const deadline = new Date(item.deadline);
                                    const daysLeft = Math.ceil((deadline.getTime() - renderTime.getTime()) / (1000 * 60 * 60 * 24));
                                    const isUrgent = daysLeft <= 3;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`bg-neutral-900/50 rounded-lg p-3 border ${isUrgent ? 'border-red-600/50' : 'border-neutral-700'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <h3 className="font-medium text-white text-sm flex-1">{item.title}</h3>
                                                <span className={`text-xs px-2 py-1 rounded ${item.type === "goal"
                                                    ? "bg-blue-600/20 text-blue-400"
                                                    : "bg-green-600/20 text-green-400"
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                <Calendar className="w-3 h-3" />
                                                <span>{deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                                {isUrgent && daysLeft >= 0 && (
                                                    <span className="text-red-400 font-semibold">
                                                        • {daysLeft === 0 ? 'Due today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                                <p className="text-neutral-400 text-sm">No upcoming deadlines</p>
                            </div>
                        )}
                    </div>
                </div>

                {stats && (
                    <div className="mt-6 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                                    <Wallet className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm text-neutral-400 mb-1">Total Net Balance</h3>
                                    <p className={`text-3xl font-bold ${stats.transactions.netBalance >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(stats.transactions.netBalance)}
                                    </p>
                                </div>
                            </div>
                            <Link href="/cashflow">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    View Cashflow
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
