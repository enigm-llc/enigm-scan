# Changelog

## 0.7.1 — Unreleased

- Starting a scan no longer freezes the app on macOS. The second consent
  question is gone: the checkbox before searching already confirms that the
  phone is yours or that you have its owner's permission.
- "About Enigm Scan" opens a window laid out like the system's own: the app
  icon, the version, the release date and the copyright.
- Help also opens the documentation.
- Desktop type sizes throughout the app, and a window that opens at 1120 by
  740, the size its content needs.
- The app looks native on each system: the system's typeface (San Francisco,
  Segoe UI, the desktop's font on Linux) and its window greys in light and
  dark, instead of the website's near-black. The app icon is drawn at twice
  its previous resolution.
- Buttons keep their colours under the pointer, and disabled buttons no
  longer react to it.
- The executable and the downloads are named enigm-scan.
- The drawn phone shows "Connected to your computer" without a green dot.
- The website: the questions on How it works have their design back, the
  download page starts with "First, the app", the laptop shows the real app
  icon, and the first visit downloads about 350 kB less.

## 0.7.0 — 26 November 2026

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
