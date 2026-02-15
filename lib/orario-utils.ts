import type { DateTime } from "luxon";

export interface ParsedEvent {
  time: string;
  materia: string;
  aula: string;
  docente: string;
  tipo: string;
  fullDate?: string;
}

export interface DaySchedule {
  day: number;
  dayOfMonth?: number;
  events: ParsedEvent[];
  date?: DateTime;
}

const giorni = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

export function getDayName(dayIndex: number): string {
  return giorni[dayIndex] || `Giorno ${dayIndex}`;
}

export function parseEventTitle(title: string): {
  materia: string;
  aula: string;
  docente: string;
  tipo: string;
} {
  const aulaMatch = title.match(/^(.+?)Aula/);
  const materia = aulaMatch ? aulaMatch[1].trim() : title;
  const aulaFullMatch = title.match(/Aula\s+(.+?)(?=\s+[A-Z]\.\s+[A-Z]+)/);
  const aula = aulaFullMatch ? `Aula ${aulaFullMatch[1].trim()}` : "";
  const docenteMatch = title.match(
    /\s([A-Z]\.\s+[A-Z][A-Z\s]+?)(?=Orario|Lezione|Laboratorio|SEDI|$)/,
  );
  let docente = docenteMatch ? docenteMatch[1].trim() : "";

  if (docente?.endsWith("L")) {
    docente = docente.slice(0, -1).trim();
  }

  const tipo = title.includes("Laboratorio") ? "Laboratorio" : "Lezione";

  return { materia, aula, docente, tipo };
}

export function extractCalendarId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const paramId = urlObj.searchParams.get("linkCalendarioId");
    if (paramId) return paramId;

    const pathMatch = url.match(/linkCalendarioId=([a-f0-9]{24})/i);
    if (pathMatch) return pathMatch[1];

    return null;
  } catch {
    const directIdMatch = url.match(/\b([a-f0-9]{24})\b/i);
    if (directIdMatch) return directIdMatch[1];

    return null;
  }
}

export function parseOrarioData(
  rawData: {
    day: number;
    events: {
      time: string;
      title: string;
      location?: string;
      professor?: string;
    }[];
  }[],
): DaySchedule[] {
  return rawData.map((day) => ({
    day: day.day,
    events: day.events.map((event) => {
      if (event.location !== undefined || event.professor !== undefined) {
        return {
          time: event.time,
          materia: event.title,
          aula: event.location || "",
          docente: event.professor || "",
          tipo: event.title.includes("Laboratorio") ? "Laboratorio" : "Lezione",
        };
      }

      const parsed = parseEventTitle(event.title);
      return {
        time: event.time,
        ...parsed,
      };
    }),
  }));
}

const COLOR_PALETTE = [
  "#00D4FF",
  "#FF3366",
  "#00FF88",
  "#FFAA00",
  "#A259FF",
  "#FF6F00",
  "#FFB300",
  "#009688",
  "#C51162",
  "#1976D2",
  "#43A047",
  "#F44336",
  "#8D6E63",
  "#607D8B",
];

export function getMateriaColorMap(materie: string[]): Record<string, string> {
  const uniqueMaterie = Array.from(
    new Set(
      materie.map((m) =>
        m
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase(),
      ),
    ),
  );
  const colorMap: Record<string, string> = {};
  uniqueMaterie.forEach((mat, idx) => {
    colorMap[mat] = COLOR_PALETTE[idx % COLOR_PALETTE.length];
  });
  return colorMap;
}
