import { describe, expect, it } from "vitest";
import { canonical, normalize, refang, verify } from "../src/verify.mjs";
import { articleText, parseFeed } from "../src/feeds.mjs";
import { fetchAllowed, Pipeline } from "../src/pipeline.mjs";
import { SCHEMA, params } from "../src/model.mjs";
import { onTopic } from "../src/sources.mjs";

const ARTICLE = `Our analysis found that the Graphite spyware contacted
c2[.]example-spy[.]net and 203.0.113.7 after the zero-click exploit.
The Android sample (SHA-256: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA)
installed the package com.evil.monitor.`;

describe("verification of the model's answer", () => {
  it("keeps only indicators quoted word for word from the article", () => {
    const { kept, dropped } = verify(
      [
        {
          kind: "domain",
          value: "c2.example-spy.net",
          family: "Graphite",
          platform: "ios",
          quote:
            "contacted c2[.]example-spy[.]net and 203.0.113.7 after the zero-click exploit.",
        },
        {
          kind: "ip",
          value: "203.0.113.7",
          family: "Graphite",
          platform: "ios",
          quote: "c2[.]example-spy[.]net and 203.0.113.7",
        },
        {
          kind: "sha256",
          value: "A".repeat(64),
          family: "Graphite",
          platform: "android",
          quote: "(SHA-256: " + "A".repeat(64) + ")",
        },
        {
          kind: "app_id",
          value: "com.evil.monitor",
          family: "Graphite",
          platform: "android",
          quote: "installed the package com.evil.monitor.",
        },
        // Invented: not in the article.
        {
          kind: "domain",
          value: "invented.example",
          family: "x",
          platform: "ios",
          quote: "contacted invented.example",
        },
        // The quote is real but does not hold the value.
        {
          kind: "domain",
          value: "other.example",
          family: "x",
          platform: "ios",
          quote: "after the zero-click exploit.",
        },
        // Not an indicator of its kind.
        {
          kind: "sha256",
          value: "1234",
          family: "x",
          platform: "ios",
          quote: "after the zero-click exploit.",
        },
      ],
      ARTICLE,
    );
    expect(kept.map((k) => k.value)).toEqual([
      "c2.example-spy.net",
      "203.0.113.7",
      "a".repeat(64),
      "com.evil.monitor",
    ]);
    expect(dropped).toBe(3);
  });
  it("undoes defanging and compares without layout", () => {
    expect(refang("hxxps://a[.]b(.)c[dot]d x[@]y.z")).toBe(
      "https://a.b.c.d x@y.z",
    );
    expect(normalize("  A​  B\n C ")).toBe("a b c");
    expect(canonical("domain", "*.Example.COM.")).toBe("example.com");
    expect(canonical("domain", "not a domain")).toBeNull();
    expect(canonical("app_cert_sha256", "AB:".repeat(31) + "AB")).toBe(
      "ab".repeat(32),
    );
  });
});

describe("feeds and pages", () => {
  it("reads RSS and Atom items", () => {
    const rss = `<rss><channel><item><title><![CDATA[New spyware &amp; iPhone]]></title><link>https://citizenlab.ca/2026/11/x/</link><pubDate>Fri, 27 Nov 2026 10:00:00 +0000</pubDate><description>&lt;p&gt;Android stalkerware&lt;/p&gt;</description></item></channel></rss>`;
    expect(parseFeed(rss)).toEqual([
      {
        title: "New spyware & iPhone",
        link: "https://citizenlab.ca/2026/11/x/",
        date: "Fri, 27 Nov 2026 10:00:00 +0000",
        summary: "Android stalkerware",
      },
    ]);
    const atom = `<feed><entry><title>Report</title><link rel="alternate" href="https://securelist.com/a/"/><published>2026-11-27T00:00:00Z</published><summary>x</summary></entry></feed>`;
    expect(parseFeed(atom)[0].link).toBe("https://securelist.com/a/");
  });
  it("keeps the article's text, not its scripts or navigation", () => {
    const html = `<html><nav>Menu</nav><script>alert(1)</script><article><h1>Title</h1><p>First &amp; second.</p></article><footer>f</footer></html>`;
    expect(articleText(html)).toBe("Title\nFirst & second.");
  });
  it("reads only phone spyware topics", () => {
    expect(onTopic("Pegasus targets journalists")).toBe(true);
    expect(onTopic("Ransomware hits hospitals")).toBe(false);
  });
  it("never leaves the allowed hosts, even through a redirect", async () => {
    const fetcher = async (url) =>
      url === "https://securelist.com/a/"
        ? new Response(null, {
            status: 302,
            headers: { location: "https://attacker.example/x" },
          })
        : new Response("ok");
    await expect(
      fetchAllowed(fetcher, "https://securelist.com/a/", "text/html"),
    ).rejects.toThrow("host_not_allowed");
    await expect(
      fetchAllowed(fetcher, "https://attacker.example/x", "text/html"),
    ).rejects.toThrow("host_not_allowed");
  });
});

