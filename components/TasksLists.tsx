"use client";

import React from "react";
import { CheckCircle, Circle, ClipboardPlus, ListPlus, SquarePen, Trash2, ChevronDown, ChevronUp, Wind, CloudHail, CloudLightning, EllipsisVertical, CircleDashed, GripVertical, ArrowDownUp, CalendarArrowUp, CalendarArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AddTaskForm from "./AddTaskForm";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import EditTaskForm from "./EditTaskForm";
import { getNextResetDay } from "@/lib/utils";

export function AlertDialogDemo() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline">Show Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default function TasksLists({ userId }: { userId: string }) {
    const [tasksLists, setTasksLists] = useState<TasksList[]>([]);
    const [addTaskFormVisibleId, setAddTaskFormVisibleId] = useState<string | null>(null);
    const [tasksUpdated, setTasksUpdated] = useState(false);
    const [showAddTasksList, setShowAddtasksList] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTaskDialogOpen, setEditTaskDialogOpen] = useState<string | null>(null);

    const tasksListTitle = useRef<HTMLInputElement>(null);
    const tasksListNewTitle = useRef<HTMLInputElement>(null);

    // Atualizar listas de tarefas imediatamente após criar uma tarefa
    const handleTasksUpdate = async () => {
        await fetchTasksLists();
    };

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end for tasks within a list
    const handleTaskDragEnd = async (event: DragEndEvent, tasksListId: string) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setTasksLists((prevLists) => {
                return prevLists.map((list) => {
                    if (list.id === tasksListId) {
                        const oldIndex = list.tasks.findIndex((task) => task.id === active.id);
                        const newIndex = list.tasks.findIndex((task) => task.id === over?.id);

                        const newTasks = arrayMove(list.tasks, oldIndex, newIndex);

                        // Save the new order to the database
                        const taskOrders = newTasks.map((task, index) => ({
                            taskId: task.id,
                            order: index
                        }));

                        // Update the database
                        fetch("/api/tasks", {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ tasksListId, taskOrders }),
                        }).catch((error) => {
                            console.error("Error updating task order:", error);
                        });

                        return {
                            ...list,
                            tasks: newTasks,
                        };
                    }
                    return list;
                });
            });
        }
    };

    // Handle drag end for lists
    const handleListDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setTasksLists((prevLists) => {
                const oldIndex = prevLists.findIndex((list) => list.id === active.id);
                const newIndex = prevLists.findIndex((list) => list.id === over?.id);

                const newLists = arrayMove(prevLists, oldIndex, newIndex);

                // Save the new order to the database
                const listOrders = newLists.map((list, index) => ({
                    listId: list.id,
                    order: index
                }));

                // Update the database
                fetch("/api/tasksLists", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ listOrders }),
                }).catch((error) => {
                    console.error("Error updating list order:", error);
                });

                return newLists;
            });
        }
    };

    // Sortable Task Component
    const SortableTask = ({ task, tasksListId, fontSizes }: { task: Task; tasksListId: string; fontSizes: any }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: task.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <li
                ref={setNodeRef}
                style={style}
                className="flex flex-col py-3 group hover:bg-neutral-800/70 rounded transition-all duration-150 px-2"
            >
                {/* Main content */}
                <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-neutral-700/50 rounded transition-colors duration-150"
                        >
                            <GripVertical size={16} className="text-neutral-400" />
                        </div>
                        <button
                            onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                            className="focus:outline-none"
                            aria-label={expandedTaskId === task.id ? 'Collapse' : 'Expand'}
                        >
                            {expandedTaskId === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {getTaskState(task.id, task.state)}
                        {getTaskTitle(task, fontSizes.taskTitle)}
                        {getTaskPriority(task.priority, fontSizes.badge, tasksLists.length === 1)}
                        {getDueStatus(task.endDate ?? null, task.state, fontSizes.badge)}
                    </span>
                    {/* Action buttons */}
                    <span className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-all duration-150">
                        <AlertDialog open={editTaskDialogOpen === task.id} onOpenChange={(open) => setEditTaskDialogOpen(open ? task.id : null)}>
                            <AlertDialogTrigger asChild>
                                <SquarePen size={16} className="cursor-pointer hover:text-blue-400" />
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-neutral-800 text-white border border-neutral-700 w-full" style={{ maxWidth: '50vw' }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Edit task</AlertDialogTitle>
                                </AlertDialogHeader>
                                <EditTaskForm
                                    taskId={task.id} title={task.title} description={task.description} state={task.state}
                                    repeat={task.repeat}
                                    repeatInterval={task.repeatInterval}
                                    repeatUnit={task.repeatUnit}
                                    repeatDays={task.repeatDays}
                                    occurences={task.occurences}
                                    priority={task.priority}
                                    startDate={task.startDate ? new Date(task.startDate) : null}
                                    endDate={task.endDate ? new Date(task.endDate) : null}
                                    onClose={() => setEditTaskDialogOpen(null)}
                                    onTaskUpdated={() => {
                                        handleTasksUpdate();
                                        setEditTaskDialogOpen(null);
                                    }}
                                />
                            </AlertDialogContent>
                        </AlertDialog>
                        <Trash2
                            className="cursor-pointer hover:text-red-500"
                            size={16}
                            onClick={() => handleDeleteTask(task.id)}
                        />
                    </span>
                </div>
                {/* Expanded content */}
                {expandedTaskId === task.id && (
                    <div className="mt-2 ml-8 flex flex-col gap-2">
                        {getTaskDescription(task, fontSizes.taskDescription)}
                        <div className="flex flex-wrap gap-2 mt-1">
                            {task.startDate && (
                                <span className={`inline-block px-2 py-1 rounded-full ${fontSizes.badge} font-semibold bg-neutral-700/60 text-neutral-300 border border-neutral-600`}>
                                    Start: {formatDate(task.startDate)}
                                </span>
                            )}
                            {task.endDate && (
                                <span className={`inline-block px-2 py-1 rounded-full ${fontSizes.badge} font-semibold bg-neutral-700/60 text-neutral-300 border border-neutral-600`}>
                                    End: {formatDate(task.endDate)}
                                </span>
                            )}
                            {getTaskRepeat(task, fontSizes.badge)}
                            {typeof task.occurences === 'number' && task.occurences > 0 && (
                                <span className={`inline-block px-2 py-1 rounded-full ${fontSizes.badge} font-semibold bg-purple-800/60 text-purple-200 border border-purple-600 ml-2`}>
                                    {`Occurrences left: ${task.occurences}`}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </li>
        );
    };

    // Calculate dynamic width based on number of lists
    const getListWidth = () => {
        const listCount = tasksLists.length;
        if (listCount === 1) return "w-full";
        if (listCount === 2) return "w-1/2";
        return "w-1/2"; // For 3+ lists, keep at 1/2 width to enable scrolling
    };

    // Calculate dynamic font sizes based on number of lists
    const getFontSizes = () => {
        const listCount = tasksLists.length;
        if (listCount === 1) {
            return {
                title: "text-xl",
                subtitle: "text-sm",
                taskTitle: "text-base",
                taskDescription: "text-sm",
                badge: "text-xs"
            };
        }
        // For 2+ lists
        return {
            title: "text-lg",
            subtitle: "text-xs",
            taskTitle: "text-sm",
            taskDescription: "text-xs",
            badge: "text-xs"
        };
    };

    // Sortable List Component
    const SortableList = ({ tasksList }: { tasksList: TasksList }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: tasksList.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        const fontSizes = getFontSizes();

        return (
            <li
                ref={setNodeRef}
                style={style}
                className={`bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 shadow-lg hover:border-blue-600 transition-all duration-300 ${getListWidth()} min-w-[350px] flex-shrink-0`}
            >
                {/* Drag Handle for List */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-2 hover:bg-neutral-700/50 rounded transition-colors duration-150 mb-4 flex items-center gap-2 text-neutral-400"
                >
                    <GripVertical size={16} />
                    <span className="text-sm font-medium">Drag to reorder list</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className={`${fontSizes.subtitle} text-neutral-400`}>Progress</span>
                        <span className={`${fontSizes.subtitle} text-neutral-400`}>{getListCompletion(tasksList.tasks)}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${getListCompletion(tasksList.tasks)}%` }}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <span className={`${fontSizes.title} font-semibold text-white flex items-center gap-2`}>
                        {tasksList.title}
                    </span>
                    <div className="flex items-center">
                        <span
                            onClick={() => showAddTaskForm(tasksList.id)}
                            className={`inline-flex items-center gap-1 text-blue-400 cursor-pointer hover:text-blue-300 ${fontSizes.subtitle} font-medium px-2 py-1 rounded transition-all duration-150`}
                        >
                            <ListPlus size={18} /> Add Task
                        </span>
                        {/* List Menu */}
                        <Popover>
                            <PopoverTrigger>
                                <EllipsisVertical size={18} className="cursor-pointer" />
                            </PopoverTrigger>
                            <PopoverContent className="bg-neutral-800 text-white border border-neutral-700">
                                <ul>
                                    {/* Reset progress */}
                                    <li onClick={() => { resetProgress(tasksList.id, tasksList.tasks) }} className="cursor-pointer flex items-center gap-2 hover:bg-neutral-700 px-2 py-1 rounded">
                                        <CircleDashed size={16} /> Reset progress
                                    </li>
                                    {/* Sort by prioriry */}
                                    <li onClick={() => { sortTasksByPriority(tasksList.id) }} className="cursor-pointer flex items-center gap-2 hover:bg-neutral-700 px-2 py-1 rounded">
                                        <ArrowDownUp size={16} /> Sort by priority
                                    </li>
                                    {/* Sort by end date */}
                                    <li onClick={() => { sortTasksByEndDate(tasksList.id) }} className="cursor-pointer flex items-center gap-2 hover:bg-neutral-700 px-2 py-1 rounded">
                                        <CalendarArrowUp size={16} /> Sort by end date
                                    </li>
                                    {/* Sort by start date */}
                                    <li onClick={() => { sortTasksByStartDate(tasksList.id) }} className="cursor-pointer flex items-center gap-2 hover:bg-neutral-700 px-2 py-1 rounded">
                                        <CalendarArrowDown size={16} /> Sort by start date
                                    </li>
                                    {/* Edit list name */}
                                    <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                                        <AlertDialogTrigger className="w-full">
                                            <li className="cursor-pointer flex items-center gap-2 hover:bg-neutral-700 px-2 py-1 rounded">
                                                <SquarePen size={16} /> Edit list name
                                            </li>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-neutral-800 text-white border border-neutral-700 w-full max-w-4xl" style={{ maxWidth: '70vw' }}>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2"><SquarePen size={16} /> Edit list name</AlertDialogTitle>
                                                <EditTasksListForm />
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={(e) => { e.preventDefault(); handleEditList(tasksList.id); }} className="cursor-pointer bg-white text-black">Edit</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    {/* Delete list */}
                                    <AlertDialog>
                                        <AlertDialogTrigger className="w-full">
                                            <li className="cursor-pointer flex items-center gap-2 text-red-700 hover:bg-red-400 px-2 py-1 rounded">
                                                <Trash2 size={16} /> Delete list
                                            </li>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-neutral-800 text-white border border-neutral-700">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your list
                                                    and remove it's tasks.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => { deleteTasksList(tasksList.id) }} className="cursor-pointer bg-white text-black">Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </ul>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <AddTaskForm
                    userId={userId}
                    tasksListId={tasksList.id}
                    visible={addTaskFormVisibleId === tasksList.id}
                    onTaskCreated={handleTasksUpdate}
                    onClose={() => setAddTaskFormVisibleId(null)}
                    currentTaskCount={tasksList.tasks.length}
                    fontSizes={fontSizes}
                />
                {/* Tasks  */}
                <ul className="divide-y divide-neutral-700 mt-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleTaskDragEnd(event, tasksList.id)}
                    >
                        <SortableContext
                            items={tasksList.tasks.map(task => task.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {tasksList.tasks.length === 0 && (
                                <li className="text-neutral-400 text-sm py-4 text-center">No tasks in this list yet.</li>
                            )}
                            {tasksList.tasks.map((task) => (
                                <SortableTask key={task.id} task={task} tasksListId={tasksList.id} fontSizes={fontSizes} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </ul>
            </li>
        );
    };

    interface TasksList {
        id: string;
        title: string;
        order: number;
        tasks: Task[];
    }

    interface Task {
        tasksListId: string | null;
        id: string;
        title: string;
        state: "done" | "undone";
        description?: string;
        priority?: string;
        occurences: number;
        order: number;
        startDate?: string;
        endDate?: string;
        repeat?: boolean;
        repeatInterval?: number;
        repeatUnit?: string;
        repeatDays?: string[];
        updatedAt?: string; // Added updatedAt field
        resetDay?: string; // Added resetDay field
    }

    // --- TASKS LISTS ---

    // Obter as listas de tarefas
    const fetchTasksLists = async () => {
        const response = await fetch(`/api/tasksLists`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "userId": userId,
            },
        });
        const data = await response.json();
        setTasksLists(data);
        return data;
    };

    // Adicionar uma lista de tarefa
    const handleAddList = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = tasksListTitle.current?.value || "";

        if (!userId) {
            toast.error("User ID is required!");
            return;
        }

        if (!title) {
            toast.error("Title is required!");
            return;
        }

        try {
            await fetch("/api/tasksLists", {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({ userId, title })
            })

            toast.success("Task list created successfully!");
            fetchTasksLists();
            setShowAddtasksList(false); // <-- aqui
        } catch (error) {
            console.error(error);
            toast.error("Error creating the tasks list")
        }
    }
    // Editar uma lista de tarefa
    const handleEditList = async (tasksListId: string) => {
        const title = tasksListNewTitle.current?.value || "";

        if (!title) {
            toast.error("Title is required!");
            return;
        }

        try {
            await fetch("/api/tasksLists", {
                method: "PUT",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({ tasksListId, title })
            })

            toast.success("Task list updated successfully!");
            fetchTasksLists();
            setEditDialogOpen(false); // Close the dialog
        } catch (error) {
            console.error(error);
            toast.error("Error updating the tasks list")
        }
    }

    // Apagar uma lista de tarefa
    const deleteTasksList = async (tasksListId: string) => {
        if (!tasksListId) {
            toast.error("Task list ID is required");
            return;
        }

        try {
            await fetch("/api/tasksLists", {
                method: "DELETE",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({ tasksListId })
            });
            toast.success("Task list successfully deleted");
            fetchTasksLists();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete tasks list");
        }
    }

    // Resetar o progresso de uma lista de tarefa
    const resetProgress = async (tasksListId: string, tasks: Task[]) => {
        if (!tasksListId) {
            toast.error("Tasks list ID is required!");
            return;
        }

        const state = "undone"

        try {
            for (let index = 0; index < tasks.length; index++) {
                await fetch("/api/tasks", {
                    method: "PUT",
                    headers: {
                        "Content-type": "application/json"
                    },
                    body: JSON.stringify({ taskId: tasks[index].id, state })
                })
            }
            toast.success("Progress reset successfully");
            fetchTasksLists();
        } catch (error) {
            console.error(error);
            toast.error("Error resetting the list progress");
        }
    }

    // Sort tasks by priority
    const sortTasksByPriority = async (tasksListId: string) => {
        setTasksLists((prevLists) => {
            return prevLists.map((list) => {
                if (list.id === tasksListId) {
                    // Sort: high > medium > low > none/null/undefined
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    const sortedTasks = [...list.tasks].sort((a, b) => {
                        const aVal = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
                        const bVal = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
                        return aVal - bVal;
                    });
                    // Update order in backend
                    const taskOrders = sortedTasks.map((task, index) => ({
                        taskId: task.id,
                        order: index
                    }));
                    fetch("/api/tasks", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tasksListId, taskOrders }),
                    }).catch(console.error);
                    return { ...list, tasks: sortedTasks };
                }
                return list;
            });
        });
    };

    // Sort tasks by end date (soonest first, nulls last)
    const sortTasksByEndDate = async (tasksListId: string) => {
        setTasksLists((prevLists) => {
            return prevLists.map((list) => {
                if (list.id === tasksListId) {
                    const sortedTasks = [...list.tasks].sort((a, b) => {
                        if (!a.endDate && !b.endDate) return 0;
                        if (!a.endDate) return 1;
                        if (!b.endDate) return -1;
                        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
                    });
                    const taskOrders = sortedTasks.map((task, index) => ({
                        taskId: task.id,
                        order: index
                    }));
                    fetch("/api/tasks", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tasksListId, taskOrders }),
                    }).catch(console.error);
                    return { ...list, tasks: sortedTasks };
                }
                return list;
            });
        });
    };

    // Sort tasks by start date (soonest first, nulls last)
    const sortTasksByStartDate = async (tasksListId: string) => {
        setTasksLists((prevLists) => {
            return prevLists.map((list) => {
                if (list.id === tasksListId) {
                    const sortedTasks = [...list.tasks].sort((a, b) => {
                        if (!a.startDate && !b.startDate) return 0;
                        if (!a.startDate) return 1;
                        if (!b.startDate) return -1;
                        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                    });
                    const taskOrders = sortedTasks.map((task, index) => ({
                        taskId: task.id,
                        order: index
                    }));
                    fetch("/api/tasks", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tasksListId, taskOrders }),
                    }).catch(console.error);
                    return { ...list, tasks: sortedTasks };
                }
                return list;
            });
        });
    };

    // --- TASKS ---

    // Apagar uma tarefa
    const handleDeleteTask = async (taskId: string) => {
        if (!taskId) {
            toast.error("Task ID is required");
            console.error("taskId is required");
            return;
        }

        try {
            await fetch("/api/tasks", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ taskId }),
            });
            fetchTasksLists();
        } catch (error) {
            console.error(error);
        }

    }

    // Mudar o estado de uma tarefa
    const handleChangeTaskState = async (taskId: string, state: "done" | "undone") => {
        if (!taskId) {
            toast.error("Task ID is required");
            console.error("taskId is required");
            return;
        }

        const newState = state === "done" ? "undone" : "done";

        try {
            await fetch("/api/tasks", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ taskId, state: newState }),
            });
            fetchTasksLists();
        } catch (error) {
            console.error(error);
        }
    }

    // Mostrar o formulário de adição de tarefa
    const showAddTaskForm = (listId: string) => {
        setAddTaskFormVisibleId(prev => prev === listId ? null : listId);
    };

    // Mostrar o formulário de adição de lista de tarefas
    const showAddTasksListForm = () => {
        showAddTasksList ? setShowAddtasksList(false) : setShowAddtasksList(true);
    }

    // Formulário de adição de listas de tarefas
    const AddTasksListForm = () => {
        return (
            <form onSubmit={handleAddList} className={`mt-4 mb-8 w-full max-w-7xl ${!showAddTasksList ? "hidden" : ""} bg-neutral-800/80 border border-neutral-700 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-center gap-4 transition-all duration-200`}>
                <input
                    ref={tasksListTitle}
                    type="text"
                    placeholder="List title..."
                    className="flex-1 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-base"
                />
                <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-200 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                    Add list
                </button>
            </form>
        )
    }

    // Formulário de edição de listas de tarefas
    const EditTasksListForm = () => {
        return (
            <div className="mt-4 mb-8 w-full max-w-7xl bg-neutral-800/80 border border-neutral-700 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-center gap-4 transition-all duration-200">
                <input
                    ref={tasksListNewTitle}
                    type="text"
                    placeholder="New name..."
                    className="flex-1 px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-base"
                />
            </div>
        )
    }

    // --- OBTER INFORMAÇÕES DA TASK FORA DA RENDERIZAÇÃO ---

    // Obter o título da tarefa
    function getTaskTitle(task: Task, fontSize: string = "text-base") {
        if (!task.title) return null;

        return (
            <span className={`${task.state === "done" ? "line-through text-neutral-400" : "text-white"} ${fontSize}`}>
                {task.title}
            </span>
        )
    }

    // Obter a descrição da tarefa
    function getTaskDescription(task: Task, fontSize: string = "text-base") {
        if (!task.description) return null;

        return (
            <div className={`${fontSize} text-neutral-200 whitespace-pre-line`}>
                {task.description}
            </div>
        )
    }

    // Obter o estado da tarefa
    function getTaskState(taskId: string, state: string,): any {
        switch (state) {
            case "undone":
                return <Circle
                    className="text-gray-400 cursor-pointer hover:text-blue-400 transition-colors duration-200 text-xl"
                    onClick={() => { handleChangeTaskState(taskId, state) }}
                />;
            case "done":
                return <CheckCircle
                    className="text-green-400 cursor-pointer hover:text-green-300 transition-colors duration-200 text-xl"
                    onClick={() => { handleChangeTaskState(taskId, state) }}
                />;
            default:
                return null;
        }
    }

    // Obter a prioridade da tarefa
    function getTaskPriority(priority?: string, fontSize: string = "text-xs", showText: boolean = true) {
        if (priority === "none" || null) return null;

        if (priority === "high") {
            return (
                <span className={`flex gap-2 ml-2 px-2 py-1 rounded-full ${fontSize} font-semibold bg-red-800/60 text-red-200 border border-red-600`}>
                    <CloudLightning size={16} />
                    {showText && ` ${priority.charAt(0).toUpperCase() + priority.slice(1)} priority`}
                </span>
            );
        }
        if (priority === "medium") {
            return (
                <span className={`flex gap-2 ml-2 px-2 py-1 rounded-full ${fontSize} font-semibold bg-yellow-800/60 text-yellow-200 border border-yellow-600`}>
                    <CloudHail size={16} />
                    {showText && ` ${priority.charAt(0).toUpperCase() + priority.slice(1)} priority`}
                </span>
            );
        }
        if (priority === "low") {
            return (
                <span className={`flex gap-2 ml-2 px-2 py-1 rounded-full ${fontSize} font-semibold bg-green-800/60 text-green-200 border border-green-600`}>
                    <Wind size={16} />
                    {showText && ` ${priority.charAt(0).toUpperCase() + priority.slice(1)} priority`}
                </span>
            );
        }
    }

    // Obter as repetições da tarefa
    function getTaskRepeat(task: Task, fontSize: string = "text-xs") {
        if (!task.repeat) return null;

        let repeatText = "";

        if (task.repeatUnit === "week") {
            repeatText = getWeeklyRepeatDescription(task.repeatDays);
        } else if (task.repeatInterval && task.repeatUnit) {
            const interval = task.repeatInterval > 1 ? `${task.repeatInterval} ${task.repeatUnit}s` : task.repeatUnit;
            repeatText = `Repeats every ${interval}`;
        } else {
            repeatText = "Repeats";
        }

        return (
            <span className={`inline-block px-2 py-1 rounded-full ${fontSize} font-semibold bg-neutral-700/60 text-neutral-300 border border-neutral-600`}>
                {repeatText}
            </span>
        );
    }

    // Obter o progresso da lista
    function getListCompletion(tasks: Task[]) {
        if (!tasks.length) return 0;
        const done = tasks.filter(t => t.state === "done").length;
        return Math.round((done / tasks.length) * 100);
    }

    // Verificar se a tarefa está vencida
    function getDueStatus(endDateString: string | null, state: string, fontSize: string = "text-xs"): React.ReactElement | null {
        if (!endDateString) return null;

        const endDate = new Date(endDateString);
        const today = new Date();

        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

        if (diffDays < 0 && state !== "done") {
            return (
                <span className={`inline-block px-2 py-1 rounded-full ${fontSize} font-semibold bg-red-800/60 text-red-200 border border-red-600`}>
                    Overdue by {Math.abs(diffDays)} day{Math.abs(diffDays) > 1 ? "s" : ""}
                </span>
            );
        } else if (diffDays < 7) {
            return (
                <span className={`inline-block px-2 py-1 rounded-full ${fontSize} font-semibold bg-orange-800/60 text-orange-200 border border-orange-600`}>
                    Due in {diffDays} day{diffDays > 1 ? "s" : ""}
                </span>
            );
        }

        return null;
    }

    // Formatação de data da tarefa
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);

        // Verifica se a data é hoje
        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        // Verifica se a data é amanhã
        const isTomorrow = date.getDate() === tomorrow.getDate() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getFullYear() === tomorrow.getFullYear();

        // Se a data for hoje, retorna "Today"
        if (isToday) return "Today";

        // Se a data for amanhã, retorna "Tomorrow"
        if (isTomorrow) return "Tomorrow";

        // Se a data for no ano atual, retorna o dia da semana, dia e mês
        if (date.getFullYear() === now.getFullYear()) {
            const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            return `${weekday}, ${day}/${month}`;
        }
        return date.toLocaleDateString("en-US");
    };

    // Verifica se a tarefa é repetida nos dias úteis ou finais de semana e retorna a descrição
    function getWeeklyRepeatDescription(repeatDays: string[] | undefined) {
        // Se não houver dias de repetição, retorna "Repeats every week"
        if (!repeatDays || repeatDays.length === 0) return "Repeats every week";

        // Define os dias da semana e os fins de semana
        const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
        const weekends = ["saturday", "sunday"];
        const allDays = [...weekdays, ...weekends];

        // Ordena os dias de repetição
        const sorted = [...repeatDays].sort((a, b) => allDays.indexOf(a) - allDays.indexOf(b));

        // Se os dias de repetição forem todos os dias da semana, retorna "Repeats every weekday"
        if (sorted.length === 5 && weekdays.every(d => sorted.includes(d))) {
            return "Repeats every weekday";
        }

        // Se os dias de repetição forem todos os fins de semana, retorna "Repeats every weekend"
        if (sorted.length === 2 && weekends.every(d => sorted.includes(d))) {
            return "Repeats every weekend";
        }

        // Se os dias de repetição forem um conjunto personalizado, retorna a descrição dos dias de repetição
        return (
            "Repeats every " +
            sorted
                .map(
                    (d) => d.charAt(0).toUpperCase() + d.slice(1)
                )
                .join(", ")
        );
    }

    // Atualiza tarefas repetitivas ao abrir o app usando resetDay
    const updateRepeatingTasks = async (lists: TasksList[], overrideToday?: Date) => {
        const today = overrideToday || new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');

        for (const list of lists) {
            for (const task of list.tasks) {
                if (!task.repeat || !task.resetDay) continue;
                // Comparar apenas ano, mês e dia
                const resetDate = new Date(task.resetDay);
                resetDate.setHours(0, 0, 0, 0);
                const resetStr = resetDate.getFullYear() + '-' +
                    String(resetDate.getMonth() + 1).padStart(2, '0') + '-' +
                    String(resetDate.getDate()).padStart(2, '0');
                if (resetStr === todayStr && task.state === "done") {
                    // Calcular próximo resetDay
                    const nextResetDay = getNextResetDay({
                        repeatUnit: task.repeatUnit,
                        repeatInterval: task.repeatInterval,
                        repeatDays: task.repeatDays,
                        startDate: task.startDate,
                        endDate: task.endDate,
                        occurences: (typeof task.occurences === 'number' && task.occurences > 0)
                            ? task.occurences - 1
                            : task.occurences,
                        updatedAt: today,
                    }, today);
                    // Atualizar tarefa via API
                    await fetch("/api/tasks", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            taskId: task.id,
                            state: "undone",
                            occurences: (typeof task.occurences === 'number' && task.occurences > 0)
                                ? task.occurences - 1
                                : task.occurences,
                            resetDay: nextResetDay ? nextResetDay.toISOString() : null,
                        })
                    });
                }
            }
        }
    }

    useEffect(() => {
        if (!userId) {
            toast.error("User ID is required");
            return;
        }

        fetchTasksLists().then((data) => {
            setTasksLists(data);
            // Só chama updateRepeatingTasks se for a primeira renderização do dia
            const lastResetDate = typeof window !== 'undefined' ? localStorage.getItem('lastRepeatingTasksReset') : null;
            const today = new Date();
            // const todayStr = today.toISOString().slice(0, 10); // yyyy-mm-dd (UTC)
            const todayStr = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0'); // yyyy-mm-dd (local)
            if (lastResetDate !== todayStr) {
                updateRepeatingTasks(data).then(() => {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('lastRepeatingTasksReset', todayStr);
                    }
                    fetchTasksLists(); // Atualiza listas após reset
                });
            }
        });
    }, [userId]);

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full">
            <div className="flex items-center justify-between w-full max-w-7xl mb-6">
                <h2 className="text-2xl font-bold text-white text-center">Your Task Lists</h2>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-200 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={showAddTasksListForm}
                >
                    <ClipboardPlus size={18} />
                    <span>Add a new tasks list</span>
                </button>
            </div>
            <AddTasksListForm />
            {/* Tasks Lists */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleListDragEnd}
            >
                <SortableContext
                    items={tasksLists.map(list => list.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <ul className={`flex gap-8 w-full ${tasksLists.length > 1 ? 'overflow-x-auto' : 'overflow-x-hidden'} pb-4 scrollbar-thin scrollbar-thumb-neutral-500 scrollbar-track-neutral-800 hover:scrollbar-thumb-neutral-400`}>
                        {tasksLists.map((tasksList) => (
                            <SortableList key={tasksList.id} tasksList={tasksList} />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>
        </div>
    );
}