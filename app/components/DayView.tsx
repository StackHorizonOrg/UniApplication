import { Calendar } from "lucide-react";
import type { DaySchedule } from "@/lib/orario-utils";
import { CalendarDayView } from "./CalendarDayView";

interface DayViewProps {
  day: DaySchedule | null;
  materiaColorMap: Record<string, string>;
}

export function DayView({ day, materiaColorMap }: DayViewProps) {
  if (!day) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] text-center p-10">
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 mb-6">
          <Calendar className="w-8 h-8 text-zinc-400" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white mb-1">
          Seleziona un giorno
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Scegli una data dal calendario per vedere il dettaglio delle lezioni.
        </p>
      </div>
    );
  }

  return <CalendarDayView day={{ ...day, materiaColorMap }} />;
}
