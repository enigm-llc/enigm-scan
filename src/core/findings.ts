import type { ScanReport } from "./report";

type Finding = ScanReport["findings"][number];

/**
 * Review points are heuristics: settings, links or apps worth checking that
 * match no signed spyware or stalkerware indicator, and known monitoring apps
 * (watchware: parental control, location sharing) that are often installed
 * knowingly. The rest are detections: signed indicator matches and
 * behavioural detections (`enigm.behavior.*`, an app combining concealment
 * with spyware capabilities). Reports from 0.6.4 and earlier used
 * `mvt.<24 hex>` for MVT heuristics.
 */
export function isReviewPoint(finding: Finding) {
  return (
    finding.rule.startsWith("mvt.heuristic.") ||
    finding.rule.startsWith("enigm.heuristic.") ||
    finding.rule.startsWith("watchware.") ||
    /^mvt\.[0-9a-f]{24}$/.test(finding.rule)
  );
}

export function splitFindings(findings: Finding[]) {
  return {
    detections: findings.filter((f) => !isReviewPoint(f)),
    reviews: findings.filter(isReviewPoint),
  };
}
