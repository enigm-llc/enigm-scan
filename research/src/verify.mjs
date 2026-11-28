// What the model proposes is checked by code before anyone sees it: every
// indicator must be well formed and appear, word for word, in a sentence the
// article really contains. Anything else is dropped and counted.

/** Undo the usual defanging (example[.]com, hxxps, 1.2.3[.]4, [@]). */
export function refang(text) {
  return text
    .replace(/\[\s*(\.|dot)\s*\]|\(\s*(\.|dot)\s*\)|\{\s*\.\s*\}/gi, ".")
    .replace(/\[\s*(@|at)\s*\]/gi, "@")
    .replace(/\[\s*:\s*\]/g, ":")
    .replace(/\bhxxp(s?)/gi, "http$1")
    .replace(/\bfxp\b/gi, "ftp");
}

/** Text compared without layout: one space, no zero-width characters,
 *  straight quotes, refanged. */
export function normalize(text) {
  return refang(text)
    .replace(/[​-‍⁠﻿­]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const FORMATS = {
  domain: /^(?=.{4,253}$)(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/,
  ip: /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$|^[0-9a-f:]{3,39}$/,
  sha256: /^[a-f0-9]{64}$/,
  app_cert_sha256: /^[a-f0-9]{64}$/,
  app_id: /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i,
  process_name: /^[A-Za-z0-9._-]{2,64}$/,
  file_name: /^[^/\\\s][^/\\]{0,127}$/,
  file_path: /^\/[^\s]{1,511}$/,
  email: /^[^\s@]{1,64}@([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i,
  configuration_profile_id: /^[A-Za-z0-9][A-Za-z0-9._-]{2,254}$/,
};
export const KINDS = Object.keys(FORMATS);

/** The value as it would be signed, or null when it is not one. */
export function canonical(kind, value) {
  if (!FORMATS[kind] || typeof value !== "string") return null;
  let v = refang(value).trim();
  if (["domain", "sha256", "app_cert_sha256", "email", "ip"].includes(kind)) v = v.toLowerCase();
  if (kind === "app_cert_sha256") v = v.replace(/:/g, "");
  if (kind === "domain") v = v.replace(/^\*\./, "").replace(/\.$/, "");
  return FORMATS[kind].test(v) ? v : null;
}

/** Keep the candidates whose quote is in the article and holds the value. */
export function verify(candidates, article) {
  const text = normalize(article);
  const kept = [];
  let dropped = 0;
  const seen = new Set();
  for (const c of Array.isArray(candidates) ? candidates : []) {
    const value = canonical(c?.kind, c?.value);
    const quote = typeof c?.quote === "string" ? c.quote : "";
    const q = normalize(quote);
    const inQuote = value && (c.kind === "app_cert_sha256" ? q.replace(/:/g, "") : q).includes(
      value.toLowerCase(),
    );
    if (!value || q.length < 4 || q.length > 600 || !text.includes(q) || !inQuote) {
      dropped++;
      continue;
    }
    const key = `${c.kind}\0${value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push({
      kind: c.kind,
      value,
      family: String(c.family || "").slice(0, 80),
      platform: ["ios", "android", "both", "other"].includes(c.platform) ? c.platform : "other",
      quote: quote.replace(/\s+/g, " ").trim().slice(0, 600),
    });
  }
  return { kept, dropped };
}
