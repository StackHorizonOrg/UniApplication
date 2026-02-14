import { DateTime } from "luxon";
import { z } from "zod";
import {
  addDays,
  formatDate,
  getCurrentItalianDateTime,
  getDayOfWeek,
  timeToMinutes,
} from "@/lib/date-utils";
import { createTRPCRouter, publicProcedure } from "../trpc";

type OrarioData = Array<{
  day: number;
  events: Array<{
    time: string;
    title: string;
    location: string;
    professor: string;
  }>;
}>;

interface CinecaEvent {
  nome?: string;
  dataInizio: string;
  dataFine: string;
  aule?: Array<{
    descrizione: string;
    edificio?: {
      comune: string;
    };
  }>;
  docenti?: Array<{
    cognome: string;
    nome: string;
  }>;
  corsi?: Array<{
    descrizione: string;
  }>;
}

const fetchRawEvents = async (
  dayOffset = 0,
  linkId: string,
): Promise<CinecaEvent[]> => {
  if (!linkId) return [];

  const currentDate = getCurrentItalianDateTime();
  const targetDate = addDays(currentDate, dayOffset);

  const dayOfWeek = getDayOfWeek(targetDate);
  const startRange = targetDate.minus({ days: dayOfWeek }).startOf("day");
  const endRange = startRange.plus({ days: 6 }).endOf("day");

  const url =
    "https://unins.prod.up.cineca.it/api/Impegni/getImpegniCalendarioPubblico";
  const body = {
    mostraImpegniAnnullati: true,
    mostraIndisponibilitaTotali: false,
    linkCalendarioId: linkId,
    clienteId: "59f05192a635f443422fe8fd",
    pianificazioneTemplate: false,
    dataInizio: startRange.toISO(),
    dataFine: endRange.toISO(),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const rawData = await response.json();
    return Array.isArray(rawData) ? rawData : rawData.impegni || [];
  } catch (error) {
    console.error("Failed to fetch orario:", error);
    return [];
  }
};

const processEvents = (
  events: CinecaEvent[],
  _courseName: string,
  locationFilter: "Varese" | "Como" | "Tutte",
): OrarioData => {
  const result: OrarioData = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    day: d,
    events: [],
  }));

  for (const e of events) {
    let eventCity = "Unknown";
    let aulaName = "N/A";
    let padiglione = "";

    if (e.aule && e.aule.length > 0) {
      aulaName = e.aule[0].descrizione;
      if (e.aule[0].edificio) {
        eventCity = e.aule[0].edificio.comune;
      }

      // Extract padiglione from aula description if present
      const padiglioneMatch = aulaName.match(/Padiglione\s+([^-]+)/i);
      if (padiglioneMatch) {
        padiglione = `Pad. ${padiglioneMatch[1].trim()}`;
      } else {
        // Check for full names
        if (aulaName.includes("Morselli")) padiglione = "Pad. Morselli";
        else if (aulaName.includes("Seppilli")) padiglione = "Pad. Seppilli";
        else if (aulaName.includes("Antonini")) padiglione = "Pad. Antonini";
        else if (aulaName.includes("Monte Generoso"))
          padiglione = "Pad. Monte Generoso";
        // Check for abbreviations (word boundaries to avoid partial matches)
        else if (/\bPM\b/i.test(aulaName) || /\bTM\b/i.test(aulaName))
          padiglione = "Pad. Morselli";
        else if (/\bMTG\b/i.test(aulaName) || /\bMG\b/i.test(aulaName))
          padiglione = "Pad. Monte Generoso";
        else if (/\bSEP\b/i.test(aulaName)) padiglione = "Pad. Seppilli";
        else if (/\bANT\b/i.test(aulaName)) padiglione = "Pad. Antonini";
      }
    }

    if (locationFilter !== "Tutte") {
      const isVarese =
        eventCity.toUpperCase().includes("VARESE") ||
        aulaName.toUpperCase().includes("VARESE");
      const isComo =
        eventCity.toUpperCase().includes("COMO") ||
        aulaName.toUpperCase().includes("COMO");

      if (locationFilter === "Varese" && !isVarese) continue;
      if (locationFilter === "Como" && !isComo) continue;
    }

    const date = DateTime.fromISO(e.dataInizio).setZone("Europe/Rome");
    const dayIdx = getDayOfWeek(date);

    const start = DateTime.fromISO(e.dataInizio)
      .setZone("Europe/Rome")
      .toFormat("HH:mm");
    const end = DateTime.fromISO(e.dataFine)
      .setZone("Europe/Rome")
      .toFormat("HH:mm");
    const professor =
      e.docenti && e.docenti.length > 0
        ? `${e.docenti[0].cognome} ${e.docenti[0].nome}`
        : "N/A";
    const time = `${start} - ${end}`;
    const title = e.nome || "Lezione";

    let location = `${aulaName} (${eventCity})`;
    if (padiglione) {
      const normalizedAula = aulaName.toLowerCase();
      const normalizedPad = padiglione.toLowerCase().replace("pad.", "").trim();

      if (!normalizedAula.includes(normalizedPad)) {
        location = `${aulaName} - ${padiglione} (${eventCity})`;
      }
    }

    if (dayIdx >= 0 && dayIdx <= 6) {
      const isDuplicate = result[dayIdx].events.some(
        (existing) =>
          existing.title === title &&
          existing.time === time &&
          existing.location === location,
      );

      if (!isDuplicate) {
        result[dayIdx].events.push({
          time,
          title,
          location,
          professor,
        });
      }
    }
  }

  for (const day of result) {
    day.events.sort((a, b) => a.time.localeCompare(b.time));
  }

  return result;
};

