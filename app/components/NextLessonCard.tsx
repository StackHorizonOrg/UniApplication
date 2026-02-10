"use client";

import { it } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dot,
  MapPin,
  RotateCcw,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useLocalStorage } from "@/lib/hooks";
import { type DaySchedule, parseEventTitle } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";

const INITIAL_HIDDEN_SUBJECTS: string[] = [];

type Lesson = {
  time: string;
  title: string;
  location?: string;
  professor?: string;
};

export default function NextLessonCard({
  schedule: _schedule,
}: {
  schedule?: DaySchedule[];
}) {
  const [dayOffset, setDayOffset] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarId] = useLocalStorage<string>("calendarId", "");
  const [hiddenSubjects] = useLocalStorage<string[]>(
    "hiddenSubjects",
    INITIAL_HIDDEN_SUBJECTS,
  );

  const { data, isLoading, error } = api.orario.getNextLesson.useQuery(
    {
      dayOffset,
      linkId: calendarId,
      location: "Varese",
    },
    {
      enabled: !!calendarId,
    },
  );

  const lessons = data?.lessons || [];

  const displayedLessons = useMemo(
    () =>
      lessons.filter((l) => {
        const isAnnullato = l.time?.toUpperCase().includes("ANNULLATO");
        // Use title as materia (subject name)
        const materia = l.title;
        const isHidden = hiddenSubjects.includes(materia);
        return !isAnnullato && !isHidden;
      }),
    [lessons, hiddenSubjects],
  );

  const userInteractedRef = useRef(false);

  useEffect(() => {
    if (
      displayedLessons &&
      displayedLessons.length > 0 &&
      dayOffset === 0 &&
      !userInteractedRef.current
    ) {
      if (data?.nextLesson) {
        const nextIndex = displayedLessons.findIndex(
          (l) =>
            l.time === data.nextLesson?.lesson.time &&
            l.title === data.nextLesson?.lesson.title,
        );
        if (nextIndex !== -1) {
          setCurrentLessonIndex(nextIndex);
          return;
        }
      }

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let closestIndex = 0;
      let minDiff = Infinity;

      displayedLessons.forEach((lesson, index) => {
        const timeRange = lesson.time.split(" - ");
        if (timeRange.length === 2) {
          const [_startStr] = timeRange[0].split(":");
          const [startH, startM] = timeRange[0].split(":").map(Number);
          const startMinutes = startH * 60 + startM;

          const [endH, endM] = timeRange[1].split(":").map(Number);
          const endMinutes = endH * 60 + endM;

          if (currentMinutes <= endMinutes) {
            const diff = Math.abs(startMinutes - currentMinutes);
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = index;
            }
          }
        }
      });

      setCurrentLessonIndex(closestIndex);
    } else if (dayOffset !== 0 && !userInteractedRef.current) {
      setCurrentLessonIndex(0);
    }
  }, [displayedLessons, dayOffset, data?.nextLesson]);

  const getDate = (offset: number): string => {
    const today = new Date();
    today.setDate(today.getDate() + offset);
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const selected = new Date(date);
      selected.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffInTime = selected.getTime() - today.getTime();
      const diffInDays = Math.round(diffInTime / (1000 * 3600 * 24));
      setDayOffset(Math.max(0, diffInDays));
      setIsCalendarOpen(false);
      userInteractedRef.current = false;
      setCurrentLessonIndex(0);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-fit bg-white dark:bg-black border border-gray-200 dark:border-gray-900 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-300 dark:bg-white/20 rounded animate-pulse" />
              <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-16 lg:w-20 animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-300 dark:bg-white/20 rounded-md animate-pulse" />
              <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-8 lg:w-10 animate-pulse" />
              <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-300 dark:bg-white/20 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 lg:p-6 flex flex-col justify-between">
          <div className="h-8 mb-2 flex items-start">
            <div className="h-6 lg:h-7 bg-gray-300 dark:bg-white/20 rounded-lg w-20 lg:w-24 animate-pulse" />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-300 dark:bg-white/20 rounded animate-pulse" />
                <div className="h-4 lg:h-5 bg-gray-300 dark:bg-white/20 rounded w-16 lg:w-20 animate-pulse" />
              </div>
              <div className="w-2 h-2 bg-gray-300 dark:bg-white/20 rounded-full animate-pulse" />
            </div>

            <div className="h-4 lg:h-5 bg-gray-300 dark:bg-white/20 rounded w-3/4 mb-4 animate-pulse" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-300 dark:bg-white/20 rounded animate-pulse" />
                <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-1/2 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-300 dark:bg-white/20 rounded animate-pulse" />
                <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-2/3 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-300 dark:bg-white/20 rounded-sm animate-pulse" />
                <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="h-10 pt-4 border-t border-gray-200 dark:border-gray-900 flex items-center justify-between">
            <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-8 lg:w-10 animate-pulse" />
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gray-300 dark:bg-white/20 rounded-sm animate-pulse" />
              <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gray-300 dark:bg-white/20 rounded-sm animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-fit bg-white dark:bg-black border border-red-500 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 text-center flex items-center justify-center">
          <div className="w-8 h-8 lg:w-10 lg:h-10 border border-red-500 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Dot className="w-4 h-4 lg:w-5 lg:h-5 text-red-500" />
          </div>
          <p className="text-xs lg:text-sm text-red-500 font-mono">
            errore caricamento
          </p>
        </div>
      </div>
    );
  }

  const hasLessons = data?.hasLessons && displayedLessons.length > 0;

  const todayDate = new Date();
  todayDate.setDate(todayDate.getDate() + dayOffset);

  if (!hasLessons) {
    return (
      <div className="w-full h-fit bg-white dark:bg-black border border-gray-200 dark:border-gray-900 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-900 dark:text-white" />
              <span className="text-sm lg:text-base text-gray-900 dark:text-white font-mono">
                {data?.dayName || "Giorno"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {dayOffset !== 0 && (
                <button
                  onClick={() => {
                    setDayOffset(0);
                    userInteractedRef.current = false;
                    setCurrentLessonIndex(0);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors mr-1"
                  title="Torna a oggi"
                  type="button"
                >
                  <RotateCcw className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}

              <button
                onClick={() => {
                  userInteractedRef.current = false;
                  setDayOffset(Math.max(dayOffset - 1, 0));
                  setCurrentLessonIndex(0);
                }}
                disabled={dayOffset === 0}
                className="w-7 h-7 lg:w-8 lg:h-8 border border-gray-900 dark:border-white rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors"
                type="button"
              >
                <ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4 text-gray-900 dark:text-white" />
              </button>

              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "text-xs lg:text-sm text-gray-900 dark:text-white font-mono px-2 min-w-12 lg:min-w-14 text-center hover:opacity-70 transition-opacity",
                      isCalendarOpen && "opacity-50",
                    )}
                  >
                    {getDate(dayOffset)}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-none shadow-none"
                  align="center"
                >
                  <Calendar
                    mode="single"
                    selected={todayDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={it}
                    className="font-mono"
                  />
                </PopoverContent>
              </Popover>

              <button
                onClick={() => {
                  userInteractedRef.current = false;
                  setDayOffset(dayOffset + 1);
                  setCurrentLessonIndex(0);
                }}
                className="w-7 h-7 lg:w-8 lg:h-8 border border-gray-900 dark:border-white rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors"
                type="button"
              >
                <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-900 dark:text-white" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 lg:p-6 flex flex-col justify-between">
          <div className="h-8 mb-2" />

          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 lg:w-14 lg:h-14 border border-gray-900 dark:border-white rounded-2xl flex items-center justify-center mb-4">
              <div className="w-4 h-4 lg:w-5 lg:h-5 border border-gray-900 dark:border-white rounded-sm" />
            </div>
            <p className="text-xs lg:text-sm text-gray-900 dark:text-white font-mono">
              nessuna lezione
            </p>
          </div>

          <div className="h-10 pt-4 border-t border-gray-200 dark:border-gray-900" />
        </div>
      </div>
    );
  }

  const displayIndex = Math.max(
    0,
    Math.min(currentLessonIndex, displayedLessons.length - 1),
  );
  const currentLesson = displayedLessons[displayIndex] as Lesson;

  // Use location and professor fields directly if available, otherwise parse from title
  const parsedFromTitle = parseEventTitle(currentLesson.title);
  const parsedLesson = {
    materia: currentLesson.title,
    aula: currentLesson.location || parsedFromTitle.aula,
    docente: currentLesson.professor || parsedFromTitle.docente,
    tipo: parsedFromTitle.tipo,
  };

  const isCurrentLesson =
    data.nextLesson?.status === "current" &&
    data.nextLesson.lesson.time === currentLesson.time;
  const isNextLesson =
    data.nextLesson?.status === "next" &&
    data.nextLesson.lesson.time === currentLesson.time;

  return (
    <div className="w-full h-fit bg-white dark:bg-black border border-gray-200 dark:border-gray-900 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-900 dark:text-white" />
            <span className="text-sm lg:text-base text-gray-900 dark:text-white font-mono">
              {data.dayName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {dayOffset !== 0 && (
              <button
                onClick={() => {
                  setDayOffset(0);
                  userInteractedRef.current = false;
                  setCurrentLessonIndex(0);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors mr-1"
                title="Torna a oggi"
                type="button"
              >
                <RotateCcw className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <button
              onClick={() => {
                userInteractedRef.current = false;
                setDayOffset(Math.max(dayOffset - 1, 0));
                setCurrentLessonIndex(0);
              }}
              disabled={dayOffset === 0}
              className="w-7 h-7 lg:w-8 lg:h-8 border border-gray-900 dark:border-white rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors"
              type="button"
            >
              <ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4 text-gray-900 dark:text-white" />
            </button>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "text-xs lg:text-sm text-gray-900 dark:text-white font-mono px-2 min-w-12 lg:min-w-14 text-center hover:opacity-70 transition-opacity",
                    isCalendarOpen && "opacity-50",
                  )}
                >
                  {getDate(dayOffset)}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-none shadow-none"
                align="center"
              >
                <Calendar
                  mode="single"
                  selected={todayDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={it}
                  className="font-mono"
                />
              </PopoverContent>
            </Popover>

            <button
              onClick={() => {
                userInteractedRef.current = false;
                setDayOffset(dayOffset + 1);
                setCurrentLessonIndex(0);
              }}
              className="w-7 h-7 lg:w-8 lg:h-8 border border-gray-900 dark:border-white rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors"
              type="button"
            >
              <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 lg:p-6 flex flex-col justify-between">
        <div className="h-8 lg:h-9 mb-2 flex items-start">
          {(isCurrentLesson || isNextLesson) && (
            <div
              className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs lg:text-sm font-mono ${
                isCurrentLesson
                  ? "text-green-800 dark:text-white bg-green-500 bg-opacity-20 dark:bg-opacity-10 border border-green-700 dark:border-green-900"
                  : "text-blue-800 dark:text-white bg-blue-500 bg-opacity-20 dark:bg-opacity-10 border border-blue-700 dark:border-blue-900"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${
                  isCurrentLesson
                    ? "bg-green-600 dark:bg-green-400"
                    : "bg-blue-600 dark:bg-blue-400"
                }`}
              />
              {isCurrentLesson ? "in corso" : "prossima"}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-900 dark:text-white" />
              <span className="text-lg lg:text-xl text-gray-900 dark:text-white font-mono">
                {currentLesson.time}
              </span>
            </div>
          </div>

          <h3 className="text-gray-900 dark:text-white text-base lg:text-lg font-light mb-4 leading-tight font-serif">
            {parsedLesson.materia.toLowerCase()}
          </h3>

          <div className="space-y-3">
            {parsedLesson.aula && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 lg:w-4 lg:h-4 text-gray-900 dark:text-white" />
                <span className="text-xs lg:text-sm text-gray-900 dark:text-white font-mono">
                  {parsedLesson.aula.toLowerCase()}
                </span>
              </div>
            )}
            {parsedLesson.docente && (
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 lg:w-4 lg:h-4 text-gray-900 dark:text-white" />
                <span className="text-xs lg:text-sm text-gray-900 dark:text-white font-mono">
                  {parsedLesson.docente.toLowerCase()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 lg:w-4 lg:h-4 border border-gray-900 dark:border-white rounded-sm flex items-center justify-center">
                <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-gray-900 dark:bg-white rounded-full" />
              </div>
              <span className="text-xs lg:text-sm text-gray-900 dark:text-white font-mono">
                {parsedLesson.tipo.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="h-10 lg:h-12 pt-4 border-t border-gray-200 dark:border-gray-900 flex items-center justify-between">
          <span className="text-xs lg:text-sm text-gray-900 dark:text-white font-mono">
            {displayedLessons.length > 1
              ? `${displayIndex + 1} / ${displayedLessons.length}`
              : "1 / 1"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                userInteractedRef.current = true;
                setCurrentLessonIndex(Math.max(currentLessonIndex - 1, 0));
              }}
              disabled={displayIndex === 0 || displayedLessons.length <= 1}
              className="w-6 h-6 lg:w-7 lg:h-7 border border-gray-900 dark:border-white rounded-sm flex items-center justify-center hover:border-gray-900 dark:hover:border-white disabled:opacity-30 transition-colors"
              type="button"
            >
              <ChevronLeft className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-gray-900 dark:text-white" />
            </button>
            <button
              onClick={() => {
                userInteractedRef.current = true;
                setCurrentLessonIndex(
                  Math.min(currentLessonIndex + 1, displayedLessons.length - 1),
                );
              }}
              disabled={
                displayIndex === displayedLessons.length - 1 ||
                displayedLessons.length <= 1
              }
              className="w-6 h-6 lg:w-7 lg:h-7 border border-gray-900 dark:border-white rounded-sm flex items-center justify-center hover:border-gray-900 dark:hover:border-white disabled:opacity-30 transition-colors"
              type="button"
            >
              <ChevronRight className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-gray-900 dark:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
