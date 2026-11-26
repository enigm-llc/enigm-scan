"""Package existing CI outputs without an installer or persistent integration."""
import hashlib
import json
import os
import pathlib
import platform
import shutil
import subprocess
import tempfile
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
RELEASE = ROOT / 'src-tauri/target/release'
OUT = RELEASE / 'portable'
OUT.mkdir(exist_ok=True)
for previous in OUT.glob('enigm-scan-*'):
    if previous.is_file() and not previous.is_symlink():
        previous.unlink()
VERSION = json.loads((ROOT / 'src-tauri/tauri.conf.json').read_text())['version']
SYSTEM = platform.system()

README = '''ENIGM SCAN
Find out whether someone is spying on your phone.
https://scan.enigm.io

Enigm Scan checks an iPhone or Android phone for known spyware and
stalkerware: the mercenary tools used against journalists and activists,
such as Pegasus and Predator, and the commercial apps used to watch a
partner or a relative. It is free, its source code is public and it
needs no account.


WHAT IT CHECKS

- More than 11,000 signed indicators from public forensic research by
  Amnesty International's Security Lab, the MVT project, Echap and ESET
  Research: domains, IP addresses, file hashes, app IDs, processes and
  profiles.
- Messages, browsing history, apps, processes and settings, analysed with
  MVT, the open-source forensic engine used by security researchers.
- Android: every installed app, a fingerprint of each app you installed,
  apps that behave like spyware, the phone's open internet connections and
  its proxy settings.
- iPhone: crash reports and, if you choose the deep check, the phone's
  shutdown log; optionally, two minutes of the phone's network traffic.

You get a clear report you can save as a PDF. A match is evidence to
review with an expert, not a verdict, and settings that are merely unusual
are listed apart as points to review.


PRIVATE BY DESIGN

- Everything runs on this computer. Nothing from your phone is sent to
  Enigm or to anyone else.
- No account, no email, no telemetry about your phone.
- Personal photos and videos are skipped.
- The temporary copy of your phone's data is deleted when the scan ends.


HOW TO USE IT

1. Open Enigm Scan on this computer.
2. Plug in your phone with a USB cable and follow the steps in the app.
   - iPhone: unlock it, tap "Trust" and enter your passcode.
   - Android: turn on USB debugging in Developer options and allow it.
3. Keep the phone connected until the report appears.

macOS    Open the app straight from the mounted disk image; no need to
         copy it to Applications. The first time, macOS says it cannot
         verify the developer: open System Settings > Privacy & Security
         and click "Open Anyway" next to Enigm Scan.
Windows  Extract the whole ZIP and open "Enigm Scan.exe". Keep the
         "resources" folder next to it. Needs Microsoft WebView2, which
         current Windows already includes. For iPhone, install Apple Devices.
Linux    Make the AppImage executable and open it. For iPhone, install
         usbmuxd.


GOOD TO KNOW

- This is a test build and it is not code-signed yet, so your system may
  warn you the first time you open it. Keep your system protections on.
- Enigm Scan finds documented threats. A brand-new attack with no public
  indicators yet would not be detected; no scanner can promise otherwise.
- When you are done, delete the download. Your saved reports stay; the
  public signed indicators are kept so the app also works offline.


PROTECT YOUR CONVERSATIONS

Enigm Scan is made by Enigm. Enigm offers private, end-to-end encrypted
messaging and calls, with no email or phone number required.
https://enigm.io

Documentation  https://docs.enigm.io
Source code    https://github.com/enigm-llc/enigm-scan
'''

if SYSTEM == 'Windows':
    with tempfile.TemporaryDirectory(prefix='enigm-portable-') as staging:
        app = pathlib.Path(staging) / 'Enigm Scan'
        app.mkdir()
        shutil.copy2(RELEASE / 'enigm-scan.exe', app / 'Enigm Scan.exe')
        shutil.copytree(ROOT / 'src-tauri/resources', app / 'resources')
        for dll in RELEASE.glob('*.dll'):
            shutil.copy2(dll, app / dll.name)
        (app / 'README.txt').write_text(README, encoding='utf-8')
        target = OUT / f'enigm-scan-{VERSION}-windows-x64.zip'
        with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(app.rglob('*')):
                if path.is_file():
                    archive.write(path, path.relative_to(pathlib.Path(staging)))
        with tempfile.TemporaryDirectory(prefix='enigm-portable-check-') as check:
            with zipfile.ZipFile(target) as archive:
                archive.extractall(check)
            subprocess.run([str(pathlib.Path(check) / 'Enigm Scan/Enigm Scan.exe'), '--portable-self-check'], check=True, timeout=90)
