// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import DesktopApp from "./DesktopApp";
import { native } from "../core/agent";
import { flowCopy } from "../shared/i18n/flow";
import { reportCopy } from "../shared/i18n/report";
import { productCopy } from "../shared/i18n/product";

vi.mock("../core/agent", () => ({ native: vi.fn(), isDesktop: () => true }));

const f = flowCopy.en;
const r = reportCopy.en;
const p = productCopy.en;
const caps = {
  rules: 759,
  ruleVersion: 2026102501,
  iosUsb: true,
  androidUsb: true,
  mvtIos: true,
  mvtAndroid: true,
};
const finishedReport = (cleanup: "completed" | "partial" = "completed") => ({
  schemaVersion: 1,
  device: "android",
  startedAt: "2026-10-25T10:00:00Z",
  finishedAt: "2026-10-25T10:01:00Z",
  artifactsAnalyzed: 0,
  networkConnections: 0,
  ruleBundleVersion: "test",
  cleanup,
  engines: [],
  checks: [],
  findings: [],
  limitations: ["Synthetic fixture, no phone scanned"],
});

/** The app's native side: optionally one finished report, or a running scan. */
function nativeApp(
  options: { report?: "completed" | "partial" | null; phase?: string } = {},
) {
  const state = {
    report:
      options.report === undefined
        ? finishedReport()
        : options.report
          ? finishedReport(options.report)
          : null,
    phase: options.phase ?? "",
    calls: [] as Array<[string, unknown]>,
    failFinish: false,
  };
  vi.mocked(native).mockImplementation(async (command, args) => {
    state.calls.push([command, args]);
    if (command === "capabilities") return caps;
    if (command === "scan_status")
      return state.report
        ? {
            phase: "completed",
            artifacts: 0,
            error: null,
            report: state.report,
          }
        : { phase: state.phase, artifacts: 0, error: null, report: null };
    if (command === "finish_scan") {
      if (state.failFinish) throw Error("state_unavailable");
      state.report = null;
    }
    return null;
  });
  const called = (command: string) =>
    state.calls.some(([name]) => name === command);
  return { state, called };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  Object.defineProperty(navigator, "language", {
    configurable: true,
    value: "en",
  });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  window.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.useRealTimers();
});

it("has no page chrome: no header, logo, language or theme controls, no footer", async () => {
  const app = nativeApp();
  render(<DesktopApp />);
  await screen.findByRole("button", { name: "Download PDF" });
  expect(document.querySelector("header, footer")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
  expect(document.querySelector(".locale-control")).toBeNull();
  // The native menu bar follows the interface's language.
  expect(app.state.calls).toContainEqual([
    "set_menu_language",
    { language: "en" },
  ]);
});

it("opens on the welcome screen and starts the scan from its one button", async () => {
  const app = nativeApp({ report: null });
  render(<DesktopApp />);
  const start = await screen.findByRole("button", { name: f.welcomeAction });
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    f.welcomeTitle,
  );
  expect(screen.queryByRole("button", { name: "Find my phone" })).toBeNull();
  // Nothing reaches a phone before the owner starts.
  expect(app.called("list_devices")).toBe(false);
  expect(app.called("refresh_devices")).toBe(false);
  fireEvent.click(start);
  expect(
    await screen.findByRole("button", { name: "Find my phone" }),
  ).toBeTruthy();
  expect(screen.queryByRole("button", { name: f.welcomeAction })).toBeNull();
});

it("skips the welcome screen while a scan is still running", async () => {
  nativeApp({ report: null, phase: "acquiring" });
  render(<DesktopApp />);
  await waitFor(() =>
    expect(document.querySelector(".scan-main")).toBeTruthy(),
  );
  expect(screen.queryByRole("button", { name: f.welcomeAction })).toBeNull();
});

