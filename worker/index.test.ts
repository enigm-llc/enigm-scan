// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
// @ts-expect-error Worker module is bundled separately by Wrangler.
import worker from "./index.mjs";
import manifest from "../releases/manifest.json";

vi.mock("../releases/manifest.json", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../releases/manifest.json")>();
  return {
    default: {
      ...original.default,
      files: original.default.files.map((file, i) => ({
        ...file,
        published: i === 0,
      })),
    },
  };
});

const file = manifest.files[0];
function env() {
  const object = {
    size: file.bytes,
    etag: file.etag,
    body: new Uint8Array([1, 2, 3]),
  };
  return {
    STATS: { writeDataPoint: vi.fn() },
    ASSETS: { fetch: vi.fn(() => new Response("asset")) },
    RELEASES: {
      head: vi.fn(async () => object),
      get: vi.fn(async () => object),
    },
  };
}
const url = "https://scan.enigm.io/downloads/" + file.filename;
describe("public installer boundary", () => {
  it("does not expose uploads, arbitrary bucket paths or listings", async () => {
    const e = env();
    expect(
      (
        await worker.fetch(
          new Request(url, { method: "PUT", body: "evidence" }),
          e,
        )
      ).status,
    ).toBe(405);
    expect(
      (
        await worker.fetch(
          new Request("https://scan.enigm.io/downloads/private.json"),
          e,
        )
      ).status,
    ).toBe(404);
    expect(e.RELEASES.get).not.toHaveBeenCalled();
    expect(e.ASSETS.fetch).not.toHaveBeenCalled();
  });
  it("supports HEAD without loading installer bytes", async () => {
    const e = env();
    const r = await worker.fetch(new Request(url, { method: "HEAD" }), e);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("");
    expect(r.headers.get("Content-Length")).toBe(String(file.bytes));
    expect(r.headers.get("X-Checksum-SHA256")).toBe(file.sha256);
    expect(e.RELEASES.get).not.toHaveBeenCalled();
  });
  it("streams bounded ranges and rejects invalid ranges", async () => {
    const e = env();
    const r = await worker.fetch(
      new Request(url, { headers: { Range: "bytes=0-2" } }),
      e,
    );
    expect(r.status).toBe(206);
    expect(r.headers.get("Content-Range")).toBe(`bytes 0-2/${file.bytes}`);
    expect(e.RELEASES.get).toHaveBeenCalledWith(file.key, {
      range: { offset: 0, length: 3 },
    });
    for (const range of [
      "bytes=99999999999-",
      "bytes=3-1",
      "bytes=0-2,8-9",
      "bytes=-0",
    ]) {
      expect(
        (await worker.fetch(new Request(url, { headers: { Range: range } }), e))
          .status,
      ).toBe(416);
    }
  });
  it("rejects replaced or missing objects and ignores stale If-Range", async () => {
    const e = env();
    const r = await worker.fetch(
      new Request(url, { headers: { Range: "bytes=0-2", "If-Range": "old" } }),
      e,
    );
    expect(r.status).toBe(200);
    e.RELEASES.get.mockResolvedValueOnce({
      size: file.bytes,
      etag: "changed",
      body: new Uint8Array(),
    });
    expect((await worker.fetch(new Request(url), e)).status).toBe(503);
    e.RELEASES.get.mockResolvedValueOnce(null as never);
    expect((await worker.fetch(new Request(url), e)).status).toBe(404);
  });
});

it("serves only the public signed intelligence envelope without accessing evidence storage", async () => {
  const e = env();
  const endpoint = "https://scan.enigm.io/downloads/intelligence.json";
  const response = await worker.fetch(new Request(endpoint), e);
  const bundle = await response.json();
  expect(Object.keys(bundle).sort()).toEqual(["payload", "signature"]);
  expect(e.RELEASES.get).not.toHaveBeenCalled();
  expect(
    (
      await worker.fetch(
        new Request(endpoint, { method: "POST", body: "private" }),
        e,
      )
    ).status,
  ).toBe(405);
  expect(
    await (
      await worker.fetch(new Request(endpoint, { method: "HEAD" }), e)
    ).text(),
  ).toBe("");
});

