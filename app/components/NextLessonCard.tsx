"use client";

import { it } from "date-fns/locale";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RotateCcw,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useLocalStorage } from "@/lib/hooks";
import type { DaySchedule } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";

export default function NextLessonCard({
  schedule: _schedule,
}: {
  schedule?: DaySchedule[];
}) {
  const [dayOffset, setDayOffset] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [direction, setDirection] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarId] = useLocalStorage<string>("calendarId", "");
  const [hiddenSubjects] = useLocalStorage<string[]>("hiddenSubjects", []);

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

  const handleNextDay = () => {
    setDirection(1);
    setDayOffset((prev) => prev + 1);
    setCurrentLessonIndex(0);
  };

  const handlePrevDay = () => {
    if (dayOffset > 0) {
      setDirection(-1);
      setDayOffset((prev) => Math.max(prev - 1, 0));
      setCurrentLessonIndex(0);
    }
  };

  const handleNextLesson = () => {
    if (
      displayedLessons.length > 0 &&
      currentLessonIndex < displayedLessons.length - 1
    ) {
      setDirection(1);
      setCurrentLessonIndex((prev) => prev + 1);
      return true;
    }
    return false;
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setDirection(-1);
      setCurrentLessonIndex((prev) => prev - 1);
      return true;
    }
    return false;
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      if (!handleNextLesson()) handleNextDay();
    } else if (info.offset.x > threshold) {
      if (!handlePrevLesson()) handlePrevDay();
    }
  };

  useEffect(() => {
    const check = () =>
      setIsLandscape(
        window.innerWidth > window.innerHeight && window.innerHeight < 600,
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { data, isFetching } = api.orario.getNextLesson.useQuery(
    { dayOffset, linkId: calendarId, location: "Varese" },
    {
      enabled: !!calendarId,
      placeholderData: (previousData) => previousData,
    },
  );

  const displayedLessons = useMemo(
    () =>
      (data?.lessons || []).filter(
        (l) =>
          !l.time?.toUpperCase().includes("ANNULLATO") &&
          !hiddenSubjects.includes(l.title),
      ),
    [data, hiddenSubjects],
  );

  useEffect(() => {
    if (displayedLessons.length > 0 && dayOffset === 0) {
      if (data?.nextLesson) {
        const idx = displayedLessons.findIndex(
          (l) =>
            l.time === data.nextLesson?.lesson.time &&
            l.title === data.nextLesson?.lesson.title,
        );
        if (idx !== -1) {
          setCurrentLessonIndex(idx);
          return;
        }
      }
    }
  }, [displayedLessons, dayOffset, data?.nextLesson]);

  const getDate = (offset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(date);
      selected.setHours(0, 0, 0, 0);
      const diff = Math.round(
        (selected.getTime() - today.getTime()) / 86400000,
      );
      const target = Math.max(0, diff);
      setDirection(target > dayOffset ? 1 : -1);
      setDayOffset(target);
      setIsCalendarOpen(false);
      setCurrentLessonIndex(0);
    }
  };

  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? "20%" : "-20%",
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (d: number) => ({
      x: d < 0 ? "20%" : "-20%",
      opacity: 0,
      scale: 0.95,
      filter: "blur(4px)",
    }),
  };

  const displayIndex = Math.max(
    0,
    Math.min(currentLessonIndex, displayedLessons.length - 1),
  );
  const currentLesson = displayedLessons[displayIndex];

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className={cn(
        "w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col touch-none shadow-sm transition-all duration-300",
        isLandscape ? "h-full min-h-[140px]" : "h-[280px]",
      )}
    >
      <div
        className={cn(
          "border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/10 z-20 flex-shrink-0",
          isLandscape ? "p-2 px-4" : "px-4 py-3",
        )}
      >
        <div className="flex items-center gap-2">
          <Popover
            open={isCalendarOpen}
            onOpenChange={(open) => {
              setIsCalendarOpen(open);
              if (open) {
                const d = new Date();
                d.setDate(d.getDate() + dayOffset);
                setCalendarMonth(d);
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all font-serif font-bold text-sm text-zinc-900 dark:text-white shadow-sm",
                  isLandscape ? "text-xs" : "text-sm",
                )}
              >
                <span>{data?.dayName || "..."}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
              align="start"
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
                  selected={
                    new Date(
                      new Date().setDate(new Date().getDate() + dayOffset),
                    )
                  }
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={it}
                  className="font-mono"
                />
              </motion.div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setDirection(-1);
              setDayOffset(0);
            }}
            className={cn(
              "p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all",
              dayOffset === 0 ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm p-0.5 gap-0.5 mr-1">
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={dayOffset === 0}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded disabled:opacity-20"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded"
            >
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <span className="text-[10px] font-mono font-bold text-zinc-400 px-1">
            {getDate(dayOffset)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "relative overflow-hidden flex-1 flex flex-col",
          isLandscape ? "p-4" : "p-4 lg:p-5",
        )}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {isFetching && !data ? (
            <motion.div
              key="loading"
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-5 h-5 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={
                displayedLessons.length === 0
                  ? `empty-${dayOffset}`
                  : `${dayOffset}-${displayIndex}`
              }
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 400, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
              className="flex flex-col items-center justify-center flex-1 w-full"
            >
              {displayedLessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800 shadow-sm relative shrink-0">
                    <CalendarIcon
                      className="w-8 h-8 text-zinc-300 dark:text-zinc-700"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p
                    className={cn(
                      "font-serif font-bold text-zinc-900 dark:text-white tracking-tight leading-none",
                      isLandscape ? "text-base" : "text-lg",
                    )}
                  >
                    Nessuna lezione
                  </p>
                  <p className="mt-2 text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em]">
                    Libero
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full w-full">
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      isLandscape ? "mb-2" : "mb-3",
                    )}
                  >
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                      <Clock
                        className={cn(
                          "opacity-40",
                          isLandscape ? "w-3.5 h-3.5" : "w-4 h-4",
                        )}
                      />
                      <span
                        className={cn(
                          "font-semibold font-serif tracking-tight",
                          isLandscape ? "text-base" : "text-xl",
                        )}
                      >
                        {currentLesson.time}
                      </span>
                    </div>
                    {dayOffset === 0 &&
                      data?.nextLesson?.lesson.time === currentLesson.time && (
                        <span className="flex items-center gap-1 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black uppercase tracking-tighter">
                          Ora
                        </span>
                      )}
                  </div>

                  <h3
                    className={cn(
                      "font-bold text-zinc-900 dark:text-white leading-tight font-serif line-clamp-3 mb-2",
                      isLandscape ? "text-base" : "text-lg",
                    )}
                  >
                    {currentLesson.title}
                  </h3>

                  <div
                    className={cn(
                      "space-y-1 mt-auto",
                      isLandscape ? "flex items-center gap-4 space-y-0" : "",
                    )}
                  >
                    {currentLesson.location && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium font-mono min-w-0">
                        <MapPin className="w-3 h-3 shrink-0 opacity-50 text-zinc-400" />
                        <span className="truncate">
                          {currentLesson.location}
                        </span>
                      </div>
                    )}
                    {currentLesson.professor && (
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 italic font-serif min-w-0">
                        <User className="w-3 h-3 shrink-0 opacity-40" />
                        <span className="truncate">
                          {currentLesson.professor}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className={cn(
          "border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/30 dark:bg-zinc-900/10 flex-shrink-0",
          isLandscape ? "p-2 px-4" : "px-4 py-3",
        )}
      >
        <div className="flex gap-1.5">
          {displayedLessons.length > 0 ? (
            displayedLessons.map((lesson, i) => (
              <div
                key={`${lesson.time}-${lesson.title}`}
                className={cn(
                  "w-1 h-1 rounded-full transition-all duration-300",
                  i === displayIndex
                    ? "bg-zinc-900 dark:bg-white w-3"
                    : "bg-zinc-200 dark:bg-zinc-800",
                )}
              />
            ))
          ) : (
            <div className="w-4 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 opacity-50" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!handlePrevLesson()) {
                handlePrevDay();
              }
            }}
            disabled={dayOffset === 0 && displayIndex === 0}
            className="p-1.5 rounded-lg text-zinc-400 disabled:opacity-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!handleNextLesson()) {
                handleNextDay();
              }
            }}
            className="p-1.5 rounded-lg text-zinc-400 disabled:opacity-10 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
