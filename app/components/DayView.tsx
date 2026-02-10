import type { DaySchedule, ParsedEvent } from "@/lib/orario-utils";
import { getDayName } from "@/lib/orario-utils";

interface DayViewProps {
  day: DaySchedule | null;
  materiaColorMap: Record<string, string>;
}

export function DayView({ day, materiaColorMap }: DayViewProps) {
  if (!day) {
    return (
      <div className="w-full h-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white font-serif">
            Seleziona un giorno
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
            Clicca su un giorno del calendario per vedere i dettagli
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Calendario</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-400 font-mono">
              Nessun giorno selezionato
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getMateriaColor = (materia: string) => {
    const normalizedMateria = materia
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    return materiaColorMap[normalizedMateria] || "#666666";
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return `${hours}.${minutes}`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const HALF_HOUR_HEIGHT = 40;
  const START_HOUR = 8;

  const getEventPosition = (event: ParsedEvent) => {
    if (!event.time || !event.time.includes(" - ")) {
      return { top: -1, height: HALF_HOUR_HEIGHT };
    }

    try {
      const [startTime, endTime] = event.time.split(" - ");
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      const duration = endMinutes - startMinutes;

      const startHour = Math.floor(startMinutes / 60);
      const startMinuteOffset = startMinutes % 60;

      const effectiveStartHour = Math.max(startHour, START_HOUR);

      const top =
        (effectiveStartHour - START_HOUR) * HALF_HOUR_HEIGHT * 2 +
        (startMinuteOffset / 30) * HALF_HOUR_HEIGHT;

      const height = Math.max(
        (duration / 30) * HALF_HOUR_HEIGHT,
        HALF_HOUR_HEIGHT,
      );

      if (Number.isNaN(top) || Number.isNaN(height))
        return { top: -1, height: HALF_HOUR_HEIGHT };

      return { top, height };
    } catch (_e) {
      return { top: -1, height: HALF_HOUR_HEIGHT };
    }
  };

  const timelineEvents = (day.events || []).filter((ev) => {
    const pos = getEventPosition(ev);
    return pos.top >= 0 && !ev.time.toUpperCase().includes("ANNULLATO");
  });

  const otherEvents = (day.events || []).filter((ev) => {
    const pos = getEventPosition(ev);
    const isAnnullato = ev.time.toUpperCase().includes("ANNULLATO");
    return pos.top < 0 && !isAnnullato;
  });

  return (
    <div className="w-full h-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white font-serif">
          {getDayName(day.day)}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
          {day.events.length} {day.events.length === 1 ? "lezione" : "lezioni"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {otherEvents.length > 0 && (
          <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              Altre Attività
            </h3>
            {otherEvents.map((event) => (
              <div
                key={`${event.materia}-${event.time}`}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-sm dark:text-white">
                    {event.materia}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 font-mono">
                    {event.time}
                  </span>
                </div>
                {event.aula && (
                  <p className="text-xs text-gray-500">{event.aula}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <div className="flex">
            <div className="w-14 shrink-0">
              {timeSlots.map((slot) => (
                <div
                  key={slot}
                  className="text-right pr-2 text-[10px] font-mono text-gray-500 dark:text-gray-400"
                  style={{ height: `${HALF_HOUR_HEIGHT}px` }}
                >
                  {formatTime(slot)}
                </div>
              ))}
            </div>

            <div className="flex-1 relative border-l border-gray-200 dark:border-gray-800">
              {timeSlots.map((slot, index) => (
                <div
                  key={slot}
                  className={`absolute w-full border-b ${
                    slot.includes(":00")
                      ? "border-gray-200 dark:border-gray-800"
                      : "border-gray-100 dark:border-gray-800/30"
                  }`}
                  style={{
                    top: `${index * HALF_HOUR_HEIGHT}px`,
                    height: `${HALF_HOUR_HEIGHT}px`,
                  }}
                />
              ))}

              {timelineEvents.map((event) => {
                const { top, height } = getEventPosition(event);
                const color = getMateriaColor(event.materia);

                return (
                  <div
                    key={`${event.materia}-${event.time}`}
                    className="absolute w-full px-2"
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height - 4, 30)}px`,
                      paddingBottom: "4px",
                      zIndex: 10,
                    }}
                  >
                    <div
                      className="h-full rounded-lg p-2 text-xs overflow-hidden flex flex-col"
                      style={{
                        backgroundColor: `${color}40`,
                        boxShadow: `0 1px 3px rgba(0,0,0,0.1), inset 0 -2px 0 ${color}`,
                        minHeight: "100%",
                      }}
                    >
                      <div className="font-medium text-gray-900 dark:text-white mb-1.5 text-xs leading-relaxed flex items-center flex-wrap gap-1.5">
                        <span className="flex-1">{event.materia}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                            event.tipo === "Laboratorio"
                              ? "bg-orange-200 text-orange-900 dark:bg-orange-700 dark:text-white"
                              : "bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-white"
                          }`}
                        >
                          {event.tipo}
                        </span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="w-3 h-3 shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <title>Orario</title>
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-mono text-[10px]">
                            {event.time
                              .split(" - ")
                              .map(formatTime)
                              .join(" - ")}
                          </span>
                        </div>
                        {event.aula && (
                          <div className="flex items-start gap-1.5">
                            <svg
                              className="w-3 h-3 shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <title>Aula</title>
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="leading-relaxed text-[10px]">
                              {event.aula}
                            </span>
                          </div>
                        )}
                        {event.docente && (
                          <div className="flex items-start gap-1.5">
                            <svg
                              className="w-3 h-3 shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <title>Docente</title>
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="leading-relaxed text-[10px]">
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
        </div>
      </div>
    </div>
  );
}
