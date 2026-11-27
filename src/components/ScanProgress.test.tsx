// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { ScanProgress } from "./ScanProgress";
import { agentDictionaries } from "../shared/i18n/agent";
import { dictionaries } from "../shared/i18n/i18n";
import { needsComputer } from "./MobileStart";
import { flowCopy } from "../shared/i18n/flow";
/** Every line the progress card shows over one full round (5 s each). */
const cardRound = () => {
  const seen = new Set<string>();
  for (let step = 0; step < 8; step++) {
    seen.add(document.querySelector(".progress-card-line")?.textContent ?? "");
    act(() => vi.advanceTimersByTime(5000));
  }
  return [...seen];
};
afterEach(() => {
  document.documentElement.lang = "";
  cleanup();
  vi.restoreAllMocks();
});
it("uses only the reported phase/count; pausing animation does not stop cancellation or invent completion", () => {
  const onCancel = vi.fn();
  const props = {
    a: agentDictionaries.en,
    t: dictionaries.en,
    encrypted: false,
    network: false,
    onCancel,
  };
  const { rerender } = render(
    <ScanProgress
      {...props}
      status={{ phase: "analyzing", artifacts: 7, error: null, report: null }}
    />,
  );
  expect(screen.getByRole("status").textContent).toBe("Looking for spyware");
  // Four plain steps: the engine phase belongs to "Analyze".
  expect(document.querySelector('[aria-current="step"]')?.textContent).toBe(
    "Analyze",
  );
  expect(screen.queryByText("Analysis complete")).toBeNull();
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.queryByText("Checking connections")).toBeNull();
  expect(screen.getByText("7")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  expect(document.querySelector(".motion-paused")).toBeTruthy();
  rerender(
    <ScanProgress
      {...props}
      status={{ phase: "forensics", artifacts: 12, error: null, report: null }}
    />,
  );
  // One title for the whole analysis, on iPhone and Android alike.
  expect(screen.getByRole("status").textContent).toBe("Looking for spyware");
  expect(document.querySelector(".progress-card-line")?.textContent).toBe(
    flowCopy.en.cardForensics,
  );
  expect(screen.getByText("12")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalledOnce();
});
it("recognizes Android and desktop-mode iPad without treating a normal Mac as mobile", () => {
  const ua = vi.spyOn(navigator, "userAgent", "get");
  ua.mockReturnValue("Mozilla/5.0 Android 15");
  expect(needsComputer()).toBe(true);
  ua.mockReturnValue("Mozilla/5.0 Macintosh");
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: 5,
  });
  expect(needsComputer()).toBe(true);
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: 0,
  });
  expect(needsComputer()).toBe(false);
});
it("asks for the iPhone passcode only while an iPhone copy is being acquired", () => {
  const props = {
    a: agentDictionaries.es,
    t: dictionaries.es,
    encrypted: false,
    network: false,
    onCancel: vi.fn(),
  };
  const hint = agentDictionaries.es.noteCodeMaybe;
  const { rerender } = render(
    <ScanProgress
      {...props}
      ios
      status={{ phase: "acquiring", artifacts: 0, error: null, report: null }}
    />,
  );
  expect(screen.getByText(hint)).toBeTruthy();
  rerender(
    <ScanProgress
      {...props}
      ios
      status={{ phase: "analyzing", artifacts: 0, error: null, report: null }}
    />,
  );
  expect(screen.queryByText(hint)).toBeNull();
  rerender(
    <ScanProgress
      {...props}
      status={{ phase: "acquiring", artifacts: 0, error: null, report: null }}
    />,
  );
  expect(screen.queryByText(hint)).toBeNull();
});
it("turns the phone's own Trust and passcode prompts into explicit instructions", () => {
  const a = agentDictionaries.es;
  const props = {
    a,
    t: dictionaries.es,
    encrypted: false,
    network: false,
    ios: true,
    onCancel: vi.fn(),
  };
  const { rerender } = render(
    <ScanProgress
      {...props}
      status={{
        phase: "awaiting_passcode",
        artifacts: 0,
        error: null,
        report: null,
      }}
    />,
  );
  expect(screen.getByRole("status").textContent).toBe(a.awaiting_passcode);
  expect(screen.getByRole("alert").textContent).toBe(a.passcodeNow);
  rerender(
    <ScanProgress
      {...props}
      status={{
        phase: "awaiting_trust",
        artifacts: 0,
        error: null,
        report: null,
      }}
    />,
  );
  expect(screen.getByRole("status").textContent).toBe(a.awaiting_trust);
  expect(screen.getByRole("alert").textContent).toBe(a.trustNow);
  // A labelled waiting time, three minutes, never shown as progress.
  expect(screen.getByText(a.waitLeft.replace("{t}", "3:00"))).toBeTruthy();
  expect(screen.queryByRole("progressbar")).toBeNull();
  // An unanswered passcode prompt: the copy restarts and says why.
  rerender(
    <ScanProgress
      {...props}
      status={{
        phase: "passcode_retry",
        artifacts: 0,
        error: null,
        report: null,
      }}
    />,
  );
  expect(screen.getByRole("status").textContent).toBe(a.passcode_retry);
  expect(screen.getByRole("alert").textContent).toBe(a.passcodeRetryNow);
  // Prompt phases are not listed as steps unless they are happening.
  rerender(
    <ScanProgress
      {...props}
      status={{ phase: "acquiring", artifacts: 0, error: null, report: null }}
    />,
  );
  expect(screen.queryByText(a.awaiting_trust)).toBeNull();
  expect(screen.queryByText(a.awaiting_passcode)).toBeNull();
});
/** The figures beside the phone, as "value label" pairs. */
const facts = () =>
  [...document.querySelectorAll(".phone-facts dl > div")].map(
    (row) =>
      `${row.querySelector("dd")?.textContent} ${row.querySelector("dt")?.textContent}`,
  );
