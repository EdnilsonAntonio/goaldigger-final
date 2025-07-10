"use client";

import { CheckCircle, Circle, ClipboardPlus, ListPlus, SquarePen, Trash2, ChevronDown, ChevronUp, Wind, CloudHail, CloudLightning, EllipsisVertical, CircleDashed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AddTaskForm from "./AddTaskForm";
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

    const handleTasksUpdate = () => {
        setTasksUpdated(prev => !prev);
    };

    interface TasksList {
        id: string;
        title: string;
        tasks: Task[];
    }

    interface Task {
        tasksListId: string | null;
        id: string;
        title: string;
        state: "done" | "undone";
        description?: string;
        priority?: string;
        occurancy: number;
        startDate?: string;
        endDate?: string;
        repeat?: boolean;
        repeatInterval?: number;
        repeatUnit?: string;
        repeatDays?: string[];
    }

    // --- TASKS LISTS ---

    // Fetch tasks lists
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
    };

    // Add tasks list
    const handleAddList = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = tasksListTitle.current?.value || "";

        if (!userId) {
            alert("userId is required!");
            return;
        }

        if (!title) {
            alert("Title is required!");
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

            alert("Task list created Successfully!");
            fetchTasksLists();
        } catch (error) {
            console.error(error);
            alert("Error creating the tasks list")
        }
    }
    // Edit tasks list
    const handleEditList = async (tasksListId: string) => {
        const title = tasksListNewTitle.current?.value || "";

        if (!title) {
            alert("Title is required!");
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

            alert("Task list updated successfully!");
            fetchTasksLists();
            setEditDialogOpen(false); // Close the dialog
        } catch (error) {
            console.error(error);
            alert("Error updating the tasks list")
        }
    }

    // Delete tasks list
    const deleteTasksList = async (tasksListId: string) => {
        if (!tasksListId) {
            alert("task list id is required");
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
            alert("Task list successfully deleted");
            fetchTasksLists();
        } catch (error) {
            console.error(error);
            alert("Failed to delete tasks list");
        }
    }

    // Reset progress (completion)
    const resetProgress = async (tasksListId: string, tasks: Task[]) => {
        if (!tasksListId) {
            alert("tasks list id is required!");
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
            alert("Progress reset");
            fetchTasksLists();
        } catch (error) {
            console.error(error);
            alert("Error reseting the list progress");
        }
    }

    // --- TASKS ---

    // Delete task
    const handleDeleteTask = async (taskId: string) => {
        if (!taskId) {
            alert("taskId is required");
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

    // Change task state
    const handleChangeTaskState = async (taskId: string, state: "done" | "undone") => {
        if (!taskId) {
            alert("taskId is required");
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

    // Change AddTaskForm visibility
    const showAddTaskForm = (listId: string) => {
        setAddTaskFormVisibleId(prev => prev === listId ? null : listId);
    };

    // Change the AddTasksList visibility
    const showAddTasksListForm = () => {
        showAddTasksList ? setShowAddtasksList(false) : setShowAddtasksList(true);
    }


    const AddTasksListForm = () => {
        return (
            <form onSubmit={handleAddList} className={`mt-4 mb-8 w-full max-w-2xl ${!showAddTasksList ? "hidden" : ""} bg-neutral-800/80 border border-neutral-700 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-center gap-4 transition-all duration-200`}>
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

    const EditTasksListForm = () => {
        return (
            <div className="mt-4 mb-8 w-full max-w-2xl bg-neutral-800/80 border border-neutral-700 rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-center gap-4 transition-all duration-200">
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

    function getTaskPriority(priority?: string) {
        if (priority === "none" || null) return null;

        if (priority === "high") {
            return (
                <span className="flex gap-2 ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-red-800/60 text-red-200 border border-red-600">
                    <CloudLightning size={16} />  {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
                </span>
            );
        }
        if (priority === "medium") {
            return (
                <span className="flex gap-2 ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-800/60 text-yellow-200 border border-yellow-600">
                    <CloudHail size={16} />  {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
                </span>
            );
        }
        if (priority === "low") {
            return (
                <span className="flex gap-2 ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-green-800/60 text-green-200 border border-green-600">
                    <Wind size={16} /> {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
                </span>
            );
        }
    }

    function getTaskStartDate(startDate?: string) {
        if (!startDate) return null;
        return (
            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-800/60 text-green-200 border border-green-600">
                Start: {new Date(startDate).toLocaleDateString()}
            </span>
        );
    }

    function getTaskEndDate(endDate?: string) {
        if (!endDate) return null;
        return (
            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-purple-800/60 text-purple-200 border border-purple-600">
                End: {new Date(endDate).toLocaleDateString()}
            </span>
        );
    }

    function getTaskRepeat(task: Task) {
        if (!task.repeat) return null;
        return (
            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-yellow-800/60 text-yellow-200 border border-yellow-600">
                Repeats: every {task.repeatInterval || 1} {task.repeatUnit}
                {task.repeatUnit === "week" && task.repeatDays && task.repeatDays.length > 0
                    ? ` on ${task.repeatDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}`
                    : ""}
            </span>
        );
    }

    function getListCompletion(tasks: Task[]) {
        if (!tasks.length) return 0;
        const done = tasks.filter(t => t.state === "done").length;
        return Math.round((done / tasks.length) * 100);
    }

    useEffect(() => {
        if (!userId) {
            alert("userId is required");
            return;
        }

        fetchTasksLists();
    }, [userId, tasksUpdated]);



    return (
        <div className="flex flex-col items-center justify-center p-4 w-full">
            <div className="flex items-center justify-between w-full max-w-2xl mb-6">
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
            <ul className="flex flex-col gap-8 w-full max-w-2xl">
                {tasksLists.map((tasksList) => (
                    <li
                        key={tasksList.id}
                        className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 shadow-lg hover:border-blue-600 transition-all duration-300 w-full"
                    >
                        {/* Progress Bar */}
                        <div className="w-full mb-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-neutral-400">Progress</span>
                                <span className="text-xs text-neutral-400">{getListCompletion(tasksList.tasks)}%</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${getListCompletion(tasksList.tasks)}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xl font-semibold text-white flex items-center gap-2">
                                {tasksList.title}
                            </span>
                            <div className="flex items-center">
                                <span
                                    onClick={() => showAddTaskForm(tasksList.id)}
                                    className="inline-flex items-center gap-1 text-blue-400 cursor-pointer hover:text-blue-300 text-sm font-medium px-2 py-1 rounded transition-all duration-150"
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
                                                            and remove it's data from our servers.
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
                        />
                        {/* Tasks  */}
                        <ul className="divide-y divide-neutral-700 mt-4">
                            {tasksList.tasks.length === 0 && (
                                <li className="text-neutral-400 text-sm py-4 text-center">No tasks in this list yet.</li>
                            )}
                            {tasksList.tasks.map((task) => (
                                <li
                                    key={task.id}
                                    className="flex flex-col py-3 group hover:bg-neutral-800/70 rounded transition-all duration-150 px-2"
                                >
                                    {/* Main content */}
                                    <div className="flex items-center justify-between w-full">
                                        <span className="flex items-center gap-2">
                                            <button
                                                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                                className="focus:outline-none"
                                                aria-label={expandedTaskId === task.id ? 'Collapse' : 'Expand'}
                                            >
                                                {expandedTaskId === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            {getTaskState(task.id, task.state)}
                                            <span className={task.state === "done" ? "line-through text-neutral-400" : "text-white"}>{task.title}</span>
                                            {getTaskPriority(task.priority)}
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
                                                        occurancy={task.occurancy}
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
                                            <Trash2 className="cursor-pointer hover:text-red-500" size={16} onClick={() => handleDeleteTask(task.id)} />
                                        </span>
                                    </div>
                                    {/* Expanded content */}
                                    {expandedTaskId === task.id && (
                                        <div className="mt-2 ml-8 flex flex-col gap-2">
                                            {task.description && (
                                                <div className="text-base text-neutral-200 whitespace-pre-line">
                                                    {task.description}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {getTaskStartDate(task.startDate)}
                                                {getTaskEndDate(task.endDate)}
                                                {getTaskRepeat(task)}
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
}