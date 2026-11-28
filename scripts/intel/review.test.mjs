import { describe, expect, it } from "vitest";
import { code, plain, researchSection } from "./review.mjs";

const now = Date.parse("2026-11-28T12:00:00Z");
const article = (over = {}) => ({
  id: "a1b2",
  url: "https://citizenlab.ca/2026/11/graphite/",
  title: "Graphite [click](https://evil.example) @someone",
  source: "Citizen Lab",
  date: "2026-11-27T00:00:00Z",
  answered_at: "2026-11-28T06:30:00Z",
  relevant: true,
  outcome: "answered",
  summary: "Graphite targeted iPhones.",
  dropped: 1,
  indicators: [
    {
      kind: "domain",
      value: "c2.example-spy.net",
      family: "Graphite",
      platform: "ios",
      quote: "contacted `c2[.]example-spy[.]net`",
    },
    {
      kind: "domain",
      value: "known.example",
      family: "Graphite",
      platform: "ios",
      quote: "known.example",
    },
  ],
  ...over,
});

describe("the daily review", () => {
  it("shows outside text without markup, links or mentions", () => {
    expect(plain("[x](https://a.b) @me <b>")).toBe(
      "\\[x\\]\\(https:/​/a.b\\) @​me \\<b\\>",
    );
    expect(code("a`b\nc")).toBe("`a'b c`");
  });
  it("lists new candidates, counts signed and dropped ones, and posts each article once", () => {
    const known = new Set(["domain\0known.example"]);
    const text = researchSection({ articles: [article()] }, known, "", now);
    expect(text).toContain("<!-- article:a1b2 -->");
    expect(text).toContain(
      "1 new indicator(s) quoted from the article, 1 already signed, 1 dropped",
    );
    expect(text).toContain("`c2.example-spy.net`");
    expect(text).not.toContain("`known.example` |");
    expect(text).not.toMatch(/[^\\]\[click\]/);
    expect(
      researchSection(
        { articles: [article()] },
        known,
        "<!-- article:a1b2 -->",
        now,
      ),
    ).toBe("");
  });
  it("leaves out old answers and articles that are not about phone spyware", () => {
    expect(
      researchSection(
        { articles: [article({ answered_at: "2026-11-20T00:00:00Z" })] },
        new Set(),
        "",
        now,
      ),
    ).toBe("");
    expect(
      researchSection(
        { articles: [article({ relevant: false })] },
        new Set(),
        "",
        now,
      ),
    ).toBe("");
    expect(
      researchSection(
        { articles: [article({ relevant: null, outcome: "declined" })] },
        new Set(),
        "",
        now,
      ),
    ).toContain("read it yourself");
  });
});
