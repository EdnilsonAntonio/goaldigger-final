"use client";

import * as React from "react"
import { format } from "date-fns";
import { CalendarFold, ChevronDownIcon, Repeat, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRef, useState } from "react";
import { toast } from "sonner";

type AddTaskFormProps = {
    userId: string;
    tasksListId: string;
    visible: boolean;
    onTaskCreated?: () => void;
    onClose?: () => void;
    currentTaskCount?: number;
    fontSizes?: {
        title: string;
        subtitle: string;
        taskTitle: string;
        taskDescription: string;
        badge: string;
    };
}

export default function AddTaskForm({ userId, tasksListId, visible, onTaskCreated, onClose, currentTaskCount = 0, fontSizes }: AddTaskFormProps) {
    // Estados para controlar a abertura dos campos de data, repetição e prioridade
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    const [repeatOpen, setRepeatOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);
    // Estados para armazenar as inforamações de data, repetição e prioridade
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [repeatDays, setRepeatDays] = useState<string[]>([]);

    // Função para controlar a abertura da opção de repetição
    const handleRepeatOpen = () => {
        if (repeatRef.current?.checked) {
            setRepeatOpen(true);
        } else {
            setRepeatOpen(false);
        }
    };

    // Função para controlar a abertura da opção de prioridade
    const handlePriorityOpen = () => {
        if (priorityRef.current?.checked) {
            setPriorityOpen(true);
        } else {
            setPriorityOpen(false);
        }
    };

    // Função para controlar a mudança da unidade de repetição
    // Se a unidade for "week", abre a opção de repetição e limpa os dias de repetição
    const handleRepeatUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === 'week') {
            setRepeatOpen(true);
        }
        setRepeatDays([]); // Reset days if unit changes
    };

    // Função para controlar a seleção de dias de repetição
    // Se o dia já estiver selecionado, remove-o, caso contrário, adiciona-o
    const handleDayToggle = (day: string) => {
        setRepeatDays((prev) =>
            prev.includes(day)
                ? prev.filter((d) => d !== day)
                : [...prev, day]
        );
    };

    // Referências para os campos do formulário
    const taskTitleRef = useRef<HTMLInputElement>(null);
    const taskDescriptionRef = useRef<HTMLTextAreaElement>(null);
    const repeatRef = useRef<HTMLInputElement>(null);
    const repeatIntervalRef = useRef<HTMLInputElement>(null);
    const repeatUnitRef = useRef<HTMLSelectElement>(null);
    const priorityRef = useRef<HTMLInputElement>(null);
    const prioritySelectRef = useRef<HTMLSelectElement>(null);

    // Função para lidar com o envio do formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Impede que a página recarregue, comportamento padrão do HTML

        // // Obtém o token do usuário
        // const token = await getToken();
        // if (!token) return;

        // Obtém os valores dos campos do formulário
        const title = taskTitleRef.current?.value || "";
        const description = taskDescriptionRef.current?.value || undefined;
        const repeat = repeatRef.current?.checked ?? false;
        const repeatInterval = repeat ? Number(repeatIntervalRef.current?.value) : undefined;
        const repeatUnit = repeat ? repeatUnitRef.current?.value : undefined;
        const priorityExist = priorityRef.current?.checked ?? false;
        const priority = priorityExist ? prioritySelectRef.current?.value : undefined;

        // Verifica se o título da tarefa está vazio
        if (!title) {
            toast.error("Task title is required!");
            return;
        }

        // Build body with only non-empty fields
        const body: any = {
            userId,
            tasksListId,
            title,
            order: currentTaskCount,
        };
        if (description) body.description = description;
        if (repeat) body.repeat = repeat;
        if (repeatInterval !== undefined) body.repeatInterval = repeatInterval;
        if (repeatUnit) body.repeatUnit = repeatUnit;
        if (repeatDays && repeatDays.length > 0) body.repeatDays = repeatDays;
        if (priority) body.priority = priority;
        if (startDate) body.startDate = startDate.toISOString();
        if (endDate) body.endDate = endDate.toISOString();

        // Tenta criar a tarefa
        try {
            await fetch("/api/tasks", {
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify(body)
            })

            // Exibe uma mensagem de sucesso
            toast.success("Task created successfully!");

            // Reseta o formulário
            if (taskTitleRef.current) taskTitleRef.current.value = "";
            if (taskDescriptionRef.current) taskDescriptionRef.current.value = "";
            setStartDate(undefined);
            setEndDate(undefined);
            setStartDateOpen(false);
            setEndDateOpen(false);
            setRepeatOpen(false);
            setPriorityOpen(false);
            setRepeatDays([]);
            if (repeatRef.current) repeatRef.current.checked = false;
            if (priorityRef.current) priorityRef.current.checked = false;
            if (onTaskCreated) onTaskCreated();
            if (onClose) onClose();
        } catch (error) {
            // Exibe uma mensagem de erro
            toast.error("Failed to create task. Please try again.");
        }
    };

    if (!visible) return null;

    // Default font sizes if not provided
    const defaultFontSizes = {
        title: "text-lg sm:text-xl",
        subtitle: "text-sm sm:text-base",
        taskTitle: "text-sm sm:text-base",
        taskDescription: "text-sm sm:text-base",
        badge: "text-xs"
    };

    const finalFontSizes = fontSizes || defaultFontSizes;

    // Retorna o formulário
    return (
        <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 sm:p-6 border-b border-neutral-700/50">
                <h3 className={`${finalFontSizes.title} font-semibold text-white`}>Create New Task</h3>
                <p className={`text-neutral-400 mt-1 ${finalFontSizes.subtitle}`}>Add a new task to your list</p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Título e Descrição */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="title" className={`${finalFontSizes.subtitle} font-medium text-neutral-300 mb-2 block`}>
                            Task Title *
                        </Label>
                        <input
                            ref={taskTitleRef}
                            id="title"
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 ${finalFontSizes.taskTitle}`}
                            type="text"
                            placeholder="Enter task title..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="description" className={`${finalFontSizes.subtitle} font-medium text-neutral-300 mb-2 block`}>
                            Description
                        </Label>
                        <textarea
                            ref={taskDescriptionRef}
                            id="description"
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none ${finalFontSizes.taskDescription}`}
                            placeholder="Enter task description (optional)..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Configurações de Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label className={`${finalFontSizes.subtitle} font-medium text-neutral-300 mb-2 block`}>
                            Start Date
                        </Label>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start text-left font-normal border-neutral-600/50 bg-neutral-700/50 hover:bg-neutral-600/50 text-white ${finalFontSizes.taskTitle} px-3 sm:px-4 py-2 sm:py-3`}
                                >
                                    {startDate ? format(startDate, "PPP") : "Select start date"}
                                    <CalendarFold className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-600 text-white">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    disabled={(date) => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const d = new Date(date);
                                        d.setHours(0, 0, 0, 0);
                                        return d < today;
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div>
                        <Label className={`${finalFontSizes.subtitle} font-medium text-neutral-300 mb-2 block`}>
                            End Date
                        </Label>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start text-left font-normal border-neutral-600/50 bg-neutral-700/50 hover:bg-neutral-600/50 text-white ${finalFontSizes.taskTitle} px-3 sm:px-4 py-2 sm:py-3`}
                                >
                                    {endDate ? format(endDate, "PPP") : "Select end date"}
                                    <CalendarFold className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-600 text-white">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            setEndDate(date);
                                            setTimeout(() => setEndDateOpen(false), 100);
                                        }
                                    }}
                                    disabled={(date) => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const d = new Date(date);
                                        d.setHours(0, 0, 0, 0);
                                        return d < today || (startDate ? d < startDate : false);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Configurações de Repetição e Prioridade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="showRepeat"
                                ref={repeatRef}
                                onChange={handleRepeatOpen}
                                className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <Label htmlFor="showRepeat" className={`${finalFontSizes.subtitle} font-medium text-neutral-300 flex items-center gap-2`}>
                                <Repeat className="text-blue-400" />
                                <span className={finalFontSizes.subtitle}>Repeat Task</span>
                            </Label>
                        </div>

                        {repeatOpen && (
                            <div className="flex flex-col gap-2 bg-neutral-700/30 p-3 sm:p-4 rounded-lg border border-neutral-600/30">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <span className={`${finalFontSizes.subtitle} text-neutral-300 whitespace-nowrap`}>Every</span>
                                    <input
                                        ref={repeatIntervalRef}
                                        type="number"
                                        min={1}
                                        defaultValue={1}
                                        className={`w-12 sm:w-14 px-2 py-1 sm:py-2 bg-neutral-700/50 border border-neutral-600/50 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${finalFontSizes.badge} flex-shrink-0`}
                                        placeholder="1"
                                    />
                                    <select
                                        ref={repeatUnitRef}
                                        defaultValue="day"
                                        onChange={handleRepeatUnitChange}
                                        className={`px-2 sm:px-3 py-1 sm:py-2 bg-neutral-700/50 border border-neutral-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${finalFontSizes.badge} min-w-0 flex-1`}
                                    >
                                        <option value="day">Day(s)</option>
                                        <option value="week">Week(s)</option>
                                        <option value="month">Month(s)</option>
                                        <option value="year">Year(s)</option>
                                    </select>
                                </div>
                                {repeatUnitRef.current?.value === 'week' && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                                            <label key={day} className={`px-2 py-1 rounded cursor-pointer border ${repeatDays.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-neutral-800 text-neutral-300 border-neutral-600'} ${finalFontSizes.badge}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={repeatDays.includes(day)}
                                                    onChange={() => handleDayToggle(day)}
                                                    className="mr-1"
                                                />
                                                {day.charAt(0).toUpperCase() + day.slice(1)}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="showPriority"
                                ref={priorityRef}
                                onChange={handlePriorityOpen}
                                className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <Label htmlFor="showPriority" className={`${finalFontSizes.subtitle} font-medium text-neutral-300 flex items-center gap-2`}>
                                <TriangleAlert className="text-yellow-400" />
                                <span className={finalFontSizes.subtitle}>Set Priority</span>
                            </Label>
                        </div>

                        {priorityOpen && (
                            <select
                                ref={prioritySelectRef}
                                defaultValue="high"
                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-neutral-700/50 border border-neutral-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${finalFontSizes.taskTitle}`}
                            >
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Botão de Envio */}
                <div className="flex justify-end gap-3 pt-4 sm:pt-6 border-t border-neutral-700/50">
                    <Button
                        type="button"
                        onClick={() => {
                            // Reseta o formulário
                            if (taskTitleRef.current) taskTitleRef.current.value = "";
                            if (taskDescriptionRef.current) taskDescriptionRef.current.value = "";
                            setStartDate(undefined);
                            setEndDate(undefined);
                            setStartDateOpen(false);
                            setEndDateOpen(false);
                            setRepeatOpen(false);
                            setPriorityOpen(false);
                            setRepeatDays([]);
                            if (repeatRef.current) repeatRef.current.checked = false;
                            if (priorityRef.current) priorityRef.current.checked = false;
                            // Fecha o formulário
                            if (onClose) onClose();
                        }}
                        variant="outline"
                        className={`border-neutral-600/50 bg-neutral-700/50 hover:bg-neutral-600/50 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 ${finalFontSizes.taskTitle} w-full sm:w-auto`}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
                    >
                        Create Task
                    </Button>
                </div>
            </form>
        </div>
    );
}