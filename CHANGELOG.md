# Changelog

## 0.7.3 — 26 November 2026

- Windows open directly in the system's light or dark appearance, without
  a white frame first, including About.
- The Android guide shows USB debugging being switched on, with room
  around the back arrow.
- A search that finds no phone also says so in a message at the top.
- The text keeps its full width on every step; the phone sits further
  right instead.
- The report's first screen fills the window on every system, so the
  summary starts just below it, where the arrow points, and the result sits
  in the middle of the window.
- The phone itself is centred in the window on every step; its cable and
  the network waves hang outside that measure.
- The report's severity tile looks the same without findings: an empty
  bar and every level at 0. The arrow to the details is a gentle double
  arrow under "See details".
- The progress card's Pause and Cancel are round icon buttons, and what the
  card says fits on one line in every language.
- The closing invitation presents Enigm as protection for messages and
  calls against spyware, and opens enigm.io.

## 0.7.2 — 26 November 2026

- iPhone "Trust" moves to the search step, as Android's USB debugging: the
  iPhone found asks for it, with its passcode, before "All set", which only
  appears once the phone trusts the computer.
- iPhone deep check, prepared on the ready step: ticking it shows the three
  buttons to press, and "Start scan" waits until the phone confirms the
  sysdiagnose. Without the deep check it starts at once.
- When an Android phone does not allow USB debugging in time, the app shows
  it as a refused "Trust" on iPhone: a short message, the phone without
  authorization and what to check.
- If the phone refused "Trust", the checks beside it say to unplug the
  cable and plug it back in, instead of "Enigm Scan open on your computer".
- With "Also check its connections" ticked, on iPhone and Android, quiet
  green waves leave the top of the drawn phone; they stay while the
  connections are observed during the copy.
- The app calls the copy step "Extract", and leaves more room between the
  text and the phone.
- Messages appear at the top of the window and leave on their own: red for
  errors, green for success, neutral otherwise.
- Cancelling a scan resets the app and deletes everything it had copied,
  without a "Scan cancelled" notice.
- On macOS the window's title bar blends into the app, and windows no longer
  flash white while they open.
- About shows the app's name in its colour; Help holds only Documentation.
- The closing invitation shows the full Enigm logo and closes with its round
  button or "Try Enigm".
- A finished report hints that it continues below.

## 0.7.1 — 26 November 2026

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
