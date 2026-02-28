"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Calendar,
  ChevronRight,
  Layers,
  LayoutGrid,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SPRING_CONFIG = {
  type: "spring",
  stiffness: 350,
  damping: 35,
  mass: 1,
} as const;

interface WelcomeDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

const slides = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Tutto l'Ateneo in tasca",
    description:
      "UniOrario si rinnova. Ora puoi seguire qualsiasi corso di laurea dell'Insubria e gestire il tuo tempo in modo smart.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "live-info",
    icon: Zap,
    title: "Cosa succede ora?",
    description:
      "Visualizza istantaneamente la lezione in corso, l'aula e il docente. Saprai sempre dove devi essere senza dover cercare tra mille righe.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "navigation",
    icon: LayoutGrid,
    title: "Navigazione fluida",
    description:
      "Usa gli swipe laterali per muoverti tra le settimane. Cambia schermata per passare dai dettagli del giorno alla pianificazione mensile.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "date-picker",
    icon: Calendar,
    title: "Salta nel tempo",
    description:
      "Tocca la data o il mese in alto per aprire il calendario. Puoi saltare velocemente a qualsiasi giorno dell'anno con un semplice tocco.",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "customization",
    icon: Layers,
    title: "Corsi e Materie",
    description:
      "Aggiungi più corsi contemporaneamente e nascondi le materie che non ti interessano. L'orario diventerà esattamente come lo vuoi tu.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "notifications",
    icon: BellRing,
    title: "Avvisi Intelligenti",
    description:
      "Attiva le notifiche per i corsi che segui. Ti avviseremo noi sul telefono se una lezione viene spostata, cambia aula o viene annullata.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

export function WelcomeDialog({ isOpen, onComplete }: WelcomeDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING_CONFIG}
        className="w-full max-w-sm bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="relative flex-1 px-8 pt-12 pb-8 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center space-y-6"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner transition-all duration-500",
                  slide.bgColor,
                )}
              >
                <Icon className={cn("w-10 h-10", slide.color)} />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-serif tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed font-serif italic">
                  {slide.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-1.5 pt-10">
            {slides.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  s.id === slide.id
                    ? "w-6 bg-zinc-900 dark:bg-white"
                    : "w-1.5 bg-zinc-200 dark:bg-zinc-800",
                )}
              />
            ))}
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-xl text-sm uppercase tracking-widest font-mono"
          >
            <span>{isLastSlide ? "Inizia Ora" : "Continua"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isLastSlide && (
            <button
              type="button"
              onClick={onComplete}
              className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-tighter font-mono"
            >
              Salta Intro
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
