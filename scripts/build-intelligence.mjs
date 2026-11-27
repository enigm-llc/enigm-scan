// Offline, deterministic source normalization. No network calls or private evidence.
//
// Three ways to make a release:
//   node scripts/build-intelligence.mjs --version=N --popular=top-1m.csv
//     compiles and signs here with the key in .secrets/;
//   node scripts/build-intelligence.mjs --prepare --version=N --popular=top-1m.csv
//     compiles and writes the unsigned payloads to .release/, for a signer
//     that keeps the key elsewhere (an HSM or an isolated computer);
//   node scripts/build-intelligence.mjs --assemble
//     checks the signatures written next to those payloads against the keys
//     the app trusts and writes the release.
// --popular is the Tranco list of the most visited domains: any indicator on
// one of the top 10,000 needs a decision in intelligence/reviewed-popular.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import {
  createHash,
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";
import { BlockList, isIP } from "node:net";
// Sorts text by code unit, the order Array.prototype.sort uses by default.
const byText = (a, b) => (a > b) - (a < b);
const args = process.argv.slice(2);
const option = (name) =>
  args
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
const mode = args.includes("--prepare")
  ? "prepare"
  : args.includes("--assemble")
    ? "assemble"
    : "sign";
const STAGING = ".release";
const TRUSTED = "src-tauri/resources/intelligence/trusted-keys.bin";
const CURRENT = "src-tauri/resources/intelligence/public-key.bin";
/** The file's contents, or null when it does not exist. Reading directly,
 *  rather than checking first, leaves no gap for the file to change. */
function readIfPresent(path, encoding) {
  try {
    return readFileSync(path, encoding);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
/** The public keys the app accepts, 32 bytes each. A new key is added here,
 *  and shipped in an app release, before releases are signed with it. */
function trustedKeys() {
  const bytes = readIfPresent(TRUSTED) ?? readIfPresent(CURRENT);
  if (bytes === null) return [];
  if (!bytes.length || bytes.length % 32)
    throw new Error("Invalid trusted keys");
  return Array.from({ length: bytes.length / 32 }, (_, i) =>
    bytes.subarray(i * 32, i * 32 + 32),
  );
}
const spki = (raw) =>
  createPublicKey({
    key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw]),
    format: "der",
    type: "spki",
  });
const previousRelease = readIfPresent("intelligence/release.json", "utf8");
const previousVersion =
  previousRelease === null ? 0 : JSON.parse(previousRelease).version;

if (mode === "assemble") {
  assemble();
  process.exit(0);
}

const version = Number(option("version"));
if (!Number.isSafeInteger(version) || version < 1)
  throw new Error("Provide --version=<monotonic integer>");
if (version <= previousVersion)
  throw new Error("Release version must increase");
// Validity window. The native verifier rejects bundles valid for more than 90 days.
const days = Number(option("days") ?? 30);
if (!Number.isSafeInteger(days) || days < 1 || days > 90)
  throw new Error("--days must be an integer between 1 and 90");
const popularPath = option("popular");
if (!popularPath)
  throw new Error(
    "Provide --popular=<Tranco top-1m.csv> (https://tranco-list.eu/top-1m.csv.zip) to check indicators against the most visited domains",
  );
