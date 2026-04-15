"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fluxnotes-theme";

function resolveInitialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export default function ThemeToggle({ variant = "floating" }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const nextTheme = resolveInitialTheme();
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }, []);

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  const isNav = variant === "nav";

  return (
    <button
      type="button"
      className={isNav ? "theme-toggle-nav" : "theme-toggle"}
      onClick={handleToggle}
      aria-pressed={theme === "dark"}
      aria-label="Toggle color theme"
      id="theme-toggle-btn"
    >
      {theme === "dark" ? "☀️" : "🌙"}
      {!isNav && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
