# Release procedure

## Release policy

Enigm Scan is distributed as portable packages: a disk image for each Mac
architecture, a ZIP for Windows and an AppImage for Linux. They are not
code-signed yet. Packages are published only after every platform build
passes and the app has been tried with real phones.

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

## Publishing

Packages live in a private Cloudflare R2 bucket; the download server only
serves files listed in [releases/manifest.json](../releases/manifest.json).

1. Add the four packages to `releases/manifest.json`, with their size,
   SHA-256 and MD5 (the R2 ETag), under a key that includes the commit. Keys
   are never reused for different bytes.
2. Upload them with a temporary R2 token kept outside the repository:

   ```sh
   python scripts/upload-installers.py ARTIFACT_DIRECTORY TOKEN_FILE
   ```

   The script uploads only files that match the manifest, downloads each one
   again and checks its SHA-256. Revoke the token afterwards.
3. Push the manifest to `main`. Cloudflare Workers Builds deploys the website,
   which then offers the new packages.
4. Download each package from scan.enigm.io and compare its SHA-256.

## Indicators

The signed indicator bundle has its own release cycle, described in
[intelligence/README.md](../intelligence/README.md). The signing key is kept
offline by the maintainers and never enters CI or this repository.
