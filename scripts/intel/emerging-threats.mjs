// Converts the domains that Emerging Threats Open (ET Open) detects for mobile
// spyware into a STIX 2.1 bundle that build-intelligence.mjs compiles.
//
//   curl -fsSLO https://rules.emergingthreats.net/open/suricata-7.0/rules/emerging-mobile_malware.rules
//   curl -fsSLO https://rules.emergingthreats.net/open/suricata-7.0/LICENSE
//   node scripts/intel/emerging-threats.mjs --source=<folder with both files>
//
// With --check it writes nothing and lists the spyware domains a newer
// download would add or remove (scripts/intel/check-sources.mjs uses it).
//
// ET's mobile ruleset also covers banking trojans, adware and SMS fraud; only
// the spyware families listed below are kept. A rule counts when it matches a
// whole domain (a DNS question, a TLS server name or an HTTP host anchored at
// both ends), never a fragment. Only rules under ET's BSD licence (sids
// 2000000-2799999) are used. Offline and deterministic: the same input
// always produces the same bytes.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

// Sorts text by code unit, the order Array.prototype.sort uses by default.
const byText = (a, b) => (a > b) - (a < b);
const OUTPUT = "intelligence/sources/et_open_mobile_spyware.stix2";
const PROVENANCE = "intelligence/sources/ET_OPEN_PROVENANCE.json";
const RULES = "emerging-mobile_malware.rules";
const URL = `https://rules.emergingthreats.net/open/suricata-7.0/rules/${RULES}`;
// The ruleset as reviewed (downloaded 26 November 2026). A newer download
// changes this hash and must be reviewed before it is used.
const EXPECTED =
  "a0c2bb8c49f1ac49fa9255e293d22d00cd1ad510e93c624a2b87b7e4d2f2307b";

// Families, matched on the rule's message. Order matters: the first match
// names the family.
const FAMILIES = [
  [
    /\bNSO\b|Pegasus/i,
    "Pegasus",
    "Mercenary spyware sold by NSO Group to governments",
  ],
  [
    /Predator|Cytrox|Intellexa/i,
    "Predator",
    "Mercenary spyware sold by Intellexa (Cytrox) to governments",
  ],
  [/Hermit/i, "Hermit", "Spyware sold by RCS Lab to governments"],
  [
    /Triangulation/i,
    "Operation Triangulation",
    "Zero-click iPhone spyware found by Kaspersky",
  ],
  [
    /Bahamut/i,
    "Bahamut",
    "Espionage group spreading iPhone and Android spyware",
  ],
  [
    /APT-C-23/i,
    "APT-C-23",
    "Espionage group (Arid Viper) spreading Android spyware in fake chat apps",
  ],
  [/Realrat/i, "RealRAT", "Android spyware targeting Iranian users"],
  [
    /PHANTOMLANCE/i,
    "PhantomLance",
    "Android spyware campaign attributed to OceanLotus",
  ],
  [/Hawkshaw/i, "Hawkshaw", "Android spyware family sold as a service"],
  [/Glancelove/i, "GlanceLove", "Android spyware in fake dating apps"],
  [/Femas/i, "Femas", "Android spyware family"],
  [/GolfSpy/i, "GolfSpy", "Android spyware campaign targeting the Middle East"],
  [
    /Bitter/i,
    "AndroRAT (Bitter)",
    "Android spyware used by the Bitter espionage group",
  ],
  [
    /Origami|Donot/i,
    "Origami (Donot Team)",
    "Android spyware used by the Donot Team espionage group",
  ],
  [
    /LittleLooter|Charming Kitten|APT33/i,
    "LittleLooter",
    "Android spyware used by Charming Kitten",
  ],
  [
    /Kimsuky|AppleSeed/i,
    "AppleSeed (Kimsuky)",
    "Spyware used by the Kimsuky espionage group",
  ],
  [
    /MOONSHINE/i,
    "MOONSHINE",
    "Android spyware targeting Uyghur and Tibetan communities",
  ],
  [
    /Fancy Bear|XAGENT|Pawn Storm/i,
    "X-Agent (Fancy Bear)",
    "Spyware used by the Fancy Bear espionage group",
  ],
  [/Xsser/i, "Xsser", "iPhone spyware targeting protesters in Hong Kong"],
  [
    /SpyLoan/i,
    "SpyLoan",
    "Loan apps that harvest contacts, messages and photos to extort borrowers",
  ],
  [
    /PROJECTSPY|PHONEMONITOR|Feabme|Spy\.Agent|Trojan-Spy/i,
    "Android spyware",
    "Android spyware family named by its detection",
  ],
];
// Families ET files under mobile malware that are fraud rather than spying.
const NOT_SPYWARE = /bank|SmsSpy|SMS(Send|Thief)|ransom|adware|joker|dropper/i;
// Reviewed by hand: services in their own right, not spyware infrastructure.
const REVIEWED = new Set(["new.filetea.me"]);

