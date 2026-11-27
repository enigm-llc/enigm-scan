import { useRef, useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import type { Copy as TextCopy, Language } from "../shared/i18n/i18n";
import { productCopy } from "../shared/i18n/product";

export function needsComputer() {
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}
export function MobileStart({
  t,
  language,
  compact = false,
}: Readonly<{
  t: TextCopy;
  language: Language;
  /** Only the link and the share action (the page explains the rest). */
  compact?: boolean;
}>) {
  const c = productCopy[language];
  const canShare = typeof navigator.share === "function";
  const [result, setResult] = useState<"copied" | "shared" | null>(null);
  // The address field only appears when copying failed and it is needed.
  const [manual, setManual] = useState(!compact);
  const input = useRef<HTMLInputElement>(null);
  const url = "https://scan.enigm.io";
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setResult("copied");
    } catch {
      setResult(null);
      setManual(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
      input.current?.focus();
      input.current?.select();
    }
  }
  async function share() {
    try {
      await navigator.share({ title: "Enigm", url });
      setResult("shared");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        await copy();
      }
    }
  }
  return (
    <div className={`computer-handoff ${compact ? "compact" : ""}`}>
      {!compact && (
        <>
          <h2>{t.desktopRequired}</h2>
          <p className="handoff-what">{c.mobileWhat}</p>
          <ol className="handoff-steps">
            <li>{c.mobileStep1}</li>
            <li>{c.mobileStep2}</li>
            <li>{c.mobileStep3}</li>
          </ol>
        </>
      )}
      <button className="primary" onClick={canShare ? share : copy}>
        {canShare ? <Share2 size={17} /> : <Copy size={17} />}
        {canShare ? c.webShare : t.copyLink}
      </button>
      {manual && (
        <>
          <label className="visually-hidden" htmlFor="computer-link">
            {t.desktopLink}
          </label>
          <div className="handoff-link">
            <input
              id="computer-link"
              ref={input}
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
            />
            <button type="button" aria-label={t.copyLink} onClick={copy}>
              {result === "copied" ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </>
      )}
      <p
        className="handoff-feedback"
        role="status" /* NOSONAR: styled paragraph */
      >
        {result === "copied"
          ? t.linkCopied
          : result === "shared"
            ? c.webShared
            : ""}
      </p>
    </div>
  );
}
