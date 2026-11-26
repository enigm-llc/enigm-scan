import { z } from "zod";
import { native } from "./agent";
// The site forbids eval (CSP script-src 'self'): skip zod's eval probe and JIT.
z.config({ jitless: true });
export const MAX_REPORT_BYTES = 5 * 1024 * 1024;
const text = z
  .string()
  .min(1)
  .max(2000)
  .refine((s) => s.trim().length > 0)
  .refine((s) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s));
const id = z.string().regex(/^[a-zA-Z0-9_.:-]{1,100}$/);
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const timestamp = z.iso.datetime({ offset: true });
const findingSchema = z.strictObject({
  id,
  category: text,
  source: text,
  evidence: text,
  severity: z.enum(["informational", "low", "medium", "high", "critical"]),
  confidence: z.enum(["low", "medium", "high"]),
  timestamp: timestamp.nullable(),
  rule: id,
  ruleVersion: text,
  limitations: z.array(text).min(1).max(30),
  recommendation: text,
});
export const reportSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    startedAt: timestamp,
    finishedAt: timestamp,
    device: z.enum(["ios", "android"]),
    artifactsAnalyzed: count,
    networkConnections: count,
    checks: z
      .array(
        z.strictObject({
          id,
          name: text,
          status: z.enum(["completed", "skipped", "unsupported", "failed"]),
          detail: text,
        }),
      )
      .max(300),
    findings: z.array(findingSchema).max(500),
    limitations: z.array(text).min(1).max(100),
    engines: z.array(z.strictObject({ name: text, version: text })).max(30),
    ruleBundleVersion: text,
    cleanup: z.enum(["not_started", "partial", "completed"]),
  })
  .superRefine((report, ctx) => {
    const problem = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (Date.parse(report.finishedAt) < Date.parse(report.startedAt))
      problem("Invalid interval");
    if (new Set(report.checks.map((c) => c.id)).size !== report.checks.length)
      problem("Duplicate check");
    if (
      new Set(report.findings.map((f) => f.id)).size !== report.findings.length
    )
      problem("Duplicate finding");
    if (
      !report.checks.some((c) => c.status === "completed") &&
      (report.artifactsAnalyzed ||
        report.networkConnections ||
        report.findings.length)
    )
      problem("Counts require completed checks");
  });
export type ScanReport = z.infer<typeof reportSchema>;
export function parseReport(input: string): ScanReport {
  if (new TextEncoder().encode(input).byteLength > MAX_REPORT_BYTES)
    throw Error("Report exceeds limit");
  return reportSchema.parse(JSON.parse(input));
}
/**
 * Download name with the scan's local date and time written together
 * (enigm-scan-report-202611252154.pdf), so each report keeps its own file
 * instead of replacing or renaming the previous one.
 */
export function reportFileName(
  report: Pick<ScanReport, "finishedAt" | "startedAt">,
  extension: "pdf",
) {
  const parsed = new Date(report.finishedAt || report.startedAt);
  const when = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const two = (value: number) => String(value).padStart(2, "0");
  const stamp =
    String(when.getFullYear()) +
    two(when.getMonth() + 1) +
    two(when.getDate()) +
    two(when.getHours()) +
    two(when.getMinutes());
  return `enigm-scan-report-${stamp}.${extension}`;
}
