import { it } from "date-fns/locale";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
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
import type { DaySchedule } from "@/lib/orario-utils";
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
  onDaySelect?: (day: DaySchedule | null) => void;
  selectedDay?: DaySchedule | null;
}

const INITIAL_HIDDEN_SUBJECTS: string[] = [];

export function CalendarView({
  schedule,
  weekOffset,
  onNextWeek,
  onPrevWeek,
  onReset,
  onSetOffset,
  onDaySelect,
  selectedDay,
}: CalendarViewProps) {
  const [selectedDayLocal, setSelectedDayLocal] = useState<DaySchedule | null>(
    null,
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hiddenSubjects, setHiddenSubjects] = useLocalStorage<string[]>(
    "hiddenSubjects",
    INITIAL_HIDDEN_SUBJECTS,
  );
  const [direction, setDirection] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const handlePrevWeek = () => {
    setDirection(-1);
    onPrevWeek();
  };
  const handleNextWeek = () => {
    setDirection(1);
    onNextWeek();
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) handleNextWeek();
    else if (info.offset.x > threshold) handlePrevWeek();
  };

  const handleCalendarDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      setCalendarMonth((prev) => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + 1);
        return d;
      });
    } else if (info.offset.x > threshold) {
      setCalendarMonth((prev) => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() - 1);
        return d;
      });
    }
  };

  const allMaterie = useMemo(
    () => schedule.flatMap((day) => day.events.map((ev) => ev.materia)),
    [schedule],
  );
  const materiaColorMap = useMemo(
    () => getMateriaColorMap(allMaterie),
    [allMaterie],
  );

  const toggleSubject = (materia: string) => {
    setHiddenSubjects((prev) =>
      prev.includes(materia)
        ? prev.filter((s) => s !== materia)
        : [...prev, materia],
    );
  };

  const today = getCurrentItalianDateTime();
  const baseDate = addDays(today, weekOffset);
  const startOfWeek = baseDate.minus({ days: getDayOfWeek(baseDate) });
  const weekRangeDisplay = `${startOfWeek.toFormat("d")} - ${startOfWeek.plus({ days: 6 }).toFormat("d")} ${startOfWeek.plus({ days: 6 }).setLocale("it").toFormat("MMMM yyyy")}`;

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const currentDate = startOfWeek.plus({ days: index });
        const dayOfWeek = getDayOfWeek(currentDate);
        const dayData = schedule.find((s) => s.day === dayOfWeek);
        const nonCancelledEvents = (dayData?.events || []).filter(
          (ev) =>
            !ev.time?.toUpperCase().includes("ANNULLATO") &&
            !hiddenSubjects.includes(ev.materia),
        );
        return {
          day: dayOfWeek,
          dayOfMonth: currentDate.day,
          date: currentDate,
          events: nonCancelledEvents,
          hasEvents: nonCancelledEvents.length > 0,
        };
      }),
    [startOfWeek, schedule, hiddenSubjects],
  );

  const getMateriaColor = (materia: string) => {
    const normalized = materia
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    return materiaColorMap[normalized] || "#666666";
  };

  const weekDayHeaders = ["L", "M", "M", "G", "V", "S", "D"];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0 }),
  };

  return (
    <>
      <div className="w-full flex-1 min-h-0 bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col overflow-hidden">
        <div className="relative flex-shrink-0 z-20 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.05}
            onDragEnd={handleDragEnd}
            className="touch-none"
          >
            <div className="px-3 py-2 portrait:p-4 flex items-center justify-between bg-inherit">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors relative z-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center flex flex-col items-center flex-1 mx-2 relative h-10 justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={weekOffset}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center w-full"
                  >
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={(open) => {
                        setIsCalendarOpen(open);
                        if (open) setCalendarMonth(baseDate.toJSDate());
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-center gap-1 text-xs portrait:text-sm font-mono uppercase truncate w-full hover:bg-gray-100 dark:hover:bg-gray-900 px-2 py-1 rounded transition-colors"
                        >
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span className="truncate">{weekRangeDisplay}</span>
                          <ChevronDown className="w-3 h-3 text-gray-500" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
                        align="center"
                      >
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.2}
                          onDragEnd={handleCalendarDragEnd}
                          className="touch-none"
                        >
                          <Calendar
                            mode="single"
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            selected={baseDate.toJSDate()}
                            onSelect={(d) => {
                              if (d) {
                                const diff = Math.floor(
                                  DateTime.fromJSDate(d)
                                    .minus({
                                      days: getDayOfWeek(
                                        DateTime.fromJSDate(d),
                                      ),
                                    })
                                    .diff(
                                      today.minus({
                                        days: getDayOfWeek(today),
                                      }),
                                      "days",
                                    ).days,
                                );
                                setDirection(diff > weekOffset ? 1 : -1);
                                onSetOffset(diff);
                                setIsCalendarOpen(false);
                              }
                            }}
                            locale={it}
                            className="font-mono"
                          />
                        </motion.div>
                      </PopoverContent>
                    </Popover>
                    {weekOffset !== 0 && (
                      <button
                        type="button"
                        onClick={onReset}
                        className="text-[9px] uppercase opacity-50 font-mono hover:opacity-100"
                      >
                        Torna a oggi
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors relative z-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="px-3 portrait:px-4 lg:px-6 pb-2">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["lun", "mar", "mer", "gio", "ven", "sab", "dom"].map(
                  (h, i) => (
                    <div key={h} className="text-center">
                      <span className="text-[9px] landscape:text-[8px] portrait:text-[10px] font-mono opacity-40">
                        {weekDayHeaders[i]}
                      </span>
                    </div>
                  ),
                )}
              </div>

              <div className="relative h-[56px] portrait:h-[76px] overflow-hidden">
                <AnimatePresence
                  initial={false}
                  custom={direction}
                  mode="popLayout"
                >
                  <motion.div
                    key={weekOffset}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="grid grid-cols-7 gap-1 portrait:gap-2 absolute inset-0 p-0.5"
                  >
                    {weekDays.map((dayData) => {
                      const isToday = dayData.date.hasSame(today, "day");
                      const isSelected =
                        selectedDay?.day === dayData.day ||
                        selectedDayLocal?.day === dayData.day;
                      return (
                        <button
                          key={dayData.day}
                          type="button"
                          onClick={() => {
                            if (dayData.hasEvents) {
                              setSelectedDayLocal({
                                day: dayData.day,
                                events: dayData.events,
                              });
                              if (onDaySelect) onDaySelect(dayData);
                            }
                          }}
                          className={cn(
                            "relative aspect-square flex flex-col items-center justify-center rounded-lg transition-all max-w-[48px] mx-auto w-full",
                            dayData.hasEvents
                              ? "bg-gray-50 dark:bg-gray-900"
                              : "opacity-20",
                            isToday &&
                              "ring-2 ring-black dark:ring-white bg-white dark:bg-black z-10",
                            isSelected && !isToday && "ring-2 ring-gray-400",
                          )}
                        >
                          <span className="text-[10px] landscape:text-[9px] portrait:text-sm font-mono">
                            {dayData.dayOfMonth}
                          </span>
                          {dayData.hasEvents && (
                            <div className="flex gap-0.5 mt-0.5">
                              {Array.from(
                                new Set(dayData.events.map((e) => e.materia)),
                              )
                                .slice(0, 3)
                                .map((m) => (
                                  <div
                                    key={m}
                                    className="w-1 h-1 rounded-full"
                                    style={{
                                      backgroundColor: getMateriaColor(m),
                                    }}
                                  />
                                ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 py-6">
            <div className="border-b border-dashed border-gray-200 dark:border-gray-800 pb-2 mb-3 flex items-center gap-2 sticky top-0 bg-white dark:bg-black z-10">
              <Filter className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                Filtra Materie
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {Array.from(new Set(allMaterie))
                .sort()
                .map((materia) => {
                  const isHidden = hiddenSubjects.includes(materia);
                  return (
                    <button
                      key={materia}
                      type="button"
                      onClick={() => toggleSubject(materia)}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group",
                        isHidden && "opacity-30",
                      )}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getMateriaColor(materia) }}
                      />
                      <span className="text-[10px] portrait:text-xs font-mono truncate uppercase flex-1">
                        {materia.toLowerCase()}
                      </span>
                      {isHidden ? (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      ) : (
                        <Eye className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(() => {
          const dayToShow = selectedDayLocal || selectedDay;
          if (!dayToShow) return null;
          return (
            <CalendarDayDialog
              day={dayToShow}
              isOpen={true}
              onClose={() => {
                setSelectedDayLocal(null);
                if (onDaySelect) onDaySelect(null);
              }}
              materiaColorMap={materiaColorMap}
            />
          );
        })()}
      </AnimatePresence>
    </>
  );
}
