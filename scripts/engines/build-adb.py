"""Package only the open-source ADB transport and its runtime libraries.
Google's official archive checksum is recorded alongside an independently computed
SHA-256. SDK terms section 3.5 defers these components to their OSS licenses.
"""
import hashlib
import json
import platform
import subprocess
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSION = '37.0.1'
PACKAGES = {
    'Linux': ('linux', '477254aa5f903c15cf51001717bdf347fb6b53e0', 'd230f13842f60f782a8645f9c813f8f845bf36089ea7289f28c48f17979313f1', ['adb']),
    'Darwin': ('darwin', '6ae73f4de6452dc57e62ec02b68eed92a4c21661', 'ee39ad5967e95c2a07f04dbcbde96b1a0c916ba376096db5d2f498b7727a5d1d', ['adb']),
    'Windows': ('win', 'e03e78b1d80b396f1c3358e31251cb31740e1110', '45f4d63113e895ebde0c90f194099a4676b6ac653bd28d54314a9e022bbc1a99', ['adb.exe', 'AdbWinApi.dll', 'AdbWinUsbApi.dll']),
}
name, sha1, sha256, files = PACKAGES[platform.system()]
url = f'https://dl.google.com/android/repository/platform-tools_r{VERSION}-{name}.zip'
cache = ROOT / '.local-tools/adb-packages'
cache.mkdir(parents=True, exist_ok=True)
archive = cache / f'{name}.zip'
if not archive.exists():
    with urllib.request.urlopen(url, timeout=60) as response:
        archive.write_bytes(response.read(32 * 1024 * 1024 + 1))
data = archive.read_bytes()
if hashlib.sha256(data).hexdigest() != sha256 or hashlib.sha1(data).hexdigest() != sha1:
    raise SystemExit('Official ADB archive checksum mismatch')
resources = ROOT / 'src-tauri/resources/engines'
resources.mkdir(parents=True, exist_ok=True)
notices = resources / 'notices'
notices.mkdir(exist_ok=True)
with zipfile.ZipFile(archive) as package:
    for relative in files:
        target = resources / relative
        target.parent.mkdir(exist_ok=True)
        target.write_bytes(package.read('platform-tools/' + relative))
        target.chmod(0o755)
    notice = package.read('platform-tools/NOTICE.txt')
    if b'Apache License' not in notice:
        raise SystemExit('Missing expected upstream license notice')
    (notices / 'android-platform-tools-NOTICE.txt').write_bytes(notice)
# This command cannot start a server or access a device.
version = subprocess.run([str(resources / files[0]), 'version'], capture_output=True, check=True, timeout=15).stdout.decode()
if VERSION not in version:
    raise SystemExit('Unexpected ADB binary version')
support = [{'file': relative, 'sha256': hashlib.sha256((resources / relative).read_bytes()).hexdigest()} for relative in files[1:]]
manifest_path = resources / 'manifest.json'
manifest = json.loads(manifest_path.read_text())
manifest = [entry for entry in manifest if entry['id'] != 'adb']
manifest.append({'id':'adb', 'file':files[0], 'version':VERSION, 'sha256':hashlib.sha256((resources / files[0]).read_bytes()).hexdigest(), 'support': support})
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
(resources / 'adb-provenance.json').write_text(json.dumps({'version':VERSION,'url':url,'sha256':sha256,'googleManifestSha1':sha1,'components':files,'terms':'https://developer.android.com/studio/terms#3-sdk-license-from-google','source':'https://android.googlesource.com/platform/packages/modules/adb/','notes':'Only ADB and runtime libraries are included; no fastboot, filesystem tools, system driver or persistent service is installed.'},indent=2)+'\n')
print(f'Packaged ADB {VERSION}: {platform.system()}')
