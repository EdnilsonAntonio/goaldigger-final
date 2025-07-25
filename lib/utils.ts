import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcula o próximo resetDay para uma tarefa repetitiva.
 * @param task Objeto da tarefa (deve conter repeatUnit, repeatInterval, repeatDays, startDate, endDate, updatedAt, occurences)
 * @param fromDate Data de referência (opcional, padrão: hoje)
 * @returns Date do próximo reset ou null
 */
export function getNextResetDay(
  task: {
    repeatUnit?: string;
    repeatInterval?: number;
    repeatDays?: string[];
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    updatedAt?: string | Date | null;
    occurences?: number | null;
  },
  fromDate?: Date
): Date | null {
  if (!task.repeatUnit) return null;

  // Verificar se ainda há ocorrências restantes
  if (
    task.occurences !== null &&
    task.occurences !== undefined &&
    task.occurences <= 0
  ) {
    return null; // Não há mais ocorrências, não deve repetir
  }

  const interval = task.repeatInterval || 1;
  const now = fromDate ? new Date(fromDate) : new Date();
  now.setHours(0, 0, 0, 0);

  // Helper para clonar datas
  function cloneAndSet(d: Date) {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  }

  // Data base para cálculo: startDate, senão updatedAt, senão hoje
  let baseDate: Date = now;
  if (task.startDate) baseDate = cloneAndSet(new Date(task.startDate));
  else if (task.updatedAt) baseDate = cloneAndSet(new Date(task.updatedAt));

  // Diária
  if (task.repeatUnit === "day") {
    let next = cloneAndSet(baseDate);
    while (next <= now) {
      next.setDate(next.getDate() + interval);
    }
    next.setHours(0, 0, 0, 0); // Garante meia-noite local
    return next;
  }

  // Semanal
  if (
    task.repeatUnit === "week" &&
    Array.isArray(task.repeatDays) &&
    task.repeatDays.length > 0
  ) {
    // Dias da semana em ordem: 0=domingo, 1=segunda...
    const weekDays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    let next = cloneAndSet(baseDate);
    let found = false;
    let tries = 0;
    while (!found && tries < 366) {
      // Limite de 1 ano
      const dayName = weekDays[next.getDay()];
      if (task.repeatDays.includes(dayName) && next > now) {
        found = true;
        break;
      }
      next.setDate(next.getDate() + 1);
      // Se passou 7 dias, pula o intervalo de semanas
      if (weekDays.indexOf(dayName) === 6) {
        next.setDate(next.getDate() + (interval - 1) * 7);
      }
      tries++;
    }
    next.setHours(0, 0, 0, 0); // Garante meia-noite local
    return found ? next : null;
  }

  // Mensal
  if (task.repeatUnit === "month") {
    let next = cloneAndSet(baseDate);
    while (next <= now) {
      next.setMonth(next.getMonth() + interval);
    }
    next.setHours(0, 0, 0, 0); // Garante meia-noite local
    return next;
  }

  // Anual
  if (task.repeatUnit === "year") {
    let next = cloneAndSet(baseDate);
    while (next <= now) {
      next.setFullYear(next.getFullYear() + interval);
    }
    next.setHours(0, 0, 0, 0); // Garante meia-noite local
    return next;
  }

  return null;
}
