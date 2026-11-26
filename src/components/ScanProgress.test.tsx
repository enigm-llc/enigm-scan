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
it("shows the phone's own copy progress, what it is doing and an estimate", () => {
  document.documentElement.lang = "es";
  vi.useFakeTimers();
  const a = agentDictionaries.es;
  const f = flowCopy.es;
  const props = {
    a,
    t: dictionaries.es,
    encrypted: false,
    network: false,
    ios: true,
    onCancel: vi.fn(),
  };
  const status = (acquisition: object) => ({
    phase: "acquiring",
    artifacts: 0,
    error: null,
    report: null,
    acquisition: {
      phase: "acquiring",
      kept: 100,
      discarded: 0,
      receivedBytes: 2e9,
      storedBytes: 2e9,
      ...acquisition,
    },
  });
  const { rerender } = render(
    <ScanProgress {...props} status={status({ percent: 10 })} />,
  );
  // No bar under the title, the same as on Android: the figures are in the card.
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByText(a.actCopy)).toBeTruthy();
  let lines = cardRound();
  expect(lines).toContain(f.cardCopying);
  expect(lines.some((line) => line.startsWith("10 %"))).toBe(true);
  // Photos are being received and dropped: the card says so.
  rerender(
    <ScanProgress
      {...props}
      status={status({ percent: 20, discarded: 5000, receivedBytes: 9e9 })}
    />,
  );
  lines = cardRound();
  expect(lines).toContain(f.cardSkipping);
  expect(lines.some((line) => line.endsWith(a.statDiscarded))).toBe(true);
  // After a minute at 20 %, an estimate of the time left appears.
  act(() => vi.advanceTimersByTime(30_000));
  expect(screen.getByTitle(a.estimateNote).textContent).toMatch(
    /^Tiempo restante estimado: /,
  );
  // A long silence from the phone is explained, not hidden.
  act(() => vi.advanceTimersByTime(91_000));
  expect(cardRound()).toContain(f.cardWaiting);
  vi.useRealTimers();
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
  // The observation is one more line of the progress card, as on Android:
  // a plain phrase, without a countdown.
  const parallel = (_minutes: number) =>
    cardRound().includes(flowCopy.es.cardObserving);
  const { rerender } = render(
    <ScanProgress {...props} status={status("acquiring", {})} />,
  );
  // The copy has started: the phone's prompts are announced, the network is
  // observed in parallel and is not listed as an earlier, separate step.
  expect(screen.getByText(a.noteCodeMaybe)).toBeTruthy();
  expect(parallel(2)).toBe(true);
  expect(screen.queryByText(a.capturing)).toBeNull();
  expect(screen.queryByText(a.phoneKeep)).toBeNull();
  // The phone prompts for its passcode while the observation continues.
  rerender(
    <ScanProgress {...props} status={status("awaiting_passcode", {})} />,
  );
  expect(screen.getByRole("alert").textContent).toBe(a.passcodeNow);
  act(() => vi.advanceTimersByTime(20_000));
  expect(parallel(1)).toBe(true);
  // Data arrives: nothing else is needed from the iPhone.
  rerender(
    <ScanProgress
      {...props}
      status={status("acquiring", { kept: 3, receivedBytes: 4096 })}
    />,
  );
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
  expect(cardRound().some((line) => line.startsWith("Observando la red"))).toBe(
    false,
  );
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
it("the progress card says what is being done in real numbers, then how long it has taken", () => {
  vi.useFakeTimers();
  try {
    const a = agentDictionaries.en;
    render(
      <ScanProgress
        a={a}
        t={dictionaries.en}
        encrypted={false}
        network={false}
        onCancel={vi.fn()}
        status={{
          phase: "acquiring",
          artifacts: 0,
          error: null,
          report: null,
          acquisition: {
            phase: "acquiring",
            percent: 40,
            kept: 10,
            discarded: 0,
            receivedBytes: 2e9,
            storedBytes: 1e9,
          },
        }}
      />,
    );
    const line = () =>
      document.querySelector(".progress-card-line")?.textContent ?? "";
    const seen = new Set<string>();
    for (let second = 0; second < 30; second++) {
      seen.add(line());
      act(() => vi.advanceTimersByTime(1000));
    }
    // Real figures from the phone's own report, one at a time…
    expect([...seen].some((text) => text.startsWith("40 %"))).toBe(true);
    expect([...seen].some((text) => /GB/.test(text))).toBe(true);
    // …and, once per round, the elapsed time.
    expect([...seen]).toContain(a.elapsed.replace("{t}", a.lessThanMinute));
  } finally {
    vi.useRealTimers();
  }
});
it("shows the deep check during an iPhone copy only when it was chosen", () => {
  vi.useFakeTimers();
  const status = {
    phase: "acquiring",
    artifacts: 0,
    error: null,
    report: null,
    acquisition: {
      phase: "acquiring",
      kept: 3,
      discarded: 0,
      receivedBytes: 1000,
      storedBytes: 1000,
    },
  };
  const props = {
    a: agentDictionaries.en,
    t: dictionaries.en,
    encrypted: false,
    network: false,
    ios: true,
    onCancel: vi.fn(),
    status,
  };
  const generating = {
    ...status,
    acquisition: {
      ...status.acquisition,
      sysdiagnose: "generating" as const,
    },
  };
  const { rerender } = render(
    <ScanProgress {...props} status={generating} diagnostics={false} />,
  );
  try {
    expect(cardRound()).not.toContain(flowCopy.en.cardDeepPreparing);
    rerender(<ScanProgress {...props} status={generating} diagnostics />);
    // No separate box: the card says it, among its other lines.
    expect(document.querySelector(".deep-check")).toBeNull();
    expect(cardRound()).toContain(flowCopy.en.cardDeepPreparing);
    // Nothing about it on the drawn phone during the copy.
    expect(document.querySelector(".phone-badge")).toBeNull();
  } finally {
    vi.useRealTimers();
  }
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
