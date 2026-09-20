"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer ${
        isDark
          ? "bg-slate-800/90 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-sm"
          : "bg-slate-100/90 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-blue-600 shadow-sm"
      } ${className}`}
      title={isDark ? "লাইট মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun size={18} className="transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={18} className="transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
