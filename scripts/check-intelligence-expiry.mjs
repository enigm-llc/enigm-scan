// Fails when the signed rule bundle is close to expiry. Expired bundles are
// rejected by the native verifier, which stops the app from scanning.
// Usage: node scripts/check-intelligence-expiry.mjs [--days=14] [--file=<bundle>] [--url=<https URL>]
import { readFileSync } from "node:fs";
const args = process.argv.slice(2);
const option = (name) =>
  args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const days = Number(option("days") ?? 14);
if (!Number.isSafeInteger(days) || days < 0) throw new Error("Invalid --days");
const url = option("url");
const file = option("file") ?? "src-tauri/resources/intelligence/bundle.json";
if (url && !url.startsWith("https://")) throw new Error("Only HTTPS URLs");
const envelope = url
  ? await (async () => {
      const response = await fetch(url, { redirect: "error" });
      if (!response.ok) throw new Error(`${url} returned ${response.status}`);
      return response.json();
    })()
  : JSON.parse(readFileSync(file, "utf8"));
const bundle = JSON.parse(Buffer.from(envelope.payload, "base64").toString());
const remaining = (bundle.expiresAt - Date.now() / 1000) / 86400;
const where = url ?? file;
const summary = `${where}: version ${bundle.version} expires ${new Date(
  bundle.expiresAt * 1000,
).toISOString()} (${remaining.toFixed(1)} days left)`;
if (remaining < days) {
  console.error(
    `${summary}. Re-sign with scripts/build-intelligence.mjs and deploy before it expires.`,
  );
  process.exit(1);
}
console.log(summary);
