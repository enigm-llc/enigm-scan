import { useCallback, useRef } from "react";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * In the app, a block that moves because its height changed (a line added
 * or removed in a column centred on the window) slides to its new place
 * instead of jumping there. So do the parts of it named by `parts` that
 * move inside it, such as a button pushed down by options shown above it.
 * Returns a ref for the block.
 */
export function useGlide<T extends HTMLElement>(parts?: string) {
  const stop = useRef<(() => void) | undefined>(undefined);
  return useCallback(
    (box: T | null) => {
      stop.current?.();
      stop.current = undefined;
      if (
        !box ||
        document.documentElement.dataset.shell !== "app" ||
        typeof ResizeObserver === "undefined"
      )
        return;
      const sliding = new Map<Element, Animation>();
      // Its own transform (a centring one, say), which a slide adds to.
      const resting = new Map<Element, string>();
      const moving = (el: Element) => sliding.get(el)?.playState === "running";
      const base = (el: Element) => {
        if (!moving(el)) resting.set(el, getComputedStyle(el).transform);
        const own = resting.get(el) ?? "none";
        return own === "none" ? "" : own;
      };
      // Where an element sits, without the slide it may be doing now.
      const lift = (el: Element) =>
        moving(el)
          ? new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 -
            new DOMMatrixReadOnly(base(el) || "none").m42
          : 0;
      const top = (el: Element) => el.getBoundingClientRect().top - lift(el);
      const measure = () => {
        const frame = (
          box.offsetParent ?? document.body
        ).getBoundingClientRect().top;
        const places = new Map<Element, number>([[box, top(box) - frame]]);
        // A part is drawn with the block, so it is measured from where the
        // block is drawn now.
        const drawn = box.getBoundingClientRect().top;
        if (parts)
          for (const part of box.querySelectorAll(parts))
            places.set(part, top(part) - drawn);
        return places;
      };
      // The first report only says where the block starts.
      let before: Map<Element, number> | undefined;
      let width = box.offsetWidth;
      const check = () => {
        const after = measure();
        const resized = box.offsetWidth !== width;
        width = box.offsetWidth;
        const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (before && !resized && !still)
          for (const [el, now] of after) {
            const was = before.get(el);
            if (was === undefined || Math.abs(was - now) < 2) continue;
            // An element still moving in by its own entrance is left to it.
            const entering = el
              .getAnimations()
              .some(
                (other) =>
                  other !== sliding.get(el) &&
                  other.playState === "running" &&
                  other.effect instanceof KeyframeEffect &&
                  other.effect.getKeyframes().some((k) => "transform" in k),
              );
            if (entering) continue;
            const from = was - now + lift(el);
            const own = base(el);
            sliding.get(el)?.cancel();
            sliding.set(
              el,
              el.animate(
                [
                  { transform: `${own} translateY(${from}px)` },
                  { transform: own || "none" },
                ],
                { duration: 420, easing: EASE },
              ),
            );
          }
        before = after;
      };
      // A change of size, or of what is inside, before it is drawn.
      const resizes = new ResizeObserver(check);
      const changes = new MutationObserver(() => before && check());
      resizes.observe(box);
      changes.observe(box, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      stop.current = () => {
        resizes.disconnect();
        changes.disconnect();
      };
    },
    [parts],
  );
}
