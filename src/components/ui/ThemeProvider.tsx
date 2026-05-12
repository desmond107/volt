"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

// Injected at runtime to bypass the Lightning CSS optimizer, which rejects
// # inside escaped bracket class selectors like .bg-\[#020c1b\].
const LIGHT_CSS = `
  .bg-\\[#020c1b\\]            { background-color: #f0f5fb !important; }
  .bg-\\[#040f1c\\]            { background-color: #f4f8fd !important; }
  .bg-\\[#061120\\]            { background-color: #ffffff !important; }
  .bg-\\[#020d1a\\]            { background-color: #f0f5fb !important; }
  .bg-\\[#0d2040\\]            { background-color: #dce8f5 !important; }
  .bg-\\[#0a1628\\]            { background-color: #e8f0fa !important; }
  .bg-\\[#071530\\]            { background-color: #eef5ff !important; }
  .bg-\\[#020c1b\\]\\/70       { background-color: rgba(240,245,251,0.7) !important; }
  .bg-\\[#0d2040\\]\\/30       { background-color: rgba(220,232,245,0.3) !important; }
  .hover\\:bg-\\[#0d2040\\]:hover      { background-color: #dce8f5 !important; }
  .hover\\:bg-\\[#071530\\]:hover      { background-color: #eef5ff !important; }
  .hover\\:bg-\\[#0d2040\\]\\/30:hover { background-color: rgba(220,232,245,0.3) !important; }
  .border-\\[#0d2040\\]        { border-color: #c8d9ee !important; }
  .border-\\[#061120\\]        { border-color: #e0eaf5 !important; }
  .border-\\[#0d2040\\]\\/20   { border-color: rgba(200,217,238,0.2) !important; }
  .border-\\[#0d2040\\]\\/30   { border-color: rgba(200,217,238,0.3) !important; }
  .text-\\[#6b88b0\\]          { color: #4a6280 !important; }
  .text-\\[#c0d4ef\\]          { color: #1a3050 !important; }
  .text-\\[#4a6080\\]          { color: #6a8298 !important; }
  .text-\\[#6b88b0\\]\\/60     { color: rgba(74,98,128,0.6) !important; }
  .text-white                  { color: #0f1c2e !important; }
  [style*="background:"] .text-white  { color: white !important; }
  [style*="linear-gradient"] *        { color: inherit; }
  .bg-blue-600 .text-white,
  .bg-blue-500 .text-white,
  .bg-blue-700 .text-white,
  [class*="bg-blue-"] .text-white     { color: white !important; }
  .from-blue-950\\/50 { --tw-gradient-from: rgba(219,234,254,0.5) !important; }
  .via-\\[#061120\\]   { --tw-gradient-via: #f8faff !important; }
  .to-\\[#061120\\]    { --tw-gradient-to: #f8faff !important; }
`.trim();

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const id = "volt-light-overrides";
  if (theme === "light") {
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = LIGHT_CSS;
      document.head.appendChild(el);
    }
  } else {
    document.getElementById(id)?.remove();
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("volt-theme") as Theme) ?? "dark";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("volt-theme", next);
    applyTheme(next);
  };

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}
