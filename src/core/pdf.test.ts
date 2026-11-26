import { expect, it } from "vitest";
import { buildPdf, pdfText } from "./pdf";
import { dictionaries } from "../shared/i18n/i18n";
import type { ScanReport } from "./report";

it("paginates long reports and preserves coverage, provenance and the final finding", async () => {
  const report: ScanReport = {
    schemaVersion: 1,
    device: "android",
    startedAt: "2026-10-25T10:00:00Z",
    finishedAt: "2026-10-25T10:01:00Z",
    artifactsAnalyzed: 1,
    networkConnections: 0,
    ruleBundleVersion: "synthetic",
    cleanup: "partial",
    engines: [{ name: "Synthetic engine", version: "1" }],
    limitations: ["SYNTHETIC COVERAGE LIMIT"],
    checks: [
      {
        id: "test",
        name: "Test module",
        status: "completed",
        detail: "Synthetic fixture only",
      },
    ],
    findings: Array.from({ length: 60 }, (_, i) => ({
      id: `fixture-${i}`,
      category: "Synthetic indicator",
      source: "https://example.invalid/source",
      evidence: "Synthetic evidence ".repeat(40),
      severity: "medium",
      confidence: "low",
      timestamp: null,
      rule: "synthetic-rule",
      ruleVersion: "1",
      limitations: ["This is test data"],
      recommendation: "Review test fixture",
    })),
  };
  const pdf = await buildPdf(report, dictionaries.en, "SYNTHETIC ORIGIN");
  const output = pdf.output();
  const font = pdf.getFont().metadata as unknown as {
    cmap: { unicode: { codeMap: Record<number, number> } };
  };
  const encoded = (text: string) =>
    Array.from(text, (c) =>
      font.cmap.unicode.codeMap[c.codePointAt(0)!]
        .toString(16)
        .padStart(4, "0"),
    ).join("");
  expect(output.startsWith("%PDF-")).toBe(true);
  expect(pdf.getNumberOfPages()).toBeGreaterThan(10);
  for (const text of [
    "SYNTHETIC ORIGIN",
    "SYNTHETIC COVERAGE LIMIT",
    "#60",
    "example.invalid/source",
  ])
    expect(output).toContain(encoded(text));
  expect(output).toContain(
    encoded(`${pdf.getNumberOfPages()} / ${pdf.getNumberOfPages()}`),
  );
});

it("preserves European, Greek and Cyrillic text and exposes unsupported or hidden code points", () => {
  expect(
    pdfText("España · français · ação · Prüfung · più · Ελληνικά · Русский"),
  ).toBe("España · français · ação · Prüfung · più · Ελληνικά · Русский");
  expect(pdfText("文件 😀\u202Ehidden\u0000\nline")).toBe(
    "[U+6587][U+4EF6] [U+1F600][U+202E]hidden[U+0000]\nline",
  );
});
