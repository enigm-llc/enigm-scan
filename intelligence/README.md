# Indicators

This folder holds the public research that Enigm Scan's indicators come from,
and the metadata of the signed bundle the app uses.

## Sources

`sources/` keeps every source file unchanged, pinned to an exact commit and
listed with its SHA-256 in `sources/manifest.json`:

- the indicator collections published with MVT (Predator, Candiru, Operation
  Triangulation, RCS Lab, KingSpawn, WyrmSpy and DragonEgg, EagleMsgSpy and
  later ones);
- Amnesty International Security Lab's investigations (Pegasus, Android
  campaigns, Wintego Helios, NoviSpy);
- Echap's stalkerware indicators;
- Android espionage families from ESET Research's public IOCs (AridSpy,
  BadBazaar, VajraSpy, GravityRAT and others), converted to STIX by
  `scripts/intel/eset-android.mjs` with its inputs recorded in
  `sources/ESET_PROVENANCE.json`.

Each source keeps its license and attribution next to it (see
[THIRD-PARTY-LICENSES.txt](../THIRD-PARTY-LICENSES.txt)).

## Building a release

`scripts/build-intelligence.mjs` reads the sources, checks their hashes and
turns the supported indicators into one bundle: domains, IP addresses, file
hashes, app identifiers and certificates, process names, file names and paths,
email addresses and configuration profile identifiers. Each indicator keeps
its threat family and its source. Revoked, expired or not yet valid indicators
are left out, as are addresses of shared infrastructure such as CDNs and
cloud front ends (`shared-infrastructure.json`), which would match ordinary
traffic. Patterns the compiler cannot match exactly are counted and omitted.

The bundle is signed with an Ed25519 key that the maintainers keep offline;
it is never in this repository or in the app. The app embeds the matching
public key and accepts a bundle only if its signature is valid, it has not
expired and its version is not lower than the one it already has:

```sh
node scripts/build-intelligence.mjs --version=2026112502
```

The version is an increasing number (date plus a counter). A release lasts at
most 90 days, so it has to be re-signed before it expires; the
`intelligence-expiry` workflow warns two weeks ahead.

`release.json` describes the current release: its version, the number of
indicators by kind, what was omitted and why, and the validity window. The
current release, 2026112502, has 11,323 indicators and expires on
23 February 2027.

## What a match means

The indicators are historical. A domain may change owner, an IP address may
be reused, and some infrastructure is shared. A match is a reason to look
closer, not proof of infection, and no match does not prove that a phone is
clean. The app's report explains this next to every finding.
