"""Sign the bundled engines with the Developer ID certificate, for release
builds on macOS, and record their new hashes in the engine catalog.

Usage: python scripts/engines/sign-macos-engines.py
Needs ENIGM_MACOS_IDENTITY (the "Developer ID Application: ..." name) and that
identity in a keychain on the search list.

Apple only notarizes an app whose every executable and library is signed with
the hardened runtime and a secure timestamp. Signing changes the bytes the
app checks before running an engine, so this runs after the engines are built
and before the app is: the catalog compiled into the app then describes the
signed files. Nothing else in the engines changes.
"""
import hashlib
import json
import os
import pathlib
import platform
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from engine_tree import tree_digest  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
ENGINES = ROOT / 'src-tauri/resources/engines'
# Python engines: libffi callbacks (ctypes, cffi) need writable executable
# memory under the hardened runtime. ADB needs no exception.
PYTHON_ENTITLEMENTS = ROOT / 'scripts/engines/python-engines.entitlements'
PYTHON_TREES = {'mvt-engine', 'ios-usb'}
MACHO = {b'\xcf\xfa\xed\xfe', b'\xce\xfa\xed\xfe', b'\xca\xfe\xba\xbe', b'\xca\xfe\xba\xbf'}


def is_code(path):
    """An executable or a loadable library; link-time objects are skipped."""
    if path.is_symlink() or not path.is_file():
        return False
    with path.open('rb') as handle:
        if handle.read(4) not in MACHO:
            return False
    header = subprocess.run(['otool', '-hv', str(path)], capture_output=True, text=True, check=True)
    return any(kind in header.stdout for kind in ('EXECUTE', 'DYLIB', 'BUNDLE'))


def sign(path, identity, entitlements=None):
    command = ['codesign', '--force', '--sign', identity, '--options', 'runtime', '--timestamp']
    if entitlements:
        command += ['--entitlements', str(entitlements)]
    subprocess.run([*command, str(path)], check=True)
    subprocess.run(['codesign', '--verify', '--strict', str(path)], check=True)


def sha256(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def main():
    if platform.system() != 'Darwin':
        raise SystemExit('Signing for macOS runs on macOS')
    identity = os.environ.get('ENIGM_MACOS_IDENTITY', '')
    if not identity.startswith('Developer ID Application: '):
        raise SystemExit('Set ENIGM_MACOS_IDENTITY to the Developer ID Application identity')
    manifest_path = ENGINES / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    signed = 0
    done = set()
    for entry in manifest:
        executable = ENGINES / entry['file']
        if executable in done:
            continue
        done.add(executable)
        tree = entry.get('tree')
        entitlements = PYTHON_ENTITLEMENTS if tree in PYTHON_TREES else None
        # Libraries first, the executable last: a signature covers what the
        # signed file loads only once those are signed.
        files = sorted((ENGINES / tree).rglob('*')) if tree else [ENGINES / s['file'] for s in entry.get('support', [])]
        for path in files:
            if path != executable and is_code(path):
                sign(path, identity)
                signed += 1
        sign(executable, identity, entitlements)
        signed += 1
    # Two catalog entries can share one engine (MVT serves iOS and Android):
    # hashes are taken after every file is signed.
    for entry in manifest:
        entry['sha256'] = sha256(ENGINES / entry['file'])
        if entry.get('tree'):
            entry['tree_sha256'] = tree_digest(ENGINES / entry['tree'])
        for support in entry.get('support', []):
            support['sha256'] = sha256(ENGINES / support['file'])
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'signed': signed, 'engines': [e['id'] for e in manifest]}))


if __name__ == '__main__':
    main()
