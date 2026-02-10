"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const updateTheme = useCallback((newTheme: "light" | "dark") => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(newTheme);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    updateTheme(initialTheme);
  }, [updateTheme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    updateTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 z-50"
      aria-label="Toggle theme"
      type="button"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-gray-900" />
      ) : (
        <Sun className="w-5 h-5 text-white" />
      )}
    </button>
  );
}
