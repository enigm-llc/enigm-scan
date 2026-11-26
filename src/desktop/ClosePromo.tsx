import { useEffect } from "react";
import { X } from "lucide-react";
import { native } from "../core/agent";
import { BrandSymbol } from "../components/Brand";
import { flowCopy } from "../shared/i18n/flow";
import { productCopy } from "../shared/i18n/product";
import type { Language } from "../shared/i18n/i18n";

const ENIGM = "https://app.enigm.io";

/**
 * Shown when the app is closed, after the session has been deleted: only the
 * Enigm invitation. Its close button (or Escape, or closing the window again)
 * quits; trying Enigm opens it in the browser and quits too.
 */
export function ClosePromo({ language }: { language: Language }) {
  const c = productCopy[language];
  const f = flowCopy[language];
  const quit = () => void native("close_application").catch(() => {});
  const tryEnigm = () =>
    void native("open_link", { url: ENIGM })
      .catch(() => {})
      .then(quit);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") quit();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  return (
    <div className="promo-backdrop">
      <section
        className="promo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-title"
      >
        <button className="promo-close" aria-label={f.closeNow} onClick={quit}>
          <X size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <div className="promo-head">
          <BrandSymbol />
          <span>Enigm</span>
        </div>
        <h2 id="promo-title">{c.offerTitle}</h2>
        <p>{c.offerBody}</p>
        <button className="promo-primary" onClick={tryEnigm}>
          {c.offerAction}
        </button>
      </section>
    </div>
  );
}
