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
}
