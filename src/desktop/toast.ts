/** A short message shown at the top of the app window. */
export type ToastTone = "error" | "info" | "success";
export type Toast = { id: number; tone: ToastTone; message: string };

type Listener = (toasts: Toast[]) => void;

const MAX = 3;
let toasts: Toast[] = [];
let next = 1;
const listeners = new Set<Listener>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function publish() {
  for (const listener of listeners) listener(toasts);
}

/** How long a message stays: long enough to read, never less than 3.5 s. */
function duration(message: string): number {
  return Math.min(9000, Math.max(3500, message.length * 60));
}

export function dismissToast(id: number) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts = toasts.filter((toast) => toast.id !== id);
  publish();
}

function show(tone: ToastTone, message: string) {
  const text = message.trim();
  // The same message already on screen is not repeated.
  if (!text || toasts.some((toast) => toast.message === text)) return;
  const toast = { id: next++, tone, message: text };
  toasts = [...toasts, toast].slice(-MAX);
  timers.set(
    toast.id,
    setTimeout(() => dismissToast(toast.id), duration(text)),
  );
  publish();
}

export const toast = {
  error: (message: string) => show("error", message),
  info: (message: string) => show("info", message),
  success: (message: string) => show("success", message),
};

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}

/** Clear every message (tests, and when the app closes). */
export function clearToasts() {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  toasts = [];
  publish();
}
