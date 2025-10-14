"use client";

import { parseOrarioData } from "@/lib/orario-utils";
import { CalendarView } from "./components/CalendarView";
import NextLessonCard from "./components/NextLessonCard";
import { ThemeToggle } from "./components/ThemeToggle";
import { useEffect, useState } from "react";

export default function Home() {
  const [orario, setOrario] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch("https://orario.zimaserver.it/api/public/orario/get-orario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "test" }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Errore nella risposta API");
        return await res.json();
      })
      .then((data) => {
        setOrario(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  const schedule = orario ? parseOrarioData(orario) : [];

  if (isLoading) {
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
      {/* Contenuto principale */}
      <main className="w-full px-4 py-4 space-y-6 flex-1">
        <h1 className="text-4xl font-semibold mb-4 text-gray-900 dark:text-white font-serif">
          Orario Insubria
        </h1>
        <section>
          <NextLessonCard />
        </section>

        {/* Sezione Calendario */}
        <section>
          <CalendarView schedule={schedule} />
        </section>
      </main>

      <ThemeToggle />
    </div>
  );
}
