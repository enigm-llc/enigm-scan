# Local report contract v1

Canonical runtime schema: `src/core/report.ts`. Unknown fields/versions are rejected. Limits: 5 MiB encoded file; 300 checks; 500 findings; 2,000 characters per narrative field. Counts are nonnegative safe integers. A valid imported file is **not authenticated**.

Fields: `schemaVersion: 1`, ISO `startedAt` and `finishedAt`, `device: ios | android`, integer `artifactsAnalyzed` and `networkConnections`, arrays `checks`, `findings`, `limitations`, `engines`, string `ruleBundleVersion`, `cleanup: not_started | partial | completed`.

Checks: `id`, `name`, `status: completed | skipped | unsupported | failed`, `detail`.

Findings: `id`, `category`, `source`, `evidence`, `severity: informational | low | medium | high | critical`, `confidence: low | medium | high`, nullable ISO `timestamp`, `rule`, `ruleVersion`, nonempty `limitations`, `recommendation`.

Detections and review points are told apart by `rule`. Detections: a signed indicator (`mvt.<uuid>`) or a behavioural detection (`enigm.behavior.*`: an Android app combining concealment with spyware capabilities, or an iPhone executable running from a folder where code never runs, reported with the observed facts). Review points: `mvt.heuristic.*`, `enigm.heuristic.*` (apps with surveillance capabilities, modified Android systems, look-alike links and domains, iPhone profiles able to intercept traffic, unrecognised iPhone process locations, repeated iMessage parser crashes, proxies and private DNS) and `watchware.<uuid>` (known monitoring apps such as parental-control or location-sharing apps, often installed knowingly). Reports from 0.6.4 and earlier used `mvt.<24 hex>` for MVT heuristics. Since rules 2026112502, indicator evidence ends with the threat family (`— Pegasus`, `— mSpy (stalkerware)`).

Engine entries: `name`, `version`. IDs are unique per array; timestamps ordered. Nonzero counts/findings require at least one completed check. This is structural validation, not proof of truthful provenance.

Synthetic fixtures live only in tests. Finish removes the active report from React state but cannot guarantee erasure of process memory or downloaded files. JSON preserves accepted fields. PDF is a human-readable rendering, not a signed evidence container. Its built-in fonts target the six Western European UI languages; arbitrary evidence scripts may not render faithfully, so retain JSON for exact Unicode evidence.
