# Enigm Scan

Enigm Scan checks an iPhone or an Android phone for spyware, from your own
computer. It looks for the traces left by known mercenary spyware, such as
Pegasus and Predator, and by the stalkerware apps people install on a
partner's or relative's phone. It is free, it needs no account, and your data
never leaves your computer.

Download it from **[scan.enigm.io](https://scan.enigm.io)** for macOS (Apple
Silicon and Intel), Windows and Linux. Every download is listed with its
SHA-256 in [releases/manifest.json](releases/manifest.json).

**Status:** test releases (0.x). The app has been tried on real iPhones and
Android phones, and detection depends on published indicators: a clean
report is not proof that a phone is safe. Read
[Privacy](docs/PRIVACY.md) and [Security](SECURITY.md) before relying on it.

## How it works

1. **Connect the phone** to the computer with a USB cable. On an iPhone you
   tap "Trust" and enter your passcode; on Android you allow USB debugging.
2. **Local copy.** The app makes a temporary copy of the phone on your
   computer: an iPhone backup (without your photos and videos) or an Android
   bug report plus a read-only inventory of the installed apps.
3. **Analysis.** The copy is compared with thousands of signed indicators of
   known spyware, and checked for behaviour that spyware leaves behind. Nothing
   is sent anywhere.
4. **Report.** You get a clear result, with every sign explained, which you can
   save as a PDF. When you finish, the copy and the report are deleted.

A clean report means that none of the known signs were found. No tool can
prove that a phone is not being spied on, and the report says so.

### What it looks for

- **Known spyware and stalkerware.** Domains, IP addresses, file hashes, app
  identifiers, process names and other indicators published by Amnesty
  International's Security Lab, the MVT project, Echap, ESET Research and
  Emerging Threats Open.
  The bundle is signed, so the app only uses indicators that come from us.
- **Android behaviour.** Apps that hide their icon, were installed from a
  computer over USB, use accessibility or notification access, act as device
  administrators, or use the microphone, camera and location in the
  background, read over USB without root.
- **iPhone traces.** Crash reports and, if you choose the deep check, the
  shutdown log and running processes of a sysdiagnose, where some spyware
  leaves processes behind, and signs of a jailbreak.
- **Where spyware reports.** Data collection services, tunnels and dynamic DNS
  names checked in with at a steady pace, which spyware without servers of its
  own uses, in the phone's traffic, proxy settings and message links.
- **Optional network check.** On iPhone the app watches the phone's own
  traffic while it copies, and reads the servers it contacts, even over
  encrypted connections; on Android it reads the open connections and which
  apps send data in the background.

The forensic part of the iPhone and Android analysis runs on
[MVT](https://github.com/mvt-project/mvt), the Mobile Verification Toolkit
used by security researchers.

## Privacy

Scans happen entirely on your computer. Phone data is never uploaded and the
app has no telemetry. When it starts it makes two requests to `scan.enigm.io`:
it downloads the latest signed indicator bundle, and it reads which version of
the app is published, to point you to the download page when there is a newer
one (it never updates itself). The download server keeps anonymous counts of
downloads and bundle requests, with no IP address or identifier;
[docs/STATISTICS.md](docs/STATISTICS.md) explains exactly what is counted.

The app is portable: it installs no service, driver or startup entry, and it
removes its temporary folders when it closes (or the next time it starts, if
it was killed).

## Building from source

You need Node.js 22, a stable Rust toolchain, the
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your
system and Python 3.14 for the engines.

```sh
npm ci
npm test
npm run build
cargo test --manifest-path agent/core/Cargo.toml --locked
cargo test --manifest-path agent/runtime/Cargo.toml --locked
npm run app:dev          # the desktop app, in development mode
```

The phone engines are built separately into `src-tauri/resources/engines`.
In a dedicated Python environment:

```sh
pip install --require-hashes --no-deps -r scripts/engines/engines.lock
pip install --require-hashes --no-deps -r scripts/engines/pymobiledevice3.lock
python scripts/engines/test_ios_entry.py
python scripts/engines/test_mvt_entry.py
python scripts/engines/build-ios.py
python scripts/engines/build-mvt.py
python scripts/engines/build-adb.py
```

Each build writes the engine's hashes into
`src-tauri/resources/engines/manifest.json`, which the app embeds and checks
before every run. In the repository that list is empty on purpose: a build
without engines opens, but cannot scan phones. Do not commit the generated
engines or the filled-in manifest.

iPhone scans need Apple's USB service: Apple Devices on Windows, `usbmuxd`
on Linux (macOS has it built in).

## Repository layout

| Path | What it is |
| --- | --- |
| `src/` | The interface (React and TypeScript): the website and the app's screens |
| `src/desktop/` | The desktop app's shell |
| `src-tauri/` | The desktop app (Tauri): window, menu, file choosers, scan orchestration |
| `agent/core/` | Analysis in Rust: signed indicators, evidence parsing, behaviour rules |
| `agent/runtime/` | Native runtime: engine verification, phone acquisition, temporary folders |
| `scripts/engines/` | Engine adapters and their build scripts |
| `intelligence/` | Indicator sources and the signed release metadata |
| `worker/` | The download server for scan.enigm.io (Cloudflare Workers) |
| `docs/` | Architecture, privacy, report format, statistics and releases |

## Documentation

[Architecture](docs/ARCHITECTURE.md), [privacy](docs/PRIVACY.md),
[report format](docs/REPORT-FORMAT.md), [anonymous statistics](docs/STATISTICS.md),
[indicators](intelligence/README.md), [release procedure](docs/RELEASE.md) and
the [changelog](CHANGELOG.md).

## Contributing

Bug reports and pull requests are welcome; read
[CONTRIBUTING.md](CONTRIBUTING.md) first. Please report security issues
privately, as described in [SECURITY.md](SECURITY.md).

## License

Enigm Scan is source-available under the
[PolyForm Noncommercial License 1.0.0](LICENSE): you can use, study, modify and
share it for free for any noncommercial purpose, including personal use,
research, journalism, and work at charities, schools and public bodies.
Commercial use needs a separate agreement; write to us at
[enigm.io](https://enigm.io).

The iPhone adapter (`scripts/engines/ios_entry.py`) uses pymobiledevice3 and
is therefore licensed under the [GPL-3.0](LICENSES/GPL-3.0.txt). Bundled
engines, indicators and fonts keep their own licenses, listed in
[THIRD-PARTY-LICENSES.txt](THIRD-PARTY-LICENSES.txt) and [NOTICE](NOTICE).
