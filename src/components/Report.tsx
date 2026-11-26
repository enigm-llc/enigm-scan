import { useEffect, useState } from "react";
import {
  ChevronDown,
  Download,
  LoaderCircle,
  FileSearch,
  ListChecks,
  Timer,
  RotateCcw,
} from "lucide-react";
import { toast } from "../desktop/toast";
import { flowCopy } from "../shared/i18n/flow";
import type { ScanReport } from "../core/report";
import { loadPdf, preloadPdf } from "../core/pdf-loader";
import type { Copy, Language } from "../shared/i18n/i18n";
import { productCopy } from "../shared/i18n/product";
import { reportCopy } from "../shared/i18n/report";
import { PhoneStage } from "./PhoneStage";
import { findingLabel } from "../shared/i18n/findings";
import { splitFindings } from "../core/findings";
import { evidenceText, nativeText } from "../shared/i18n/native";
import { DeviceIcon } from "./Brand";
import { Notice } from "./Notice";

/** Severities from most to least serious, with their report colours. */
export const SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;

/** A readable local date and time for report timestamps. */
function formatDate(value: string, language: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(language, { dateStyle: "long", timeStyle: "short" });
}
/** A short duration between two timestamps, in the page language. */
export function formatDuration(from: string, to: string, language: string) {
  const seconds = Math.max(0, (Date.parse(to) - Date.parse(from)) / 1000);
  const unit = (value: number, kind: "hour" | "minute" | "second") =>
    new Intl.NumberFormat(language, {
      style: "unit",
      unit: kind,
      unitDisplay: "short",
    }).format(value);
  if (seconds < 60) return unit(Math.round(seconds), "second");
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return unit(minutes, "minute");
  const rest = minutes % 60;
  return rest
    ? `${unit(Math.floor(minutes / 60), "hour")} ${unit(rest, "minute")}`
    : unit(minutes / 60, "hour");
}