const source = process.argv
  .slice(2)
  .find((a) => a.startsWith("--source="))
  ?.split("=")[1];
if (
  !source ||
  !existsSync(`${source}/${RULES}`) ||
  !existsSync(`${source}/LICENSE`)
)
  throw new Error(`Provide --source=<folder with ${RULES} and LICENSE>`);
const bytes = readFileSync(`${source}/${RULES}`);
const sha256 = createHash("sha256").update(bytes).digest("hex");
const check = process.argv.includes("--check");
if (!check && sha256 !== EXPECTED)
  throw new Error(
    `Expected ruleset ${EXPECTED}, found ${sha256}: review the new rules first`,
  );
const license = readFileSync(`${source}/LICENSE`, "utf8");
if (
  !/sids 2000000 through 2799999 are from Emerging Threats and are covered under the BSD License/.test(
    license,
  )
)
  throw new Error(
    "ET's licence terms changed: review them before using the rules",
  );

const shared = JSON.parse(
  readFileSync("intelligence/shared-infrastructure.json", "utf8"),
);
const domainShape = (v) =>
  v.length <= 253 &&
  /\.[a-z]{2,63}$/.test(v) &&
  v.split(".").every((s) => /^[a-z0-9](?:[a-z0-9_-]{0,61}[a-z0-9])?$/.test(s));
const uuid = (text) => {
  const h = createHash("sha256").update(text).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const byFamily = new Map();
const omitted = {
  license: 0,
  notSpyware: 0,
  notWholeDomain: 0,
  sharedInfrastructure: [],
  reviewed: [],
};
for (const line of bytes.toString("utf8").split("\n")) {
  if (!line.startsWith("alert ")) continue;
  const msg = line.match(/msg:"([^"]+)"/)?.[1] ?? "";
  const sid = Number(line.match(/\bsid:(\d+);/)?.[1]);
  if (!(sid >= 2000000 && sid <= 2799999)) {
    omitted.license++;
    continue;
  }
  const family = FAMILIES.find(([pattern]) => pattern.test(msg));
  if (!family || NOT_SPYWARE.test(msg)) {
    omitted.notSpyware++;
    continue;
  }
  // The buffer holding a name (current or older keyword), an optional
  // dotprefix, and the content with what anchors it at the end: endswith,
  // an exact size or no data after it.
  const m = line.match(
    /\b(?:dns[._]query|tls[._]sni|http[._]host);\s*(dotprefix;\s*)?content:"([^"]+)";([^;]*;){0,4}/,
  );
  const value = m?.[2].toLowerCase().replace(/^\./, "");
  const options = m?.[0] ?? "";
  const size = m && new RegExp(String.raw`\bbsize:\s*${m[2].length}\s*;`);
  const whole =
    m &&
    (/\bendswith;/.test(options) ||
      /\bisdataat:!1,relative;/.test(options) ||
      size.test(options) ||
      size.test(line));
  if (!whole || !domainShape(value)) {
    omitted.notWholeDomain++;
    continue;
  }
  if (shared.domains.includes(value)) {
    omitted.sharedInfrastructure.push(value);
    continue;
  }
  if (REVIEWED.has(value)) {
    omitted.reviewed.push(value);
    continue;
  }
  const created = line.match(/created_at (\d{4})_(\d{2})_(\d{2})/);
  const date = created
    ? `${created[1]}-${created[2]}-${created[3]}`
    : "2010-01-01";
  const [, name, about] = family;
  const entry = byFamily.get(name) ?? {
    name,
    about,
    first: date,
    values: new Map(),
  };
  if (date < entry.first) entry.first = date;
  const known = entry.values.get(value);
  if (!known || date < known.date) entry.values.set(value, { date, sid });
  byFamily.set(name, entry);
}

