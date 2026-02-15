import { Calendar, Layers, MapPin, User } from "lucide-react";
import { useMemo } from "react";
import type { DaySchedule, ParsedEvent } from "@/lib/orario-utils";
import { getDayName } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";

interface DayViewProps {
  day: DaySchedule | null;
  materiaColorMap: Record<string, string>;
}

const START_HOUR = 8;
const END_HOUR = 20;
const HALF_HOUR_HEIGHT = 44;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
};

interface TimelineEvent extends ParsedEvent {
  startMin: number;
  endMin: number;
}

export function DayView({ day, materiaColorMap }: DayViewProps) {
  const getMateriaColor = (materia: string) => {
    const normalizedMateria = materia
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    return materiaColorMap[normalizedMateria] || "#666666";
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }, []);

  const processedEvents = useMemo(() => {
    if (!day) return { timeline: [], other: [] };

    const timelineEvents: TimelineEvent[] = (day.events || [])
      .filter(
        (ev) =>
          !ev.time.toUpperCase().includes("ANNULLATO") &&
          ev.time.includes(" - "),
      )
      .map((ev) => {
        const [start, end] = ev.time.split(" - ");
        return {
          ...ev,
          startMin: timeToMinutes(start),
          endMin: timeToMinutes(end),
        };
      })
      .sort((a, b) => a.startMin - b.startMin);

    const columns: TimelineEvent[][] = [];
    const eventMetadata = new Map<string, { col: number; totalCols: number }>();

    for (const event of timelineEvents) {
      let placed = false;
      for (const column of columns) {
        const lastEventInCol = column[column.length - 1];
        if (event.startMin >= lastEventInCol.endMin) {
          column.push(event);
          eventMetadata.set(`${event.materia}-${event.time}`, {
            col: columns.indexOf(column),
            totalCols: 0,
          });
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
        eventMetadata.set(`${event.materia}-${event.time}`, {
          col: columns.length - 1,
          totalCols: 0,
        });
      }
    }

    for (const event of timelineEvents) {
      const meta = eventMetadata.get(`${event.materia}-${event.time}`);
      if (meta) meta.totalCols = columns.length;
    }

    return {
      timeline: timelineEvents.map((event) => ({
        ...event,
        ...eventMetadata.get(`${event.materia}-${event.time}`),
      })),
      other: (day.events || []).filter(
        (ev) =>
          !ev.time.includes(" - ") &&
          !ev.time.toUpperCase().includes("ANNULLATO"),
      ),
    };
  }, [day]);

  if (!day) {
    return (
      <div className="w-full h-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white font-serif">
            Dettaglio Giorno
          </h2>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
            Seleziona una data nel calendario
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-xs">
            <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-6 border border-zinc-100 dark:border-zinc-800">
              <Calendar className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif mb-2">
              Nessun giorno scelto
            </h3>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
              Esplora il calendario e tocca un giorno per visualizzare la
              cronologia completa delle lezioni.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-sm">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-white leading-none">
            {day.dayOfMonth}
          </span>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight font-serif leading-none">
            {getDayName(day.day)}
          </h2>
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mt-2">
          {day.events.length}{" "}
          {day.events.length === 1 ? "Sessione" : "Sessioni"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {processedEvents.other.length > 0 && (
          <div className="p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-[10px] font-bold font-serif text-zinc-400 uppercase tracking-widest">
                Altre Attività
              </h3>
            </div>
            {processedEvents.other.map((event) => (
              <div
                key={`${event.materia}-${event.time}`}
                className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-sm dark:text-zinc-100 leading-tight">
                    {event.materia}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono font-bold whitespace-nowrap">
                    {event.time}
                  </span>
                </div>
                {event.aula && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                    <MapPin className="w-3 h-3" />
                    <span>{event.aula}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="p-4 lg:p-6">
          <div className="flex gap-4">
            <div className="w-10 lg:w-12 shrink-0">
              {timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="text-right pr-2 text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-600 flex items-center justify-end"
                  style={{ height: `${HALF_HOUR_HEIGHT}px` }}
                >
                  {slot.endsWith(":00") ? slot : ""}
                </div>
              ))}
            </div>

            <div className="flex-1 relative">
              {timeSlots.map((slot, index) => (
                <div
                  key={`line-${slot}`}
                  className={cn(
                    "absolute w-full border-t transition-colors",
                    slot.endsWith(":00")
                      ? "border-zinc-200 dark:border-zinc-800/60"
                      : "border-zinc-100 dark:border-zinc-900/40 border-dashed",
                  )}
                  style={{
                    top: `${index * HALF_HOUR_HEIGHT}px`,
                    width: "100%",
                  }}
                />
              ))}

              {processedEvents.timeline.map((event) => {
                const duration = event.endMin - event.startMin;
                const top =
                  ((event.startMin - START_HOUR * 60) / 30) * HALF_HOUR_HEIGHT;
                const height = (duration / 30) * HALF_HOUR_HEIGHT;
                const color = getMateriaColor(event.materia);

                const width = 100 / (event.totalCols || 1);
                const left = (event.col || 0) * width;

                return (
                  <div
                    key={`${event.materia}-${event.time}`}
                    className="absolute p-0.5 group transition-all duration-300 hover:z-20"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `${left}%`,
                      width: `${width}%`,
                    }}
                  >
                    <div
                      className="h-full w-full rounded-xl p-3 text-xs overflow-hidden flex flex-col border shadow-sm transition-transform active:scale-[0.98]"
                      style={{
                        backgroundColor: `${color}15`,
                        borderColor: `${color}40`,
                        borderLeft: `4px solid ${color}`,
                      }}
                    >
                      <div className="flex flex-col gap-1 mb-2">
                        <span className="font-bold text-zinc-900 dark:text-white text-xs lg:text-sm leading-tight line-clamp-2">
                          {event.materia}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[8px] px-1 py-0 rounded-md font-bold uppercase tracking-tighter shrink-0",
                              event.tipo === "Laboratorio"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                            )}
                          >
                            {event.tipo === "Laboratorio" ? "LAB" : "LEZ"}
                          </span>
                          <span className="font-mono text-[9px] font-bold text-zinc-500">
                            {event.time.split(" - ").map(formatTime).join("–")}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto space-y-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {event.aula && (
                          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate text-[9px] font-medium font-mono">
                              {event.aula}
                            </span>
                          </div>
                        )}

                        {event.docente && height > 90 && (
                          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-500/10">
                            <User className="w-2.5 h-2.5" />
                            <span className="truncate text-[9px] italic font-serif">
                              {event.docente}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ height: "40px" }} />
        </div>
      </div>
    </div>
  );
}
