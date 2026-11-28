# How detection works

What Enigm Scan looks for, how it decides what to report, what it cannot see,
and how we check that it detects what it should and warns about nothing else.

## Two kinds of result

- **Detections** are signs of known spyware: a signed indicator found on the
  phone (`mvt.<uuid>` in the report's JSON), or a behaviour that only spyware
  combines (`enigm.behavior.*`), reported with the facts observed.
- **Review points** are things worth a look that ordinary phones can also
  have: apps with surveillance capabilities, look-alike links, profiles able to
  intercept traffic, modified Android systems, unrecognised iPhone process
  locations, known monitoring apps such as parental-control apps
  (`enigm.heuristic.*`, `mvt.heuristic.*`, `watchware.<uuid>`).

Every result says where it was seen, when, how confident it is and what it
does not prove. [REPORT-FORMAT.md](REPORT-FORMAT.md) lists the fields.

## Confidence

Confidence follows the kind of evidence and its age. Exact traces (file
hashes, signing certificates, app and profile identifiers) are high. Domains,
and above all IP addresses, are reassigned over time, so a match loses
confidence as the indicator ages. A match is a sign to interpret, not proof
of an infection.

## What each part covers

- **Indicators.** More than 11,000 domains, IP addresses, file hashes, app
  identifiers and certificates, process names, file names and paths, email
  addresses and configuration profiles, from the public research listed in
  [intelligence/README.md](../intelligence/README.md). They are searched in
  the phone's copy, in MVT's results, in the Android app inventory and open
  connections, in iPhone crash reports and the shutdown log, and in the
  network traffic when it is observed.
- **MVT.** The [Mobile Verification Toolkit](https://github.com/mvt-project/mvt)
  reads the iPhone backup and the Android bug report with its own modules and
  our signed indicators.
- **Android behaviour.** Without root, over USB: how each app was installed,
  whether it hides its icon, the special access it holds (accessibility,
  notifications, device administrator, keyboard, default SMS app, always-on
  VPN), the sensitive permissions it was granted and used in the background,
  and signs of a modified system.
- **iPhone traces.** Crash reports and, with the deep check, the shutdown log
  and the process list of a sysdiagnose, where some spyware has left
  processes running from folders where code never runs.
- **Links and infrastructure.** Look-alike domains in messages and browsing
  history, and hosts on services that spyware without servers of its own
  reports to, checked in with at a steady pace.

## What it cannot see

- **Unknown spyware.** Indicators cover what has been published. Mercenary
  spyware changes its infrastructure often, and public research arrives weeks
  or months after an attack. Behaviour checks narrow the gap; they do not
  close it.
- **What the phone does not keep.** A backup does not hold everything on an
  iPhone, and an encrypted backup holds more than an unencrypted one. Since
  iOS 26 the shutdown log is rewritten at every restart, so it shows less
  history. Without root, an Android phone shares only what `adb` and its bug
  report expose.
- **A quiet phone.** The network check sees only the traffic of the minutes
  it watches.

A clean report means that none of the known signs were found. No tool can
prove that a phone is not being spied on, and the report says so.

## How we check it

`agent/core/tests/corpus/` holds whole cases, run in CI through the same
analyses the app runs, with the signed indicators the app ships
(`agent/core/tests/corpus.rs`):

- phones with known spyware, which must give the detections they list
  (a Pegasus process in the shutdown log, a Predator domain, a stalkerware
  app, a BadBazaar look-alike installed from an APK file, a NoviSpy sample,
  a connection to a spyware server, a hidden app combining spyware powers);
- ordinary phones, which must give no finding at all (the kernel's line in
  the shutdown log, the companies' own domains, manufacturer apps on Samsung
  and Xiaomi phones, a security app's block list).

Every false alarm we correct becomes a case, so it cannot come back. The
corpus is synthetic: it shows that the analysis handles these situations, not
how much spyware is detected on real phones, which needs real devices and
real samples.

## Helping

- A finding that looks wrong: open a
  [false positive issue](https://github.com/enigm-llc/enigm-scan/issues/new?template=false-positive.yml),
  with the finding's title and the kind of evidence, never the report itself.
- Indicators that a public report publishes: open an
  [indicators issue](https://github.com/enigm-llc/enigm-scan/issues/new?template=indicators.yml).
  A maintainer checks each one against the report before it goes into a
  signed release.
- If you think a phone is really targeted, contact a help line such as
  [Access Now's Digital Security Helpline](https://www.accessnow.org/help/).