if (check) {
  const current = new Set(
    JSON.parse(readFileSync(OUTPUT, "utf8"))
      .objects.filter((o) => o.type === "indicator")
      .map((o) => o.pattern.match(/'([^']+)'/)[1]),
  );
  const next = new Set(
    [...byFamily.values()].flatMap((family) => [...family.values.keys()]),
  );
  const added = [...next].filter((d) => !current.has(d)).sort(byText);
  const removed = [...current].filter((d) => !next.has(d)).sort(byText);
  console.log(JSON.stringify({ sha256, added, removed }));
  process.exit(0);
}
const objects = [];
for (const family of [...byFamily.values()].sort((a, b) =>
  a.name.localeCompare(b.name, "en"),
)) {
  const created = `${family.first}T00:00:00.000Z`;
  const familyKey = `et-open:${family.name}`;
  const malwareId = `malware--${uuid(familyKey)}`;
  objects.push({
    type: "malware",
    spec_version: "2.1",
    id: malwareId,
    created,
    modified: created,
    name: family.name,
    description: `${family.about}. Detected by Emerging Threats Open.`,
    is_family: true,
    external_references: [{ source_name: "Emerging Threats Open", url: URL }],
  });
  for (const [value, { date, sid }] of [...family.values].sort(([a], [b]) =>
    a.localeCompare(b, "en"),
  )) {
    const at = `${date}T00:00:00.000Z`;
    const indicatorKey = `et-open:${value}`;
    const id = `indicator--${uuid(indicatorKey)}`;
    const relationKey = `${id}:${malwareId}`;
    objects.push(
      {
        type: "indicator",
        spec_version: "2.1",
        id,
        created: at,
        modified: at,
        valid_from: at,
        indicator_types: ["malicious-activity"],
        pattern_type: "stix",
        pattern: `[domain-name:value = '${value}']`,
        name: `${family.name} domain (ET sid ${sid})`,
        external_references: [
          {
            source_name: "Emerging Threats Open",
            url: URL,
            external_id: String(sid),
          },
        ],
      },
      {
        type: "relationship",
        spec_version: "2.1",
        id: `relationship--${uuid(relationKey)}`,
        created: at,
        modified: at,
        relationship_type: "indicates",
        source_ref: id,
        target_ref: malwareId,
      },
    );
  }
}
writeFileSync(
  OUTPUT,
  JSON.stringify(
    { type: "bundle", id: `bundle--${uuid("et-open:" + sha256)}`, objects },
    null,
    1,
  ) + "\n",
);
omitted.sharedInfrastructure.sort(byText);
writeFileSync(
  PROVENANCE,
  JSON.stringify(
    {
      source: URL,
      sha256,
      families: [...byFamily.keys()].sort(byText),
      omitted,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    output: OUTPUT,
    sha256: createHash("sha256").update(readFileSync(OUTPUT)).digest("hex"),
    rules: sha256,
    indicators: objects.filter((o) => o.type === "indicator").length,
    families: byFamily.size,
  }),
);