export function Report({
  report,
  language = "en",
  t,
  originLabel,
  onScanAnother,
  finishing = false,
}: {
  report: ScanReport;
  language?: Language;
  t: Copy;
  /** Clear the session and search for the next phone (app reports only). */
  onScanAnother?: () => void;
  originLabel?: string;
  /** A clearing action is running. */
  finishing?: boolean;
}) {
  const c = productCopy[language];
  const r = reportCopy[language];
  const enough =
    report.checks.some((check) => check.status === "completed") &&
    (report.artifactsAnalyzed > 0 || report.networkConnections > 0);
  // Only a check that could not run is a gap; "skipped" means there was
  // nothing to examine (a module without data on this phone).
  const partial = report.checks.some((check) =>
    ["failed", "unsupported"].includes(check.status),
  );
  const [error, setError] = useState(false),
    [exporting, setExporting] = useState(false);
  useEffect(preloadPdf, []);
  async function exportPdf() {
    setError(false);
    setExporting(true);
    try {
      const { downloadPdf } = await loadPdf();
      if (await downloadPdf(report, t, originLabel, language))
        toast.success(flowCopy[language].pdfSaved);
    } catch {
      setError(true);
    } finally {
      setExporting(false);
    }
  }
  const completed = report.checks.filter((x) => x.status === "completed");
  // Only signed-indicator matches are detections; heuristics are review points.
  const { detections, reviews } = splitFindings(report.findings);
  const counts = SEVERITIES.map(
    (level) =>
      [level, detections.filter((f) => f.severity === level).length] as const,
  ).filter(([, n]) => n > 0);
  const total = detections.length;
  const verdict = total ? c.review : !enough ? c.insufficient : c.noSignals;
  const renderFinding = (
    f: ScanReport["findings"][number],
    i: number,
    review: boolean,
  ) => (
    <details
      className={review ? "finding is-review" : `finding sev-${f.severity}`}
      key={f.id}
    >
      <summary>
        <span className="finding-index">#{i + 1}</span>
        <div className="finding-head">
          <p className="finding-tags">
            {review ? (
              <span className="tag">{r.reviewTag}</span>
            ) : (
              <span className={`tag severity sev-${f.severity}`}>
                {t[f.severity]}
              </span>
            )}
            <span className="tag">
              {t.confidence}: {t[f.confidence]}
            </span>
          </p>
          <h3>{findingLabel(f.category, language)}</h3>
          <p className="finding-preview">
            {evidenceText(f.evidence, language)}
          </p>
        </div>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <dl>
        <dt>{t.recommendation}</dt>
        <dd>{nativeText(f.recommendation, language)}</dd>
        <dt>{t.evidence}</dt>
        <dd className="mono">{evidenceText(f.evidence, language)}</dd>
        <dt>{t.source}</dt>
        <dd>{f.source}</dd>
        <dt>{t.rules}</dt>
        <dd>
          {f.rule} ({f.ruleVersion})
        </dd>
        {f.timestamp && (
          <>
            <dt>{r.eventDate}</dt>
            <dd>{formatDate(f.timestamp, language)}</dd>
          </>
        )}
      </dl>
    </details>
  );
  return (
    <section className="report" aria-labelledby="report-title">
      <h1 id="report-title" className="visually-hidden">
        {t.results}
      </h1>
      <div className="result-summary verdict">
        <PhoneStage
          language={language}
          platform={report.device === "android" ? "android" : "ios"}
          cable="none"
          facts={{
            device: report.device,
            title: report.device === "ios" ? "iPhone" : "Android",
            detail: formatDate(report.startedAt, language),
            items: [
              ...counts.slice(0, 3).map(([level, n]) => ({
                value: n.toLocaleString(language),
                label: t[level],
              })),
              ...(total
                ? []
                : [
                    {
                      value: report.artifactsAnalyzed.toLocaleString(language),
                      label: t.artifacts,
                    },
                  ]),
              {
                value: formatDuration(
                  report.startedAt,
                  report.finishedAt,
                  language,
                ),
                label: r.duration,
              },
            ],
          }}
          screen={
            total
              ? {
                  kind: "findings",
                  subtitle: c.review,
                  // Short labels: the severity, and the indicator's number.
                  cells: detections.map((f, i) => ({
                    name: t[f.severity],
                    caption: `#${i + 1}`,
                  })),
                }
              : enough
                ? {
                    kind: "clean",
                    subtitle: t.results,
                    title: c.noSignals,
                    detail: `${report.artifactsAnalyzed.toLocaleString(language)} ${t.artifacts.toLowerCase()}`,
                  }
                : { kind: "lock", subtitle: c.insufficient }
          }
        />
        <div className="verdict-copy">
          <h2 className={total ? "is-findings" : enough ? "is-clean" : ""}>
            {verdict}
          </h2>
          <p>{total ? r.findingsLead : c.scopeHelp}</p>
          {partial && <p className="coverage-note">{c.partial}</p>}
          <dl className="verdict-stats">
            <div>
              <dd>{total.toLocaleString(language)}</dd>
              <dt>{t.findings}</dt>
            </div>
            <div>
              <dd>{report.artifactsAnalyzed.toLocaleString(language)}</dd>
              <dt>{t.artifacts}</dt>
            </div>
            {reviews.length > 0 && (
              <div>
                <dd>{reviews.length.toLocaleString(language)}</dd>
                <dt>{r.reviewTitle}</dt>
              </div>
            )}
            {report.networkConnections > 0 && (
              <div>
                <dd>{report.networkConnections.toLocaleString(language)}</dd>
                <dt>{t.network}</dt>
              </div>
            )}
          </dl>
          <div className="verdict-actions">
            <button
              className="primary"
              disabled={exporting}
              onClick={exportPdf}
            >
              {exporting ? (
                <LoaderCircle
                  size={18}
                  className="busy-icon"
                  aria-hidden="true"
                />
              ) : (
                <Download size={18} aria-hidden="true" />
              )}
              {t.pdf}
            </button>
            {onScanAnother && (
              <button disabled={finishing} onClick={onScanAnother}>
                <RotateCcw size={18} aria-hidden="true" />
                {r.scanAnother}
              </button>
            )}
          </div>
          {error && <Notice message={t.exportError} />}
        </div>
      </div>

      <section className="report-band" aria-labelledby="report-stats-title">
        <h2 id="report-stats-title">{r.statsTitle}</h2>
        <div className="report-tiles">
          <div className="report-tile wide">
            <span className="tile-label">{r.bySeverity}</span>
            {total ? (
              <>
                <div className="severity-bar" aria-hidden="true">
                  {counts.map(([level, n]) => (
                    <i
                      key={level}
                      className={`sev-${level}`}
                      style={{ flexGrow: n }}
                    />
                  ))}
                </div>
                <ul className="severity-legend">
                  {counts.map(([level, n]) => (
                    <li key={level}>
                      <span className={`sev-dot sev-${level}`} />
                      <b>{n.toLocaleString(language)}</b> {t[level]}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              // The same bar and legend as with findings: empty, all at 0.
              <>
                <div className="severity-bar is-empty" aria-hidden="true">
                  <i />
                </div>
                <ul className="severity-legend">
                  {SEVERITIES.map((level) => (
                    <li key={level}>
                      <span className={`sev-dot sev-${level}`} />
                      <b>{(0).toLocaleString(language)}</b> {t[level]}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="report-tile">
            <ListChecks size={18} aria-hidden="true" />
            <b>
              {completed.length}/{report.checks.length}
            </b>
            <span className="tile-label">{t.checks}</span>
          </div>
          <div className="report-tile">
            <FileSearch size={18} aria-hidden="true" />
            <b>{report.artifactsAnalyzed.toLocaleString(language)}</b>
            <span className="tile-label">{t.artifacts}</span>
          </div>
          <div className="report-tile">
            <Timer size={18} aria-hidden="true" />
            <b>
              {formatDuration(report.startedAt, report.finishedAt, language)}
            </b>
            <span className="tile-label">
              {formatDate(report.startedAt, language)}
            </span>
          </div>
          <div className="report-tile">
            <DeviceIcon device={report.device} size={18} tint tight />
            <b>{report.device === "ios" ? "iPhone" : "Android"}</b>
            <span className="tile-label">
              {t.ruleVersion}: {report.ruleBundleVersion}
            </span>
          </div>
        </div>
      </section>

      <section className="report-findings" aria-labelledby="findings-title">
        <h2 id="findings-title">{t.findings}</h2>
        {!total ? (
          <p className="report-lead">{r.noFindingsLead}</p>
        ) : (
          <div className="finding-list">
            {detections.map((f, i) => renderFinding(f, i, false))}
          </div>
        )}
      </section>
      {reviews.length > 0 && (
        <section className="report-findings" aria-labelledby="review-title">
          <h2 id="review-title">{r.reviewTitle}</h2>
          <div className="finding-list">
            {reviews.map((f, i) => renderFinding(f, i, true))}
          </div>
        </section>
      )}
    </section>
  );
}
