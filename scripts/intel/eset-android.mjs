// Converts ESET Research's published indicators for Android espionage
// families into a STIX 2.1 bundle that build-intelligence.mjs compiles.
//
//   git clone https://github.com/eset/malware-ioc && git -C malware-ioc checkout <COMMIT>
//   node scripts/intel/eset-android.mjs --source=malware-ioc
//
// Offline and deterministic: the same checkout always produces the same
// bytes. Only exact values ESET lists are used: APK SHA-256 from
// samples.sha256, domains and IPs from the network sections, and app IDs that
// were reviewed by hand (trojanised copies of legitimate apps reuse the real
// app ID, which must never become an indicator). Infrastructure shared by
// unrelated customers (CDN and cloud front ends, hosting platforms) is
// omitted, see intelligence/shared-infrastructure.json.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { gitHead } from "./git-head.mjs";
import { BlockList, isIP } from "node:net";

const COMMIT = "8921a81d245cce3f9b7a199b123d221ed8f1fe33";
const REPO = "https://github.com/eset/malware-ioc";
const OUTPUT = "intelligence/sources/eset_android_espionage.stix2";

// Publication dates are the commits that added each directory.
const FAMILIES = [
  {
    dir: "aridspy",
    name: "AridSpy",
    actor: "Arid Viper (APT-C-23)",
    date: "2024-06-12",
    about:
      "Android spyware distributed in trojanised messaging and job-search apps",
  },
  // The two distribution-website IPs are shared web hosting: omitted.
  {
    dir: "gref",
    name: "BadBazaar",
    actor: "GREF (China-aligned)",
    date: "2023-08-30",
    about:
      "Android espionage tool in patched Signal and Telegram apps (Signal Plus, FlyGram)",
    apps: ["org.thoughtcrime.securesmsplus", "org.telegram.FlyGram"],
    skip: ["82.180.174.230", "156.67.73.71"], // NOSONAR: reviewed indicators, never contacted
  },
  {
    dir: "vajraspy",
    name: "VajraSpy",
    actor: "Patchwork",
    date: "2024-01-29",
    about: "Android espionage apps posing as messaging and news apps",
  },
  {
    dir: "prospytospy",
    name: "ProSpy and ToSpy",
    actor: "unattributed, targeting the UAE",
    date: "2025-09-30",
    about: "Android spyware posing as Signal and ToTok plug-ins",
  },
  {
    dir: "kamran",
    name: "Kamran",
    actor: "unattributed, targeting Gilgit-Baltistan",
    date: "2023-11-08",
    about: "Android spyware in a news app for Urdu speakers",
    apps: ["com.kamran.hunzanews"],
  },
  {
    dir: "gravityrat",
    name: "GravityRAT",
    actor: "GravityRAT operators",
    date: "2023-05-22",
    about:
      "Android spyware posing as messaging apps that steals WhatsApp backups",
    apps: ["eu.siacs.bingechat", "eu.siacs.chatico"],
  },
  {
    dir: "ghostchat",
    name: "GhostChat",
    actor: "unattributed, targeting Pakistan",
    date: "2026-01-23",
    about: "Android spyware posing as a dating app",
  },
  {
    dir: "promptspy",
    name: "PromptSpy",
    actor: "unattributed",
    date: "2026-02-20",
    about:
      "Android spyware that uses a generative AI model to automate the phone",
  },
  {
    dir: "evilvideo",
    name: "EvilVideo payload",
    actor: "unattributed",
    date: "2024-07-22",
    about: "Android malware delivered through a Telegram video exploit",
  },
  {
    dir: "spyloan",
    name: "SpyLoan",
    actor: "predatory lenders",
    date: "2023-12-01",
    about:
      "Android loan apps that harvest contacts, messages and photos to extort borrowers",
  },
  // Its C&C were legitimate Korean websites compromised by the attackers:
  // their domains would flag ordinary visitors, so only hashes are used.
  {
    dir: "scarcruft",
    name: "BirdCall",
    actor: "ScarCruft (APT37)",
    date: "2022-11-28",
    about: "Android spyware in trojanised games",
    network: false,
  },
];

const source = process.argv
  .slice(2)
  .find((a) => a.startsWith("--source="))
  ?.split("=")[1];
if (!source || !existsSync(`${source}/LICENSE`))
  throw new Error("Provide --source=<checkout of eset/malware-ioc>");
const head = gitHead(source);
if (head !== COMMIT)
  throw new Error(`Expected ESET commit ${COMMIT}, found ${head}`);

const shared = JSON.parse(
  readFileSync("intelligence/shared-infrastructure.json", "utf8"),
);
const blocked = new BlockList();
for (const range of shared.ipRanges)
  for (const cidr of range.cidrs) {
    const [net, bits] = cidr.split("/");
    blocked.addSubnet(net, Number(bits), isIP(net) === 6 ? "ipv6" : "ipv4");
  }
