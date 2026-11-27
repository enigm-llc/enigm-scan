// Converts the phone spyware investigations of Amnesty International's
// Security Lab that are published as plain lists (not STIX) into a STIX 2.1
// bundle that build-intelligence.mjs compiles.
//
//   git clone https://github.com/AmnestyTech/investigations && git -C investigations checkout <COMMIT>
//   node scripts/intel/amnesty-investigations.mjs --source=investigations
//
// Only domains and file hashes are used. The IP addresses of these
// investigations are several years old: servers rented by the hour are
// reassigned, and an old address would point at someone else today.
// Offline and deterministic: the same checkout always produces the same bytes.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { gitHead } from "./git-head.mjs";

const COMMIT = "3d8f248a0d015f183724ae7d096a5c46a8bb5fc7";
const REPO = "https://github.com/AmnestyTech/investigations";
const OUTPUT = "intelligence/sources/amnesty_phone_spyware.stix2";
const PROVENANCE = "intelligence/sources/AMNESTY_PROVENANCE.json";

const INVESTIGATIONS = [
  {
    dir: "2018-08-01_nso",
    name: "Pegasus",
    date: "2018-08-01",
    about:
      "Mercenary spyware sold by NSO Group, used against an Amnesty staff member and a Saudi activist",
    files: [{ path: "indicators.csv", column: "domain_name" }],
  },
  {
    dir: "2019-10-10_nso_morocco",
    name: "Pegasus",
    date: "2019-10-10",
    about:
      "Mercenary spyware sold by NSO Group, used against Moroccan human rights defenders",
    files: [{ path: "domains.txt" }],
  },
  {
    dir: "2020-09-25_finfisher",
    name: "FinSpy",
    date: "2020-09-25",
    about:
      "Spyware sold by FinFisher to governments, found against Egyptian civil society",
    files: [{ path: "domains.txt" }, { path: "sha256.csv", column: "sha256" }],
  },
  {
    dir: "2021-10-07_donot",
    name: "Donot Team spyware",
    date: "2021-10-07",
    about:
      "Android spyware made by an Indian company and used against activists in Togo",
    files: [{ path: "domains.txt" }, { path: "sha256.txt" }],
  },
];

const source = process.argv
  .slice(2)
  .find((a) => a.startsWith("--source="))
  ?.split("=")[1];
if (!source || !existsSync(`${source}/README.md`))
  throw new Error("Provide --source=<checkout of AmnestyTech/investigations>");
const head = gitHead(source);
if (head !== COMMIT)
  throw new Error(`Expected Amnesty commit ${COMMIT}, found ${head}`);

const shared = JSON.parse(
  readFileSync("intelligence/shared-infrastructure.json", "utf8"),
);
const domainShape = (v) =>
  v.length <= 253 &&
  /\.[a-z]{2,63}$/.test(v) &&
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
/** Values of a plain list, or of one column of a CSV with a header. */
function values(text, column) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (!column) return lines;
  const header = lines
    .shift()
    .split(",")
    .map((h) => h.replaceAll('"', "").trim());
  const at = header.indexOf(column);
  if (at < 0) throw new Error(`Column ${column} missing`);
  return lines.map((l) => (l.split(",")[at] ?? "").replaceAll('"', "").trim());
}

const objects = [];
const omitted = { sharedInfrastructure: [], unparsable: 0 };
for (const investigation of INVESTIGATIONS) {
  const created = `${investigation.date}T00:00:00.000Z`;
  const investigationKey = `amnesty:${investigation.dir}`;
  const malwareId = `malware--${uuid(investigationKey)}`;
  const reference = {
    source_name: "Amnesty International Security Lab",
    url: `${REPO}/tree/${COMMIT}/${investigation.dir}`,
  };
  objects.push({
    type: "malware",
    spec_version: "2.1",
    id: malwareId,
    created,
    modified: created,
    name: investigation.name,
    description: `${investigation.about}.`,
    is_family: true,
    external_references: [reference],
  });
  const found = new Map();
  for (const file of investigation.files)
    for (const raw of values(
      read(`${investigation.dir}/${file.path}`),
      file.column,
    )) {
      const value = raw.toLowerCase().replace(/\.$/, "");
      if (/^[0-9a-f]{64}$/.test(value))
        found.set(`sha256\0${value}`, ["sha256", value]);
      else if (domainShape(value)) {
        if (shared.domains.includes(value))
          omitted.sharedInfrastructure.push(`${investigation.dir}: ${value}`);
        else found.set(`domain\0${value}`, ["domain", value]);
      } else omitted.unparsable++;
    }
  for (const [kind, value] of [...found.values()].sort(([a, x], [b, y]) =>
    `${a}${x}`.localeCompare(`${b}${y}`, "en"),
  )) {
    const indicatorKey = `${investigationKey}:${kind}:${value}`;
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
        pattern:
          kind === "sha256"
            ? `[file:hashes.sha256 = '${value}']`
            : `[domain-name:value = '${value}']`,
        name: `${investigation.name} ${kind}`,
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
writeFileSync(
  OUTPUT,
  JSON.stringify(
    { type: "bundle", id: `bundle--${uuid("amnesty:" + COMMIT)}`, objects },
    null,
    1,
  ) + "\n",
);
writeFileSync(
  PROVENANCE,
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
