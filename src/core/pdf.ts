import { native } from "./agent";
import { reportFileName, type ScanReport } from "./report";
import type { Copy, Language } from "../shared/i18n/i18n";
import { reportLogo, reportLogoLight } from "./report-brand";
import { reportFont, fontRanges } from "./report-font";
import { reportCopy } from "../shared/i18n/report";
import { productCopy } from "../shared/i18n/product";
import { findingLabel } from "../shared/i18n/findings";
import { splitFindings } from "./findings";
import { actionsFor } from "./actions";
import { actionCopy, actionsLead, actionsTitle } from "../shared/i18n/actions";
import {
  checkDetail,
  checkName,
  evidenceText,
  nativeText,
} from "../shared/i18n/native";
import { ENIGM_QR, ENIGM_URL } from "./enigm-qr";

/** Keep unsupported and invisible evidence explicit rather than dropping glyphs. */
export function pdfText(value: string): string {
  return Array.from(value, (character) => {
    const code = character.codePointAt(0)!;
    if (character === "\n") return character;
    const visible = code >= 32 && !/[\p{Cc}\p{Cf}]/u.test(character);
    if (
      visible &&
      code <= 0xffff &&
      fontRanges.some(([start, end]) => code >= start && code <= end)
    )
      return character;
    return `[U+${code.toString(16).toUpperCase().padStart(4, "0")}]`;
  }).join("");
}
// The same public PDF engine used by Command, loaded on demand (see pdf-loader).
export const loadJsPdf = () => import("jspdf");

type Rgb = [number, number, number];
const INK: Rgb = [7, 7, 7];
const TONE: Rgb = [92, 92, 92];
const SOFT: Rgb = [244, 244, 245];
const LINE: Rgb = [226, 226, 226];
const RED: Rgb = [251, 71, 71];
const GREEN: Rgb = [18, 122, 61];
/** Severity colours, as on the web report (Command's red for critical). */
const SEVERITY: Record<string, Rgb> = {
  critical: RED,
  high: [242, 113, 28],
  medium: [224, 155, 19],
  low: [201, 169, 12],
  informational: [138, 138, 138],
};
const STATUS: Record<string, Rgb> = {
  completed: GREEN,
  skipped: [160, 160, 160],
  unsupported: [224, 155, 19],
  failed: RED,
};
const LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

