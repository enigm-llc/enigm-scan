# Architecture

Enigm Scan is a desktop app built with [Tauri](https://tauri.app). Its window
shows a React interface; everything that touches the phone or the disk runs in
Rust and in a few pinned helper programs (the engines). The website at
scan.enigm.io is the same React code in a smaller role: it explains the
project and offers the downloads. It never talks to the app.

```
┌──────────────── desktop app ─────────────────┐
│ interface (src/, src/desktop/)                │
│        │ Tauri commands (fixed list)          │
│ src-tauri ── commands, menu, file choosers    │
│        │                                      │
│ agent/runtime ── engines, phone, temp folders │
│        │                                      │
│ agent/core ── indicators, parsers, behaviour  │
└──────────────────────────────────────────────┘
        │ subprocesses, hash-checked
   ios-usb (pymobiledevice3) · mvt-engine (MVT) · adb
```

## The interface

`src/desktop/DesktopApp.tsx` is the app's shell: one screen at a time
(connect, options, copy and analysis, report), with no page chrome; the app
follows the system's language and appearance. On macOS the app menu lives in
the system's menu bar (`src-tauri/src/menu.rs`: About with the icon and
version, Help, Quit); Windows and Linux draw menus inside the window, so the
app sets none there and Ctrl+Q quits. Closing the window or quitting deletes
the report and the temporary copy (or stops a running scan), then shows the
Enigm invitation (`src/desktop/ClosePromo.tsx`) before the app exits. The
screens live in `src/components/`. They call the native side only through
`native()` in `src/core/agent.ts`, which maps to a fixed list of Tauri
commands; none of them accepts a path, URL or command line from the
interface. Links open in the system browser, never inside the window, and only
for `https` addresses.

Reports are validated at the boundary (`src/core/report.ts`) and kept in
memory. The PDF is rendered locally with jsPDF.

## Scanning a phone

`src-tauri/src/main.rs` runs one scan at a time on a background thread:

1. **Consent.** Before the app looks for a phone, the person confirms that
   it is theirs or that they have the owner's permission; the native side
   refuses to search or scan without it. Watching the phone's connections is
   a separate option the person ticks.
2. **Discovery.** iPhones are listed through the iOS adapter (Apple's USB
   service), Android phones through a private adb server started for the
   session, on its own port, with network discovery turned off.
3. **Copy.** An iPhone is backed up over USB into a private temporary folder.
   Photos and videos from the personal library are skipped as they arrive; the
   rest of the backup, including its manifest, is kept. "Trust" creates a
   pairing that stays in memory and is revoked at the end. An Android phone
   produces a bug report, and the app reads its installed apps, granted
   permissions and special access with read-only `adb shell` commands.
4. **Deep check (iPhone, optional).** After "Trust", the copy waits until the
   owner starts a sysdiagnose with the phone's buttons, or chooses to go on
   without it. Its shutdown log and the crash reports are read after the copy.
5. **Analysis.** MVT runs offline over the copy, and Enigm's own analysis in
   `agent/core` matches indicators, looks for spyware behaviour on Android,
   suspicious process locations on iPhone and look-alike links in messages
   and browsing history.
6. **Cleanup.** The temporary folder is deleted and the report says whether
   that succeeded.

Every engine is a fixed program in `src-tauri/resources/engines`. Before each
run, `agent/runtime/src/engines.rs` checks it (or, for folder engines, every
file in it) against the SHA-256 hashes compiled into the app. Engines get
fixed arguments, a scrubbed environment and a private home folder; their
output is bounded and they are stopped with their whole process tree on
cancel. This is defence in depth, not a sandbox.

The app holds a lock inside each temporary folder it creates (the browser
profile of its window, the scan folder, the adb home). If the app is killed,
the next start finds those folders unlocked and removes them.

## Indicators

The indicator bundle is signed with an Ed25519 key kept offline by the
maintainers (see `intelligence/README.md`). The app embeds the public key, a
minimum version and a copy of the bundle. At start it downloads the newest
bundle from scan.enigm.io, with short timeouts and no redirects, and accepts
it only if the signature is valid, the bundle has not expired (bundles last at
most 90 days) and its version is not older than the one it already has. No
phone data is sent with the request.

A match means a known indicator was found, which needs to be interpreted; a
clean result means none of the known signs were found. The report says both
in plain words.

## Network check

On iPhone the optional check captures the phone's own traffic through its USB
packet service for 120 seconds (at most 32 MiB or 100,000 packets) and
compares the addresses and DNS names with the indicators. On Android the app
reads the addresses of the open connections. There is no interception, no
certificate installed and no decryption.

## The website and the download server

`src/App.tsx` is the website: home, how it works and downloads. `worker/`
serves it on Cloudflare Workers, together with the published packages, which
come from a private storage bucket and are listed with their size and SHA-256
in `releases/manifest.json`. Only files listed there can be downloaded. The
worker keeps anonymous counts described in [STATISTICS.md](STATISTICS.md).

## What the tests cover

Unit and integration tests cover the parsers, the indicator verification, the
engine checks, the process handling and the interface. They do not prove that
a given phone model works or measure how much spyware is detected; those
depend on real devices and real samples.
