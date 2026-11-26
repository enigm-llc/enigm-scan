import { useEffect } from "react";
import { useAppearance } from "../shared/appearance";
import { flowCopy } from "../shared/i18n/flow";
import { useI18N } from "../shared/i18n/i18n";

const WEBSITE = "https://scan.enigm.io";
const SOURCE = "https://github.com/enigm-llc/enigm-scan";

/** The version the app passes in the address, shown only if well formed. */
function versionFromAddress(): string | null {
  const version = new URLSearchParams(window.location.search).get("version");
  return version && /^\d+\.\d+\.\d+$/.test(version) ? version : null;
}

/**
 * The About window, opened from the macOS app menu: the app icon, its name and
 * version, what it does, where to find it and under which licence. Its links
 * open in the system browser (the app never shows other pages).
 */
export default function AboutWindow() {
  const { language } = useI18N();
  useAppearance("system");
  const f = flowCopy[language];
  const version = versionFromAddress();
  useEffect(() => {
    document.documentElement.lang = language;
    const menu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", menu);
    return () => document.removeEventListener("contextmenu", menu);
  }, [language]);
  return (
    <main className="about-window">
      <img
        className="about-icon"
        src="/brand/enigm-scan-app-icon.png"
        alt=""
        width={112}
        height={112}
        draggable={false}
      />
      <h1>Enigm Scan</h1>
      {version && (
        <p className="about-version">
          {f.aboutVersion.replace("{v}", version)}
        </p>
      )}
      <p className="about-body">{f.aboutBody}</p>
      <div className="about-links">
        <a href={WEBSITE}>{f.aboutWebsite}</a>
        <a href={SOURCE}>{f.aboutSource}</a>
      </div>
      <div className="about-legal">
        <span>© 2026 Enigm</span>
        <span>PolyForm Noncommercial 1.0.0</span>
      </div>
    </main>
  );
}
