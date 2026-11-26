import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { native, type AgentStatus } from "../core/agent";
import type { ScanReport } from "../core/report";
import { forgetScanChoices } from "../core/scan-choices";
import { useAppearance } from "../shared/appearance";
import { revealWindow } from "./native-shell";
import { agentDictionaries } from "../shared/i18n/agent";
import { flowCopy } from "../shared/i18n/flow";
import { useI18N } from "../shared/i18n/i18n";
import { Report } from "../components/Report";
import { Scanner } from "../components/Scanner";
import { ClosePromo } from "./ClosePromo";
import { Toaster } from "./Toaster";
import { clearToasts } from "./toast";
import { Welcome } from "./Welcome";

/** Phases in which a scan is still working on the phone or its copy. */
const RUNNING = [
  "awaiting_trust",
  "deep_wait",
  // An iPhone paired while searching, waiting for Start on the ready step.
  "trusted",
  "deep_ready",
  "awaiting_passcode",
  "passcode_retry",
  "acquiring",
  "capturing",
  "decrypting",
  "analyzing",
  "forensics",
  "network",
  "finalizing",
];

declare global {
  interface Window {
    /** Called by the app when the window is closed or the app is quit. */
    __enigmCloseRequested?: () => void;
  }
}

/**
 * The desktop app: one window for the whole scan, with the system's own menu
 * bar (macOS), language and appearance. Connect the phone, choose the
 * options, follow the copy and the analysis, read the report. Closing the app
 * deletes the report and the temporary copy, then shows the Enigm invitation
 * before the app quits.
 */
export default function DesktopApp() {
  const { language, t } = useI18N();
  useAppearance("system");
  // Shown once painted in the system's appearance, never white first.
  useEffect(revealWindow, []);
  const a = agentDictionaries[language];
  const [report, setReport] = useState<ScanReport | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  // The app is closing: the session is deleted and the invitation shown.
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  // A new value remounts the device search for the next phone.
  const [round, setRound] = useState(0);
  // The welcome screen shows until the owner starts, unless the app already
  // holds a scan (a report, or one still running).
  const [started, setStarted] = useState<boolean | null>(null);
  const reportRef = useRef(report);
  reportRef.current = report;
  // The report continues below the window: a cue until the person scrolls.
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const scrolled = () => setAtTop(window.scrollY < 24);
    scrolled();
    window.addEventListener("scroll", scrolled, { passive: true });
    return () => window.removeEventListener("scroll", scrolled);
  }, [report]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = "Enigm Scan";
    void native("set_menu_language", { language }).catch(() => {});
  }, [language]);
  useEffect(() => {
    void native<AgentStatus>("scan_status")
      .then(
        (status) => Boolean(status.report) || RUNNING.includes(status.phase),
      )
      .catch(() => false)
      .then((busy) => setStarted((value) => value ?? busy));
  }, []);
  // Closing or quitting: delete the session at once (stop a running scan),
  // then show the invitation. Closing again, or its button, quits.
  useEffect(() => {
    window.__enigmCloseRequested = () => {
      if (closingRef.current) {
        void native("close_application").catch(() => {});
        return;
      }
      closingRef.current = true;
      void native<AgentStatus>("scan_status")
        .then((status) => RUNNING.includes(status.phase))
        .catch(() => false)
        .then((running) =>
          native(running ? "cancel_scan" : "finish_scan").catch(() => {}),
        )
        .then(() => {
          forgetScanChoices();
          clearToasts();
          setReport(null);
          setClosing(true);
        });
    };
    return () => {
      delete window.__enigmCloseRequested;
    };
  }, []);
  // Behave like a desktop app, not a web page: links open in the system
  // browser, there is no page menu, and the page cannot be reloaded.
  useEffect(() => {
    const open = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (!/^https:\/\//i.test(href)) return;
      event.preventDefault();
      void native("open_link", { url: href }).catch(() => {});
    };
    const menu = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("input, textarea")) event.preventDefault();
    };
    const keys = (event: KeyboardEvent) => {
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (event.key === "F5" || (command && key === "r"))
        event.preventDefault();
      // Windows and Linux have no app menu: Ctrl+Q quits as on macOS.
      if (command && key === "q") {
        event.preventDefault();
        window.__enigmCloseRequested?.();
      }
    };
    document.addEventListener("click", open);
    document.addEventListener("contextmenu", menu);
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("click", open);
      document.removeEventListener("contextmenu", menu);
      document.removeEventListener("keydown", keys);
    };
  }, []);
  /** Forget the report, the phone session and its temporary folders, then
   *  search for the next phone. The report stays if the app could not. */
  async function scanAnother() {
    if (finishing) return;
    setFinishing(true);
    setFinishError(false);
    try {
      await native("finish_scan");
      forgetScanChoices();
      setReport(null);
      setRound((value) => value + 1);
      window.scrollTo(0, 0);
    } catch {
      setFinishError(true);
    } finally {
      setFinishing(false);
    }
  }
  return (
    <div className="app-window">
      {/* macOS: the title bar is transparent over the app; this strip is
          where the window is dragged from. */}
      <div className="app-drag" data-tauri-drag-region aria-hidden="true" />
      {/* Closing: the session is gone, only the invitation remains. */}
      {!closing && started === false && (
        <main className="scan-main is-welcome">
          <Welcome language={language} onStart={() => setStarted(true)} />
        </main>
      )}
      {!closing && started && (
        <main className={report ? "scan-main has-report" : "scan-main"}>
          {finishError && (
            <p className="error" role="alert">
              {a.finishError}
            </p>
          )}
          {report ? (
            <Report
              language={language}
              report={report}
              t={t}
              onScanAnother={scanAnother}
              finishing={finishing}
              originLabel={a.nativeReport}
            />
          ) : (
            <Scanner
              key={round}
              language={language}
              t={t}
              onReport={(value) => {
                setReport(value);
                window.scrollTo(0, 0);
              }}
              onCancelled={() => {
                forgetScanChoices();
                setRound((value) => value + 1);
                window.scrollTo(0, 0);
              }}
            />
          )}
        </main>
      )}
      {report && !closing && atTop && (
        <button
          className="scroll-cue"
          aria-label={flowCopy[language].scrollMore}
          onClick={() =>
            window.scrollBy({
              top: window.innerHeight * 0.8,
              behavior: "smooth",
            })
          }
        >
          <ChevronDown size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      )}
      {closing && <ClosePromo language={language} />}
      <Toaster />
    </div>
  );
}
