import { native } from "../core/agent";
import { flowCopy } from "../shared/i18n/flow";
import type { Language } from "../shared/i18n/i18n";

/** Where every version of the desktop app is published. */
export const DOWNLOAD_PAGE = "https://scan.enigm.io/download";

/**
 * Shown at start, in place of the welcome screen, when the website publishes
 * a newer version. The app never updates itself: the button opens the
 * download page in the browser.
 */
export function UpdateAvailable({
  language,
  version,
}: {
  language: Language;
  version: string;
}) {
  const f = flowCopy[language];
  return (
    <section className="welcome" aria-labelledby="update-title">
      {(["black", "white"] as const).map((tone) => (
        <img
          key={tone}
          className={`welcome-icon is-${tone}`}
          src={`/brand/enigm-scan-mark-${tone}.svg`}
          alt=""
          width={190}
          height={190}
          draggable={false}
        />
      ))}
      <h1 id="update-title">{f.updateTitle}</h1>
      <p className="welcome-body">
        {f.updateBody.replace("{version}", version)}
      </p>
      <button
        className="welcome-start"
        onClick={() =>
          void native("open_link", { url: DOWNLOAD_PAGE }).catch(() => {})
        }
      >
        {f.updateAction}
      </button>
    </section>
  );
}
