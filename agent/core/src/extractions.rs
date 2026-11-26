//! Enigm's own analysis of the records MVT extracts, beyond indicator
//! matching: links received in messages and visited in browsers that
//! impersonate a brand (see `links.rs`), and iPhone configuration profiles
//! that can intercept traffic or manage the phone.
//!
//! MVT writes `urls.json` (links in SMS, iMessage and WhatsApp messages),
//! per-browser history files and `configuration_profiles.json` into its
//! output directory. Files are read with size bounds and treated as
//! untrusted; a missing file means the artifact was not available.
use crate::{
    links::{self, Context},
    model::{bounded, Finding, Report},
};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, path::Path};

const MAX_FILE: u64 = 64 * 1024 * 1024;
const MAX_RECORDS: usize = 200_000;
const MAX_LINK_FINDINGS: usize = 30;

#[derive(Deserialize)]
struct UrlRecord {
    url: Option<String>,
    #[serde(default)]
    expanded_url: Option<String>,
    #[serde(default)]
    timestamp: Option<String>,
    #[serde(default)]
    source: Option<String>,
}
#[derive(Deserialize)]
struct VisitRecord {
    url: Option<String>,
    #[serde(default)]
    isodate: Option<String>,
}
#[derive(Deserialize)]
struct ProfileRecord {
    #[serde(default)]
    plist: serde_json::Value,
    #[serde(default)]
    install_date: Option<String>,
}

fn read<T: for<'de> Deserialize<'de>>(dir: &Path, name: &str) -> Option<Vec<T>> {
    let path = dir.join(name);
    let meta = std::fs::symlink_metadata(&path).ok()?;
    if !meta.is_file() || meta.len() > MAX_FILE {
        return None;
    }
    let bytes = std::fs::read(&path).ok()?;
    serde_json::from_slice::<Vec<T>>(&bytes).ok().map(|mut v| {
        v.truncate(MAX_RECORDS);
        v
    })
}
fn rfc3339(value: Option<&str>) -> Option<String> {
    let value = value?;
    time::OffsetDateTime::parse(value, &time::format_description::well_known::Rfc3339)
        .ok()
        .map(|_| value.to_string())
}

#[derive(Default)]
struct Sighting {
    severity: &'static str,
    reason: String,
    sources: Vec<String>,
    count: usize,
    example: String,
    first: Option<String>,
    last: Option<String>,
}
/// A link reduced to scheme, host and a short path, without query strings
/// that may carry personal tokens.
fn shorten(url: &str) -> String {
    let base = url.split(['?', '#']).next().unwrap_or(url);
    bounded(base, 160)
}
fn rank(severity: &str) -> u8 {
    match severity {
        "high" => 3,
        "medium" => 2,
        _ => 1,
    }
}

