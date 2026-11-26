import { useEffect, useRef, useState } from "react";
import {
  FolderOpen,
  KeyRound,
  ScanLine,
  Fingerprint,
  Network,
  Eraser,
  Pause,
  Play,
  ShieldCheck,
  LockKeyhole,
  Check,
  LoaderCircle,
  X,
} from "lucide-react";
import {
  native,
  type AcquisitionProgress,
  type AgentStatus,
} from "../core/agent";
import { PhoneStage } from "./PhoneStage";
import type { Language } from "../shared/i18n/i18n";
import { Cascade } from "./Cascade";
import type { AgentCopy } from "../shared/i18n/agent";
import type { Copy } from "../shared/i18n/i18n";
import { flowCopy } from "../shared/i18n/flow";

// Real order: Trust (pairing) → passcode → copy, with the network observed in
// parallel (`acquisition.capturing`); a standalone "capturing" phase exists
// for observing the network before the copy. Prompt phases are shown only
// while the phone itself is prompting the user.
const phases = [
  ["awaiting_trust", ShieldCheck],
  ["capturing", Network],
  ["awaiting_passcode", LockKeyhole],
  // The phone dropped an unanswered passcode prompt; the copy starts again.
  ["passcode_retry", LockKeyhole],
  ["acquiring", FolderOpen],
  ["decrypting", KeyRound],
  ["analyzing", ScanLine],
  ["forensics", Fingerprint],
  ["network", Network],
  ["finalizing", Eraser],
] as const;
type Phase = (typeof phases)[number][0];
/** The adapter's network observation window, in seconds. */
const CAPTURE_SECONDS = 120;
/** No new data for this long while copying: say the phone is preparing data. */
const QUIET_SECONDS = 90;
/** How long each line of the progress card stays before the next. */
const CARD_SECONDS = 5;
/** How long the adapter waits for "Trust This Computer?" (TRUST_SECONDS). */
const TRUST_SECONDS = 180;
/** How long the adapter waits for the deep check (DEEP_WAIT_SECONDS). */
const DEEP_WAIT_SECONDS = 300;
const PROMPT_PHASES = [
  "awaiting_trust",
  "deep_wait",
  "awaiting_passcode",
  "passcode_retry",
];

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
function duration(seconds: number, a: AgentCopy, language: string) {
  if (seconds < 60) return a.lessThanMinute;
  const minutes = Math.round(seconds / 60);
  const unit = (
    value: number,
    kind: "hour" | "minute",
    display: "long" | "short",
  ) =>
    new Intl.NumberFormat(language, {
      style: "unit",
      unit: kind,
      unitDisplay: display,
    }).format(value);
  if (minutes < 60) return unit(minutes, "minute", "long");
  const rest = minutes % 60;
  return rest
    ? `${unit(Math.floor(minutes / 60), "hour", "short")} ${unit(rest, "minute", "short")}`
    : unit(minutes / 60, "hour", "long");
}
function size(bytes: number, language: string) {
  const gb = bytes / 1e9;
  return gb >= 1
    ? `${gb.toLocaleString(language, { maximumFractionDigits: 1 })} GB`
    : `${(bytes / 1e6).toLocaleString(language, { maximumFractionDigits: 0 })} MB`;
}

/**
 * Animation indicates activity only. Phase, counts and the percentage come
 * exclusively from the app's engines (the percentage is the phone's own report);
 * times are measured locally and the remaining time is a labelled estimate.
 */
