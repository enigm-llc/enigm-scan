# Anonymous statistics

The download Worker keeps anonymous counts so the team can see how Enigm Scan is used, without learning anything about the people who use it. Nothing is collected by the app or the website: the counts come only from requests the Worker already serves.

## What is counted

| Event | When | Recorded fields |
| --- | --- | --- |
| `download` | A complete `GET` of a published package, from byte 0. Resumed ranges and `HEAD` requests are not counted again. | platform, architecture, release version, country |
| `rules` | A `GET` of the signed indicator bundle, which the app requests when it starts. It approximates app starts, not people. | bundle schema (`v1`/`v2`), country |

Each count is one data point in the Cloudflare Workers Analytics Engine dataset `enigm_scan_stats` (binding `STATS`): `blob1` event, `blob2`-`blob4` the fields above, `blob5` the two-letter country Cloudflare already infers for every request (`XX` when unknown), `double1` = 1.

## What is never recorded

IP addresses, user agents, cookies, referrers, device or session identifiers, phone data, scan results or reports. Without an identifier, counts cannot be linked to each other or to a person. Phone evidence never reaches the Worker.

If the dataset is unavailable, downloads continue unaffected.

## Reading the numbers

Create a temporary Cloudflare API token with **Account Analytics: Read** only, save it to a private file, and run:

```sh
python3 scripts/stats.py /path/to/token-file 30            # last 30 days
python3 scripts/stats.py /path/to/token-file 90 --csv out/  # also write CSV files
```

The report shows downloads by system, by day and by country, and rule refreshes by day. Analytics Engine keeps data for three months; export CSV snapshots regularly to keep a longer history. Never store the token in the repository.
