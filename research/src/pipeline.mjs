// One run of the research worker: collect the model's answers to earlier
// articles, then read the feeds and send the new articles. State lives in
// the worker's Durable Object storage (`store`: get, put, delete).
import { ARTICLE_HOSTS, FEEDS, onTopic } from "./sources.mjs";
import { articleText, parseFeed } from "./feeds.mjs";
import { MAX_ARTICLE_CHARS, MODEL, answer, params } from "./model.mjs";
import { verify } from "./verify.mjs";

const AGENT = "EnigmScanResearch/1.0 (+https://github.com/enigm-llc/enigm-scan)";
const DAY = 86400_000;
const NEW_PER_RUN = 15;
const MAX_PAGE_BYTES = 3_000_000;
const KEEP_RESULTS = 300;
const KEEP_SEEN = 5000;

async function sha(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** A page on an allowed host, following redirects only between them. */
export async function fetchAllowed(fetcher, url, accept) {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const parsed = new URL(current);
    const allowed = ARTICLE_HOSTS.has(parsed.hostname) || FEEDS.some((f) => f.url === current);
    if (parsed.protocol !== "https:" || !allowed) {
      throw new Error("host_not_allowed");
    }
    const response = await fetcher(current, {
      redirect: "manual",
      headers: { "user-agent": AGENT, accept },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      current = new URL(response.headers.get("location") || "", current).toString();
      continue;
    }
    if (!response.ok) throw new Error(`http_${response.status}`);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_PAGE_BYTES) throw new Error("too_large");
    const text = await response.text();
    if (text.length > MAX_PAGE_BYTES) throw new Error("too_large");
    return text;
  }
  throw new Error("too_many_redirects");
}

export class Pipeline {
  constructor({ store, client, fetcher = fetch, now = () => Date.now() }) {
    this.store = store;
    this.client = client;
    this.fetch = fetcher;
    this.now = now;
  }

  async run() {
    const started = this.now();
    const lock = await this.store.get("running");
    if (lock && started - lock < 3600_000) return { skipped: "running" };
    await this.store.put("running", started);
    const status = { at: new Date(started).toISOString(), errors: [], collected: 0, sent: 0, found: 0 };
    try {
      if (this.client) await this.collect(status);
      await this.discover(status);
      if (this.client) await this.submit(status);
      else status.note = "no_api_key";
    } catch (error) {
      status.errors.push(String(error?.message || error).slice(0, 200));
    } finally {
      await this.store.put("status", status);
      await this.store.delete("running");
    }
    return status;
  }

  // 1. Answers to batches sent before.
  async collect(status) {
    const pending = (await this.store.get("pending")) || [];
    const still = [];
    for (const entry of pending) {
      let batch;
      try {
        batch = await this.client.messages.batches.retrieve(entry.batch);
      } catch (error) {
        status.errors.push(`batch ${entry.batch}: ${String(error?.message || error).slice(0, 120)}`);
        still.push(entry);
        continue;
      }
      if (batch.processing_status !== "ended") {
        still.push(entry);
        continue;
      }
      const answered = new Set();
      for await (const item of await this.client.messages.batches.results(entry.batch)) {
        answered.add(item.custom_id);
        const article = await this.store.get(`article:${item.custom_id}`);
        if (!article) continue;
        if (item.result.type === "succeeded") {
          if (item.result.message.stop_reason === "refusal") await this.direct(article, status);
          else await this.record(article, item.result.message, status);
        } else {
          await this.requeue(article);
        }
      }
      for (const id of entry.ids) if (!answered.has(id)) {
        const article = await this.store.get(`article:${id}`);
        if (article) await this.requeue(article);
      }
    }
    await this.store.put("pending", still);
  }

