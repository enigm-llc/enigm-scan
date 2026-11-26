# Security Policy

## Reporting

Do not open a public issue for a suspected vulnerability. Use GitHub's **Report
a vulnerability** form in the repository Security tab so the report and
follow-up remain private. Include the affected version or commit, your system,
the attack prerequisites, the expected impact and a minimal reproducer when it
is safe to share. Never attach real phone backups, reports or personal data: a
synthetic example is enough. We acknowledge reports within five working days.

## Supported versions

Enigm Scan is in its 0.x test series. Only the latest release published at
[scan.enigm.io](https://scan.enigm.io) receives fixes; older builds should be
replaced with it.

## Scope

- Anything that could send phone data or a report off the computer, or leave
  it behind after the session is closed.
- The app's native commands: an interface that could reach files, commands or
  addresses it should not.
- Parsing of backups, bug reports and engine output (path traversal, links,
  resource exhaustion).
- Verification of the bundled engines and of the signed indicator bundle
  (signature, expiry and rollback).
- The download server and the integrity of the published files.

Out of scope: how many threats the indicators detect (a research question, not
a vulnerability), and defects in MVT, pymobiledevice3 or adb, which should be
reported to those projects.

## Commitments

The app sends no phone data anywhere, keeps no reports after a session and has
no telemetry. It only touches a phone after the owner consents, and its
interface cannot run arbitrary commands or open arbitrary files. A change that
weakens any of these properties is treated as a security defect, even if all
tests pass.
