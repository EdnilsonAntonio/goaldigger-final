"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Target,
    CheckCircle,
    Circle,
    Plus,
    Edit,
    Trash2,
    TrendingUp,
    Clock,
    RotateCcw,
    ArrowUpDown,
    CalendarDays,
    Hash,
    Goal
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
import { useUserId, useUserPlan } from "@/components/providers/UserProvider";

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
    const userId = useUserId()

    
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
            const response = await fetch("/api/goals", {
                headers: {
                    "Content-Type": "application/json",
                    ...(userId ? { "userId": userId } : {}),
                },
            });

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
                    ...(userId ? { "userId": userId } : {}),
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
                    ...(userId ? { "userId": userId } : {}),
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
                    ...(userId ? { "userId": userId } : {}),
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
                    ...(userId ? { "userId": userId } : {}),
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
                    ...(userId ? { "userId": userId } : {}),
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
                    ...(userId ? { "userId": userId } : {}),
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
        if (userId) {
            fetchGoals();
        } else {
            setLoading(false);
        }
    }, [userId]);

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
        <main className="min-h-screen bg-neutral-900 text-white p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
                        <Goal className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">Your Goals</h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Track your progress and achieve your dreams. Set clear targets, monitor your journey, and celebrate every milestone.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto">
                {/* Controls Section - Only show when goals exist */}
                {goals.length > 0 && (
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 mb-8 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mr-3">
                                    <ArrowUpDown className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Manage Goals</h2>
                                    <p className="text-sm text-gray-400">Sort and organize your goals</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-neutral-700/50 border border-neutral-600 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 cursor-pointer min-w-48"
                                    >
                                        <option value="default">Default (Creation Date)</option>
                                        <option value="deadline-asc">Deadline (Earliest First)</option>
                                        <option value="deadline-desc">Deadline (Latest First)</option>
                                        <option value="numbered-first">Numeric Goals First</option>
                                        <option value="unnumbered-first">Non-Numeric Goals First</option>
                                    </select>
                                    <ArrowUpDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none" />
                                </div>
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200"
                                >
                                    <Plus size={18} />
                                    Add Goal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add/Edit Goal Form */}
                {(showAddForm || editingGoal) && (
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl mb-8">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mr-3">
                                {editingGoal ? <Edit className="w-5 h-5 text-purple-400" /> : <Plus className="w-5 h-5 text-purple-400" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    {editingGoal ? "Edit Goal" : "Create New Goal"}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {editingGoal ? "Update your goal details" : "Set a new target to achieve"}
                                </p>
                            </div>
                        </div>
                        <form onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                                        placeholder="What do you want to achieve?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Deadline</label>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none"
                                    placeholder="Describe your goal in detail..."
                                />
                            </div>
                            {!editingGoal && (
                                <div className="flex items-center gap-2 p-4 rounded-lg bg-neutral-700/30 border border-neutral-600">
                                    <input
                                        type="checkbox"
                                        checked={isNumeric}
                                        onChange={(e) => setIsNumeric(e.target.checked)}
                                        className="rounded border-neutral-600 bg-neutral-900 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-300">Numeric goal (with measurable target)</span>
                                    <Hash size={16} className="text-gray-400" />
                                </div>
                            )}
                            {(isNumeric || (editingGoal && editingGoal.isNumeric)) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Target *</label>
                                        <input
                                            type="number"
                                            value={target}
                                            onChange={(e) => setTarget(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                                            placeholder="10000"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Unit *</label>
                                        <input
                                            type="text"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
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

                {/* Goals List or Empty State */}
                {goals.length === 0 ? (
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-12 text-center hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600/20 rounded-full mb-6">
                            <Target size={40} className="text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">No goals yet</h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {getSortedGoals().map((goal) => (
                            <div
                                key={goal.id}
                                className={`bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border p-6 shadow-xl transition-all duration-300 hover:shadow-2xl ${goal.state === "achieved"
                                    ? "border-green-600/50 bg-green-900/10 hover:border-green-500/70"
                                    : goal.deadline && isOverdue(goal.deadline)
                                        ? "border-red-600/50 bg-red-900/10 hover:border-red-500/70"
                                        : "border-neutral-700 hover:border-neutral-600"
                                    }`}
                            >
                                {/* Goal Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {goal.state === "achieved" ? (
                                                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                                            ) : (
                                                <Circle size={20} className="text-neutral-400 flex-shrink-0" />
                                            )}
                                            {goal.isNumeric && <Hash size={16} className="text-blue-400 flex-shrink-0" />}
                                        </div>
                                        <h3 className={`text-lg font-semibold mb-2 break-words ${goal.state === "achieved" ? "text-green-400 line-through" : "text-white"
                                            }`}>
                                            {goal.title}
                                        </h3>
                                        {goal.description && (
                                            <p className="text-sm text-gray-400 mb-3 leading-relaxed break-words">{goal.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar for Numeric Goals */}
                                {goal.isNumeric && goal.target && (
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-400">Progress</span>
                                            <span className="text-sm text-gray-400 font-mono">
                                                {goal.current} / {goal.target} {goal.unit}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${goal.state === "achieved" ? "bg-green-500" : "bg-blue-500"
                                                    }`}
                                                style={{ width: `${getProgressPercentage(goal)}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-neutral-500 mt-1 font-semibold">
                                            {getProgressPercentage(goal).toFixed(1)}% complete
                                        </div>
                                    </div>
                                )}

                                {/* Goal Info */}
                                <div className="space-y-2 mb-4">
                                    {goal.deadline && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <CalendarDays size={16} className="text-neutral-400 flex-shrink-0" />
                                            <span className={`${isOverdue(goal.deadline) ? "text-red-400 font-semibold" : "text-gray-400"
                                                }`}>
                                                {formatDeadline(goal.deadline)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Clock size={16} className="flex-shrink-0" />
                                        <span>Created {new Date(goal.createdAt).toLocaleDateString()}</span>
                                    </div>
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
                                            <TrendingUp size={14} className="inline mr-1" />
                                            Update
                                        </button>
                                    )}
                                    {!goal.isNumeric && (
                                        <button
                                            onClick={() => handleToggleGoalState(goal)}
                                            className={`flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 ${goal.state === "achieved"
                                                ? "bg-orange-600 hover:bg-orange-700"
                                                : "bg-green-600 hover:bg-green-700"
                                                }`}
                                        >
                                            {goal.state === "achieved" ? (
                                                <>
                                                    <RotateCcw size={14} className="inline mr-1" />
                                                    Restart
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={14} className="inline mr-1" />
                                                    Complete
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEditGoal(goal)}
                                        className="px-3 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white transition-all duration-200"
                                        title="Edit goal"
                                    >
                                        <Edit size={16} />
                                    </button>
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
                                            <button
                                                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                                                title="Delete goal"
                                            >
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

            {/* Features Section */}
            <div className="max-w-7xl mx-auto mt-16">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Why Set Goals?</h2>
                    <p className="text-gray-400">Transform your dreams into achievable milestones</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Target className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Clear Direction</h3>
                        <p className="text-gray-400 text-sm">Set specific targets and track your journey towards success</p>
                    </div>
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Track Progress</h3>
                        <p className="text-gray-400 text-sm">Monitor your advancement and celebrate every milestone</p>
                    </div>
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Achieve More</h3>
                        <p className="text-gray-400 text-sm">Turn your aspirations into reality with structured planning</p>
                    </div>
                </div>
            </div>
        </main>
    );
}