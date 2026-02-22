import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  MapPin,
  User,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DaySchedule, ParsedEvent } from "@/lib/orario-utils";
import { getDayName } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";

interface CalendarDayViewProps {
  day: DaySchedule;
  onClose?: () => void;
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
  col?: number;
  totalCols?: number;
  isOverlapping?: boolean;
}

function TimelineCard({
  event,
  color,
  isCarousel = false,
  style = {},
}: {
  event: TimelineEvent;
  color: string;
  isCarousel?: boolean;
  style?: React.CSSProperties;
}) {
  const duration = event.endMin - event.startMin;
  const height = (duration / 30) * HALF_HOUR_HEIGHT;

  return (
    <div
      className={cn(
        "absolute p-1 group transition-all duration-300 hover:z-20",
        isCarousel ? "w-full" : "",
      )}
      style={style}
    >
      <div className="h-full w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-3 p-3 overflow-hidden shadow-sm transition-transform active:scale-[0.99]">
        <div
          className="w-1.5 h-full rounded-full shrink-0 transition-transform"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0 flex-1 flex flex-col h-full">
          <div className="flex items-center justify-between gap-2 mb-2 shrink-0 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-xs lg:text-sm font-mono font-bold text-zinc-500 uppercase whitespace-normal">
                {event.time.split(" - ").map(formatTime).join("-")}
              </span>
            </div>
          </div>
          <h4 className="font-serif font-bold text-xs lg:text-sm text-zinc-900 dark:text-white leading-tight mb-2 line-clamp-2">
            {event.materia}
          </h4>
          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-start gap-1.5 text-[11px] text-zinc-400 min-w-0">
                {event.isVideo ? (
                  <Video className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span className="leading-tight whitespace-normal">
                  {event.aula}
                </span>
              </div>
              {event.docente && height > 80 && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 min-w-0">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="whitespace-normal">{event.docente}</span>
                </div>
              )}
            </div>

            {event.isOverlapping && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                      <AlertTriangle
                        className="w-3.5 h-3.5"
                        strokeWidth={2.5}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-900 text-white border-zinc-800 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold font-serif uppercase tracking-wider">
                      Sovrapposizione oraria
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCarousel({
  events,
  getMateriaColor,
  groupStart,
}: {
  events: TimelineEvent[];
  getMateriaColor: (materia: string) => string;
  groupStart: number;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % events.length);
  };

  const prev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) next();
    else if (info.offset.x > 50) prev();
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? "100%" : "-100%", opacity: 0 }),
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            {(() => {
              const event = events[index];
              const top =
                ((event.startMin - groupStart) / 30) * HALF_HOUR_HEIGHT;
              const duration = event.endMin - event.startMin;
              const height = (duration / 30) * HALF_HOUR_HEIGHT;

              return (
                <TimelineCard
                  event={event}
                  color={getMateriaColor(event.materia)}
                  isCarousel
                  style={{ top: `${top}px`, height: `${height}px` }}
                />
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-2 right-4 flex items-center gap-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg z-30">
        <button
          type="button"
          onClick={prev}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-500" />
        </button>
        <span className="text-[10px] font-mono font-bold text-zinc-400 px-1">
          {index + 1} {" / "} {events.length}
        </span>
        <button
          type="button"
          onClick={next}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
        >
          {" "}
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    </div>
  );
}

export function CalendarDayView({ day, onClose }: CalendarDayViewProps) {
  const getMateriaColor = (materia: string) => {
    const normalizedMateria = materia
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    return day.materiaColorMap?.[normalizedMateria] || "#666666";
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

    // Group overlapping events into blocks (clusters)
    const groups: {
      events: TimelineEvent[];
      start: number;
      end: number;
      maxOverlap: number;
    }[] = [];

    for (const event of timelineEvents) {
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || event.startMin >= lastGroup.end) {
        groups.push({
          events: [event],
          start: event.startMin,
          end: event.endMin,
          maxOverlap: 0,
        });
      } else {
        lastGroup.events.push(event);
        lastGroup.end = Math.max(lastGroup.end, event.endMin);
      }
    }

    // Process each group to determine max overlap and local column placement
    for (const group of groups) {
      const columns: TimelineEvent[][] = [];
      const eventMetadata = new Map<
        string,
        { col: number; totalCols: number; isOverlapping: boolean }
      >();

      for (const event of group.events) {
        let placed = false;
        for (const column of columns) {
          const lastEventInCol = column[column.length - 1];
          if (event.startMin >= lastEventInCol.endMin) {
            column.push(event);
            eventMetadata.set(`${event.materia}-${event.time}`, {
              col: columns.indexOf(column),
              totalCols: 0,
              isOverlapping: false,
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
            isOverlapping: false,
          });
        }
      }

      group.maxOverlap = columns.length;

      for (const event of group.events) {
        const meta = eventMetadata.get(`${event.materia}-${event.time}`);
        if (meta) {
          const overlappingCount = group.events.filter(
            (other) =>
              other !== event &&
              event.startMin < other.endMin &&
              event.endMin > other.startMin,
          ).length;

          meta.totalCols = columns.length;
          meta.isOverlapping = overlappingCount > 0;

          // Attach metadata directly to event for easier rendering
          Object.assign(event, meta);
        }
      }
    }

    return {
      groups,
      other: (day.events || []).filter(
        (ev) =>
          !ev.time.includes(" - ") &&
          !ev.time.toUpperCase().includes("ANNULLATO"),
      ),
    };
  }, [day.events]);

  const monthName = useMemo(() => {
    if (day.date) {
      return day.date.setLocale("it").toFormat("MMMM");
    }
    return "";
  }, [day.date]);

  return (
    <div className="relative w-full h-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
      <div className="p-4 sm:p-6 lg:p-10 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono text-zinc-900 dark:text-white leading-none tracking-tighter">
              {day.dayOfMonth}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight font-serif leading-none truncate">
              {getDayName(day.day)}
            </h2>
          </div>
          <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em] mt-3 lg:mt-4 truncate">
            {day.events.length}{" "}
            {day.events.length === 1 ? "Sessione" : "Sessioni"}{" "}
            {monthName && `• ${day.dayOfMonth} ${monthName}`}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="group p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all active:scale-90 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
          >
            <X className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
          </button>
        )}
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

        <div className="p-4 sm:p-6 lg:p-10">
          <div className="flex gap-1 sm:gap-2">
            <div className="w-8 sm:w-10 shrink-0">
              {timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="text-right pr-1 text-xs sm:text-sm lg:text-base font-mono font-bold text-zinc-400 dark:text-zinc-600 flex items-center justify-end"
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

              {processedEvents.groups.map((group, _gIdx) => {
                const groupTop =
                  ((group.start - START_HOUR * 60) / 30) * HALF_HOUR_HEIGHT;
                const groupDuration = group.end - group.start;
                const groupHeight = (groupDuration / 30) * HALF_HOUR_HEIGHT;

                if (group.maxOverlap > 2) {
                  return (
                    <div
                      key={`group-${group.start}-${group.end}`}
                      className="absolute left-0 w-full"
                      style={{
                        top: `${groupTop}px`,
                        height: `${groupHeight}px`,
                      }}
                    >
                      <EventCarousel
                        events={group.events}
                        getMateriaColor={getMateriaColor}
                        groupStart={group.start}
                      />
                    </div>
                  );
                }

                return group.events.map((event) => {
                  const top =
                    ((event.startMin - START_HOUR * 60) / 30) *
                    HALF_HOUR_HEIGHT;
                  const duration = event.endMin - event.startMin;
                  const height = (duration / 30) * HALF_HOUR_HEIGHT;
                  const width = 100 / (event.totalCols || 1);
                  const left = (event.col || 0) * width;

                  return (
                    <TimelineCard
                      key={`${event.materia}-${event.time}`}
                      event={event}
                      color={getMateriaColor(event.materia)}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                    />
                  );
                });
              })}
            </div>
          </div>
          <div style={{ height: "60px" }} />
        </div>
      </div>
    </div>
  );
}
