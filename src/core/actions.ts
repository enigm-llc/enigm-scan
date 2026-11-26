import type { ScanReport } from "./report";
import { isReviewPoint } from "./findings";

type Finding = ScanReport["findings"][number];

/** Steps the report recommends, in the order they should be taken. */
export type Action =
  | "stalkerwareSafety"
  | "appleNotice"
  | "preserve"
  | "otherDevice"
  | "expertHelp"
  | "modifiedSystem"
  | "lockdown"
  | "interception"
  | "links"
  | "apps"
  | "scanAgain";

const INTERCEPTION = new Set([
  "ios_configuration_profile",
  "android_traffic_redirect",
  "android_private_dns",
  "network_suspicious_hosting",
]);
const APPS = new Set([
  "android_surveillance_capabilities",
  "android_sideloaded_apps",
  "android_background_upload",
  "known_monitoring_app",
]);

/**
 * What to do, from what the scan found. Nothing when it found nothing. When
 * spyware or stalkerware was detected, the phone is kept as it is for an
 * expert and nothing is removed yet; otherwise the steps are what the person
 * can safely do on their own.
 */
export function actionsFor(findings: Finding[]): Action[] {
  if (!findings.length) return [];
  const has = (test: (f: Finding) => boolean) => findings.some(test);
  const detected = (f: Finding) => !isReviewPoint(f);
  const stalkerware = has(
    (f) => detected(f) && /\(stalkerware\)/.test(f.evidence),
  );
  const apple = has((f) => f.category === "apple_threat_notification");
  const spyware = has(detected);
  const modified = has((f) =>
    ["android_system_integrity", "ios_system_integrity"].includes(f.category),
  );
  const zeroClick = has((f) => f.category === "ios_message_parser_crashes");
  const interception = has((f) => INTERCEPTION.has(f.category));
  const links = has((f) => f.category === "suspicious_link");
  const apps = has(
    (f) => APPS.has(f.category) || f.rule.startsWith("watchware."),
  );

  const steps: Action[] = [];
  if (stalkerware) steps.push("stalkerwareSafety");
  if (apple) steps.push("appleNotice");
  if (spyware) steps.push("preserve", "otherDevice", "expertHelp");
  if (modified) steps.push("modifiedSystem");
  if (zeroClick && !apple) steps.push("lockdown");
  // Removing profiles or apps erases what an expert needs: only without a
  // detection.
  if (interception && !spyware) steps.push("interception");
  if (links) steps.push("links");
  if (apps && !spyware) steps.push("apps");
  steps.push("scanAgain");
  return steps;
}
