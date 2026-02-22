"use client";

import { AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarMonthIcon,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDayDialog } from "@/app/components/CalendarDayDialog";
import { api } from "@/lib/api";
import { useLocalStorage } from "@/lib/hooks";
import type { DaySchedule } from "@/lib/orario-utils";
import { getMateriaColorMap, parseOrarioData } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";
import { CalendarView } from "./components/CalendarView";
import { DayView } from "./components/DayView";
import { MonthlyView } from "./components/MonthlyView";
import NextLessonCard from "./components/NextLessonCard";
import { SettingsDialog } from "./components/SettingsDialog";
import { ThemeToggle } from "./components/ThemeToggle";
import { WelcomeDialog } from "./components/WelcomeDialog";

export default function Home() {
  const _router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [activeView, setActiveView] = useState<"week" | "month">("week");
  const [calendarIds] = useLocalStorage<string[]>("calendarIds", []);
  const [calendarId] = useLocalStorage<string>("calendarId", ""); // Still keep for backward compatibility during transition
  const [courseNames] = useLocalStorage<string[]>("courseNames", []);
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage<boolean>(
    "hasSeenWelcomeV2",
    false,
  );
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Effective IDs to use for queries
  const activeLinkIds =
    calendarIds.length > 0 ? calendarIds : calendarId ? [calendarId] : [];

  useEffect(() => {
    setIsClient(true);
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (isClient && !hasSeenWelcome) {
      setIsWelcomeOpen(true);
      setIsSettingsOpen(false);
    } else if (isClient && hasSeenWelcome && activeLinkIds.length === 0) {
      setIsSettingsOpen(true);
    }
  }, [isClient, activeLinkIds.length, hasSeenWelcome]);

  const handleWelcomeComplete = () => {
    setHasSeenWelcome(true);
    setIsWelcomeOpen(false);
    if (activeLinkIds.length === 0) {
      setTimeout(() => {
        setIsSettingsOpen(true);
      }, 300);
    }
  };

  const {
    data: orario,
    isLoading,
    error,
  } = api.orario.getOrario.useQuery(
    {
      name: "INFORMATICA",
      location: "Varese",
      dayOffset: weekOffset,
      linkIds: activeLinkIds,
    },
    {
      placeholderData: (previousData) => previousData,
      enabled: activeLinkIds.length > 0,
    },
  );

  const { data: allSubjects = [] } = api.orario.getSubjects.useQuery(
    { linkIds: activeLinkIds },
    { enabled: activeLinkIds.length > 0 },
  );

  const schedule = orario ? parseOrarioData(orario) : [];
  const materiaColorMap = getMateriaColorMap(allSubjects);

  const handleNextWeek = () => setWeekOffset((prev) => prev + 7);
  const handlePrevWeek = () => setWeekOffset((prev) => prev - 7);
  const handleReset = () => setWeekOffset(0);

  if (!isClient) {
    return null;
  }

  const hasConfiguredCourses = activeLinkIds.length > 0;

  if (isLoading && !orario && hasConfiguredCourses) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400 font-mono text-sm uppercase tracking-widest">
            Caricamento...
          </p>
        </div>

        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          forceOpen={hasSeenWelcome && !hasConfiguredCourses}
        />
      </div>
    );
  }

  if (error && hasConfiguredCourses) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Errore</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-500 font-serif text-lg font-bold mb-2">
            Errore di caricamento
          </p>
          <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed">
            {error.message}
          </p>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg"
          >
            Controlla impostazioni
          </button>
        </div>

        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          forceOpen={hasSeenWelcome && !hasConfiguredCourses}
        />
      </div>
    );
  }

  const displayTitle =
    courseNames.length > 0
      ? courseNames.length > 1
        ? `${courseNames[0]} (+${courseNames.length - 1})`
        : courseNames[0]
      : "Orario Insubria";

  return (
    <div className="h-[100dvh] bg-white dark:bg-black text-zinc-900 dark:text-white flex flex-col overflow-hidden fixed inset-0">
      <main className="w-full px-4 py-3 portrait:py-4 md:px-6 lg:px-8 lg:py-6 flex-1 max-w-screen-2xl mx-auto flex flex-col overflow-hidden">
        <header className="flex items-center justify-between mb-4 lg:mb-8 flex-shrink-0 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col min-w-0 cursor-default select-none group focus:outline-none text-left max-w-full">
              <h1 className="text-base lg:text-lg font-bold text-zinc-900 dark:text-white font-serif tracking-tight truncate leading-none w-full">
                {displayTitle}
              </h1>
              {courseNames.length > 0 && (
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1 truncate w-full">
                  Orario Insubria
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-1 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setActiveView("week")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeView === "week"
                  ? "bg-white dark:bg-black text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settimana</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("month")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeView === "month"
                  ? "bg-white dark:bg-black text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
              )}
            >
              <CalendarMonthIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mese</span>
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-90 flex-shrink-0"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {hasConfiguredCourses ? (
          <div className="flex flex-col flex-1 min-h-0">
            {activeView === "week" ? (
              <div className="flex flex-col md:grid md:grid-cols-12 gap-3 lg:gap-6 xl:gap-8 flex-1 min-h-0">
                <section className="w-full md:col-span-4 lg:col-span-3 xl:col-span-3 flex-shrink-0 min-w-0 flex flex-col">
                  <NextLessonCard schedule={schedule} />
                </section>

                <section className="w-full flex-1 min-h-0 flex flex-col md:col-span-8 lg:col-span-4 xl:col-span-4">
                  <CalendarView
                    schedule={schedule}
                    weekOffset={weekOffset}
                    onNextWeek={handleNextWeek}
                    onPrevWeek={handlePrevWeek}
                    onReset={handleReset}
                    onSetOffset={setWeekOffset}
                    onDaySelect={setSelectedDay}
                    selectedDay={selectedDay}
                    materiaColorMap={materiaColorMap}
                  />
                </section>

                <section className="hidden lg:flex flex-col lg:col-span-5 xl:col-span-5 min-w-0 min-h-0">
                  <DayView
                    day={selectedDay}
                    materiaColorMap={materiaColorMap}
                  />
                </section>
              </div>
            ) : (
              <div className="flex flex-col md:grid md:grid-cols-12 gap-3 lg:gap-6 xl:gap-8 flex-1 min-h-0 h-full">
                <section className="flex-1 min-h-0 flex flex-col md:col-span-12 lg:col-span-7 xl:col-span-8 h-full">
                  <MonthlyView
                    onDaySelect={setSelectedDay}
                    materiaColorMap={materiaColorMap}
                  />
                </section>
                <section className="hidden lg:block lg:col-span-5 xl:col-span-4 min-h-0 h-full">
                  <DayView
                    day={selectedDay}
                    materiaColorMap={materiaColorMap}
                  />
                </section>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-8">
            <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-sm animate-in zoom-in duration-500">
              <CalendarIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
            </div>
            <div className="max-w-xs space-y-3">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-serif">
                Nessun calendario
              </h2>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                Configura i tuoi corsi di studi per iniziare a visualizzare
                l'orario delle lezioni.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-sm shadow-xl hover:opacity-90 transition-all active:scale-95"
            >
              Configura Ora
            </button>
          </div>
        )}
      </main>

      <WelcomeDialog
        isOpen={isWelcomeOpen}
        onComplete={handleWelcomeComplete}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        forceOpen={hasSeenWelcome && !hasConfiguredCourses}
      />

      <AnimatePresence>
        {selectedDay && !isDesktop && (
          <CalendarDayDialog
            day={selectedDay}
            isOpen={true}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <title>Calendario</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
