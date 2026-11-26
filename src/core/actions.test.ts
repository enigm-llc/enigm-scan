import { expect, it } from "vitest";
import { actionsFor } from "./actions";
import { buildPdf } from "./pdf";
import { dictionaries } from "../shared/i18n/i18n";
import { actionCopy, actionsTitle } from "../shared/i18n/actions";
import type { ScanReport } from "./report";

type Finding = ScanReport["findings"][number];
const finding = (rule: string, category: string, evidence = "x"): Finding => ({
  id: rule,
  category,
  source: "https://example.invalid",
  evidence,
  severity: "high",
  confidence: "medium",
  timestamp: null,
  rule,
  ruleVersion: "1",
  limitations: [],
  recommendation: "",
});

it("recommends nothing when nothing was found", () => {
  expect(actionsFor([])).toEqual([]);
});

it("keeps the phone for an expert when spyware is detected", () => {
  expect(
    actionsFor([
      finding("mvt.a1", "known_domain_indicator", "SMS: x.example — Pegasus"),
      finding("enigm.heuristic.suspicious_link", "suspicious_link"),
      finding(
        "enigm.heuristic.android_surveillance_capabilities",
        "android_surveillance_capabilities",
      ),
    ]),
  ).toEqual(["preserve", "otherDevice", "expertHelp", "links", "scanAgain"]);
});

it("puts safety first for stalkerware and Apple's notice before anything else", () => {
  expect(
    actionsFor([
      finding(
        "mvt.b2",
        "known_appid_indicator",
        "installed app com.spy — mSpy (stalkerware)",
      ),
    ])[0],
  ).toBe("stalkerwareSafety");
  expect(
    actionsFor([
      finding("apple.threat_notification", "apple_threat_notification"),
    ]).slice(0, 2),
  ).toEqual(["appleNotice", "preserve"]);
});

it("lets the person fix review points themselves when nothing was detected", () => {
  expect(
    actionsFor([
      finding(
        "enigm.heuristic.ios_configuration_profile",
        "ios_configuration_profile",
      ),
      finding("enigm.heuristic.ios_jailbreak", "ios_system_integrity"),
      finding("watchware.c3", "known_monitoring_app"),
    ]),
  ).toEqual(["modifiedSystem", "interception", "apps", "scanAgain"]);
});

it("adds the steps to the PDF only when something was found", async () => {
  const report = (findings: Finding[]): ScanReport => ({
    schemaVersion: 1,
    device: "ios",
    startedAt: "2026-11-26T10:00:00Z",
    finishedAt: "2026-11-26T10:20:00Z",
    artifactsAnalyzed: 100,
    networkConnections: 0,
    ruleBundleVersion: "1",
    cleanup: "completed",
    engines: [],
    limitations: [],
    checks: [{ id: "x", name: "x", status: "completed", detail: "x" }],
    findings,
  });
  const encoded = (pdf: Awaited<ReturnType<typeof buildPdf>>, text: string) => {
    const font = pdf.getFont().metadata as unknown as {
      cmap: { unicode: { codeMap: Record<number, number> } };
    };
    return Array.from(text, (c) =>
      font.cmap.unicode.codeMap[c.codePointAt(0)!]
        .toString(16)
        .padStart(4, "0"),
    ).join("");
  };
  const clean = await buildPdf(report([]), dictionaries.es, "x", "es");
  expect(clean.output()).not.toContain(encoded(clean, actionsTitle.es));
  const found = await buildPdf(
    report([
      finding("mvt.a1", "known_domain_indicator", "SMS: x.example — Pegasus"),
    ]),
    dictionaries.es,
    "x",
    "es",
  );
  expect(found.output()).toContain(encoded(found, actionsTitle.es));
  expect(found.output()).toContain(encoded(found, "accessnow.org/help"));
  // Every step exists in every language.
  for (const copy of Object.values(actionCopy))
    for (const text of Object.values(copy))
      expect(text.length).toBeGreaterThan(20);
});
