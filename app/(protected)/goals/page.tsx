"use client";

import { useEffect, useState } from "react";
import { useKindeAuth, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "sonner";
import {
    Target,
    CheckCircle,
    Circle,
    Plus,
    Edit,
    Trash2,
    Calendar,
    TrendingUp,
    Clock,
    RotateCcw,
    ArrowUpDown,
    CalendarDays,
    Hash,
    List
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserPlan } from "@/components/providers/UserPlanProvider";

interface Goal {
    id: string;
    title: string;
    description?: string;
    state: "inProgress" | "achieved";
    isNumeric: boolean;
    target?: number;
    current: number;
    unit?: string;
    deadline?: string;
    createdAt: string;
    updatedAt: string;
}

export default function GoalsPage() {

    const userPlan = useUserPlan();

    const { getUser } = useKindeBrowserClient();
    const user = getUser();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<string>("default");

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isNumeric, setIsNumeric] = useState(false);
    const [target, setTarget] = useState("");
    const [unit, setUnit] = useState("");
    const [deadline, setDeadline] = useState("");

    // Fetch goals
    const fetchGoals = async () => {
        try {
            const response = await fetch("/api/goals");

            if (response.ok) {
                const data = await response.json();

                if (Array.isArray(data)) {
                    setGoals(data);
                } else {
                    setGoals([]);
                    toast.error("Invalid data format received");
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to fetch goals");
                setGoals([]);
            }
        } catch (error) {
            console.error("Error fetching goals:", error);
            toast.error("Error fetching goals");
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    // Create goal
    const handleCreateGoal = async (e: React.FormEvent) => {

        // Limitar 10 goals para o plano plus
        if (userPlan === "plus" && goals.length >= 10) {
            toast.error("You've reached your goals limit for your plan. Please upgrade your plan or delete some goals to create more.", {
                duration: 7000
            });
            setShowAddForm(false);
            e.preventDefault();
            return;
        }

        // Limitar 30 goals para o plano plus
        if (userPlan === "pro" && goals.length >= 30) {
            toast.error("You've reached your goals limit for your plan. Please delete some goals to create more.", {
                duration: 7000
            });
            e.preventDefault();
            return;
        }

        e.preventDefault();

        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (isNumeric && (!target || !unit)) {
            toast.error("Target and unit are required for numeric goals");
            return;
        }

        if (isNumeric && (parseFloat(target) <= 0)) {
            toast.error("Target must be a positive number");
            return;
        }

        try {
            const response = await fetch("/api/goals", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    isNumeric,
                    target: isNumeric ? parseFloat(target) : undefined,
                    unit: isNumeric ? unit.trim() : undefined,
                    deadline: deadline || undefined,
                }),
            });

            if (response.ok) {
                const newGoal = await response.json();
                toast.success("Goal created successfully!");

                // Adicionar o novo goal ao estado local imediatamente
                setGoals(prevGoals => [newGoal, ...prevGoals]);

                resetForm();
                setShowAddForm(false);
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to create goal");
            }
        } catch (error) {
            console.error("Error creating goal:", error);
            toast.error("Error creating goal");
        }
    };

    // Update goal
    const handleUpdateGoal = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingGoal || !title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (isNumeric && (!target || !unit)) {
            toast.error("Target and unit are required for numeric goals");
            return;
        }

        try {
            const response = await fetch("/api/goals", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    goalId: editingGoal.id,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    target: isNumeric ? parseFloat(target) : undefined,
                    unit: isNumeric ? unit.trim() : undefined,
                    deadline: deadline || undefined,
                    // Para goals numéricos, sempre enviar o current atual para reavaliação automática do estado
                    current: editingGoal.isNumeric ? editingGoal.current : undefined,
                }),
            });

            if (response.ok) {
                const updatedGoal = await response.json();
                toast.success("Goal updated successfully!");

                // Atualizar o estado local imediatamente
                setGoals(prevGoals =>
                    prevGoals.map(goal =>
                        goal.id === editingGoal?.id ? updatedGoal : goal
                    )
                );

                resetForm();
                setEditingGoal(null);
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to update goal");
            }
        } catch (error) {
            console.error("Error updating goal:", error);
            toast.error("Error updating goal");
        }
    };

    // Update progress
    const handleUpdateProgress = async (goalId: string, newCurrent: number) => {
        try {
            const response = await fetch("/api/goals", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    goalId,
                    current: newCurrent,
                }),
            });

            if (response.ok) {
                const updatedGoal = await response.json();
                toast.success("Progress updated!");

                // Atualizar o goal no estado local imediatamente
                setGoals(prevGoals =>
                    prevGoals.map(goal =>
                        goal.id === goalId ? updatedGoal : goal
                    )
                );
            } else {
                toast.error("Failed to update progress");
            }
        } catch (error) {
            console.error("Error updating progress:", error);
            toast.error("Error updating progress");
        }
    };

    // Toggle goal state (for non-numeric goals)
    const handleToggleGoalState = async (goal: Goal) => {
        const newState = goal.state === "achieved" ? "inProgress" : "achieved";

        try {
            const response = await fetch("/api/goals", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    goalId: goal.id,
                    state: newState,
                }),
            });

            if (response.ok) {
                const updatedGoal = await response.json();
                toast.success(newState === "achieved" ? "Goal achieved! 🎉" : "Goal marked as in progress");

                // Atualizar o goal no estado local imediatamente
                setGoals(prevGoals =>
                    prevGoals.map(g =>
                        g.id === goal.id ? updatedGoal : g
                    )
                );
            } else {
                toast.error("Failed to update goal state");
            }
        } catch (error) {
            console.error("Error updating goal state:", error);
            toast.error("Error updating goal state");
        }
    }

    // Reset goal (for achieved goals)
    const handleResetGoal = async (goal: Goal) => {
        try {
            const response = await fetch("/api/goals", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    goalId: goal.id,
                    state: "inProgress",
                    current: 0, // Reset progress to 0
                }),
            });

            if (response.ok) {
                const updatedGoal = await response.json();
                toast.success("Goal reset successfully! You can start over.");

                // Atualizar o goal no estado local imediatamente
                setGoals(prevGoals =>
                    prevGoals.map(g =>
                        g.id === goal.id ? updatedGoal : g
                    )
                );
            } else {
                toast.error("Failed to reset goal");
            }
        } catch (error) {
            console.error("Error resetting goal:", error);
            toast.error("Error resetting goal");
        }
    };

    // Delete goal
    const handleDeleteGoal = async (goalId: string) => {
        try {
            const response = await fetch("/api/goals", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ goalId }),
            });

            if (response.ok) {
                toast.success("Goal deleted successfully");

                // Remover o goal do estado local imediatamente
                setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
            } else {
                toast.error("Failed to delete goal");
            }
        } catch (error) {
            console.error("Error deleting goal:", error);
            toast.error("Error deleting goal");
        }
    };

    // Reset form
    const resetForm = () => {
        setTitle("");
        setDescription("");
        setIsNumeric(false);
        setTarget("");
        setUnit("");
        setDeadline("");
    };

    // Edit goal
    const handleEditGoal = (goal: Goal) => {
        setEditingGoal(goal);
        setTitle(goal.title);
        setDescription(goal.description || "");
        setIsNumeric(goal.isNumeric);
        setTarget(goal.target?.toString() || "");
        setUnit(goal.unit || "");
        setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "");
    };

    // Cancel edit
    const handleCancelEdit = () => {
        setEditingGoal(null);
        resetForm();
    };

    // Calculate progress percentage
    const getProgressPercentage = (goal: Goal) => {
        if (!goal.isNumeric || !goal.target || goal.target <= 0) return 0;
        return Math.min((goal.current / goal.target) * 100, 100);
    };

    // Sort goals based on selected option
    const getSortedGoals = () => {
        const goalsCopy = [...goals];

        switch (sortBy) {
            case "deadline-asc":
                return goalsCopy.sort((a, b) => {
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                });

            case "deadline-desc":
                return goalsCopy.sort((a, b) => {
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
                });

            case "numbered-first":
                return goalsCopy.sort((a, b) => {
                    if (a.isNumeric && !b.isNumeric) return -1;
                    if (!a.isNumeric && b.isNumeric) return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

            case "unnumbered-first":
                return goalsCopy.sort((a, b) => {
                    if (!a.isNumeric && b.isNumeric) return -1;
                    if (a.isNumeric && !b.isNumeric) return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

            case "default":
            default:
                return goalsCopy.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
        }
    };

    // Format deadline
    const formatDeadline = (deadline: string) => {
        const date = new Date(deadline);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

        if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            return "Due today";
        } else if (diffDays === 1) {
            return "Due tomorrow";
        } else if (diffDays < 7) {
            return `Due in ${diffDays} days`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // Check if deadline is overdue
    const isOverdue = (deadline: string) => {
        const date = new Date(deadline);
        const now = new Date();
        return date < now;
    };

    useEffect(() => {
        if (user) {
            fetchGoals();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Timeout de segurança para evitar loading infinito
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn("Loading timeout reached, setting loading to false");
                setLoading(false);
            }
        }, 10000); // 10 segundos

        return () => clearTimeout(timeout);
    }, [loading]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading goals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Your Goals</h1>
                    <p className="text-neutral-400">Track your progress and achieve your dreams</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Sort Dropdown */}
                    {goals.length > 0 && (
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 cursor-pointer"
                            >
                                <option value="default" className="bg-neutral-800 text-white">
                                    Default (Creation Date)
                                </option>
                                <option value="deadline-asc" className="bg-neutral-800 text-white">
                                    Deadline (Earliest First)
                                </option>
                                <option value="deadline-desc" className="bg-neutral-800 text-white">
                                    Deadline (Latest First)
                                </option>
                                <option value="numbered-first" className="bg-neutral-800 text-white">
                                    Numeric Goals First
                                </option>
                                <option value="unnumbered-first" className="bg-neutral-800 text-white">
                                    Non-Numeric Goals First
                                </option>
                            </select>
                            <ArrowUpDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                        </div>
                    )}

                    {goals.length > 0 && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-200 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                        >
                            <Plus size={20} />
                            Add Goal
                        </button>
                    )}
                </div>
            </div>

            {/* Add/Edit Goal Form */}
            {(showAddForm || editingGoal) && (
                <div className="bg-neutral-800/80 border border-neutral-700 rounded-xl p-6 shadow-lg mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        {editingGoal ? "Edit Goal" : "Create New Goal"}
                    </h2>
                    <form onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                    placeholder="What do you want to achieve?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Deadline</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                placeholder="Describe your goal in detail..."
                            />
                        </div>

                        {/* Só mostrar a checkbox na criação, não na edição */}
                        {!editingGoal && (
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isNumeric}
                                        onChange={(e) => setIsNumeric(e.target.checked)}
                                        className="rounded border-neutral-600 bg-neutral-900 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-neutral-300">Numeric goal (with target)</span>
                                </label>
                            </div>
                        )}

                        {/* Se for goal numérico (criação) ou se já existia como numérico (edição), mostrar campos numéricos */}
                        {(isNumeric || (editingGoal && editingGoal.isNumeric)) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Target *</label>
                                    <input
                                        type="number"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                        placeholder="10000"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Unit *</label>
                                    <input
                                        type="text"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                        placeholder="dollars, books, kg, miles..."
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200"
                            >
                                {editingGoal ? "Update Goal" : "Create Goal"}
                            </button>
                            <button
                                type="button"
                                onClick={editingGoal ? handleCancelEdit : () => setShowAddForm(false)}
                                className="px-6 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white font-semibold transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Goals List */}
            {goals.length === 0 ? (
                <div className="text-center py-16">
                    <Target size={64} className="mx-auto text-neutral-400 mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-4">No goals yet</h3>
                    <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                        Start by creating your first goal. Whether it's saving money, reading books, or learning a new skill, every journey begins with a single step.
                    </p>



                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-200"
                    >
                        <Plus size={20} />
                        Create your first goal
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {getSortedGoals().map((goal) => (
                        <div
                            key={goal.id}
                            className={`bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border p-6 shadow-lg transition-all duration-300 ${goal.state === "achieved"
                                ? "border-green-600/50 bg-green-900/20"
                                : goal.deadline && isOverdue(goal.deadline)
                                    ? "border-red-600/50 bg-red-900/20"
                                    : "border-neutral-700 hover:border-blue-600/50"
                                }`}
                        >
                            {/* Goal Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className={`text-lg font-semibold mb-2 ${goal.state === "achieved" ? "text-green-400 line-through" : "text-white"
                                        }`}>
                                        {goal.title}
                                    </h3>
                                    {goal.description && (
                                        <p className="text-sm text-neutral-400 mb-3">{goal.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {goal.state === "achieved" ? (
                                        <CheckCircle size={20} className="text-green-400" />
                                    ) : (
                                        <Circle size={20} className="text-neutral-400" />
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar for Numeric Goals */}
                            {goal.isNumeric && goal.target && (
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-neutral-400">Progress</span>
                                        <span className="text-sm text-neutral-400">
                                            {goal.current} / {goal.target} {goal.unit}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${goal.state === "achieved" ? "bg-green-500" : "bg-blue-500"
                                                }`}
                                            style={{ width: `${getProgressPercentage(goal)}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-neutral-500 mt-1">
                                        {getProgressPercentage(goal).toFixed(1)}% complete
                                    </div>
                                </div>
                            )}

                            {/* Goal Info */}
                            <div className="space-y-2 mb-4">
                                {goal.deadline && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar size={16} className="text-neutral-400" />
                                        <span className={`${isOverdue(goal.deadline) ? "text-red-400" : "text-neutral-400"
                                            }`}>
                                            {formatDeadline(goal.deadline)}
                                        </span>
                                    </div>
                                )}
                                {goal.isNumeric && (
                                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                                        <TrendingUp size={16} />
                                        <span>Numeric goal</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {goal.isNumeric && goal.state !== "achieved" && (
                                    <button
                                        onClick={() => {
                                            const newCurrent = prompt(
                                                `Update progress for "${goal.title}" (current: ${goal.current} ${goal.unit}):`
                                            );
                                            if (newCurrent !== null) {
                                                const num = parseFloat(newCurrent);
                                                if (!isNaN(num) && num >= 0) {
                                                    handleUpdateProgress(goal.id, num);
                                                } else {
                                                    toast.error("Please enter a valid number");
                                                }
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all duration-200"
                                    >
                                        Update Progress
                                    </button>
                                )}

                                {!goal.isNumeric && (
                                    <button
                                        onClick={() => handleToggleGoalState(goal)}
                                        className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all duration-200"
                                    >
                                        {goal.state === "achieved" ? "Mark In Progress" : "Mark Achieved"}
                                    </button>
                                )}

                                <button
                                    onClick={() => handleEditGoal(goal)}
                                    className="px-3 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white transition-all duration-200"
                                >
                                    <Edit size={16} />
                                </button>

                                {/* Botão de Reset para goals numéricos alcançados */}
                                {goal.isNumeric && goal.state === "achieved" && (
                                    <button
                                        onClick={() => handleResetGoal(goal)}
                                        className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-all duration-200"
                                        title="Reset goal to start over"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                )}

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200">
                                            <Trash2 size={16} />
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-neutral-800 text-white border border-neutral-700">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{goal.title}"? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-neutral-700 text-white border-neutral-600 hover:bg-neutral-600">
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}