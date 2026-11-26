# Changelog

## 0.7.0 — Unreleased

The whole scan now happens in the desktop app. The website explains Enigm
Scan and offers the downloads; it no longer connects to the app.

- One app window for the whole scan: connect, choose options, copy, analyse
  and read the report, with no page chrome. The app follows the system's
  language and appearance; on macOS its menu (About, Help, Quit) is in the
  system's menu bar.
- A new app icon, the Enigm symbol on a radar, and a
  welcome screen with one button to start scanning a phone.
- Closing the app deletes the report and the temporary copy, then shows the
  Enigm invitation, which no longer appears inside the report.
- The app no longer opens a local port for the browser, and links open in the
  system browser.
- iPhone deep check: chosen before the scan. After "Trust", the copy waits
  until the phone confirms that the sysdiagnose has started (or you continue
  without it), so a short copy no longer leaves too little time.
- Android: reading the open connections is now an option, on by default, like
  the network check on iPhone.
- Reports are saved with their date and time in the file name.
- Temporary folders are locked while in use and removed at exit, or at the next
  start if the app was killed.
- The app starts correctly when its path goes through a symbolic link (for
  example a disk image mounted under /tmp on macOS).

## 0.6 — November 2026

Earlier test releases, used from the browser together with a small local app:
iPhone and Android acquisition over USB, MVT analysis, signed indicators,
Android behaviour analysis, iPhone crash reports and shutdown log, the optional
iPhone network check, and PDF reports in six languages.
