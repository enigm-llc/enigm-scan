// Enigm Scan research worker: every six hours it reads new public research
// on phone spyware and asks Claude for the indicators each article
// publishes, each with its literal quote, which the worker checks. The result
// is a read-only JSON for the daily review in GitHub (see
// .github/workflows/intelligence-watch.yml). It never changes the signed
// indicators: a maintainer reviews, and signs offline.
import Anthropic from "@anthropic-ai/sdk";
import { DurableObject } from "cloudflare:workers";
import { Pipeline } from "./pipeline.mjs";

export class ResearchState extends DurableObject {
  pipeline() {
    return new Pipeline({
      store: this.ctx.storage,
      client: this.env.ANTHROPIC_API_KEY
        ? new Anthropic({ apiKey: this.env.ANTHROPIC_API_KEY })
        : null,
    });
  }
  async run() {
    return this.pipeline().run();
  }
  async report() {
    return this.pipeline().report();
  }
}

const state = (env) => env.STATE.get(env.STATE.idFromName("research"));
const json = (body, status = 200) =>
  new Response(JSON.stringify(body, null, 1), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(state(env).run());
  },
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method !== "GET") return json({ error: "method" }, 405);
    if (pathname === "/latest.json") return json(await state(env).report());
    return json({ error: "not_found" }, 404);
  },
};
