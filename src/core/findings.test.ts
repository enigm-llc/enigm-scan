import { expect, test } from "vitest";
import { isReviewPoint, splitFindings } from "./findings";
import { findingLabel } from "../shared/i18n/findings";

const finding = (rule: string, category: string) => ({
  id: rule.replace(/[^a-zA-Z0-9_.:-]/g, "") || "id",
  category,
  source: "https://github.com/enigm-llc/enigm-scan",
  evidence: "evidence",
  severity: "medium" as const,
  confidence: "medium" as const,
  timestamp: null,
  rule,
  ruleVersion: "1",
  limitations: ["limit"],
  recommendation: "review",
});

test("behavioural spyware detections count as detections, monitoring apps and link or profile heuristics are review points", () => {
  const { detections, reviews } = splitFindings([
    finding(
      "enigm.behavior.android_spyware_profile",
      "android_spyware_behavior",
    ),
    finding(
      "mvt.6b8844fe-9a8d-4b32-9746-20113a3a8010",
      "known_appid_indicator",
    ),
    finding(
      "watchware.002fb55f-20b5-4643-b130-4db5bf1036a7",
      "known_monitoring_app",
    ),
    finding("enigm.heuristic.suspicious_link", "suspicious_link"),
    finding(
      "enigm.heuristic.ios_configuration_profile",
      "ios_configuration_profile",
    ),
    finding(
      "enigm.heuristic.android_system_integrity",
      "android_system_integrity",
    ),
    finding(
      "enigm.behavior.ios_process_unusual_location",
      "ios_unusual_process",
    ),
    finding(
      "enigm.heuristic.ios_message_parser_crashes",
      "ios_message_parser_crashes",
    ),
  ]);
  expect(detections.map((f) => f.category)).toEqual([
    "android_spyware_behavior",
    "known_appid_indicator",
    "ios_unusual_process",
  ]);
  expect(reviews).toHaveLength(5);
  // An MVT alert matching a watchware rule keeps the rule ID: still a review.
  expect(isReviewPoint(finding("watchware.x", "MVT packages"))).toBe(true);
});

test("new categories have readable names in every language", () => {
  for (const category of [
    "known_monitoring_app",
    "android_spyware_behavior",
    "android_surveillance_capabilities",
    "android_system_integrity",
    "suspicious_link",
    "ios_configuration_profile",
    "ios_unusual_process",
    "ios_unrecognised_process",
    "ios_message_parser_crashes",
  ])
    for (const language of ["es", "en", "fr", "de", "it", "pt"] as const)
      expect(findingLabel(category, language)).not.toBe(category);
  expect(findingLabel("android_spyware_behavior", "es")).toBe(
    "App con comportamiento de spyware",
  );
});
