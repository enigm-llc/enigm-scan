"""Occasional release upload. Credentials stay local; never needed in GitHub.

Usage: python scripts/upload-installers.py ARTIFACT_DIRECTORY TOKEN_FILE
Uploads only files matching the reviewed manifest, then verifies remote SHA-256.
Publish the matching manifest/site only after this command succeeds.
"""
import hashlib
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]

def cloudflare_account():
    """The Cloudflare account of the download server, from wrangler.jsonc."""
    text = (ROOT / 'wrangler.jsonc').read_text()
    match = re.search(r'"account_id"\s*:\s*"([0-9a-f]{32})"', text)
    if not match:
        raise SystemExit('wrangler.jsonc has no account_id')
    return match.group(1)


BASE = f'https://api.cloudflare.com/client/v4/accounts/{cloudflare_account()}/r2/buckets/enigm-scan-releases/objects/'

def main():
    source = pathlib.Path(sys.argv[1])
    token = pathlib.Path(sys.argv[2]).read_text().strip()
    manifest = json.loads((ROOT / 'releases/manifest.json').read_text())
    matches = []
    # Check the complete set before writing any object.
    for item in manifest['files']:
        candidates = [p for p in source.rglob('*') if p.is_file() and not p.is_symlink() and p.stat().st_size == item['bytes']]
        match = next((p for p in candidates if hashlib.file_digest(p.open('rb'), 'sha256').hexdigest() == item['sha256']), None)
        if match is None:
            raise SystemExit('Missing or changed artifact: ' + item['filename'])
        matches.append((item, match))
    for item, path in matches:
        headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/octet-stream', 'Content-Length': str(item['bytes'])}
        # REST single PUT preserves the reviewed single-part ETag.
        with path.open('rb') as body:
            req = urllib.request.Request(BASE + item['key'], data=body, headers=headers, method='PUT')
            # Fixed https endpoint of the Cloudflare R2 API.
            # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
            with urllib.request.urlopen(req, timeout=180) as response:
                if response.status != 200:
                    raise SystemExit('Upload failed: ' + item['filename'])
        req = urllib.request.Request(BASE + item['key'], headers={'Authorization': 'Bearer ' + token})
        # Fixed https endpoint of the Cloudflare R2 API.
        # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
        with urllib.request.urlopen(req, timeout=180) as response:
            digest = hashlib.sha256()
            size = 0
            while chunk := response.read(1024 * 1024):
                digest.update(chunk)
                size += len(chunk)
        if size != item['bytes'] or digest.hexdigest() != item['sha256']:
            raise SystemExit('Remote integrity mismatch: ' + item['filename'])
        print('Uploaded and SHA-256 verified: ' + item['filename'], flush=True)

if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as error:
        raise SystemExit('Cloudflare request failed: HTTP ' + str(error.code)) from None
