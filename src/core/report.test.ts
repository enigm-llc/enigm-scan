import { describe, expect, it } from "vitest";
import { MAX_REPORT_BYTES, parseReport, reportFileName } from "./report";
import { dictionaries, resolveLanguage } from "../shared/i18n/i18n";
const fixture = () => ({
  schemaVersion: 1,
  startedAt: "2026-10-25T10:00:00Z",
  finishedAt: "2026-10-25T10:01:00Z",
  device: "android",
  artifactsAnalyzed: 2,
  networkConnections: 0,
  checks: [
    {
      id: "fixture",
      name: "Synthetic test only",
      status: "completed",
      detail: "Synthetic test, no device scanned",
    },
  ],
  findings: [],
  limitations: ["Synthetic test fixture"],
  engines: [{ name: "fixture", version: "1" }],
  ruleBundleVersion: "fixture-only",
  cleanup: "not_started",
});
describe("untrusted report boundary", () => {
  it("accepts supported reports without modifying evidence", () =>
    expect(parseReport(JSON.stringify(fixture())).artifactsAnalyzed).toBe(2));
  it("preserves leading/trailing whitespace in evidence text while rejecting empty records", () => {
    const f = fixture();
    f.checks[0].detail = "  original evidence\t\n";
    expect(parseReport(JSON.stringify(f)).checks[0].detail).toBe(
      f.checks[0].detail,
    );
    f.checks[0].detail = "  \n";
    expect(() => parseReport(JSON.stringify(f))).toThrow();
  });
  it("rejects oversized files before parsing", () =>
    expect(() => parseReport(" ".repeat(MAX_REPORT_BYTES + 1))).toThrow());
  it("rejects invalid JSON", () => expect(() => parseReport("{")).toThrow());
  it("rejects unknown schema versions", () =>
    expect(() =>
      parseReport(JSON.stringify({ ...fixture(), schemaVersion: 2 })),
    ).toThrow());
  it("rejects unexpected properties including prototype keys", () =>
    expect(() =>
      parseReport('{"__proto__":{},' + JSON.stringify(fixture()).slice(1)),
    ).toThrow());
  it("rejects negative, fractional and unsafe counts", () => {
    for (const n of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1])
      expect(() =>
        parseReport(JSON.stringify({ ...fixture(), artifactsAnalyzed: n })),
      ).toThrow();
  });
  it("rejects evidence counts when all checks are incomplete", () =>
    expect(() =>
      parseReport(JSON.stringify({ ...fixture(), checks: [] })),
    ).toThrow());
  it("rejects duplicate checks", () => {
    const f = fixture();
    f.checks.push(f.checks[0]);
    expect(() => parseReport(JSON.stringify(f))).toThrow();
  });
  it("rejects inverted timestamps", () =>
    expect(() =>
      parseReport(
        JSON.stringify({ ...fixture(), finishedAt: "2026-10-24T00:00:00Z" }),
      ),
    ).toThrow());
  it("requires coverage limitations", () =>
    expect(() =>
      parseReport(JSON.stringify({ ...fixture(), limitations: [] })),
    ).toThrow());
  it("requires finding provenance and a recommendation", () =>
    expect(() =>
      parseReport(
        JSON.stringify({
          ...fixture(),
          findings: [{ id: "fake", severity: "critical" }],
        }),
      ),
    ).toThrow());
  it("bounds record counts", () =>
    expect(() =>
      parseReport(
        JSON.stringify({
          ...fixture(),
          checks: Array(301).fill(fixture().checks[0]),
        }),
      ),
    ).toThrow());
});
describe("Command-compatible locale conventions", () => {
  it("supports six complete dictionaries", () => {
    expect(Object.keys(dictionaries)).toHaveLength(6);
    for (const d of Object.values(dictionaries)) {
      expect(Object.keys(d).sort()).toEqual(
        Object.keys(dictionaries.en).sort(),
      );
      expect(
        Object.values(d).every((v) => typeof v === "string" && v.length > 0),
      ).toBe(true);
    }
  });
  it("normalizes locales and legacy aliases with English fallback", () => {
    expect(resolveLanguage("es-ES")).toBe("es");
    expect(resolveLanguage("GE")).toBe("de");
    expect(resolveLanguage("PR")).toBe("pt");
    expect(resolveLanguage("ja")).toBe("en");
    expect(resolveLanguage("__proto__")).toBe("en");
  });
});

it("names each downloaded report with its local date and time together", () => {
  const report = {
    startedAt: "2026-11-25T20:40:00",
    finishedAt: "2026-11-25T21:54:30",
  };
  expect(reportFileName(report, "pdf")).toBe(
    "enigm-scan-report-202611252154.pdf",
  );
  // Another scan the next morning gets another name.
  expect(
    reportFileName({ ...report, finishedAt: "2026-11-26T09:05:00" }, "pdf"),
  ).toBe("enigm-scan-report-202611260905.pdf");
});
