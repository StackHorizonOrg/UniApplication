import { Clock, Layers, MapPin, User, X } from "lucide-react";
import { DateTime } from "luxon";
import { useMemo, useRef } from "react";
import type { DaySchedule, ParsedEvent } from "@/lib/orario-utils";
import { getDayName } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";

interface CalendarDayDialogProps {
  day: DaySchedule;
  isOpen: boolean;
  onClose: () => void;
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

export function CalendarDayDialog({
  day,
  isOpen,
  onClose,
  materiaColorMap,
}: CalendarDayDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

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
      .sort(
        (a, b) =>
          a.startMin - b.startMin ||
          b.endMin - b.startMin - (a.endMin - a.startMin),
      );

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
  }, [day.events]);

  const monthName = useMemo(() => {
    if (day.date && day.date instanceof DateTime) {
      return day.date.setLocale("it").toFormat("MMMM");
    }
    return "";
  }, [day.date]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 lg:bg-black/60 backdrop-blur-md p-0 lg:p-10 animate-in fade-in duration-300"
    >
      <div className="w-full h-full lg:w-full lg:max-w-4xl lg:h-auto lg:max-h-[85vh] bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-none lg:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 lg:slide-in-from-bottom-0 duration-300">
        <div className="p-6 lg:p-10 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <span className="text-4xl lg:text-5xl font-bold font-mono text-zinc-900 dark:text-white leading-none tracking-tighter">
                {day.dayOfMonth}
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight font-serif leading-none">
                {getDayName(day.day)}
              </h2>
            </div>
            <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em] mt-4">
              {day.events.length}{" "}
              {day.events.length === 1 ? "Sessione" : "Sessioni"}{" "}
              {monthName && `• ${day.dayOfMonth} ${monthName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-90 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
          >
            <X className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {processedEvents.other.length > 0 && (
            <div className="p-6 lg:p-10 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-bold font-serif text-zinc-400 uppercase tracking-widest">
                  Altre Attività
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedEvents.other.map((event) => (
                  <div
                    key={`${event.materia}-${event.time}`}
                    className="p-5 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-sm dark:text-zinc-100 leading-tight">
                        {event.materia}
                      </span>
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono font-bold whitespace-nowrap">
                        {event.time}
                      </span>
                    </div>
                    {event.aula && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{event.aula}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 lg:p-10">
            <div className="flex gap-8">
              <div className="w-12 lg:w-16 shrink-0">
                {timeSlots.map((slot) => (
                  <div
                    key={slot}
                    className="text-right pr-2 text-[10px] lg:text-xs font-mono font-bold text-zinc-400 dark:text-zinc-600 flex items-center justify-end"
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
                    ((event.startMin - START_HOUR * 60) / 30) *
                    HALF_HOUR_HEIGHT;
                  const height = (duration / 30) * HALF_HOUR_HEIGHT;
                  const color = getMateriaColor(event.materia);

                  const width = 100 / (event.totalCols || 1);
                  const left = (event.col || 0) * width;

                  return (
                    <div
                      key={`${event.materia}-${event.time}`}
                      className="absolute p-1 group transition-all duration-300 hover:z-20"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                    >
                      <div
                        className="h-full w-full rounded-2xl p-4 lg:p-5 text-xs overflow-hidden flex flex-col border shadow-sm transition-transform active:scale-[0.99]"
                        style={{
                          backgroundColor: `${color}15`,
                          borderColor: `${color}40`,
                          borderLeft: `5px solid ${color}`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="font-bold text-zinc-900 dark:text-white text-sm lg:text-base leading-tight line-clamp-2">
                            {event.materia}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter shrink-0",
                              event.tipo === "Laboratorio"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                            )}
                          >
                            {event.tipo === "Laboratorio" ? "LAB" : "LEZ"}
                          </span>
                        </div>

                        <div className="mt-auto space-y-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">
                              {event.time
                                .split(" - ")
                                .map(formatTime)
                                .join(" – ")}
                            </span>
                          </div>

                          {event.aula && (
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate text-[11px] font-medium font-mono">
                                {event.aula}
                              </span>
                            </div>
                          )}

                          {event.docente && height > 100 && (
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-500/10">
                              <User className="w-3.5 h-3.5" />
                              <span className="truncate text-[11px] italic font-serif">
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
            <div style={{ height: "60px" }} />
          </div>
        </div>

        <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-100 dark:border-zinc-900 text-center">
          <button
            type="button"
            onClick={onClose}
            className="px-12 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg active:scale-95"
          >
            Chiudi Dettagli
          </button>
        </div>
      </div>
    </div>
  );
}
