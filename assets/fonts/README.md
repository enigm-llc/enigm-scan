# PDF typography

Unmodified `hinted/static/Roboto-Regular.ttf` from [Roboto 3.016](https://github.com/googlefonts/roboto-3-classic/releases/tag/v3.016), distributed under the included OFL-1.1 license.

- Archive `Roboto_v3.016.zip` SHA-256: `1653dbe12f248da8fb0b9920db7b9496cd677ed3981154f6f15285c8bd4e334f` (verified against the release asset digest).
- Font SHA-256: `9f300202f482ad59f8b13bc3131a295744d14fd530fa3765a0a11ec87264d203`.
- License: upstream `OFL.txt` at tag `v3.016`.

Run `node scripts/package-report-font.mjs` to regenerate the PDF-only module and supported code-point ranges. The unmodified font is embedded and subset by jsPDF on export; no remote requests or additional native CSP privileges are required. The web continues to use the local variable Roboto package.

Characters outside this font, invisible formatting/control characters and supplementary Unicode characters are printed as `[U+XXXX]` instead of silently omitted. A localized PDF note explains this convention. JSON retains the exact original strings. This is not full-script font/shaping support.
