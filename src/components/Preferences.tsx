import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Contrast, Globe, ChevronDown } from "lucide-react";
import { languages, type Copy, type Language } from "../shared/i18n/i18n";
import { footerCopy } from "../shared/i18n/footer";
import type { Appearance } from "../shared/appearance";

/**
 * Appearance and language, as two small menus in the site's footer. (The app
 * follows the system's language and appearance.)
 */
export function Preferences({
  t,
  language,
  setLanguage,
  appearance,
  setAppearance,
}: Readonly<{
  t: Copy;
  language: Language;
  setLanguage: (l: Language) => void;
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
}>) {
  const [open, setOpen] = useState<"theme" | "language" | null>(null);
  const root = useRef<HTMLDivElement>(null),
    themeButton = useRef<HTMLButtonElement>(null),
    languageButton = useRef<HTMLButtonElement>(null);
  const copy = footerCopy[language];
  function close() {
    setOpen(null);
    (open === "theme" ? themeButton : languageButton).current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (open)
      root.current
        ?.querySelector<HTMLElement>('[role="menu"] [aria-checked="true"]')
        ?.focus();
  }, [open]);
  const Current =
    appearance === "system" ? Contrast : appearance === "dark" ? Moon : Sun;
  return (
    <div // NOSONAR: Escape for the native buttons inside
      className="footer-preferences"
      ref={root}
      onKeyDown={(e) => {
        if (!open) return;
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        }
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          const items = Array.from(
            root.current?.querySelectorAll<HTMLButtonElement>(
              '[role="menuitemradio"]',
            ) ?? [],
          );
          const i = items.indexOf(document.activeElement as HTMLButtonElement);
          items[
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? items.length - 1
                : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                  items.length
          ]?.focus();
        }
      }}
    >
      <div className="appearance-control">
        <button
          ref={themeButton}
          className="icon-button"
          aria-label={t.theme}
          aria-haspopup="menu"
          aria-expanded={open === "theme"}
          onClick={() => setOpen(open === "theme" ? null : "theme")}
        >
          <Current size={18} strokeWidth={1.5} />
        </button>
        {open === "theme" && (
          <div className="appearance-options" role="menu" aria-label={t.theme}>
            {(["light", "dark", "system"] as const).map((value) => {
              const Icon =
                value === "light" ? Sun : value === "dark" ? Moon : Contrast;
              return (
                <button
                  role="menuitemradio"
                  aria-checked={value === appearance}
                  key={value}
                  onClick={() => {
                    if (value !== appearance) setAppearance(value);
                    close();
                  }}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {copy[value]}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="appearance-control">
        <button
          ref={languageButton}
          className="locale-control"
          aria-label={t.language}
          aria-haspopup="menu"
          aria-expanded={open === "language"}
          onClick={() => setOpen(open === "language" ? null : "language")}
        >
          <Globe size={18} strokeWidth={1} />
          <span>{language.toUpperCase()}</span>
          <ChevronDown
            size={14}
            className={open === "language" ? "chevron-open" : ""}
          />
        </button>
        {open === "language" && (
          <div
            className="appearance-options language-options"
            role="menu"
            aria-label={t.language}
          >
            {Object.entries(languages).map(([code, label]) => (
              <button
                role="menuitemradio"
                aria-checked={code === language}
                key={code}
                onClick={() => {
                  setLanguage(code as Language);
                  close();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
