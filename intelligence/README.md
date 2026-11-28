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
  `sources/ESET_PROVENANCE.json`;
- Amnesty's phone spyware investigations published as plain lists (Pegasus
  in 2018 and 2019, FinSpy, Donot Team's Android spyware), converted by
  `scripts/intel/amnesty-investigations.mjs`;
- the domains that Emerging Threats Open detects for mobile spyware
  (APT-C-23, Bahamut, RealRAT, PhantomLance, Hawkshaw, NSO and others),
  converted by `scripts/intel/emerging-threats.mjs`, which keeps only spyware
  families, whole domains and rules under ET's BSD licence.

Each source keeps its license and attribution next to it (see
[THIRD-PARTY-LICENSES.txt](../THIRD-PARTY-LICENSES.txt)).

## Daily review

Every morning the workflow `.github/workflows/intelligence-watch.yml` posts
to the open issue labelled `intelligence` what may deserve new indicators:

- what changed upstream in the sources above (`scripts/intel/check-sources.mjs`);
- the indicators published in new public research, found by the research
  worker (`research/`). Every six hours it reads a fixed list of feeds
  (Citizen Lab, Amnesty, Kaspersky, ESET, Google Threat Intelligence, Access
  Now, TechCrunch), asks Claude which indicators of phone spyware each new
  article publishes, each with the sentence it comes from, and keeps only
  those whose sentence is word for word in the article. Its result is
  public, read-only, at
  <https://research.scan.enigm.io/latest.json>.

Nothing in this review changes the indicators the app uses. A maintainer
checks each candidate against its article, adds the accepted ones to a
source here, and builds and signs a release as below. The worker holds no
signing key, and its API key is only a secret of the worker in Cloudflare.

## Building a release

`scripts/build-intelligence.mjs` reads the sources, checks their hashes and
turns the supported indicators into one bundle: domains, IP addresses, file
hashes, app identifiers and certificates, process names, file names and paths,
email addresses and configuration profile identifiers. Each indicator keeps
its threat family and its source. Revoked, expired or not yet valid indicators
are left out, as are addresses of shared infrastructure such as CDNs and
cloud front ends (`shared-infrastructure.json`), which would match ordinary
traffic. Patterns the compiler cannot match exactly are counted and omitted.

A value published by several sources is kept once, with the first source in
`sources/manifest.json`, so one domain never becomes several findings. When
sources disagree, a monitoring app (watchware) wins over stalkerware: the
less alarming reading of the same value.

### Popular domains

A spyware domain is almost never among the most visited on the internet, so
an indicator that is usually points to a mistake upstream: a shared service
or a mainstream app. The compiler compares every domain with the 10,000 most
visited ones of the [Tranco list](https://tranco-list.eu/) and refuses to
sign while one of them has no decision in `reviewed-popular.json`: keep it,
sign it as a monitoring app (a point to review in the app, never a
detection) or leave it out, always with the reason. Customer names on hosting
platforms (`name.zendesk.com`, a cloud storage bucket) belong to one customer
and are not affected. The list is downloaded before each release and is not
kept here:

```sh
curl -fsSLO https://tranco-list.eu/top-1m.csv.zip && unzip -o top-1m.csv.zip
```

### Signing

The app trusts two keys (`src-tauri/resources/intelligence/trusted-keys.bin`):
the signing key and a reserve key that is kept offline, apart from it and
never on the signing computer. If the signing key is ever lost, releases are
signed with the reserve key and installed apps accept them without an
update; a new reserve key then ships with the next version of the app.

The bundle is signed with an Ed25519 key that the maintainers keep offline;
it is never in this repository or in the app. The app accepts a bundle only
if its signature matches one of the keys in
`src-tauri/resources/intelligence/trusted-keys.bin`, it has not expired and
its version is not lower than the one it already has.

With the key on the maintainer's computer, in `.secrets/`:

```sh
node scripts/build-intelligence.mjs --version=2026112601 --days=90 --popular=top-1m.csv
```

Better, with the key on a computer that never connects to anything, or in a
hardware security module that signs Ed25519, the release is prepared here,
signed there and assembled here; the key never touches this computer:

```sh
node scripts/build-intelligence.mjs --prepare --version=2026112601 --days=90 --popular=top-1m.csv
# copy .release/payload-v2.json to the signing computer:
openssl pkeyutl -sign -inkey key.pem -rawin -in payload-v2.json -out payload-v2.sig
# copy the .sig file back next to the payload, then:
node scripts/build-intelligence.mjs --assemble
```

To use a hardware module, check first that it signs Ed25519
(`pkcs11-tool --module <its PKCS#11 library> --list-mechanisms` lists
`EDDSA`): the signature has to be the plain 64-byte Ed25519 signature of the
payload file.

The version is an increasing number (date plus a counter). A release lasts at
most 90 days, so it has to be re-signed before it expires; the
`intelligence-expiry` workflow warns two weeks ahead. On Mondays the same
workflow runs `scripts/intel/check-sources.mjs`, which lists what changed
upstream (pinned files, the inputs of the converted sources, new campaigns
in MVT's index, new Amnesty investigations, the spyware part of Emerging
Threats Open) without changing anything.

### Changing the signing key

1. Create the new key where it will live, and add its 32-byte public key to
   `trusted-keys.bin` (after the current one), and to any other system that
   verifies the bundle.
2. Publish an app release with it. Keep signing with the current key.
3. Once the app versions that only know the current key are no longer in
   use, sign with the new one; the compiler accepts a key only if the app
   trusts it. Then remove the old key everywhere.

`release.json` describes the current release: its version, the number of
indicators by kind, what was omitted and why, and the validity window. The
current release, 2026112601, has 11,669 indicators and expires on
25 February 2027.

## What a match means

The indicators are historical. A domain may change owner, an IP address may
be reused, and some infrastructure is shared. A match is a reason to look
closer, not proof of infection, and no match does not prove that a phone is
clean. The app's report explains this next to every finding.
