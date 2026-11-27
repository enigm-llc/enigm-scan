"""Record the current hashes of the bundled engines in the engine catalog.

Usage: python scripts/engines/refresh_catalog.py
Run after the engines are signed for release (signing changes their bytes)
and before the app is built, which compiles the catalog in. Only hashes
change: the list of engines, their files and versions stay as built.
"""
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from engine_tree import tree_digest  # noqa: E402

ENGINES = pathlib.Path(__file__).resolve().parents[2] / 'src-tauri/resources/engines'


def sha256(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def refresh():
    manifest_path = ENGINES / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    for entry in manifest:
        entry['sha256'] = sha256(ENGINES / entry['file'])
        if entry.get('tree'):
            entry['tree_sha256'] = tree_digest(ENGINES / entry['tree'])
        for support in entry.get('support', []):
            support['sha256'] = sha256(ENGINES / support['file'])
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    return [entry['id'] for entry in manifest]


if __name__ == '__main__':
    print(json.dumps({'refreshed': refresh()}))
