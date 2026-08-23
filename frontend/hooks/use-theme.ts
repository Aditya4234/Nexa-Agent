import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const stored = (localStorage.getItem("nexa_theme") as "light" | "dark" | "system") || "system";
    setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const onChange = (e: MediaQueryListEvent) => root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const set = (t: "light" | "dark" | "system") => {
    setTheme(t);
    localStorage.setItem("nexa_theme", t);
  };

  return { theme, setTheme: set };
}