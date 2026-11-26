# Contributing to Enigm Scan

Enigm Scan is used by people who fear they are being watched, and it handles
the most private data on their phones. Small, reviewable changes with explicit
tests are easier to validate than broad refactors.

## Development workflow

1. Install Node.js 22, a stable Rust toolchain and the
   [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/), then run
   `npm ci`.
2. Add tests for every changed success and failure condition.
3. Run `npm test` and `npm run build`.
4. Run `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`
   and `cargo test --locked` for `agent/core`, `agent/runtime` and
   `src-tauri`.
5. If you change an engine adapter, run `python scripts/engines/test_ios_entry.py`
   and `python scripts/engines/test_mvt_entry.py` in the engines' Python
   environment (see the [README](README.md)).
6. Changes to phone handling should be tried on real devices. Say in the pull
   request which phones and systems you used, or that you could not test on a
   device.

## Rules for this project

- Never invent results: no made-up detections, percentages, progress or counts.
  A check that could not run is reported as reduced coverage.
- Phone data stays on the computer. No uploads, telemetry or stored reports.
  Backups, bug reports and engine output are untrusted input.
- A phone is only touched after the person confirms that it is theirs or that
  they have its owner's permission; the native side refuses to search or scan
  without that confirmation.
- The interface reaches the native side through a fixed list of commands. Do
  not add commands that accept paths, URLs or command lines.
- Every text the user sees exists in English, Spanish, French, German, Italian
  and Portuguese. The dictionaries are typed, so a missing translation fails
  the build.

Do not include real backups, reports, serial numbers, credentials or keys in
an issue, commit or test fixture; use synthetic data. Report suspected
vulnerabilities through [SECURITY.md](SECURITY.md) rather than a public issue.

Public documentation must contain no internal workflow instructions or
workstation paths. Change the version together with the lock files and the
[changelog](CHANGELOG.md), and follow [Release](docs/RELEASE.md).

## Licensing of contributions

Contributions are accepted under the project's licenses: the
[PolyForm Noncommercial License 1.0.0](LICENSE), and the
[GPL-3.0](LICENSES/GPL-3.0.txt) for `scripts/engines/ios_entry.py`. By
contributing you also allow Enigm to offer your contribution under other
terms, for example as part of a commercial license of Enigm Scan. If you do
not agree, say so in the pull request before it is merged.
