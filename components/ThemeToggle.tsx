"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "portfolio-theme";
const THEME_EVENT = "portfolio-theme-change";

type Theme = "dark" | "light";

type ThemeToggleProps = {
  variant?: "nav" | "menu";
};

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function hasSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    return savedTheme === "light" || savedTheme === "dark";
  } catch {
    return false;
  }
}

export default function ThemeToggle({ variant = "nav" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const syncTheme = () => setTheme(readTheme());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const syncSystemTheme = () => {
      if (hasSavedTheme()) return;
      const nextTheme: Theme = mediaQuery.matches ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
      window.dispatchEvent(new Event(THEME_EVENT));
    };

    syncTheme();
    window.addEventListener(THEME_EVENT, syncTheme);
    mediaQuery.addEventListener("change", syncSystemTheme);

    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme);
      mediaQuery.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The visual theme still changes when storage is unavailable.
    }
    setTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const targetTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      className={`theme-toggle theme-toggle--${variant}`}
      type="button"
      aria-label={`Switch to ${targetTheme} theme`}
      aria-pressed={theme === "light"}
      onClick={toggleTheme}
    >
      <span aria-hidden="true">{targetTheme.toUpperCase()}</span>
    </button>
  );
}
