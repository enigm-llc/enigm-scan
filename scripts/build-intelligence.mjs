// Offline, deterministic source normalization. No network calls or private evidence.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import {
  createHash,
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  sign,
} from "node:crypto";
import { BlockList, isIP } from "node:net";
const args = process.argv.slice(2);
const init = args.includes("--init-key");
const version = Number(
  args.find((a) => a.startsWith("--version="))?.split("=")[1],
);
if (!Number.isSafeInteger(version) || version < 1)
  throw Error("Provide --version=<monotonic integer>");
// Validity window. The native verifier rejects bundles valid for more than 90 days.
const days = Number(
  args.find((a) => a.startsWith("--days="))?.split("=")[1] ?? 30,
);
if (!Number.isSafeInteger(days) || days < 1 || days > 90)
  throw Error("--days must be an integer between 1 and 90");
const keyPath = ".secrets/intelligence-signing.pem";
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
let keyPem = readIfPresent(keyPath);
if (keyPem === null) {
  if (!init)
    throw Error(
      "Signing key missing; initialize explicitly or provision an offline release key",
    );
  mkdirSync(".secrets", { recursive: true, mode: 0o700 });
  const { privateKey } = generateKeyPairSync("ed25519");
  keyPem = privateKey.export({ type: "pkcs8", format: "pem" });
  // "wx" refuses to replace a key created in the meantime.
  writeFileSync(keyPath, keyPem, { mode: 0o600, flag: "wx" });
}
const key = createPrivateKey(keyPem);
const publicDer = createPublicKey(key).export({ type: "spki", format: "der" });
const publicRaw = publicDer.subarray(publicDer.length - 32);
const pinnedKeyPath = "src-tauri/resources/intelligence/public-key.bin";
const pinnedKey = readIfPresent(pinnedKeyPath);
if (pinnedKey !== null && !pinnedKey.equals(publicRaw))
  throw Error("Signing key does not match the pinned trust root");
const previousRelease = readIfPresent("intelligence/release.json", "utf8");
if (previousRelease !== null && version <= JSON.parse(previousRelease).version)
  throw Error("Release version must increase");
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
  !/[\u0000-\u001f\u007f-\u009f='\[\]\\]/.test(v);
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
    throw Error("Invalid source path");
  const bytes = readFileSync(`intelligence/sources/${source.file}`);
  if (createHash("sha256").update(bytes).digest("hex") !== source.sha256)
    throw Error("Source hash changed");
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
const unique = [...new Map(rules.map((r) => [r.id, r])).values()].sort((a, b) =>
  a.id.localeCompare(b.id, "en"),
);
if (!unique.length) throw Error("No supported indicators");
// Schema 1 (domain/ip/sha256) stays at the original endpoint for released
// apps; schema 2 adds the forensic types MVT matches natively.
function seal(schemaVersion, selected) {
  const payload = Buffer.from(
    JSON.stringify({
      schemaVersion,
      version,
      issuedAt: now,
      expiresAt: expiry,
      rules: selected,
    }),
  );
  return {
    payload,
    envelope: {
      payload: payload.toString("base64"),
      signature: sign(null, payload, key).toString("base64"),
    },
  };
}
const legacy = seal(
  1,
  unique.filter((r) => LEGACY.has(r.kind)),
);
const full = seal(2, unique);
mkdirSync("src-tauri/resources/intelligence", { recursive: true });
writeFileSync(
  "src-tauri/resources/intelligence/bundle.json",
  JSON.stringify(legacy.envelope) + "\n",
);
writeFileSync(
  "src-tauri/resources/intelligence/bundle-v2.json",
  JSON.stringify(full.envelope) + "\n",
);
writeFileSync("src-tauri/resources/intelligence/public-key.bin", publicRaw);
const byKind = Object.fromEntries(
  [...new Set(unique.map((r) => r.kind))]
    .sort()
    .map((k) => [k, unique.filter((r) => r.kind === k).length]),
);
writeFileSync(
  "intelligence/release.json",
  JSON.stringify(
    {
      version,
      rules: unique.length,
      rulesByKind: byKind,
      legacyRules: unique.filter((r) => LEGACY.has(r.kind)).length,
      omittedUnsupportedPatterns: omitted,
      omittedSharedInfrastructure: omittedShared,
      issuedAt: now,
      expiresAt: expiry,
      publicKeySha256: createHash("sha256").update(publicRaw).digest("hex"),
      payloadSha256: createHash("sha256").update(legacy.payload).digest("hex"),
      payloadV2Sha256: createHash("sha256").update(full.payload).digest("hex"),
      sources: sources.map((s) => ({ url: s.url, sha256: s.sha256 })),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    version,
    rules: unique.length,
    rulesByKind: byKind,
    omittedUnsupportedPatterns: omitted,
    omittedSharedInfrastructure: omittedShared,
  }),
);