it("offers the next phone from the report, and no separate delete button", async () => {
  const app = nativeApp();
  render(<DesktopApp />);
  await screen.findByRole("button", { name: "Download PDF" });
  expect(screen.queryByRole("button", { name: /Delete report/i })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: r.scanAnother }));
  expect(
    await screen.findByRole("button", { name: "Find my phone" }),
  ).toBeTruthy();
  expect(app.called("finish_scan")).toBe(true);
  expect(app.called("close_application")).toBe(false);
});

it("closing deletes the session at once, then shows the Enigm invitation", async () => {
  const app = nativeApp();
  render(<DesktopApp />);
  await screen.findByRole("button", { name: "Download PDF" });
  act(() => window.__enigmCloseRequested?.());
  const dialog = await screen.findByRole("dialog");
  // Nothing to confirm: the report and the copy are already gone.
  expect(app.called("finish_scan")).toBe(true);
  expect(screen.queryByRole("button", { name: "Download PDF" })).toBeNull();
  expect(dialog.textContent).toContain(p.offerTitle);
  // Only the invitation: no other text or buttons than closing and trying Enigm.
  expect(screen.getAllByRole("button")).toHaveLength(2);
  expect(app.called("close_application")).toBe(false);
  // Trying Enigm opens it in the browser, then the app quits.
  fireEvent.click(screen.getByRole("button", { name: p.offerAction }));
  await waitFor(() =>
    expect(app.state.calls).toContainEqual([
      "open_link",
      { url: "https://app.enigm.io" },
    ]),
  );
  await waitFor(() => expect(app.called("close_application")).toBe(true));
});

it("the invitation's close button quits", async () => {
  const app = nativeApp();
  render(<DesktopApp />);
  await screen.findByRole("button", { name: "Download PDF" });
  act(() => window.__enigmCloseRequested?.());
  await screen.findByRole("dialog");
  fireEvent.click(screen.getByRole("button", { name: f.closeNow }));
  await waitFor(() => expect(app.called("close_application")).toBe(true));
  expect(app.called("open_link")).toBe(false);
});

it("closing the window again while the invitation shows quits", async () => {
  const app = nativeApp({ report: null });
  render(<DesktopApp />);
  fireEvent.click(await screen.findByRole("button", { name: f.welcomeAction }));
  await screen.findByRole("button", { name: "Find my phone" });
  act(() => window.__enigmCloseRequested?.());
  await screen.findByRole("dialog");
  act(() => window.__enigmCloseRequested?.());
  await waitFor(() => expect(app.called("close_application")).toBe(true));
});

it("stops a scan in progress when the app closes", async () => {
  const app = nativeApp({ report: null, phase: "acquiring" });
  render(<DesktopApp />);
  act(() => window.__enigmCloseRequested?.());
  await screen.findByRole("dialog");
  expect(app.called("cancel_scan")).toBe(true);
});

it("quits with Ctrl+Q like the macOS menu", async () => {
  const app = nativeApp({ report: null });
  render(<DesktopApp />);
  fireEvent.click(await screen.findByRole("button", { name: f.welcomeAction }));
  await screen.findByRole("button", { name: "Find my phone" });
  fireEvent.keyDown(document, { key: "q", ctrlKey: true });
  await screen.findByRole("dialog");
  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => expect(app.called("close_application")).toBe(true));
});

it("behaves like an app: links leave the window, no page menu, no reload", async () => {
  const app = nativeApp();
  render(<DesktopApp />);
  await screen.findByRole("button", { name: "Download PDF" });
  const link = document.createElement("a");
  link.href = "https://scan.enigm.io/how-it-works";
  document.body.appendChild(link);
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  link.dispatchEvent(click);
  expect(click.defaultPrevented).toBe(true);
  await waitFor(() => expect(app.called("open_link")).toBe(true));
  const menu = new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
  });
  document.body.dispatchEvent(menu);
  expect(menu.defaultPrevented).toBe(true);
  const reload = new KeyboardEvent("keydown", {
    key: "r",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(reload);
  expect(reload.defaultPrevented).toBe(true);
  link.remove();
});
