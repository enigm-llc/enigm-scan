import { useEffect, useState } from "react";

export type Appearance = "system" | "light" | "dark";
const KEY = "enigm-scan-appearance";

/**
 * The chosen appearance (light, dark or the system's), remembered on this
 * computer, applied to the document as `data-theme`.
 */
export function useAppearance(fallback: Appearance) {
  const [appearance, setAppearance] = useState<Appearance>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark" || saved === "system")
        return saved;
    } catch {}
    return fallback;
  });
  const [dark, setDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    try {
      localStorage.setItem(KEY, appearance);
    } catch {}
    const query = matchMedia("(prefers-color-scheme: dark)");
    const sync = () =>
      setDark(appearance === "system" ? query.matches : appearance === "dark");
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, [appearance]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#101011" : "#f8f8f8");
  }, [dark]);
  return [appearance, setAppearance] as const;
}
