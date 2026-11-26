import { flowCopy } from "../shared/i18n/flow";
import type { Language } from "../shared/i18n/i18n";

/**
 * The first screen when the app opens: the app icon, what it does and one
 * way in. Nothing touches a phone until the owner chooses to start.
 */
export function Welcome({
  language,
  onStart,
}: {
  language: Language;
  onStart: () => void;
}) {
  const f = flowCopy[language];
  return (
    <section className="welcome" aria-labelledby="welcome-title">
      {/* The app's radar mark, without its tile: white on a dark window,
          black on a light one. */}
      <picture>
        <source
          srcSet="/brand/enigm-scan-mark-white.svg"
          media="(prefers-color-scheme: dark)"
        />
        <img
          className="welcome-icon"
          src="/brand/enigm-scan-mark-black.svg"
          alt=""
          width={190}
          height={190}
          draggable={false}
        />
      </picture>
      <h1 id="welcome-title">{f.welcomeTitle}</h1>
      <p className="welcome-body">{f.welcomeBody}</p>
      <button className="welcome-start" onClick={onStart}>
        {f.welcomeAction}
      </button>
    </section>
  );
}
