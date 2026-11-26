import intelligence from "../src-tauri/resources/intelligence/bundle.json";
import intelligenceV2 from "../src-tauri/resources/intelligence/bundle-v2.json";
import manifest from "../releases/manifest.json";

const secure = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cache-Control": "no-store",
};

/**
 * Anonymous counts for our own statistics: what happened, for which system
 * and version, and the country Cloudflare already infers for the request.
 * No IP address, user agent, cookie or identifier is ever recorded, so a
 * count cannot be tied to a person or linked to another count.
 */
function count(env, request, event, a = "", b = "", c = "") {
  try {
    const country =
      typeof request.cf?.country === "string" ? request.cf.country : "XX";
    env.STATS?.writeDataPoint({
      indexes: [event],
      blobs: [event, a, b, c, country],
      doubles: [1],
    });
  } catch {
    // Statistics never get in the way of a download.
  }
}

// A fixed, reviewed manifest is the entire public surface of the private bucket.
// No uploads, listing, evidence storage or arbitrary object paths are exposed.
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!path.startsWith("/downloads/")) return env.ASSETS.fetch(request);
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response(null, {
        status: 405,
        headers: { ...secure, Allow: "GET, HEAD" },
      });
    }
    // Schema 1 for released connectors; schema 2 adds forensic indicator types.
    if (
      path === "/downloads/intelligence.json" ||
      path === "/downloads/intelligence-v2.json"
    ) {
      const bundle =
        path === "/downloads/intelligence.json" ? intelligence : intelligenceV2;
      // Each rule refresh is one app start: active use, not people.
      if (request.method === "GET")
        count(
          env,
          request,
          "rules",
          path === "/downloads/intelligence.json" ? "v1" : "v2",
        );
      return new Response(
        request.method === "HEAD" ? null : JSON.stringify(bundle),
        {
          headers: { ...secure, "Content-Type": "application/json" },
        },
      );
    }
    if (path === "/downloads/manifest.json") {
      return new Response(
        request.method === "HEAD"
          ? null
          : JSON.stringify({
              ...manifest,
              files: manifest.files.filter((file) => file.published),
            }),
        {
          headers: { ...secure, "Content-Type": "application/json" },
        },
      );
    }
    const file = manifest.files.find(
      (file) => file.published && path === "/downloads/" + file.filename,
    );
    if (!file) return new Response(null, { status: 404, headers: secure });
    const etag = '"' + file.sha256 + '"';
    const headers = new Headers({
      ...secure,
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Accept-Ranges": "bytes",
      ETag: etag,
      "X-Checksum-SHA256": file.sha256,
    });
    let offset = 0,
      length = file.bytes,
      partial = false;
    const range = request.headers.get("Range");
    const ifRange = request.headers.get("If-Range");
    if (request.method === "GET" && range && (!ifRange || ifRange === etag)) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match && (match[1] || match[2])) {
        if (match[1]) {
          offset = Number(match[1]);
          length =
            (match[2]
              ? Math.min(Number(match[2]), file.bytes - 1)
              : file.bytes - 1) -
            offset +
            1;
        } else {
          length = Math.min(Number(match[2]), file.bytes);
          offset = file.bytes - length;
        }
        partial = true;
      }
      if (
        !partial ||
        !Number.isSafeInteger(offset) ||
        !Number.isSafeInteger(length) ||
        offset >= file.bytes ||
        length <= 0
      ) {
        headers.set("Content-Range", `bytes */${file.bytes}`);
        return new Response(null, { status: 416, headers });
      }
    }
    try {
      const object =
        request.method === "HEAD"
          ? await env.RELEASES.head(file.key)
          : await env.RELEASES.get(
              file.key,
              partial ? { range: { offset, length } } : undefined,
            );
      if (!object) return new Response(null, { status: 404, headers: secure });
      if (object.size !== file.bytes || object.etag !== file.etag) {
        return new Response(null, { status: 503, headers: secure });
      }
      // One download per complete request from the first byte; resumed
      // ranges are not counted again.
      if (request.method === "GET" && offset === 0)
        count(
          env,
          request,
          "download",
          file.platform,
          file.arch,
          manifest.version,
        );
      headers.set("Content-Length", String(length));
      if (partial)
        headers.set(
          "Content-Range",
          `bytes ${offset}-${offset + length - 1}/${file.bytes}`,
        );
      return new Response(request.method === "HEAD" ? null : object.body, {
        status: partial ? 206 : 200,
        headers,
      });
    } catch {
      return new Response(null, { status: 503, headers: secure });
    }
  },
};
