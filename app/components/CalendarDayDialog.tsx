import { X } from "lucide-react";
import { useRef } from "react";
import type { DaySchedule } from "@/lib/orario-utils";
import { CalendarDayView } from "./CalendarDayView";

interface CalendarDayDialogProps {
  day: DaySchedule;
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarDayDialog({
  day,
  isOpen,
  onClose,
}: CalendarDayDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

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
      <div className="relative w-full h-full lg:w-full lg:max-w-4xl lg:h-auto lg:max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-10 lg:slide-in-from-bottom-0 duration-300">
        <CalendarDayView day={day} onClose={onClose} />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-lg border border-white/20 dark:border-black/20 shadow-xl text-zinc-900 dark:text-white hover:bg-white/90 dark:hover:bg-black/90 transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
          <span className="text-sm font-bold font-mono uppercase tracking-wider">
            Chiudi
          </span>
        </button>
      </div>
    </div>
  );
}
