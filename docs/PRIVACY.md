# Privacy

Enigm Scan is built so that the contents of a phone never leave the computer
the scan runs on. This page lists everything the app reads, keeps and sends.

## What stays on the computer

- **The copy of the phone.** An iPhone backup (personal photos and videos are
  skipped as they arrive) or an Android bug report, plus the app inventory and
  settings read over adb. It lives in a private temporary folder for the
  duration of the scan and is deleted when the analysis ends. The report says
  whether the deletion completed.
- **The report.** It is kept in the app's memory until you close the session
  or the app. It is written to disk only if you save it as a PDF or JSON file,
  in a place you choose. Saved files are not deleted by the app.
- **The network check** (optional). On iPhone, two minutes of the phone's own
  traffic are captured into the same temporary folder and deleted with it. On
  Android, only the addresses of the open connections are read.

## What the app keeps between sessions

In the app's data folder, the latest verified indicator bundle
(`intelligence.json`) and the number of the newest bundle seen, which stops an
older bundle from being installed again. Nothing about the phones you scanned
is kept.

The window's browser profile, the scan folder and the private adb folder are
temporary. They are deleted when the app closes; if the app was killed, the
next start deletes them.

## Trust and authorisations

- **iPhone.** "Trust This Computer" creates a pairing that the app keeps only
  in memory; it is not saved in the system's pairing store and the app revokes
  it when the scan ends.
- **Android.** The app runs its own adb server with keys stored in its private
  temporary folder, so they disappear with the session. Android itself
  remembers that it allowed USB debugging from this computer: you can remove
  that in Developer options › Revoke USB debugging authorisations, and turn
  USB debugging off when you are done.

The operating system may keep its own records of connected USB devices and of
the app having run. Enigm Scan does not claim to leave no trace on the
computer.

## What the app sends

One request: at start, it downloads the newest signed indicator bundle from
`https://scan.enigm.io/downloads/intelligence-v2.json`. The request contains no
phone data, no identifier and no report. The server keeps an anonymous count
of these requests, described in [STATISTICS.md](STATISTICS.md).

Links you open from the app (help pages, the sources of a finding) open in
your browser, as normal web visits.

The app has no analytics, crash reporting or telemetry.

## The website

scan.enigm.io stores only your language and appearance choice in the browser.
It counts complete downloads anonymously, as described in
[STATISTICS.md](STATISTICS.md), and never receives anything from the app or
from a phone.