pub fn analyze(dir: &Path, report: &mut Report) {
    let mut hosts: BTreeMap<String, Sighting> = BTreeMap::new();
    // Messages first: a browser visit to a domain already suspicious from a
    // message shows that the link was opened, whatever the browsing rules say.
    let mut observe = |link: &str, context: Context, source: &str, when: Option<&str>| {
        let found = links::assess_in(link, context).or_else(|| {
            let host = links::host_of(link)?;
            hosts
                .contains_key(&host)
                .then(|| links::assess_in(link, Context::Message))?
        });
        let Some(found) = found else {
            return;
        };
        let entry = hosts.entry(found.host.clone()).or_default();
        if rank(found.severity) > rank(entry.severity) || entry.reason.is_empty() {
            entry.severity = found.severity;
            entry.reason = found.reason;
        }
        entry.count += 1;
        if !entry.sources.iter().any(|s| s == source) {
            entry.sources.push(source.to_string());
        }
        if entry.example.is_empty() {
            entry.example = shorten(link);
        }
        if let Some(when) = rfc3339(when) {
            if entry.first.as_ref().is_none_or(|f| when < *f) {
                entry.first = Some(when.clone());
            }
            if entry.last.as_ref().is_none_or(|l| when > *l) {
                entry.last = Some(when);
            }
        }
    };
    let mut message_links = None;
    if let Some(records) = read::<UrlRecord>(dir, "urls.json") {
        message_links = Some(records.len());
        for r in &records {
            let source = match r.source.as_deref() {
                Some("sms") => "SMS or iMessage",
                Some("whatsapp") => "WhatsApp",
                _ => "message",
            };
            for link in [r.url.as_deref(), r.expanded_url.as_deref()]
                .into_iter()
                .flatten()
            {
                observe(link, Context::Message, source, r.timestamp.as_deref());
            }
        }
    }
    let mut visits = None;
    for (file, browser) in [
        ("safari_history.json", "Safari history"),
        ("chrome_history.json", "Chrome history"),
        ("firefox_history.json", "Firefox history"),
    ] {
        if let Some(records) = read::<VisitRecord>(dir, file) {
            *visits.get_or_insert(0) += records.len();
            for r in &records {
                if let Some(url) = r.url.as_deref() {
                    observe(url, Context::Browsing, browser, r.isodate.as_deref());
                }
            }
        }
    }
    let mut ordered: Vec<(String, Sighting)> = hosts.into_iter().collect();
    ordered.sort_by(|a, b| {
        rank(b.1.severity)
            .cmp(&rank(a.1.severity))
            .then(a.0.cmp(&b.0))
    });
    let suspicious = ordered.len();
    for (host, s) in ordered.into_iter().take(MAX_LINK_FINDINGS) {
        if report.findings.len() >= 500 {
            break;
        }
        let seen = match (&s.first, &s.last) {
            (Some(f), Some(l)) if f != l => format!(" between {f} and {l}"),
            (Some(f), _) => format!(" on {f}"),
            _ => String::new(),
        };
        let evidence = format!(
            "{host}: {}. Seen {} time(s) in {}{seen}, e.g. {}",
            s.reason,
            s.count,
            s.sources.join(", "),
            s.example
        );
        report.findings.push(finding(
            "enigm.heuristic.suspicious_link",
            "suspicious_link",
            s.severity,
            &evidence,
            s.last.clone(),
            "Review point: the domain imitates a trusted brand or uses a bare address. Spyware and phishing are often delivered this way, but this alone does not show that the link was opened or that anything was installed.",
            "Do not open the link. If you opened it, note when, keep the phone as it is and ask an expert to review the device; the date helps them look for traces.",
        ));
    }
    let profiles = read::<ProfileRecord>(dir, "configuration_profiles.json");
    let profile_count = profiles.as_ref().map(Vec::len);
    let mut risky_profiles = 0;
    for p in profiles.unwrap_or_default().iter().take(200) {
        if let Some((evidence, severity)) = profile(p) {
            risky_profiles += 1;
            if report.findings.len() < 500 {
                report.findings.push(finding(
                    "enigm.heuristic.ios_configuration_profile",
                    "ios_configuration_profile",
                    severity,
                    &evidence,
                    rfc3339(p.install_date.as_deref()),
                    "Review point: schools, employers and some VPN or filtering apps install such profiles on purpose. Stalkerware and targeted attacks also use them to read traffic or control the phone.",
                    "If you do not recognise this profile, remove it in Settings > General > VPN & Device Management and ask an expert to review the phone.",
                ));
            }
        }
    }
    if message_links.is_none() && visits.is_none() && profile_count.is_none() {
        return;
    }
    let part = |n: Option<usize>, what: &str| match n {
        Some(n) => format!("{n} {what}"),
        None => format!("no {what} available"),
    };
    report.check(
        "enigm_link_and_profile_analysis",
        "completed",
        &format!(
            "{}, {} and {} were checked for domains impersonating trusted brands, look-alike letters, bare IP links and profiles able to intercept traffic or manage the phone. {suspicious} suspicious domain(s){}; {risky_profiles} profile(s) for review. A link that looks legitimate can still be malicious.",
            part(message_links, "links in messages"),
            part(visits, "browser visits"),
            part(profile_count, "configuration profiles"),
            if suspicious > MAX_LINK_FINDINGS { format!(" (first {MAX_LINK_FINDINGS} listed)") } else { String::new() },
        ),
    );
}

