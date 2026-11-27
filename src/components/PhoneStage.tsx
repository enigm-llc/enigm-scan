import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  BatteryFull,
  Check,
  ChevronLeft,
  CircleAlert,
  Lock,
  Power,
  ShieldX,
  Signal,
  Unplug,
  Wifi,
} from "lucide-react";
import { DeviceIcon } from "./Brand";
import { useGlide } from "./glide";
import type { Language } from "../shared/i18n/i18n";

export type PhoneScreen =
  | {
      kind: "lock";
      subtitle?: string;
      /** What to do on the phone, per system (shown while it is unknown). */
      steps?: { title: string; ios: string[]; android: string[] };
    }
  | {
      kind: "device";
      platform: "ios" | "android";
      name: string;
      detail?: string;
      status: string;
      ready?: boolean;
    }
  | { kind: "trust"; title: string; no: string; yes: string }
  | {
      kind: "usb-debug";
      title: string;
      body: string;
      always: string;
      cancel: string;
      allow: string;
    }
  | { kind: "prompt"; text: string }
  | { kind: "passcode"; title: string }
  | {
      kind: "guide";
      trust: { title: string; body: string; no: string; yes: string };
      dev: {
        title: string;
        main: string;
        section: string;
        usb: string;
        hint: string;
      };
      aside: { ios: string; android: string };
    }
  | {
      kind: "problem";
      reason: "unplugged" | "locked" | "trust" | "error";
      title: string;
      detail: string;
    }
  | {
      kind: "copy";
      subtitle: string;
    }
  | { kind: "analyze"; subtitle: string }
  | { kind: "clean"; title: string; detail: string; subtitle: string }
  /** The phone confirmed an action (the deep check): a flash, then a ✓. */
  | { kind: "confirmed"; title: string }
  | {
      kind: "findings";
      cells: Array<{ name: string; caption: string; severity?: string }>;
      subtitle: string;
    };

/** The real time, refreshed every few seconds so the clock visibly moves. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** The iPhone passcode keypad: digits with their letters, 0 centred below. */
const KEYPAD: Array<[string, string]> = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["", ""],
  ["0", ""],
  ["", ""],
];
/** The keys "typed" on the drawn passcode screen, one after another. */
const TYPED = ["1", "4", "7", "2", "5", "0"];
/**
 * Plays someone typing the passcode: each step presses the next key and
 * fills one more dot; after the sixth, a short rest and it starts again.
 * Still under reduced motion or Pause.
 */
function useTyping(active: boolean) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!active || reduce) return;
    const id = setInterval(() => setStep((value) => (value + 1) % 10), 650);
    return () => clearInterval(id);
  }, [active]);
  return step;
}

/** While the phone is unknown, show an iPhone and an Android phone in turn. */
function useAlternating(active: boolean) {
  const [shown, setShown] = useState<"ios" | "android">("ios");
  useEffect(() => {
    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!active || reduce) return;
    const id = setInterval(
      () => setShown((value) => (value === "ios" ? "android" : "ios")),
      6000,
    );
    return () => clearInterval(id);
  }, [active]);
  return shown;
}

const HEX_R = 62;
const HEX_W = HEX_R * Math.sqrt(3);
const HEX_CELLS: Array<[number, number]> = [];
for (let row = -1; row < 9; row++)
  for (let col = -1; col < 4; col++)
    HEX_CELLS.push([col * HEX_W + ((row & 1) * HEX_W) / 2, row * HEX_R * 1.5]);
/** Where the signs light up (at most three, the most severe first), read
 *  from top to bottom; a single one sits in the middle. */
