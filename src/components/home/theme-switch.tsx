"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function automaticTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7 ? "dark" : "light";
}

export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("creative-home-theme");
    const nextTheme: Theme = stored === "light" || stored === "dark" ? stored : automaticTheme();
    document.documentElement.dataset.homeTheme = nextTheme;
    const frame = window.requestAnimationFrame(() => setTheme(nextTheme));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.homeTheme = nextTheme;
    window.localStorage.setItem("creative-home-theme", nextTheme);
  }

  return (
    <button
      aria-label={theme === "light" ? "切换夜间模式" : "切换白昼模式"}
      className="home-icon-button"
      onClick={toggleTheme}
      title={theme === "light" ? "夜间模式" : "白昼模式"}
      type="button"
    >
      {theme === "light" ? <Moon aria-hidden="true" className="h-4 w-4" /> : <Sun aria-hidden="true" className="h-4 w-4" />}
    </button>
  );
}
