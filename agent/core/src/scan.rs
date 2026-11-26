use crate::{
    model::{bounded, Finding, Report},
    rules::{Kind, Rule, VerifiedRules},
};
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    io::Read,
    path::Path,
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};
const TEXT_LIMIT: usize = 2 * 1024 * 1024;
const ENTRY_LIMIT: usize = 1_000_000;
const DURATION_LIMIT: Duration = Duration::from_secs(3600);
pub struct Matches<'a> {
    pub rules: &'a VerifiedRules,
    seen: HashSet<String>,
    pub truncated: bool,
}
impl<'a> Matches<'a> {
    pub fn new(rules: &'a VerifiedRules) -> Self {
        Self {
            rules,
            seen: HashSet::new(),
            truncated: false,
        }
    }
    pub fn add(
        &mut self,
        report: &mut Report,
        rule: &Rule,
        artifact: &str,
        value: &str,
        timestamp: Option<String>,
    ) {
        self.add_via(report, rule, artifact, value, timestamp, None)
    }
    /// `parent` is the published domain when `value` is one of its subdomains.
    pub fn add_via(
        &mut self,
        report: &mut Report,
        rule: &Rule,
        artifact: &str,
        value: &str,
        timestamp: Option<String>,
        parent: Option<&str>,
    ) {
        let key = format!("{}\0{}\0{}", rule.id, artifact, value);
        if !self.seen.insert(key.clone()) {
            return;
        }
        if report.findings.len() >= 500 {
            self.truncated = true;
            return;
        }
        let digest = Sha256::digest(key.as_bytes());
        let id = format!("ioc.{}", crate::hex(&digest));
        let monitoring = rule.watchware();
        let mut limitations = vec![if monitoring {
            format!("Published indicator: {}. Monitoring apps (watchware) such as parental-control or location-sharing apps are often installed knowingly; they are also used to follow people without their consent.", rule.published)
        } else {
            format!("Published indicator: {}. Historical infrastructure may have changed ownership. A match alone does not prove infection.", rule.published)
        }];
        let confidence = rule.confidence(self.rules.issued_at());
        if confidence == "low" && matches!(rule.kind, Kind::Domain | Kind::Ip) {
            if let Some(published) = rule.published_at() {
                let years = (self.rules.issued_at() - published).max(0) / (365 * 86400);
                limitations.push(format!("Published {years} years ago: the domain or address may belong to someone else today. A match in old messages or history still points to that time."));
            }
        }
        let mut evidence = match parent {
            Some(parent) => {
                limitations.push(format!("Matched as a subdomain of the published domain {parent}, which its registrant controls."));
                format!("{}: {} (subdomain of {})", artifact, value, parent)
            }
            None => format!("{}: {}", artifact, value),
        };
        if let Some(family) = rule.family() {
            evidence.push_str(&format!(" — {family}"));
        }
        let (category, severity, recommendation) = if monitoring {
            ("known_monitoring_app".to_string(), "low", "If you did not install this app or agree to be monitored, someone may be following your location or messages: seek help from a support organisation before removing it.")
        } else {
            (format!("known_{:?}_indicator", rule.kind).to_lowercase(), "medium", "Preserve the report and consult a qualified incident responder before modifying the device.")
        };
        report.findings.push(Finding {
            id,
            category,
            source: rule.source.clone(),
            evidence: bounded(&evidence, 1800),
            severity: severity.into(),
            confidence: confidence.into(),
            timestamp,
            rule: rule.id.clone(),
            rule_version: self.rules.version().to_string(),
            limitations,
            recommendation: recommendation.into(),
        });
    }
    pub fn inspect(
        &mut self,
        report: &mut Report,
        kind: Kind,
        value: &str,
        artifact: &str,
        at: Option<String>,
    ) {
        if kind == Kind::Domain {
            for (rule, parent) in self.rules.domain_matches(value) {
                self.add_via(report, rule, artifact, value, at.clone(), parent.as_deref());
            }
            return;
        }
        for rule in self.rules.matches(kind, value) {
            self.add(report, rule, artifact, value, at.clone());
        }
    }
    pub fn text(&mut self, report: &mut Report, text: &str, artifact: &str) {
        for (kind, value) in text_candidates(self.rules, text) {
            self.inspect(report, kind, &value, artifact, None);
        }
    }
}
/// Host (exact or subdomain of a published domain, at label boundaries) and
/// IP matches in text, never substring matches; no DNS is
/// resolved. Only tokens that can be a domain or an IP (containing `.` or `:`)
/// are normalized, which keeps large text artifacts cheap to scan.
fn text_candidates(rules: &VerifiedRules, text: &str) -> Vec<(Kind, String)> {
    let mut hits = Vec::new();
    for token in text.split(|c: char| !(c.is_ascii_alphanumeric() || ".:-_/%?=&".contains(c))) {
        if token.len() > 2048 || token.len() < 4 || !token.contains(['.', ':']) {
            continue;
        }
        let host;
        let value = if token.starts_with("https://") || token.starts_with("http://") {
            match url::Url::parse(token)
                .ok()
                .and_then(|u| u.host_str().map(str::to_owned))
            {
                Some(h) => {
                    host = h;
                    host.as_str()
                }
                None => continue,
            }
        } else {
            token
        };
        if !rules.domain_matches(value).is_empty() {
            hits.push((Kind::Domain, value.to_string()));
        }
        if !rules.matches(Kind::Ip, value).is_empty() {
            hits.push((Kind::Ip, value.to_string()));
        }
    }
    hits
}
/// What one worker learned from one file: its hash and matching tokens.
struct FileResult {
    artifact: String,
    hash: String,
    bytes: u64,
    hits: Vec<(Kind, String)>,
}
fn examine(
    dir: &cap_std::fs::Dir,
    relative: &Path,
    rules: &VerifiedRules,
    cancel: &AtomicBool,
    deadline: Instant,
) -> Option<FileResult> {
    let mut file = dir.open(relative).ok()?;
    let metadata = file.metadata().ok()?;
    if !metadata.is_file() {
        return None;
    }
    let mut bytes = Vec::with_capacity(metadata.len().min(TEXT_LIMIT as u64) as usize);
    let mut hash = Sha256::new();
    let mut file_bytes = 0u64;
    let mut buffer = vec![0u8; 256 * 1024];
    loop {
        if cancel.load(Ordering::Relaxed) || Instant::now() > deadline {
            return None;
        }
        match file.read(&mut buffer) {
            Ok(0) => break,
            Ok(n) => {
                hash.update(&buffer[..n]);
                file_bytes += n as u64;
                let remaining = TEXT_LIMIT.saturating_sub(bytes.len());
                bytes.extend_from_slice(&buffer[..n.min(remaining)]);
            }
            Err(_) => return None,
        }
    }
    // Only UTF-8 text is tokenized; binary artifacts need format-specific adapters.
    let hits = if file_bytes <= TEXT_LIMIT as u64 {
        std::str::from_utf8(&bytes)
            .map(|text| text_candidates(rules, text))
            .unwrap_or_default()
    } else {
        Vec::new()
    };
    Some(FileResult {
        artifact: bounded(&relative.to_string_lossy(), 500),
        hash: crate::hex(&hash.finalize()),
        bytes: file_bytes,
        hits,
    })
}
/// Read-only scan. A capability directory prevents symlink/path escapes; no archive extraction.
pub fn scan_directory(
    root: &Path,
    device: &str,
    rules: &VerifiedRules,
    cancel: &AtomicBool,
    progress: impl Fn(u64),
) -> Result<Report, String> {
    if !["ios", "android"].contains(&device) {
        return Err("invalid_device".into());
    }
    let root = root.canonicalize().map_err(|_| "evidence_unavailable")?;
    if !root.is_dir() {
        return Err("evidence_not_directory".into());
    }
    let dir = cap_std::fs::Dir::open_ambient_dir(&root, cap_std::ambient_authority())
        .map_err(|_| "evidence_unavailable")?;
    let mut report = Report::new(device, rules.version());
    let mut matches = Matches::new(rules);
    let mut total = 0;
    let mut skipped = 0;
    let started = Instant::now();
    let deadline = started + DURATION_LIMIT;
    if cancel.load(Ordering::Relaxed) {
        return Err("cancelled".into());
    }
    // Enumerate first (bounded), then hash and tokenize files in parallel.
    let mut files = Vec::new();
    for (index, entry) in walkdir::WalkDir::new(&root)
        .follow_links(false)
        .max_depth(40)
        .into_iter()
        .enumerate()
    {
        if cancel.load(Ordering::Relaxed) {
            return Err("cancelled".into());
        }
        if index >= ENTRY_LIMIT || Instant::now() > deadline {
            skipped += 1;
            break;
        }
        let Ok(entry) = entry else {
            skipped += 1;
            continue;
        };
        if entry.file_type().is_dir() {
            continue;
        }
        if !entry.file_type().is_file() {
            skipped += 1;
            continue;
        }
        match entry.path().strip_prefix(&root) {
            Ok(relative) => files.push(relative.to_path_buf()),
            Err(_) => skipped += 1,
        }
    }
    let workers = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(2)
        .clamp(1, 8);
    let next = std::sync::atomic::AtomicUsize::new(0);
    let done = std::sync::atomic::AtomicU64::new(0);
    let results: std::sync::Mutex<Vec<(usize, Option<FileResult>)>> =
        std::sync::Mutex::new(Vec::with_capacity(files.len()));
    std::thread::scope(|scope| {
        for _ in 0..workers {
            scope.spawn(|| loop {
                let i = next.fetch_add(1, Ordering::Relaxed);
                if i >= files.len() || cancel.load(Ordering::Relaxed) {
                    break;
                }
                let result = examine(&dir, &files[i], rules, cancel, deadline);
                done.fetch_add(1, Ordering::Relaxed);
                if let Ok(mut all) = results.lock() {
                    all.push((i, result));
                }
            });
        }
        // Progress stays on the calling thread; workers only count.
        let mut reported = 0;
        while done.load(Ordering::Relaxed) < files.len() as u64 && !cancel.load(Ordering::Relaxed) {
            let now = done.load(Ordering::Relaxed);
            if now != reported {
                progress(now);
                reported = now;
            }
            std::thread::sleep(Duration::from_millis(200));
        }
    });
    if cancel.load(Ordering::Relaxed) {
        return Err("cancelled".into());
    }
    let mut results = results.into_inner().map_err(|_| "scan_failed")?;
    // Deterministic findings regardless of worker scheduling.
    results.sort_unstable_by_key(|(i, _)| *i);
    for (_, result) in results {
        let Some(result) = result else {
            skipped += 1;
            continue;
        };
        total += result.bytes;
        matches.inspect(
            &mut report,
            Kind::Sha256,
            &result.hash,
            &result.artifact,
            None,
        );
        for (kind, value) in result.hits {
            matches.inspect(&mut report, kind, &value, &result.artifact, None);
        }
        report.artifacts_analyzed += 1;
    }
    progress(report.artifacts_analyzed);
    report.check("local_indicators","completed",&format!("{} files read; {} bytes examined; {} inaccessible, special or limit-reached entries omitted.",report.artifacts_analyzed,total,skipped));
    if skipped > 0 {
        report.check("artifact_coverage","skipped","Some artifacts were not analyzed. Hashes stream without a file-size or total-volume cap. Text tokenization: 2 MiB per file; entry limit: 1000000; depth: 40; duration: 60 minutes.")
    }
    report.limitations.push("Binary artifact interpretation requires MVT or a compatible parser. Generic text matching does not interpret encrypted backups, SQLite records, protobuf or compressed archives.".into());
    if matches.truncated {
        report.check(
            "finding_limit",
            "skipped",
            "Only the first 500 deduplicated findings are included.",
        )
    }
    report.finish();
    Ok(report)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn scans_real_files_without_substring_false_positives() {
        let root = tempfile::tempdir().unwrap();
        std::fs::write(root.path().join("urls.txt"),"https://indicator.invalid/path https://notindicator.invalid https://indicator.invalid.attacker.invalid cdn.indicator.invalid").unwrap();
        let (bytes, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap();
        let report =
            scan_directory(root.path(), "ios", &rules, &AtomicBool::new(false), |_| {}).unwrap();
        assert_eq!(report.artifacts_analyzed, 1);
        assert_eq!(report.findings.len(), 2);
        assert!(report.findings.iter().any(|f| f
            .evidence
            .ends_with("cdn.indicator.invalid (subdomain of indicator.invalid)")));
        assert!(!report
            .findings
            .iter()
            .any(|f| f.evidence.contains("notindicator") || f.evidence.contains("attacker")));
    }
    #[test]
    fn large_files_are_hashed_without_loading_their_entire_content() {
        let root = tempfile::tempdir().unwrap();
        let path = root.path().join("large-database.sqlite");
        let file = std::fs::File::create(&path).unwrap();
        file.set_len(33 * 1024 * 1024).unwrap();
        drop(file);
        let (bytes, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap();
        let report =
            scan_directory(root.path(), "ios", &rules, &AtomicBool::new(false), |_| {}).unwrap();
        assert_eq!(report.artifacts_analyzed, 1);
        assert!(!report
            .checks
            .iter()
            .any(|check| check.id == "artifact_coverage"));
        assert!(report
            .checks
            .iter()
            .any(|check| check.detail.contains("34603008 bytes examined")));
    }
    #[test]
    fn cancellation_never_produces_clean_report() {
        let root = tempfile::tempdir().unwrap();
        let (bytes, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap();
        assert_eq!(
            scan_directory(root.path(), "ios", &rules, &AtomicBool::new(true), |_| {}).unwrap_err(),
            "cancelled"
        );
    }
    #[cfg(unix)]
    #[test]
    fn ignores_symlinks_to_private_files() {
        let root = tempfile::tempdir().unwrap();
        let outside = tempfile::NamedTempFile::new().unwrap();
        std::fs::write(outside.path(), "indicator.invalid").unwrap();
        std::os::unix::fs::symlink(outside.path(), root.path().join("escape")).unwrap();
        let (bytes, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap();
        let report = scan_directory(
            root.path(),
            "android",
            &rules,
            &AtomicBool::new(false),
            |_| {},
        )
        .unwrap();
        assert_eq!(report.artifacts_analyzed, 0);
        assert!(report.findings.is_empty());
    }
}
