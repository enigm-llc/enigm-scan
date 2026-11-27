// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ScanProgress } from "./ScanProgress";
import { agentDictionaries } from "../shared/i18n/agent";
import { dictionaries } from "../shared/i18n/i18n";
import { flowCopy } from "../shared/i18n/flow";
import { native } from "../core/agent";

vi.mock("../core/agent", () => ({ native: vi.fn(async () => null) }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const f = flowCopy.en;
const waiting = (sysdiagnose?: "generating" | "ready") => ({
  phase: "deep_wait",
  artifacts: 0,
  error: null,
  report: null,
  acquisition: {
    phase: "deep_wait",
    kept: 0,
    discarded: 0,
    receivedBytes: 0,
    storedBytes: 0,
    ...(sysdiagnose ? { sysdiagnose } : {}),
  },
});
const view = (status: ReturnType<typeof waiting>) => (
  <ScanProgress
    a={agentDictionaries.en}
    t={dictionaries.en}
    encrypted={false}
    network={false}
    ios
    onCancel={vi.fn()}
    status={status}
  />
);

it("after Trust, asks for the deep check with the buttons marked and a time limit", () => {
  render(view(waiting()));
  expect(screen.getByRole("status").textContent).toBe(f.deepWaitTitle);
  expect(screen.getByRole("alert").textContent).toBe(f.deepWaitHint);
  expect(document.querySelectorAll(".phone-keys .key")).toHaveLength(3);
  expect(document.querySelector(".scan-wait")?.textContent).toMatch(/5:00/);
  // Still the first step: the copy has not started.
  expect(document.querySelector('[aria-current="step"]')?.textContent).toBe(
    "Connect",
  );
});

it("can continue without it", () => {
  render(view(waiting()));
  const skip = screen.getByRole("button", { name: f.deepSkip });
  fireEvent.click(skip);
  expect(native).toHaveBeenCalledWith("skip_deep_check");
  expect((skip as HTMLButtonElement).disabled).toBe(true);
});

it("confirms it on the phone with a flash and a check, then the copy starts", () => {
  const { rerender } = render(view(waiting()));
  rerender(view(waiting("generating")));
  expect(document.querySelector(".phase-copy")?.textContent).toBe(
    f.deepConfirmedTitle,
  );
  expect(screen.getByText(f.deepConfirmedHint)).toBeTruthy();
  expect(document.querySelector(".phone-flash")).toBeTruthy();
  expect(document.querySelector(".phone-confirmed")).toBeTruthy();
  expect(document.querySelector(".phone-keys")).toBeNull();
  expect(screen.queryByRole("button", { name: f.deepSkip })).toBeNull();
});
