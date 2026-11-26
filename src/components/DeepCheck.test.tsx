// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { flowCopy } from "../shared/i18n/flow";
import { ScanProgress } from "./ScanProgress";
import { agentDictionaries } from "../shared/i18n/agent";
import { dictionaries } from "../shared/i18n/i18n";
import type { AcquisitionProgress } from "../core/agent";
afterEach(cleanup);

const a = agentDictionaries.es;
const copying = (extra: Partial<AcquisitionProgress> = {}) => ({
  phase: "acquiring",
  artifacts: 0,
  error: null,
  report: null,
  acquisition: {
    phase: "acquiring",
    percent: 40,
    kept: 10,
    discarded: 0,
    receivedBytes: 1000,
    storedBytes: 900,
    ...extra,
  },
});
const view = (ios: boolean, status: ReturnType<typeof copying>) =>
  render(
    <ScanProgress
      a={a}
      t={dictionaries.es}
      encrypted={false}
      network={false}
      ios={ios}
      diagnostics
      onCancel={() => {}}
      status={status}
    />,
  );

it("does not repeat the steps during the copy: they were shown before starting", () => {
  view(true, copying());
  expect(screen.queryByText(a.deepTitle)).toBeNull();
  expect(screen.queryByText(a.deepHold)).toBeNull();
  expect(document.querySelector(".phone-keys")).toBeNull();
});

it("says in the progress card when the phone prepares and finishes it", () => {
  vi.useFakeTimers();
  try {
    const lines = () => {
      const seen = new Set<string>();
      for (let step = 0; step < 8; step++) {
        seen.add(
          document.querySelector(".progress-card-line")?.textContent ?? "",
        );
        act(() => vi.advanceTimersByTime(5000));
      }
      return [...seen];
    };
    document.documentElement.lang = "es";
    const { rerender } = view(true, copying({ sysdiagnose: "generating" }));
    expect(lines()).toContain(flowCopy.es.cardDeepPreparing);
    rerender(
      <ScanProgress
        a={a}
        t={dictionaries.es}
        encrypted={false}
        network={false}
        ios
        diagnostics
        onCancel={() => {}}
        status={copying({ sysdiagnose: "ready" })}
      />,
    );
    expect(lines()).toContain(flowCopy.es.cardDeepReady);
    expect(document.querySelector(".phone-keys")).toBeNull();
  } finally {
    document.documentElement.lang = "";
    vi.useRealTimers();
  }
});

it("is never shown on Android", () => {
  view(false, copying({ sysdiagnose: "generating" }));
  expect(screen.queryByText(a.deepTitle)).toBeNull();
  expect(document.querySelector(".phone-keys")).toBeNull();
});

it("is not shown when the deep check was not chosen", () => {
  render(
    <ScanProgress
      a={a}
      t={dictionaries.es}
      encrypted={false}
      network={false}
      ios
      onCancel={() => {}}
      status={copying({ sysdiagnose: "generating" })}
    />,
  );
  expect(screen.queryByText(a.deepTitle)).toBeNull();
  expect(document.querySelector(".phone-keys")).toBeNull();
});