/// Payload types that let a profile read or redirect traffic, or control
/// the phone, with what they allow.
const RISKY_PAYLOADS: &[(&str, &str, bool)] = &[
    (
        "com.apple.security.root",
        "installs a root certificate that can decrypt secure connections",
        true,
    ),
    (
        "com.apple.security.pem",
        "installs a certificate that can decrypt secure connections",
        true,
    ),
    (
        "com.apple.security.pkcs1",
        "installs a certificate that can decrypt secure connections",
        true,
    ),
    (
        "com.apple.mdm",
        "enrols the iPhone in remote device management",
        false,
    ),
    (
        "com.apple.vpn.managed",
        "routes traffic through a VPN",
        false,
    ),
    (
        "com.apple.vpn.managed.applayer",
        "routes app traffic through a VPN",
        false,
    ),
    (
        "com.apple.proxy.http.global",
        "sends all web traffic through a proxy",
        false,
    ),
    (
        "com.apple.dnsSettings.managed",
        "sets the DNS servers that resolve every address",
        false,
    ),
    (
        "com.apple.dnsProxy.managed",
        "sends DNS lookups through an app",
        false,
    ),
    (
        "com.apple.webcontent-filter",
        "inspects web traffic with a content filter",
        false,
    ),
];
fn profile(record: &ProfileRecord) -> Option<(String, &'static str)> {
    let plist = &record.plist;
    let text = |v: &serde_json::Value, key: &str| {
        v.get(key)
            .and_then(|x| x.as_str())
            .map(|s| bounded(s, 120))
            .filter(|s| !s.is_empty())
    };
    let mut powers: Vec<&str> = Vec::new();
    let mut certificate = false;
    let mut interception = false;
    let contents = plist
        .get("PayloadContent")
        .and_then(|c| c.as_array())
        .cloned()
        .unwrap_or_default();
    for payload in contents.iter().take(100) {
        let Some(kind) = payload.get("PayloadType").and_then(|t| t.as_str()) else {
            continue;
        };
        if let Some((_, power, is_cert)) = RISKY_PAYLOADS.iter().find(|(t, _, _)| *t == kind) {
            if !powers.contains(power) {
                powers.push(power);
            }
            certificate |= *is_cert;
            interception |= kind.contains("vpn") || kind.contains("proxy") || kind.contains("dns");
        }
    }
    if powers.is_empty() {
        return None;
    }
    let name = text(plist, "PayloadDisplayName").unwrap_or_else(|| "unnamed profile".into());
    let identifier = text(plist, "PayloadIdentifier").unwrap_or_default();
    let organisation = text(plist, "PayloadOrganization")
        .map(|o| format!(" from {o}"))
        .unwrap_or_default();
    let installed = record
        .install_date
        .as_deref()
        .map(|d| format!(", installed {}", bounded(d, 40)))
        .unwrap_or_default();
    let severity = if certificate && interception {
        "high"
    } else {
        "medium"
    };
    Some((
        format!(
            "Configuration profile \"{name}\"{organisation} ({identifier}){installed}: {}",
            powers.join("; ")
        ),
        severity,
    ))
}
pub(crate) fn finding(
    rule: &str,
    category: &str,
    severity: &str,
    evidence: &str,
    timestamp: Option<String>,
    limitation: &str,
    recommendation: &str,
) -> Finding {
    let digest = Sha256::digest(format!("{rule}\0{evidence}").as_bytes());
    Finding {
        id: format!("enigm.{:x}", digest)[..46].into(),
        category: category.into(),
        source: "https://github.com/enigm-llc/enigm-scan".into(),
        evidence: bounded(evidence, 1800),
        severity: severity.into(),
        confidence: "low".into(),
        timestamp,
        rule: rule.into(),
        rule_version: "1".into(),
        limitations: vec![limitation.into()],
        recommendation: recommendation.into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn write(dir: &Path, name: &str, value: serde_json::Value) {
        std::fs::write(dir.join(name), serde_json::to_vec(&value).unwrap()).unwrap();
    }
    #[test]
    fn flags_impersonating_links_once_per_domain_with_dates_and_sources() {
        let dir = tempfile::tempdir().unwrap();
        write(
            dir.path(),
            "urls.json",
            serde_json::json!([
                {"url": "https://apple-id-verify.com/a?token=secret", "expanded_url": null, "timestamp": "2026-11-01T10:00:00+00:00", "source": "sms"},
                {"url": "https://apple-id-verify.com/b", "expanded_url": null, "timestamp": "2026-11-03T10:00:00+00:00", "source": "whatsapp"},
                {"url": "https://www.apple.com/iphone", "timestamp": "2026-11-02T10:00:00+00:00", "source": "sms"},
                {"url": "https://bit.ly/x", "expanded_url": "https://xn--pple-43d.com/login", "timestamp": null, "source": "sms"}
            ]),
        );
        write(
            dir.path(),
            "safari_history.json",
            serde_json::json!([
                {"url": "https://google-analytics.com/collect", "isodate": "2026-11-02 10:00:00.000000"},
                {"url": "https://apple-id-verify.com/a", "isodate": "2026-11-01 10:05:00.000000"},
                {"url": "https://elpais.com"}
            ]),
        );
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &mut report);
        assert_eq!(report.findings.len(), 2);
        let homograph = &report.findings[0];
        assert_eq!(homograph.severity, "high");
        assert!(homograph.evidence.starts_with("xn--pple-43d.com"));
        let lure = &report.findings[1];
        assert!(lure.evidence.contains("Seen 3 time(s) in SMS or iMessage, WhatsApp, Safari history between 2026-11-01T10:00:00+00:00 and 2026-11-03T10:00:00+00:00"), "{}", lure.evidence);
        assert!(!lure.evidence.contains("secret"));
        assert_eq!(lure.timestamp.as_deref(), Some("2026-11-03T10:00:00+00:00"));
        assert!(report
            .findings
            .iter()
            .all(|f| f.rule.starts_with("enigm.heuristic.") && f.confidence == "low"));
        let check = &report.checks[0];
        assert!(check.detail.starts_with(
            "4 links in messages, 3 browser visits and no configuration profiles available"
        ));
    }
    #[test]
    fn profiles_that_intercept_traffic_or_manage_the_phone_are_review_points() {
        let dir = tempfile::tempdir().unwrap();
        write(
            dir.path(),
            "configuration_profiles.json",
            serde_json::json!([
                {"plist": {"PayloadDisplayName": "Security Update", "PayloadIdentifier": "com.example.update", "PayloadContent": [
                    {"PayloadType": "com.apple.security.root"}, {"PayloadType": "com.apple.proxy.http.global"}]}, "install_date": "2026-11-20T08:00:00Z"},
                {"plist": {"PayloadDisplayName": "School", "PayloadOrganization": "Example School", "PayloadIdentifier": "edu.example.mdm", "PayloadContent": [{"PayloadType": "com.apple.mdm"}]}},
                {"plist": {"PayloadDisplayName": "Wi-Fi", "PayloadContent": [{"PayloadType": "com.apple.wifi.managed"}]}}
            ]),
        );
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &mut report);
        assert_eq!(report.findings.len(), 2);
        assert_eq!(report.findings[0].severity, "high");
        assert!(
            report.findings[0].evidence.contains("root certificate")
                && report.findings[0].evidence.contains("proxy")
        );
        assert_eq!(
            report.findings[0].timestamp.as_deref(),
            Some("2026-11-20T08:00:00Z")
        );
        assert_eq!(report.findings[1].severity, "medium");
        assert!(report.findings[1].evidence.contains("from Example School"));
    }
    #[test]
    fn missing_or_hostile_files_add_nothing() {
        let dir = tempfile::tempdir().unwrap();
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &mut report);
        assert!(report.findings.is_empty() && report.checks.is_empty());
        std::fs::write(dir.path().join("urls.json"), b"{not json").unwrap();
        write(
            dir.path(),
            "safari_history.json",
            serde_json::json!({"url": "x"}),
        );
        analyze(dir.path(), &mut report);
        assert!(report.findings.is_empty() && report.checks.is_empty());
    }
}