const FINDING_SPOTS: Array<Array<[number, number]>> = [
  [],
  [[140, 300]],
  [
    [110, 220],
    [170, 390],
  ],
  [
    [80, 150],
    [140, 300],
    [200, 470],
  ],
];
const hexPoints = (x: number, y: number, r: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
const nearest = ([tx, ty]: [number, number]) =>
  HEX_CELLS.reduce(
    (best, c) =>
      (c[0] - tx) ** 2 + (c[1] - ty) ** 2 <
      (best[0] - tx) ** 2 + (best[1] - ty) ** 2
        ? c
        : best,
    HEX_CELLS[0],
  );
/** Two short lines for a finding name inside a cell. */
function split(name: string): [string, string] {
  const words = name.split(" ");
  if (words.length < 2) return [name, ""];
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

function Honeycomb({
  cells,
}: Readonly<{
  cells?: Array<{ name: string; caption: string; severity?: string }>;
}>) {
  const shown = (cells ?? []).slice(0, FINDING_SPOTS.length - 1);
  const spots = FINDING_SPOTS[shown.length];
  const lit = shown.map((cell, i) => ({ ...cell, at: nearest(spots[i]) }));
  return (
    <svg className="phone-hex" viewBox="0 0 280 600" aria-hidden="true">
      {HEX_CELLS.map(([x, y]) => (
        <polygon key={`${x}-${y}`} points={hexPoints(x, y, HEX_R - 2)} />
      ))}
      {lit.map(({ at: [x, y], name, caption, severity }) => {
        const [first, second] = split(name);
        return (
          // Each cell in its severity's colour; the glows blend together.
          <g
            key={name + x}
            className={`phone-hex-lit sev-${severity ?? "critical"}`}
          >
            <circle cx={x} cy={y} r={HEX_R * 2.6} className="glow" />
            <polygon points={hexPoints(x, y, HEX_R - 2)} className="cell" />
            <text x={x} y={second ? y - 6 : y + 2}>
              {first}
            </text>
            {second && (
              <text x={x} y={y + 7}>
                {second}
              </text>
            )}
            <text x={x} y={y + 22} className="caption">
              {caption}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Data blocks of the copy: start offset (em), delay (s) and size. */
const TRANSFER: Array<[number, number, number]> = [
  [-3.4, 0, 0.9],
  [1.8, 0.22, 0.7],
  [-0.9, 0.45, 1.05],
  [3.1, 0.67, 0.75],
  [-2.3, 0.9, 0.65],
  [0.5, 1.12, 0.95],
  [-3.8, 1.35, 0.7],
  [2.4, 1.57, 1],
  [-1.5, 1.8, 0.75],
  [3.7, 2.02, 0.65],
  [-0.2, 2.25, 0.85],
  [1.2, 2.47, 0.65],
  [-2.8, 2.7, 0.8],
  [2.9, 2.92, 0.9],
  [-1.1, 3.15, 0.7],
  [0.9, 3.37, 0.8],
];

/**
 * The phone itself, used on every screen of the scan: real time on its status
 * bar and lock screen, and on its screen what is happening (the detected phone,
 * the Trust sheet, the passcode, data leaving it through the cable while it
 * is copied, the analysis, the result). Beside it only a quiet value.
 */
export function PhoneStage({
  language,
  screen,
  note,
  attention = false,
  paused = false,
  platform = "ios",
  cable,
  checks,
  facts,
  press = false,
  network = false,
}: Readonly<{
  language: Language;
  screen: PhoneScreen;
  note?: { value: string; caption: string };
  attention?: boolean;
  paused?: boolean;
  /**
   * Draws an iPhone or an Android phone, each with its own system look.
   * "auto" alternates between both while the phone is still unknown.
   */
  platform?: "ios" | "android" | "auto";
  /** The USB cable: waiting to be plugged, plugged, or carrying the copy. */
  cable?: "none" | "waiting" | "plugged" | "flow" | "unplugged";
  /**
   * Marks the buttons to press together (volume up, volume down and side)
   * to start a sysdiagnose on an iPhone.
   */
  press?: boolean;
  /** The phone's connections are observed (or chosen to be): quiet waves
   *  leave the top of the phone. */
  network?: boolean;
  /** What to check, shown quietly beside the phone when something failed. */
  checks?: { title: string; items: string[] };
  /** Live facts beside the phone: the identified device, progress, rules. */
  facts?: {
    device?: "ios" | "android";
    title?: string;
    detail?: string;
    items: Array<{ value: string; label: string }>;
  };
}>) {
  // The notes beside the phone slide when a line comes or goes.
  const glide = useGlide<HTMLSpanElement>("dl");
  const [waved, setWaved] = useState(network);
  if (network && !waved) setWaved(true);
  const guess = useAlternating(platform === "auto");
  const typing = useTyping(screen.kind === "passcode" && !paused);
  const android =
    platform === "auto" ? guess === "android" : platform === "android";
  const wire =
    cable ??
    (screen.kind === "problem"
      ? screen.reason === "unplugged"
        ? "unplugged"
        : "plugged"
      : screen.kind === "lock" || screen.kind === "guide"
        ? "waiting"
        : screen.kind === "copy"
          ? "flow"
          : [
                "device",
                "trust",
                "usb-debug",
                "prompt",
                "passcode",
                "confirmed",
              ].includes(screen.kind)
            ? "plugged"
            : "none");
  const now = useNow();
  // Lock-screen style: hours and minutes only, no AM/PM, so it always fits.
  const parts = new Intl.DateTimeFormat(language, {
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(now);
  const time = parts
    .filter((part) => part.type !== "dayPeriod")
    .map((part) => part.value)
    .join("")
    .trim();
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const date = now.toLocaleDateString(language, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  // iPhone: one thin line under the date. Android: stacked hours and minutes.
  const big = (subtitle?: string) =>
    android ? (
      <div className="phone-clock android">
        <small>{subtitle ?? date}</small>
        <b>
          <span>{hour.padStart(2, "0")}</span>
          <span>{minute}</span>
        </b>
      </div>
    ) : (
      <div className="phone-clock">
        <b>{time}</b>
        <small>{subtitle ?? date}</small>
      </div>
    );
  const home = (
    <div
      className={`phone-home ${android ? "android" : "ios"}`}
      aria-hidden="true"
    >
      <div className="grid">
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      {android ? (
        <span className="search" />
      ) : (
        <div className="dock">
          {Array.from({ length: 4 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      )}
    </div>
  );
  const small = (subtitle?: string) => (
    <div className="phone-clock small">
      <b>{time}</b>
      <small>{subtitle ?? date}</small>
    </div>
  );
  let content: ReactNode;
  switch (screen.kind) {
    case "lock":
      content = screen.steps ? (
        <>
          {small(screen.subtitle)}
          <div className="phone-steps">
            <b>{screen.steps.title}</b>
            <ol>
              {(android ? screen.steps.android : screen.steps.ios).map(
                (step) => (
                  <li key={step}>{step}</li>
                ),
              )}
            </ol>
          </div>
        </>
      ) : (
        big(screen.subtitle)
      );
      break;
    case "device":
      content = (
        <>
          {home}
          {/* Text only: the device's icon is already beside the phone. */}
          <div className="phone-banner">
            <span>
              <b>{screen.name}</b>
              <small>{screen.detail ?? screen.status}</small>
            </span>
          </div>
        </>
      );
      break;
    case "trust":
      content = (
        <>
          {home}
          <span className="phone-scrim" />
          <div className="phone-sheet">
            <b>{screen.title}</b>
            <div>
              <span>{screen.no}</span>
              <span className="yes">{screen.yes}</span>
            </div>
          </div>
        </>
      );
      break;
    case "guide":
      content = android ? (
        <div className="phone-settings">
          <div className="bar">
            <ChevronLeft size={18} aria-hidden="true" />
          </div>
          <b className="title">{screen.dev.title}</b>
          <div className="row main">
            <span>{screen.dev.main}</span>
            <i className="switch on" />
          </div>
          <small className="section">{screen.dev.section}</small>
          <div className="row focus">
            <span>
              {screen.dev.usb}
              <small>{screen.dev.hint}</small>
            </span>
            <i className="switch on" />
          </div>
          <div className="row dim">
            <span />
            <i className="switch" />
          </div>
          <div className="row dim">
            <span />
            <i className="switch" />
          </div>
        </div>
      ) : (
        <>
          {home}
          <span className="phone-scrim" />
          <div className="phone-alert">
            <b>{screen.trust.title}</b>
            <small>{screen.trust.body}</small>
            <div>
              <span className="yes">{screen.trust.yes}</span>
              <span>{screen.trust.no}</span>
            </div>
          </div>
        </>
      );
      break;
    case "usb-debug":
      content = (
        <>
          {home}
          <span className="phone-scrim" />
          <div className="phone-dialog">
            <b>{screen.title}</b>
            <small>{screen.body}</small>
            <code>3F:9A:21:…:C4:7E</code>
            <span className="check">
              <i />
              {screen.always}
            </span>
            <div>
              <span>{screen.cancel}</span>
              <span className="yes">{screen.allow}</span>
            </div>
          </div>
        </>
      );
      break;
    case "problem": {
      const Icon =
        screen.reason === "unplugged"
          ? Unplug
          : screen.reason === "locked"
            ? Lock
            : screen.reason === "trust"
              ? ShieldX
              : CircleAlert;
      content = (
        <>
          {small()}
          <div className={`phone-problem is-${screen.reason}`}>
            <span className="badge">
              <Icon size={30} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <b>{screen.title}</b>
            <small>{screen.detail}</small>
          </div>
        </>
      );
      break;
    }
    case "prompt":
      content = (
        <div className="phone-sheet single">
          <b>{screen.text}</b>
        </div>
      );
      break;
    case "passcode": {
      const typed = Math.min(typing, TYPED.length);
      const pressed = typing >= 1 && typing <= 6 ? TYPED[typing - 1] : "";
      content = (
        <div className="phone-passcode">
          <b>{screen.title}</b>
          <span className="dots" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} className={i < typed ? "filled" : ""} />
            ))}
          </span>
          <span className="keys" aria-hidden="true">
            {KEYPAD.map(([digit, letters], i) =>
              digit ? (
                <i key={digit} className={digit === pressed ? "pressed" : ""}>
                  {digit}
                  <small>{letters}</small>
                </i>
              ) : (
                <span key={"gap" + i} />
              ),
            )}
          </span>
        </div>
      );
      break;
    }
    case "copy":
      // A transfer, not a scan: data blocks leave through the port and
      // continue down the cable. The percentage is beside the phone, the
      // same on iPhone and Android, not drawn on its screen.
      content = (
        <>
          {big(screen.subtitle)}
          <span className="phone-transfer" aria-hidden="true">
            {TRANSFER.map(([x, delay, size], i) => (
              <i
                key={i /* NOSONAR: fixed decorative particles */}
                style={
                  {
                    "--x": `${x}em`,
                    "--s": size,
                    animationDelay: `${delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        </>
      );
      break;
    case "analyze":
      content = (
        <>
          <Honeycomb />
          <div className="phone-caption">{screen.subtitle}</div>
        </>
      );
      break;
    case "clean":
      content = (
        <>
          <span className="phone-clean" />
          <div className="phone-result">
            <span className="mark">
              <Check size={40} strokeWidth={3} aria-hidden="true" />
            </span>
            <b>{screen.title}</b>
            <small>{screen.detail}</small>
          </div>
        </>
      );
      break;
    case "confirmed":
      content = (
        <>
          <span className="phone-flash" aria-hidden="true" />
          <div className="phone-result phone-confirmed">
            <span className="mark">
              <Check size={40} strokeWidth={3} aria-hidden="true" />
            </span>
            <b>{screen.title}</b>
          </div>
        </>
      );
      break;
    case "findings":
      content = (
        <>
          <Honeycomb cells={screen.cells} />
          <div className="phone-caption top">{screen.subtitle}</div>
        </>
      );
      break;
  }
  return (
    <div
      className={`constellation phone-stage is-${screen.kind} ${android ? "is-android" : "is-ios"} ${platform === "auto" ? "is-guessing" : ""} ${attention ? "attention" : ""} ${paused ? "motion-paused" : ""} ${press && !android ? "is-pressing" : ""}`}
    >
      <div className="phone-wrap">
        <div className="phone">
          {press && !android && (
            <span className="phone-keys" aria-hidden="true">
              <i className="key up">
                <b>+</b>
              </i>
              <i className="key down">
                <b>−</b>
              </i>
              <i className="key side">
                <b>
                  <Power size={11} strokeWidth={3} />
                </b>
              </i>
            </span>
          )}
          <div className="phone-screen">
            <div className="phone-bar">
              <span>{time}</span>
              <span
                className={android ? "punch" : "island"}
                aria-hidden="true"
              />
              <span className="phone-status" aria-hidden="true">
                <Signal size={13} strokeWidth={2.4} />
                <Wifi size={13} strokeWidth={2.4} />
                <BatteryFull size={16} strokeWidth={2} />
              </span>
            </div>
            {/* In the app a new screen fades in, as the phone's own
                screens do; the website keeps its own pace. */}
            <div
              className="phone-content"
              key={`${android ? "android" : "ios"}${
                document.documentElement.dataset.shell === "app"
                  ? "-" + screen.kind
                  : ""
              }`}
            >
              {content}
            </div>
          </div>
        </div>
        {/* Once shown, the waves stay so they can fade out when the
            network is no longer observed. */}
        {waved && (
          <span
            className={`phone-waves ${network ? "" : "is-off"}`}
            aria-hidden="true"
            onAnimationEnd={(event) => {
              if (event.animationName === "waves-out") setWaved(false);
            }}
          >
            <i />
            <i />
            <i />
          </span>
        )}
        {wire !== "none" && (
          <span className={`phone-cable ${wire}`} aria-hidden="true">
            <i className="plug" />
            <i className="wire" />
          </span>
        )}
        {/* Wider than the phone on purpose; runs the full height of the screen. */}
        {screen.kind === "analyze" && (
          <span className="phone-beam sweep" aria-hidden="true" />
        )}
        {checks && (
          <span className="phone-aside phone-checks">
            <b>{checks.title}</b>
            <ul>
              {checks.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </span>
        )}
        {!checks && facts && (
          <span className="phone-aside phone-facts" ref={glide}>
            {facts.device && (
              <DeviceIcon device={facts.device} size={30} tint tight />
            )}
            {facts.title && <b>{facts.title}</b>}
            {facts.detail && <small>{facts.detail}</small>}
            {facts.items.length > 0 && (
              <dl>
                {facts.items.map((item) => (
                  <div key={item.label}>
                    <dd>{item.value}</dd>
                    <dt>{item.label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </span>
        )}
        {!checks && !facts && screen.kind === "guide" && (
          <span className="phone-aside" key={android ? "a" : "i"}>
            <DeviceIcon
              device={android ? "android" : "ios"}
              size={34}
              tint
              tight
            />
            <b>{android ? "Android" : "iPhone"}</b>
            <small>{android ? screen.aside.android : screen.aside.ios}</small>
          </span>
        )}
        {note && !facts && !checks && (
          <span className="phone-note">
            <b>{note.value}</b>
            {note.caption}
          </span>
        )}
      </div>
    </div>
  );
}
