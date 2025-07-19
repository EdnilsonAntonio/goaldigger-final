"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Timer, ListTodo, Settings, AlarmClockCheck } from "lucide-react";

declare global {
    interface Window {
        __POMODORO_OPTS?: {
            FOCUS_TIME: number;
            SHORT_BREAK: number;
            LONG_BREAK: number;
            FOCUS_BEFORE_LONG: number;
            ALARM_SOUND: string;
            TICKING: boolean;
        };
    }
}

const FOCUS_TIME = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes
const FOCUS_BEFORE_LONG = 4;

const MODES = [
    { key: "focus", label: "Focus Time", duration: FOCUS_TIME },
    { key: "short", label: "Short Break", duration: SHORT_BREAK },
    { key: "long", label: "Long Break", duration: LONG_BREAK },
];

// Alarm list in English
const ALARM_SOUNDS = [
    { label: "Kitchen Timer", value: "/audios/alarm sounds/kitchen timer.mp3" },
    { label: "Bell", value: "/audios/alarm sounds/bell.mp3" },
    { label: "Digital", value: "/audios/alarm sounds/digital.mp3" },
    { label: "Birds", value: "/audios/alarm sounds/birds.mp3" },
];

// Tipo para PomoTask
type PomoTask = {
    id: string;
    title: string;
    notes?: string;
    estPomodoros: number;
    state: "done" | "undone";
};

function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// Função para tocar o áudio de mudança de modo
function playModeChangeSound() {
    const audio = new Audio("/audios/alarm sounds/kitchen timer.mp3");
    audio.play();
}