const now = Math.floor(Date.now() / 1000);
const sources = JSON.parse(
  readFileSync("intelligence/sources/manifest.json", "utf8"),
);
// One STIX comparison per indicator. Keys map to bundle kinds; values are
// normalized exactly like the native verifier (agent/core/src/rules.rs).
const KINDS = {
  "domain-name:value": "domain",
  "ipv4-addr:value": "ip",
  "ipv6-addr:value": "ip",
  "file:hashes.sha256": "sha256",
  "file:hashes.'SHA-256'": "sha256",
  "process:name": "process_name",
  "email-addr:value": "email",
  "file:name": "file_name",
  "file:path": "file_path",
  "app:id": "app_id",
  "app:cert.sha256": "app_cert_sha256",
  "configuration-profile:id": "configuration_profile_id",
};
const LEGACY = new Set(["domain", "ip", "sha256"]);
// MVT splits STIX patterns on "=" and strips quotes/brackets: reject, never escape.
const plain = (v, max) =>
  v.length > 0 &&
  v.length <= max &&
  v.trim() === v &&
  !/[\u0000-\u001f\u007f-\u009f='[\]\\]/.test(v);
function normalizeValue(kind, raw) {
  switch (kind) {
    case "domain": {
      const v = raw.toLowerCase().replace(/\.$/, "");
      return v.length <= 253 &&
        v.includes(".") &&
        !isIP(v) &&
        v
          .split(".")
          .every((s) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s))
        ? v
        : null;
    }
    case "ip":
      return isIP(raw) ? raw.toLowerCase() : null;
    case "sha256":
    case "app_cert_sha256":
      return /^[a-fA-F0-9]{64}$/.test(raw) ? raw.toLowerCase() : null;
    case "process_name":
    case "file_name":
      return plain(raw, 255) && !raw.includes("/") ? raw : null;
    case "file_path":
      return plain(raw, 1024) && raw.includes("/") ? raw : null;
    case "configuration_profile_id":
      return plain(raw, 255) ? raw : null;
    case "email": {
      const v = raw.toLowerCase();
      const at = v.split("@");
      return plain(v, 254) && at.length === 2 && at[0] && at[1] && !/\s/.test(v)
        ? v
        : null;
    }
    case "app_id":
      return raw.length <= 255 &&
        raw.split(".").length >= 2 &&
        raw.split(".").every((p) => /^[A-Za-z0-9_-]+$/.test(p))
        ? raw
        : null;
  }
  return null;
}
function parsePattern(pattern) {
  const m = pattern.match(
    /^\[([a-z0-9-]+:[A-Za-z0-9_.'-]+)\s*=\s*'([^']*)'\]$/,
  );
  const kind = m && KINDS[m[1]];
  if (!kind) return null;
  const value = normalizeValue(kind, m[2]);
  return value === null ? null : { kind, value };
}
// Infrastructure shared by unrelated customers would match ordinary traffic.
const shared = JSON.parse(
  readFileSync("intelligence/shared-infrastructure.json", "utf8"),
);
const sharedIps = new BlockList();
for (const range of shared.ipRanges)
  for (const cidr of range.cidrs) {
    const [net, bits] = cidr.split("/");
    sharedIps.addSubnet(net, Number(bits), isIP(net) === 6 ? "ipv6" : "ipv4");
  }
const isShared = ({ kind, value }) =>
  (kind === "ip" &&
    sharedIps.check(value, isIP(value) === 6 ? "ipv6" : "ipv4")) ||
  (kind === "domain" && shared.domains.includes(value));
// Family and classification of each indicator, from STIX `indicates`
// relationships: "Pegasus", "mSpy (stalkerware)", "Life360 (watchware)".
function families(objects) {
  const malware = new Map(
    objects
      .filter((o) => o.type === "malware" && typeof o.name === "string")
      .map((o) => [o.id, o]),
  );
  const out = new Map();
  for (const r of objects)
    if (r.type === "relationship" && r.relationship_type === "indicates") {
      const m = malware.get(r.target_ref);
      if (m && !out.has(r.source_ref)) out.set(r.source_ref, m);
    }
  return out;
}
const label = (m) => {
  const name = m.name
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 60);
  const description = m.description ?? "";
  if (/^Watchware/i.test(description)) return `${name} (watchware)`;
  if (/^Stalkerware/i.test(description)) return `${name} (stalkerware)`;
  return name;
};
const rules = [];
let expiry = now + days * 86400;
let omitted = 0;
const omittedShared = [];
for (const source of sources) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(source.file))
    throw new Error("Invalid source path");
  const bytes = readFileSync(`intelligence/sources/${source.file}`);
  if (createHash("sha256").update(bytes).digest("hex") !== source.sha256)
    throw new Error("Source hash changed");
  const objects = JSON.parse(bytes).objects ?? [];
  const family = families(objects);
  for (const obj of objects) {
    if (obj.type !== "indicator" || obj.revoked === true) continue;
    if (
      obj.valid_until &&
      (!Number.isFinite(Date.parse(obj.valid_until)) ||
        Date.parse(obj.valid_until) <= now * 1000)
    ) {
      omitted++;
      continue;
    }
    if (
      obj.valid_from &&
      (!Number.isFinite(Date.parse(obj.valid_from)) ||
        Date.parse(obj.valid_from) > now * 1000)
    ) {
      omitted++;
      continue;
    }
    const parsed = parsePattern(obj.pattern ?? "");
    if (!parsed) {
      omitted++;
      continue;
    }
    const { kind, value } = parsed;
    if (isShared(parsed)) {
      omittedShared.push(`${source.file}: ${kind} ${value}`);
      continue;
    }
    const malware = family.get(obj.id);
    // Watchware (monitoring apps often installed with consent) keeps its own
    // prefix so the app can present it as a review point.
    const watchware = /^Watchware/i.test(malware?.description ?? "");
    const id = `${watchware ? "watchware" : "mvt"}.${obj.id.replace(/^indicator--/, "")}`;
    const reference =
      (obj.external_references ?? []).find(
        (x) => typeof x.url === "string" && x.url.startsWith("https://"),
      )?.url ?? source.url;
    if (obj.valid_until)
      expiry = Math.min(expiry, Math.floor(Date.parse(obj.valid_until) / 1000));
    const date = /^\d{4}-\d{2}-\d{2}/.test(obj.created ?? "")
      ? obj.created.slice(0, 10)
      : "date unavailable";
    rules.push({
      id,
      kind,
      value,
      source: reference,
      published: malware ? `${date}, ${label(malware)}` : date,
    });
  }
}
// Popular domains: a decision for each, or no release.
const reviewed = JSON.parse(
  readFileSync("intelligence/reviewed-popular.json", "utf8"),
);
const platforms = new Set([...reviewed.platforms, ...shared.domains]);
// Second-level registries where each name below is its own site.
const SECOND_LEVEL =
  /^(?:(?:co|com|net|org|gov|ac|edu|gob|or|ne|go)\.[a-z]{2}|(?:gr|cn|uk|us|eu|br|sa|za|de|ru|jpn|kr|hu|no|se|uy|ar|qc)\.com)$/;
const registrable = (host) => {
  const labels = host.split(".");
  const keep =
    labels.length >= 3 && SECOND_LEVEL.test(labels.slice(-2).join(".")) ? 3 : 2;
  return labels.slice(-keep).join(".");
};
const top = new Map();
for (const line of readFileSync(popularPath, "utf8").split("\n")) {
  const [rank, domain] = line.trim().split(",");
  if (Number(rank) > 10000) break;
  if (domain) top.set(domain.toLowerCase(), Number(rank));
}
if (top.size < 9000)
  throw new Error("The popular domains list looks incomplete");
const unreviewed = new Set();
const popular = { kept: 0, monitoring: 0, dropped: [] };
const screened = rules.filter((rule) => {
  if (rule.kind !== "domain") return true;
  const site = registrable(rule.value);
  if (platforms.has(site) || !(top.has(rule.value) || top.has(site)))
    return true;
  const decision = reviewed.decisions[site];
  if (!decision) {
    unreviewed.add(site);
    return true;
  }
  if (decision.action === "drop" || decision.except?.includes(rule.value)) {
    popular.dropped.push(rule.value);
    return false;
  }
  if (decision.action === "monitoring") {
    popular.monitoring++;
    rule.id = rule.id.replace(/^[a-z]+\./, "watchware.");
    rule.published = rule.published.replace(
      /( \((?:stalkerware|watchware)\))?$/,
      " (watchware)",
    );
  } else popular.kept++;
  return true;
});
if (unreviewed.size)
  throw new Error(
    `Popular domains need a decision in intelligence/reviewed-popular.json: ${[...unreviewed].sort(byText).join(", ")}`,
  );
popular.dropped = [...new Set(popular.dropped)].sort(byText);

// One rule per value: the same domain or hash published by several sources
// would otherwise appear as several findings. Sources are listed with the
// primary research first, so the rule kept names the original publication.
// When sources disagree, a monitoring app (watchware) wins over stalkerware:
// the less alarming reading of the same value.
const byValue = new Map();
for (const rule of screened) {
  const key = `${rule.kind}\0${rule.value}`;
  const kept = byValue.get(key);
  if (
    !kept ||
    (rule.id.startsWith("watchware.") && !kept.id.startsWith("watchware."))
  )
    byValue.set(key, rule);
}
const duplicates = screened.length - byValue.size;
const unique = [
  ...new Map([...byValue.values()].map((r) => [r.id, r])).values(),
].sort((a, b) => a.id.localeCompare(b.id, "en"));
if (!unique.length) throw new Error("No supported indicators");
// Schema 1 (domain/ip/sha256) stays at the original endpoint for released
// apps; schema 2 adds the forensic types MVT matches natively.
const payloadFor = (schemaVersion, selected) =>
  Buffer.from(
    JSON.stringify({
      schemaVersion,
      version,
      issuedAt: now,
      expiresAt: expiry,
      rules: selected,
    }),
  );
const payloads = {
  v1: payloadFor(
    1,
    unique.filter((r) => LEGACY.has(r.kind)),
  ),
  v2: payloadFor(2, unique),
};
const byKind = Object.fromEntries(
  [...new Set(unique.map((r) => r.kind))]
    .sort(byText)
    .map((k) => [k, unique.filter((r) => r.kind === k).length]),
);
const summary = {
  version,
  rules: unique.length,
  rulesByKind: byKind,
  legacyRules: unique.filter((r) => LEGACY.has(r.kind)).length,
  omittedUnsupportedPatterns: omitted,
  omittedSharedInfrastructure: omittedShared,
  popularDomains: popular,
  duplicatesMerged: duplicates,
  issuedAt: now,
  expiresAt: expiry,
  sources: sources.map((s) => ({ url: s.url, sha256: s.sha256 })),
};

if (mode === "prepare") {
  mkdirSync(STAGING, { recursive: true, mode: 0o700 });
  writeFileSync(`${STAGING}/payload-v1.json`, payloads.v1);
  writeFileSync(`${STAGING}/payload-v2.json`, payloads.v2);
  writeFileSync(
    `${STAGING}/summary.json`,
    JSON.stringify(summary, null, 2) + "\n",
  );
  const hash = (b) => createHash("sha256").update(b).digest("hex");
  console.log(
    [
      `Unsigned release ${version} in ${STAGING}/ (${unique.length} indicators).`,
      `payload-v1.json  sha256 ${hash(payloads.v1)}`,
      `payload-v2.json  sha256 ${hash(payloads.v2)}`,
      "Sign each payload with the release key (Ed25519, raw 64-byte signature) as",
      "payload-v1.sig and payload-v2.sig next to it, for example on the signing computer:",
      "  openssl pkeyutl -sign -inkey key.pem -rawin -in payload-v2.json -out payload-v2.sig",
      "then run: node scripts/build-intelligence.mjs --assemble",
    ].join("\n"),
  );
} else {
  const keyPath = ".secrets/intelligence-signing.pem";
  let keyPem = readIfPresent(keyPath);
  if (keyPem === null) {
    if (!args.includes("--init-key"))
      throw new Error(
        "Signing key missing; initialize explicitly or provision an offline release key",
      );
    mkdirSync(".secrets", { recursive: true, mode: 0o700 });
    keyPem = generateKeyPairSync("ed25519").privateKey.export({
      type: "pkcs8",
      format: "pem",
    });
    // "wx" refuses to replace a key created in the meantime.
    writeFileSync(keyPath, keyPem, { mode: 0o600, flag: "wx" });
  }
  const key = createPrivateKey(keyPem);
  write(summary, payloads, {
    v1: sign(null, payloads.v1, key),
    v2: sign(null, payloads.v2, key),
  });
}

/** Checks both signatures against a key the app trusts, then writes the
 *  bundles, the key that signed them and release.json. */
function write(summary, payloads, signatures) {
  const trusted = trustedKeys();
  const signer = (trusted.length ? trusted : [null]).find((raw) => {
    if (raw === null) return false;
    const key = spki(raw);
    return (
      verify(null, payloads.v1, key, signatures.v1) &&
      verify(null, payloads.v2, key, signatures.v2)
    );
  });
  mkdirSync("src-tauri/resources/intelligence", { recursive: true });
  let current = signer;
  if (!current && !trusted.length && mode === "sign") {
    // First release of a new installation: its key becomes the trusted one.
    const der = createPublicKey(
      createPrivateKey(readFileSync(".secrets/intelligence-signing.pem")),
    ).export({ type: "spki", format: "der" });
    current = der.subarray(-32);
    writeFileSync(TRUSTED, current);
  }
  if (!current)
    throw new Error("The signatures do not match any key the app trusts");
  for (const [name, schema] of [
    ["bundle.json", "v1"],
    ["bundle-v2.json", "v2"],
  ])
    writeFileSync(
      `src-tauri/resources/intelligence/${name}`,
      JSON.stringify({
        payload: payloads[schema].toString("base64"),
        signature: signatures[schema].toString("base64"),
      }) + "\n",
    );
  writeFileSync(CURRENT, current);
  const hash = (b) => createHash("sha256").update(b).digest("hex");
  writeFileSync(
    "intelligence/release.json",
    JSON.stringify(
      {
        ...summary,
        publicKeySha256: hash(current),
        payloadSha256: hash(payloads.v1),
        payloadV2Sha256: hash(payloads.v2),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify({
      version: summary.version,
      rules: summary.rules,
      rulesByKind: summary.rulesByKind,
      popularDomains: summary.popularDomains,
      duplicatesMerged: summary.duplicatesMerged,
    }),
  );
}

/** Writes a release prepared with --prepare and signed elsewhere. */
function assemble() {
  const read = (name) => readFileSync(`${STAGING}/${name}`);
  const summary = JSON.parse(read("summary.json"));
  if (summary.version <= previousVersion)
    throw new Error("Release version must increase");
  const payloads = { v1: read("payload-v1.json"), v2: read("payload-v2.json") };
  for (const [schema, bytes] of Object.entries(payloads)) {
    const payload = JSON.parse(bytes);
    if (payload.version !== summary.version)
      throw new Error(
        `payload-${schema}.json is not release ${summary.version}`,
      );
    if (payload.expiresAt <= Math.floor(Date.now() / 1000))
      throw new Error("The prepared release has expired: prepare it again");
  }
  write(summary, payloads, {
    v1: read("payload-v1.sig"),
    v2: read("payload-v2.sig"),
  });
}
