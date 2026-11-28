"""Occasional release upload. Credentials stay local; never needed in GitHub.

Usage: python scripts/upload-installers.py ARTIFACT_DIRECTORY < TOKEN_FILE
The token is an R2 API token limited to the releases bucket (object read and
write). It is read from standard input, so it never appears in the command.
Uploads only files matching the reviewed manifest, then verifies remote SHA-256.
Publish the matching manifest/site only after this command succeeds.
"""
import datetime
import hashlib
import hmac
import json
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
BUCKET = 'enigm-scan-releases'
EMPTY = hashlib.sha256(b'').hexdigest()


def cloudflare_account():
    """The Cloudflare account of the download server, from wrangler.jsonc."""
    text = (ROOT / 'wrangler.jsonc').read_text()
    match = re.search(r'"account_id"\s*:\s*"([0-9a-f]{32})"', text)
    if not match:
        raise SystemExit('wrangler.jsonc has no account_id')
    return match.group(1)


def token_id(token):
    """R2's S3 access key ID is the ID of the API token."""
    req = urllib.request.Request('https://api.cloudflare.com/client/v4/user/tokens/verify',
                                 headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req, timeout=30) as response:
        result = json.load(response).get('result') or {}
    if result.get('status') != 'active' or not result.get('id'):
        raise SystemExit('The token is not active')
    return result['id']


class Bucket:
    """Signed S3 requests to the R2 bucket (AWS Signature Version 4)."""

    def __init__(self, account, key_id, token):
        self.host = account + '.r2.cloudflarestorage.com'
        self.key_id = key_id
        # R2's S3 secret access key is the SHA-256 of the token value.
        self.secret = hashlib.sha256(token.encode()).hexdigest()

    def request(self, method, key, payload_sha256, body=None, length=None):
        path = '/' + BUCKET + '/' + urllib.parse.quote(key, safe='/-_.~')
        now = datetime.datetime.now(datetime.timezone.utc)
        stamp, day = now.strftime('%Y%m%dT%H%M%SZ'), now.strftime('%Y%m%d')
        scope = day + '/auto/s3/aws4_request'
        headers = {'host': self.host, 'x-amz-content-sha256': payload_sha256, 'x-amz-date': stamp}
        signed = ';'.join(sorted(headers))
        canonical = '\n'.join([method, path, '',
                               ''.join(f'{name}:{headers[name]}\n' for name in sorted(headers)),
                               signed, payload_sha256])
        to_sign = '\n'.join(['AWS4-HMAC-SHA256', stamp, scope, hashlib.sha256(canonical.encode()).hexdigest()])
        signing = ('AWS4' + self.secret).encode()
        for part in (day, 'auto', 's3', 'aws4_request'):
            signing = hmac.new(signing, part.encode(), hashlib.sha256).digest()
        signature = hmac.new(signing, to_sign.encode(), hashlib.sha256).hexdigest()
        headers['Authorization'] = (f'AWS4-HMAC-SHA256 Credential={self.key_id}/{scope}, '
                                    f'SignedHeaders={signed}, Signature={signature}')
        if body is not None:
            headers['Content-Type'] = 'application/octet-stream'
            headers['Content-Length'] = str(length)
        # Fixed https endpoint of the Cloudflare R2 S3 API.
        # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
        return urllib.request.urlopen(
            urllib.request.Request('https://' + self.host + path, data=body, headers=headers, method=method),
            timeout=180)


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source = pathlib.Path(sys.argv[1]).resolve(strict=True)
    if not source.is_dir():
        raise SystemExit(__doc__)
    token = sys.stdin.readline().strip()
    if not token:
        raise SystemExit(__doc__)
    manifest = json.loads((ROOT / 'releases/manifest.json').read_text())
    matches = []
    # Check the complete set before writing any object.
    for item in manifest['files']:
        candidates = [p for p in source.rglob('*') if p.is_file() and not p.is_symlink() and p.stat().st_size == item['bytes']]
        match = next((p for p in candidates if hashlib.file_digest(p.open('rb'), 'sha256').hexdigest() == item['sha256']), None)
        if match is None:
            raise SystemExit('Missing or changed artifact: ' + item['filename'])
        matches.append((item, match))
    bucket = Bucket(cloudflare_account(), token_id(token), token)
    for item, path in matches:
        # The signed SHA-256 makes R2 refuse a body that differs from the
        # manifest; a single PUT keeps the reviewed single-part ETag (MD5).
        with path.open('rb') as body, bucket.request('PUT', item['key'], item['sha256'], body, item['bytes']) as response:
            etag = response.headers.get('ETag', '').strip('"')
        if etag != item['etag']:
            raise SystemExit('Unexpected ETag: ' + item['filename'])
        with bucket.request('GET', item['key'], EMPTY) as response:
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
