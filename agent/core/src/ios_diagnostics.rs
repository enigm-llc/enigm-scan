//! iPhone process traces outside the backup: crash reports and the
//! `shutdown.log` of a sysdiagnose, read over USB by the iOS adapter.
//!
//! - `shutdown.log` lists the processes that were still running and delayed
//!   each reboot. Kaspersky found Pegasus this way ("iShutdown", 2024): its
//!   processes ran from `/private/var/db/` and `/private/var/tmp/`, folders no
//!   legitimate executable runs from. The log keeps the history of many
//!   reboots, so a past infection can remain visible.
//! - Crash reports name the executable path of the process that crashed, so
//!   the same location test applies, and repeated crashes of the services that
//!   parse incoming iMessages are the surface of zero-click exploits
//!   (FORCEDENTRY, BLASTPASS).
//!
//! Process names and paths are also matched against the signed indicators.
use crate::{
    model::{bounded, Finding, Report},
    rules::{Kind, VerifiedRules},
    scan::Matches,
};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    path::{Path, PathBuf},
};
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

const MAX_REPORTS: usize = 3000;
const MAX_REPORT_BYTES: u64 = 4 * 1024 * 1024;
const MAX_SHUTDOWN_BYTES: u64 = 16 * 1024 * 1024;

/// A process that delayed a reboot, from `shutdown.log`.
#[derive(Debug, Clone, PartialEq)]
pub struct ShutdownEntry {
    pub path: String,
    /// Unix time of the reboot (`SIGTERM` line), when present.
    pub at: Option<i64>,
}
/// `remaining client pid: N (/path)` lines grouped by the following
/// `SIGTERM: [unix time]` line, as MVT's shutdown log module does.
pub fn parse_shutdown_log(text: &str) -> (Vec<ShutdownEntry>, usize) {
    let mut entries = Vec::new();
    let mut pending: Vec<String> = Vec::new();
    let mut reboots = 0;
    for line in text.lines() {
        let line = line.trim();
        if let Some(rest) = line.strip_prefix("remaining client pid:") {
            if let (Some(open), Some(close)) = (rest.find('('), rest.rfind(')')) {
                let path = rest[open + 1..close].trim();
                if path.starts_with('/') && path.len() <= 1024 && !pending.iter().any(|p| p == path)
                {
                    pending.push(path.to_string());
                }
            }
        } else if let Some(rest) = line.strip_prefix("SIGTERM:") {
            reboots += 1;
            let at = rest
                .trim()
                .trim_start_matches('[')
                .split(|c: char| !c.is_ascii_digit())
                .next()
                .and_then(|n| n.parse::<i64>().ok())
                .filter(|t| (946_684_800..4_102_444_800).contains(t));
            for path in pending.drain(..) {
                if entries.len() < 50_000 {
                    entries.push(ShutdownEntry { path, at });
                }
            }
        }
    }
    // Processes listed after the last reboot record (log cut short).
    for path in pending {
        entries.push(ShutdownEntry { path, at: None });
    }
    (entries, reboots)
}

