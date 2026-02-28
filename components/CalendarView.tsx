"use client";

import { it } from "date-fns/locale";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  ArrowLeftToLine,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  MoreHorizontal,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api";
import {
  addDays,
  getCurrentItalianDateTime,
  getDayOfWeek,
} from "@/lib/date-utils";
import { useLocalStorage } from "@/lib/hooks";
import type { DaySchedule } from "@/lib/orario-utils";
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
  materiaColorMap: Record<string, string>;
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
  materiaColorMap,
}: CalendarViewProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hiddenSubjects, setHiddenSubjects] = useLocalStorage<string[]>(
    "hiddenSubjects",
    INITIAL_HIDDEN_SUBJECTS,
  );
  const [direction, setDirection] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [_isMobile, setIsMobile] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "filters">(
    "calendar",
  );
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const updateFiltersMutation =
    api.notifications.updateAllFilters.useMutation();

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 1024);
      setShowTabs(height < 750);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

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

  const toggleSubject = (materia: string) => {
    const newHidden = hiddenSubjects.includes(materia)
      ? hiddenSubjects.filter((s) => s !== materia)
      : [...hiddenSubjects, materia];

    setHiddenSubjects(newHidden);

    if ("Notification" in window && Notification.permission === "granted") {
      updateFiltersMutation.mutate({ filters: newHidden });
    }
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
    <div className="w-full flex-1 min-h-0 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-3xl overflow-hidden flex flex-col shadow-sm">
      <div
        className={cn(
          "flex-shrink-0 flex flex-col",
          showTabs && activeTab !== "calendar" && "hidden",
        )}
      >
        <div className="relative z-20 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.05}
            onDragEnd={handleDragEnd}
            className="touch-none"
          >
            <div className="px-2 sm:px-4 py-2 portrait:p-4 flex items-center justify-between gap-1">
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onReset}
                  className={cn(
                    "p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90",
                    weekOffset === 0 ? "hidden" : "block",
                  )}
                >
                  <ArrowLeftToLine className="w-3.5 h-3.5 sm:w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="p-1.5 sm:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all active:scale-90"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="text-center flex flex-col items-center flex-1 min-w-0 mx-1 relative min-h-[40px] justify-center">
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
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all font-serif font-bold text-zinc-900 dark:text-white shadow-sm min-w-0 w-full text-xs sm:text-sm"
                    >
                      <span className="truncate">{weekRangeDisplay}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
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
                                  days: getDayOfWeek(DateTime.fromJSDate(d)),
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
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="p-1.5 sm:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all active:scale-90"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 h-5 text-zinc-400" />
                </button>

                {showTabs && (
                  <Popover
                    open={isViewMenuOpen}
                    onOpenChange={setIsViewMenuOpen}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="p-1.5 sm:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all active:scale-90"
                      >
                        <MoreHorizontal className="w-4 h-4 sm:w-5 h-5 text-zinc-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-40 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("calendar");
                            setIsViewMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === "calendar"
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                              : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                          )}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span>Calendario</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("filters");
                            setIsViewMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                            activeTab === "filters"
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                              : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                          )}
                        >
                          <Filter className="w-4 h-4" />
                          <span>Materie</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div className="px-4 portrait:px-6 pb-3">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["lun", "mar", "mer", "gio", "ven", "sab", "dom"].map(
                  (h, i) => (
                    <div key={h} className="text-center">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-tighter opacity-20">
                        {weekDayHeaders[i]}
                      </span>
                    </div>
                  ),
                )}
              </div>

              <div className="relative w-full aspect-[7.5/1] min-h-[60px]">
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
                    className="grid grid-cols-7 gap-2 absolute inset-0 p-1"
                  >
                    {weekDays.map((dayData) => {
                      const isToday = dayData.date.hasSame(today, "day");
                      const isSelected = selectedDay?.day === dayData.day;
                      return (
                        <button
                          key={dayData.day}
                          type="button"
                          onClick={() => {
                            if (dayData.hasEvents) {
                              if (onDaySelect)
                                onDaySelect({ ...dayData, materiaColorMap });
                            }
                          }}
                          className={cn(
                            "relative flex flex-col items-center justify-between py-1.5 lg:py-2 min-h-[50px] lg:min-h-[70px] flex-1 rounded-xl transition-all border",
                            dayData.hasEvents
                              ? isSelected
                                ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white shadow-md shadow-zinc-200 dark:shadow-none"
                                : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800"
                              : "opacity-20 border-transparent",
                            isToday &&
                              !isSelected &&
                              "ring-2 ring-zinc-900 dark:ring-white ring-offset-2 dark:ring-offset-black",
                          )}
                        >
                          <span
                            className={cn(
                              "text-[10px] sm:text-xs lg:text-sm font-mono font-bold",
                              isSelected
                                ? "text-white dark:text-black"
                                : "text-zinc-900 dark:text-zinc-100",
                            )}
                          >
                            {dayData.dayOfMonth}
                          </span>
                          <div className="flex flex-col items-center justify-center mb-0.5">
                            {dayData.hasEvents && (
                              <div className="grid grid-cols-2 gap-0.5 lg:gap-1 p-1">
                                {(() => {
                                  const uniqueMaterie = Array.from(
                                    new Set(
                                      dayData.events.map((e) => e.materia),
                                    ),
                                  );
                                  const displayMaterie =
                                    uniqueMaterie.length > 4
                                      ? uniqueMaterie.slice(0, 3)
                                      : uniqueMaterie.slice(0, 4);
                                  const hasMore = uniqueMaterie.length > 4;

                                  return (
                                    <>
                                      {displayMaterie.map((m) => (
                                        <div
                                          key={m}
                                          className={cn(
                                            "w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full shrink-0",
                                            isSelected
                                              ? "bg-white/50 dark:bg-black/50"
                                              : "",
                                          )}
                                          style={
                                            !isSelected
                                              ? {
                                                  backgroundColor:
                                                    getMateriaColor(m),
                                                }
                                              : {}
                                          }
                                        />
                                      ))}
                                      {hasMore && (
                                        <div
                                          className={cn(
                                            "w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full shrink-0",
                                            isSelected
                                              ? "bg-white/20 dark:bg-black/20"
                                              : "bg-zinc-300 dark:bg-zinc-600",
                                          )}
                                        />
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto custom-scrollbar",
          showTabs && activeTab !== "calendar" && "hidden",
        )}
      >
        <div className="px-5 pb-6">
          <div className="sticky top-0 bg-white dark:bg-black z-10 pt-4 pb-2 mb-2 flex justify-between items-center">
            <div className="flex items-center gap-2 opacity-40">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                Filtra Materie
              </span>
            </div>
            {showTabs && (
              <Popover
                open={isFilterMenuOpen}
                onOpenChange={setIsFilterMenuOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all active:scale-90"
                  >
                    <MoreHorizontal className="w-5 h-5 text-zinc-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-40 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("calendar");
                        setIsFilterMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                        activeTab === "calendar"
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                          : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                      )}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span>Calendario</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("filters");
                        setIsFilterMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                        activeTab === "filters"
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                          : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                      )}
                    >
                      <Filter className="w-4 h-4" />
                      <span>Materie</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
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
                      "flex items-center gap-3 p-3.5 rounded-[1.25rem] border transition-all text-left",
                      isHidden
                        ? "bg-zinc-50 dark:bg-zinc-900/20 border-transparent opacity-40"
                        : "bg-white dark:bg-zinc-900/10 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-md active:scale-95",
                    )}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: getMateriaColor(materia) }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-tight truncate flex-1 font-mono">
                      {materia.toLowerCase()}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
