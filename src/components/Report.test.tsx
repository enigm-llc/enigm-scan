// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Report } from "./Report";
import { dictionaries } from "../shared/i18n/i18n";
import { reportCopy } from "../shared/i18n/report";
import { isReviewPoint } from "../core/findings";
import type { ScanReport } from "../core/report";

afterEach(cleanup);

const finding = (
  rule: string,
  category: string,
  evidence: string,
): ScanReport["findings"][number] => ({
  id: `id.${rule}`,
  category,
  source: "https://example.invalid",
  evidence,
  severity: "medium",
  confidence: rule.includes("heuristic") ? "low" : "medium",
  timestamp: null,
  rule,
  ruleVersion: "1",
  limitations: [],
  recommendation: "Review it.",
});
const report = (findings: ReturnType<typeof finding>[]) =>
  ({
    schemaVersion: 1,
    device: "android",
    startedAt: "2026-11-24T10:00:00Z",
    finishedAt: "2026-11-24T10:05:00Z",
    artifactsAnalyzed: 120,
    networkConnections: 8,
    ruleBundleVersion: "2026112501",
    cleanup: "completed",
    engines: [],
    checks: [{ id: "mvt", name: "mvt", status: "completed", detail: "" }],
    findings,
    limitations: [],
  }) as unknown as ScanReport;

it("classifies heuristics, including reports from older app versions", () => {
  expect(isReviewPoint(finding("mvt.heuristic.abc", "MVT x", ""))).toBe(true);
  expect(isReviewPoint(finding("enigm.heuristic.proxy", "x", ""))).toBe(true);
  expect(
    isReviewPoint(finding("mvt.0123456789abcdef01234567", "MVT x", "")),
  ).toBe(true);
  expect(
    isReviewPoint(
      finding("mvt.9a1b2c3d-0000-4000-a000-000000000000", "known", ""),
    ),
  ).toBe(false);
});

it("does not present review points as detections", () => {
  render(
    <Report
      report={report([
        finding(
          "mvt.heuristic.0123456789abcdef01234567",
          "MVT battery_daily",
          "Package downgraded",
        ),
        finding(
          "enigm.heuristic.sideloaded",
          "android_sideloaded_apps",
          "1 app(s) not installed from a known app store: com.example.tool",
        ),
      ])}
      t={dictionaries.en}
      language="en"
    />,
  );
  // No signed indicator matched: the verdict is clean, with the points listed apart.
  expect(
    screen.getByRole("heading", { level: 2, name: "No known spyware" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Points to review" }),
  ).toBeTruthy();
  expect(screen.getAllByText("To review")).toHaveLength(2);
  expect(screen.getByText("Apps installed outside an app store")).toBeTruthy();
});

it("keeps signed-indicator matches as detections", () => {
  render(
    <Report
      report={report([
        finding(
          "mvt.9a1b2c3d-0000-4000-a000-000000000000",
          "known_appid_indicator",
          "installed app com.spy.app",
        ),
      ])}
      t={dictionaries.en}
      language="en"
    />,
  );
  expect(screen.getByText("Known surveillance app")).toBeTruthy();
  expect(
    screen.queryByRole("heading", { name: "Points to review" }),
  ).toBeNull();
});

it("offers the next phone next to the PDF in every language, and no promotion", () => {
  for (const [language, t] of Object.entries(dictionaries)) {
    const r = reportCopy[language as keyof typeof reportCopy];
    expect(r.scanAnother.length).toBeGreaterThan(3);
    const { unmount } = render(
      <Report
        report={report([])}
        language={language as keyof typeof reportCopy}
        t={t}
        onScanAnother={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: r.scanAnother })).toBeTruthy();
    // Deleting the report is what closing the app does; no separate button.
    expect(screen.getAllByRole("button").length).toBeLessThanOrEqual(3);
    expect(document.querySelector(".enigm-offer, .promo")).toBeNull();
    unmount();
  }
  // An imported file belongs to no app session: nothing to clear there.
  render(<Report report={report([])} t={dictionaries.en} />);
  expect(
    screen.queryByRole("button", { name: "Scan another phone" }),
  ).toBeNull();
});
