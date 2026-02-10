"use client";

import { ChevronRight, Sparkles, Zap, Globe } from "lucide-react";
import { useState, useEffect } from "react";

interface WelcomeDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

const slides = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Benvenuto alla V2",
    description:
      "Una versione completamente rinnovata con miglioramenti significativi in velocità e usabilità.",
    color: "bg-purple-500",
  },
  {
    id: "universal",
    icon: Globe,
    title: "Ora Universale",
    description:
      "Non più limitato a Informatica! Funziona con tutti i corsi di laurea dell'Università dell'Insubria.",
    color: "bg-blue-500",
  },
  {
    id: "fast",
    icon: Zap,
    title: "Velocità Estrema",
    description:
      "Addio scraping lento! Ora utilizziamo le API ufficiali per un caricamento istantaneo dell'orario.",
    color: "bg-yellow-500",
  },
];

export function WelcomeDialog({ isOpen, onComplete }: WelcomeDialogProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide((prev) => prev + 1);
        } else {
          onComplete();
        }
      } else if (e.key === "ArrowLeft" && currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1);
      } else if (e.key === "Escape") {
        onComplete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSlide, onComplete]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (isLeftSwipe && currentSlide === slides.length - 1) {
      onComplete();
    } else if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

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

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div
        className="w-full max-w-md bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="p-8 flex flex-col items-center text-center min-h-100 justify-center space-y-6 transition-opacity duration-300">
          <div
            className={`w-20 h-20 rounded-full ${slide.color} flex items-center justify-center shadow-lg transition-all duration-300`}
          >
            <Icon className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">
            {slide.title}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-sm">
            {slide.description}
          </p>

          <div className="flex gap-2 pt-4">
            {slides.map((slideItem, index) => (
              <button
                key={slideItem.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-gray-900 dark:bg-white"
                    : "w-2 bg-gray-300 dark:bg-gray-700"
                }`}
                aria-label={`Vai alla slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Salta
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {isLastSlide ? "Inizia" : "Avanti"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}