/// What a crash report says about the process that crashed.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct Crash {
    pub name: String,
    pub path: Option<String>,
    pub at: Option<String>,
}
#[derive(Deserialize)]
struct IpsHeader {
    #[serde(default)]
    bug_type: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    app_name: Option<String>,
    #[serde(default)]
    timestamp: Option<String>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct IpsBody {
    #[serde(default)]
    proc_path: Option<String>,
    #[serde(default)]
    proc_name: Option<String>,
}
/// `2026-11-20 10:10:10.00 +0100` → RFC 3339.
fn ips_time(value: &str) -> Option<String> {
    let (date_time, offset) = value.trim().rsplit_once(' ')?;
    let (date, clock) = date_time.split_once(' ')?;
    if offset.len() != 5 || !offset.starts_with(['+', '-']) {
        return None;
    }
    let candidate = format!("{date}T{clock}{}:{}", &offset[..3], &offset[3..]);
    OffsetDateTime::parse(&candidate, &Rfc3339)
        .ok()
        .map(|_| candidate)
}
/// Crash reports in the JSON `.ips` format (a header line, then the body) or
/// the older text format (`Process:` and `Path:` lines). Reports that are not
/// crashes of a process (jetsam, analytics) return `None`.
pub fn parse_crash_report(text: &str) -> Option<Crash> {
    let (first, rest) = text.split_once('\n').unwrap_or((text, ""));
    if let Ok(header) = serde_json::from_str::<IpsHeader>(first.trim()) {
        // 309: crash; 109/385: older crash types; 288 is a hang (stackshot).
        if !matches!(
            header.bug_type.as_deref(),
            Some("309") | Some("109") | Some("385")
        ) {
            return None;
        }
        let body: Option<IpsBody> = serde_json::from_str(rest.trim()).ok();
        let name = body
            .as_ref()
            .and_then(|b| b.proc_name.clone())
            .or(header.name)
            .or(header.app_name)?;
        return Some(Crash {
            name: bounded(&name, 200),
            path: body
                .and_then(|b| b.proc_path)
                .filter(|p| p.starts_with('/'))
                .map(|p| bounded(&p, 1024)),
            at: header.timestamp.as_deref().and_then(ips_time),
        });
    }
    let field = |key: &str| {
        text.lines()
            .take(80)
            .find_map(|l| l.strip_prefix(key))
            .map(|v| v.trim().to_string())
    };
    let name = field("Process:")?
        .split(" [")
        .next()
        .unwrap_or("")
        .to_string();
    (!name.is_empty()).then(|| Crash {
        name: bounded(&name, 200),
        path: field("Path:").filter(|p| p.starts_with('/')),
        at: None,
    })
}

/// Where an executable lives, judged by its folder.
#[derive(Debug, PartialEq, Eq)]
pub enum Location {
    /// The system, the developer image or an installed app.
    Expected,
    /// A folder no legitimate executable runs from (with a description).
    Suspicious(&'static str),
    /// A jailbreak's own folders: the iPhone's protections are off.
    Jailbreak,
    Unrecognised,
}
/// Where jailbreaks install their programs: rootless jailbreaks under a
/// `jb-` folder of the preboot volume (reached as `/var/jb`), rootful ones
/// as apps and a code injection framework.
const JAILBREAK: &[&str] = &[
    "/var/jb/",
    "/private/var/jb/",
    "/Applications/Cydia.app/",
    "/Applications/Sileo.app/",
    "/Applications/Zebra.app/",
    "/Library/MobileSubstrate/",
];
const EXPECTED: &[&str] = &[
    "/System/",
    "/usr/",
    "/sbin/",
    "/bin/",
    "/Applications/",
    "/Developer/",
    "/private/preboot/",
    "/private/var/run/com.apple.security.cryptexd/",
    "/private/var/containers/Bundle/",
    "/var/containers/Bundle/",
    "/private/var/staged_system_apps/",
    "/var/staged_system_apps/",
    // Apple's signed downloadable components, such as the update service
    // that runs during an iOS update.
    "/private/var/MobileAsset/",
    "/var/MobileAsset/",
    "/private/var/MobileSoftwareUpdate/",
];
const SUSPICIOUS: &[(&str, &str)] = &[
    ("/private/var/db/", "a system database folder"),
    ("/var/db/", "a system database folder"),
    ("/private/var/tmp/", "a temporary folder"),
    ("/var/tmp/", "a temporary folder"),
    ("/private/tmp/", "a temporary folder"),
    ("/tmp/", "a temporary folder"),
    ("/private/var/root/", "the system administrator's folder"),
    ("/var/root/", "the system administrator's folder"),
    ("/private/var/mobile/", "the user's data folder"),
    ("/var/mobile/", "the user's data folder"),
    ("/private/var/containers/Data/", "an app's data folder"),
    ("/private/var/containers/Shared/", "a shared data folder"),
];
pub fn location(path: &str) -> Location {
    if path.contains("/../") || path.contains("/./") {
        return Location::Suspicious("a disguised path");
    }
    if JAILBREAK.iter().any(|p| path.starts_with(p))
        || (path.starts_with("/private/preboot/") && path.contains("/jb-"))
    {
        return Location::Jailbreak;
    }
    if let Some((_, what)) = SUSPICIOUS.iter().find(|(p, _)| path.starts_with(p)) {
        return Location::Suspicious(what);
    }
    if EXPECTED.iter().any(|p| path.starts_with(p)) {
        Location::Expected
    } else {
        Location::Unrecognised
    }
}
/// Apple's sealed system volume (iOS 15 and later) and its signed images:
/// nothing outside Apple can place a program there. A program there sharing
/// a name with a spyware process is Apple's own (such as `BackupAgent`).
fn sealed(path: &str) -> bool {
    [
        "/System/",
        "/usr/",
        "/bin/",
        "/sbin/",
        "/Developer/",
        "/private/preboot/Cryptexes/",
    ]
    .iter()
    .any(|p| path.starts_with(p))
        || (path.starts_with("/Applications/") && location(path) == Location::Expected)
}
/// The executable of a `ps` command line, without its arguments. Bundled
/// programs are named after their bundle, which may contain spaces:
/// `.../Some App.app/Some App -arg`.
pub fn executable_of(command: &str) -> &str {
    for marker in [".app/", ".appex/", ".xpc/"] {
        let Some(at) = command.find(marker) else {
            continue;
        };
        let bundle = command[..at].rsplit('/').next().unwrap_or("");
        let rest = &command[at + marker.len()..];
        if !bundle.is_empty()
            && rest.starts_with(bundle)
            && rest[bundle.len()..]
                .chars()
                .next()
                .is_none_or(char::is_whitespace)
        {
            return &command[..at + marker.len() + bundle.len()];
        }
    }
    command.split_whitespace().next().unwrap_or(command)
}
/// Services that parse incoming iMessages and their attachments.
fn message_parser(name: &str) -> bool {
    name.contains("BlastDoor")
        || [
            "IMTranscoderAgent",
            "imagent",
            "IMDPersistenceAgent",
            "MessagesBlastDoorService",
        ]
        .contains(&name)
}
fn imitates_apple(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower.starts_with("com.apple")
        || (lower.len() >= 4
            && lower.ends_with('d')
            && lower.bytes().all(|c| c.is_ascii_lowercase()))
}
fn rfc3339(unix: i64) -> Option<String> {
    OffsetDateTime::from_unix_timestamp(unix)
        .ok()?
        .format(&Rfc3339)
        .ok()
}

#[derive(Deserialize, Default)]
struct StepStatus {
    #[serde(default)]
    status: String,
    #[serde(default)]
    files: Option<u64>,
    #[serde(default)]
    skipped: Option<u64>,
    #[serde(default)]
    archive: Option<String>,
    #[serde(default)]
    modified: Option<i64>,
}
#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct Status {
    #[serde(default)]
    crash_reports: StepStatus,
    #[serde(default)]
    sysdiagnose: StepStatus,
}
fn read_bounded(path: &Path, limit: u64) -> Option<String> {
    let meta = std::fs::symlink_metadata(path).ok()?;
    if !meta.is_file() || meta.len() > limit {
        return None;
    }
    std::fs::read(path)
        .ok()
        .map(|b| String::from_utf8_lossy(&b).into_owned())
}

/// One executable found in an unusual place, with where it was seen.
#[derive(Default)]
struct Sighting {
    reboots: Vec<Option<i64>>,
    crashes: Vec<Option<String>>,
    /// Listed among the processes running when the sysdiagnose was created.
    running: bool,
}
/// The commands of the processes in a sysdiagnose's `ps.txt` (the `ps`
/// output with a `COMMAND` column, which holds the executable's full path).
pub fn parse_process_list(text: &str) -> Vec<String> {
    let mut lines = text.lines();
    if !lines.by_ref().any(|line| line.contains("COMMAND")) {
        return Vec::new();
    }
    // The columns before the command (user, ids, times) never hold a '/',
    // so the command starts at the first one, wherever the columns align.
    lines
        .filter_map(|line| {
            let start = line.find(" /")? + 1;
            Some(line[start..].trim_end())
        })
        .take(10_000)
        .map(|command| bounded(command, 1024))
        .collect()
}

pub fn analyze(dir: &Path, rules: &VerifiedRules, report: &mut Report) {
    let Some(status) = read_bounded(&dir.join("status.json"), 64 * 1024)
        .and_then(|t| serde_json::from_str::<Status>(&t).ok())
    else {
        return;
    };
    let mut matches = Matches::new(rules);
    let mut places: BTreeMap<String, Sighting> = BTreeMap::new();
    // shutdown.log
    let shutdown = read_bounded(&dir.join("shutdown.log"), MAX_SHUTDOWN_BYTES);
    let mut shutdown_detail = String::new();
    if let Some(text) = &shutdown {
        let (entries, reboots) = parse_shutdown_log(text);
        let times: Vec<i64> = entries.iter().filter_map(|e| e.at).collect();
        for entry in &entries {
            let when = entry.at.and_then(rfc3339);
            let artifact = format!(
                "shutdown.log, process delaying a reboot{}",
                when.as_deref()
                    .map(|w| format!(" on {w}"))
                    .unwrap_or_default()
            );
            let name = entry.path.rsplit('/').next().unwrap_or("");
            matches.inspect(report, Kind::FilePath, &entry.path, &artifact, when.clone());
            if !sealed(&entry.path) {
                matches.inspect(report, Kind::ProcessName, name, &artifact, when.clone());
            }
            if location(&entry.path) != Location::Expected {
                places
                    .entry(entry.path.clone())
                    .or_default()
                    .reboots
                    .push(entry.at);
            }
        }
        let span = match (times.iter().min(), times.iter().max()) {
            (Some(a), Some(b)) => format!(
                " from {} to {}",
                rfc3339(*a).unwrap_or_default(),
                rfc3339(*b).unwrap_or_default()
            ),
            _ => String::new(),
        };
        shutdown_detail = format!(
            "{reboots} reboot record(s){span}; {} process(es) delayed a reboot. Each was checked against signed process and path indicators and for executables running from unusual folders (the method Kaspersky used to find Pegasus).",
            entries.len()
        );
    }
    // Processes running when the sysdiagnose was created: an active infection
    // shows here even if it never crashed or delayed a reboot.
    let running = read_bounded(&dir.join("ps.txt"), 8 * 1024 * 1024)
        .map(|text| parse_process_list(&text))
        .unwrap_or_default();
    let created = status.sysdiagnose.modified.and_then(rfc3339);
    for command in &running {
        let executable = executable_of(command);
        let name = executable.rsplit('/').next().unwrap_or("");
        let artifact = format!(
            "process running when the sysdiagnose was created{}",
            created
                .as_deref()
                .map(|w| format!(" on {w}"))
                .unwrap_or_default()
        );
        matches.inspect(
            report,
            Kind::FilePath,
            executable,
            &artifact,
            created.clone(),
        );
        if !sealed(executable) {
            matches.inspect(report, Kind::ProcessName, name, &artifact, created.clone());
        }
        // Only folders where code never runs, and jailbreaks: an unrecognised
        // but plausible system folder in a full process list would be noise.
        if matches!(
            location(executable),
            Location::Suspicious(_) | Location::Jailbreak
        ) {
            places.entry(executable.to_string()).or_default().running = true;
        }
    }
    if !running.is_empty() {
        report.check(
            "ios_running_processes",
            "completed",
            &format!(
                "{} process(es) were running when the sysdiagnose was created{}. Each was checked against signed process and path indicators and for executables running from unusual folders.",
                running.len(),
                created.as_deref().map(|w| format!(" on {w}")).unwrap_or_default()
            ),
        );
    }
    let sysdiagnose = &status.sysdiagnose;
    let archive = match (&sysdiagnose.archive, sysdiagnose.modified.and_then(rfc3339)) {
        (Some(a), Some(m)) => format!(" Source: {} (created {m}).", bounded(a, 120)),
        (Some(a), None) => format!(" Source: {}.", bounded(a, 120)),
        _ => String::new(),
    };
    let how = "To include it, press and release both volume buttons and the side button together (about one second, until a short vibration; do not hold them, which starts Emergency SOS), wait about 10 minutes and scan again.";
    match (sysdiagnose.status.as_str(), shutdown.is_some()) {
        ("completed", true) => report.check("ios_shutdown_log", "completed", &format!("{shutdown_detail}{archive}")),
        ("absent", _) => report.check("ios_shutdown_log", "skipped", &format!("The phone has no sysdiagnose, which holds the shutdown log of past reboots. {how}")),
        ("timeout", _) => report.check("ios_shutdown_log", "skipped", &format!("A sysdiagnose was still being generated when the scan ended. Scan again in a few minutes to include it.{archive}")),
        ("too_large", _) => report.check("ios_shutdown_log", "skipped", &format!("The newest sysdiagnose is too large for the free disk space; its shutdown log was not read.{archive}")),
        ("no_shutdown_log", _) => report.check("ios_shutdown_log", "skipped", &format!("The newest sysdiagnose has no shutdown log.{archive} {how}")),
        _ => report.check("ios_shutdown_log", "failed", "The sysdiagnose could not be read over USB. The shutdown log was not analysed."),
    }
    // Crash reports
    let mut crashes = Vec::new();
    let mut unreadable = 0;
    if status.crash_reports.status == "completed" {
        let files: Vec<PathBuf> = walkdir::WalkDir::new(dir.join("crash"))
            .follow_links(false)
            .max_depth(6)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_file())
            .map(|e| e.into_path())
            .take(MAX_REPORTS)
            .collect();
        for file in files {
            let name = file
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default();
            match read_bounded(&file, MAX_REPORT_BYTES)
                .as_deref()
                .map(parse_crash_report)
            {
                Some(Some(crash)) => crashes.push((bounded(&name, 200), crash)),
                Some(None) => {}
                None => unreadable += 1,
            }
        }
    }
    let mut parser_crashes: Vec<(String, String)> = Vec::new();
    for (file, crash) in &crashes {
        let artifact = format!("crash report {file}");
        if !crash.path.as_deref().is_some_and(sealed) {
            matches.inspect(
                report,
                Kind::ProcessName,
                &crash.name,
                &artifact,
                crash.at.clone(),
            );
        }
        if let Some(path) = &crash.path {
            matches.inspect(report, Kind::FilePath, path, &artifact, crash.at.clone());
            if location(path) != Location::Expected {
                places
                    .entry(path.clone())
                    .or_default()
                    .crashes
                    .push(crash.at.clone());
            }
        }
        if message_parser(&crash.name) {
            if let Some(at) = &crash.at {
                parser_crashes.push((at.clone(), crash.name.clone()));
            }
        }
    }
    // Executables outside the system and installed apps.
    let mut detections = 0;
    let mut jailbroken: Vec<(&String, Option<String>)> = Vec::new();
    for (path, seen) in &places {
        if report.findings.len() >= 500 {
            break;
        }
        let name = path.rsplit('/').next().unwrap_or("");
        let mut facts = Vec::new();
        if !seen.reboots.is_empty() {
            let mut dates: Vec<String> = seen
                .reboots
                .iter()
                .flatten()
                .filter_map(|t| rfc3339(*t))
                .collect();
            dates.sort();
            dates.dedup();
            facts.push(format!(
                "delayed {} reboot(s) in shutdown.log{}",
                seen.reboots.len(),
                if dates.is_empty() {
                    String::new()
                } else {
                    format!(
                        " ({})",
                        dates.iter().take(5).cloned().collect::<Vec<_>>().join(", ")
                    )
                }
            ));
        }
        if !seen.crashes.is_empty() {
            facts.push(format!("crashed {} time(s)", seen.crashes.len()));
        }
        if seen.running {
            facts.push("was running when the sysdiagnose was created".into());
        }
        if imitates_apple(name) {
            facts.push("its name imitates an Apple system service".into());
        }
        let last = seen
            .reboots
            .iter()
            .flatten()
            .filter_map(|t| rfc3339(*t))
            .chain(seen.crashes.iter().flatten().cloned())
            .chain(seen.running.then(|| created.clone()).flatten())
            .max();
        let item = match location(path) {
            // One finding for the phone, below.
            Location::Jailbreak => {
                jailbroken.push((path, last));
                continue;
            }
            Location::Suspicious(what) => {
                detections += 1;
                finding(
                    "enigm.behavior.ios_process_unusual_location",
                    "ios_unusual_process",
                    "high",
                    "medium",
                    &format!("{path}: an executable ran from {what}, where iOS and App Store apps never run code; {}", facts.join("; ")),
                    last,
                    "Behavioural detection: no published indicator names this process. Pegasus ran from such folders; jailbreak tools can too. A jailbroken phone also loses the protections that keep spyware out.",
                    "Do not reset or update the phone yet: preserve the report and contact a qualified incident responder or a support organisation for people targeted by surveillance. A reboot interrupts most mercenary spyware but does not remove the means of reinfection.",
                )
            }
            _ => finding(
                "enigm.heuristic.ios_unrecognised_process_location",
                "ios_unrecognised_process",
                "medium",
                "low",
                &format!("{path}: an executable ran from a folder this analysis does not recognise; {}", facts.join("; ")),
                last,
                "Review point: new iOS versions may use folders this analysis does not know yet. It is not, on its own, a sign of infection.",
                "Ask an expert to review the process if you cannot identify it.",
            ),
        };
        report.findings.push(item);
    }
    // A jailbreak turns off the protections that keep spyware out, and
    // stalkerware for iPhone that reads messages needs one.
    if !jailbroken.is_empty() && report.findings.len() < 500 {
        let paths: Vec<&str> = jailbroken.iter().take(5).map(|(p, _)| p.as_str()).collect();
        report.findings.push(finding(
            "enigm.heuristic.ios_jailbreak",
            "ios_system_integrity",
            "high",
            "medium",
            &format!(
                "System integrity: the iPhone is jailbroken: programs ran from a jailbreak's folders ({})",
                paths.join(", ")
            ),
            jailbroken.iter().filter_map(|(_, at)| at.clone()).max(),
            "Review point: jailbreaking an iPhone is sometimes done by its owner. It also removes the protections that keep spyware out and lets it hide from scans like this one.",
            "If you did not modify this phone, treat it as compromised: stop using it for sensitive communication and have it examined by an expert.",
        ));
    }
    // Repeated crashes of the iMessage parsers within one hour.
    parser_crashes.sort();
    let mut clusters: Vec<Vec<(String, String)>> = Vec::new();
    for crash in parser_crashes {
        let time = OffsetDateTime::parse(&crash.0, &Rfc3339)
            .map(|t| t.unix_timestamp())
            .ok();
        match clusters.last_mut() {
            Some(cluster)
                if time
                    .zip(
                        OffsetDateTime::parse(&cluster[0].0, &Rfc3339)
                            .ok()
                            .map(|t| t.unix_timestamp()),
                    )
                    .is_some_and(|(t, start)| t - start <= 3600) =>
            {
                cluster.push(crash)
            }
            _ => clusters.push(vec![crash]),
        }
    }
    for cluster in clusters.iter().filter(|c| c.len() >= 2).take(10) {
        if report.findings.len() >= 500 {
            break;
        }
        let mut names: Vec<&str> = cluster.iter().map(|(_, n)| n.as_str()).collect();
        names.sort();
        names.dedup();
        report.findings.push(finding(
            "enigm.heuristic.ios_message_parser_crashes",
            "ios_message_parser_crashes",
            "medium",
            "low",
            &format!(
                "{} crashes of the services that process incoming iMessages ({}) between {} and {}",
                cluster.len(),
                names.join(", "),
                cluster[0].0,
                cluster[cluster.len() - 1].0
            ),
            Some(cluster[cluster.len() - 1].0.clone()),
            "Review point: zero-click exploits such as FORCEDENTRY and BLASTPASS were delivered through these services, and failed attempts crash them. Malformed but harmless messages can crash them too.",
            "Note who wrote to you around those times. If you are at risk of targeted surveillance, enable Lockdown Mode and ask an expert to review the phone.",
        ));
    }
    match status.crash_reports.status.as_str() {
        "completed" => {
            let dates: Vec<&String> = crashes.iter().filter_map(|(_, c)| c.at.as_ref()).collect();
            let span = match (dates.iter().min(), dates.iter().max()) {
                (Some(a), Some(b)) => format!(" from {a} to {b}"),
                _ => String::new(),
            };
            report.check("ios_crash_reports", "completed", &format!(
                "{} crash report(s){span} read over USB ({} other diagnostic reports, {} unreadable, {} not copied because of size limits). Crashed process names and paths were checked against signed indicators and for unusual locations; {detections} executable(s) ran from folders where code never runs. The phone keeps crash reports for a limited time.",
                crashes.len(),
                status.crash_reports.files.unwrap_or(0).saturating_sub(crashes.len() as u64 + unreadable),
                unreadable,
                status.crash_reports.skipped.unwrap_or(0)
            ));
        }
        _ => report.check(
            "ios_crash_reports",
            "failed",
            "Crash reports could not be read over USB.",
        ),
    }
    if matches.truncated {
        report.check(
            "ios_diagnostics_finding_limit",
            "skipped",
            "Finding limit reached; process traces are incomplete.",
        );
    }
}
// Every field of a finding, in the order the report shows them.
#[allow(clippy::too_many_arguments)]
fn finding(
    rule: &str,
    category: &str,
    severity: &str,
    confidence: &str,
    evidence: &str,
    timestamp: Option<String>,
    limitation: &str,
    recommendation: &str,
) -> Finding {
    let digest = Sha256::digest(format!("{rule}\0{evidence}").as_bytes());
    Finding {
        id: format!("ios.{}", crate::hex(&digest))[..44].into(),
        category: category.into(),
        source: "https://github.com/enigm-llc/enigm-scan".into(),
        evidence: bounded(evidence, 1800),
        severity: severity.into(),
        confidence: confidence.into(),
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
    // Shape of the shutdown log in sysdiagnose archives (iOS 15-18).
    const SHUTDOWN: &str = "\
remaining client pid: 1023 (/usr/libexec/backboardd)
remaining client pid: 1450 (/private/var/containers/Bundle/Application/3F2B/WhatsApp.app/WhatsApp)
After 1.12s, these clients are still here:
remaining client pid: 1023 (/usr/libexec/backboardd)
SIGTERM: [1731150000]
remaining client pid: 812 (/private/var/db/com.apple.xpc.roleaccountd.staging/rolexd)
remaining client pid: 99 (/System/Library/PrivateFrameworks/X.framework/xd)
SIGTERM: [1732000000]
remaining client pid: 812 (/private/var/db/com.apple.xpc.roleaccountd.staging/rolexd)
SIGTERM: [1732600000]
";
    fn rules() -> VerifiedRules {
        let (bytes, key) = crate::rules::tests::fixture(1000);
        VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap()
    }
    fn write(
        dir: &Path,
        status: serde_json::Value,
        shutdown: Option<&str>,
        crashes: &[(&str, &str)],
    ) {
        std::fs::write(dir.join("status.json"), status.to_string()).unwrap();
        if let Some(text) = shutdown {
            std::fs::write(dir.join("shutdown.log"), text).unwrap();
        }
        std::fs::create_dir_all(dir.join("crash/Retired")).unwrap();
        for (name, text) in crashes {
            std::fs::write(dir.join("crash").join(name), text).unwrap();
        }
    }
    fn ips(name: &str, path: &str, at: &str) -> String {
        format!(
            "{{\"app_name\":\"{name}\",\"timestamp\":\"{at}\",\"bug_type\":\"309\",\"name\":\"{name}\"}}\n{{\"procName\":\"{name}\",\"procPath\":\"{path}\",\"exception\":{{\"type\":\"EXC_BAD_ACCESS\"}}}}"
        )
    }

    #[test]
    fn parses_shutdown_log_reboots_and_crash_reports() {
        let (entries, reboots) = parse_shutdown_log(SHUTDOWN);
        assert_eq!(reboots, 3);
        assert_eq!(entries.len(), 5);
        assert_eq!(
            entries[2].path,
            "/private/var/db/com.apple.xpc.roleaccountd.staging/rolexd"
        );
        assert_eq!(entries[2].at, Some(1732000000));
        let crash = parse_crash_report(&ips(
            "IMTranscoderAgent",
            "/System/Library/X/IMTranscoderAgent",
            "2026-11-20 10:10:10.00 +0100",
        ))
        .unwrap();
        assert_eq!(crash.name, "IMTranscoderAgent");
        assert_eq!(crash.at.as_deref(), Some("2026-11-20T10:10:10.00+01:00"));
        assert_eq!(
            parse_crash_report("{\"bug_type\":\"298\",\"name\":\"JetsamEvent\"}\n{}"),
            None
        );
        let legacy = parse_crash_report("Incident Identifier: X\nProcess:         bh [123]\nPath:            /private/var/tmp/bh\n").unwrap();
        assert_eq!(
            (legacy.name.as_str(), legacy.path.as_deref()),
            ("bh", Some("/private/var/tmp/bh"))
        );
        assert_eq!(location("/usr/libexec/backboardd"), Location::Expected);
        assert_eq!(
            location("/private/var/containers/Bundle/Application/A/X.app/X"),
            Location::Expected
        );
        assert_eq!(
            location("/private/var/db/x/rolexd"),
            Location::Suspicious("a system database folder")
        );
        assert_eq!(
            location("/System/../private/var/tmp/x"),
            Location::Suspicious("a disguised path")
        );
        assert_eq!(location("/Library/Unknown/x"), Location::Unrecognised);
        assert_eq!(location("/var/jb/usr/bin/sshd"), Location::Jailbreak);
        assert_eq!(
            location("/private/var/MobileAsset/AssetsV2/com_apple_MobileAsset_MobileSoftwareUpdate_UpdateBrain/a.asset/AssetData/com.apple.MobileSoftwareUpdate.UpdateBrainService.xpc/com.apple.MobileSoftwareUpdate.UpdateBrainService"),
            Location::Expected
        );
        assert_eq!(
            location("/private/preboot/AB12/jb-x1Y2/procursus/usr/libexec/x"),
            Location::Jailbreak
        );
        assert_eq!(
            location("/Applications/Sileo.app/Sileo"),
            Location::Jailbreak
        );
        assert_eq!(
            location("/private/preboot/Cryptexes/OS/usr/libexec/x"),
            Location::Expected
        );
        // Arguments never change where the program lives.
        assert_eq!(
            executable_of(
                "/private/var/containers/Bundle/Application/A/Some App.app/Some App -arg /../x"
            ),
            "/private/var/containers/Bundle/Application/A/Some App.app/Some App"
        );
        assert_eq!(
            executable_of("/usr/libexec/xpcproxy com.apple.x /private/var/db/y"),
            "/usr/libexec/xpcproxy"
        );
        assert!(sealed(
            "/System/Library/PrivateFrameworks/MobileBackup.framework/BackupAgent"
        ));
        assert!(!sealed("/private/var/tmp/BackupAgent"));
        assert!(!sealed("/Applications/Cydia.app/Cydia"));
    }
    #[test]
    fn executables_in_unusual_folders_are_detected_from_shutdown_log_and_crashes() {
        let dir = tempfile::tempdir().unwrap();
        write(
            dir.path(),
            serde_json::json!({"crashReports": {"status": "completed", "files": 3, "skipped": 0}, "sysdiagnose": {"status": "completed", "archive": "sysdiagnose_2026.11.24.tar.gz", "modified": 1732600000}}),
            Some(SHUTDOWN),
            &[
                (
                    "bh-2026-11-20-101010.ips",
                    &ips("bh", "/private/var/tmp/bh", "2026-11-20 10:10:10.00 +0100"),
                ),
                (
                    "WebContent-2026-11-20.ips",
                    &ips(
                        "com.apple.WebKit.WebContent",
                        "/System/Library/Frameworks/WebKit.framework/XPCServices/WebContent",
                        "2026-11-20 11:00:00.00 +0100",
                    ),
                ),
                ("JetsamEvent-2026-11-20.ips", "{\"bug_type\":\"298\"}\n{}"),
            ],
        );
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &rules(), &mut report);
        let detected: Vec<_> = report
            .findings
            .iter()
            .filter(|f| f.rule == "enigm.behavior.ios_process_unusual_location")
            .collect();
        assert_eq!(detected.len(), 2);
        let pegasus_like = detected
            .iter()
            .find(|f| f.evidence.contains("rolexd"))
            .unwrap();
        assert!(
            pegasus_like.evidence.contains(
                "delayed 2 reboot(s) in shutdown.log (2024-11-19T07:06:40Z, 2024-11-26T05:46:40Z)"
            ),
            "{}",
            pegasus_like.evidence
        );
        assert!(pegasus_like
            .evidence
            .contains("imitates an Apple system service"));
        assert_eq!(
            pegasus_like.timestamp.as_deref(),
            Some("2024-11-26T05:46:40Z")
        );
        assert!(detected
            .iter()
            .any(|f| f.evidence.starts_with("/private/var/tmp/bh")
                && f.evidence.contains("crashed 1 time(s)")));
        assert!(!report
            .findings
            .iter()
            .any(|f| f.evidence.contains("WhatsApp") || f.evidence.contains("backboardd")));
        let shutdown = report
            .checks
            .iter()
            .find(|c| c.id == "ios_shutdown_log")
            .unwrap();
        assert_eq!(shutdown.status, "completed");
        assert!(shutdown.detail.starts_with("3 reboot record(s) from 2024-11-09T11:00:00Z to 2024-11-26T05:46:40Z; 5 process(es)"), "{}", shutdown.detail);
        let crashes = report
            .checks
            .iter()
            .find(|c| c.id == "ios_crash_reports")
            .unwrap();
        assert!(crashes.detail.starts_with("2 crash report(s) from 2026-11-20T10:10:10.00+01:00 to 2026-11-20T11:00:00.00+01:00 read over USB (1 other"), "{}", crashes.detail);
    }
    #[test]
    fn processes_running_from_unusual_folders_are_detected_from_the_process_list() {
        let ps = "USER  UID  PID  PPID %CPU STARTED      TIME COMMAND
root    0    1     0  0.0 9:00AM   0:01.00 /sbin/launchd
mobile 501  300     1  0.0 9:00AM   0:00.10 /usr/libexec/backboardd
mobile 501  412     1  0.0 9:01AM   0:00.02 /private/var/containers/Bundle/Application/AB12/Some App.app/Some App -launchedBy x
root    0  666     1  0.0 9:02AM   0:00.01 /private/var/db/com.apple.xpc.roleaccountd.staging/msgacntd --daemon
mobile 501  700     1  0.0 9:03AM   0:00.01 /Library/Unknown/helper
root    0  800     1  0.0 9:04AM   0:00.01 /var/jb/usr/sbin/sshd -D
root    0    0     0  0.0 9:00AM   0:10.00 (kernel_task)
";
        let dir = tempfile::tempdir().unwrap();
        write(
            dir.path(),
            serde_json::json!({"crashReports": {"status": "completed", "files": 0, "skipped": 0}, "sysdiagnose": {"status": "completed", "archive": "sysdiagnose_2026.11.24.tar.gz", "modified": 1732600000}}),
            None,
            &[],
        );
        std::fs::write(dir.path().join("ps.txt"), ps).unwrap();
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &rules(), &mut report);
        let unusual: Vec<_> = report
            .findings
            .iter()
            .filter(|f| f.category == "ios_unusual_process")
            .collect();
        // Only the process in a folder where code never runs; an unknown but
        // plausible folder in a full process list is not reported.
        assert_eq!(unusual.len(), 1);
        assert!(unusual[0].evidence.starts_with(
            "/private/var/db/com.apple.xpc.roleaccountd.staging/msgacntd: an executable ran from a system database folder"
        ));
        assert!(unusual[0]
            .evidence
            .contains("was running when the sysdiagnose was created"));
        assert!(!report
            .findings
            .iter()
            .any(|f| f.category == "ios_unrecognised_process"));
        let check = report
            .checks
            .iter()
            .find(|c| c.id == "ios_running_processes")
            .unwrap();
        assert!(check.detail.starts_with("6 process(es) were running when the sysdiagnose was created on 2024-11-26T05:46:40Z"), "{}", check.detail);
        // A jailbreak: one finding for the phone, not one per program.
        let jailbreak: Vec<_> = report
            .findings
            .iter()
            .filter(|f| f.category == "ios_system_integrity")
            .collect();
        assert_eq!(jailbreak.len(), 1);
        assert_eq!(
            jailbreak[0].evidence,
            "System integrity: the iPhone is jailbroken: programs ran from a jailbreak's folders (/var/jb/usr/sbin/sshd)"
        );
    }
    #[test]
    fn repeated_imessage_parser_crashes_within_an_hour_are_a_review_point() {
        let dir = tempfile::tempdir().unwrap();
        write(
            dir.path(),
            serde_json::json!({"crashReports": {"status": "completed", "files": 3}, "sysdiagnose": {"status": "absent"}}),
            None,
            &[
                ("a.ips", &ips("MessagesBlastDoorService", "/System/Library/PrivateFrameworks/MessagesBlastDoorSupport.framework/XPCServices/MessagesBlastDoorService.xpc/MessagesBlastDoorService", "2026-11-20 10:00:00.00 +0000")),
                ("b.ips", &ips("IMTranscoderAgent", "/System/Library/PrivateFrameworks/IMTranscoding.framework/IMTranscoderAgent.app/IMTranscoderAgent", "2026-11-20 10:40:00.00 +0000")),
                ("c.ips", &ips("IMTranscoderAgent", "/System/Library/PrivateFrameworks/IMTranscoding.framework/IMTranscoderAgent.app/IMTranscoderAgent", "2026-11-22 09:00:00.00 +0000")),
            ],
        );
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &rules(), &mut report);
        assert_eq!(report.findings.len(), 1);
        let f = &report.findings[0];
        assert_eq!(f.rule, "enigm.heuristic.ios_message_parser_crashes");
        assert!(f.evidence.starts_with("2 crashes of the services that process incoming iMessages (IMTranscoderAgent, MessagesBlastDoorService)"));
        let shutdown = report
            .checks
            .iter()
            .find(|c| c.id == "ios_shutdown_log")
            .unwrap();
        assert_eq!(shutdown.status, "skipped");
        assert!(shutdown.detail.contains("do not hold them"));
    }
    #[test]
    fn signed_process_and_path_indicators_match_and_missing_data_adds_nothing() {
        let dir = tempfile::tempdir().unwrap();
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &rules(), &mut report);
        assert!(report.findings.is_empty() && report.checks.is_empty());
        // Real Pegasus process name from the signed bundle.
        let bytes = include_bytes!("../../../src-tauri/resources/intelligence/bundle-v2.json");
        let key = include_bytes!("../../../src-tauri/resources/intelligence/public-key.bin");
        let release: serde_json::Value =
            serde_json::from_slice(include_bytes!("../../../intelligence/release.json")).unwrap();
        let signed =
            VerifiedRules::verify(bytes, key, release["issuedAt"].as_i64().unwrap(), 1).unwrap();
        let process = signed
            .rules()
            .iter()
            .find(|r| r.kind == Kind::ProcessName && r.value == "roleaccountd")
            .unwrap();
        write(
            dir.path(),
            serde_json::json!({"crashReports": {"status": "failed"}, "sysdiagnose": {"status": "completed"}}),
            Some("remaining client pid: 5 (/usr/libexec/roleaccountd)\nSIGTERM: [1732000000]\n"),
            &[],
        );
        // On Apple's sealed system volume the name is Apple's own program.
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &signed, &mut report);
        assert!(!report.findings.iter().any(|f| f.rule == process.id));
        // Where Pegasus ran it.
        write(
            dir.path(),
            serde_json::json!({"crashReports": {"status": "failed"}, "sysdiagnose": {"status": "completed"}}),
            Some("remaining client pid: 5 (/private/var/db/com.apple.xpc.roleaccountd.staging/roleaccountd)\nSIGTERM: [1732000000]\n"),
            &[],
        );
        let mut report = Report::new("ios", 1);
        analyze(dir.path(), &signed, &mut report);
        let hit = report
            .findings
            .iter()
            .find(|f| f.rule == process.id)
            .unwrap();
        assert!(hit.evidence.starts_with(
            "shutdown.log, process delaying a reboot on 2024-11-19T07:06:40Z: roleaccountd"
        ));
        assert!(hit.evidence.contains("— Pegasus"), "{}", hit.evidence);
        assert_eq!(
            report
                .checks
                .iter()
                .find(|c| c.id == "ios_crash_reports")
                .unwrap()
                .status,
            "failed"
        );
    }
}
