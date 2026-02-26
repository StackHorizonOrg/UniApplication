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
    isVideo?: boolean;
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
    const rawTitle = e.nome || "Lezione";
    const aulaMatch = rawTitle.match(/^(.+?)Aula/);
    const title = aulaMatch ? aulaMatch[1].trim() : rawTitle;

    const hasComoRooms = (e.aule || []).some(
      (a) =>
        (a.edificio?.comune || "").toUpperCase().includes("COMO") ||
        a.descrizione.toUpperCase().includes("COMO"),
    );

    const isVideoConference =
      title.toUpperCase().includes("VIDEOCONFERENZA") ||
      title.toUpperCase().includes("TEAMS") ||
      title.toUpperCase().includes("VIDEOCHIAMATA") ||
      hasComoRooms ||
      (e.aule || []).some(
        (a) =>
          a.descrizione.toUpperCase().includes("VIDEOCONFERENZA") ||
          a.descrizione.toUpperCase().includes("TEAMS"),
      );

    let matchesLocation = locationFilter === "Tutte" || isVideoConference;

    const filteredAule = (e.aule || []).filter((aula) => {
      if (locationFilter === "Tutte") return true;
      const name = aula.descrizione;
      const city = aula.edificio?.comune || "Unknown";
      const isVarese =
        city.toUpperCase().includes("VARESE") ||
        name.toUpperCase().includes("VARESE");
      const isComo =
        city.toUpperCase().includes("COMO") ||
        name.toUpperCase().includes("COMO");

      if (locationFilter === "Varese") return isVarese;
      if (locationFilter === "Como") return isComo;
      return true;
    });

    if (locationFilter !== "Tutte" && !matchesLocation) {
      matchesLocation = filteredAule.length > 0;
    }

    if (!matchesLocation) continue;

    const location =
      filteredAule
        .map((aula) => {
          const name = aula.descrizione;
          const city = aula.edificio?.comune || "Unknown";

          let _pad = "";
          const padMatch = name.match(/Padiglione\s+([^-]+)/i);
          if (padMatch) _pad = `Pad. ${padMatch[1].trim()}`;
          else if (name.includes("Morselli") || /\bPM\b/i.test(name))
            _pad = "Pad. Morselli";
          else if (name.includes("Monte Generoso") || /\bMTG\b/i.test(name))
            _pad = "Pad. Monte Generoso";

          return `${name} (${city})`;
        })
        .join(" | ") || (isVideoConference ? "Videoconferenza Online" : "N/A");

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
          isVideo: isVideoConference,
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
        linkIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      const ids = input.linkIds || (input.linkId ? [input.linkId] : []);
      if (ids.length === 0) return [];

      const allRawEvents = await Promise.all(
        ids.map((id) => fetchRawEvents(input.dayOffset, id)),
      );
      const combinedEvents = allRawEvents.flat();

      return processEvents(combinedEvents, input.name, input.location);
    }),

  getMonthlyOrario: publicProcedure
    .input(
      z.object({
        name: z.string().default("INFORMATICA"),
        location: z.enum(["Varese", "Como", "Tutte"]).default("Tutte"),
        year: z.number(),
        month: z.number(),
        linkId: z.string().optional(),
        linkIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      const ids = input.linkIds || (input.linkId ? [input.linkId] : []);
      if (ids.length === 0) return [];

      const startRange = DateTime.fromObject(
        { year: input.year, month: input.month, day: 1 },
        { zone: "Europe/Rome" },
      ).startOf("month");
      const endRange = startRange.endOf("month");

      const fetchForId = async (id: string) => {
        const url =
          "https://unins.prod.up.cineca.it/api/Impegni/getImpegniCalendarioPubblico";
        const body = {
          mostraImpegniAnnullati: true,
          mostraIndisponibilitaTotali: false,
          linkCalendarioId: id,
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
          console.error(`Failed to fetch monthly orario for ${id}:`, error);
          return [];
        }
      };

      const allRawEvents = await Promise.all(ids.map(fetchForId));
      const events: CinecaEvent[] = allRawEvents.flat();

      const processed = events
        .map((e) => {
          const date = DateTime.fromISO(e.dataInizio).setZone("Europe/Rome");
          const rawTitle = e.nome || "Lezione";
          const aulaMatch = rawTitle.match(/^(.+?)Aula/);
          const title = aulaMatch ? aulaMatch[1].trim() : rawTitle;

          const hasComoRooms = (e.aule || []).some(
            (a) =>
              (a.edificio?.comune || "").toUpperCase().includes("COMO") ||
              a.descrizione.toUpperCase().includes("COMO"),
          );

          const isVideoConference =
            title.toUpperCase().includes("VIDEOCONFERENZA") ||
            title.toUpperCase().includes("TEAMS") ||
            title.toUpperCase().includes("VIDEOCHIAMATA") ||
            hasComoRooms ||
            (e.aule || []).some(
              (a) =>
                a.descrizione.toUpperCase().includes("VIDEOCONFERENZA") ||
                a.descrizione.toUpperCase().includes("TEAMS"),
            );

          let matchesLocation = input.location === "Tutte" || isVideoConference;

          const filteredAule = (e.aule || []).filter((aula) => {
            if (input.location === "Tutte") return true;
            const name = aula.descrizione;
            const city = aula.edificio?.comune || "Unknown";
            const isVarese =
              city.toUpperCase().includes("VARESE") ||
              name.toUpperCase().includes("VARESE");
            const isComo =
              city.toUpperCase().includes("COMO") ||
              name.toUpperCase().includes("COMO");

            if (input.location === "Varese") return isVarese;
            if (input.location === "Como") return isComo;
            return true;
          });

          if (input.location !== "Tutte" && !matchesLocation) {
            matchesLocation = filteredAule.length > 0;
          }

          if (!matchesLocation) return null;

          const start = date.toFormat("HH:mm");
          const end = DateTime.fromISO(e.dataFine)
            .setZone("Europe/Rome")
            .toFormat("HH:mm");

          const location =
            filteredAule
              .map((aula) => {
                const name = aula.descrizione;
                const city = aula.edificio?.comune || "Unknown";
                return `${name} (${city})`;
              })
              .join(" | ") ||
            (isVideoConference ? "Videoconferenza Online" : "N/A");

          return {
            date: date.toISODate(),
            day: getDayOfWeek(date),
            time: `${start} - ${end}`,
            title,
            location,
            professor:
              e.docenti && e.docenti.length > 0
                ? `${e.docenti[0].cognome} ${e.docenti[0].nome}`
                : "N/A",
            isVideo: isVideoConference,
          };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);

      return processed.filter(
        (val, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              t.date === val.date &&
              t.time === val.time &&
              t.title === val.title,
          ),
      );
    }),

  getNextLesson: publicProcedure
    .input(
      z.object({
        dayOffset: z.number().default(0),
        name: z.string().default("INFORMATICA"),
        location: z.enum(["Varese", "Como", "Tutte"]).default("Tutte"),
        linkId: z.string().optional(),
        linkIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      const ids = input.linkIds || (input.linkId ? [input.linkId] : []);
      if (ids.length === 0)
        return { hasLessons: false, lessons: [], dayName: "" };

      const allRawEvents = await Promise.all(
        ids.map((id) => fetchRawEvents(input.dayOffset, id)),
      );
      const combinedEvents = allRawEvents.flat();
      const orarioData = processEvents(
        combinedEvents,
        input.name,
        input.location,
      );

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
        linkId: z.string().optional(),
        linkIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      const ids = input.linkIds || (input.linkId ? [input.linkId] : []);
      if (ids.length === 0) return [];

      const currentDate = getCurrentItalianDateTime();
      const startRange = currentDate.startOf("day");
      const endRange = startRange.plus({ months: 6 }).endOf("day");

      const fetchSubjectsForId = async (id: string) => {
        const url =
          "https://unins.prod.up.cineca.it/api/Impegni/getImpegniCalendarioPubblico";
        const body = {
          mostraImpegniAnnullati: true,
          mostraIndisponibilitaTotali: false,
          linkCalendarioId: id,
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

          const localSubjects = new Set<string>();
          for (const e of rawEvents) {
            const title = e.nome || "Lezione";
            const aulaMatch = title.match(/^(.+?)Aula/);
            const materia = aulaMatch ? aulaMatch[1].trim() : title;
            localSubjects.add(materia);
          }
          return Array.from(localSubjects);
        } catch (error) {
          console.error(`Failed to fetch subjects for ${id}:`, error);
          return [];
        }
      };

      const allSubjectsLists = await Promise.all(ids.map(fetchSubjectsForId));
      const combinedSubjects = new Set(allSubjectsLists.flat());

      return Array.from(combinedSubjects).sort();
    }),
});
