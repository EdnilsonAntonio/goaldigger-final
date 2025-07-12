"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { MdOutlineRepeat } from "react-icons/md";
import { FaRegCalendarAlt } from "react-icons/fa";
import { IoWarningOutline } from "react-icons/io5";

// Definição das propriedades do formulário de edição de tarefa
type EditTaskFormProps = {
    taskId: string;
    title: string;
    description?: string;
    state?: string;
    repeat?: boolean;
    repeatInterval?: number;
    repeatUnit?: string;
    repeatDays?: string[];
    occurancy?: number;
    priority?: string;
    startDate: Date | null;
    endDate?: Date | null;
    onClose?: () => void;
    onTaskUpdated?: () => void;
};

// Componente de formulário de edição de tarefa
export default function EditTaskForm({
    taskId,
    title,
    description,
    state,
    repeat,
    repeatInterval,
    repeatUnit,
    repeatDays: initialRepeatDays = [],
    occurancy,
    priority = "none",
    startDate: initialStartDate,
    endDate: initialEndDate,
    onClose,
    onTaskUpdated,
}: EditTaskFormProps) {
    const { getToken } = useKindeBrowserClient();
    const router = useRouter();

    // Referências aos elementos do formulário
    const titleRef = useRef<HTMLInputElement>(null);
    const descRef = useRef<HTMLTextAreaElement>(null);
    const repeatIntervalRef = useRef<HTMLInputElement>(null);
    const repeatUnitRef = useRef<HTMLSelectElement>(null);
    const prioritySelectRef = useRef<HTMLSelectElement>(null);

    // Estados para controlar a exibição de datas e repetição
    const [showDates, setShowDates] = useState(!!initialStartDate || !!initialEndDate);
    const [showRepeat, setShowRepeat] = useState(!!repeat);
    const [showPriority, setShowPriority] = useState(priority !== "none");

    // Estados para controlar a exibição dos popovers de datas
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | null | undefined>(initialStartDate);
    const [endDate, setEndDate] = useState<Date | null | undefined>(initialEndDate);

    // Estados para controlar os dias da semana quando repeatUnit é 'week'
    const [repeatDays, setRepeatDays] = useState<string[]>(initialRepeatDays);
    const [currentRepeatUnit, setCurrentRepeatUnit] = useState<string>(repeatUnit || 'day');

    // Função para lidar com o envio do formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Previne o comportamento padrão do formulário

        // Obtém o token de autenticação
        const token = await getToken();
        if (!token || !taskId) return;

        // Obtém os valores atualizados do formulário
        const updatedTitle = titleRef.current?.value || "";
        const updatedDescription = descRef.current?.value || undefined;

        const updatedRepeat = showRepeat;
        const updatedRepeatInterval = updatedRepeat
            ? Number(repeatIntervalRef.current?.value)
            : undefined;
        const updatedRepeatUnit = updatedRepeat
            ? repeatUnitRef.current?.value
            : undefined;

        const updatedPriority = showPriority
            ? prioritySelectRef.current?.value
            : "none";

        if (!updatedTitle) {
            toast.error("Task title is required.");
            return;
        }

        try {
            const response = await fetch("/api/tasks", {
                method: "PUT",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    taskId,
                    title: updatedTitle,
                    description: updatedDescription,
                    state,
                    repeat: updatedRepeat,
                    repeatInterval: updatedRepeatInterval,
                    repeatUnit: updatedRepeatUnit,
                    occurences: Number(occurancy),
                    priority: updatedPriority,
                    startDate: showDates && startDate ? startDate.toISOString() : null,
                    endDate: showDates && endDate ? endDate.toISOString() : null,
                    repeatDays: updatedRepeatUnit === 'week' ? repeatDays : []
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update task');
            }

            // Notify parent component about successful update
            toast.success("Task updated successfully!");
            onTaskUpdated?.();
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error(`Failed to update task: ${error instanceof Error ? error.message : 'Please try again.'}`);
        }
    };

    const handleRepeatUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setCurrentRepeatUnit(newValue);
        if (newValue === 'week') {
            setShowRepeat(true);
        }
        setRepeatDays([]); // Reset days if unit changes
    };

    const handleDayToggle = (day: string) => {
        setRepeatDays((prev) =>
            prev.includes(day)
                ? prev.filter((d) => d !== day)
                : [...prev, day]
        );
    };

    // Função para lidar com a seleção da data de início
    const handleStartDateSelect = (date: Date | undefined) => {
        if (date) {
            setStartDate(date);

            // Se a nova data de início for posterior à data de fim atual, atualiza a data de fim
            if (endDate && date > endDate) {
                setEndDate(date);
            }
        }
    };

    // Função para lidar com a seleção da data de fim
    const handleEndDateSelect = (date: Date | undefined) => {
        if (date) {
            setEndDate(date);
            setTimeout(() => setEndDateOpen(false), 100);
        }
    };

    // Função para lidar com a mudança do checkbox de datas
    const handleShowDatesChange = (checked: boolean) => {
        setShowDates(checked);
        if (!checked) {
            // Clear dates when unchecking the box
            setStartDate(null);
            setEndDate(null);
            setStartDateOpen(false);
            setEndDateOpen(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
            {/* Title and Description */}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="title" className="text-sm font-medium text-neutral-300 mb-2 block">
                        Task Title *
                    </Label>
                    <input
                        ref={titleRef}
                        id="title"
                        placeholder="Enter task title..."
                        defaultValue={title}
                        className="w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    />
                </div>

                <div>
                    <Label htmlFor="description" className="text-sm font-medium text-neutral-300 mb-2 block">
                        Description
                    </Label>
                    <textarea
                        ref={descRef}
                        id="description"
                        placeholder="Enter task description (optional)..."
                        defaultValue={description}
                        className="w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 resize-none"
                        rows={3}
                    />
                </div>
            </div>

            {/* Configurações de datas */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="showDates"
                        checked={showDates}
                        onChange={(e) => handleShowDatesChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="showDates" className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                        <FaRegCalendarAlt className="text-blue-400" />
                        Set Dates
                    </Label>
                </div>

                {showDates && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-neutral-700/30 p-4 rounded-lg border border-neutral-600/30">
                        <div>
                            <Label className="text-sm font-medium text-neutral-300 mb-2 block">
                                Start Date
                            </Label>
                            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal border-neutral-600/50 bg-neutral-700/50 hover:bg-neutral-600/50 text-white"
                                    >
                                        {startDate ? format(startDate, "PPP") : "Select start date"}
                                        <FaRegCalendarAlt className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-600 text-white">
                                    <Calendar
                                        mode="single"
                                        selected={startDate ?? undefined}
                                        onSelect={handleStartDateSelect}
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
                            <Label className="text-sm font-medium text-neutral-300 mb-2 block">
                                End Date
                            </Label>
                            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal border-neutral-600/50 bg-neutral-700/50 hover:bg-neutral-600/50 text-white"
                                    >
                                        {endDate ? format(endDate, "PPP") : "Select end date"}
                                        <FaRegCalendarAlt className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-600 text-white">
                                    <Calendar
                                        mode="single"
                                        selected={endDate ?? undefined}
                                        onSelect={handleEndDateSelect}
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
                )}
            </div>

            {/* Configurações de repetição e prioridade */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4 min-w-0">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showRepeat"
                            checked={showRepeat}
                            onChange={(e) => setShowRepeat(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <Label htmlFor="showRepeat" className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                            <MdOutlineRepeat className="text-blue-400" />
                            Repeat Task
                        </Label>
                    </div>

                    {showRepeat && (
                        <div className="flex flex-col gap-3 bg-neutral-700/30 p-4 rounded-lg border border-neutral-600/30 min-w-0">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-neutral-300 whitespace-nowrap">Every</span>
                                    <input
                                        ref={repeatIntervalRef}
                                        type="number"
                                        min={1}
                                        defaultValue={repeatInterval}
                                        className="w-16 px-2 py-2 bg-neutral-700/50 border border-neutral-600/50 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                        placeholder="1"
                                    />
                                    <select
                                        ref={repeatUnitRef}
                                        defaultValue={repeatUnit}
                                        value={currentRepeatUnit}
                                        onChange={handleRepeatUnitChange}
                                        className="px-2 py-2 bg-neutral-700/50 border border-neutral-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs min-w-0 flex-1"
                                    >
                                        <option value="day">Day</option>
                                        <option value="week">Week</option>
                                        <option value="month">Month</option>
                                        <option value="year">Year</option>
                                    </select>
                                </div>
                            </div>
                            {currentRepeatUnit === 'week' && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                                        <label key={day} className={`px-3 py-1 rounded cursor-pointer border text-sm ${repeatDays.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-neutral-800 text-neutral-300 border-neutral-600'}`}>
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

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showPriority"
                            checked={showPriority}
                            onChange={(e) => setShowPriority(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <Label htmlFor="showPriority" className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                            <IoWarningOutline className="text-yellow-400" />
                            Set Priority
                        </Label>
                    </div>

                    {showPriority && (
                        <select
                            ref={prioritySelectRef}
                            defaultValue={priority}
                            className="w-full px-3 py-2 bg-neutral-700/50 border border-neutral-600/50 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Botão de envio */}
            <div className="flex gap-2 justify-end pt-6 border-t border-neutral-700/50">
                <Button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer bg-neutral-800 border border-neutral-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