export function ScanProgress({
  status,
  a,
  t,
  encrypted,
  network,
  connections = false,
  ios = false,
  diagnostics = false,
  rules,
  onCancel,
  cancelLabel,
}: {
  status: AgentStatus;
  a: AgentCopy;
  t: Copy;
  encrypted: boolean;
  network: boolean;
  /** Android: its open connections are read with the copy, as chosen. */
  connections?: boolean;
  /** iPhone USB acquisition: the phone may ask for its passcode. */
  ios?: boolean;
  /** The deep check was chosen for this iPhone scan. */
  diagnostics?: boolean;
  /** Number of signed indicators in use, when known. */
  rules?: number;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const [paused, setPaused] = useState(false);
  // "Continue without the deep check" was pressed: wait for the adapter.
  const [skipping, setSkipping] = useState(false);
  const now = useClock();
  const language = document.documentElement.lang || "en";
  // Local timing: when the whole run and the current phase started.
  const started = useRef(Date.now());
  const phaseStart = useRef({ phase: status.phase, at: Date.now() });
  if (phaseStart.current.phase !== status.phase)
    phaseStart.current = { phase: status.phase, at: Date.now() };
  // Detect what the copy is doing from counter changes between updates.
  const last = useRef<{
    sample?: AcquisitionProgress;
    activity: "copy" | "discard";
    changed: number;
  }>({ activity: "copy", changed: Date.now() });
  const sample = status.acquisition ?? undefined;
  if (sample && sample !== last.current.sample) {
    const previous = last.current.sample;
    if (!previous)
      last.current = { ...last.current, sample, changed: Date.now() };
    else if (sample.discarded > previous.discarded)
      last.current = { sample, activity: "discard", changed: Date.now() };
    else if (
      sample.kept > previous.kept ||
      sample.receivedBytes > previous.receivedBytes
    )
      last.current = { sample, activity: "copy", changed: Date.now() };
    else last.current = { ...last.current, sample };
  }
  // Network observation alongside the copy: measured locally from when the
  // adapter first reported it, bounded by its fixed window.
  const parallel = sample?.capturing !== undefined;
  const captureStart = useRef<number | null>(null);
  if (sample?.capturing && captureStart.current === null)
    captureStart.current = Date.now();
  const captureLeft =
    sample?.capturing && captureStart.current !== null
      ? Math.max(0, CAPTURE_SECONDS - (now - captureStart.current) / 1000)
      : undefined;
  // The phone accepted (Trust and passcode) once copied data arrives.
  const accepted =
    status.phase === "acquiring" &&
    !!sample &&
    (sample.receivedBytes > 0 || sample.kept > 0);
  // Optional deep check on iPhone: the owner starts the sysdiagnose before
  // the scan (no Trust or passcode prompt open yet); here only what the
  // phone reports about it is shown.
  const sysdiagnose = sample?.sysdiagnose;
  const deepCheck =
    ios && diagnostics && status.phase === "acquiring" && !!sysdiagnose;
  const f = flowCopy[(language in flowCopy ? language : "en") as Language];
  const current = phases.find(([phase]) => phase === status.phase);
  // Android asks to allow USB debugging, not to "Trust" an iPhone.
  // One title for the whole analysis, on iPhone and Android alike.
  const analysisPhase = ["analyzing", "forensics", "network"].includes(
    status.phase,
  );
  // After Trust: the owner starts the deep check, then the phone confirms it.
  const deepWait = status.phase === "deep_wait";
  const deepConfirmed = deepWait && !!sample?.sysdiagnose;
  const label =
    status.phase === "awaiting_trust" && !ios
      ? f.trustAndroid
      : deepWait
        ? deepConfirmed
          ? f.deepConfirmedTitle
          : f.deepWaitTitle
        : analysisPhase
          ? a.analyzing
          : current
            ? a[current[0]]
            : a.progress;
  const phaseSeconds = (now - phaseStart.current.at) / 1000;
  // A labelled waiting time (never presented as progress).
  const waitText = (left: number) => {
    const seconds = Math.max(0, Math.ceil(left));
    return a.waitLeft.replace(
      "{t}",
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    );
  };
  const percent =
    status.phase === "acquiring" && sample?.percent !== undefined
      ? Math.min(100, Math.max(0, sample.percent))
      : undefined;
  // Remaining time from the phone's own percentage, once it is meaningful.
  const remaining =
    percent !== undefined && percent >= 3 && percent < 100 && phaseSeconds >= 60
      ? (phaseSeconds * (100 - percent)) / percent
      : undefined;
  // Under the title: what this step is, the same for its whole duration.
  const indicators = rules
    ? a.actIndicators.replace("{n}", rules.toLocaleString(language))
    : a.actIndicators.replace("{n} ", "");
  const activity = (() => {
    switch (status.phase as Phase) {
      case "capturing":
        return a.actCapture.replace(
          "{t}",
          duration(Math.max(0, CAPTURE_SECONDS - phaseSeconds), a, language),
        );
      case "acquiring":
        return a.actCopy;
      case "decrypting":
        return a.actDecrypt;
      case "analyzing":
      case "forensics":
      case "network":
        return indicators;
      case "finalizing":
        return a.actCleanup;
      default:
        return undefined;
    }
  })();
  // In the card: what is being done right now, in a few words.
  const doing = (() => {
    switch (status.phase as Phase) {
      case "acquiring":
        if (!sample) return f.cardCopying;
        if (percent !== undefined && percent >= 99) return f.cardFinishing;
        if ((now - last.current.changed) / 1000 > QUIET_SECONDS)
          return f.cardWaiting;
        return last.current.activity === "discard"
          ? f.cardSkipping
          : f.cardCopying;
      case "decrypting":
        return f.cardDecrypting;
      case "analyzing":
        return f.cardComparing;
      case "forensics":
        return f.cardForensics;
      case "network":
        return f.cardNetwork;
      case "finalizing":
        return f.cardCleanup;
      default:
        return undefined;
    }
  })();
  // Four plain steps instead of engine phases.
  const macro = [
    [
      "connect",
      a.stepConnect,
      ["awaiting_trust", "deep_wait", "awaiting_passcode", "passcode_retry"],
    ],
    ["copy", a.stepExtract, ["capturing", "acquiring", "decrypting"]],
    ["analyze", a.stepAnalyze, ["analyzing", "forensics", "network"]],
    ["report", a.stepReport, ["finalizing"]],
  ] as const;
  const stage = Math.max(
    0,
    macro.findIndex(([, , members]) =>
      (members as readonly string[]).includes(status.phase),
    ),
  );
  // Beside the phone: what is happening, in numbers (never invented).
  const compact = (seconds: number) => {
    const unit = (value: number, kind: "hour" | "minute") =>
      new Intl.NumberFormat(language, {
        style: "unit",
        unit: kind,
        unitDisplay: "short",
      }).format(value);
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return "< " + unit(1, "minute");
    if (minutes < 60) return unit(minutes, "minute");
    const rest = minutes % 60;
    return rest
      ? `${unit(Math.floor(minutes / 60), "hour")} ${unit(rest, "minute")}`
      : unit(minutes / 60, "hour");
  };
  const elapsedShort = compact((now - started.current) / 1000);
  const copying = ["acquiring", "capturing", "decrypting"].includes(
    status.phase,
  );
  const facts: Array<{ value: string; label: string }> = copying
    ? [
        ...(percent !== undefined
          ? [{ value: `${Math.floor(percent)} %`, label: f.factPercent }]
          : []),
        ...(remaining !== undefined
          ? [{ value: compact(remaining), label: f.factLeft }]
          : []),
        ...(sample && sample.storedBytes > 0
          ? [{ value: size(sample.storedBytes, language), label: f.factCopied }]
          : []),
        ...(sample && sample.receivedBytes > 0
          ? [
              {
                value: size(sample.receivedBytes, language),
                label: f.factReceived,
              },
            ]
          : []),
        ...(sample && sample.discarded > 0
          ? [
              {
                value: sample.discarded.toLocaleString(language),
                label: a.statDiscarded,
              },
            ]
          : []),
        { value: elapsedShort, label: f.factElapsed },
      ]
    : [
        ...(rules
          ? [{ value: rules.toLocaleString(language), label: f.factSigned }]
          : []),
        ...(status.artifacts > 0
          ? [
              {
                value: status.artifacts.toLocaleString(language),
                label:
                  new Intl.PluralRules(language).select(status.artifacts) ===
                  "one"
                    ? f.factFile
                    : f.factFiles,
              },
            ]
          : []),
        { value: elapsedShort, label: f.factElapsed },
      ];
  // The card under the steps says what is being done now, in real numbers
  // (copied, received, files reviewed…), one at a time; once per round, how
  // long the scan has taken. While waiting on the phone, only the time.
  const elapsedLine = a.elapsed.replace(
    "{t}",
    duration((now - started.current) / 1000, a, language),
  );
  const workLines = PROMPT_PHASES.includes(status.phase)
    ? []
    : facts
        .filter((fact) => fact.label !== f.factElapsed)
        .map((fact) => `${fact.value} ${fact.label}`);
  const observing =
    captureLeft !== undefined &&
    ["acquiring", "awaiting_passcode"].includes(status.phase)
      ? f.cardObserving
      : undefined;
  // The deep check is one more line of the card, as the phone reports it.
  const deepLine = deepCheck
    ? sysdiagnose === "ready"
      ? f.cardDeepReady
      : f.cardDeepPreparing
    : undefined;
  const cardLines = [
    ...(doing ? [doing] : []),
    ...(observing ? [observing] : []),
    ...(deepLine ? [deepLine] : []),
    ...workLines,
    elapsedLine,
  ];
  const cardLine =
    cardLines[
      // The clock can read a moment before the start: never a negative turn.
      Math.floor(Math.max(0, now - started.current) / 1000 / CARD_SECONDS) %
        cardLines.length
    ];
  return (
    <section
      className={`scan-progress scan-cinema ${paused ? "motion-paused" : ""}`}
      aria-labelledby="progress-heading"
    >
      <PhoneStage
        language={language as Language}
        paused={paused}
        attention={PROMPT_PHASES.includes(status.phase)}
        press={deepWait && !deepConfirmed}
        // The waves while the network is checked: the iPhone's traffic
        // window, or the copy of an Android phone whose connections are read.
        network={!!sample?.capturing || (connections && copying)}
        platform={ios ? "ios" : "android"}
        screen={
          status.phase === "awaiting_trust"
            ? ios
              ? {
                  kind: "trust",
                  title: a.phoneTrustTitle,
                  no: a.phoneTrustNo,
                  yes: a.phoneTrustYes,
                }
              : {
                  kind: "usb-debug",
                  title: f.usbDebugTitle,
                  body: f.usbDebugBody,
                  always: f.usbDebugAlways,
                  cancel: f.usbDebugCancel,
                  allow: f.usbDebugAllow,
                }
            : deepWait
              ? deepConfirmed
                ? { kind: "confirmed", title: f.deepConfirmedTitle }
                : { kind: "lock", subtitle: f.deepWaitTitle }
              : ["awaiting_passcode", "passcode_retry"].includes(status.phase)
                ? { kind: "passcode", title: a.phonePasscode }
                : ["acquiring", "capturing", "decrypting"].includes(
                      status.phase,
                    )
                  ? {
                      kind: "copy",
                      percent,
                      subtitle:
                        ios && !accepted ? a.noteCodeMaybe : a.phoneKeep,
                    }
                  : { kind: "analyze", subtitle: a.localProcessing }
        }
        facts={
          PROMPT_PHASES.includes(status.phase) ? undefined : { items: facts }
        }
      />
      <div className="console-copy">
        <div className="progress-topline">
          <h2
            id="progress-heading"
            className="visually-hidden"
            ref={heading}
            tabIndex={-1}
          >
            {a.progress}
          </h2>
        </div>
        <ol className="process-steps" aria-label={a.progress}>
          {macro.map(([key, name], position) => (
            <li
              key={key}
              className={
                position < stage ? "done" : position === stage ? "current" : ""
              }
              aria-current={position === stage ? "step" : undefined}
            >
              {position < stage && (
                <span className="step-check" aria-hidden="true">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
              <span>{name}</span>
            </li>
          ))}
        </ol>
        <div className="scan-stage">
          <div className="scan-caption">
            <div role="status" aria-live="polite">
              <h3 className="phase-copy">
                <Cascade text={label} />
              </h3>
            </div>
            {status.phase === "awaiting_trust" ? (
              <>
                <p className="scan-hint" role="alert">
                  {ios ? a.trustNow : f.trustAndroidNow}
                </p>
                {ios && (
                  <p className="scan-wait">
                    {waitText(
                      Math.min(TRUST_SECONDS, TRUST_SECONDS - phaseSeconds),
                    )}
                  </p>
                )}
              </>
            ) : deepWait ? (
              deepConfirmed ? (
                <p className="scan-hint deep-confirmed" role="status">
                  {f.deepConfirmedHint}
                </p>
              ) : (
                <>
                  <p className="scan-hint" role="alert">
                    {f.deepWaitHint}
                  </p>
                  <p className="scan-wait">
                    {waitText(
                      Math.min(
                        DEEP_WAIT_SECONDS,
                        DEEP_WAIT_SECONDS - phaseSeconds,
                      ),
                    )}
                  </p>
                  <button
                    className="quiet-action deep-skip"
                    disabled={skipping}
                    onClick={() => {
                      setSkipping(true);
                      void native("skip_deep_check").catch(() =>
                        setSkipping(false),
                      );
                    }}
                  >
                    {f.deepSkip}
                  </button>
                </>
              )
            ) : status.phase === "passcode_retry" ? (
              <p className="scan-hint" role="alert">
                {a.passcodeRetryNow}
              </p>
            ) : status.phase === "awaiting_passcode" ? (
              <p className="scan-hint" role="alert">
                {a.passcodeNow}
              </p>
            ) : (
              activity && (
                <p className="scan-activity" key={activity}>
                  {activity}
                </p>
              )
            )}
          </div>
        </div>
        <div className="progress-panel">
          <div className="progress-card">
            <span className="progress-card-icon" aria-hidden="true">
              {/* Turns while the copy runs; Pause stops it with the rest. */}
              <LoaderCircle
                size={18}
                className={`progress-spinner ${paused ? "is-paused" : ""}`}
              />
            </span>
            <span className="progress-card-text">
              {/* What is being done now; now and then, how long it has taken. */}
              <b key={cardLine} className="progress-card-line">
                {cardLine}
              </b>
              {remaining !== undefined && (
                <small title={a.estimateNote}>
                  {a.remaining.replace("{t}", duration(remaining, a, language))}
                </small>
              )}
            </span>
            <span className="progress-card-actions">
              {/* Round icon buttons, named for screen readers and on hover,
                  so the line beside them always fits on one line. */}
              <button
                className="quiet-action"
                title={paused ? a.resumeMotion : a.pauseMotion}
                aria-label={paused ? a.resumeLabel : a.pauseLabel}
                onClick={() => setPaused(!paused)}
              >
                {paused ? (
                  <Play size={16} aria-hidden="true" />
                ) : (
                  <Pause size={16} aria-hidden="true" />
                )}
              </button>
              <button
                className="quiet-action"
                title={cancelLabel ?? a.cancel}
                aria-label={cancelLabel ?? a.cancel}
                onClick={onCancel}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
