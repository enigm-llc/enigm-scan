import {
  cloneElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

type Part = ReactElement<{ className?: string }>;

/**
 * In the app, when what a place shows changes (the drawn phone's screen, the
 * note beside it), the old content fades out quickly while the new one
 * fades in, so the place is never empty and two contents hardly overlap. The child keeps its own
 * position; both are drawn in it for that moment. Elsewhere, or without
 * motion, the content simply changes.
 */
export function Crossfade({
  id,
  children,
}: Readonly<{ id: string; children: Part | null | false }>) {
  const shown = useRef<{ id: string; part: Part | null }>({
    id,
    part: children || null,
  });
  const [leaving, setLeaving] = useState<{ id: string; part: Part } | null>(
    null,
  );
  useLayoutEffect(() => {
    const before = shown.current;
    if (before.id !== id && before.part) {
      const still =
        document.documentElement.dataset.shell !== "app" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!still) setLeaving({ id: before.id, part: before.part });
    }
  }, [id]);
  useLayoutEffect(() => {
    shown.current = { id, part: children || null };
  });
  // Gone once it has faded out (the app's phone hand-over time).
  useLayoutEffect(() => {
    if (!leaving) return;
    const time =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--phone-out",
        ),
      ) || 300;
    const timer = setTimeout(() => setLeaving(null), time + 100);
    return () => clearTimeout(timer);
  }, [leaving]);
  return (
    <>
      {leaving &&
        cloneElement(leaving.part, {
          key: `${leaving.id}~leaving`,
          className: `${leaving.part.props.className ?? ""} is-leaving`,
          "aria-hidden": true,
          ref: undefined,
        } as Record<string, unknown>)}
      {children ? cloneElement(children, { key: id }) : null}
    </>
  );
}
