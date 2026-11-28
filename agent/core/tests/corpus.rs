//! Detection corpus: whole cases, each a folder under `tests/corpus/`, run
//! through the same analyses the app runs, with the indicators the app ships.
//! Cases of phones with known spyware must give the detections they list;
//! cases of ordinary phones must give no finding beyond the ones they list.
//! Every false alarm we correct becomes a case here, so it cannot return.
//!
//! A case folder holds `case.json` and any of:
//! - `evidence/`: files of the phone's copy (text is searched for indicators);
//! - `inventory.json`: an Android inventory as the app reads it over ADB;
//! - `diagnostics/`: iPhone crash reports and shutdown.log;
//! - `mvt/`: MVT's JSON results (links, browsing history, profiles).
//!
//! `case.json`: `device` (`ios` or `android`), `about`, `inputs` (every file
//! of the case, so a file missing from a checkout fails instead of making the
//! case pass with nothing to analyse), `expect` (findings
//! that must appear) and `allow` (findings that may appear). Each entry is
//! `rule prefix` or `rule prefix | text in the evidence`. Any finding not
//! matched by `expect` or `allow` fails the case.
use enigm_scan_core::{
    android, extractions, ios_diagnostics, model::Report, rules::VerifiedRules, scan,
};
use std::{path::Path, sync::atomic::AtomicBool};

const KEYS: &[u8] = include_bytes!("../../../src-tauri/resources/intelligence/trusted-keys.bin");
const BUNDLE: &[u8] = include_bytes!("../../../src-tauri/resources/intelligence/bundle-v2.json");
const RELEASE: &[u8] = include_bytes!("../../../intelligence/release.json");

fn shipped_rules() -> VerifiedRules {
    let release: serde_json::Value = serde_json::from_slice(RELEASE).unwrap();
    // Verified as of its signing, so the corpus does not depend on today's date.
    VerifiedRules::verify(
        BUNDLE,
        KEYS,
        release["issuedAt"].as_i64().unwrap(),
        release["version"].as_u64().unwrap(),
    )
    .unwrap()
}

struct Pattern {
    rule: String,
    evidence: Option<String>,
}
impl Pattern {
    fn parse(text: &str) -> Self {
        let (rule, evidence) = match text.split_once('|') {
            Some((rule, evidence)) => (rule.trim(), Some(evidence.trim().to_string())),
            None => (text.trim(), None),
        };
        Self {
            rule: rule.into(),
            evidence,
        }
    }
    fn matches(&self, finding: &enigm_scan_core::model::Finding) -> bool {
        finding.rule.starts_with(&self.rule)
            && self
                .evidence
                .as_ref()
                .is_none_or(|e| finding.evidence.contains(e.as_str()))
    }
}

fn run(case: &Path, rules: &VerifiedRules) -> Report {
    let spec: serde_json::Value =
        serde_json::from_slice(&std::fs::read(case.join("case.json")).unwrap()).unwrap();
    let device = spec["device"].as_str().unwrap();
    let evidence = case.join("evidence");
    let mut report = if evidence.is_dir() {
        scan::scan_directory(&evidence, device, rules, &AtomicBool::new(false), |_| {}).unwrap()
    } else {
        Report::new(device, rules.version())
    };
    if let Ok(bytes) = std::fs::read(case.join("inventory.json")) {
        let inventory: android::Inventory = serde_json::from_slice(&bytes).unwrap();
        android::analyze(&inventory, rules, &mut report);
    }
    if case.join("diagnostics").is_dir() {
        ios_diagnostics::analyze(&case.join("diagnostics"), rules, &mut report);
    }
    if case.join("mvt").is_dir() {
        extractions::analyze(&case.join("mvt"), &mut report);
    }
    report
}

/// Every file under `dir`, relative to it, with `/` separators.
fn walk(dir: &Path) -> Vec<String> {
    let mut files = Vec::new();
    let mut pending = vec![dir.to_path_buf()];
    while let Some(next) = pending.pop() {
        for entry in std::fs::read_dir(&next).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                pending.push(path);
            } else {
                let relative = path.strip_prefix(dir).unwrap();
                let parts: Vec<_> = relative.iter().map(|p| p.to_string_lossy()).collect();
                files.push(parts.join("/"));
            }
        }
    }
    files
}

#[test]
fn detection_corpus() {
    let rules = shipped_rules();
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/corpus");
    let mut cases: Vec<_> = std::fs::read_dir(&root)
        .unwrap()
        .map(|e| e.unwrap().path())
        .filter(|p| p.join("case.json").is_file())
        .collect();
    cases.sort();
    assert!(!cases.is_empty());
    let mut failures = Vec::new();
    let (mut expected, mut found, mut unexpected) = (0, 0, 0);
    for case in &cases {
        let name = case.file_name().unwrap().to_string_lossy().to_string();
        let spec: serde_json::Value =
            serde_json::from_slice(&std::fs::read(case.join("case.json")).unwrap()).unwrap();
        let list = |key: &str| -> Vec<Pattern> {
            spec[key]
                .as_array()
                .map(|a| {
                    a.iter()
                        .map(|v| Pattern::parse(v.as_str().unwrap()))
                        .collect()
                })
                .unwrap_or_default()
        };
        let mut inputs: Vec<String> = spec["inputs"]
            .as_array()
            .map(|a| a.iter().map(|v| v.as_str().unwrap().to_string()).collect())
            .unwrap_or_default();
        inputs.sort();
        let mut present: Vec<String> = walk(case)
            .into_iter()
            .filter(|p| p != "case.json")
            .collect();
        present.sort();
        if inputs.is_empty() || inputs != present {
            failures.push(format!(
                "{name}: inputs {inputs:?} but the folder holds {present:?}"
            ));
            continue;
        }
        let (expect, allow) = (list("expect"), list("allow"));
        let report = run(case, &rules);
        for pattern in &expect {
            expected += 1;
            if report.findings.iter().any(|f| pattern.matches(f)) {
                found += 1;
            } else {
                failures.push(format!(
                    "{name}: missing {}{}",
                    pattern.rule,
                    pattern
                        .evidence
                        .as_deref()
                        .map(|e| format!(" | {e}"))
                        .unwrap_or_default()
                ));
            }
        }
        for finding in &report.findings {
            if !expect.iter().chain(&allow).any(|p| p.matches(finding)) {
                unexpected += 1;
                failures.push(format!(
                    "{name}: unexpected {} | {}",
                    finding.rule, finding.evidence
                ));
            }
        }
    }
    println!(
        "detection corpus: {} cases, {found} of {expected} expected findings, {unexpected} unexpected",
        cases.len()
    );
    assert!(failures.is_empty(), "\n{}", failures.join("\n"));
}
