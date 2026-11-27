# Anonymous statistics

The download Worker keeps anonymous counts so the team can see how Enigm Scan is used, without learning anything about the people who use it. Nothing is collected by the app or the website: the counts come only from requests the Worker already serves.

## What is counted

| Event | When | Recorded fields |
| --- | --- | --- |
| `download` | A complete `GET` of a published package, from byte 0. Resumed ranges and `HEAD` requests are not counted again. | platform, architecture, release version, country |
| `rules` | A `GET` of the signed indicator bundle, which the app requests when it starts. It approximates app starts, not people. | bundle schema (`v1`/`v2`), app version, system and architecture, country |
| `version_check` | A `GET` of the download list by the app, which reads it at start to offer a newer version. The website reading the same list is not counted. | app version, system and architecture, country |
| `visit` | A page of the website opened in a browser (home, how it works, download). The files a page loads are not counted, nor are requests that announce themselves as crawlers. | page, country |

The app names itself in its two requests as `EnigmScan/<version> (<system>; <architecture>)`, for example `EnigmScan/1.0.0 (macos; aarch64)`: the same text for every copy of a release, with nothing that tells one computer from another. Only that exact form is counted; anything else is recorded as `unknown`.

Each count is one data point in the Cloudflare Workers Analytics Engine dataset `enigm_scan_stats` (binding `STATS`): `blob1` event, `blob2`-`blob4` the fields above, `blob5` the two-letter country Cloudflare already infers for every request (`XX` when unknown), `double1` = 1.

Scans are not counted. Counting them would need the app to send something while it scans, which it never does: someone watching the network could tell that a phone was being checked.

## What is never recorded

IP addresses, user agents, cookies, referrers, device or session identifiers, phone data, scan results or reports. Without an identifier, counts cannot be linked to each other or to a person. Phone evidence never reaches the Worker.

If the dataset is unavailable, downloads continue unaffected.

## Reading the numbers

Create a temporary Cloudflare API token with **Account Analytics: Read** only, save it to a private file, and run:

```sh
python3 scripts/stats.py 30 < /path/to/token-file        # last 30 days
python3 scripts/stats.py 90 --csv < /path/to/token-file  # also write ./stats-csv/
```

The report shows downloads by system, by day and by country, app starts by day and by version and system, version checks by version, and website visits by page and by country. Analytics Engine keeps data for three months; export CSV snapshots regularly to keep a longer history. Never store the token in the repository.
