// The daily review of what may deserve new indicators, posted to one GitHub
// issue: what changed upstream in the sources (check-sources.mjs) and the
// indicators the research worker found in new public research, each with
// the article's own words. It never changes the indicators: a maintainer
// reviews, converts and signs offline (intelligence/README.md).
//
//   GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node scripts/intel/review.mjs
//
// Without GITHUB_TOKEN it prints what it would post.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

export const RESEARCH =
  "https://enigm-scan-research.enigm.workers.dev/latest.json";
const TITLE = "Intelligence to review";
const LABEL = "intelligence";
const WINDOW = 26 * 3_600_000;

/** Text from outside shown in an issue: no markup, links or mentions. */
export function plain(text, max = 300) {
  return String(text ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\\`*_[\]()<>#|~!]/g, (c) => `\\${c}`)
    .replaceAll("@", "@\u200b")
    .replace(/https?:\/\//gi, (m) => m.replace("//", "/\u200b/"))
    .slice(0, max);
}
/** A value or quote in a code span (backticks removed). */
export function code(text, max = 300) {
  const inner = String(text ?? "")
    .replaceAll("`", "'")
    .replace(/\s+/g, " ")
    .slice(0, max);
  return "`" + inner + "`";
}

/** Values already in the signed bundle, by kind. */
export function signedValues(
  bundlePath = "src-tauri/resources/intelligence/bundle-v2.json",
) {
  const { payload } = JSON.parse(readFileSync(bundlePath, "utf8"));
  const { rules } = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
  return new Set(
    rules.map((r) => `${r.kind}\0${String(r.value).toLowerCase()}`),
  );
}

/** What one article adds: its new candidates, as a table. */
function articleLines(a, known) {
  const url = new URL(a.url);
  const day = a.date ? " · " + a.date.slice(0, 10) : "";
  const lines = [
    "<!-- article:" + a.id + " -->",
    "### " + plain(a.title, 200),
    plain(a.source, 80) + " · <" + url.href + ">" + day,
  ];
  if (a.outcome !== "answered") {
    lines.push(
      "The model could not answer (" +
        plain(a.outcome, 20) +
        "): read it yourself.",
      "",
    );
    return lines;
  }
  if (a.summary) lines.push("", plain(a.summary, 600));
  const fresh = a.indicators.filter(
    (i) => !known.has(i.kind + "\0" + i.value.toLowerCase()),
  );
  const already = a.indicators.length - fresh.length;
  let counts = fresh.length + " new indicator(s) quoted from the article";
  if (already) counts += ", " + already + " already signed";
  if (a.dropped)
    counts +=
      ", " +
      a.dropped +
      " dropped because the article does not say them word for word";
  lines.push("", counts + ".");
  if (fresh.length) {
    lines.push(
      "",
      "| Kind | Value | Family | Phone | The article says |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const i of fresh.slice(0, 100)) {
      const cells = [
        i.kind,
        code(i.value, 120),
        plain(i.family, 40),
        i.platform,
        code(i.quote, 240),
      ];
      lines.push("| " + cells.join(" | ") + " |");
    }
    if (fresh.length > 100)
      lines.push("| … | " + (fresh.length - 100) + " more | | | |");
  }
  lines.push("");
  return lines;
}

/** Articles answered recently that are about phone spyware, or that the
 *  model could not read (a person should look at those). */
export function researchSection(report, known, posted = "", now = Date.now()) {
  const recent = (report?.articles || []).filter(
    (a) =>
      Date.parse(a.answered_at) >= now - WINDOW &&
      (a.relevant || a.outcome !== "answered") &&
      !posted.includes("<!-- article:" + a.id + " -->"),
  );
  return recent.flatMap((a) => articleLines(a, known)).join("\n");
}

function sourcesSection() {
  const run = spawnSync(process.execPath, ["scripts/intel/check-sources.mjs"], {
    encoding: "utf8",
  });
  if (run.status === 0) return "";
  if (run.status !== 1)
    return `Checking the sources failed:\n\n${code(run.stderr, 500)}`;
  const body = run.stdout.trim();
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
  return `<!-- sources:${hash} -->\n${body}`;
}

async function github(path, init = {}) {
  const response = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${path}`,
    {
      ...init,
      headers: {
        authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json",
      },
    },
  );
  if (!response.ok)
    throw new Error(
      `GitHub ${init.method || "GET"} ${path}: ${response.status}`,
    );
  return response.status === 204 ? null : response.json();
}

/** A part marked by its content, so the same text is posted once. */
function marked(kind, text) {
  const hash = createHash("sha256").update(text).digest("hex").slice(0, 16);
  return `<!-- ${kind}:${hash} -->\n${text}`;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  let issue = null;
  let posted = "";
  if (token) {
    const issues = await github(
      `/issues?state=open&labels=${LABEL}&per_page=10`,
    );
    issue = issues.find((i) => i.title === TITLE) || null;
    if (issue)
      posted = [
        issue.body || "",
        ...(await github(`/issues/${issue.number}/comments?per_page=100`)).map(
          (c) => c.body,
        ),
      ].join("\n");
  }
  const known = signedValues();
  let report = null;
  try {
    const response = await fetch(RESEARCH, {
      headers: { accept: "application/json" },
    });
    if (response.ok) report = await response.json();
  } catch {}
  const parts = [];
  const sources = sourcesSection();
  if (sources) parts.push(`## Sources changed upstream\n\n${sources}`);
  const research = researchSection(report, known, posted);
  if (research) parts.push(`## New public research\n\n${research}`);
  const status = report?.status;
  if (!report)
    parts.push(marked("worker", "The research worker could not be reached."));
  else if (status?.errors?.length)
    parts.push(
      marked(
        "worker",
        `Research worker problems in its last run: ${status.errors.map((e) => plain(e, 120)).join("; ")}`,
      ),
    );
  else if (status?.note === "no_api_key")
    parts.push(
      marked(
        "worker",
        "The research worker has no Anthropic API key yet: it reads the feeds but asks nothing.",
      ),
    );
  if (!token) {
    console.log(parts.join("\n\n") || "Nothing to review.");
    return;
  }
  if (!parts.length) return console.log("Nothing to review.");
  const fresh = parts.filter((text) => {
    const markers = text.match(/<!-- [a-z]+:[0-9a-f]+ -->/g) || [];
    return !markers.length || markers.some((m) => !posted.includes(m));
  });
  if (!fresh.length) return console.log("Already posted.");
  const body = `${fresh.join("\n\n")}\n\n_Candidates are checked against the article's own words. Review them before converting and signing (intelligence/README.md)._`;
  if (!issue) {
    issue = await github("/issues", {
      method: "POST",
      body: JSON.stringify({ title: TITLE, labels: [LABEL], body }),
    });
    console.log("Opened the review issue.");
  } else {
    await github(`/issues/${issue.number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
    console.log("Commented on the review issue.");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
