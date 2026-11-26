# Changelog

## Unreleased

- When a newer version is published on the website, the app says so at
  start, in place of the welcome screen, with a button to its download page.
  It never downloads or installs anything itself.
- A deeper network check. On iPhone the traffic is watched while the copy
  runs (at least 2 minutes, up to 15), keeps only the headers and what the
  analysis reads of each packet (up to 256 MB, millions of packets, so
  downloads no longer cut it short), resumes if the phone ends it early,
  and the report says how long it lasted and why it ended. The servers that
  encrypted connections announce, and the hosts of unencrypted requests, are
  compared with the indicators too, so encrypted DNS no longer hides them;
  connections repeated at a steady pace to an address never looked up by
  name are points to review; and the report
  says when encrypted DNS or iCloud Private Relay hide the lookups. On
  Android, apps installed outside the stores or acting like spyware that send
  a lot of data in the background are points to review.
- Spyware without servers of its own is found by where it reports: services
  that keep what is sent to them, web traffic through tunnels that expose a
  computer to the internet, and dynamic DNS names the phone checks in with at
  a steady pace, as remote access tools do. Home servers, smart homes and game
  servers on those services are not reported. A link to one in a message is
  a point to review, and an Android proxy on one is reported as high.
- On iPhone, the deep check also reads the processes running when the
  sysdiagnose was created, so spyware running from folders where iOS never
  runs code is found even if it never delayed a reboot or crashed. A
  jailbroken iPhone is reported, as a rooted Android phone is.
- On Android, an app installed from a computer over USB (ADB), as police
  and border spyware is, with its icon hidden and special access, is shown
  as spyware behaviour, and so is a hidden app following the location in the
  background.
- Fewer false alarms: genuine Google, Huawei and Honor apps installed from an
  APK file no longer count as imitating the system; Apple's own programs that
  share a name with a spyware process are recognised by where they run; iOS
  update components and TestFlight betas are not points to review; phones
  that leave the factory signed with test keys are a low point to review.
- iPhone's Lockdown Mode is reported as a check, on or off, and is no longer
  shown as a point to review: it is Apple's strongest protection against
  spyware, not a sign of it. Configuration profiles being installed or
  removed are routine too; the profiles themselves are still checked.
- Evidence of suspicious links, iPhone processes and app behaviour is shown
  in the report's language.
- More indicators: Amnesty's investigations into Pegasus (2018 and 2019),
  FinSpy and Donot Team's Android spyware, and the mobile spyware domains
  detected by Emerging Threats Open (APT-C-23, Bahamut, RealRAT,
  PhantomLance and others). A value published by several sources now gives
  one finding, not several. The new indicators reach the app with the next
  signed release.
- Apple's own notice of a mercenary spyware attack, received in Messages, is
  a critical detection instead of a point to review.
- Each indicator match has its own confidence: exact traces (file hashes,
  signing certificates, app and profile identifiers) are high; domains and
  above all IP addresses lose confidence with age, and an old one says it may
  belong to someone else today.
- Indicators on the most visited domains are reviewed by hand before each
  release: an analytics service used by thousands of apps and the shared
  servers of a software maker no longer count as stalkerware, and FindMyKids,
  sold in the app stores, is a monitoring app to review.
- The app trusts a list of signing keys, so the key that signs the
  indicators can move to an isolated computer or a hardware module without
  leaving anyone without updates, and a release can be signed away from the
  computer that prepares it.
- The PDF report says what to do now, in order, based on what was found:
  keeping the phone for an expert, safety first with stalkerware, Lockdown
  Mode, removing unknown profiles. It is left out when nothing was found.
- Enigm's own app, VPN and DNS are not points to review: the Enigm app from
  a store or Enigm OS, Enigm OS's private DNS, and traffic carried by a
  WireGuard VPN, which the report explains instead of reporting nothing.
- Android, as on iPhone: its connections check starts off, the waves show
  during its copy when it is on, and the copy shows how many MB have been
  copied so far.
- Windows open as soon as their page is ready, instead of after a few
  seconds on macOS; About opens again at once, and its icon has no square
  around it.
- The closing invitation's title is "Protect your conversations" and its
  button "Meet Enigm".
- Messages at the top use one colour for their words, icon and border.
- The line under "Find my phone" while it searches is gone; the spinning
  button says it.

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
- The report's severity tile keeps its bar without findings, empty, with
  "None detected" under it. The arrow to the details is a gentle double
  arrow under "See details".
- On the drawn phone of a report with findings, each cell takes its
  severity's colour and their glows blend together. It lights at most three,
  the most severe, from top to bottom, each saying in a word what it is
  about (App, File, Domain…).
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
