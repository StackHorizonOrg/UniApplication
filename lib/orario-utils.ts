import type { DateTime } from "luxon";

export interface ParsedEvent {
  time: string;
  materia: string;
  aula: string;
  docente: string;
  tipo: string;
  fullDate?: string;
  isVideo?: boolean;
}

export interface DaySchedule {
  day: number;
  dayOfMonth?: number;
  events: ParsedEvent[];
  date?: DateTime;
  materiaColorMap?: Record<string, string>;
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
      isVideo?: boolean;
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
          isVideo: event.isVideo,
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
  "#00D4FF", // Cyan
  "#FF3366", // Pink
  "#00FF88", // Green
  "#FFAA00", // Orange
  "#A259FF", // Purple
  "#FF6F00", // Deep Orange
  "#009688", // Teal
  "#C51162", // Magenta
  "#1976D2", // Blue
  "#43A047", // Dark Green
  "#F44336", // Red
  "#8D6E63", // Brown
  "#607D8B", // Blue Grey
  "#E91E63", // Pink 2
  "#9C27B0", // Purple 2
  "#2196F3", // Blue 2
  "#00BCD4", // Cyan 2
  "#4CAF50", // Green 2
  "#8BC34A", // Light Green
  "#CDDC39", // Lime
  "#FFEB3B", // Yellow
  "#FFC107", // Amber
];

// Funzione hash semplice per generare un colore se la palette finisce o per aumentare l'entropia
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
}

export function getMateriaColorMap(materie: string[]): Record<string, string> {
  const uniqueMaterie = Array.from(
    new Set(
      materie.map((m) =>
        m
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .trim(),
      ),
    ),
  ).sort();

  const colorMap: Record<string, string> = {};
  uniqueMaterie.forEach((mat, idx) => {
    if (idx < COLOR_PALETTE.length) {
      colorMap[mat] = COLOR_PALETTE[idx];
    } else {
      colorMap[mat] = stringToColor(mat);
    }
  });
  return colorMap;
}
