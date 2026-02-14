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
  const [calendarId] = useLocalStorage<string>("calendarId", "");
  const [hiddenSubjects] = useLocalStorage<string[]>("hiddenSubjects", []);

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
        window.matchMedia("(max-height: 500px) and (orientation: landscape)")
          .matches,
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
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0 }),
  };

  const displayIndex = Math.max(
    0,
    Math.min(currentLessonIndex, displayedLessons.length - 1),
  );
  const currentLesson = displayedLessons[displayIndex];

  const Skeleton = () => (
    <div className="absolute inset-0 flex flex-col p-4 lg:p-6 animate-pulse">
      <div className="h-8 mb-4">
        <div className="w-16 h-4 bg-gray-100 dark:bg-gray-900 rounded-full" />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-900 rounded" />
          <div className="w-24 h-6 bg-gray-100 dark:bg-gray-900 rounded" />
        </div>
        <div className="w-3/4 h-5 bg-gray-100 dark:bg-gray-900 rounded mb-4" />
        <div className="space-y-2">
          <div className="w-1/2 h-3 bg-gray-100 dark:bg-gray-900 rounded" />
          <div className="w-1/3 h-3 bg-gray-100 dark:bg-gray-900 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.05}
      onDragEnd={handleDragEnd}
      className={cn(
        "w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-900 rounded-2xl overflow-hidden flex flex-col touch-none",
        isLandscape ? "h-full" : "h-fit",
      )}
    >
      <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-900 bg-inherit z-20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate flex-1">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-mono truncate">
              {isFetching && !data ? "..." : data?.dayName || "..."}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {dayOffset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setDirection(-1);
                  setDayOffset(0);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={dayOffset === 0}
              className="p-1 disabled:opacity-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="text-xs font-mono">
                    {getDate(dayOffset)}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl"
                align="center"
              >
                <Calendar
                  mode="single"
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
              </PopoverContent>
            </Popover>

            <button type="button" onClick={handleNextDay} className="p-1">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 relative overflow-hidden",
          isLandscape ? "min-h-[120px]" : "min-h-[180px] lg:min-h-[220px]",
        )}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {isFetching && !data ? (
            <motion.div
              key="skeleton"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              <Skeleton />
            </motion.div>
          ) : displayedLessons.length === 0 ? (
            <motion.div
              key={`empty-${dayOffset}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
            >
              <div className="w-12 h-12 border border-black dark:border-white rounded-2xl mb-2 flex items-center justify-center">
                <div className="w-4 h-4 border border-black dark:border-white" />
              </div>
              <p className="text-xs font-mono uppercase">nessuna lezione</p>
            </motion.div>
          ) : (
            <motion.div
              key={`${dayOffset}-${displayIndex}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 flex flex-col p-4 lg:p-6"
            >
              {currentLesson && (
                <>
                  <div className="h-8">
                    {data?.nextLesson?.lesson.time === currentLesson.time && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded-full border border-green-500 text-green-600 uppercase">
                        in corso
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-lg font-mono font-bold">
                        {currentLesson.time}
                      </span>
                    </div>
                    <h3 className="text-base lg:text-lg font-serif leading-tight mb-4">
                      {currentLesson.title.toLowerCase()}
                    </h3>
                    <div className="space-y-1.5 opacity-60">
                      {currentLesson.location && (
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {currentLesson.location.toLowerCase()}
                        </div>
                      )}
                      {currentLesson.professor && (
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <User className="w-3 h-3 shrink-0" />
                          {currentLesson.professor.toLowerCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-900 flex justify-between items-center bg-inherit z-20">
        <span className="text-[10px] font-mono opacity-50">
          {displayIndex + 1}/{displayedLessons.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrevLesson}
            disabled={displayIndex === 0}
            className="p-1 disabled:opacity-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextLesson}
            disabled={displayIndex >= displayedLessons.length - 1}
            className="p-1 disabled:opacity-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
