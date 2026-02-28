"use client";

import { motion } from "framer-motion";
import { BellRing, ChevronRight, Sparkles, X } from "lucide-react";

const SPRING_CONFIG = {
  type: "spring",
  stiffness: 350,
  damping: 35,
  mass: 1,
} as const;

interface NotificationsIntroDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigure: () => void;
}

export function NotificationsIntroDialog({
  isOpen,
  onClose,
  onConfigure,
}: NotificationsIntroDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING_CONFIG}
        className="w-full max-w-sm bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="relative px-8 pt-10 pb-6 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-20 h-20 rounded-3xl bg-green-500/10 flex items-center justify-center shadow-inner mb-6 relative">
            <BellRing className="w-10 h-10 text-green-500" />
            <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-xl shadow-lg animate-bounce">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white font-serif tracking-tight leading-tight">
              Novità: Arrivano le <br /> Notifiche Push!
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed font-serif italic">
              Non perderti più un cambio d'aula o una lezione annullata. Attiva
              le notifiche push per ricevere avvisi in tempo reale solo sulle
              materie che segui.
            </p>
          </div>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfigure}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-xl text-sm uppercase tracking-widest font-mono"
          >
            <span>Configura Ora</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-tighter font-mono"
          >
            Magari più tardi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
