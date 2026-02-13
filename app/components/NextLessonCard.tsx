"use client";

import { it } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronDown,
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
  const [isLandscape, setIsLandscape] = useState(false);
  const [calendarId] = useLocalStorage<string>("calendarId", "");
  const [hiddenSubjects] = useLocalStorage<string[]>(
    "hiddenSubjects",
    INITIAL_HIDDEN_SUBJECTS,
  );

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      userInteractedRef.current = false;
      setDayOffset(dayOffset + 1);
      setCurrentLessonIndex(0);
    }
    if (isRightSwipe) {
      if (dayOffset > 0) {
        userInteractedRef.current = false;
        setDayOffset(Math.max(dayOffset - 1, 0));
        setCurrentLessonIndex(0);
      }
    }
  };

  // Detect landscape orientation on mobile
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.matchMedia(
        "(max-height: 500px) and (orientation: landscape)",
      ).matches;
      setIsLandscape(isLandscapeMode);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

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
      <div
        className={cn(
          "w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-900 rounded-2xl overflow-hidden flex flex-col",
          isLandscape ? "h-full" : "h-fit",
        )}
      >
        <div
          className={cn(
            "border-b border-gray-200 dark:border-gray-900 flex-shrink-0",
            isLandscape ? "px-3 py-1.5" : "p-3 lg:p-4",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "bg-gray-300 dark:bg-white/20 rounded animate-pulse",
                  isLandscape ? "w-3.5 h-3.5" : "w-4 h-4 lg:w-5 lg:h-5",
                )}
              />
              <div
                className={cn(
                  "bg-gray-300 dark:bg-white/20 rounded animate-pulse",
                  isLandscape ? "h-3 w-12" : "h-3 lg:h-4 w-16 lg:w-20",
                )}
              />
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "bg-gray-300 dark:bg-white/20 rounded-md animate-pulse",
                  isLandscape ? "w-5 h-5" : "w-7 h-7 lg:w-8 lg:h-8",
                )}
              />
              <div
                className={cn(
                  "bg-gray-300 dark:bg-white/20 rounded animate-pulse",
                  isLandscape ? "h-3 w-8" : "h-3 lg:h-4 w-8 lg:w-10",
                )}
              />
              <div
                className={cn(
                  "bg-gray-300 dark:bg-white/20 rounded-md animate-pulse",
                  isLandscape ? "w-5 h-5" : "w-7 h-7 lg:w-8 lg:h-8",
                )}
              />
            </div>
          </div>
        </div>
        <div
          className={cn(
            "flex flex-col flex-1",
            isLandscape ? "p-2" : "p-4 lg:p-6",
          )}
        >
          <div className={cn(isLandscape ? "h-auto mb-1.5" : "h-8 mb-2")}>
            <div className="h-6 lg:h-7 bg-gray-300 dark:bg-white/20 rounded-lg w-20 lg:w-24 animate-pulse" />
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 lg:w-5 lg:h-5 bg-gray-300 dark:bg-white/20 rounded animate-pulse" />
              <div className="h-4 lg:h-5 bg-gray-300 dark:bg-white/20 rounded w-16 lg:w-20 animate-pulse" />
            </div>
            <div className="h-4 lg:h-5 bg-gray-300 dark:bg-white/20 rounded w-3/4 animate-pulse" />
            <div className={cn(isLandscape ? "flex gap-3" : "space-y-3")}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-300 dark:bg-white/20 rounded animate-pulse" />
                <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-16 lg:w-20 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-300 dark:bg-white/20 rounded animate-pulse" />
                <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-20 lg:w-24 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "border-t border-gray-200 dark:border-gray-900 flex items-center justify-between flex-shrink-0",
            isLandscape ? "px-2 py-1.5" : "px-4 py-3 lg:px-6 lg:py-4",
          )}
        >
          <div className="h-3 lg:h-4 bg-gray-300 dark:bg-white/20 rounded w-8 lg:w-10 animate-pulse" />
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "bg-gray-300 dark:bg-white/20 rounded-sm animate-pulse",
                isLandscape ? "w-4 h-4" : "w-6 h-6 lg:w-7 lg:h-7",
              )}
            />
            <div
              className={cn(
                "bg-gray-300 dark:bg-white/20 rounded-sm animate-pulse",
                isLandscape ? "w-4 h-4" : "w-6 h-6 lg:w-7 lg:h-7",
              )}
            />
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
      <div
        className={cn(
          "w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-900 rounded-2xl overflow-hidden flex flex-col",
          isLandscape ? "h-full" : "h-fit",
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={cn(
            "border-b border-gray-200 dark:border-gray-900 flex-shrink-0",
            isLandscape ? "px-3 py-1.5" : "p-3 lg:p-4",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <CalendarIcon
                className={cn(
                  "text-gray-900 dark:text-white flex-shrink-0",
                  isLandscape ? "w-3.5 h-3.5" : "w-4 h-4 lg:w-5 lg:h-5",
                )}
              />
              <span
                className={cn(
                  "text-gray-900 dark:text-white font-mono truncate",
                  isLandscape ? "text-xs" : "text-sm lg:text-base",
                )}
              >
                {data?.dayName || "Giorno"}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {dayOffset !== 0 && (
                <button
                  onClick={() => {
                    setDayOffset(0);
                    userInteractedRef.current = false;
                    setCurrentLessonIndex(0);
                  }}
                  className={cn(
                    "hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors",
                    isLandscape ? "p-1" : "p-1.5",
                  )}
                  title="Torna a oggi"
                  type="button"
                >
                  <RotateCcw
                    className={cn(
                      "text-gray-500 dark:text-gray-400",
                      isLandscape ? "w-3 h-3" : "w-3.5 h-3.5 lg:w-4 lg:h-4",
                    )}
                  />
                </button>
              )}

              <button
                onClick={() => {
                  userInteractedRef.current = false;
                  setDayOffset(Math.max(dayOffset - 1, 0));
                  setCurrentLessonIndex(0);
                }}
                disabled={dayOffset === 0}
                className={cn(
                  "border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors",
                  isLandscape ? "w-6 h-6" : "w-8 h-8 lg:w-9 lg:h-9",
                )}
                type="button"
              >
                <ChevronLeft
                  className={cn(
                    "text-gray-900 dark:text-white",
                    isLandscape ? "w-3 h-3" : "w-4 h-4 lg:w-5 lg:h-5",
                  )}
                />
              </button>

              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                      isCalendarOpen && "bg-gray-100 dark:bg-gray-800",
                    )}
                  >
                    <span
                      className={cn(
                        "text-gray-900 dark:text-white font-mono text-center",
                        isLandscape ? "text-[10px]" : "text-xs lg:text-sm",
                      )}
                    >
                      {getDate(dayOffset)}
                    </span>
                    <ChevronDown
                      className={cn(
                        "text-gray-500 dark:text-gray-400",
                        isLandscape ? "w-2.5 h-2.5" : "w-3 h-3 lg:w-4 lg:h-4",
                      )}
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl"
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
                className={cn(
                  "border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors",
                  isLandscape ? "w-6 h-6" : "w-8 h-8 lg:w-9 lg:h-9",
                )}
                type="button"
              >
                <ChevronRight
                  className={cn(
                    "text-gray-900 dark:text-white",
                    isLandscape ? "w-3 h-3" : "w-4 h-4 lg:w-5 lg:h-5",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <div
            className={cn(
              "border border-gray-900 dark:border-white rounded-2xl flex items-center justify-center mb-4",
              isLandscape ? "w-10 h-10" : "w-12 h-12 lg:w-14 lg:h-14",
            )}
          >
            <div
              className={cn(
                "border border-gray-900 dark:border-white rounded-sm",
                isLandscape ? "w-3 h-3" : "w-4 h-4 lg:w-5 lg:h-5",
              )}
            />
          </div>
          <p
            className={cn(
              "text-gray-900 dark:text-white font-mono",
              isLandscape ? "text-[10px]" : "text-xs lg:text-sm",
            )}
          >
            nessuna lezione
          </p>
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
    <div
      className={cn(
        "w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-900 rounded-2xl overflow-hidden flex flex-col",
        isLandscape ? "h-full" : "h-fit",
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header compatto con giorno e controlli data */}
      <div
        className={cn(
          "border-b border-gray-200 dark:border-gray-900 flex-shrink-0",
          isLandscape ? "px-3 py-1.5" : "p-3 lg:p-4",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CalendarIcon
              className={cn(
                "text-gray-900 dark:text-white flex-shrink-0",
                isLandscape ? "w-3.5 h-3.5" : "w-4 h-4 lg:w-5 lg:h-5",
              )}
            />
            <span
              className={cn(
                "text-gray-900 dark:text-white font-mono truncate",
                isLandscape ? "text-xs" : "text-sm lg:text-base",
              )}
            >
              {data.dayName}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {dayOffset !== 0 && (
              <button
                onClick={() => {
                  setDayOffset(0);
                  userInteractedRef.current = false;
                  setCurrentLessonIndex(0);
                }}
                className={cn(
                  "hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors",
                  isLandscape ? "p-1" : "p-1.5",
                )}
                title="Torna a oggi"
                type="button"
              >
                <RotateCcw
                  className={cn(
                    "text-gray-500 dark:text-gray-400",
                    isLandscape ? "w-3 h-3" : "w-3.5 h-3.5 lg:w-4 lg:h-4",
                  )}
                />
              </button>
            )}
            <button
              onClick={() => {
                userInteractedRef.current = false;
                setDayOffset(Math.max(dayOffset - 1, 0));
                setCurrentLessonIndex(0);
              }}
              disabled={dayOffset === 0}
              className={cn(
                "border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors",
                isLandscape ? "w-6 h-6" : "w-8 h-8 lg:w-9 lg:h-9",
              )}
              type="button"
            >
              <ChevronLeft
                className={cn(
                  "text-gray-900 dark:text-white",
                  isLandscape ? "w-3 h-3" : "w-4 h-4 lg:w-5 lg:h-5",
                )}
              />
            </button>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                    isCalendarOpen && "bg-gray-100 dark:bg-gray-800",
                  )}
                >
                  <span
                    className={cn(
                      "text-gray-900 dark:text-white font-mono text-center",
                      isLandscape ? "text-[10px]" : "text-xs lg:text-sm",
                    )}
                  >
                    {getDate(dayOffset)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "text-gray-500 dark:text-gray-400",
                      isLandscape ? "w-2.5 h-2.5" : "w-3 h-3 lg:w-4 lg:h-4",
                    )}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl"
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
              className={cn(
                "border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors",
                isLandscape ? "w-6 h-6" : "w-8 h-8 lg:w-9 lg:h-9",
              )}
              type="button"
            >
              <ChevronRight
                className={cn(
                  "text-gray-900 dark:text-white",
                  isLandscape ? "w-3 h-3" : "w-4 h-4 lg:w-5 lg:h-5",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div
        className={cn(
          "flex flex-col flex-1 overflow-y-auto",
          isLandscape ? "p-2" : "p-4 lg:p-6",
        )}
      >
        {/* Badge status */}
        <div
          className={cn(
            "flex items-start",
            isLandscape ? "h-auto mb-1.5" : "h-8 lg:h-9 mb-2",
          )}
        >
          {(isCurrentLesson || isNextLesson) && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono whitespace-nowrap",
                isLandscape ? "text-[9px]" : "text-xs lg:text-sm",
                isCurrentLesson
                  ? "text-green-800 dark:text-white bg-green-500 bg-opacity-20 dark:bg-opacity-10 border border-green-700 dark:border-green-900"
                  : "text-blue-800 dark:text-white bg-blue-500 bg-opacity-20 dark:bg-opacity-10 border border-blue-700 dark:border-blue-900",
              )}
            >
              <div
                className={cn(
                  "rounded-full",
                  isLandscape ? "w-1.5 h-1.5" : "w-1.5 h-1.5 lg:w-2 lg:h-2",
                  isCurrentLesson
                    ? "bg-green-600 dark:bg-green-400"
                    : "bg-blue-600 dark:bg-blue-400",
                )}
              />
              {isCurrentLesson ? "in corso" : "prossima"}
            </div>
          )}
        </div>

        {/* Main lesson info */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Time */}
          <div
            className={cn(
              "flex items-center gap-2",
              isLandscape ? "mb-1.5" : "mb-4",
            )}
          >
            <Clock
              className={cn(
                "text-gray-900 dark:text-white flex-shrink-0",
                isLandscape ? "w-3.5 h-3.5" : "w-4 h-4 lg:w-5 lg:h-5",
              )}
            />
            <span
              className={cn(
                "text-gray-900 dark:text-white font-mono whitespace-nowrap",
                isLandscape ? "text-sm font-semibold" : "text-lg lg:text-xl",
              )}
            >
              {currentLesson.time}
            </span>
          </div>

          {/* Subject name */}
          <h3
            className={cn(
              "text-gray-900 dark:text-white font-light leading-tight font-serif",
              isLandscape
                ? "text-xs mb-2 line-clamp-1"
                : "text-base lg:text-lg mb-4",
            )}
          >
            {parsedLesson.materia.toLowerCase()}
          </h3>

          {/* Details in a compact row for landscape */}
          <div
            className={cn(
              isLandscape ? "flex flex-wrap gap-x-3 gap-y-1" : "space-y-3",
            )}
          >
            {parsedLesson.aula && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <MapPin
                  className={cn(
                    "text-gray-900 dark:text-white flex-shrink-0",
                    isLandscape ? "w-2.5 h-2.5" : "w-3 h-3 lg:w-4 lg:h-4",
                  )}
                />
                <span
                  className={cn(
                    "text-gray-900 dark:text-white font-mono",
                    isLandscape
                      ? "text-[9px] truncate max-w-[100px]"
                      : "text-xs lg:text-sm",
                  )}
                >
                  {parsedLesson.aula.toLowerCase()}
                </span>
              </div>
            )}
            {parsedLesson.docente && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <User
                  className={cn(
                    "text-gray-900 dark:text-white flex-shrink-0",
                    isLandscape ? "w-2.5 h-2.5" : "w-3 h-3 lg:w-4 lg:h-4",
                  )}
                />
                <span
                  className={cn(
                    "text-gray-900 dark:text-white font-mono",
                    isLandscape
                      ? "text-[9px] truncate max-w-[100px]"
                      : "text-xs lg:text-sm",
                  )}
                >
                  {parsedLesson.docente.toLowerCase()}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className={cn(
                  "border border-gray-900 dark:border-white rounded-sm flex items-center justify-center flex-shrink-0",
                  isLandscape ? "w-2.5 h-2.5" : "w-3 h-3 lg:w-4 lg:h-4",
                )}
              >
                <div
                  className={cn(
                    "bg-gray-900 dark:bg-white rounded-full",
                    isLandscape ? "w-0.5 h-0.5" : "w-1 h-1 lg:w-1.5 lg:h-1.5",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-gray-900 dark:text-white font-mono whitespace-nowrap",
                  isLandscape ? "text-[9px]" : "text-xs lg:text-sm",
                )}
              >
                {parsedLesson.tipo.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with navigation */}
      <div
        className={cn(
          "border-t border-gray-200 dark:border-gray-900 flex items-center justify-between flex-shrink-0",
          isLandscape ? "px-2 py-1.5" : "px-4 py-3 lg:px-6 lg:py-4",
        )}
      >
        <span
          className={cn(
            "text-gray-900 dark:text-white font-mono",
            isLandscape ? "text-[9px]" : "text-xs lg:text-sm",
          )}
        >
          {displayedLessons.length > 1
            ? `${displayIndex + 1}/${displayedLessons.length}`
            : "1/1"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              userInteractedRef.current = true;
              setCurrentLessonIndex(Math.max(currentLessonIndex - 1, 0));
            }}
            disabled={displayIndex === 0 || displayedLessons.length <= 1}
            className={cn(
              "border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors",
              isLandscape ? "w-6 h-6" : "w-8 h-8 lg:w-9 lg:h-9",
            )}
            type="button"
          >
            <ChevronLeft
              className={cn(
                "text-gray-900 dark:text-white",
                isLandscape ? "w-3 h-3" : "w-4 h-4 lg:w-5 lg:h-5",
              )}
            />
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
            className={cn(
              "border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 disabled:opacity-30 transition-colors",
              isLandscape ? "w-6 h-6" : "w-8 h-8 lg:w-9 lg:h-9",
            )}
            type="button"
          >
            <ChevronRight
              className={cn(
                "text-gray-900 dark:text-white",
                isLandscape ? "w-3 h-3" : "w-4 h-4 lg:w-5 lg:h-5",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
