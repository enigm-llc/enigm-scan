"""Anonymous usage counts from the download Worker. Read-only.

Usage: python3 scripts/stats.py [DAYS] [--csv] < TOKEN_FILE
The token is read from standard input; --csv also writes the tables to
./stats-csv/.
The token needs only "Account Analytics: Read". See docs/STATISTICS.md.
"""
import csv
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


ACCOUNT = cloudflare_account()
URL = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/analytics_engine/sql'
DATASET = 'enigm_scan_stats'


def query(token, sql):
    req = urllib.request.Request(URL, data=sql.encode(), method='POST',
                                 headers={'Authorization': 'Bearer ' + token})
    # Fixed https endpoint of the Cloudflare analytics API.
    # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.load(response).get('data', [])


def main():
    args = sys.argv[1:]
    token = sys.stdin.readline().strip()
    if not token:
        raise SystemExit(__doc__)
    days = next((int(a) for a in args if a.isdigit()), 30)
    out = pathlib.Path.cwd() / 'stats-csv' if '--csv' in args else None
    since = f"timestamp > NOW() - INTERVAL '{days}' DAY"
    total = 'SUM(_sample_interval * double1)'
    reports = {
        'downloads by system': f"SELECT blob2 AS platform, blob3 AS arch, blob4 AS version, {total} AS downloads FROM {DATASET} WHERE blob1 = 'download' AND {since} GROUP BY platform, arch, version ORDER BY downloads DESC",
        'downloads by day': f"SELECT toStartOfDay(timestamp) AS day, {total} AS downloads FROM {DATASET} WHERE blob1 = 'download' AND {since} GROUP BY day ORDER BY day",
        'downloads by country': f"SELECT blob5 AS country, {total} AS downloads FROM {DATASET} WHERE blob1 = 'download' AND {since} GROUP BY country ORDER BY downloads DESC LIMIT 25",
        'app starts by day (rule refreshes)': f"SELECT toStartOfDay(timestamp) AS day, {total} AS starts FROM {DATASET} WHERE blob1 = 'rules' AND {since} GROUP BY day ORDER BY day",
    }
    if out:
        out.mkdir(parents=True, exist_ok=True)
    for title, sql in reports.items():
        rows = query(token, sql)
        print(f'\n{title} (last {days} days)')
        if not rows:
            print('  no data yet')
            continue
        keys = list(rows[0])
        for row in rows:
            print('  ' + '  '.join(f'{row[k]}' for k in keys))
        if out:
            name = title.split(' (')[0].replace(' ', '-') + '.csv'
            with (out / name).open('w', newline='') as handle:
                writer = csv.DictWriter(handle, fieldnames=keys)
                writer.writeheader()
                writer.writerows(rows)


if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as error:
        raise SystemExit('Cloudflare request failed: HTTP ' + str(error.code)) from None