// A platform itself; customer subdomains of it remain specific indicators.
const sharedDomain = (d) => shared.domains.includes(d);
const domainShape = (v) =>
  v.length <= 253 &&
  /\.[a-z]{2,}$/.test(v) &&
  v.split(".").every((s) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s));

const uuid = (text) => {
  const h = createHash("sha256").update(text).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const inputs = [];
const read = (path) => {
  const bytes = readFileSync(`${source}/${path}`);
  inputs.push({
    path,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  return bytes.toString("utf8");
};

/** Drops the punctuation that ends a sentence after a domain. */
const trimPunctuation = (text) => {
  let end = text.length;
  while (end > 0 && ".,;:".includes(text[end - 1])) end--;
  return text.slice(0, end);
};
const objects = [];
const omitted = { sharedInfrastructure: [], reviewed: [], unparsable: 0 };
for (const family of FAMILIES) {
  const created = `${family.date}T00:00:00.000Z`;
  const familyKey = `eset:${family.dir}`;
  const malwareId = `malware--${uuid(familyKey)}`;
  const reference = {
    source_name: "ESET Research",
    url: `${REPO}/tree/${COMMIT}/${family.dir}`,
  };
  objects.push({
    type: "malware",
    spec_version: "2.1",
    id: malwareId,
    created,
    modified: created,
    name: family.name,
    description: `${family.about}. Attributed by ESET to ${family.actor}.`,
    is_family: true,
    external_references: [reference],
  });
  const values = new Map();
  const add = (kind, value) => values.set(`${kind}\0${value}`, { kind, value });
  for (const line of read(`${family.dir}/samples.sha256`).split("\n")) {
    const v = line.trim().toLowerCase();
    if (/^[0-9a-f]{64}$/.test(v)) add("sha256", v);
    else if (v) omitted.unparsable++;
  }
  const readme = read(`${family.dir}/README.adoc`);
  const start = readme.search(/^== Network/im);
  const network =
    family.network === false || start < 0 ? "" : readme.slice(start);
  for (const raw of network.split(/[\s|`'"]+/)) {
    const cleaned = raw
      .replaceAll("[.]", ".")
      .replace(/^h(xx|tt)ps?\[?:\]?\/\//i, "")
      .replace(/^https?:\/\//i, "")
      .split("/")[0];
    const token = trimPunctuation(cleaned).toLowerCase();
    if (!token.includes(".") || /^\d{4}-\d{2}-\d{2}$/.test(token)) continue;
    if (family.skip?.includes(token)) {
      omitted.reviewed.push(`${family.dir}: ${token}`);
      continue;
    }
    const ipKind = isIP(token);
    if (ipKind) {
      if (blocked.check(token, ipKind === 6 ? "ipv6" : "ipv4"))
        omitted.sharedInfrastructure.push(`${family.dir}: ${token}`);
      else add("ip", token);
    } else if (domainShape(token)) {
      if (sharedDomain(token))
        omitted.sharedInfrastructure.push(`${family.dir}: ${token}`);
      else add("domain", token);
    }
  }
  for (const app of family.apps ?? []) add("app_id", app);
  const patterns = {
    sha256: (v) => `[file:hashes.sha256 = '${v}']`,
    ip: (v) => `[${isIP(v) === 6 ? "ipv6" : "ipv4"}-addr:value = '${v}']`,
    domain: (v) => `[domain-name:value = '${v}']`,
    app_id: (v) => `[app:id = '${v}']`,
  };
  for (const { kind, value } of [...values.values()].sort((a, b) =>
    `${a.kind}${a.value}`.localeCompare(`${b.kind}${b.value}`, "en"),
  )) {
    const indicatorKey = `${familyKey}:${kind}:${value}`;
    const id = `indicator--${uuid(indicatorKey)}`;
    const relationKey = `${id}:${malwareId}`;
    objects.push(
      {
        type: "indicator",
        spec_version: "2.1",
        id,
        created,
        modified: created,
        valid_from: created,
        indicator_types: ["malicious-activity"],
        pattern_type: "stix",
        pattern: patterns[kind](value),
        name: `${family.name} ${kind}`,
        external_references: [reference],
      },
      {
        type: "relationship",
        spec_version: "2.1",
        id: `relationship--${uuid(relationKey)}`,
        created,
        modified: created,
        relationship_type: "indicates",
        source_ref: id,
        target_ref: malwareId,
      },
    );
  }
}
const bundle = {
  type: "bundle",
  id: `bundle--${uuid("eset:" + COMMIT)}`,
  objects,
};
writeFileSync(OUTPUT, JSON.stringify(bundle, null, 1) + "\n");
writeFileSync(
  "intelligence/sources/ESET_PROVENANCE.json",
  JSON.stringify(
    { repository: REPO, commit: COMMIT, inputs, omitted },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    output: OUTPUT,
    sha256: createHash("sha256").update(readFileSync(OUTPUT)).digest("hex"),
    indicators: objects.filter((o) => o.type === "indicator").length,
    omitted,
  }),
);