it("keeps schema 1 for released connectors and serves schema 2 separately", async () => {
  const e = env();
  const decode = async (path: string) => {
    const response = await worker.fetch(
      new Request("https://scan.enigm.io/downloads/" + path),
      e,
    );
    expect(response.status).toBe(200);
    const { payload } = await response.json();
    return JSON.parse(Buffer.from(payload, "base64").toString());
  };
  const v1 = await decode("intelligence.json");
  const v2 = await decode("intelligence-v2.json");
  expect(v1.schemaVersion).toBe(1);
  expect(v2.schemaVersion).toBe(2);
  expect(v1.version).toBe(v2.version);
  // Released connectors only understand these types.
  expect(new Set(v1.rules.map((r: { kind: string }) => r.kind))).toEqual(
    new Set(["domain", "ip", "sha256"]),
  );
  expect(v2.rules.length).toBeGreaterThan(v1.rules.length);
  expect(
    v2.rules.some((r: { kind: string }) => r.kind === "process_name"),
  ).toBe(true);
  expect(e.RELEASES.get).not.toHaveBeenCalled();
});
describe("anonymous statistics", () => {
  it("counts a download anonymously, once, without any identifier", async () => {
    const e = env();
    const request = new Request(url, {
      headers: {
        "User-Agent": "secret-agent",
        "CF-Connecting-IP": "203.0.113.7",
      },
    });
    await worker.fetch(request, e);
    expect(e.STATS.writeDataPoint).toHaveBeenCalledTimes(1);
    const point = JSON.stringify(e.STATS.writeDataPoint.mock.calls[0][0]);
    expect(point).toContain("download");
    expect(point).toContain(file.platform);
    expect(point).not.toContain("203.0.113.7");
    expect(point).not.toContain("secret-agent");
    await worker.fetch(
      new Request(url, { headers: { Range: "bytes=100-" } }),
      e,
    );
    await worker.fetch(new Request(url, { method: "HEAD" }), e);
    expect(e.STATS.writeDataPoint).toHaveBeenCalledTimes(1);
  });
  it("counts app starts and version checks by version and system only", async () => {
    const e = env();
    const app = { "User-Agent": "EnigmScan/1.0.0 (macos; aarch64)" };
    await worker.fetch(
      new Request("https://scan.enigm.io/downloads/intelligence-v2.json", {
        headers: { ...app, "CF-Connecting-IP": "203.0.113.7" },
      }),
      e,
    );
    await worker.fetch(
      new Request("https://scan.enigm.io/downloads/manifest.json", {
        headers: app,
      }),
      e,
    );
    const points = e.STATS.writeDataPoint.mock.calls.map((c) => c[0].blobs);
    expect(points[0].slice(0, 4)).toEqual([
      "rules",
      "v2",
      "1.0.0",
      "macos-aarch64",
    ]);
    expect(points[1].slice(0, 3)).toEqual([
      "version_check",
      "1.0.0",
      "macos-aarch64",
    ]);
    expect(JSON.stringify(points)).not.toContain("203.0.113.7");
    // Anything that is not the app's exact form is not recorded as given.
    await worker.fetch(
      new Request("https://scan.enigm.io/downloads/intelligence-v2.json", {
        headers: { "User-Agent": "EnigmScan/1.0.0 (macos; aarch64) extra" },
      }),
      e,
    );
    expect(e.STATS.writeDataPoint.mock.calls[2][0].blobs[2]).toBe("unknown");
    // The website reading the manifest is not a version check.
    await worker.fetch(
      new Request("https://scan.enigm.io/downloads/manifest.json"),
      e,
    );
    expect(e.STATS.writeDataPoint).toHaveBeenCalledTimes(3);
  });
  it("counts a visit per page opened, never its files or crawlers", async () => {
    const e = env();
    const open = (path: string, headers: Record<string, string>) =>
      worker.fetch(new Request("https://scan.enigm.io" + path, { headers }), e);
    const page = { "Sec-Fetch-Dest": "document", "User-Agent": "Mozilla/5.0" };
    await open("/download/", page);
    await open("/como-funciona", page);
    await open("/assets/index.js", { ...page, "Sec-Fetch-Dest": "script" });
    await open("/", { ...page, "User-Agent": "Googlebot/2.1" });
    await open("/", { "User-Agent": "Mozilla/5.0" });
    const points = e.STATS.writeDataPoint.mock.calls.map((c) => c[0].blobs);
    expect(points.map((b) => b[1])).toEqual(["download", "how"]);
    expect(e.ASSETS.fetch).toHaveBeenCalledTimes(5);
  });
  it("keeps serving downloads when statistics are unavailable", async () => {
    const e = {
      ...env(),
      STATS: {
        writeDataPoint: vi.fn(() => {
          throw new Error("down");
        }),
      },
    };
    expect((await worker.fetch(new Request(url), e)).status).toBe(200);
  });
});
