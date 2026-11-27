// Lists what changed upstream in the sources the indicators come from, so a
// maintainer can review it, convert it and sign a new release. It never
// changes anything here. Exits with 1 when there is something to review, so
// the scheduled run that calls it shows up as failed.
//
//   node scripts/intel/check-sources.mjs
//
// Checked: every pinned source file, the inputs of the converted sources,
// new campaigns in MVT's index and new investigations by Amnesty, and the
// spyware domains of Emerging Threats Open (its ruleset changes daily, the
// spyware part much less).
import { readFileSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const manifest = JSON.parse(
  readFileSync("intelligence/sources/manifest.json", "utf8"),
);
// Amnesty investigations reviewed and not used: phishing, or computer
// malware rather than phone spyware, or already covered by MVT's Predator.
const AMNESTY_NOT_USED = new Set([
  "2018-12-19_best_practice",
  "2019-03-06_egypt_oauth",
  "2019-08-16_evolving_phishing",
  "2020-03-12_uzbekistan",
  "2020-06-15_india",
  "2021-02-24_vietnam",
  "2021-05-28_qatar",
  "2021-12-16_cytrox",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
// Only the hosts the sources come from, over HTTPS, and never a file larger
// than any source is.
const HOSTS = new Set([
  "raw.githubusercontent.com",
  "api.github.com",
  "rules.emergingthreats.net",
]);
const MAX_BYTES = 64 * 1024 * 1024;
const allowed = (address) => {
  const url = new URL(address);
  return url.protocol === "https:" && HOSTS.has(url.hostname);
};
async function get(url) {
  if (!allowed(url)) throw new Error(`Not a source host: ${url}`);
  const headers = { "user-agent": "enigm-scan-sources-check" };
  if (url.startsWith("https://api.github.com/") && process.env.GITHUB_TOKEN)
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url, { headers, redirect: "error" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error(`${url}: too large`);
  return bytes;
}
const head = (owner, repo, path) =>
  get(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`);

const changes = [];
const pinned = new Set();
for (const source of manifest) {
  const raw = source.url.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/[0-9a-f]{40}\/(.+)$/,
  );
  if (!raw) continue;
  const [, owner, repo, path] = raw;
  pinned.add(`${owner}/${repo}/${path}`);
  if (sha256(await head(owner, repo, path)) !== source.sha256)
    changes.push(`${source.file}: ${owner}/${repo} ${path} changed upstream`);
}

// Converted sources: their recorded inputs.
for (const [file, owner, repo] of [
  ["ESET_PROVENANCE.json", "eset", "malware-ioc"],
  ["AMNESTY_PROVENANCE.json", "AmnestyTech", "investigations"],
]) {
  const provenance = JSON.parse(
    readFileSync(`intelligence/sources/${file}`, "utf8"),
  );
  for (const input of provenance.inputs) {
    pinned.add(`${owner}/${repo}/${input.path}`);
    if (sha256(await head(owner, repo, input.path)) !== input.sha256)
      changes.push(`${file}: ${owner}/${repo} ${input.path} changed upstream`);
  }
}

// New campaigns in MVT's index.
const index = (
  await head("mvt-project", "mvt-indicators", "indicators.yaml")
).toString("utf8");
for (const entry of index.split(/\n\s*-\s*\n/)) {
  const fields = Object.fromEntries(
    [...entry.matchAll(/\n\s+(owner|repo|path):\s*(\S+)/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  const { owner, repo, path } = fields;
  if (owner && repo && path && !pinned.has(`${owner}/${repo}/${path}`))
    changes.push(
      `MVT index: new campaign ${entry.match(/name:\s*(.+)/)?.[1] ?? path} (${owner}/${repo} ${path})`,
    );
}

// New Amnesty investigations.
const used = new Set(
  [...pinned]
    .filter((p) => p.startsWith("AmnestyTech/investigations/"))
    .map((p) => p.split("/")[2]),
);
const folders = JSON.parse(
  await get(
    "https://api.github.com/repos/AmnestyTech/investigations/contents/",
  ),
)
  .filter((item) => item.type === "dir")
  .map((item) => item.name);
for (const folder of folders)
  if (!used.has(folder) && !AMNESTY_NOT_USED.has(folder))
    changes.push(`Amnesty: new investigation ${folder}`);

// Emerging Threats Open: only its spyware domains. The converter gets the
// downloaded files on standard input; nothing is written to disk.
const base = "https://rules.emergingthreats.net/open/suricata-7.0";
const input = JSON.stringify({
  rules: (await get(`${base}/rules/emerging-mobile_malware.rules`)).toString(
    "base64",
  ),
  license: (await get(`${base}/LICENSE`)).toString("utf8"),
});
const result = JSON.parse(
  execFileSync(
    process.execPath,
    ["scripts/intel/emerging-threats.mjs", "--check"],
    { encoding: "utf8", input, maxBuffer: MAX_BYTES },
  ),
);
if (result.added.length || result.removed.length)
  changes.push(
    `Emerging Threats Open: ${result.added.length} spyware domain(s) added, ${result.removed.length} removed (ruleset ${result.sha256})`,
  );

// Names from upstream end up in the job summary: plain characters only.
const plainText = (text) => text.replaceAll(/[^\w .,:;/()+'-]/g, "?");
const report = changes.length
  ? ["Sources to review:", ...changes.map((c) => `- ${plainText(c)}`)].join(
      "\n",
    )
  : "No source changed upstream.";
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
process.exit(changes.length ? 1 : 0);
