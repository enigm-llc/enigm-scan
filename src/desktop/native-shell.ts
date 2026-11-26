/** The systems the desktop app runs on. */
export type DesktopOs = "macos" | "windows" | "linux";

/** The system the app runs on, from its webview (WebKit on macOS and Linux,
 *  WebView2 on Windows). */
export function desktopOs(agent = navigator.userAgent): DesktopOs {
  if (/Macintosh|Mac OS X/.test(agent)) return "macos";
  if (/Windows/.test(agent)) return "windows";
  return "linux";
}

/**
 * Mark the document as the desktop app on a given system, before the first
 * paint. The stylesheet then uses that system's typeface and window greys
 * instead of the website's (see "Desktop app: native look" in console.css).
 */
export function markNativeShell(root = document.documentElement): void {
  root.dataset.shell = "app";
  root.dataset.os = desktopOs();
  // The app follows the system's appearance; apply it before the first paint
  // so a dark window never starts light.
  root.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Show this app window as soon as its page is mounted, in the system's
 * appearance (see `window_ready` in src-tauri). It does not wait for an
 * animation frame: macOS gives none to a hidden window, so the window only
 * appeared after the native side's four-second fallback.
 */
export function revealWindow(): void {
  void import("@tauri-apps/api/core")
    .then(({ invoke }) => invoke("window_ready"))
    .catch(() => {});
}
