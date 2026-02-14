"use client";

import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLocalStorage } from "@/lib/hooks";
import type { DaySchedule } from "@/lib/orario-utils";
import { getMateriaColorMap, parseOrarioData } from "@/lib/orario-utils";
import { CalendarView } from "./components/CalendarView";
import { DayView } from "./components/DayView";
import NextLessonCard from "./components/NextLessonCard";
import { SettingsDialog } from "./components/SettingsDialog";
import { ThemeToggle } from "./components/ThemeToggle";
import { WelcomeDialog } from "./components/WelcomeDialog";

export default function Home() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [calendarId] = useLocalStorage<string>("calendarId", "");
  const [courseName] = useLocalStorage<string>("courseName", "");
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage<boolean>(
    "hasSeenWelcomeV2",
    false,
  );
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !hasSeenWelcome) {
      setIsWelcomeOpen(true);
      setIsSettingsOpen(false);
    } else if (isClient && hasSeenWelcome && !calendarId) {
      setIsSettingsOpen(true);
    }
  }, [isClient, calendarId, hasSeenWelcome]);

  const handleWelcomeComplete = () => {
    setHasSeenWelcome(true);
    setIsWelcomeOpen(false);
    if (!calendarId) {
      setTimeout(() => {
        setIsSettingsOpen(true);
      }, 300);
    }
  };

  const handleShowWelcome = () => {
    setIsWelcomeOpen(true);
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
      linkId: calendarId,
    },
    {
      placeholderData: (previousData) => previousData,
      enabled: !!calendarId,
    },
  );

  const schedule = orario ? parseOrarioData(orario) : [];

  const allMaterie = schedule.flatMap((day) =>
    day.events.map((ev) => ev.materia),
  );
  const materiaColorMap = getMateriaColorMap(allMaterie);

  const handleNextWeek = () => setWeekOffset((prev) => prev + 7);
  const handlePrevWeek = () => setWeekOffset((prev) => prev - 7);
  const handleReset = () => setWeekOffset(0);

  if (!isClient) {
    return null;
  }

  if (isLoading && !orario && calendarId) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
            Caricamento orario...
          </p>
        </div>
        <ThemeToggle />
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          forceOpen={hasSeenWelcome && !calendarId}
          onShowWelcome={handleShowWelcome}
        />
      </div>
    );
  }

  if (error && calendarId) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <title>Errore</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-400 font-mono text-sm mb-2">
            Errore nel caricamento
          </p>
          <p className="text-gray-500 text-xs">{error.message}</p>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="mt-4 text-xs underline text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
          >
            Controlla impostazioni
          </button>
        </div>
        <ThemeToggle />
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          forceOpen={hasSeenWelcome && !calendarId}
          onShowWelcome={handleShowWelcome}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col overflow-hidden">
      <main className="w-full px-4 py-3 portrait:py-4 lg:px-8 lg:py-6 flex-1 max-w-4xl mx-auto flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2 portrait:mb-4 lg:mb-6 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h1
              className="text-xl landscape:text-2xl portrait:text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-white font-serif cursor-default select-none truncate"
              onDoubleClick={() => router.push("/admin")}
              title="Doppio click per accedere all'admin"
            >
              Orario Insubria
            </h1>
            {courseName && (
              <p className="text-[10px] landscape:text-xs portrait:text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-0.5 portrait:mt-1 truncate">
                {courseName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors flex-shrink-0 ml-2"
          >
            <Settings className="w-4 h-4 portrait:w-5 portrait:h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {calendarId ? (
          <div className="flex flex-col landscape:flex-row lg:grid lg:grid-cols-12 gap-2 landscape:gap-3 portrait:gap-6 lg:gap-4 flex-1 min-h-0">
            <section className="w-full landscape:w-[280px] lg:col-span-3 flex-shrink-0 landscape:overflow-hidden">
              <NextLessonCard schedule={schedule} />
            </section>

            <section className="w-full landscape:flex-1 lg:col-span-5 flex-1 min-h-0 portrait:flex-1 flex flex-col">
              <CalendarView
                schedule={schedule}
                weekOffset={weekOffset}
                onNextWeek={handleNextWeek}
                onPrevWeek={handlePrevWeek}
                onReset={handleReset}
                onSetOffset={setWeekOffset}
                onDaySelect={setSelectedDay}
                selectedDay={selectedDay}
              />
            </section>

            <section className="hidden lg:block lg:col-span-4 lg:overflow-hidden">
              <DayView day={selectedDay} materiaColorMap={materiaColorMap} />
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
            <p className="text-gray-500 dark:text-gray-400">
              Nessun calendario configurato.
            </p>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg text-sm font-medium"
            >
              Configura Ora
            </button>
          </div>
        )}
      </main>

      <ThemeToggle />

      <WelcomeDialog
        isOpen={isWelcomeOpen}
        onComplete={handleWelcomeComplete}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        forceOpen={hasSeenWelcome && !calendarId}
        onShowWelcome={handleShowWelcome}
      />
    </div>
  );
}
