import type { DateTime } from "luxon";
import puppeteer from "puppeteer";
import { z } from "zod";
import {
  addDays,
  formatDate,
  getCurrentItalianDateTime,
  getDayOfWeek,
  timeToMinutes,
} from "@/lib/date-utils";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Tipo per i dati dell'orario
type OrarioData = Array<{
  day: number;
  events: Array<{ time: string; title: string }>;
}>;

// Cache in-memory per i dati dell'orario con durate diverse per giorno
interface CacheItem {
  data: OrarioData;
  timestamp: number;
  dayOffset: number;
}
const cache: Record<number, CacheItem> = {};

// Durate di cache differenziate per tipo di giorno
function getCacheDuration(dayOffset: number): number {
  if (dayOffset < 0) return 0; // Nessuna cache per i giorni precedenti
  if (dayOffset === 0) return 30 * 60 * 1000; // 30 minuti per oggi
  return 4 * 60 * 60 * 1000; // 4 ore per i giorni futuri
}

const scrap = async (dayOffset: number = 0): Promise<OrarioData> => {
  const now = Date.now();
  const cacheDuration = getCacheDuration(dayOffset);

  // Controlla se abbiamo dati in cache ancora validi per il dayOffset richiesto
  if (
    cacheDuration > 0 &&
    cache[dayOffset] &&
    now - cache[dayOffset].timestamp < cacheDuration
  ) {
    return cache[dayOffset].data;
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  try {
    const page = await browser.newPage();

    // NON disabilitare le risorse - potrebbero essere necessarie per il rendering
    await page.goto(
      "https://unins.prod.up.cineca.it/calendarioPubblico/linkCalendarioId=68cb8d7de418fc00412a332a",
      { waitUntil: "networkidle2", timeout: 30000 }, // Aumentato timeout e ritorno a networkidle2
    );

    // Debug: controlla cosa c'è sulla pagina
    const pageContent = await page.evaluate(() => {
      const cols = document.querySelectorAll(".fc-content-col");

      return Array.from(cols).map((col, dayIndex) => {
        const events = Array.from(col.querySelectorAll(".fc-event"));

        // Estrai tutti i dati senza filtri per il debug
        const allEvents = events.map((card) => {
          const time =
            card.querySelector(".fc-time")?.textContent?.trim() ?? "";
          const title =
            card.querySelector(".fc-title")?.textContent?.trim() ?? "";
          return { time, title };
        });

        // Applica il filtro per mantenere solo gli eventi con "Var"
        const parsedEvents = allEvents.filter((event) =>
          event.title.includes("Var"),
        );

        return {
          day: dayIndex,
          events: parsedEvents,
          allEvents, // Aggiungi tutti gli eventi per il debug
        };
      });
    });

    // Rimuovi allEvents prima di salvare nella cache
    const filteredContent = pageContent.map((day) => ({
      day: day.day,
      events: day.events,
    }));

    // Salva in cache solo se abbiamo dati
    if (filteredContent.some((day) => day.events.length > 0)) {
      cache[dayOffset] = {
        data: filteredContent,
        timestamp: Date.now(),
        dayOffset,
      };
    } else {
      console.warn("No events found on page! Not caching empty data.");
    }

    return filteredContent;
  } finally {
    await browser.close();
  }
};

// Utility per trovare la prossima lezione
const findNextLesson = (
  lessons: { time: string; title: string }[],
  currentTime: DateTime,
  isToday: boolean,
) => {
  // Se non è oggi, non cerchiamo la "prossima" lezione basata sull'ora
  if (!isToday) {
    return null;
  }

  const now = currentTime.hour * 60 + currentTime.minute;

  const parsedLessons = lessons
    .map((lesson) => {
      const timeRange = lesson.time.split(" - ");
      if (timeRange.length !== 2) return null;

      const startMinutes = timeToMinutes(timeRange[0]);
      const endMinutes = timeToMinutes(timeRange[1]);

      if (startMinutes === null || endMinutes === null) return null;

      return {
        ...lesson,
        startMinutes,
        endMinutes,
      };
    })
    .filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== null);

  // Trova la lezione in corso
  const currentLesson = parsedLessons.find(
    (lesson) =>
      lesson && now >= lesson.startMinutes && now <= lesson.endMinutes,
  );

  if (currentLesson) {
    return { lesson: currentLesson, status: "current" as const };
  }

  // Trova la prossima lezione
  const nextLesson = parsedLessons
    .filter((lesson) => lesson && lesson.startMinutes > now)
    .sort((a, b) => a.startMinutes - b.startMinutes)[0];

  if (nextLesson) {
    return { lesson: nextLesson, status: "next" as const };
  }

  return null;
};

export const orarioRouter = createTRPCRouter({
  getOrario: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async () => {
      return await scrap();
    }),

  getNextLesson: publicProcedure
    .input(
      z.object({
        dayOffset: z.number().default(0), // 0 = oggi, 1 = domani, etc.
      }),
    )
    .query(async ({ input }) => {
      // Passa dayOffset alla funzione scrap per utilizzare la cache appropriata
      const orarioData = await scrap(input.dayOffset);

      const currentDate = getCurrentItalianDateTime();
      const targetDate = addDays(currentDate, input.dayOffset);

      const adjustedDay = getDayOfWeek(targetDate);

      const daySchedule = orarioData.find(
        (day: {
          day: number;
          events: Array<{ time: string; title: string }>;
        }) => day.day === adjustedDay,
      );

      if (!daySchedule || daySchedule.events.length === 0) {
        return {
          hasLessons: false,
          dayName: [
            "Lunedì",
            "Martedì",
            "Mercoledì",
            "Giovedì",
            "Venerdì",
            "Sabato",
            "Domenica",
          ][adjustedDay],
          date: formatDate(targetDate),
          lessons: [],
        };
      }

      // Solo per oggi cerchiamo la prossima lezione
      const isToday = input.dayOffset === 0;
      const nextLessonInfo = findNextLesson(
        daySchedule.events,
        currentDate,
        isToday,
      );

      return {
        hasLessons: true,
        dayName: [
          "Lunedì",
          "Martedì",
          "Mercoledì",
          "Giovedì",
          "Venerdì",
          "Sabato",
          "Domenica",
        ][adjustedDay],
        date: formatDate(targetDate),
        lessons: daySchedule.events,
        nextLesson: nextLessonInfo,
        totalLessons: daySchedule.events.length,
      };
    }),
});
