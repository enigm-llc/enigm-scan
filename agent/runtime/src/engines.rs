use crate::process;
use enigm_scan_core::android::Inventory;
use enigm_scan_core::{
    model::{bounded, Engine, Finding, Report},
    rules::{Kind, VerifiedRules},
};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    io::Read,
    path::{Path, PathBuf},
    sync::atomic::AtomicBool,
    time::Duration,
};
/// Only evidence inside the private session workspace may be supplied here.
/// Decrypted files remain inside the session and are sanitized before parsing.
pub fn decrypt_ios_backup(
    catalog: &Catalog,
    source: &Path,
    destination: &Path,
    work: &Path,
    cancel: &AtomicBool,
    password: &str,
) -> Result<(), String> {
    if password.is_empty() || password.len() > 4096 || !source.is_dir() {
        return Err("backup_password_invalid".into());
    }
    let (program, _) = catalog.resolve("mvt-ios")?;
    let result = process::run_with_input(
        &program,
        &[
            "ios-decrypt".into(),
            source.to_string_lossy().into_owned(),
            destination.to_string_lossy().into_owned(),
        ],
        work,
        cancel,
        // Decryption rewrites every file of the backup; large phones need hours.
        Duration::from_secs(2 * 3600),
        password.as_bytes(),
    )?;
    if result.code != Some(0) || !destination.join("Manifest.db").is_file() {
        return Err("backup_decryption_failed".into());
    }
    Ok(())
}
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EngineSpec {
    pub id: String,
    pub file: String,
    pub sha256: String,
    pub version: String,
    #[serde(default)]
    pub support: Vec<SupportFile>,
    /// A folder engine (PyInstaller one-dir): `file` is its executable inside
    /// `tree`, and `tree_sha256` covers every file and link in the folder.
    #[serde(default)]
    pub tree: Option<String>,
    #[serde(default)]
    pub tree_sha256: Option<String>,
}
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SupportFile {
    pub file: String,
    pub sha256: String,
}
fn plain_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 120
        && name != "."
        && name != ".."
        && name
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"._-+".contains(&c))
}
/// A single-file engine names a file in the catalog root. A folder engine
/// names its executable as `<tree>/<path inside it>`.
fn valid_engine_path(spec: &EngineSpec) -> bool {
    match (&spec.tree, &spec.tree_sha256) {
        (None, None) => {
            plain_name(&spec.file)
                && spec
                    .file
                    .bytes()
                    .all(|c| c.is_ascii_alphanumeric() || b"._-".contains(&c))
        }
        (Some(tree), Some(sha)) => {
            plain_name(tree)
                && sha.len() == 64
                && sha.bytes().all(|b| b.is_ascii_hexdigit())
                && spec.file.len() <= 240
                && spec
                    .file
                    .strip_prefix(&format!("{tree}/"))
                    .is_some_and(|rest| rest.split('/').all(plain_name))
        }
        _ => false,
    }
}
/// Limits for a folder engine: generous for PyInstaller one-dir output (a few
/// hundred files), small enough that a hostile folder cannot exhaust memory.
const TREE_MAX_ENTRIES: usize = 20_000;
const TREE_MAX_BYTES: u64 = 2 * 1024 * 1024 * 1024;
const TREE_MAX_DEPTH: usize = 24;
/// Digest of a folder: one line per regular file ("F", path, SHA-256) and per
/// relative link that stays inside it ("L", path, target), sorted by path and
/// joined with newlines. Anything else fails. Paths use "/" on every system.
/// `scripts/engines/engine_tree.py` computes the same value at build time.
pub fn tree_digest(dir: &Path) -> Result<String, String> {
    let bad = || "engine_integrity_failed".to_string();
    let mut lines: Vec<(String, String)> = Vec::new();
    let mut total = 0u64;
    let mut pending = vec![(dir.to_path_buf(), String::new(), 0usize)];
    while let Some((path, rel, depth)) = pending.pop() {
        if depth > TREE_MAX_DEPTH {
            return Err(bad());
        }
        let entries = std::fs::read_dir(&path).map_err(|_| "engine_not_installed")?;
        for entry in entries {
            let entry = entry.map_err(|_| bad())?;
            let name = entry.file_name().into_string().map_err(|_| bad())?;
            if name.is_empty() || name.contains('/') || name.contains('\\') {
                return Err(bad());
            }
            let child_rel = if rel.is_empty() {
                name.clone()
            } else {
                format!("{rel}/{name}")
            };
            if lines.len() >= TREE_MAX_ENTRIES || child_rel.len() > 400 {
                return Err(bad());
            }
            let child = entry.path();
            let meta = std::fs::symlink_metadata(&child).map_err(|_| bad())?;
            let kind = meta.file_type();
            if kind.is_symlink() {
                let target = std::fs::read_link(&child).map_err(|_| bad())?;
                let target = target.to_str().ok_or_else(bad)?.replace('\\', "/");
                // Resolve lexically against the link's folder; it must stay inside.
                let mut parts: Vec<&str> = rel.split('/').filter(|p| !p.is_empty()).collect();
                if target.starts_with('/') || target.is_empty() {
                    return Err(bad());
                }
                for part in target.split('/') {
                    match part {
                        "" | "." => {}
                        ".." => {
                            parts.pop().ok_or_else(bad)?;
                        }
                        other => parts.push(other),
                    }
                }
                lines.push((child_rel.clone(), format!("L\t{child_rel}\t{target}")));
            } else if kind.is_dir() {
                pending.push((child, child_rel, depth + 1));
            } else if kind.is_file() {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if meta.permissions().mode() & 0o022 != 0 {
                        return Err("engine_permissions_invalid".into());
                    }
                }
                total = total.saturating_add(meta.len());
                if total > TREE_MAX_BYTES {
                    return Err(bad());
                }
                let mut file = std::fs::File::open(&child).map_err(|_| "engine_unreadable")?;
                let mut hash = Sha256::new();
                let mut chunk = [0u8; 65536];
                loop {
                    let n = file.read(&mut chunk).map_err(|_| "engine_unreadable")?;
                    if n == 0 {
                        break;
                    }
                    hash.update(&chunk[..n]);
                }
                lines.push((
                    child_rel.clone(),
                    format!("F\t{child_rel}\t{:x}", hash.finalize()),
                ));
            } else {
                return Err(bad());
            }
        }
    }
    lines.sort_by(|a, b| a.0.as_bytes().cmp(b.0.as_bytes()));
    let joined = lines
        .into_iter()
        .map(|(_, line)| line)
        .collect::<Vec<_>>()
        .join("\n");
    Ok(format!("{:x}", Sha256::digest(joined.as_bytes())))
}
pub struct Catalog {
    root: PathBuf,
    specs: Vec<EngineSpec>,
}
impl Catalog {
    pub fn new(root: PathBuf, manifest: &[u8]) -> Result<Self, String> {
        if manifest.len() > 65536 {
            return Err("engine_manifest_invalid".into());
        }
        let specs: Vec<EngineSpec> =
            serde_json::from_slice(manifest).map_err(|_| "engine_manifest_invalid")?;
        let mut ids = HashSet::new();
        for s in &specs {
            if ![
                "mvt-ios",
                "ios-usb",
                "mvt-android",
                "adb",
                "idevice_id",
                "idevicebackup2",
                "androidqf",
                "rvictl",
                "tcpdump",
                "yara-x",
            ]
            .contains(&s.id.as_str())
                || !ids.insert(&s.id)
                || !valid_engine_path(s)
                || s.sha256.len() != 64
                || !s.sha256.bytes().all(|b| b.is_ascii_hexdigit())
                || s.version.is_empty()
            {
                return Err("engine_manifest_invalid".into());
            }
        }
        for spec in &specs {
            if spec.support.len() > 32 {
                return Err("engine_manifest_invalid".into());
            }
            for support in &spec.support {
                if support.file.is_empty()
                    || support.file.len() > 180
                    || !support.file.split('/').all(|part| {
                        !part.is_empty()
                            && part != "."
                            && part != ".."
                            && part
                                .bytes()
                                .all(|b| b.is_ascii_alphanumeric() || b"._-+".contains(&b))
                    })
                    || support.sha256.len() != 64
                    || !support.sha256.bytes().all(|b| b.is_ascii_hexdigit())
                {
                    return Err("engine_manifest_invalid".into());
                }
            }
        }
        Ok(Self { root, specs })
    }
    pub fn resolve(&self, id: &str) -> Result<(PathBuf, String), String> {
        let spec = self
            .specs
            .iter()
            .find(|s| s.id == id)
            .ok_or("engine_not_installed")?;
        let path = self.root.join(&spec.file);
        self.verify_file(&path, &spec.sha256)?;
        if let (Some(tree), Some(expected)) = (&spec.tree, &spec.tree_sha256) {
            let folder = self.root.join(tree);
            let canonical_root = self
                .root
                .canonicalize()
                .map_err(|_| "engine_not_installed")?;
            let canonical = folder.canonicalize().map_err(|_| "engine_not_installed")?;
            let meta = std::fs::symlink_metadata(&folder).map_err(|_| "engine_not_installed")?;
            if !meta.is_dir() || canonical.parent() != Some(canonical_root.as_path()) {
                return Err("engine_integrity_failed".into());
            }
            if tree_digest(&folder)? != expected.to_lowercase() {
                return Err("engine_integrity_failed".into());
            }
        }
        for support in &spec.support {
            self.verify_file(&self.root.join(&support.file), &support.sha256)?;
        }
        Ok((path, spec.version.clone()))
    }
    fn verify_file(&self, path: &Path, expected: &str) -> Result<(), String> {
        let canonical_root = self
            .root
            .canonicalize()
            .map_err(|_| "engine_not_installed")?;
        if !path
            .canonicalize()
            .map_err(|_| "engine_not_installed")?
            .starts_with(&canonical_root)
        {
            return Err("engine_integrity_failed".into());
        }
        let meta = std::fs::symlink_metadata(path).map_err(|_| "engine_not_installed")?;
        if !meta.is_file() || meta.len() > 1024 * 1024 * 1024 {
            return Err("engine_integrity_failed".into());
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if meta.permissions().mode() & 0o022 != 0 {
                return Err("engine_permissions_invalid".into());
            }
        }
        let mut file = std::fs::File::open(path).map_err(|_| "engine_unreadable")?;
        let mut hash = Sha256::new();
        let mut chunk = [0u8; 65536];
        loop {
            let n = file.read(&mut chunk).map_err(|_| "engine_unreadable")?;
            if n == 0 {
                break;
            }
            hash.update(&chunk[..n]);
        }
        if format!("{:x}", hash.finalize()) != expected.to_lowercase() {
            return Err("engine_integrity_failed".into());
        }
        Ok(())
    }
    pub fn available(&self, id: &str) -> bool {
        self.resolve(id).is_ok()
    }
}
pub fn mvt_args(
    device: &str,
    evidence: &Path,
    output: &Path,
    iocs: &Path,
) -> Result<Vec<String>, String> {
    let bugreport = device == "android" && evidence.is_file();
    let command = match device {
        "ios" => "check-backup",
        "android" if bugreport => "check-bugreport",
        "android" => "check-androidqf",
        _ => return Err("invalid_device".into()),
    };
    let mut args = vec![
        device.into(),
        "--disable-update-check".into(),
        "--disable-indicator-update-check".into(),
        command.into(),
        "--output".into(),
        output.to_string_lossy().into_owned(),
        "--iocs".into(),
        iocs.to_string_lossy().into_owned(),
    ];
    if device == "android" && !bugreport {
        args.push("--non-interactive".into())
    }
    args.push(evidence.to_string_lossy().into_owned());
    Ok(args)
}
pub fn write_stix(rules: &VerifiedRules, path: &Path) -> Result<(), String> {
    let objects:Vec<_>=rules.rules().iter().map(|r|{
        // Values were validated at verification: free text cannot contain
        // `=`, quotes, brackets or control characters (see rules::normalize).
        let pattern = match r.kind {
            Kind::Domain => format!("[domain-name:value = '{}']", r.value),
            Kind::Ip => format!(
                "[{}-addr:value = '{}']",
                if r.value.contains(':') { "ipv6" } else { "ipv4" },
                r.value
            ),
            Kind::Sha256 => format!("[file:hashes.'SHA-256' = '{}']", r.value),
            Kind::ProcessName => format!("[process:name = '{}']", r.value),
            Kind::Email => format!("[email-addr:value = '{}']", r.value),
            Kind::FileName => format!("[file:name = '{}']", r.value),
            Kind::FilePath => format!("[file:path = '{}']", r.value),
            Kind::AppId => format!("[app:id = '{}']", r.value),
            Kind::AppCertSha256 => format!("[app:cert.sha256 = '{}']", r.value),
            Kind::ConfigurationProfileId => {
                format!("[configuration-profile:id = '{}']", r.value)
            }
        };
        // Deterministic UUIDv4-shaped IDs from rule IDs. Data values are normalized at verification.
        let hash=format!("{:x}",Sha256::digest(r.id.as_bytes()));let id=format!("indicator--{}-{}-4{}-a{}-{}",&hash[0..8],&hash[8..12],&hash[13..16],&hash[17..20],&hash[20..32]);
        serde_json::json!({"type":"indicator","spec_version":"2.1","id":id,"created":"2026-10-25T00:00:00Z","modified":"2026-10-25T00:00:00Z","valid_from":"2026-10-25T00:00:00Z","pattern_type":"stix","pattern":pattern,"name":r.id,"external_references":[{"source_name":"published research","url":r.source}]})
    }).collect();
    let bundle = serde_json::json!({"type":"bundle","id":"bundle--45f4475b-d00a-4fa4-8e43-e5dac3284143","objects":objects});
    std::fs::write(
        path,
        serde_json::to_vec(&bundle).map_err(|_| "stix_failed")?,
    )
    .map_err(|_| "stix_failed".into())
}
pub fn analyze_mvt(
    catalog: &Catalog,
    device: &str,
    evidence: &Path,
    workspace: &Path,
    rules: &VerifiedRules,
    cancel: &AtomicBool,
    report: &mut Report,
) -> Result<(), String> {
    let id = if device == "ios" {
        "mvt-ios"
    } else {
        "mvt-android"
    };
    let (program, version) = catalog.resolve(id)?;
    if version != "2026.10.12" {
        return Err("engine_version_unsupported".into());
    }
    let output = workspace.join("mvt");
    std::fs::create_dir(&output).map_err(|_| "workspace_failed")?;
    let iocs = workspace.join("indicators.stix2");
    write_stix(rules, &iocs)?;
    let result = process::run(
        &program,
        &mvt_args(device, evidence, &output, &iocs)?,
        workspace,
        cancel,
        Duration::from_secs(3600),
    )?;
    report.engines.push(Engine {
        name: id.into(),
        version: version.clone(),
    });
    if result.code != Some(0) {
        return Err("mvt_failed".into());
    }
    let coverage_path = workspace.join("mvt-coverage.json");
    let coverage = std::fs::read(&coverage_path).map_err(|_| "mvt_coverage_missing")?;
    apply_coverage(&coverage, report)?;
    let inventory = std::fs::read(workspace.join(crate::acquire::ANDROID_INVENTORY))
        .ok()
        .and_then(|bytes| serde_json::from_slice::<Inventory>(&bytes).ok());
    let mut routine = Routine::default();
    let mut parsed = 0;
    let mut alerts = 0;
    for entry in walkdir::WalkDir::new(&output)
        .follow_links(false)
        .max_depth(4)
        .into_iter()
        .take(10000)
    {
        let entry = entry.map_err(|_| "mvt_output_invalid")?;
        if !entry.file_type().is_file() {
            continue;
        }
        let name = entry.file_name().to_string_lossy();
        if !name.ends_with("_detected.json") {
            continue;
        }
        let meta = entry.metadata().map_err(|_| "mvt_output_invalid")?;
        if meta.len() > 5 * 1024 * 1024 {
            return Err("mvt_output_limit".into());
        }
        let data = std::fs::read(entry.path()).map_err(|_| "mvt_output_invalid")?;
        let items = parse_alerts_with_rules(
            &data,
            &version,
            rules.version(),
            Some(rules),
            inventory.as_ref(),
            &mut routine,
        )?;
        parsed += 1;
        alerts += items.len();
        for f in items {
            if report.findings.len() < 500
                && !report.findings.iter().any(|existing| existing.id == f.id)
            {
                report.findings.push(f)
            }
        }
    }
    report.check("mvt_alert_import","completed",&format!("{parsed} alert output files parsed; {alerts} alerts returned. See each module check for actual extraction and indicator coverage."));
    // Enigm's own analysis of MVT's extracted records: impersonating links in
    // messages and browsers, and configuration profiles able to intercept.
    enigm_scan_core::extractions::analyze(&output, report);
    report.check("mvt_routine_alerts", "completed", &format!("{} MVT heuristics omitted as routine on ordinary phones: app updates and uninstalls, the manufacturer's own accessibility services, apps from known stores allowed to install updates, and the USB debugging session used by this scan. None matched a signed indicator; indicator matches are never omitted.", routine.omitted));
    if let Some(patch) = routine.security_patch {
        report.check("android_security_patch", "completed", &format!("{patch} Install the latest system update; an outdated phone is easier to attack, but this is not a sign of spyware."));
    }
    if alerts >= 500 {
        report.check(
            "mvt_alert_limit",
            "skipped",
            "Report findings are capped at 500.",
        )
    }
    report.limitations.push("MVT exit success does not prove all artifact modules completed. Encrypted, absent or unsupported artifacts may be skipped by the engine.".into());
    Ok(())
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct ModuleCoverage {
    module: String,
    extraction: String,
    indicators: String,
}
fn apply_coverage(bytes: &[u8], report: &mut Report) -> Result<(), String> {
    if bytes.len() > 128 * 1024 {
        return Err("mvt_coverage_invalid".into());
    }
    let modules: Vec<ModuleCoverage> =
        serde_json::from_slice(bytes).map_err(|_| "mvt_coverage_invalid")?;
    if modules.is_empty() || modules.len() > 250 {
        return Err("mvt_no_modules".into());
    }
    let mut names = HashSet::new();
    for module in &modules {
        if module.module.is_empty()
            || module.module.len() > 100
            || !module
                .module
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || c == b'_')
            || !names.insert(&module.module)
            || !["completed", "empty", "skipped", "failed"].contains(&module.extraction.as_str())
            || !["completed", "none", "skipped", "failed"].contains(&module.indicators.as_str())
        {
            return Err("mvt_coverage_invalid".into());
        }
    }
    for module in modules {
        let status = if module.extraction == "failed" || module.indicators == "failed" {
            "failed"
        } else if module.extraction == "skipped" || module.indicators == "skipped" {
            "skipped"
        } else {
            "completed"
        };
        report.check(&format!("mvt_{}", module.module), status,
            &format!("Extraction: {}; indicator matching: {}. Completion means the module returned; it does not imply every device artifact was accessible.", module.extraction, module.indicators));
    }
    Ok(())
}
#[derive(Deserialize)]
struct Alert {
    level: String,
    module: String,
    message: String,
    event_time: Option<String>,
    event: serde_json::Value,
    #[serde(default)]
    matched_indicator: serde_json::Value,
}
/// MVT heuristics that fire on ordinary phones: package updates and
/// uninstalls, the manufacturer's own accessibility services, apps from known
/// stores that may install updates, and the USB debugging session this scan
/// itself uses. They are counted, never silently dropped, and never applied
/// to an alert that matches a signed indicator.
#[derive(Default)]
pub struct Routine {
    pub omitted: usize,
    pub security_patch: Option<String>,
}
impl Routine {
    fn absorb(
        &mut self,
        message: &str,
        event: &serde_json::Value,
        inventory: Option<&Inventory>,
    ) -> bool {
        let package = event
            .get("package_name")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let trusted = || inventory.and_then(|i| i.trusted(package)) == Some(true);
        let routine = if message.starts_with("This phone has not received security updates") {
            // Device hygiene, not a sign of spyware: reported as a check.
            self.security_patch = Some(bounded(message, 300));
            return true;
        } else if message.starts_with("Detected uninstall of package")
            || message.starts_with("Detected downgrade of package")
            || message.starts_with("The accessibility dump states")
        {
            true
        } else if message.starts_with("Risky package 'com.android.shell'") {
            // ADB runs as com.android.shell: this is the scan's own session.
            true
        } else if message.starts_with("Found accessibility service:")
            || message.contains("risky permission 'REQUEST_INSTALL_PACKAGES'")
        {
            trusted()
        } else {
            message.starts_with("Found suspicious") && message.contains("accessibility_enabled")
        };
        if routine {
            self.omitted += 1;
        }
        routine
    }
}
pub fn parse_alerts(bytes: &[u8], version: &str, bundle: u64) -> Result<Vec<Finding>, String> {
    parse_alerts_with_rules(bytes, version, bundle, None, None, &mut Routine::default())
}
fn parse_alerts_with_rules(
    bytes: &[u8],
    version: &str,
    bundle: u64,
    rules: Option<&VerifiedRules>,
    inventory: Option<&Inventory>,
    routine: &mut Routine,
) -> Result<Vec<Finding>, String> {
    if bytes.len() > 5 * 1024 * 1024 {
        return Err("mvt_output_limit".into());
    }
    let alerts: Vec<Alert> = serde_json::from_slice(bytes).map_err(|_| "mvt_schema_changed")?;
    if alerts.len() > 10000 {
        return Err("mvt_output_limit".into());
    }
    let mut findings = Vec::new();
    for a in alerts {
        let severity = a.level.to_lowercase();
        if !["informational", "low", "medium", "high", "critical"].contains(&severity.as_str())
            || a.module.is_empty()
            || a.message.is_empty()
        {
            return Err("mvt_schema_changed".into());
        }
        let evidence = bounded(
            &format!(
                "{} | {} | indicator={}",
                a.message, a.event, a.matched_indicator
            ),
            1800,
        );
        let hash = format!(
            "{:x}",
            Sha256::digest(
                format!(
                    "{}{}{}",
                    a.module,
                    evidence,
                    a.event_time.as_deref().unwrap_or("")
                )
                .as_bytes()
            )
        );
        let timestamp = a.event_time.filter(|s| {
            time::OffsetDateTime::parse(s, &time::format_description::well_known::Rfc3339).is_ok()
        });
        let matched_rule = rules.and_then(|rules| {
            let value = a.matched_indicator.get("value")?.as_str()?;
            let kind = match a.matched_indicator.get("type")?.as_str()? {
                "domains" if value.parse::<std::net::IpAddr>().is_ok() => Kind::Ip,
                "domains" => Kind::Domain,
                "ips" => Kind::Ip,
                "files_sha256" => Kind::Sha256,
                "processes" => Kind::ProcessName,
                "emails" => Kind::Email,
                "file_names" => Kind::FileName,
                "file_paths" => Kind::FilePath,
                "app_ids" => Kind::AppId,
                "app_cert_hashes" => Kind::AppCertSha256,
                "ios_profile_ids" => Kind::ConfigurationProfileId,
                _ => return None,
            };
            rules
                .matches(kind, value)
                .first()
                .map(|rule| (rule.id.clone(), rule.family().map(str::to_owned)))
        });
        let (matched_rule, family) = match matched_rule {
            Some((rule, family)) => (Some(rule), family),
            None => (None, None),
        };
        // The finding ID stays derived from MVT's own alert text.
        let evidence = match &family {
            Some(family) => bounded(&format!("{evidence} | family={family}"), 1800),
            None => evidence,
        };
        if matched_rule.is_none() && routine.absorb(&a.message, &a.event, inventory) {
            continue;
        }
        // Only an alert tied to a signed indicator is a detection. MVT's
        // heuristics (unusual settings, sideloaded or rooting apps…) are
        // review points under `mvt.heuristic.*` with low confidence.
        let (rule, confidence, limitation, recommendation) = match matched_rule {
            Some(rule) => (
                rule,
                "medium",
                "MVT alert matching a signed indicator, reproduced with its original severity. A match does not independently confirm infection; missing or timezone-ambiguous event timestamps are omitted.",
                "Preserve the evidence and obtain expert review before taking destructive action.",
            ),
            None => (
                format!("mvt.heuristic.{}", &hash[..24]),
                "low",
                "MVT heuristic without a known spyware or stalkerware indicator. It flags configurations or apps worth reviewing and is common on devices that are not infected.",
                "Check whether you recognise this app or setting. If you do not, review it with an expert.",
            ),
        };
        findings.push(Finding {
            id: format!("mvt.{hash}"),
            category: bounded(&format!("MVT {}", a.module), 200),
            source: "https://github.com/mvt-project/mvt".into(),
            evidence,
            severity,
            confidence: confidence.into(),
            timestamp,
            rule,
            rule_version: format!("{version}; bundle {bundle}"),
            limitations: vec![limitation.into()],
            recommendation: recommendation.into(),
        });
    }
    Ok(findings)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn mvt_never_enables_external_analysis() {
        let args = mvt_args(
            "android",
            Path::new("/evidence"),
            Path::new("/output"),
            Path::new("/rules"),
        )
        .unwrap();
        assert!(args.contains(&"--disable-update-check".into()));
        assert!(args.contains(&"--disable-indicator-update-check".into()));
        assert!(args.contains(&"--non-interactive".into()));
        assert!(!args.contains(&"--virustotal".into()));
        assert!(!args.contains(&"--load-module".into()))
    }
    #[test]
    fn routine_heuristics_are_counted_but_not_reported() {
        use enigm_scan_core::android::Package;
        let inventory = Inventory {
            packages: vec![
                Package {
                    id: "com.nothing.launcher".into(),
                    path: "/system/app/L/L.apk".into(),
                    system: true,
                    ..Default::default()
                },
                Package {
                    id: "com.spy.helper".into(),
                    path: "/data/app/~~a==/s-1==/base.apk".into(),
                    ..Default::default()
                },
                Package {
                    id: "org.mozilla.firefox".into(),
                    path: "/data/app/~~b==/f-1==/base.apk".into(),
                    installer: Some("com.android.vending".into()),
                    ..Default::default()
                },
            ],
            ..Default::default()
        };
        let alerts = serde_json::json!([
            {"level":"MEDIUM","module":"battery_daily","message":"Detected uninstall of package com.x (vers 0)","event":{"package_name":"com.x"}},
            {"level":"MEDIUM","module":"battery_daily","message":"Detected downgrade of package com.y from vers 3 to vers 2","event":{"package_name":"com.y"}},
            {"level":"MEDIUM","module":"appops","message":"Risky package 'com.android.shell' had 'X' permission set to 'allow' at 2026","event":{"package_name":"com.android.shell"}},
            {"level":"MEDIUM","module":"accessibility","message":"Found accessibility service: \"com.nothing.launcher/.A\" (enabled)","event":{"package_name":"com.nothing.launcher"}},
            {"level":"MEDIUM","module":"appops","message":"Package 'org.mozilla.firefox' had risky permission 'REQUEST_INSTALL_PACKAGES' set to 'allow' at 2026","event":{"package_name":"org.mozilla.firefox"}},
            {"level":"MEDIUM","module":"getprop","message":"This phone has not received security updates for more than six months (last update: 2025-01-05).","event":{}},
            {"level":"MEDIUM","module":"accessibility","message":"Found accessibility service: \"com.spy.helper/.A\" (enabled)","event":{"package_name":"com.spy.helper"}},
            {"level":"MEDIUM","module":"packages","message":"Found an installed package related to rooting/jailbreaking: \"com.topjohnwu.magisk\"","event":{"package_name":"com.topjohnwu.magisk"}}
        ]);
        let mut routine = Routine::default();
        let findings = parse_alerts_with_rules(
            &serde_json::to_vec(&alerts).unwrap(),
            "2026.10.12",
            1,
            None,
            Some(&inventory),
            &mut routine,
        )
        .unwrap();
        // A sideloaded app with accessibility and a rooting app stay as review points.
        assert_eq!(findings.len(), 2);
        assert!(findings
            .iter()
            .all(|f| f.rule.starts_with("mvt.heuristic.")));
        assert!(findings[0].evidence.contains("com.spy.helper"));
        assert_eq!(routine.omitted, 5);
        assert!(routine.security_patch.unwrap().contains("2025-01-05"));
        // Without an inventory, accessibility services are never assumed trusted.
        let mut routine = Routine::default();
        let kept = parse_alerts_with_rules(
            &serde_json::to_vec(&alerts).unwrap(),
            "2026.10.12",
            1,
            None,
            None,
            &mut routine,
        )
        .unwrap();
        assert_eq!(kept.len(), 4);
    }
    #[test]
    fn parses_actual_v3_alert_shape() {
        let bytes=br#"[{"level":"HIGH","module":"safari","message":"synthetic test match","event_time":"2026-10-25T10:00:00Z","event":{"url":"https://test.invalid"},"matched_indicator":null}]"#;
        let f = parse_alerts(bytes, "2026.10.12", 1).unwrap();
        assert_eq!(f[0].severity, "high");
        // No signed indicator matched: a review point, not a detection.
        assert_eq!(f[0].confidence, "low");
        assert!(f[0].rule.starts_with("mvt.heuristic."));
        assert!(f[0].timestamp.is_some())
    }
    #[test]
    fn only_verified_indicator_identity_can_link_forensic_and_network_findings() {
        let bytes = include_bytes!("../../../src-tauri/resources/intelligence/bundle.json");
        let key = include_bytes!("../../../src-tauri/resources/intelligence/public-key.bin");
        let release: serde_json::Value =
            serde_json::from_slice(include_bytes!("../../../intelligence/release.json")).unwrap();
        let rules =
            VerifiedRules::verify(bytes, key, release["issuedAt"].as_i64().unwrap(), 1).unwrap();
        let rule = rules
            .rules()
            .iter()
            .find(|rule| rule.kind == Kind::Domain)
            .unwrap();
        let alert = serde_json::json!([{"level":"HIGH","module":"Safari","message":"synthetic fixture",
            "event_time":"2026-10-26T11:00:00Z","event":{},
            "matched_indicator":{"type":"domains","value":rule.value}}]);
        let findings = parse_alerts_with_rules(
            &serde_json::to_vec(&alert).unwrap(),
            "2026.10.12",
            rules.version(),
            Some(&rules),
            None,
            &mut Routine::default(),
        )
        .unwrap();
        assert_eq!(findings[0].rule, rule.id);
        let mut unrelated = alert;
        unrelated[0]["matched_indicator"]["value"] = serde_json::json!("untrusted.invalid");
        let findings = parse_alerts_with_rules(
            &serde_json::to_vec(&unrelated).unwrap(),
            "2026.10.12",
            rules.version(),
            Some(&rules),
            None,
            &mut Routine::default(),
        )
        .unwrap();
        assert_ne!(findings[0].rule, rule.id);
    }
    #[test]
    fn unknown_mvt_schema_fails_closed() {
        assert!(parse_alerts(br#"[{"detected":true}]"#, "2026.10.12", 1).is_err())
    }
    #[test]
    fn missing_or_failed_modules_never_appear_completed() {
        let mut report = Report::new("ios", 1);
        apply_coverage(br#"[{"module":"Safari","extraction":"completed","indicators":"failed"},{"module":"Messages","extraction":"skipped","indicators":"skipped"}]"#, &mut report).unwrap();
        assert_eq!(report.checks[0].status, "failed");
        assert_eq!(report.checks[1].status, "skipped");
        // No data of this kind, or no indicator matching for it, is a completed check.
        let mut done = Report::new("android", 1);
        apply_coverage(br#"[{"module":"Tombstones","extraction":"empty","indicators":"completed"},{"module":"BugReportTimestamps","extraction":"completed","indicators":"none"}]"#, &mut done).unwrap();
        assert!(done.checks.iter().all(|c| c.status == "completed"));
        assert!(apply_coverage(b"[]", &mut report).is_err());
        assert!(apply_coverage(
            br#"[{"module":"Safari","extraction":"unknown","indicators":"completed"}]"#,
            &mut report
        )
        .is_err());
    }
    #[test]
    fn detects_modified_runtime_libraries() {
        let work = tempfile::tempdir().unwrap();
        std::fs::write(work.path().join("adb"), b"synthetic executable").unwrap();
        std::fs::write(work.path().join("support.dll"), b"synthetic support").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            for name in ["adb", "support.dll"] {
                std::fs::set_permissions(
                    work.path().join(name),
                    std::fs::Permissions::from_mode(0o600),
                )
                .unwrap();
            }
        }
        let manifest = serde_json::to_vec(&serde_json::json!([{
            "id":"adb", "file":"adb", "version":"fixture",
            "sha256":format!("{:x}", Sha256::digest(b"synthetic executable")),
            "support":[{"file":"support.dll", "sha256":format!("{:x}", Sha256::digest(b"synthetic support"))}]
        }])).unwrap();
        let catalog = Catalog::new(work.path().to_owned(), &manifest).unwrap();
        catalog.resolve("adb").unwrap();
        std::fs::write(work.path().join("support.dll"), b"changed").unwrap();
        assert_eq!(
            catalog.resolve("adb").unwrap_err(),
            "engine_integrity_failed"
        );
    }
    #[cfg(unix)]
    fn fixture_tree(root: &Path) {
        use std::os::unix::fs::PermissionsExt;
        let dir = root.join("engine");
        std::fs::create_dir_all(dir.join("sub")).unwrap();
        std::fs::write(dir.join("a.txt"), b"alpha").unwrap();
        std::fs::write(dir.join("sub/b.bin"), b"beta").unwrap();
        std::fs::write(dir.join("Z.so"), b"Z").unwrap();
        std::os::unix::fs::symlink("../a.txt", dir.join("sub/link")).unwrap();
        for name in ["a.txt", "sub/b.bin", "Z.so"] {
            std::fs::set_permissions(dir.join(name), std::fs::Permissions::from_mode(0o644))
                .unwrap();
        }
    }
    #[cfg(unix)]
    #[test]
    fn folder_digest_matches_the_build_script() {
        // Same folder and value as scripts/engines/engine_tree.py computes.
        let work = tempfile::tempdir().unwrap();
        fixture_tree(work.path());
        assert_eq!(
            tree_digest(&work.path().join("engine")).unwrap(),
            "221447e452024026f2adb9fce280fe91f6ec01199e6fbd40d65a33620d676143"
        );
    }
    #[cfg(unix)]
    #[test]
    fn folder_engines_detect_any_change_and_escaping_links() {
        use std::os::unix::fs::PermissionsExt;
        let work = tempfile::tempdir().unwrap();
        fixture_tree(work.path());
        let manifest = |tree_sha: &str| {
            serde_json::to_vec(&serde_json::json!([{
                "id":"ios-usb", "file":"engine/sub/b.bin", "version":"fixture",
                "sha256":format!("{:x}", Sha256::digest(b"beta")),
                "tree":"engine", "tree_sha256":tree_sha
            }]))
            .unwrap()
        };
        let good = tree_digest(&work.path().join("engine")).unwrap();
        let catalog = Catalog::new(work.path().to_owned(), &manifest(&good)).unwrap();
        catalog.resolve("ios-usb").unwrap();
        // A changed library, an added file and a link out of the folder all fail.
        std::fs::write(work.path().join("engine/Z.so"), b"changed").unwrap();
        assert_eq!(
            catalog.resolve("ios-usb").unwrap_err(),
            "engine_integrity_failed"
        );
        std::fs::write(work.path().join("engine/Z.so"), b"Z").unwrap();
        catalog.resolve("ios-usb").unwrap();
        std::fs::write(work.path().join("engine/extra.so"), b"x").unwrap();
        std::fs::set_permissions(
            work.path().join("engine/extra.so"),
            std::fs::Permissions::from_mode(0o644),
        )
        .unwrap();
        assert_eq!(
            catalog.resolve("ios-usb").unwrap_err(),
            "engine_integrity_failed"
        );
        std::fs::remove_file(work.path().join("engine/extra.so")).unwrap();
        std::os::unix::fs::symlink("../../outside", work.path().join("engine/sub/out")).unwrap();
        assert_eq!(
            catalog.resolve("ios-usb").unwrap_err(),
            "engine_integrity_failed"
        );
        std::fs::remove_file(work.path().join("engine/sub/out")).unwrap();
        // Writable by others is refused like single-file engines.
        std::fs::set_permissions(
            work.path().join("engine/a.txt"),
            std::fs::Permissions::from_mode(0o666),
        )
        .unwrap();
        assert_eq!(
            catalog.resolve("ios-usb").unwrap_err(),
            "engine_permissions_invalid"
        );
    }
    #[test]
    fn folder_engine_paths_stay_inside_their_folder() {
        for (file, tree) in [
            ("engine/../adb", "engine"),
            ("other/adb", "engine"),
            ("engine/", "engine"),
            ("engine/adb", "../engine"),
            ("engine/adb", "en/gine"),
        ] {
            let manifest = serde_json::to_vec(&serde_json::json!([{
                "id":"ios-usb", "file":file, "version":"1", "sha256":"a".repeat(64),
                "tree":tree, "tree_sha256":"b".repeat(64)
            }]))
            .unwrap();
            assert!(
                Catalog::new(PathBuf::from("/tmp"), &manifest).is_err(),
                "{file} {tree}"
            );
        }
        // A nested path is only valid together with its folder digest.
        let manifest = br#"[{"id":"ios-usb","file":"engine/adb","sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","version":"1"}]"#;
        assert!(Catalog::new(PathBuf::from("/tmp"), manifest).is_err());
    }
    #[test]
    fn rejects_support_library_path_escapes() {
        let manifest = serde_json::to_vec(&serde_json::json!([{
            "id":"adb", "file":"adb", "version":"fixture", "sha256":"a".repeat(64),
            "support":[{"file":"../outside.dll", "sha256":"b".repeat(64)}]
        }]))
        .unwrap();
        assert!(Catalog::new(PathBuf::from("/tmp"), &manifest).is_err());
    }
    #[test]
    fn disallows_catalog_traversal() {
        assert!(Catalog::new(
            PathBuf::from("/tmp"),
            br#"[{"id":"adb","file":"../adb","sha256":"a","version":"1"}]"#
        )
        .is_err())
    }
}