describe("the request to the model", () => {
  it("asks for the strict schema and passes the article as data", () => {
    const p = params({
      source: "S",
      title: "T",
      url: "https://citizenlab.ca/x",
      text: "body",
    });
    expect(p.model).toBe("claude-opus-5-5");
    expect(p.output_config.format).toEqual({
      type: "json_schema",
      schema: SCHEMA,
    });
    expect(p.messages[0].content).toContain("<article>\nbody\n</article>");
    expect(p).not.toHaveProperty("tools");
  });
});

function memoryStore() {
  const map = new Map();
  return {
    map,
    get: async (k) => structuredClone(map.get(k)),
    put: async (k, v) => void map.set(k, structuredClone(v)),
    delete: async (k) => void map.delete(k),
  };
}

const FEED = `<rss><channel><item><title>Graphite spyware on iPhone</title><link>https://citizenlab.ca/2026/11/graphite/</link><pubDate>${new Date().toUTCString()}</pubDate><description>zero-click</description></item><item><title>Ransomware report</title><link>https://citizenlab.ca/2026/11/other/</link><pubDate>${new Date().toUTCString()}</pubDate><description>x</description></item></channel></rss>`;
const PAGE = `<article><p>${ARTICLE.repeat(4)}</p></article>`;

function fakeFetch(url) {
  if (url === "https://citizenlab.ca/feed/") return new Response(FEED);
  if (url === "https://citizenlab.ca/2026/11/graphite/")
    return new Response(PAGE);
  return new Response("", { status: 404 });
}

function fakeClient({ refuse = false } = {}) {
  const batches = new Map();
  const reply = (stop) => ({
    model: "claude-opus-5-5",
    stop_reason: stop,
    content:
      stop === "refusal"
        ? []
        : [
            {
              type: "text",
              text: JSON.stringify({
                relevant: true,
                summary: "Graphite targeted iPhones.",
                families: ["Graphite"],
                indicators: [
                  {
                    kind: "domain",
                    value: "c2.example-spy.net",
                    family: "Graphite",
                    platform: "ios",
                    quote: "contacted c2[.]example-spy[.]net and 203.0.113.7",
                  },
                  {
                    kind: "domain",
                    value: "made-up.example",
                    family: "Graphite",
                    platform: "ios",
                    quote: "made-up.example",
                  },
                ],
              }),
            },
          ],
  });
  return {
    sent: [],
    direct: 0,
    messages: {
      batches: {
        create: async ({ requests }) => {
          const id = `batch_${batches.size + 1}`;
          batches.set(id, requests);
          return { id };
        },
        retrieve: async (id) => ({ id, processing_status: "ended" }),
        results: async (id) =>
          batches.get(id).map((r) => ({
            custom_id: r.custom_id,
            result: {
              type: "succeeded",
              message: reply(refuse ? "refusal" : "end_turn"),
            },
          })),
      },
    },
    beta: {
      messages: {
        create: async function (p) {
          this.direct = (this.direct || 0) + 1;
          expect(p.fallbacks).toBe("default");
          expect(p.betas).toEqual(["server-side-fallback-2026-07-01"]);
          return reply("end_turn");
        },
      },
    },
  };
}

describe("a run", () => {
  it("sends new on-topic articles, then publishes only verified indicators", async () => {
    const store = memoryStore();
    const client = fakeClient();
    const pipeline = new Pipeline({
      store,
      client,
      fetcher: async (u) => fakeFetch(u),
    });
    const first = await pipeline.run();
    expect(first.found).toBe(1);
    expect(first.sent).toBe(1);
    const second = await pipeline.run();
    expect(second.collected).toBe(1);
    const report = await pipeline.report();
    expect(report.articles).toHaveLength(1);
    const [a] = report.articles;
    expect(a.indicators.map((i) => i.value)).toEqual(["c2.example-spy.net"]);
    expect(a.dropped).toBe(1);
    expect(JSON.stringify(report)).not.toContain("zero-click exploit.");
    // Seen articles are not sent again.
    const third = await pipeline.run();
    expect(third.found).toBe(0);
  });
  it("asks again with a fallback model when the batch's model declines", async () => {
    const store = memoryStore();
    const client = fakeClient({ refuse: true });
    const pipeline = new Pipeline({
      store,
      client,
      fetcher: async (u) => fakeFetch(u),
    });
    await pipeline.run();
    await pipeline.run();
    expect(client.beta.messages.direct).toBe(1);
    const report = await pipeline.report();
    expect(report.articles[0].outcome).toBe("answered");
  });
  it("without an API key it only reads the feeds", async () => {
    const store = memoryStore();
    const status = await new Pipeline({
      store,
      client: null,
      fetcher: async (u) => fakeFetch(u),
    }).run();
    expect(status.note).toBe("no_api_key");
    expect(status.found).toBe(1);
  });
});
