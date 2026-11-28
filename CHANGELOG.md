# Changelog

## 1.0.5 — 28 November 2026

- The copy of the phone stays out of the computer's backups and search
  indexes: Time Machine and Spotlight on macOS, the search index on Windows,
  and backup tools that honour CACHEDIR.TAG on every system.
- Each part of the copy is deleted as soon as it has been analysed (the
  phone's data once every check has read it, the network capture once it has
  been analysed) instead of at the end, so less is left on the disk if the
  computer stops mid-scan. An encrypted copy is deleted as soon as it has
  been opened.
- The window no longer freezes for a moment right after opening: the check
  of the analysis engines runs in the background as soon as the app starts,
  once, instead of on the window's own thread each time it was asked.
- iPhone: the kernel's own line in shutdown.log (process 0, shown as
  `/kernel/` followed by its identifier) is no longer reported as a process
  in an unrecognised folder. Any other process with such a path still is.
- Fewer false alarms, from a review of every rule of our own:
  - Links: Telegram's own telegra.ph, Apple's and Google's country sites
    (icloud.com.cn), google.org and PayPal's and Amazon's own domains are
    no longer taken for imitations, nor are ordinary words one letter away
    from a brand ("telegraf", "applied").
  - Network: Apple's own addresses (17.0.0.0/8) are no longer listed as
    destinations contacted at a steady pace without a name; they are still
    compared with the indicators.
  - Android: a manufacturer's app installed by that manufacturer (Samsung
    Smart Switch restoring the owner's apps, Xiaomi updating its own) no
    longer counts as imitating a system component; Xiaomi's installer is
    recognised as installing an APK file; a removed proxy (`:0`) is no
    longer reported as set.
  - A file listing many known spyware addresses, such as a security app's
    block list, is one review point instead of one finding per address.

## 1.0.4 — 28 November 2026

- The report's duration and start time cover the whole scan, from the
  moment you start it (connecting, the passcode, the copy and the
  analysis), not only the analysis at the end. A scan of over an hour no
  longer shows a few minutes.
- The drawn phone stays and only what it shows changes: each screen (the
  copy, the passcode, the buttons to press for the deep check) and each note
  beside it gives way to the next: the old one leaves quickly while the new
  one arrives, never blinking empty and hardly ever showing both.
  On step 1 the switch between iPhone and Android takes the same time.
- The words on the left (titles, the line under them, the card and the
  report's verdict) simply fade in, without rising.

## 1.0.3 — 27 November 2026

- The line under the title looks the same on every step: when the phone
  asks for its passcode it is written like the line that explains the copy.
- Every step keeps the same distances between the steps, the title, the
  line under it and what follows (the options, the button or the progress
  card), before the scan and during it.
- On macOS, a scrolled page no longer shows through under the window's
  buttons: their strip takes the window's colour and the page fades out
  below it, over a taller band.

## 1.0.2 — 27 November 2026

- Android shows its extraction percentage as the phone gathers its data,
  instead of jumping to 100 % at the end. The app now asks the phone for its
  bug report directly and follows its progress, then copies it and deletes
  it from the phone, where ADB's own bug report used to leave it. Phones
  without that tool (before Android 7) are copied as before.
- The figures beside the phone no longer jump: they sit together, centred
  on the phone; each new one arrives last while the others move up to make
  room, and their numbers count up to each new value the phone reports.
- Everything that appears in the window fades in the same way and over the
  same time, and everything that moves slides over one shared time.
- No progress bar on the drawn iPhone's screen: the percentage is beside the
  phone, as on Android.
- The "Recommended" badge has room above and below its word on every
  system.
- On macOS, a page scrolled up fades out under the window's buttons instead
  of ending in a hard line.
- The report names the app's own analysis "enigm-scan" among its engines,
  written like the others.
- Nothing jumps while you go through the steps: the words, the steps and the
  buttons slide into place when a line comes or goes, and the notes beside
  the phone and the scanning line fade in, and the network waves fade out.
- Every title and line on the left arrives the same way on every step,
  as the report's verdict does.
- When nothing known is found, the drawn phone says "Scan complete" instead
  of repeating the title beside it.
- What remained of the old connector is gone: the website no longer allows
  a local connection, the indicator bundle for apps older than 0.7 is no
  longer published, and unused code (importing a network capture file,
  unused texts and styles) has been removed.

## 1.0.1 — 27 November 2026

- Beside the phone, the same figures in the same order on iPhone and
  Android, at most five: extracted, copied, photos and videos skipped or
  apps checked, network observed or connections checked, and time. On
  Android the extraction percentage comes from the phone as it gathers its
  data. During the analysis: indicators, files, checks, connections and
  time.
- The card under the steps says the step being done, on one line: from
  "Extracting data" and "Extraction complete" to "Watching the network" or
  "Checking apps" and "Checking connections", "Waiting for diagnostics",
  then "Comparing indicators", "Checking the system", "Analyzing the
  network" and "Preparing the report". An iPhone at 100 % now says it is
  watching the network instead of seeming stuck.
- The iPhone's passcode prompt no longer flashes right after the copy
  screen, and asking for it no longer takes the steps back to Connect.
- Moving from the phone step to the copy, and from the analysis to the
  report, keeps the phone in place; only the words arrive. The report's
  phone has the size and place it had during the analysis.
- The notes beside the phone end at the page margin, as far from the right
  edge as the words are from the left.
- The window is never narrower than 1100 x 600, where every screen shows
  everything, and on a small screen (such as a laptop at 1920 x 1080 and
  150 %) it opens as large as fits.
- A scan resumed after the window reloads keeps the phone being scanned.

## 1.0.0 — 27 November 2026

- The Mac packages are signed by Enigm and notarized by Apple, so they open
  without a warning. Release builds sign the bundled engines before the app is
  compiled, so the app still checks every engine against its own hashes.
- Closing the app during a scan waits for the copy of the phone to be
  deleted before it quits, instead of leaving it for the next start.
- The app's two requests at start name its version and kind of system, the
  same text for every copy, so the download server can count anonymously
  which versions are in use. Website visits are counted the same way, by
  page and country; nothing identifies a person. See
  [STATISTICS.md](docs/STATISTICS.md).
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
  one finding, not several. Signed release 2026112601 has 11,669
  indicators.
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
