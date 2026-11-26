import React, { useEffect, useRef } from "react";

/**
 * The landing's background: a quiet honeycomb with one cell lit for a known
 * spyware family. On phones the cell stays put and its name changes; on wide
 * screens the light moves between cells that keep clear of the text. Starts
 * on Pegasus (the family with the most signed indicators); static on Pegasus
 * with reduced motion; paused when the tab is hidden. Purely decorative.
 */
/** Time each family stays on screen, in milliseconds. */
const PERIOD = 3400;
/**
 * The entrance: the cells draw outwards from the lit one, then it fills
 * with red and its name appears. Only then do the families start to rotate.
 */
const GRID_IN = 1100;
const SPREAD = 900;
const LIGHT_AT = 900;
const LIGHT_IN = 900;
const INTRO = LIGHT_AT + LIGHT_IN + 600;
/** Elements the light must never sit behind. */
const AVOID =
  ".landing h1, .landing-go, .landing-meta, .how-hero h1, .how-hero-action .landing-go, .scan-header .brand, .scan-header nav, .app-footer > *";

/** The boxes a node really paints: text lines for headings, else its box. */
function paintedBoxes(node: HTMLElement): DOMRect[] {
  if (/^H[1-6]$/.test(node.tagName)) {
    const range = document.createRange();
    range.selectNodeContents(node);
    return Array.from(range.getClientRects());
  }
  return [node.getBoundingClientRect()];
}
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function Honeycomb({
  name,
  names = [],
  caption,
  local = false,
  at,
  anchor,
}: {
  name: string;
  /** Families to rotate through (real names from the rule set). */
  names?: string[];
  caption: string;
  /** Scrolls with its section instead of filling the viewport. */
  local?: boolean;
  /** Where the lit cell sits, as fractions of the canvas. */
  at?: [number, number];
  /** Centre the lit cell on this element (overrides `at`). */
  anchor?: React.RefObject<HTMLElement | null>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = element.getContext("2d");
    } catch {
      context = null;
    }
    if (!context) return;
    const ctx = context;
    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let begin: number | null = null;
    let width = 0;
    let height = 0;
    let cache: {
      key: string;
      step: number;
      cells: Array<{ x: number; y: number }>;
    } = { key: "", step: -1, cells: [] };

    // Large screens zoom the page: page boxes are then measured in zoomed
    // pixels while the canvas works in its own. Convert between the two,
    // and draw at the zoomed resolution so the lines stay sharp.
    let zoom = 1;
    const resize = () => {
      width = element.clientWidth;
      height = element.clientHeight;
      zoom = width ? element.getBoundingClientRect().width / width || 1 : 1;
      const ratio = Math.min((window.devicePixelRatio || 1) * zoom, 4);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const hexagon = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      ctx.closePath();
    };

    const draw = (now: number) => {
      if (begin === null) begin = now;
      // Time since the page appeared; the rotation starts after the entrance.
      const since = reduce ? INTRO + PERIOD / 2 : now - begin;
      const time = Math.max(0, since - INTRO);
      const intro = (from: number, length: number) =>
        reduce ? 1 : ease(Math.min(1, Math.max(0, (since - from) / length)));
      const style = getComputedStyle(element);
      const ink = style.getPropertyValue("--dot").trim() || "#f4f4f5";
      const bad = style.getPropertyValue("--bad").trim() || "#fb4747";
      const light = style.getPropertyValue("--glow").trim() === "0";
      const font =
        getComputedStyle(document.body).fontFamily || "Roboto, sans-serif";
      ctx.clearRect(0, 0, width, height);
      const room =
        (anchor?.current?.getBoundingClientRect().height ?? 0) / zoom;
      const r = local
        ? Math.max(46, Math.min(78, width / 5.2, room ? room / 2.4 : 999))
        : Math.max(70, Math.min(118, width / 13));
      const hw = r * Math.sqrt(3);
      // The lit cell: lower right, clear of the headline and the action.
      let tx = width * (at ? at[0] : width < 900 ? 0.72 : 0.8);
      let ty = at ? height * at[1] : Math.min(height * 0.64, height - r * 2.2);
      const spot = anchor?.current?.getBoundingClientRect();
      if (spot && spot.height > 0) {
        const own = element.getBoundingClientRect();
        tx = (spot.left - own.left + spot.width / 2) / zoom;
        ty = (spot.top - own.top + spot.height / 2) / zoom;
      }
      let lit = { x: 0, y: 0, d: Infinity };
      const cells: Array<{ x: number; y: number }> = [];
      // Shift the grid so one cell lands exactly on the target.
      const row0 = Math.round(ty / (r * 1.5));
      const col0 = Math.round((tx - ((row0 & 1) * hw) / 2) / hw);
      const ox = tx - (col0 * hw + ((row0 & 1) * hw) / 2);
      const oy = ty - row0 * r * 1.5;
      for (let row = -2; row < height / (r * 1.5) + 2; row++)
        for (let col = -2; col < width / hw + 2; col++) {
          const x = col * hw + ((row & 1) * hw) / 2 + ox;
          const y = row * r * 1.5 + oy;
          cells.push({ x, y });
          const d = (x - tx) ** 2 + (y - ty) ** 2;
          if (d < lit.d) lit = { x, y, d };
        }
      ctx.lineWidth = 1;
      ctx.strokeStyle = ink;
      const reach = Math.hypot(width, height) || 1;
      // Quieter cells under the header and around the footer's menus.
      const own = element.getBoundingClientRect();
      const head = document
        .querySelector(".scan-header")
        ?.getBoundingClientRect();
      const prefs = document
        .querySelector(".footer-preferences")
        ?.getBoundingClientRect();
      const smooth = (a: number, b: number, v: number) => {
        const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };
      const hush = (x: number, y: number) => {
        let k = 1;
        if (head && head.height > 0) {
          const edge = (head.bottom - own.top) / zoom;
          k *= 0.22 + 0.78 * smooth(edge - 30, edge + 150, y);
        }
        if (prefs && prefs.width > 0) {
          const bx = Math.max(
            (prefs.left - own.left) / zoom - x,
            0,
            x - (prefs.right - own.left) / zoom,
          );
          const by = Math.max(
            (prefs.top - own.top) / zoom - y,
            0,
            y - (prefs.bottom - own.top) / zoom,
          );
          k *= 0.18 + 0.82 * smooth(20, 260, Math.hypot(bx, by));
        }
        return k;
      };
      for (const cell of cells) {
        const fade = Math.max(
          0,
          Math.min(1, (cell.x - width * 0.3) / (width * 0.5)),
        );
        const wave = intro(
          (Math.hypot(cell.x - lit.x, cell.y - lit.y) / reach) * SPREAD,
          GRID_IN,
        );
        if (wave <= 0) continue;
        ctx.globalAlpha =
          ((light ? 0.05 : 0.035) + fade * (light ? 0.08 : 0.075)) *
          wave *
          hush(cell.x, cell.y);
        hexagon(cell.x, cell.y, r - 2);
        ctx.stroke();
      }

      // Which family is shown, and how far through its turn we are.
      const list = names.length ? names : [name];
      const step = reduce ? 0 : Math.floor(time / PERIOD);
      const phase = reduce ? 0.5 : (time % PERIOD) / PERIOD;
      const label = list[step % list.length];
      // The first family is already lit by the entrance: it only fades out.
      const rise = step === 0 ? 1 : Math.min(1, phase / 0.16);
      const fall = Math.min(1, (1 - phase) / 0.14);
      const lightUp = intro(LIGHT_AT, LIGHT_IN);
      const env = reduce ? 1 : ease(Math.min(rise, fall)) * lightUp;

      // On wide screens the light moves between cells that keep clear of
      // the words, the action, the header and the footer.
      let target = lit;
      let strength = lightUp;
      if (!anchor && list.length > 1) {
        const key = `${Math.round(width)}x${Math.round(height)}:${Math.round(r)}`;
        if (key !== cache.key || step !== cache.step) {
          const own = element.getBoundingClientRect();
          const keep = Array.from(document.querySelectorAll<HTMLElement>(AVOID))
            .flatMap(paintedBoxes)
            .filter((box) => box.width > 0 && box.height > 0)
            .map((box) => {
              return {
                l: (box.left - own.left) / zoom - 44,
                t: (box.top - own.top) / zoom - 36,
                r: (box.right - own.left) / zoom + 44,
                b: (box.bottom - own.top) / zoom + 36,
              };
            });
          const clear = cells.filter(
            (cell) =>
              cell.x - r > 8 &&
              cell.x + r < width - 8 &&
              cell.y - r > 8 &&
              cell.y + r < height - 8 &&
              !keep.some(
                (box) =>
                  cell.x + r > box.l &&
                  cell.x - r < box.r &&
                  cell.y + r > box.t &&
                  cell.y - r < box.b,
              ),
          );
          // Start where the approved design puts Pegasus, then wander.
          clear.sort(
            (p, q) =>
              Math.hypot(p.x - lit.x, p.y - lit.y) -
              Math.hypot(q.x - lit.x, q.y - lit.y),
          );
          cache = { key, step, cells: clear };
        }
        const pool = cache.cells;
        if (pool.length) {
          const pick = step === 0 ? 0 : (step * 5 + (step >> 1)) % pool.length;
          target = { ...pool[pick], d: 0 };
          strength = env;
        }
      }

      const breath = reduce ? 1 : 0.85 + 0.15 * Math.sin(time / 1600);
      const glowAt = target;
      // Neighbours: a whisper of red, nothing more.
      for (const cell of cells) {
        const d = Math.hypot(cell.x - glowAt.x, cell.y - glowAt.y);
        if (d < 1 || d > r * 1.9) continue;
        ctx.globalAlpha =
          (light ? 0.3 : 0.28) * breath * strength * hush(cell.x, cell.y);
        ctx.strokeStyle = bad;
        hexagon(cell.x, cell.y, r - 2);
        ctx.stroke();
      }
      const glow = ctx.createRadialGradient(
        glowAt.x,
        glowAt.y,
        0,
        glowAt.x,
        glowAt.y,
        r * 2.4,
      );
      glow.addColorStop(0, bad);
      glow.addColorStop(1, "rgba(251, 71, 71, 0)");
      ctx.globalAlpha = (light ? 0.18 : 0.3) * breath * strength;
      ctx.fillStyle = glow;
      ctx.fillRect(glowAt.x - r * 3.2, glowAt.y - r * 3.2, r * 6.4, r * 6.4);
      const fill = ctx.createRadialGradient(
        glowAt.x,
        glowAt.y - r * 0.3,
        0,
        glowAt.x,
        glowAt.y,
        r,
      );
      fill.addColorStop(0, bad);
      fill.addColorStop(1, "rgba(251, 71, 71, 0.55)");
      // A solid base so the cell reads as filled, then a brighter core.
      ctx.globalAlpha = (light ? 0.16 : 0.3) * strength;
      ctx.fillStyle = bad;
      hexagon(glowAt.x, glowAt.y, r - 2);
      ctx.fill();
      ctx.globalAlpha = (light ? 0.24 : 0.4) * breath * strength;
      ctx.fillStyle = fill;
      hexagon(glowAt.x, glowAt.y, r - 2);
      ctx.fill();
      ctx.globalAlpha = 0.95 * strength;
      ctx.strokeStyle = bad;
      ctx.lineWidth = 1.6;
      hexagon(glowAt.x, glowAt.y, r - 2);
      ctx.stroke();
      // The name fades and lifts into place, then fades before the next.
      const lift = (1 - env) * r * 0.1;
      ctx.textAlign = "center";
      ctx.fillStyle = style.getPropertyValue("--text").trim() || ink;
      let size = Math.round(r * 0.2);
      ctx.font = `600 ${size}px ${font}`;
      while (size > 9 && ctx.measureText(label).width > r * 1.45) {
        size -= 1;
        ctx.font = `600 ${size}px ${font}`;
      }
      ctx.globalAlpha = 0.96 * env;
      ctx.fillText(label, glowAt.x, glowAt.y + r * 0.06 + lift);
      ctx.globalAlpha = 0.6 * env;
      ctx.font = `600 ${Math.round(r * 0.1)}px ${font}`;
      ctx.fillText(caption, glowAt.x, glowAt.y + r * 0.24 + lift);
      ctx.globalAlpha = 1;
      if (!reduce && !document.hidden) frame = requestAnimationFrame(draw);
    };

    resize();
    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };
    void document.fonts?.ready.then(start);
    start();
    const onResize = () => {
      resize();
      start();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", start);
    const theme = new MutationObserver(start);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", start);
      theme.disconnect();
    };
  }, [name, names.join("|"), caption, local, at?.[0], at?.[1]]);

  return (
    <canvas
      className={local ? "honeycomb local" : "honeycomb"}
      ref={canvas}
      aria-hidden="true"
    />
  );
}
