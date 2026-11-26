//! Corroborate only an explicit shared signed IOC across independent acquisition
//! types with timezone-qualified event times. Never upgrade infection severity.
use crate::model::{Finding, Report};
use std::collections::HashSet;
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

fn event_time(finding: &Finding) -> Option<i64> {
    OffsetDateTime::parse(finding.timestamp.as_deref()?, &Rfc3339)
        .ok()
        .map(|t| t.unix_timestamp())
}
fn network(finding: &Finding) -> bool {
    finding.id.starts_with("ioc.")
        && [
            "attributed network packet:",
            "attributed DNS question:",
            "USB captured network packet:",
        ]
        .iter()
        .any(|prefix| finding.evidence.starts_with(prefix))
}
pub fn corroborate(report: &mut Report) {
    let mut seen = HashSet::new();
    let mut pairs = Vec::new();
    for (left, event) in report.findings.iter().enumerate() {
        if !event.category.starts_with("MVT ") || !event.rule.starts_with("mvt.") {
            continue;
        }
        let Some(at) = event_time(event) else {
            continue;
        };
        for (right, traffic) in report.findings.iter().enumerate() {
            if !network(traffic) || traffic.rule != event.rule {
                continue;
            }
            let Some(observed) = event_time(traffic) else {
                continue;
            };
            if at.abs_diff(observed) > 300 {
                continue;
            }
            if seen.insert((event.rule.clone(), at, observed)) && pairs.len() < 20 {
                pairs.push((left, right));
            }
        }
    }
    for &(left, right) in &pairs {
        let a = report.findings[left].id.clone();
        let b = report.findings[right].id.clone();
        report.findings[left].limitations.push(format!(
            "Related network evidence {b} matches the same signed indicator within five minutes. Clock accuracy is not verified; this corroboration does not confirm infection."));
        report.findings[right].limitations.push(format!(
            "Related forensic event {a} matches the same signed indicator within five minutes. Severity and confidence were not increased."));
    }
    report.check("evidence_correlation", if pairs.is_empty() { "skipped" } else { "completed" },
        &format!("{} distinct forensic/network event pairs share an exact signed indicator within a five-minute review window. Events without explicit timezone-qualified timestamps or indicator identity are not correlated. Duplicate observations do not increase the count; evidence links are limited to the first 20 pairs. Absence of correlation does not rule out spyware.", seen.len()));
}

#[cfg(test)]
mod tests {
    use super::*;
    fn finding(id: &str, category: &str, evidence: &str, timestamp: Option<&str>) -> Finding {
        Finding {
            id: id.into(),
            category: category.into(),
            evidence: evidence.into(),
            timestamp: timestamp.map(str::to_owned),
            rule: "mvt.synthetic".into(),
            rule_version: "1".into(),
            source: "https://example.invalid".into(),
            severity: "medium".into(),
            confidence: "medium".into(),
            limitations: vec![],
            recommendation: "Review".into(),
        }
    }
    fn report() -> Report {
        let mut r = Report::new("ios", 1);
        r.findings = vec![
            finding(
                "mvt.event",
                "MVT Safari",
                "Synthetic event",
                Some("2026-10-26T11:00:00Z"),
            ),
            finding(
                "ioc.network",
                "known_domain_indicator",
                "attributed DNS question: indicator.invalid",
                Some("2026-10-26T12:01:00+01:00"),
            ),
        ];
        r
    }
    #[test]
    fn corroborates_independent_sources_without_upgrading_severity() {
        let mut r = report();
        corroborate(&mut r);
        assert_eq!(r.checks[0].status, "completed");
        assert!(r.findings[0].limitations[0].contains("ioc.network"));
        assert_eq!(r.findings[0].confidence, "medium");
        assert_eq!(r.findings[0].severity, "medium");
    }
    #[test]
    fn excludes_missing_ambiguous_outside_window_and_mismatched_indicators() {
        for timestamp in [
            None,
            Some("2026-10-26T11:00:00"),
            Some("2026-10-26T11:05:01Z"),
        ] {
            let mut r = report();
            r.findings[1].timestamp = timestamp.map(str::to_owned);
            corroborate(&mut r);
            assert_eq!(r.checks[0].status, "skipped");
        }
        let mut r = report();
        r.findings[1].rule = "mvt.different".into();
        corroborate(&mut r);
        assert_eq!(r.checks[0].status, "skipped");
    }
    #[test]
    fn duplicate_module_observations_are_not_independent_corroboration() {
        let mut r = report();
        let mut duplicate = r.findings[0].clone();
        duplicate.id = "mvt.duplicate".into();
        r.findings.push(duplicate);
        corroborate(&mut r);
        assert!(r.checks[0].detail.starts_with("1 distinct"));
        let mut r = report();
        r.findings[1].evidence = "backup.txt: indicator.invalid".into();
        corroborate(&mut r);
        assert_eq!(r.checks[0].status, "skipped");
    }
}