elif SYSTEM == 'Darwin':
    with tempfile.TemporaryDirectory(prefix='enigm-portable-') as staging:
        # ditto preserves the bundle's symlinks and executable permissions.
        subprocess.run(['ditto', str(RELEASE / 'bundle/macos/Enigm Scan.app'), staging + '/Enigm Scan.app'], check=True)
        # Without a Developer ID the bundle still needs a complete signature:
        # only the main executable carried the linker's ad-hoc signature, and a
        # downloaded (quarantined) bundle without a sealed signature is reported
        # by Gatekeeper as "damaged" instead of "unverified developer". Seal the
        # bundle ad hoc. The engines keep their own signatures and bytes, which
        # the embedded engine catalog verifies; they are sealed as resources.
        bundle = staging + '/Enigm Scan.app'
        subprocess.run(['codesign', '--force', '--sign', '-', '--timestamp=none', bundle], check=True)
        subprocess.run(['codesign', '--verify', '--strict', '--verbose=2', bundle], check=True)
        pathlib.Path(staging, 'README.txt').write_text(README, encoding='utf-8')
        target = OUT / f'enigm-scan-{VERSION}-macos-{platform.machine()}.dmg'
        subprocess.run(['hdiutil', 'create', '-volname', 'Enigm Scan', '-srcfolder', staging, '-format', 'UDZO', '-ov', str(target)], check=True)
        # macOS /var is a symlink to /private/var. Tauri deliberately rejects
        # executable paths containing symlinks; launch from the physical path.
        mount = pathlib.Path(staging).resolve() / 'mounted'
        mount.mkdir()
        subprocess.run(['hdiutil', 'attach', '-readonly', '-nobrowse', '-mountpoint', str(mount), str(target)], check=True)
        try:
            if (mount / 'Applications').exists():
                raise SystemExit('Portable DMG must not contain an installation shortcut')
            subprocess.run([str(mount / 'Enigm Scan.app/Contents/MacOS/enigm-scan'), '--portable-self-check'], check=True, timeout=90)
        finally:
            # The just-exited self-check can keep the volume briefly busy, and a
            # failed eject may still unmount it. Retry; succeed once unmounted.
            import time
            for attempt in range(6):
                flags = ['-force'] if attempt >= 3 else []
                if subprocess.run(['hdiutil', 'detach', *flags, str(mount)]).returncode == 0:
                    break
                if not os.path.ismount(mount):
                    break
                time.sleep(5)
            else:
                raise SystemExit('Could not detach the portable DMG')
else:
    source, = (RELEASE / 'bundle/appimage').glob('*.AppImage')
    target = OUT / f'enigm-scan-{VERSION}-linux-x64.AppImage'
    # linuxdeploy patches/strips ELF resources, invalidating the catalog embedded
    # before bundling. Restore the already verified engine bytes, then run only
    # the output plugin (not dependency deployment) to build the final container.
    # Never replace expected hashes with hashes of transformed engine binaries.
    with tempfile.TemporaryDirectory(prefix='enigm-appimage-') as staging:
        subprocess.run([str(source), '--appimage-extract'], cwd=staging, check=True, stdout=subprocess.DEVNULL)
        appdir = pathlib.Path(staging) / 'squashfs-root'
        catalogs = list(appdir.rglob('resources/engines/manifest.json'))
        if len(catalogs) != 1:
            raise SystemExit('Ambiguous engine resource directory in AppImage')
        shutil.rmtree(catalogs[0].parent)
        shutil.copytree(ROOT / 'src-tauri/resources/engines', catalogs[0].parent)
        plugins = list((pathlib.Path.home() / '.cache/tauri').rglob('linuxdeploy-plugin-appimage*.AppImage'))
        if len(plugins) != 1:
            raise SystemExit('Expected the AppImage output plugin already used by Tauri')
        settings = os.environ.copy()
        settings.update(APPIMAGE_EXTRACT_AND_RUN='1', LDAI_OUTPUT=str(target), ARCH='x86_64')
        subprocess.run([str(plugins[0]), '--appdir', str(appdir)], env=settings, check=True, timeout=180)
    subprocess.run(['xvfb-run', '-a', str(target), '--appimage-extract-and-run', '--portable-self-check'], check=True, timeout=120)

(OUT / 'README.txt').write_text(README, encoding='utf-8')
with target.open('rb') as file:
    digest = hashlib.file_digest(file, 'sha256').hexdigest()
(OUT / (target.name + '.sha256')).write_text(digest + '  ' + target.name + '\n')
print('Portable package:', target.name)