  // A request the batch's model declined: asked again on its own, where the
  // API can hand it to a fallback model (batches cannot).
  async direct(article, status) {
    try {
      const message = await this.client.beta.messages.create({
        ...params(article),
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
      await this.record(article, message, status);
    } catch (error) {
      status.errors.push(`direct ${article.id}: ${String(error?.message || error).slice(0, 120)}`);
      await this.requeue(article);
    }
  }

  async requeue(article) {
    article.attempts = (article.attempts || 0) + 1;
    if (article.attempts > 3) {
      await this.save({ ...this.base(article), relevant: null, summary: "", families: [], indicators: [], dropped: 0, outcome: "failed" });
      await this.store.delete(`article:${article.id}`);
      return;
    }
    await this.store.put(`article:${article.id}`, article);
    const queue = (await this.store.get("queue")) || [];
    if (!queue.includes(article.id)) queue.push(article.id);
    await this.store.put("queue", queue);
  }

  base(article) {
    return {
      id: article.id,
      url: article.url,
      title: article.title,
      source: article.source,
      date: article.date,
      found_at: article.found_at,
      answered_at: new Date(this.now()).toISOString(),
    };
  }

  async record(article, message, status) {
    const data = answer(message);
    const result = { ...this.base(article), model: message?.model || MODEL };
    if (!data) {
      Object.assign(result, {
        relevant: null,
        summary: "",
        families: [],
        indicators: [],
        dropped: 0,
        outcome: message?.stop_reason === "refusal" ? "declined" : "unreadable",
      });
    } else {
      const { kept, dropped } = data.relevant ? verify(data.indicators, article.text) : { kept: [], dropped: 0 };
      Object.assign(result, {
        relevant: Boolean(data.relevant),
        summary: String(data.summary || "").slice(0, 600),
        families: (Array.isArray(data.families) ? data.families : []).map(String).slice(0, 10),
        indicators: kept.slice(0, 500),
        dropped,
        outcome: "answered",
      });
    }
    await this.save(result);
    await this.store.delete(`article:${article.id}`);
    status.collected++;
  }

  async save(result) {
    await this.store.put(`result:${result.id}`, result);
    const index = (await this.store.get("results")) || [];
    const next = [result.id, ...index.filter((id) => id !== result.id)];
    for (const old of next.slice(KEEP_RESULTS)) await this.store.delete(`result:${old}`);
    await this.store.put("results", next.slice(0, KEEP_RESULTS));
  }

  // 2. New articles in the feeds.
  async discover(status) {
    const seen = new Set((await this.store.get("seen")) || []);
    const queue = (await this.store.get("queue")) || [];
    const recent = this.now() - 21 * DAY;
    let added = 0;
    for (const feed of FEEDS) {
      let items;
      try {
        items = parseFeed(await fetchAllowed(this.fetch, feed.url, "application/rss+xml, application/atom+xml, text/xml"));
      } catch (error) {
        status.errors.push(`${feed.name}: ${String(error?.message || error).slice(0, 80)}`);
        continue;
      }
      for (const item of items) {
        if (added >= NEW_PER_RUN) break;
        let url;
        try {
          url = new URL(item.link);
        } catch {
          continue;
        }
        url.hash = "";
        url.search = "";
        const id = (await sha(url.toString())).slice(0, 32);
        if (seen.has(id)) continue;
        const when = Date.parse(item.date);
        if (Number.isFinite(when) && when < recent) {
          seen.add(id);
          continue;
        }
        if (!onTopic(`${item.title}\n${item.summary}`) || !ARTICLE_HOSTS.has(url.hostname)) {
          seen.add(id);
          continue;
        }
        let text;
        try {
          text = articleText(await fetchAllowed(this.fetch, url.toString(), "text/html"));
        } catch (error) {
          status.errors.push(`${url.hostname}: ${String(error?.message || error).slice(0, 80)}`);
          continue; // tried again next run
        }
        seen.add(id);
        if (text.length < 300) continue;
        const article = {
          id,
          url: url.toString(),
          title: item.title,
          source: feed.name,
          date: Number.isFinite(when) ? new Date(when).toISOString() : null,
          found_at: new Date(this.now()).toISOString(),
          text: text.slice(0, MAX_ARTICLE_CHARS),
          attempts: 0,
        };
        await this.store.put(`article:${id}`, article);
        queue.push(id);
        added++;
        status.found++;
      }
    }
    await this.store.put("queue", queue);
    await this.store.put("seen", [...seen].slice(-KEEP_SEEN));
  }

  // 3. One batch with every article waiting for an answer.
  async submit(status) {
    const queue = (await this.store.get("queue")) || [];
    const articles = [];
    for (const id of queue) {
      const article = await this.store.get(`article:${id}`);
      if (article) articles.push(article);
    }
    if (!articles.length) {
      await this.store.put("queue", []);
      return;
    }
    const batch = await this.client.messages.batches.create({
      requests: articles.map((article) => ({ custom_id: article.id, params: params(article) })),
    });
    const pending = (await this.store.get("pending")) || [];
    pending.push({ batch: batch.id, ids: articles.map((a) => a.id), submitted: new Date(this.now()).toISOString() });
    await this.store.put("pending", pending);
    await this.store.put("queue", []);
    status.sent = articles.length;
  }

  /** What is published for the daily review (never the article texts). */
  async report(days = 30) {
    const since = this.now() - days * DAY;
    const ids = (await this.store.get("results")) || [];
    const articles = [];
    for (const id of ids) {
      const result = await this.store.get(`result:${id}`);
      if (result && Date.parse(result.found_at) >= since) articles.push(result);
    }
    return {
      generated: new Date(this.now()).toISOString(),
      status: (await this.store.get("status")) || null,
      waiting: ((await this.store.get("queue")) || []).length,
      batches: ((await this.store.get("pending")) || []).length,
      articles,
    };
  }
}
