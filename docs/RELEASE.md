# Release procedure

## Release policy

Enigm Scan is distributed as portable packages: a disk image for each Mac
architecture, a ZIP for Windows and an AppImage for Linux. Packages are
published only after every platform build passes and the app has been tried
with real phones.

No workflow is started by editing this document. Builds, uploads and the
publication of the download list are always manual steps.

## Preparing a version

1. Set the version in `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` and
   `package.json`, and refresh the lock files.
2. Add the changes to [CHANGELOG.md](../CHANGELOG.md).
3. Run the checks listed in [CONTRIBUTING.md](../CONTRIBUTING.md).
4. Merge to `main`.

## Building

Start the **Build desktop app** workflow (`.github/workflows/desktop.yml`) on
the commit to release. Each platform job builds the engines from their lock
files, runs the adapter tests, builds the app, checks the bundled engines
against their hashes with `--portable-self-check`, and uploads the package
with a `.sha256` file.

Download the four artifacts and check every package against its `.sha256`.

## Signing the Mac packages

Release builds sign the Mac packages with the Developer ID certificate of
Enigm, LLC and have Apple notarize them, so they open without a warning. The
**Sign and notarize** option of the workflow is on by default; turned off, the
Mac packages are only sealed ad hoc, which is enough for testing.

When signing, each Mac job:

1. builds the engines, signs every executable and library in them with the
   hardened runtime and a secure timestamp, and records their new hashes in
   the engine catalog (`scripts/engines/sign-macos-engines.py`);
2. builds the app, which compiles that catalog in;
3. signs the app, has it notarized and staples the ticket to it;
4. puts it in the disk image, signs and notarizes the image too, and checks
   both with Gatekeeper before the self-check.

The certificate and the notary key are secrets of the `release-macos`
environment, which only the Mac jobs use. The certificate is imported into a
temporary keychain that is deleted when the job ends.

### Setting up the environment (once)

1. On the Mac whose keychain holds the certificate, open Keychain Access,
   find **Developer ID Application: Enigm, LLC (CRRU2PL879)**, expand it to
   include its private key, and export both as a `.p12` file with a strong
   password.
2. In the repository settings, under **Environments**, create
   `release-macos`. Add the maintainers who start releases as **Required
   reviewers**, and limit **Deployment branches and tags** to `main` and
   `release/*`.
3. Add these environment secrets:

   | Secret | Value |
   | --- | --- |
   | `APPLE_CERTIFICATE_P12` | The `.p12` file in base64: `base64 -i developer-id.p12 \| pbcopy` |
   | `APPLE_CERTIFICATE_PASSWORD` | The password chosen in step 1 |
   | `APPLE_API_KEY_P8` | The contents of the App Store Connect key, `AuthKey_<KEY ID>.p8` |
   | `APPLE_API_KEY_ID` | The key ID |
   | `APPLE_API_ISSUER_ID` | The issuer ID shown above the keys in App Store Connect, under Users and Access, Integrations |

4. Delete the exported `.p12` from the Mac.

If the certificate is ever exposed, revoke it in the Apple Developer account
and replace the secrets.

## Publishing

Packages live in a private Cloudflare R2 bucket; the download server only
serves files listed in [releases/manifest.json](../releases/manifest.json).

1. Add the four packages to `releases/manifest.json`, with their size,
   SHA-256 and MD5 (the R2 ETag), under a key that includes the commit. Keys
   are never reused for different bytes.
2. Upload them with an R2 API token limited to the releases bucket (object
   read and write), kept outside the repository:

   ```sh
   python scripts/upload-installers.py ARTIFACT_DIRECTORY < TOKEN_FILE
   ```

   The script uploads only files that match the manifest through R2's S3
   API, with each file's SHA-256 signed into the request so R2 refuses
   different bytes, then downloads each one again and checks its SHA-256.
3. Push the manifest to `main`. Cloudflare Workers Builds deploys the website,
   which then offers the new packages.
4. Download each package from scan.enigm.io and compare its SHA-256.

## Indicators

The signed indicator bundle has its own release cycle, described in
[intelligence/README.md](../intelligence/README.md). The signing key is kept
offline by the maintainers and never enters CI or this repository.
