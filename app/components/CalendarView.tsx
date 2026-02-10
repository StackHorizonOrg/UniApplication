import { it } from "date-fns/locale";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Filter } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { CalendarDayDialog } from "@/app/components/CalendarDayDialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  addDays,
  getCurrentItalianDateTime,
  getDayOfWeek,
} from "@/lib/date-utils";
import { useLocalStorage } from "@/lib/hooks";
import type { DaySchedule, ParsedEvent } from "@/lib/orario-utils";
import { getMateriaColorMap } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

interface CalendarViewProps {
  schedule: DaySchedule[];
  weekOffset: number;
  onNextWeek: () => void;
  onPrevWeek: () => void;
  onReset: () => void;
  onSetOffset: (offset: number) => void;
}

const INITIAL_HIDDEN_SUBJECTS: string[] = [];

export function CalendarView({
  schedule,
  weekOffset,
  onNextWeek,
  onPrevWeek,
  onReset,
  onSetOffset,
}: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hiddenSubjects, setHiddenSubjects] = useLocalStorage<string[]>(
    "hiddenSubjects",
    INITIAL_HIDDEN_SUBJECTS,
  );

  const allMaterie = schedule.flatMap((day) =>
    day.events.map((ev) => ev.materia),
  );
  const materiaColorMap = getMateriaColorMap(allMaterie);

  const toggleSubject = (materia: string) => {
    setHiddenSubjects((prev) =>
      prev.includes(materia)
        ? prev.filter((s) => s !== materia)
        : [...prev, materia],
    );
  };

  const today = getCurrentItalianDateTime();
  const baseDate = addDays(today, weekOffset);

  const currentDayOfWeek = getDayOfWeek(baseDate);
  const startOfWeek = baseDate.minus({ days: currentDayOfWeek });
  const endOfWeek = startOfWeek.plus({ days: 6 });

  const startDay = startOfWeek.toFormat("d");
  const endDay = endOfWeek.toFormat("d");
  const monthYear = endOfWeek.setLocale("it").toFormat("MMMM yyyy");
  const weekRangeDisplay = `${startDay} - ${endDay} ${monthYear}`;

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const currentDate = startOfWeek.plus({ days: index });
    const dayOfMonth = currentDate.day;
    const dayOfWeek = getDayOfWeek(currentDate);

    const dayData = schedule.find((s) => s.day === dayOfWeek);

    const nonCancelledEvents = (dayData?.events || []).filter(
      (ev) =>
        !ev.time?.toUpperCase().includes("ANNULLATO") &&
        !hiddenSubjects.includes(ev.materia),
    );

    return {
      day: dayOfWeek,
      dayOfMonth: dayOfMonth,
      date: currentDate,
      events: nonCancelledEvents,
      hasEvents: nonCancelledEvents.length > 0,
    };
  });

  const getEventDots = (events: ParsedEvent[]) => {
    const materieSet = new Set(events.map((event) => event.materia));
    return Array.from(materieSet).slice(0, 3);
  };

  const getMateriaColor = (materia: string) => {
    const normalizedMateria = materia
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    return materiaColorMap[normalizedMateria] || "#666666";
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const selected = DateTime.fromJSDate(date).setZone("Europe/Rome");
      const selectedDayOfWeek = getDayOfWeek(selected);
      const selectedStartOfWeek = selected.minus({ days: selectedDayOfWeek });

      const todayDayOfWeek = getDayOfWeek(today);
      const todayStartOfWeek = today.minus({ days: todayDayOfWeek });

      const diffInDays = Math.floor(selectedStartOfWeek.diff(todayStartOfWeek, "days").days);
      onSetOffset(diffInDays);
      setIsCalendarOpen(false);
    }
  };

  const weekDayHeaders = [
    { label: "L", name: "Lunedì" },
    { label: "M", name: "Martedì" },
    { label: "M", name: "Mercoledì" },
    { label: "G", name: "Giovedì" },
    { label: "V", name: "Venerdì" },
    { label: "S", name: "Sabato" },
    { label: "D", name: "Domenica" },
  ];

  return (
    <>
      <div className="w-full max-w-md mx-auto bg-white dark:bg-black text-gray-900 dark:text-white border-none">
        {}
        <div className="p-4 flex items-center justify-between border-b border-dashed border-gray-300 dark:border-gray-800">
          <button
            type="button"
            onClick={onPrevWeek}
            className="w-7 h-7 border border-gray-900 dark:border-white rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors disabled:opacity-30"
          >
            {" "}
            <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-white" />
          </button>

          <div className="text-center relative flex flex-col items-center">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "text-sm font-mono uppercase tracking-widest hover:opacity-70 transition-opacity border-b border-transparent hover:border-black dark:hover:border-white pb-0.5",
                    isCalendarOpen && "opacity-50",
                  )}
                >
                  {weekRangeDisplay}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-none shadow-none"
                align="center"
              >
                <Calendar
                  mode="single"
                  selected={baseDate.toJSDate()}
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={it}
                  className="font-mono"
                />
              </PopoverContent>
            </Popover>

            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={onReset}
                className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono mt-1 border-b border-gray-300 dark:border-gray-700 hover:text-black dark:hover:text-white transition-colors"
              >
                {" "}
                Torna a oggi
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onNextWeek}
            className="w-7 h-7 border border-gray-900 dark:border-white rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors disabled:opacity-30"
          >
            {" "}
            <ChevronRight className="w-4 h-4 text-gray-900 dark:text-white" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {weekDayHeaders.map((day) => (
              <div key={day.name} className="text-center py-3">
                <span className="text-xs font-mono text-gray-400 dark:text-gray-600">
                  {day.label}
                </span>
              </div>
            ))}

            {weekDays.map((dayData) => {
              const isToday = dayData.date.hasSame(today, "day");
              return (
                <button
                  key={dayData.day}
                  type="button"
                  onClick={() =>
                    dayData.hasEvents &&
                    setSelectedDay({ day: dayData.day, events: dayData.events })
                  }
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-sm
                    transition-all duration-200 active:scale-95
                    ${
                      dayData.hasEvents
                        ? "bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        : "cursor-default"
                    }
                    ${isToday ? "border border-black dark:border-white" : ""}
                  `}
                >
                  <span
                    className={`text-sm font-mono mb-1 ${
                      dayData.hasEvents
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-300 dark:text-gray-700"
                    }`}
                  >
                    {dayData.dayOfMonth}
                  </span>

                  {dayData.hasEvents && (
                    <div className="flex gap-0.5 justify-center">
                      {getEventDots(dayData.events).map((materia) => (
                        <div
                          key={materia}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: getMateriaColor(materia) }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-2">
              <h3 className="text-[10px] font-mono text-gray-400 dark:text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Filtra Materie
              </h3>
              {hiddenSubjects.length > 0 && (
                <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                  {hiddenSubjects.length} nascoste
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {Array.from(
                new Set(
                  schedule.flatMap((s) => s.events.map((e) => e.materia)),
                ),
              )
                .sort()
                .map((materia) => {
                  const isHidden = hiddenSubjects.includes(materia);
                  const color = getMateriaColor(materia);

                  return (
                    <button
                      type="button"
                      key={materia}
                      onClick={() => toggleSubject(materia)}
                      className={cn(
                        "flex items-center gap-3 w-full text-left group py-1 px-1 rounded-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-900",
                        isHidden && "opacity-50 grayscale",
                      )}
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full flex-shrink-0 transition-transform",
                            isHidden && "scale-75",
                          )}
                          style={{ backgroundColor: color }}
                        />
                        {isHidden && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-px bg-white/80 -rotate-45" />
                          </div>
                        )}
                      </div>

                      <span
                        className={cn(
                          "text-xs font-mono truncate uppercase tracking-tight flex-1 transition-colors",
                          isHidden
                            ? "text-gray-400 dark:text-gray-600 line-through decoration-gray-400/50"
                            : "text-gray-800 dark:text-gray-200 group-hover:text-black dark:group-hover:text-white",
                        )}
                      >
                        {materia.toLowerCase()}
                      </span>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {isHidden ? (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        ) : (
                          <Eye className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {selectedDay && (
        <CalendarDayDialog
          day={selectedDay}
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
          materiaColorMap={materiaColorMap}
        />
      )}
    </>
  );
}
