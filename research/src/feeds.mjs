// Feeds (RSS 2.0 and Atom) and article pages, read without a DOM: only what
// is needed, and nothing from them is ever followed or executed.
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, code) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : " ";
    }
    return ENTITIES[code.toLowerCase()] ?? all;
  });
}

function unwrap(text) {
  const cdata = text.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return cdata ? cdata[1] : decodeEntities(text);
}

function field(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? unwrap(match[1]).trim() : "";
}

/** Items of a feed: title, link, date and summary as plain text. */
export function parseFeed(xml) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const block of blocks.slice(0, 100)) {
    let link = field(block, "link");
    if (!link) {
      const href = block.match(/<link\b[^>]*\bhref="([^"]+)"/i);
      link = href ? decodeEntities(href[1]) : "";
    }
    const date = field(block, "pubDate") || field(block, "published") || field(block, "updated");
    const summary = htmlToText(field(block, "description") || field(block, "summary")).slice(0, 1000);
    const title = htmlToText(field(block, "title")).slice(0, 300);
    if (title && link) items.push({ title, link: link.trim(), date, summary });
  }
  return items;
}

/** Visible text of an HTML page: scripts, styles and markup removed. */
export function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|li|tr|h[1-6]|pre|table|section|article|br)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/** The article's own text: its <article> or <main> element when present. */
export function articleText(html) {
  const body =
    html.match(/<article[\s>][\s\S]*<\/article>/i)?.[0] ||
    html.match(/<main[\s>][\s\S]*<\/main>/i)?.[0] ||
    html;
  return htmlToText(body);
}