const copyStatus = (acquisition: object, phase = "acquiring") => ({
  phase,
  artifacts: 0,
  error: null,
  report: null,
  acquisition: {
    phase,
    kept: 0,
    discarded: 0,
    receivedBytes: 0,
    storedBytes: 0,
    ...acquisition,
  },
});
it("shows the same figures beside an iPhone and an Android phone, at most five", () => {
  document.documentElement.lang = "es";
  vi.useFakeTimers();
  try {
    const a = agentDictionaries.es;
    const f = flowCopy.es;
    const props = {
      a,
      t: dictionaries.es,
      encrypted: false,
      network: true,
      onCancel: vi.fn(),
    };
    const { rerender } = render(
      <ScanProgress
        {...props}
        ios
        status={copyStatus({
          percent: 93,
          storedBytes: 159e6,
          receivedBytes: 173e6,
          discarded: 16,
          capturing: true,
        })}
      />,
    );
    act(() => vi.advanceTimersByTime(60_000));
    let shown = facts();
    expect(shown.length).toBeLessThanOrEqual(5);
    expect(shown[0]).toBe(`93 % ${f.factPercent}`);
    expect(shown[1]).toMatch(new RegExp(`MB ${f.factCopied}$`));
    expect(shown[2]).toBe(`16 ${a.statDiscarded}`);
    expect(shown[3]).toBe(`50 % ${f.factObserved}`);
    expect(shown[4]).toMatch(new RegExp(`${f.factElapsed}$`));
    // Received bytes repeat the copied ones: not listed.
    expect(shown.some((line) => line.includes("recibidos"))).toBe(false);
    rerender(
      <ScanProgress
        {...props}
        ios={false}
        status={copyStatus({
          percent: 45,
          storedBytes: 120e6,
          apps: 182,
          connections: 37,
        })}
      />,
    );
    shown = facts();
    expect(shown.length).toBeLessThanOrEqual(5);
    expect(shown[0]).toBe(`45 % ${f.factPercent}`);
    expect(shown[2]).toBe(`182 ${f.factApps}`);
    expect(shown[3]).toBe(`37 ${f.factConnections}`);
    // Nothing that does not exist on Android, and no invented percentage.
    expect(shown.some((line) => line.includes(a.statDiscarded))).toBe(false);
    expect(shown.some((line) => line.includes(f.factObserved))).toBe(false);
  } finally {
    vi.useRealTimers();
  }
});
it("the card says the step being done now, on one line, on iPhone and Android", () => {
  document.documentElement.lang = "es";
  vi.useFakeTimers();
  try {
    const f = flowCopy.es;
    const props = {
      a: agentDictionaries.es,
      t: dictionaries.es,
      encrypted: false,
      network: true,
      onCancel: vi.fn(),
    };
    const card = () =>
      document.querySelector(".progress-card-line")?.textContent ?? "";
    const { rerender } = render(
      <ScanProgress
        {...props}
        ios
        status={copyStatus({ percent: 40, capturing: true })}
      />,
    );
    expect(card()).toBe(f.cardExtracting);
    // It does not rotate: the same step stays.
    act(() => vi.advanceTimersByTime(30_000));
    expect(card()).toBe(f.cardExtracting);
    // Out of the phone: said for a moment, then what it still waits for.
    rerender(
      <ScanProgress
        {...props}
        ios
        status={copyStatus({
          percent: 100,
          capturing: true,
          step: "extracted",
        })}
      />,
    );
    expect(card()).toBe(f.cardExtracted);
    act(() => vi.advanceTimersByTime(5000));
    expect(card()).toBe(f.cardObserving);
    rerender(
      <ScanProgress
        {...props}
        ios
        status={copyStatus({ percent: 100, step: "diagnostics" })}
      />,
    );
    expect(card()).toBe(f.cardDiagnostics);
    // Android: the same extraction, then its own steps.
    for (const [step, line] of [
      ["apps", f.cardApps],
      ["connections", f.cardConnections],
    ] as const) {
      rerender(
        <ScanProgress
          {...props}
          ios={false}
          status={copyStatus({ percent: 100, step })}
        />,
      );
      expect(card()).toBe(line);
    }
    // The analysis is the same on both.
    for (const [phase, line] of [
      ["analyzing", f.cardComparing],
      ["forensics", f.cardForensics],
      ["network", f.cardNetwork],
      ["finalizing", f.cardReport],
    ] as const) {
      rerender(
        <ScanProgress
          {...props}
          ios={false}
          status={{ phase, artifacts: 0, error: null, report: null }}
        />,
      );
      expect(card()).toBe(line);
    }
  } finally {
    vi.useRealTimers();
  }
});
it("shows the analysis figures: indicators, files, checks, connections and time", () => {
  document.documentElement.lang = "es";
  const f = flowCopy.es;
  render(
    <ScanProgress
      a={agentDictionaries.es}
      t={dictionaries.es}
      encrypted={false}
      network
      rules={11669}
      onCancel={vi.fn()}
      status={{
        phase: "finalizing",
        artifacts: 3482,
        checks: 18,
        connections: 214,
        error: null,
        report: null,
      }}
    />,
  );
  const shown = facts();
  expect(shown.length).toBe(5);
  expect(shown[0]).toBe(`11.669 ${f.factSigned}`);
  expect(shown[1]).toBe(`3482 ${f.factFiles}`);
  expect(shown[2]).toBe(`18 ${f.factChecks}`);
  expect(shown[3]).toBe(`214 ${f.factAnalyzed}`);
});
it("observes the network alongside the copy and says when the iPhone is no longer needed", () => {
  document.documentElement.lang = "es";
  vi.useFakeTimers();
  const a = agentDictionaries.es;
  const props = {
    a,
    t: dictionaries.es,
    encrypted: false,
    network: true,
    ios: true,
    onCancel: vi.fn(),
  };
  const status = (phase: string, acquisition: object) => ({
    phase,
    artifacts: 0,
    error: null,
    report: null,
    acquisition: {
      phase,
      kept: 0,
      discarded: 0,
      receivedBytes: 0,
      storedBytes: 0,
      capturing: true,
      ...acquisition,
    },
  });
  // The observation is a figure beside the phone, as a percentage of its
  // window; never a countdown in the card.
  const parallel = (_minutes: number) =>
    facts().some((line) => line.endsWith(flowCopy.es.factObserved));
  const { rerender } = render(
    <ScanProgress {...props} status={status("acquiring", {})} />,
  );
  // The copy has started: the phone's prompts are announced, the network is
  // observed in parallel and is not listed as an earlier, separate step.
  expect(screen.getByText(a.noteCodeMaybe)).toBeTruthy();
  expect(parallel(2)).toBe(true);
  expect(screen.queryByText(a.capturing)).toBeNull();
  expect(screen.queryByText(a.phoneKeep)).toBeNull();
  // The phone prompts for its passcode while the observation continues. A
  // second after the copy screen appeared, that screen stays a moment
  // first, so the two do not flash one after the other.
  rerender(
    <ScanProgress {...props} status={status("awaiting_passcode", {})} />,
  );
  expect(screen.queryByRole("alert")).toBeNull();
  act(() => vi.advanceTimersByTime(2500));
  expect(screen.getByRole("alert").textContent).toBe(a.passcodeNow);
  // Still the extract step: the passcode authorizes the copy.
  expect(document.querySelector('[aria-current="step"]')?.textContent).toBe(
    a.stepExtract,
  );
  act(() => vi.advanceTimersByTime(20_000));
  // While the phone asks for its passcode, the instructions replace the figures.
  expect(facts()).toEqual([]);
  // Data arrives: nothing else is needed from the iPhone, and the network
  // figure carries on from where it was.
  rerender(
    <ScanProgress
      {...props}
      status={status("acquiring", { kept: 3, receivedBytes: 4096 })}
    />,
  );
  expect(parallel(1)).toBe(true);
  expect(screen.getByText(a.phoneKeep)).toBeTruthy();
  expect(screen.queryByText(a.noteCodeMaybe)).toBeNull();
  // The observation window ends; the copy continues.
  rerender(
    <ScanProgress
      {...props}
      status={status("acquiring", {
        kept: 9,
        receivedBytes: 9e6,
        capturing: false,
      })}
    />,
  );
  expect(cardRound()).toEqual([flowCopy.es.cardExtracting]);
  expect(screen.getByText(a.phoneKeep)).toBeTruthy();
  vi.useRealTimers();
});
it("groups network observation under the copy step and names it as the phase", () => {
  const a = agentDictionaries.en;
  render(
    <ScanProgress
      a={a}
      t={dictionaries.en}
      encrypted={false}
      network
      ios
      onCancel={vi.fn()}
      status={{ phase: "capturing", artifacts: 0, error: null, report: null }}
    />,
  );
  expect(document.querySelector('[aria-current="step"]')?.textContent).toBe(
    a.stepExtract,
  );
  expect(screen.getByRole("status").textContent).toBe(a.capturing);
});
it("draws the real iPhone keypad and plays the passcode being typed", () => {
  vi.useFakeTimers();
  try {
    render(
      <ScanProgress
        a={agentDictionaries.en}
        t={dictionaries.en}
        encrypted={false}
        network={false}
        ios
        onCancel={vi.fn()}
        status={{
          phase: "awaiting_passcode",
          artifacts: 0,
          error: null,
          report: null,
        }}
      />,
    );
    const keys = [...document.querySelectorAll(".phone-passcode .keys i")];
    // 1 to 9 with their letters, and 0 centred on the last row.
    expect(keys.map((key) => key.firstChild?.textContent)).toEqual(
      "1234567890".split(""),
    );
    expect(keys[1].textContent).toBe("2ABC");
    const filled = () =>
      document.querySelectorAll(".phone-passcode .dots i.filled").length;
    expect(filled()).toBe(0);
    act(() => vi.advanceTimersByTime(650 * 3));
    expect(filled()).toBe(3);
    expect(document.querySelectorAll(".keys i.pressed")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(650 * 7));
    expect(filled()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
