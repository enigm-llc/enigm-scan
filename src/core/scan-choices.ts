/**
 * Choices made for one scan that must survive a reload of the app window
 * (the scan keeps running natively) and end with its report.
 */

/** The iPhone deep check was chosen for the running scan. */
export const DEEP_CHECK_KEY = "enigm-scan-deep-check";

export function forgetScanChoices() {
  try {
    sessionStorage.removeItem(DEEP_CHECK_KEY);
  } catch {}
}
