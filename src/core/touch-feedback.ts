/**
 * Touch feedback as in Enigm Command: on touch layouts an icon control shows
 * a 40 px pulse that grows from its centre and fades (700 ms), and any other
 * control is marked as pressed while the finger is down. Pointer events are
 * used because iOS Safari does not apply :active to most elements.
 */
const TOUCH_LAYOUT = "(max-width: 899.95px), (hover: none), (pointer: coarse)";
const ICONS =
  ".icon-link, .icon-button, .locale-control, .faq-icon, .handoff-link button";
const CONTROLS = "button, a, summary";
const PULSE_MS = 700;

export function installTouchFeedback() {
  if (typeof window === "undefined" || typeof matchMedia !== "function")
    return () => {};
  const timers = new WeakMap<HTMLElement, number>();
  const down = (event: PointerEvent) => {
    if (!matchMedia(TOUCH_LAYOUT).matches) return;
    const origin = event.target as Element | null;
    const control = origin?.closest<HTMLElement>(CONTROLS);
    if (!control || control.matches(":disabled, [aria-disabled='true']"))
      return;
    control.dataset.enigmPressed = "true";
    // A question row pulses on its own toggle icon.
    const icon = control.matches("summary")
      ? control.querySelector<HTMLElement>(".faq-icon")
      : control.matches(ICONS)
        ? control
        : null;
    if (!icon) return;
    icon.dataset.enigmTouchPulse =
      icon.dataset.enigmTouchPulse === "a" ? "b" : "a";
    window.clearTimeout(timers.get(icon));
    timers.set(
      icon,
      window.setTimeout(() => delete icon.dataset.enigmTouchPulse, PULSE_MS),
    );
  };
  const up = () => {
    document
      .querySelectorAll<HTMLElement>("[data-enigm-pressed]")
      .forEach((node) => delete node.dataset.enigmPressed);
  };
  document.addEventListener("pointerdown", down, { passive: true });
  document.addEventListener("pointerup", up, { passive: true });
  document.addEventListener("pointercancel", up, { passive: true });
  return () => {
    document.removeEventListener("pointerdown", down);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", up);
  };
}
