"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { parseOrarioData } from "@/lib/orario-utils";
import { CalendarView } from "./components/CalendarView";
import NextLessonCard from "./components/NextLessonCard";
import { ThemeToggle } from "./components/ThemeToggle";

export default function Home() {
  const [weekOffset, setWeekOffset] = useState(0);

  const {
    data: orario,
    isLoading,
    error,
  } = api.orario.getOrario.useQuery({ 
    name: "INFORMATICA",
    location: "Varese",
    dayOffset: weekOffset 
  }, {
    keepPreviousData: true // Keep showing old data while fetching new week
  });

  const schedule = orario ? parseOrarioData(orario) : [];

  const handleNextWeek = () => setWeekOffset(prev => prev + 7);
  const handlePrevWeek = () => setWeekOffset(prev => prev - 7);
  const handleReset = () => setWeekOffset(0);

  if (isLoading && !orario) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
            Caricamento orario...
          </p>
        </div>
        <ThemeToggle />
      </div>
    );
  }

  if (error) {
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
        </div>
        <ThemeToggle />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col">
      <main className="w-full px-4 py-4 space-y-6 flex-1">
        <h1 className="text-4xl font-semibold mb-4 text-gray-900 dark:text-white font-serif">
          Orario Insubria
        </h1>
        
        {/* Only show Next Lesson if we are looking at the current week/future, 
            or just always show it? Usually Next Lesson is relative to "NOW". 
            But if I navigate to next year, "Next Lesson" card might seem redundant 
            or should it stick to "Real Time Next Lesson"? 
            Let's keep it real-time (unaffected by navigation) for now. 
            Wait, I need to check if NextLessonCard uses 'schedule' prop.
            Yes it does. So if I navigate to next week, NextLessonCard will 
            try to find the next lesson in *that* week.
            That might be what the user wants: "What is the first lesson of that week?"
            Or they might want "What is my next lesson right now?".
            Usually "Next Lesson" implies relative to wall-clock time. 
            If I pass next week's schedule, it might show Monday's lesson. 
            That's acceptable behavior.
        */}
        <section>
          <NextLessonCard schedule={schedule} />
        </section>

        <section>
          <CalendarView 
            schedule={schedule} 
            weekOffset={weekOffset}
            onNextWeek={handleNextWeek}
            onPrevWeek={handlePrevWeek}
            onReset={handleReset}
            onSetOffset={setWeekOffset}
          />
        </section>
      </main>

      <ThemeToggle />
    </div>
  );
}