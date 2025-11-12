export interface ParsedEvent {
  time: string;
  materia: string;
  aula: string;
  docente: string;
  tipo: string;
}

export interface DaySchedule {
  day: number;
  events: ParsedEvent[];
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
  // Estrai la materia (tutto prima di "Aula")
  const aulaMatch = title.match(/^(.+?)Aula/);
  const materia = aulaMatch ? aulaMatch[1].trim() : title;

  // Estrai l'aula completa (incluso eventuali descrizioni tra parentesi)
  // Cattura tutto tra "Aula" e il docente (che inizia con "Iniziale. COGNOME")
  const aulaFullMatch = title.match(/Aula\s+(.+?)(?=\s+[A-Z]\.\s+[A-Z]+)/);
  const aula = aulaFullMatch ? `Aula ${aulaFullMatch[1].trim()}` : "";

  // Estrai il docente: cerca il pattern [Iniziale]. [COGNOME] che appare dopo l'aula
  // Il docente è nel formato "X. COGNOME" dove X è l'iniziale del nome
  const docenteMatch = title.match(
    /\s([A-Z]\.\s+[A-Z][A-Z\s]+?)(?=Orario|Lezione|Laboratorio|SEDI|$)/,
  );
  let docente = docenteMatch ? docenteMatch[1].trim() : "";

  // Rimuovi eventuali "L" finali aggiunte erroneamente
  if (docente?.endsWith("L")) {
    docente = docente.slice(0, -1).trim();
  }

  const tipo = title.includes("Laboratorio") ? "Laboratorio" : "Lezione";

  return { materia, aula, docente, tipo };
}

export function parseOrarioData(
  rawData: { day: number; events: { time: string; title: string }[] }[],
): DaySchedule[] {
  return rawData.map((day) => ({
    day: day.day,
    events: day.events.map((event) => {
      const parsed = parseEventTitle(event.title);
      return {
        time: event.time,
        ...parsed,
      };
    }),
  }));
}

const COLOR_PALETTE = [
  "#00D4FF", // azzurro
  "#FF3366", // rosa
  "#00FF88", // verde
  "#FFAA00", // arancione
  "#A259FF", // viola
  "#FF6F00", // arancio scuro
  "#FFB300", // giallo
  "#009688", // teal
  "#C51162", // magenta
  "#1976D2", // blu
  "#43A047", // verde scuro
  "#F44336", // rosso
  "#8D6E63", // marrone
  "#607D8B", // grigio blu
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