const findNextLesson = (
  lessons: { time: string; title: string }[],
  currentTime: DateTime,
  isToday: boolean,
) => {
  if (!isToday) return null;

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

  const currentLesson = parsedLessons.find(
    (lesson) => now >= lesson.startMinutes && now <= lesson.endMinutes,
  );

  if (currentLesson) {
    return { lesson: currentLesson, status: "current" as const };
  }

  const nextLesson = parsedLessons
    .filter((lesson) => lesson.startMinutes > now)
    .sort((a, b) => a.startMinutes - b.startMinutes)[0];

  if (nextLesson) {
    return { lesson: nextLesson, status: "next" as const };
  }

  return null;
};

export const orarioRouter = createTRPCRouter({
  getOrario: publicProcedure
    .input(
      z.object({
        name: z.string().default("INFORMATICA"),
        location: z.enum(["Varese", "Como", "Tutte"]).default("Tutte"),
        dayOffset: z.number().default(0),
        linkId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.linkId) return [];
      const rawEvents = await fetchRawEvents(input.dayOffset, input.linkId);
      return processEvents(rawEvents, input.name, input.location);
    }),

  getNextLesson: publicProcedure
    .input(
      z.object({
        dayOffset: z.number().default(0),
        name: z.string().default("INFORMATICA"),
        location: z.enum(["Varese", "Como", "Tutte"]).default("Tutte"),
        linkId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.linkId) return { hasLessons: false, lessons: [], dayName: "" };

      const rawEvents = await fetchRawEvents(input.dayOffset, input.linkId);
      const orarioData = processEvents(rawEvents, input.name, input.location);

      const currentDate = getCurrentItalianDateTime();
      const targetDate = addDays(currentDate, input.dayOffset);
      const adjustedDay = getDayOfWeek(targetDate);

      const daySchedule = orarioData.find((day) => day.day === adjustedDay);

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

  getSubjects: publicProcedure
    .input(
      z.object({
        linkId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const currentDate = getCurrentItalianDateTime();
      const startRange = currentDate.startOf("day");
      const endRange = startRange.plus({ months: 6 }).endOf("day");

      const url =
        "https://unins.prod.up.cineca.it/api/Impegni/getImpegniCalendarioPubblico";
      const body = {
        mostraImpegniAnnullati: true,
        mostraIndisponibilitaTotali: false,
        linkCalendarioId: input.linkId,
        clienteId: "59f05192a635f443422fe8fd",
        pianificazioneTemplate: false,
        dataInizio: startRange.toISO(),
        dataFine: endRange.toISO(),
      };

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const rawData = await response.json();
        const rawEvents: CinecaEvent[] = Array.isArray(rawData)
          ? rawData
          : rawData.impegni || [];

        const subjects = new Set<string>();
        for (const e of rawEvents) {
          const title = e.nome || "Lezione";

          const aulaMatch = title.match(/^(.+?)Aula/);
          const materia = aulaMatch ? aulaMatch[1].trim() : title;

          subjects.add(materia);
        }

        return Array.from(subjects).sort();
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
        return [];
      }
    }),
});
