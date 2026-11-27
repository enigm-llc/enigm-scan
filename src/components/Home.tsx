import { useEffect, useRef, useState } from "react";
import {
  Download,
  ArrowRight,
  RotateCcw,
  Cable,
  HardDrive,
  ScanSearch,
  FileText,
} from "lucide-react";
import { agentDictionaries } from "../shared/i18n/agent";
import { LaptopStage } from "./LaptopStage";
import { Honeycomb } from "./Honeycomb";
import { SPYWARE_FAMILIES } from "../shared/spyware-families";
import { ComputerIcon, DeviceIcon } from "./Brand";
import { OsMenu, osLabel } from "./OsMenu";
import { productCopy } from "../shared/i18n/product";
import { siteCopy } from "../shared/i18n/site";
import { flowCopy } from "../shared/i18n/flow";
import type { Copy, Language } from "../shared/i18n/i18n";
import manifest from "../../releases/manifest.json";
export function Home({
  t,
  language,
  mobile,
  onHow,
  started = false,
  onStart,
}: Readonly<{
  t: Copy;
  language: Language;
  mobile: boolean;
  /** Opens the How it works page (phones have no scan action). */
  onHow?: () => void;
  /** The download step is shown (it has its own URL). */
  started?: boolean;
  onStart?: () => void;
}>) {
  const c = siteCopy[language],
    p = productCopy[language],
    f = flowCopy[language],
    a = agentDictionaries[language];
  const files = manifest.files.filter((f) => f.published);
  const [downloaded, setDownloaded] = useState(false);
  const [choice, setChoice] = useState(() => {
    const ua = navigator.userAgent;
    const platform = /Windows/i.test(ua)
      ? "Windows"
      : /Linux/i.test(ua)
        ? "Linux"
        : "";
    return files.find((f) => f.platform === platform)?.filename ?? "";
  });
  useEffect(() => {
    let active = true;
    const data = (
      navigator as Navigator & {
        userAgentData?: {
          getHighEntropyValues: (
            hints: string[],
          ) => Promise<{ platform?: string; architecture?: string }>;
        };
      }
    ).userAgentData;
    if (data)
      void data
        .getHighEntropyValues(["platform", "architecture"])
        .then((info) => {
          if (!active || info.platform !== "macOS") return;
          const arch =
            info.architecture === "arm"
              ? "arm64"
              : info.architecture === "x86"
                ? "x64"
                : null;
          if (arch)
            setChoice(
              files.find((f) => f.platform === "macOS" && f.arch === arch)
                ?.filename ?? "",
            );
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const selected = files.find((f) => f.filename === choice);
  const stageRef = useRef<HTMLDivElement>(null);
  // Phones cannot run a scan: a page of their own that explains Enigm Scan
  // and hands over to a computer.
  if (mobile)
    return (
      <section className="mobile-landing" aria-labelledby="home-title">
        <Honeycomb
          name="Pegasus"
          names={SPYWARE_FAMILIES}
          caption={p.knownSpyware}
          local
          anchor={stageRef}
        />
        <h1 id="home-title">
          {c.title} <span>{c.intro}</span>
        </h1>
        <div className="mobile-stage" ref={stageRef} aria-hidden="true" />
        <div className="mobile-cta">
          <a
            className="landing-go"
            href="/how-it-works"
            onClick={(event) => {
              if (!onHow) return;
              event.preventDefault();
              onHow();
            }}
          >
            {c.howButton}
            <span aria-hidden="true">
              <ArrowRight size={20} />
            </span>
          </a>
          <p>{p.freeLine}</p>
        </div>
      </section>
    );
  // The landing: one sentence in two voices over a quiet honeycomb.
  if (!started)
    return (
      <section className="landing" aria-labelledby="home-title">
        <Honeycomb
          name="Pegasus"
          names={SPYWARE_FAMILIES}
          caption={p.knownSpyware}
        />
        <h1 id="home-title">
          {c.title} <span>{c.intro}</span>
        </h1>
        <div className="landing-action">
          <button className="landing-go" onClick={onStart}>
            {c.start}
            <span aria-hidden="true">
              <ArrowRight size={20} />
            </span>
          </button>
          <div className="landing-meta">
            <b>{p.freeLine}</b>
            <span>
              <DeviceIcon device="ios" size={14} tint />
              iPhone
              <DeviceIcon device="android" size={15} tint />
              Android
            </span>
          </div>
        </div>
      </section>
    );
  return (
    <section className="web-workspace stage" aria-labelledby="home-title">
      <LaptopStage
        screen={downloaded ? "downloaded" : "download"}
        platform={selected?.platform}
      />
      <div className="console-copy">
        <div className="web-hero">
          <h1 id="home-title">{downloaded ? f.openTitle : c.downloadTitle}</h1>
          <p className="lede">
            {downloaded
              ? `${
                  selected?.platform === "Windows"
                    ? f.openWindows
                    : selected?.platform === "Linux"
                      ? f.openLinux
                      : f.openMac
                } ${f.openAfter}`
              : c.runHelp}
          </p>
        </div>
        <div className="web-action">
          {downloaded ? (
            <div className="download-file surface-enter">
              {selected && (
                <span className="file-os" aria-hidden="true">
                  <ComputerIcon platform={selected.platform} size={20} />
                </span>
              )}
              <span className="file-meta">
                <b>{selected ? osLabel(selected) : "Enigm Scan"}</b>
                {selected && (
                  <small>
                    {`v${manifest.version} · ${Math.round(selected.bytes / 1e6).toLocaleString(language)} MB`}
                  </small>
                )}
              </span>
              <span className="file-actions">
                {selected && (
                  <a
                    className="quiet-action"
                    href={
                      "https://scan.enigm.io/downloads/" + selected.filename
                    }
                    download
                  >
                    <Download size={15} aria-hidden="true" />
                    {f.downloadAgain}
                  </a>
                )}
                <button
                  className="quiet-action"
                  onClick={() => setDownloaded(false)}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  {f.changeSystem}
                </button>
              </span>
            </div>
          ) : (
            <div className="download-focus">
              <OsMenu
                files={files}
                value={choice}
                label={p.computer}
                onChange={setChoice}
              />
              {selected ? (
                <a
                  className="button primary"
                  href={"https://scan.enigm.io/downloads/" + selected.filename}
                  download
                  onClick={() => setDownloaded(true)}
                >
                  <Download size={18} aria-hidden="true" />
                  {c.download}
                </a>
              ) : (
                <button className="primary" disabled>
                  <Download size={17} />
                  {c.download}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="next-steps">
        <h2>{f.nextTitle}</h2>
        <ol>
          {[a.stepConnect, a.stepCopy, a.stepAnalyze, a.stepReport].map(
            (name, i) => {
              const Icon = [Cable, HardDrive, ScanSearch, FileText][i];
              return (
                <li key={name}>
                  <span className="next-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                  <b>{name}</b>
                  <span>{f.next[i]}</span>
                </li>
              );
            },
          )}
        </ol>
      </div>
    </section>
  );
}
