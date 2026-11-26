import type { Copy, Language } from "../shared/i18n/i18n";
import { footerCopy } from "../shared/i18n/footer";
import { siteCopy } from "../shared/i18n/site";
import type { Appearance } from "../shared/appearance";
import { Preferences } from "./Preferences";
export function Footer({
  t,
  language,
  setLanguage,
  appearance,
  setAppearance,
}: {
  t: Copy;
  language: Language;
  setLanguage: (l: Language) => void;
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
}) {
  const copy = footerCopy[language],
    c = siteCopy[language];
  return (
    <footer className="app-footer login-footer">
      <div className="footer-legal">
        <span>
          © {new Date().getFullYear()} Enigm
          <span className="footer-local">, {c.footer}</span>
        </span>
        <span className="legal-divider" aria-hidden="true">
          |
        </span>
        <a
          href="https://enigm.io/es/legal"
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.legal}
        </a>
      </div>
      <Preferences
        t={t}
        language={language}
        setLanguage={setLanguage}
        appearance={appearance}
        setAppearance={setAppearance}
      />
    </footer>
  );
}
