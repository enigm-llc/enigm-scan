import React, { useRef, type ReactNode } from "react";

/**
 * A native <details> whose body opens and closes smoothly: the height eases
 * and the text fades. Instant with reduced motion.
 */
export function Disclosure({
  summary,
  children,
}: Readonly<{
  summary: ReactNode;
  children: ReactNode;
}>) {
  const details = useRef<HTMLDetailsElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const running = useRef<Animation | null>(null);
  const toggle = (event: React.MouseEvent) => {
    const box = details.current;
    const inner = body.current;
    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!box || !inner || reduce || typeof inner.animate !== "function") return;
    event.preventDefault();
    running.current?.cancel();
    const opening = !box.open;
    if (opening) box.open = true;
    const full = inner.scrollHeight;
    const frames = opening
      ? [
          { height: "0px", opacity: 0 },
          { height: `${full}px`, opacity: 1 },
        ]
      : [
          { height: `${full}px`, opacity: 1 },
          { height: "0px", opacity: 0 },
        ];
    const animation = inner.animate(frames, {
      duration: opening ? 380 : 280,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
    running.current = animation;
    box.classList.toggle("is-closing", !opening);
    animation.onfinish = () => {
      if (!opening) box.open = false;
      box.classList.remove("is-closing");
      running.current = null;
    };
  };
  return (
    <details ref={details}>
      <summary onClick={toggle}>
        {summary}
        <span className="faq-icon" aria-hidden="true" />
      </summary>
      <div className="faq-body" ref={body}>
        {children}
      </div>
    </details>
  );
}