function when(value: string, language: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(language, { dateStyle: "long", timeStyle: "short" });
}
function span(from: string, to: string, language: string) {
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

/**
 * A designed, multi-page report: an executive summary with key figures and
 * charts, every sign as a card coloured by severity, the checks performed,
 * coverage and limitations, and the Enigm close. Generated locally.
 */
export async function buildPdf(
  report: ScanReport,
  t: Copy,
  originLabel = t.imported,
  language: Language = "en",
) {
  const { jsPDF } = await loadJsPdf();
  const r = reportCopy[language] ?? reportCopy.en;
  const p = productCopy[language] ?? productCopy.en;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  pdf.addFileToVFS("Roboto.ttf", reportFont);
  pdf.addFont("Roboto.ttf", "Roboto", "normal");
  pdf.setFont("Roboto", "normal");
  const W = 595.28,
    H = 841.89,
    M = 44,
    CW = W - M * 2,
    BOTTOM = H - 56;
  let y = 0;

  const color = (c: Rgb) => pdf.setTextColor(c[0], c[1], c[2]);
  const fill = (c: Rgb) => pdf.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: Rgb) => pdf.setDrawColor(c[0], c[1], c[2]);
  /** Roboto ships in one weight: titles are drawn filled and stroked. */
  const text = (
    value: string,
    x: number,
    at: number,
    size: number,
    tint: Rgb = INK,
    options: { bold?: boolean; align?: "left" | "right" | "center" } = {},
  ) => {
    pdf.setFontSize(size);
    color(tint);
    if (options.bold) {
      stroke(tint);
      pdf.setLineWidth(size * 0.035);
    }
    pdf.text(pdfText(value), x, at, {
      align: options.align ?? "left",
      renderingMode: options.bold ? "fillThenStroke" : "fill",
    });
  };
  const lines = (value: string, size: number, width: number): string[] => {
    pdf.setFontSize(size);
    return pdf.splitTextToSize(pdfText(value), width);
  };
  const newPage = () => {
    pdf.addPage();
    y = M + 10;
  };
  const ensure = (height: number) => {
    if (y + height > BOTTOM) newPage();
  };
  const paragraph = (
    value: string,
    size = 10,
    tint: Rgb = TONE,
    width = CW,
    x = M,
  ) => {
    for (const line of lines(value, size, width)) {
      ensure(size * 1.5);
      text(line, x, y, size, tint);
      y += size * 1.5;
    }
  };
  /** A heading never ends a page: it moves on with room for what follows. */
  const heading = (value: string, keep = 70) => {
    ensure(64 + keep);
    // Clear space above a heading, except where it opens a page.
    y += y <= M + 12 ? 10 : 28;
    text(value, M, y, 15, INK, { bold: true });
    y += 10;
    stroke(LINE);
    pdf.setLineWidth(0.6);
    pdf.line(M, y, M + CW, y);
    y += 20;
  };
  const pill = (
    label: string,
    x: number,
    at: number,
    tint: Rgb,
    solid = true,
  ) => {
    pdf.setFontSize(8);
    const w = pdf.getTextWidth(pdfText(label)) + 14;
    if (solid) {
      fill(tint);
      pdf.roundedRect(x, at - 9, w, 13, 6.5, 6.5, "F");
      text(label, x + 7, at, 8, [255, 255, 255], { bold: true });
    } else {
      stroke(LINE);
      pdf.setLineWidth(0.6);
      pdf.roundedRect(x, at - 9, w, 13, 6.5, 6.5, "S");
      text(label, x + 7, at, 8, TONE);
    }
    return w;
  };

  // ---- Page 1: the result, the key figures and the executive summary ----
  // Only signed-indicator matches are detections; heuristics are review points.
  const { detections, reviews } = splitFindings(report.findings);
  const total = detections.length;
  const completed = report.checks.filter((c) => c.status === "completed");
  const enough =
    completed.length > 0 &&
    (report.artifactsAnalyzed > 0 || report.networkConnections > 0);
  const device = report.device === "ios" ? "iPhone" : "Android";
  pdf.addImage(reportLogo, "PNG", M, 40, 96, 28.6);
  text(r.reportTitle, M + CW, 52, 9, TONE, { align: "right" });
  text(when(report.finishedAt, language), M + CW, 65, 9, TONE, {
    align: "right",
  });
  y = 112;
  text(r.resultLabel.toUpperCase(), M, y, 8, TONE);
  y += 26;
  const verdict = total ? p.review : !enough ? p.insufficient : p.noSignals;
  const verdictTint: Rgb = total ? RED : enough ? GREEN : TONE;
  fill(verdictTint);
  pdf.rect(M, y - 20, 4, 26, "F");
  text(verdict, M + 14, y, 24, INK, { bold: true });
  y += 22;
  paragraph(originLabel, 9.5, TONE);
  if (total) paragraph(t.warning, 9.5, TONE);
  y += 10;

  // Key figures.
  const figures: Array<[string, string]> = [
    [total.toLocaleString(language), t.findings],
    [report.artifactsAnalyzed.toLocaleString(language), t.artifacts],
    [`${completed.length}/${report.checks.length}`, r.checksTitle],
    [span(report.startedAt, report.finishedAt, language), r.duration],
  ];
  const gap = 10,
    tile = (CW - gap * 3) / 4;
  figures.forEach(([value, label], i) => {
    const x = M + i * (tile + gap);
    fill(SOFT);
    pdf.roundedRect(x, y, tile, 64, 10, 10, "F");
    text(value, x + 14, y + 30, 18, i === 0 && total ? RED : INK, {
      bold: true,
    });
    lines(label, 8.5, tile - 24)
      .slice(0, 2)
      .forEach((line, n) => text(line, x + 14, y + 46 + n * 10, 8.5, TONE));
  });
  y += 88;

  // Executive summary.
  heading(r.execTitle);
  const count = (level: string) =>
    detections.filter((f) => f.severity === level).length;
  const breakdown = LEVELS.filter((level) => count(level) > 0)
    .map((level) => `${count(level)} ${t[level].toLowerCase()}`)
    .join(", ");
  const plural = new Intl.PluralRules(language);
  const counts: Record<string, number> = {
    files: report.artifactsAnalyzed,
    checks: completed.length,
    findings: total,
    reviews: reviews.length,
  };
  // "{key}" is the number; "{key|one|other}" picks the form that agrees with it.
  const withCounts = (template: string) =>
    template
      .replace(/\{(\w+)\|([^|{}]*)\|([^|{}]*)\}/g, (_, key, one, other) =>
        plural.select(counts[key] ?? 0) === "one" ? one : other,
      )
      .replace(/\{(files|checks|findings|reviews)\}/g, (_, key) =>
        counts[key].toLocaleString(language),
      );
  const summary = withCounts(
    (total ? r.execFindings : enough ? r.execClean : r.execInsufficient)
      .replace("{device}", device)
      .replace("{date}", when(report.startedAt, language))
      .replace("{breakdown}", breakdown),
  );
  paragraph(
    reviews.length ? `${summary} ${withCounts(r.execReview)}` : summary,
    10.5,
    INK,
  );
  y += 12;

  // What to do, in order, from what was found. Absent when nothing was.
  const steps = actionsFor(report.findings);
  if (steps.length) {
    heading(actionsTitle[language] ?? actionsTitle.en);
    paragraph(actionsLead[language] ?? actionsLead.en, 10, TONE);
    y += 6;
    steps.forEach((step, i) => {
      const rows = lines(
        actionCopy[step][language] ?? actionCopy[step].en,
        10,
        CW - 30,
      );
      ensure(rows.length * 14.5 + 8);
      fill(SOFT);
      pdf.circle(M + 9, y - 3.5, 9, "F");
      text(String(i + 1), M + 9, y, 9, INK, { bold: true, align: "center" });
      rows.forEach((row, n) => text(row, M + 30, y + n * 14.5, 10, INK));
      y += rows.length * 14.5 + 10;
    });
    y += 6;
  }

  // Charts: signs by severity, and checks by status.
  const half = (CW - 24) / 2;
  ensure(150);
  const chartTop = y;
  text(r.bySeverity, M, y, 10, INK, { bold: true });
  y += 18;
  const most = Math.max(1, ...LEVELS.map(count));
  for (const level of LEVELS) {
    const n = count(level);
    text(t[level], M, y + 7, 8.5, TONE);
    fill(SOFT);
    pdf.roundedRect(M + 78, y, half - 108, 9, 4.5, 4.5, "F");
    if (n) {
      fill(SEVERITY[level]);
      pdf.roundedRect(
        M + 78,
        y,
        Math.max(9, ((half - 108) * n) / most),
        9,
        4.5,
        4.5,
        "F",
      );
    }
    text(String(n), M + half, y + 7, 9, INK, { bold: true, align: "right" });
    y += 20;
  }
  const leftEnd = y;
  y = chartTop;
  const cx = M + half + 24;
  text(r.checksTitle, cx, y, 10, INK, { bold: true });
  y += 18;
  const statuses = (["completed", "skipped", "unsupported", "failed"] as const)
    .map(
      (s) => [s, report.checks.filter((c) => c.status === s).length] as const,
    )
    .filter(([, n]) => n > 0);
  const totalChecks = Math.max(1, report.checks.length);
  let bx = cx;
  for (const [s, n] of statuses) {
    const w = (half * n) / totalChecks;
    fill(STATUS[s]);
    pdf.rect(bx, y, w, 14, "F");
    bx += w;
  }
  y += 32;
  for (const [s, n] of statuses) {
    fill(STATUS[s]);
    pdf.circle(cx + 4, y - 3, 3.5, "F");
    text(`${n} ${t[s]}`, cx + 14, y, 9, INK);
    y += 16;
  }
  y = Math.max(leftEnd, y) + 14;

  // Session details.
  heading(r.sessionTitle);
  const session: Array<[string, string]> = [
    [t.device, device],
    [r.start, when(report.startedAt, language)],
    [r.end, when(report.finishedAt, language)],
    [r.duration, span(report.startedAt, report.finishedAt, language)],
    [t.ruleVersion, report.ruleBundleVersion],
    [
      t.engines,
      report.engines.map((e) => `${e.name} ${e.version}`).join(", ") || "—",
    ],
    [t.cleanup, t[report.cleanup]],
  ];
  for (const [label, value] of session) {
    const rows = lines(value, 9.5, CW - 160);
    ensure(rows.length * 14 + 6);
    text(label, M, y, 9.5, TONE);
    rows.forEach((row, i) => text(row, M + 160, y + i * 14, 9.5, INK));
    y += rows.length * 14 + 6;
  }
  y += 6;
  paragraph(t.pdfCharacters, 8, TONE);

  // ---- Signs, each as a card coloured by severity ----
  newPage();
  heading(t.findings);
  paragraph(total ? r.findingsLead : r.noFindingsLead, 10, total ? TONE : INK);
  y += 6;
  const card = (
    f: ScanReport["findings"][number],
    i: number,
    review: boolean,
  ) => {
    const fields: Array<[string, string]> = [
      [t.recommendation, nativeText(f.recommendation, language)],
      [t.evidence, evidenceText(f.evidence, language)],
      [t.source, f.source],
      [t.rules, `${f.rule} (${f.ruleVersion})`],
      ...(f.timestamp
        ? [[r.eventDate, when(f.timestamp, language)] as [string, string]]
        : []),
      [
        t.limitations,
        f.limitations.map((value) => nativeText(value, language)).join(" "),
      ],
    ];
    const titleRows = lines(findingLabel(f.category, language), 11.5, CW - 40);
    const blocks = fields.map(
      ([label, value]) => [label, lines(value, 9, CW - 150)] as const,
    );
    // Start a card on a new page when little room is left on this one.
    if (y + 120 > BOTTOM) newPage();
    const tint = review ? TONE : SEVERITY[f.severity];
    let pageTop = y;
    let at = y + 22;
    text(`#${i + 1}`, M + 16, at, 9, TONE, { bold: true });
    let px = M + 44;
    px += pill(review ? r.reviewTag : t[f.severity], px, at, tint) + 6;
    pill(`${t.confidence}: ${t[f.confidence]}`, px, at, tint, false);
    at += 20;
    for (const row of titleRows) {
      text(row, M + 16, at, 11.5, INK, { bold: true });
      at += 15;
    }
    at += 2;
    for (const [label, rows] of blocks) {
      rows.forEach((row, n) => {
        if (at > BOTTOM) {
          // Close the card on this page and continue it on the next.
          fill(tint);
          pdf.rect(M, pageTop, 3, at - pageTop, "F");
          newPage();
          pageTop = y - 14;
          at = y;
        }
        if (n === 0) text(label, M + 16, at, 8.5, TONE);
        text(row, M + 134, at, 9, INK);
        at += 12.5;
      });
      at += 6;
    }
    fill(tint);
    pdf.rect(M, pageTop, 3, at - pageTop, "F");
    stroke(LINE);
    pdf.setLineWidth(0.6);
    pdf.line(M, at + 2, M + CW, at + 2);
    y = at + 16;
  };
  detections.forEach((f, i) => card(f, i, false));
  if (reviews.length) {
    ensure(90);
    y += 10;
    heading(r.reviewTitle);
    reviews.forEach((f, i) => card(f, i, true));
  }

  // ---- Checks performed ----
  const checkRows = report.checks.map((check) =>
    lines(checkDetail(check.id, check.detail, language), 9, CW - 150),
  );
  heading(t.allChecks, (checkRows[0]?.length ?? 1) * 12.5 + 26);
  report.checks.forEach((check, index) => {
    const rows = checkRows[index];
    ensure(rows.length * 12.5 + 26);
    text(checkName(check.id, language), M, y, 10, INK, { bold: true });
    pdf.setFontSize(8);
    const label = t[check.status];
    const w = pdf.getTextWidth(pdfText(label)) + 14;
    pill(label, M + CW - w, y, STATUS[check.status]);
    y += 15;
    for (const row of rows) {
      text(row, M, y, 9, TONE);
      y += 12.5;
    }
    y += 10;
  });

  // ---- Coverage and limitations ----
  heading(t.limitations, 40);
  for (const limitation of report.limitations) {
    const rows = lines(nativeText(limitation, language), 9.5, CW - 16);
    ensure(rows.length * 14 + 4);
    fill(TONE);
    pdf.circle(M + 3, y - 3, 1.6, "F");
    rows.forEach((row, i) => text(row, M + 14, y + i * 14, 9.5, INK));
    y += rows.length * 14 + 4;
  }
  y += 8;
  paragraph(r.generatedNote, 9, TONE);

  // ---- Back page: Enigm and its products, always on a sheet of its own ----
  newPage();
  const WHITE: Rgb = [255, 255, 255];
  const MUTED: Rgb = [178, 178, 178];
  const pad = 30,
    cell = 4.6, // QR module size in points
    quiet = cell * 3,
    qrTile = ENIGM_QR.length * cell + quiet * 2,
    heroText = CW - pad * 2 - qrTile - 30;
  const titleRows = lines(r.promoTitle, 26, heroText);
  const lede = lines(p.offerBody, 11, heroText);
  const points = r.promoPoints.map((point) => lines(point, 10, heroText - 16));
  pdf.setFontSize(10.5);
  const ctaWidth = pdf.getTextWidth(pdfText(r.promoCta)) + 40;
  const heroTextHeight =
    26 +
    44 +
    titleRows.length * 31 +
    6 +
    lede.length * 16 +
    12 +
    points.reduce((sum, rows) => sum + rows.length * 14 + 7, 0) +
    14 +
    32;
  const heroHeight = Math.max(heroTextHeight, qrTile + 34) + pad * 2;
  const top = y;
  fill(INK);
  pdf.roundedRect(M, top, CW, heroHeight, 18, 18, "F");
  let ty = top + pad;
  pdf.addImage(reportLogoLight, "PNG", M + pad, ty, 88, 26.2);
  ty += 26 + 44;
  titleRows.forEach((row) => {
    text(row, M + pad, ty, 26, WHITE, { bold: true });
    ty += 31;
  });
  ty += 6;
  lede.forEach((row) => {
    text(row, M + pad, ty, 11, MUTED);
    ty += 16;
  });
  ty += 12;
  for (const rows of points) {
    fill(WHITE);
    pdf.circle(M + pad + 3, ty - 3.4, 2, "F");
    rows.forEach((row) => {
      text(row, M + pad + 14, ty, 10, WHITE);
      ty += 14;
    });
    ty += 7;
  }
  ty += 6;
  fill(WHITE);
  pdf.roundedRect(M + pad, ty, ctaWidth, 32, 16, 16, "F");
  text(r.promoCta, M + pad + 20, ty + 20.5, 10.5, INK, { bold: true });
  pdf.link(M + pad, ty, ctaWidth, 32, { url: ENIGM_URL });
  // The QR code on a white tile with its quiet zone, linked as well.
  const qx = M + CW - pad - qrTile,
    qy = top + (heroHeight - qrTile - 24) / 2;
  fill(WHITE);
  pdf.roundedRect(qx, qy, qrTile, qrTile, 10, 10, "F");
  fill(INK);
  ENIGM_QR.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++)
      if (row[rx] === "1")
        pdf.rect(
          qx + quiet + rx * cell,
          qy + quiet + ry * cell,
          cell,
          cell,
          "F",
        );
  });
  pdf.link(qx, qy, qrTile, qrTile, { url: ENIGM_URL });
  text(r.qrCaption, qx + qrTile / 2, qy + qrTile + 18, 8.5, MUTED, {
    align: "center",
  });
  y = top + heroHeight + 26;

  // The Enigm ecosystem, two products per row.
  heading(p.offerDetails, 90);
  const cardGap = 14,
    colWidth = (CW - cardGap) / 2;
  const cards = p.offerProducts.map((product) => ({
    name: lines(product.name, 11, colWidth - 36),
    body: lines(product.description, 9.5, colWidth - 36),
  }));
  for (let i = 0; i < cards.length; i += 2) {
    const pair = cards.slice(i, i + 2);
    const rowHeight = Math.max(
      ...pair.map(
        (c) => 22 + c.name.length * 15 + 4 + c.body.length * 13.5 + 14,
      ),
    );
    ensure(rowHeight + cardGap);
    pair.forEach((c, j) => {
      const x = M + j * (colWidth + cardGap);
      fill(SOFT);
      pdf.roundedRect(x, y, colWidth, rowHeight, 12, 12, "F");
      fill(INK);
      pdf.rect(x + 18, y + 18, 18, 2.4, "F");
      let cy = y + 22 + 15;
      c.name.forEach((row) => {
        text(row, x + 18, cy, 11, INK, { bold: true });
        cy += 15;
      });
      cy += 4;
      c.body.forEach((row) => {
        text(row, x + 18, cy, 9.5, TONE);
        cy += 13.5;
      });
    });
    y += rowHeight + cardGap;
  }

  // Where to read more, as two links.
  ensure(40);
  y += 10;
  stroke(LINE);
  pdf.setLineWidth(0.6);
  pdf.line(M, y, M + CW, y);
  y += 24;
  const [site, docs] = r.promoMore;
  text(site, M, y, 10, INK, { bold: true });
  pdf.setFontSize(10);
  pdf.link(M, y - 11, pdf.getTextWidth(pdfText(site)), 15, { url: ENIGM_URL });
  text(docs, M + CW, y, 10, TONE, { align: "right" });
  const docsWidth = pdf.getTextWidth(pdfText(docs));
  pdf.link(M + CW - docsWidth, y - 11, docsWidth, 15, {
    url: "https://docs.enigm.io",
  });

  // Footer on every page.
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    stroke(LINE);
    pdf.setLineWidth(0.5);
    pdf.line(M, H - 40, M + CW, H - 40);
    text("Enigm Scan", M, H - 26, 8, TONE);
    text(`${r.page} ${i} / ${pages}`, M + CW, H - 26, 8, TONE, {
      align: "right",
    });
  }
  return pdf;
}

export async function downloadPdf(
  report: ScanReport,
  t: Copy,
  originLabel?: string,
  language: Language = "en",
): Promise<boolean> {
  const pdf = await buildPdf(report, t, originLabel, language);
  if ("__TAURI_INTERNALS__" in window) {
    // False when the person closes the save dialog without saving.
    return Boolean(
      await native<boolean>("save_export", {
        format: "pdf",
        name: reportFileName(report, "pdf"),
        bytes: Array.from(new Uint8Array(pdf.output("arraybuffer"))),
      }),
    );
  }
  pdf.save(reportFileName(report, "pdf"));
  return true;
}
