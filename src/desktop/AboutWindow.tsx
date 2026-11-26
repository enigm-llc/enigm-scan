import { useEffect } from "react";
import { useAppearance } from "../shared/appearance";
import { flowCopy } from "../shared/i18n/flow";
import { useI18N, type Language } from "../shared/i18n/i18n";

/** A value the app passes in the address, shown only if well formed. */
function fromAddress(key: string, pattern: RegExp): string | null {
  const value = new URLSearchParams(window.location.search).get(key);
  return value && pattern.test(value) ? value : null;
}

/** The release date in the interface language's format, from an ISO date. */
function releaseDate(iso: string, language: Language): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * The About window, opened from the macOS app menu and laid out like the
 * system's own: the app icon, its name, what it is, the version, the release
 * date and the copyright.
 */
export default function AboutWindow() {
  const { language } = useI18N();
  useAppearance("system");
  const f = flowCopy[language];
  const version = fromAddress("version", /^\d+\.\d+\.\d+$/);
  const released = fromAddress("released", /^\d{4}-\d{2}-\d{2}$/);
  useEffect(() => {
    document.documentElement.lang = language;
    const menu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", menu);
    return () => document.removeEventListener("contextmenu", menu);
  }, [language]);
  return (
    <main className="about-window">
      <div className="app-drag" data-tauri-drag-region aria-hidden="true" />
      <img
        className="about-icon"
        src="/brand/enigm-scan-app-icon.png"
        alt=""
        width={84}
        height={84}
        draggable={false}
      />
      <h1>Enigm Scan</h1>
      <p className="about-lines">
        <span>{f.aboutBody}</span>
        {version && <span>{f.aboutVersion.replace("{v}", version)}</span>}
      </p>
      {released && (
        <p className="about-lines">
          {f.aboutReleased.replace("{d}", releaseDate(released, language))}
        </p>
      )}
      <p className="about-lines">© 2026 Enigm</p>
    </main>
  );
}