export default function PomodoroPage() {
    const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
    const [timer, setTimer] = useState(FOCUS_TIME);
    const [isRunning, setIsRunning] = useState(false);
    const [focusCount, setFocusCount] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    // Referência para o áudio de tick
    const tickingAudioRef = useRef<HTMLAudioElement | null>(null);
    // Referência para o áudio de tick rápido
    const fastTickingAudioRef = useRef<HTMLAudioElement | null>(null);

    // Opções customizáveis
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [focusInput, setFocusInput] = useState(25);
    const [shortInput, setShortInput] = useState(5);
    const [longInput, setLongInput] = useState(15);
    const [intervalInput, setIntervalInput] = useState(FOCUS_BEFORE_LONG);
    const [alarmSound, setAlarmSound] = useState(ALARM_SOUNDS[0].value);
    const [tickingEnabled, setTickingEnabled] = useState(true);

    // Estado para tarefas Pomodoro
    const [tasks, setTasks] = useState<PomoTask[]>([]);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [newTask, setNewTask] = useState({ title: "", notes: "", estPomodoros: 1 });
    const [loadingTasks, setLoadingTasks] = useState(false);

    // Estado para opções atuais (usar em vez das constantes)
    const [currentOptions, setCurrentOptions] = useState({
        FOCUS_TIME: FOCUS_TIME,
        SHORT_BREAK: SHORT_BREAK,
        LONG_BREAK: LONG_BREAK,
        FOCUS_BEFORE_LONG: FOCUS_BEFORE_LONG,
        ALARM_SOUND: ALARM_SOUNDS[0].value,
        TICKING: true,
    });

    // Carregar opções do localStorage ao iniciar
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedOptions = localStorage.getItem("pomodoro-options");
            if (savedOptions) {
                const parsed = JSON.parse(savedOptions);

                // Detectar se os valores estão em segundos (valores antigos) ou minutos (valores novos)
                const isOldFormat = parsed.FOCUS_TIME < 100; // Se focus time < 100, provavelmente está em minutos (antigo)

                setCurrentOptions(parsed);
                // Atualizar também os inputs do formulário
                if (isOldFormat) {
                    // Valores antigos em minutos, converter para segundos
                    setFocusInput(parsed.FOCUS_TIME);
                    setShortInput(parsed.SHORT_BREAK);
                    setLongInput(parsed.LONG_BREAK);
                    // Atualizar currentOptions para segundos
                    const updatedOptions = {
                        ...parsed,
                        FOCUS_TIME: parsed.FOCUS_TIME * 60,
                        SHORT_BREAK: parsed.SHORT_BREAK * 60,
                        LONG_BREAK: parsed.LONG_BREAK * 60,
                    };
                    setCurrentOptions(updatedOptions);
                    localStorage.setItem("pomodoro-options", JSON.stringify(updatedOptions));
                } else {
                    // Valores novos em segundos
                    setFocusInput(parsed.FOCUS_TIME / 60);
                    setShortInput(parsed.SHORT_BREAK / 60);
                    setLongInput(parsed.LONG_BREAK / 60);
                }
                setIntervalInput(parsed.FOCUS_BEFORE_LONG);
                setAlarmSound(parsed.ALARM_SOUND);
                setTickingEnabled(parsed.TICKING);
            } else {
                // Se não há opções salvas, usar os valores padrão
                setCurrentOptions({
                    FOCUS_TIME: FOCUS_TIME,
                    SHORT_BREAK: SHORT_BREAK,
                    LONG_BREAK: LONG_BREAK,
                    FOCUS_BEFORE_LONG: FOCUS_BEFORE_LONG,
                    ALARM_SOUND: ALARM_SOUNDS[0].value,
                    TICKING: true,
                });
            }
        }
    }, []);

    // Função para tocar o áudio de mudança de modo (usar opção atual)
    function playModeChangeSound() {
        const audio = new Audio(currentOptions.ALARM_SOUND);
        audio.play();
    }

    // Troca de modo automático
    useEffect(() => {
        if (timer === 0) {
            playModeChangeSound();
            if (mode === "focus") {
                if (focusCount + 1 === currentOptions.FOCUS_BEFORE_LONG) {
                    setMode("long");
                    setTimer(currentOptions.LONG_BREAK);
                    setFocusCount(0);
                    setIsRunning(true);
                } else {
                    setMode("short");
                    setTimer(currentOptions.SHORT_BREAK);
                    setFocusCount((c) => c + 1);
                    setIsRunning(true);
                }
            } else {
                setMode("focus");
                setTimer(currentOptions.FOCUS_TIME);
                setIsRunning(true);
            }
        }
        // eslint-disable-next-line
    }, [timer, currentOptions]);

    // Timer effect
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimer((t) => {
                    if (t > 0) {
                        // Toca o som de tick normal ou rápido (só se habilitado)
                        if (currentOptions.TICKING) {
                            if (t === 5) {
                                // Pausa o ticking normal se estiver tocando
                                if (tickingAudioRef.current) {
                                    tickingAudioRef.current.pause();
                                    tickingAudioRef.current.currentTime = 0;
                                }
                                if (fastTickingAudioRef.current) {
                                    fastTickingAudioRef.current.currentTime = 0;
                                    fastTickingAudioRef.current.play();
                                }
                            } else if (t > 5) {
                                if (tickingAudioRef.current) {
                                    tickingAudioRef.current.currentTime = 0;
                                    tickingAudioRef.current.play();
                                }
                            }
                        }
                        return t - 1;
                    }
                    return 0;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Pausa o áudio de tick imediatamente ao pausar o timer
            if (tickingAudioRef.current) {
                tickingAudioRef.current.pause();
                tickingAudioRef.current.currentTime = 0;
            }
            if (fastTickingAudioRef.current) {
                fastTickingAudioRef.current.pause();
                fastTickingAudioRef.current.currentTime = 0;
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, currentOptions.TICKING]);

    // Buscar tarefas
    const fetchTasks = useCallback(async () => {
        setLoadingTasks(true);
        const res = await fetch("/api/pomotasks");
        const data = await res.json();
        setTasks(data);
        setLoadingTasks(false);
    }, []);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // Adicionar tarefa
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;
        await fetch("/api/pomotasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask),
        });
        setNewTask({ title: "", notes: "", estPomodoros: 1 });
        fetchTasks();
    };

    // Selecionar tarefa ativa
    const activeTask = tasks.find(t => t.id === activeTaskId) || null;

    // Decrementar pomodoros ao final do long break
    useEffect(() => {
        if (timer === 0 && mode === "long" && activeTask && activeTask.state === "undone") {
            fetch("/api/pomotasks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: activeTask.id, decrement: true }),
            }).then(fetchTasks);
        }
        // eslint-disable-next-line
    }, [timer, mode]);

    // Marcar tarefa como done manualmente
    const handleMarkDone = async (id: string) => {
        await fetch("/api/pomotasks", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, state: "done" }),
        });
        fetchTasks();
    };

    // Deletar tarefa
    const handleDeleteTask = async (id: string) => {
        await fetch("/api/pomotasks", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        if (activeTaskId === id) setActiveTaskId(null);
        fetchTasks();
    };

    // Aplicar opções ao salvar
    const handleSaveOptions = () => {
        setMode("focus");
        setIsRunning(false);
        setFocusCount(0);
        const newOptions = {
            FOCUS_TIME: Number(focusInput) * 60,
            SHORT_BREAK: Number(shortInput) * 60,
            LONG_BREAK: Number(longInput) * 60,
            FOCUS_BEFORE_LONG: Number(intervalInput),
            ALARM_SOUND: alarmSound,
            TICKING: tickingEnabled,
        };
        setCurrentOptions(newOptions);
        setTimer(newOptions.FOCUS_TIME);
        // Salvar no localStorage
        localStorage.setItem("pomodoro-options", JSON.stringify(newOptions));
        setOptionsOpen(false);
    };

    // Troca manual de modo
    const handleModeChange = (newMode: "focus" | "short" | "long") => {
        setMode(newMode);
        setIsRunning(false);
        if (newMode === "focus") setTimer(currentOptions.FOCUS_TIME);
        if (newMode === "short") setTimer(currentOptions.SHORT_BREAK);
        if (newMode === "long") setTimer(currentOptions.LONG_BREAK);
    };

    const handleStartPause = () => setIsRunning((r) => !r);
    const handleReset = () => {
        setIsRunning(false);
        if (mode === "focus") setTimer(currentOptions.FOCUS_TIME);
        if (mode === "short") setTimer(currentOptions.SHORT_BREAK);
        if (mode === "long") setTimer(currentOptions.LONG_BREAK);
    };

    return (
        <main className="min-h-screen bg-neutral-900 text-white p-6">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
                        <AlarmClockCheck className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">Pomodoro Timer</h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Boost your productivity with focused work sessions. Set tasks, track progress, and maintain your rhythm with our customizable Pomodoro timer.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Pomodoro Tasks Card */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center mr-3">
                                <ListTodo className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Pomodoro Tasks</h2>
                                <p className="text-sm text-gray-400">Manage your focus sessions</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                            Create tasks with estimated pomodoros. Track your progress and stay focused on what matters most.
                        </p>
                        <div className="space-y-4">
                            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Task title*"
                                    value={newTask.title}
                                    onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                                    className="flex-1 px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Notes (optional)"
                                    value={newTask.notes}
                                    onChange={e => setNewTask(t => ({ ...t, notes: e.target.value }))}
                                    className="flex-1 px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="Pomodoros"
                                    value={newTask.estPomodoros}
                                    onChange={e => setNewTask(t => ({ ...t, estPomodoros: Number(e.target.value) }))}
                                    className="w-28 px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    required
                                />
                                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200">Add</button>
                            </form>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {loadingTasks && <div className="text-gray-400 text-center py-4">Loading...</div>}
                                {tasks.length === 0 && !loadingTasks && <div className="text-gray-400 text-center py-4">No tasks yet. Create your first task to get started!</div>}
                                {tasks.map(task => (
                                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${task.state === "done" ? "border-green-600/50 bg-green-900/20" : "border-neutral-600 bg-neutral-700/30 hover:bg-neutral-700/50"}`}>
                                        <input
                                            type="radio"
                                            checked={activeTaskId === task.id}
                                            onChange={() => setActiveTaskId(task.id)}
                                            disabled={task.state === "done"}
                                            className="accent-blue-600"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-semibold truncate ${task.state === "done" ? "line-through text-green-400" : "text-white"}`}>{task.title}</div>
                                            {task.notes && <div className="text-xs text-gray-400 truncate">{task.notes}</div>}
                                            <div className="text-xs text-gray-400">Pomodoros: {task.state === "done" ? "Done" : task.estPomodoros}</div>
                                        </div>
                                        <div className="flex gap-1">
                                            {task.state !== "done" && (
                                                <button onClick={() => handleMarkDone(task.id)} className="text-xs px-2 py-1 rounded bg-green-700 text-white hover:bg-green-600 transition-all duration-200">Done</button>
                                            )}
                                            <button onClick={() => handleDeleteTask(task.id)} className="text-xs px-2 py-1 rounded bg-red-700 text-white hover:bg-red-600 transition-all duration-200">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timer Card */}
                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 p-6 hover:border-neutral-600 transition-all duration-300 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mr-3">
                                <Timer className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Timer</h2>
                                <p className="text-sm text-gray-400">Focus & breaks</p>
                            </div>
                        </div>
                        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                            Stay focused with customizable work sessions and breaks. Track your progress and maintain productivity.
                        </p>

                        {/* Botão de opções */}
                        <div className="flex justify-end mb-4">
                            <AlertDialog open={optionsOpen} onOpenChange={setOptionsOpen}>
                                <AlertDialogTrigger asChild>
                                    <button className="px-3 py-2 rounded-lg bg-neutral-700 text-white font-semibold hover:bg-blue-600 transition-all duration-200 text-sm">Options</button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-neutral-800 text-white border border-neutral-700">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Pomodoro Settings</AlertDialogTitle>
                                        <AlertDialogDescription>Customize your focus experience.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <form className="flex flex-col gap-4 mt-4">
                                        <div className="grid grid-cols-3 gap-2">
                                            <label className="flex-1">Focus Time (min)
                                                <input type="number" min={1} value={focusInput} onChange={e => setFocusInput(Number(e.target.value))} className="w-full mt-1 px-2 py-1 rounded bg-neutral-700 border border-neutral-600 text-white" />
                                            </label>
                                            <label className="flex-1">Short Break (min)
                                                <input type="number" min={1} value={shortInput} onChange={e => setShortInput(Number(e.target.value))} className="w-full mt-1 px-2 py-1 rounded bg-neutral-700 border border-neutral-600 text-white" />
                                            </label>
                                            <label className="flex-1">Long Break (min)
                                                <input type="number" min={1} value={longInput} onChange={e => setLongInput(Number(e.target.value))} className="w-full mt-1 px-2 py-1 rounded bg-neutral-700 border border-neutral-600 text-white" />
                                            </label>
                                        </div>
                                        <label>Long break interval
                                            <input type="number" min={1} value={intervalInput} onChange={e => setIntervalInput(Number(e.target.value))} className="w-full mt-1 px-2 py-1 rounded bg-neutral-700 border border-neutral-600 text-white" />
                                        </label>
                                        <label>Alarm sound
                                            <select value={alarmSound} onChange={e => setAlarmSound(e.target.value)} className="w-full mt-1 px-2 py-1 rounded bg-neutral-700 border border-neutral-600 text-white">
                                                {ALARM_SOUNDS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={tickingEnabled} onChange={e => setTickingEnabled(e.target.checked)} />
                                            Enable ticking sound
                                        </label>
                                    </form>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSaveOptions}>Save</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        {/* Timer Display */}
                        <div className="flex flex-col items-center bg-neutral-700/30 rounded-xl p-6 border border-neutral-600">
                            {/* Progresso da tarefa ativa */}
                            {activeTask && (
                                <div className="mb-4 text-center">
                                    <div className="text-white font-semibold text-sm">Current Task:</div>
                                    <div className="text-lg text-blue-300 font-bold truncate">{activeTask.title}</div>
                                    <div className="text-xs text-gray-400">Pomodoros left: {activeTask.state === "done" ? 0 : activeTask.estPomodoros}</div>
                                </div>
                            )}

                            {/* Mode Buttons */}
                            <div className="flex gap-2 mb-4">
                                {MODES.map((m) => (
                                    <button
                                        key={m.key}
                                        onClick={() => handleModeChange(m.key as any)}
                                        className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none
                                            ${mode === m.key ? "bg-blue-600 text-white" : "bg-neutral-700 text-gray-300 hover:bg-neutral-600"}`}
                                    >
                                        {m.key === "focus" ? "Focus" : m.key === "short" ? "Short" : "Long"}
                                    </button>
                                ))}
                            </div>

                            {/* Timer Display */}
                            <span className="text-5xl font-mono font-bold text-white mb-4">{formatTime(timer)}</span>

                            {/* Control Buttons */}
                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={handleStartPause}
                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all duration-200"
                                >
                                    {isRunning ? "Pause" : "Start"}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-2 rounded-lg bg-neutral-700 text-white font-semibold shadow hover:bg-neutral-600 transition-all duration-200"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Status Info */}
                            <div className="text-gray-400 text-sm text-center">
                                {mode === "focus" && <span>Focus sessions before long break: <b>{currentOptions.FOCUS_BEFORE_LONG - focusCount}</b></span>}
                                {mode === "short" && <span>Short break! Next: Focus</span>}
                                {mode === "long" && <span>Long break! Next: Focus</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto mt-16">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Why Use Pomodoro?</h2>
                    <p className="text-gray-400">Boost your productivity with proven time management techniques</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Timer className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Focused Work</h3>
                        <p className="text-gray-400 text-sm">Stay concentrated with timed work sessions and regular breaks</p>
                    </div>

                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <ListTodo className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Task Management</h3>
                        <p className="text-gray-400 text-sm">Organize tasks with estimated pomodoros and track your progress</p>
                    </div>

                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Settings className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Customizable</h3>
                        <p className="text-gray-400 text-sm">Adjust timers, sounds, and intervals to match your workflow</p>
                    </div>
                </div>
            </div>

            {/* Áudio do tick */}
            <audio ref={tickingAudioRef} src="/audios/clock ticking/clock ticking.mp3" preload="auto" />
            {/* Áudio do tick rápido */}
            <audio ref={fastTickingAudioRef} src="/audios/clock ticking/clock ticking fast.mp3" preload="auto" />
        </main>
    );
}