//! Behavioural analysis of an Android inventory: finds apps that act like
//! spyware or stalkerware even when no published indicator names them.
//!
//! Commercial stalkerware and government spyware for Android share the same
//! tradecraft, documented across public research (Lookout, ESET, Amnesty,
//! Citizen Lab, Google TAG, Echap): installed from an APK file instead of a
//! store, an icon hidden from the launcher or a name that imitates a system
//! component, and the privileged Android channels that expose the owner's
//! life: accessibility (reads the screen and keystrokes), notification access
//! (reads messages and codes), device administration (blocks removal), a
//! keyboard (keystrokes), the default SMS app, an always-on VPN (all traffic),
//! plus microphone, camera, location, SMS, call log and contacts permissions.
//!
//! Every conclusion is a deterministic combination of observed facts and is
//! reported with those facts. Nothing here is a probability, and an app that
//! passes these checks is not proven safe.
use crate::{
    android::{Inventory, Package},
    model::{bounded, Finding, Report},
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};

/// Recent use of the microphone or camera while the app was not on screen.
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppOp {
    pub package: String,
    /// Android operation name, e.g. `RECORD_AUDIO` or `CAMERA`.
    pub op: String,
    /// Seconds since the last access, as reported by the phone.
    pub seconds_ago: u64,
    /// Process state of the last access (`top`, `fgsvc`, `bg`, `cch`...);
    /// `None` when the Android version does not report it.
    pub state: Option<String>,
}

/// Runtime permissions that expose the owner. Install-time permissions are
/// granted to every app that asks and say little.
pub const SENSITIVE_PERMISSIONS: &[(&str, &str)] = &[
    ("RECORD_AUDIO", "microphone"),
    ("CAMERA", "camera"),
    ("ACCESS_FINE_LOCATION", "precise location"),
    ("ACCESS_BACKGROUND_LOCATION", "background location"),
    ("READ_SMS", "SMS"),
    ("RECEIVE_SMS", "SMS"),
    ("SEND_SMS", "SMS"),
    ("RECEIVE_MMS", "SMS"),
    ("READ_CALL_LOG", "call log"),
    ("PROCESS_OUTGOING_CALLS", "call log"),
    ("READ_CONTACTS", "contacts"),
];
/// Operations queried with `dumpsys appops --op`: microphone, camera and
/// location, the three things stalkerware follows while out of sight.
pub const WATCHED_OPS: &[&str] = &["RECORD_AUDIO", "CAMERA", "FINE_LOCATION", "COARSE_LOCATION"];
/// Window in which an access counts as recent.
const RECENT: u64 = 14 * 86400;

/// Namespaces of Android and of the main manufacturers. Outside the system
/// image and the stores, an app using them imitates a system component.
const SYSTEM_NAMESPACES: &[&str] = &[
    "android.",
    "com.android.",
    "com.google.android.",
    "com.samsung.",
    "com.sec.android.",
    "com.qualcomm.",
    "com.qti.",
    "com.mediatek.",
    "com.huawei.",
    "com.hihonor.",
    "com.miui.",
    "com.xiaomi.",
    "com.coloros.",
    "com.oplus.",
    "com.oppo.",
    "com.heytap.",
    "com.oneplus.",
    "com.motorola.",
    "com.lge.",
    "com.sony.",
    "com.sonyericsson.",
    "com.htc.",
    "com.asus.",
    "com.nothing.",
    "com.vivo.",
    "com.bbk.",
    "com.transsion.",
    "com.zte.",
    "com.realme.",
];
/// Words stalkerware uses to pass as a system service.
const DISGUISE_WORDS: &[&str] = &[
    "system",
    "systemui",
    "service",
    "services",
    "update",
    "updater",
    "sync",
    "security",
    "framework",
    "core",
    "settings",
    "wifi",
    "battery",
    "device",
    "manager",
];
/// Words that announce monitoring.
const MONITORING_WORDS: &[&str] = &[
    "spy",
    "spyware",
    "track",
    "tracker",
    "tracking",
    "monitor",
    "monitoring",
    "keylog",
    "keylogger",
    "stealth",
    "hidden",
    "spyapp",
    "spyphone",
];
/// Real Google components that people install by hand on phones sold without
/// them (Huawei, some Chinese models). They are reported for review, never as
/// spyware behaviour, because their behaviour is that of the system.
const KNOWN_MANUAL_SYSTEM: &[&str] = &[
    "com.google.android.gms",
    "com.google.android.gsf",
    "com.google.android.gsf.login",
    "com.android.vending",
    "com.google.android.syncadapters.contacts",
    "com.google.android.syncadapters.calendar",
];

fn component_package(component: &str) -> Option<&str> {
    let (package, class) = component.trim().split_once('/')?;
    valid_package(package)
        .then_some(package)
        .filter(|_| !class.is_empty())
}
fn valid_package(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 255
        && id.contains('.')
        && id
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'.' || c == b'_')
}
/// `settings get secure enabled_accessibility_services` and similar values:
/// `pkg/cls:pkg/cls`, with `;subtype` suffixes for input methods.
pub fn parse_components(value: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for item in value.split(':') {
        let item = item.split(';').next().unwrap_or("").trim();
        if component_package(item).is_some() && item.len() <= 512 && !out.iter().any(|c| c == item)
        {
            out.push(item.to_string());
        }
        if out.len() >= 200 {
            break;
        }
    }
    out
}
/// Output of a shell loop printing `key=value` per secure setting.
pub fn parse_settings(text: &str) -> BTreeMap<String, String> {
    text.lines()
        .filter_map(|line| line.split_once('='))
        .map(|(k, v)| (k.trim().to_string(), v.trim().to_string()))
        .filter(|(k, v)| {
            !k.is_empty()
                && k.len() <= 64
                && k.bytes().all(|c| c.is_ascii_lowercase() || c == b'_')
                && !v.is_empty()
                && v != "null"
                && v.len() <= 4096
        })
        .collect()
}
/// `dumpsys device_policy`: active administrators of every user, and the
/// device or profile owner.
pub fn parse_device_admins(text: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut in_admins = false;
    let push = |component: &str, out: &mut Vec<String>| {
        if component_package(component).is_some()
            && component.len() <= 512
            && !out.iter().any(|c| c == component)
            && out.len() < 100
        {
            out.push(component.to_string());
        }
    };
    for line in text.lines() {
        let indent = line.len() - line.trim_start().len();
        let trimmed = line.trim();
        if trimmed.starts_with("Enabled Device Admins") {
            in_admins = true;
            continue;
        }
        if in_admins && indent <= 2 && !trimmed.is_empty() {
            in_admins = false;
        }
        if let Some(rest) = trimmed.split("admin=ComponentInfo{").nth(1) {
            if let Some(component) = rest.split('}').next() {
                push(component, &mut out);
            }
        } else if in_admins {
            if let Some(component) = trimmed.strip_suffix(':') {
                push(component, &mut out);
            }
        }
    }
    out
}
/// `cmd package query-activities ... LAUNCHER`: packages that show an icon.
/// `None` when the command is not supported, so hidden icons are not claimed.
pub fn parse_launchable(text: &str) -> Option<Vec<String>> {
    if !text.contains("activities found") && !text.contains("activity found") {
        return None;
    }
    let mut out: BTreeSet<String> = BTreeSet::new();
    for line in text.lines() {
        let token = line.trim();
        if let Some(package) = component_package(token) {
            if !token.contains(char::is_whitespace) {
                out.insert(package.to_string());
            }
        }
    }
    Some(out.into_iter().collect())
}
/// `dumpsys package packages` filtered to package headers, install times and
/// granted sensitive permissions. Returns permissions per package.
pub fn parse_package_grants(text: &str) -> BTreeMap<String, (BTreeSet<String>, Option<String>)> {
    let mut out: BTreeMap<String, (BTreeSet<String>, Option<String>)> = BTreeMap::new();
    let mut current: Option<String> = None;
    for line in text.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("Package [") {
            current = rest
                .split(']')
                .next()
                .filter(|id| valid_package(id))
                .map(str::to_owned);
            if let Some(id) = &current {
                if out.len() < 4000 {
                    out.entry(id.clone()).or_default();
                }
            }
            continue;
        }
        let Some(entry) = current.as_ref().and_then(|id| out.get_mut(id)) else {
            continue;
        };
        if let Some(time) = trimmed.strip_prefix("firstInstallTime=") {
            if entry.1.is_none() && time.len() <= 40 {
                entry.1 = Some(time.to_string());
            }
        } else if let Some((name, state)) = trimmed.split_once(": granted=") {
            let short = name.rsplit('.').next().unwrap_or(name);
            if state.starts_with("true") && SENSITIVE_PERMISSIONS.iter().any(|(p, _)| *p == short) {
                entry.0.insert(short.to_string());
            }
        }
    }
    out
}
/// Durations such as `4d23h1m`, `12h3m2s125ms` or `0ms`.
fn parse_duration(text: &str) -> Option<u64> {
    let mut total = 0u64;
    let mut number = String::new();
    let mut chars = text.chars().peekable();
    let mut any = false;
    while let Some(c) = chars.next() {
        if c.is_ascii_digit() {
            number.push(c);
            continue;
        }
        let value: u64 = number.parse().ok()?;
        number.clear();
        let seconds = match c {
            'd' => value * 86400,
            'h' => value * 3600,
            'm' if chars.peek() == Some(&'s') => {
                chars.next();
                0
            }
            'm' => value * 60,
            's' => value,
            _ => return None,
        };
        total = total.saturating_add(seconds);
        any = true;
    }
    (any && number.is_empty()).then_some(total)
}
/// Output of `dumpsys appops --op <OP>` for each watched operation, separated
/// by `#op <OP>` lines. Handles the per-state `Access:` format (Android 11+)
/// and the older single-line `time=+... ago` format.
pub fn parse_app_ops(text: &str) -> Vec<AppOp> {
    let mut out: Vec<AppOp> = Vec::new();
    let mut package: Option<String> = None;
    let mut op: Option<String> = None;
    let record =
        |package: &str, op: &str, seconds: u64, state: Option<String>, out: &mut Vec<AppOp>| {
            if let Some(existing) = out.iter_mut().find(|o| o.package == package && o.op == op) {
                if seconds < existing.seconds_ago {
                    existing.seconds_ago = seconds;
                    existing.state = state;
                }
            } else if out.len() < 2000 {
                out.push(AppOp {
                    package: package.into(),
                    op: op.into(),
                    seconds_ago: seconds,
                    state,
                });
            }
        };
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("#op ") || trimmed.starts_with("Uid ") {
            package = None;
            op = None;
            continue;
        }
        if let Some(rest) = trimmed.strip_prefix("Package ") {
            package = rest
                .trim_end_matches(':')
                .split_whitespace()
                .next()
                .filter(|id| valid_package(id))
                .map(str::to_owned);
            op = None;
            continue;
        }
        let Some(pkg) = package.clone() else { continue };
        if trimmed.starts_with("Access: [") {
            // Handled below with the current operation.
        } else if let Some((name, rest)) = trimmed.split_once(" (") {
            if WATCHED_OPS.contains(&name) {
                op = Some(name.to_string());
                if let Some(time) = rest.split("time=+").nth(1) {
                    if let Some(seconds) = time.split_whitespace().next().and_then(parse_duration) {
                        record(&pkg, name, seconds, None, &mut out);
                    }
                }
            } else if name.bytes().all(|c| c.is_ascii_uppercase() || c == b'_') {
                op = None;
            }
            continue;
        }
        let Some(current) = op.clone() else { continue };
        if let Some(rest) = trimmed.strip_prefix("Access: [") {
            let state = rest
                .split(']')
                .next()
                .and_then(|s| s.split('-').next())
                .filter(|s| {
                    !s.is_empty() && s.len() <= 12 && s.bytes().all(|c| c.is_ascii_lowercase())
                })
                .map(str::to_owned);
            let ago = rest
                .split("(-")
                .nth(1)
                .and_then(|r| r.split(')').next())
                .and_then(parse_duration);
            if let Some(seconds) = ago {
                record(&pkg, &current, seconds, state, &mut out);
            }
        }
    }
    out
}
/// System properties that describe the integrity of the Android build.
pub const INTEGRITY_PROPERTIES: &[&str] = &[
    "ro.debuggable",
    "ro.secure",
    "ro.adb.secure",
    "ro.build.tags",
    "ro.build.type",
    "ro.boot.verifiedbootstate",
    "ro.boot.flash.locked",
    "ro.boot.vbmeta.device_state",
    "ro.build.version.release",
];
/// `getprop` output (`[key]: [value]`), restricted to integrity properties.
pub fn parse_properties(text: &str) -> BTreeMap<String, String> {
    text.lines()
        .filter_map(|line| {
            let (key, value) = line.trim().split_once("]: [")?;
            let key = key.strip_prefix('[')?;
            let value = value.strip_suffix(']')?;
            (INTEGRITY_PROPERTIES.contains(&key) && value.len() <= 128)
                .then(|| (key.to_string(), value.to_string()))
        })
        .collect()
}
/// Superuser binaries probed with `ls`; only absolute paths ending in `su`
/// or `magisk` are kept.
pub fn parse_su_paths(text: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for line in text.lines() {
        let path = line.trim();
        if path.starts_with('/')
            && (path.ends_with("/su") || path.ends_with("/magisk"))
            && path.len() <= 128
            && !path.contains(char::is_whitespace)
            && !out.iter().any(|p| p == path)
        {
            out.push(path.to_string());
        }
    }
    out
}
/// Paths checked for superuser binaries.
pub const SU_PATHS: &[&str] = &[
    "/system/bin/su",
    "/system/xbin/su",
    "/system/sbin/su",
    "/sbin/su",
    "/su/bin/su",
    "/vendor/bin/su",
    "/data/local/su",
    "/data/local/bin/su",
    "/data/local/xbin/su",
    "/system/bin/magisk",
    "/sbin/magisk",
    "/debug_ramdisk/magisk",
];

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
enum Origin {
    System,
    Store,
    /// Another installer app: F-Droid, an MDM agent, a third-party store.
    OtherInstaller,
    /// Installed from an APK file.
    ApkFile,
    /// Installed from a computer over USB (ADB): how police and border
    /// spyware such as NoviSpy and EagleMsgSpy is installed with the phone
    /// in hand.
    Usb,
}
fn origin(package: &Package) -> Origin {
    if package.system {
        Origin::System
    } else if package
        .installer
        .as_deref()
        .is_some_and(|i| crate::android::STORES.contains(&i))
    {
        Origin::Store
    } else if package.installer.as_deref() == Some("com.android.shell") {
        Origin::Usb
    } else if package
        .installer
        .as_deref()
        .is_none_or(|i| crate::android::SIDELOAD_INSTALLERS.contains(&i))
    {
        Origin::ApkFile
    } else {
        Origin::OtherInstaller
    }
}

/// What one app can do and how it hides, as observed on the phone.
#[derive(Debug, Default)]
struct Profile {
    channels: Vec<&'static str>,
    capabilities: BTreeSet<&'static str>,
    hidden: bool,
    imitates_system: bool,
    disguise_words: Vec<String>,
    monitoring_words: Vec<String>,
    background_use: Vec<String>,
}
fn words(id: &str, list: &[&str]) -> Vec<String> {
    let mut found: Vec<String> = id
        .split(['.', '_'])
        .map(str::to_ascii_lowercase)
        .filter(|w| list.contains(&w.as_str()))
        .collect();
    found.dedup();
    found
}
fn ago(seconds: u64) -> String {
    match seconds {
        s if s < 3600 => format!("{} min ago", (s / 60).max(1)),
        s if s < 2 * 86400 => format!("{} h ago", s / 3600),
        s => format!("{} days ago", s / 86400),
    }
}
fn profile(inventory: &Inventory, package: &Package) -> Profile {
    let id = package.id.as_str();
    let owns = |components: &[String]| components.iter().any(|c| component_package(c) == Some(id));
    let mut p = Profile::default();
    if owns(&inventory.accessibility_services) {
        p.channels
            .push("accessibility service enabled (can read the screen and typing)");
    }
    if owns(&inventory.notification_listeners) {
        p.channels
            .push("notification access (can read messages and codes)");
    }
    if owns(&inventory.device_admins) {
        p.channels
            .push("device administrator (can block its removal)");
    }
    if owns(&inventory.input_methods)
        || inventory
            .default_input_method
            .as_deref()
            .and_then(component_package)
            == Some(id)
    {
        p.channels.push("keyboard enabled (can record typing)");
    }
    if inventory.default_sms.as_deref() == Some(id) {
        p.channels.push("default SMS app");
    }
    if inventory.always_on_vpn.as_deref() == Some(id) {
        p.channels.push("always-on VPN (receives all traffic)");
    }
    for (permission, capability) in SENSITIVE_PERMISSIONS {
        if package.granted.iter().any(|g| g == permission) {
            p.capabilities.insert(capability);
        }
    }
    p.hidden = inventory
        .launchable
        .as_ref()
        .is_some_and(|ids| !ids.iter().any(|l| l == id));
    p.imitates_system = SYSTEM_NAMESPACES.iter().any(|ns| id.starts_with(ns));
    p.disguise_words = words(id, DISGUISE_WORDS);
    p.monitoring_words = words(id, MONITORING_WORDS);
    // The most recent access of each kind while the app was not on screen;
    // precise and approximate location count as one.
    let mut latest: BTreeMap<&'static str, u64> = BTreeMap::new();
    for op in inventory.app_ops.iter().filter(|o| o.package == id) {
        let off_screen = op
            .state
            .as_deref()
            .is_some_and(|s| !["top", "pers"].contains(&s));
        if off_screen && op.seconds_ago <= RECENT {
            let what = match op.op.as_str() {
                "CAMERA" => "the camera",
                "RECORD_AUDIO" => "the microphone",
                _ => "location",
            };
            let seconds = latest.entry(what).or_insert(op.seconds_ago);
            *seconds = (*seconds).min(op.seconds_ago);
        }
    }
    for what in ["the microphone", "the camera", "location"] {
        if let Some(seconds) = latest.get(what) {
            p.background_use
                .push(format!("used {what} while not on screen {}", ago(*seconds)));
        }
    }
    p
}
#[derive(Debug, PartialEq, Eq)]
enum Verdict {
    /// Combination seen in spyware: reported as a behavioural detection.
    SpywareBehaviour,
    /// Capabilities worth checking: reported as a review point.
    Review,
    None,
}
fn verdict(origin: Origin, id: &str, p: &Profile) -> Verdict {
    let conceals = p.hidden || p.imitates_system;
    let sensitive = p.capabilities.len();
    let channels = p.channels.len();
    let background = !p.background_use.is_empty();
    match origin {
        Origin::System => Verdict::None,
        Origin::Store => {
            if channels >= 3 {
                Verdict::Review
            } else {
                Verdict::None
            }
        }
        Origin::ApkFile | Origin::Usb | Origin::OtherInstaller => {
            // Installed over USB, hidden and with access to the owner's life:
            // the phone was in someone's hands.
            let usb = origin == Origin::Usb && (channels >= 1 || sensitive >= 2);
            let strong = origin != Origin::OtherInstaller
                && !KNOWN_MANUAL_SYSTEM.contains(&id)
                && conceals
                && (usb || (channels >= 1 && sensitive >= 2) || sensitive >= 4 || background);
            if strong {
                Verdict::SpywareBehaviour
            } else if channels >= 1
                || sensitive >= 4
                || background
                || p.imitates_system
                || !p.monitoring_words.is_empty()
                || (p.hidden && sensitive >= 1)
            {
                Verdict::Review
            } else {
                Verdict::None
            }
        }
    }
}
fn describe(package: &Package, origin: Origin, p: &Profile) -> String {
    let mut facts: Vec<String> = vec![match origin {
        Origin::ApkFile => "installed from an APK file, not from an app store".into(),
        Origin::Usb => "installed from a computer over USB (ADB), not from an app store".into(),
        Origin::OtherInstaller => format!(
            "installed by {}",
            package.installer.as_deref().unwrap_or("another app")
        ),
        Origin::Store => format!(
            "installed from {}",
            package.installer.as_deref().unwrap_or("a store")
        ),
        Origin::System => "pre-installed".into(),
    }];
    if let Some(time) = &package.first_install {
        facts.push(format!("first installed {time} (phone time)"));
    }
    if p.hidden {
        facts.push("no icon in the app launcher".into());
    }
    if p.imitates_system {
        facts.push("its name imitates an Android or manufacturer component".into());
    } else if !p.disguise_words.is_empty() {
        facts.push(format!(
            "its name uses system-like words ({})",
            p.disguise_words.join(", ")
        ));
    }
    if !p.monitoring_words.is_empty() {
        facts.push(format!(
            "its name refers to monitoring ({})",
            p.monitoring_words.join(", ")
        ));
    }
    facts.extend(p.channels.iter().map(|c| c.to_string()));
    if !p.capabilities.is_empty() {
        facts.push(format!(
            "permissions granted: {}",
            p.capabilities
                .iter()
                .copied()
                .collect::<Vec<_>>()
                .join(", ")
        ));
    }
    facts.extend(p.background_use.iter().cloned());
    format!("{}: {}", package.id, facts.join("; "))
}
fn finding(
    rule: &str,
    category: &str,
    severity: &str,
    confidence: &str,
    evidence: &str,
    limitations: Vec<String>,
    recommendation: &str,
) -> Finding {
    let digest = Sha256::digest(format!("{rule}\0{evidence}").as_bytes());
    Finding {
        id: format!("behavior.{}", crate::hex(&digest))[..49].into(),
        category: category.into(),
        source: "https://github.com/enigm-llc/enigm-scan".into(),
        evidence: bounded(evidence, 1800),
        severity: severity.into(),
        confidence: confidence.into(),
        timestamp: None,
        rule: rule.into(),
        rule_version: "1".into(),
        limitations,
        recommendation: recommendation.into(),
    }
}

/// Coverage of the behavioural data, so that a missing source is reported as
/// such instead of looking like a clean result.
fn coverage(inventory: &Inventory) -> (String, &'static str) {
    let mut read = Vec::new();
    let mut missing = Vec::new();
    let mut part = |ok: bool, name: &'static str| {
        if ok {
            read.push(name)
        } else {
            missing.push(name)
        }
    };
    part(
        inventory.settings_status == "completed",
        "accessibility, notification, keyboard, SMS and VPN settings",
    );
    part(
        inventory.admins_status == "completed",
        "device administrators",
    );
    part(inventory.launchable.is_some(), "launcher icons");
    part(
        inventory.permissions_status == "completed",
        "granted permissions",
    );
    part(
        inventory.app_ops_status == "completed",
        "recent microphone, camera and location use",
    );
    part(
        inventory.integrity_status == "completed",
        "system integrity",
    );
    let status = if read.is_empty() {
        "unsupported"
    } else if missing.is_empty() {
        "completed"
    } else {
        "skipped"
    };
    let mut detail = format!(
        "Read: {}.",
        if read.is_empty() {
            "nothing".into()
        } else {
            read.join(", ")
        }
    );
    if !missing.is_empty() {
        detail.push_str(&format!(
            " Not available on this phone: {}.",
            missing.join(", ")
        ));
    }
    (detail, status)
}

/// Adds behavioural findings to the report and returns the IDs of the apps
/// that received their own finding.
pub fn analyze(inventory: &Inventory, report: &mut Report) -> BTreeSet<String> {
    let mut reported = BTreeSet::new();
    if inventory.behavior_status.is_empty() {
        // Inventory written by an app version without behavioural collection.
        return reported;
    }
    let mut detections = 0;
    let mut reviews = 0;
    let mut examined = 0;
    for package in inventory.packages.iter().take(crate::android::MAX_PACKAGES) {
        let origin = origin(package);
        if origin == Origin::System {
            continue;
        }
        examined += 1;
        let p = profile(inventory, package);
        let verdict = verdict(origin, &package.id, &p);
        if verdict == Verdict::None || report.findings.len() >= 500 {
            continue;
        }
        let evidence = describe(package, origin, &p);
        let item = if verdict == Verdict::SpywareBehaviour {
            detections += 1;
            finding(
                "enigm.behavior.android_spyware_profile",
                "android_spyware_behavior",
                "high",
                "medium",
                &evidence,
                vec![
                    "Behavioural detection: no published indicator names this app. Its combination of concealment and surveillance capabilities is the one used by stalkerware and mercenary spyware.".into(),
                    "Parental-control, anti-theft and device-management tools can behave the same way when installed knowingly by the owner.".into(),
                ],
                "If you did not install this app yourself, do not uninstall it yet: preserve the report, keep the phone away from sensitive conversations and contact a qualified incident responder or a support organisation for people targeted by surveillance.",
            )
        } else {
            reviews += 1;
            finding(
                "enigm.heuristic.android_surveillance_capabilities",
                "android_surveillance_capabilities",
                if p.channels.len() >= 2 || !p.background_use.is_empty() || p.imitates_system { "medium" } else { "low" },
                "low",
                &evidence,
                vec!["Review point: these capabilities are needed by some legitimate apps (password managers, accessibility tools, smartwatch companions, security suites). They are not, on their own, a sign of infection.".into()],
                "Check that you recognise this app and installed it yourself. If not, remove its special access in Settings and seek expert review.",
            )
        };
        reported.insert(package.id.clone());
        report.findings.push(item);
    }
    integrity(inventory, report);
    let (detail, status) = coverage(inventory);
    report.check(
        "android_behavior",
        status,
        &format!(
            "{examined} apps not pre-installed were checked for spyware behaviour: hidden icons, names imitating system components, special access and sensitive permissions. {detections} matched the spyware profile and {reviews} are listed for review. {detail} This analysis cannot see apps hidden by a root exploit or a modified system."
        ),
    );
    reported
}
fn integrity(inventory: &Inventory, report: &mut Report) {
    if inventory.integrity_status != "completed" {
        return;
    }
    let props = &inventory.properties;
    let prop = |key: &str| props.get(key).map(String::as_str);
    let mut facts: Vec<String> = Vec::new();
    let mut severity = "low";
    if !inventory.su_paths.is_empty() {
        facts.push(format!(
            "superuser (root) binaries present: {}",
            inventory.su_paths.join(", ")
        ));
        severity = "high";
    }
    if inventory.selinux.as_deref() == Some("Permissive") {
        facts.push("SELinux is permissive: the system's app isolation is disabled".into());
        severity = "high";
    }
    if prop("ro.debuggable") == Some("1") || prop("ro.secure") == Some("0") {
        facts.push("the system is a debuggable build".into());
        if severity == "low" {
            severity = "medium";
        }
    }
    if prop("ro.build.tags").is_some_and(|t| t.contains("test-keys")) {
        facts.push("the system is signed with test keys (custom or modified firmware)".into());
        if severity == "low" {
            severity = "medium";
        }
    }
    if prop("ro.adb.secure") == Some("0") {
        facts.push("USB debugging accepts computers without asking".into());
        if severity == "low" {
            severity = "medium";
        }
    }
    if prop("ro.boot.verifiedbootstate").is_some_and(|s| s == "orange")
        || prop("ro.boot.flash.locked") == Some("0")
        || prop("ro.boot.vbmeta.device_state") == Some("unlocked")
    {
        facts.push(
            "the bootloader is unlocked: the system can be modified with physical access".into(),
        );
    }
    let mut detail = "Checked superuser binaries, SELinux mode, build signature, debuggable flags and bootloader lock.".to_string();
    if facts.is_empty() {
        detail.push_str(" No sign of a modified system was found.");
    } else if report.findings.len() < 500 {
        detail.push_str(&format!(" {} sign(s) of a modified system.", facts.len()));
        report.findings.push(finding(
            "enigm.heuristic.android_system_integrity",
            "android_system_integrity",
            severity,
            "medium",
            &format!("System integrity: {}", facts.join("; ")),
            vec!["Review point: rooting or unlocking a phone is sometimes done by its owner. It also removes the protections that keep spyware out and lets it hide from scans like this one.".into()],
            "If you did not modify this phone, treat it as compromised: stop using it for sensitive communication and have it examined by an expert.",
        ));
    }
    report.check("android_system_integrity", "completed", &detail);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_component_settings_and_rejects_noise() {
        assert_eq!(
            parse_components(
                "com.evil.spy/com.evil.spy.Acc:com.google.android.marvin.talkback/.TalkBackService"
            ),
            vec![
                "com.evil.spy/com.evil.spy.Acc",
                "com.google.android.marvin.talkback/.TalkBackService"
            ]
        );
        assert_eq!(
            parse_components("com.a.kbd/.Ime;-921088104:com.b.kbd/.Ime"),
            vec!["com.a.kbd/.Ime", "com.b.kbd/.Ime"]
        );
        assert!(parse_components("null").is_empty());
        assert!(parse_components("bad;rm -rf/x").is_empty());
        let settings = parse_settings(
            "enabled_accessibility_services=com.evil.spy/.Acc\nsms_default_application=com.google.android.apps.messaging\nalways_on_vpn_app=null\nBad Key=1\n",
        );
        assert_eq!(settings.len(), 2);
        assert_eq!(
            settings["sms_default_application"],
            "com.google.android.apps.messaging"
        );
    }
    #[test]
    fn parses_device_admins_from_dumpsys() {
        let text = "Current Device Policy Manager state:\n  Immutable state:\n    mHasFeature=true\n  Device Owner: \n    admin=ComponentInfo{com.corp.mdm/com.corp.mdm.Admin}\n  Enabled Device Admins (User 0, provisioningState: 3):\n    com.google.android.gms/com.google.android.gms.mdm.receivers.MdmDeviceAdminReceiver:\n      uid=10146\n      policies:\n        force-lock\n    com.evil.spy/com.evil.spy.AdminReceiver:\n      uid=10333\n  Encryption Status: per-user\n    fake/notadmin:\n";
        assert_eq!(
            parse_device_admins(text),
            vec![
                "com.corp.mdm/com.corp.mdm.Admin",
                "com.google.android.gms/com.google.android.gms.mdm.receivers.MdmDeviceAdminReceiver",
                "com.evil.spy/com.evil.spy.AdminReceiver"
            ]
        );
    }
    #[test]
    fn parses_launcher_activities_only_when_supported() {
        let text = "3 activities found:\n  Activity #0:\n    priority=0 preferredOrder=0 match=0x108000 specificIndex=-1 isDefault=false\n    com.whatsapp/.Main\n  Activity #1:\n    com.android.settings/.Settings\n";
        assert_eq!(
            parse_launchable(text),
            Some(vec!["com.android.settings".into(), "com.whatsapp".into()])
        );
        assert_eq!(parse_launchable("Unknown command: query-activities"), None);
    }
    #[test]
    fn parses_granted_sensitive_permissions_per_package() {
        let text = "  Package [com.evil.spy] (5f1c2a3):\n    firstInstallTime=2026-11-20 09:13:44\n      android.permission.RECEIVE_BOOT_COMPLETED: granted=true\n      android.permission.RECORD_AUDIO: granted=true, flags=[ USER_SET ]\n      android.permission.CAMERA: granted=false, flags=[ USER_SET ]\n      android.permission.ACCESS_FINE_LOCATION: granted=true, flags=[ USER_SET ]\n  Package [com.whatsapp] (abc):\n      android.permission.READ_CONTACTS: granted=true\n";
        let grants = parse_package_grants(text);
        let spy = &grants["com.evil.spy"];
        assert_eq!(
            spy.0.iter().cloned().collect::<Vec<_>>(),
            vec!["ACCESS_FINE_LOCATION", "RECORD_AUDIO"]
        );
        assert_eq!(spy.1.as_deref(), Some("2026-11-20 09:13:44"));
        assert!(grants["com.whatsapp"].0.contains("READ_CONTACTS"));
    }
    #[test]
    fn parses_app_ops_in_both_formats() {
        assert_eq!(parse_duration("4d23h1m"), Some(4 * 86400 + 23 * 3600 + 60));
        assert_eq!(parse_duration("12h3m2s125ms"), Some(12 * 3600 + 182));
        assert_eq!(parse_duration("0ms"), Some(0));
        assert_eq!(parse_duration("abc"), None);
        let modern = "#op RECORD_AUDIO\nCurrent AppOps Service state:\n  Uid 10333:\n    state=cch\n    Package com.evil.spy:\n      RECORD_AUDIO (allow):\n        null=[\n          Access: [fgsvc-s] 2026-11-24 21:00:00.000 (-2h3m4s5ms) duration=+20m\n          Access: [top-s] 2026-11-20 10:00:00.000 (-4d23h) duration=+1s\n        ]\n  Uid 10201:\n    Package com.whatsapp:\n      RECORD_AUDIO (allow):\n        null=[\n          Access: [top-s] 2026-11-24 22:00:00.000 (-1h) duration=+5s\n        ]\n#op CAMERA\n  Uid 10333:\n    Package com.evil.spy:\n      CAMERA (allow): time=+3d2h ago; duration=+1s\n";
        let ops = parse_app_ops(modern);
        assert_eq!(ops.len(), 3);
        let spy_mic = ops
            .iter()
            .find(|o| o.package == "com.evil.spy" && o.op == "RECORD_AUDIO")
            .unwrap();
        assert_eq!(spy_mic.seconds_ago, 2 * 3600 + 3 * 60 + 4);
        assert_eq!(spy_mic.state.as_deref(), Some("fgsvc"));
        let spy_cam = ops.iter().find(|o| o.op == "CAMERA").unwrap();
        assert_eq!(spy_cam.state, None);
        assert_eq!(spy_cam.seconds_ago, 3 * 86400 + 7200);
    }
    #[test]
    fn parses_integrity_properties_and_su_paths() {
        let props = parse_properties("[ro.debuggable]: [0]\n[ro.build.tags]: [release-keys]\n[persist.sys.locale]: [es-ES]\n[ro.boot.verifiedbootstate]: [green]\n");
        assert_eq!(props.len(), 3);
        assert_eq!(props["ro.build.tags"], "release-keys");
        assert_eq!(
            parse_su_paths(
                "/system/xbin/su\nls: /sbin/su: No such file or directory\n/system/bin/sh\n"
            ),
            vec!["/system/xbin/su"]
        );
    }

    fn package(id: &str, installer: Option<&str>, granted: &[&str]) -> Package {
        Package {
            id: id.into(),
            path: format!("/data/app/~~x==/{id}-1==/base.apk"),
            installer: installer.map(str::to_owned),
            sha256: None,
            system: false,
            granted: granted.iter().map(|g| g.to_string()).collect(),
            first_install: Some("2026-11-20 09:13:44".into()),
            uid: None,
        }
    }
    fn inventory(packages: Vec<Package>) -> Inventory {
        Inventory {
            packages,
            packages_status: "completed".into(),
            behavior_status: "completed".into(),
            settings_status: "completed".into(),
            admins_status: "completed".into(),
            permissions_status: "completed".into(),
            app_ops_status: "completed".into(),
            integrity_status: "completed".into(),
            launchable: Some(vec![
                "com.whatsapp".into(),
                "com.example.notes".into(),
                "org.fdroid.kde".into(),
            ]),
            ..Default::default()
        }
    }

    #[test]
    fn hidden_sideloaded_app_with_special_access_is_spyware_behaviour() {
        let mut inv = inventory(vec![
            package(
                "com.android.core.mngr",
                None,
                &["RECORD_AUDIO", "ACCESS_FINE_LOCATION", "READ_SMS"],
            ),
            package(
                "com.whatsapp",
                Some("com.android.vending"),
                &["RECORD_AUDIO", "CAMERA", "READ_CONTACTS"],
            ),
            package("com.example.notes", None, &[]),
        ]);
        inv.accessibility_services = vec!["com.android.core.mngr/.Acc".into()];
        inv.notification_listeners = vec![
            "com.android.core.mngr/.Notif".into(),
            "com.whatsapp/.Notif".into(),
        ];
        inv.device_admins = vec!["com.android.core.mngr/.Admin".into()];
        let mut report = Report::new("android", 1);
        let reported = analyze(&inv, &mut report);
        assert_eq!(
            reported.into_iter().collect::<Vec<_>>(),
            vec!["com.android.core.mngr"]
        );
        let f = &report.findings[0];
        assert_eq!(f.rule, "enigm.behavior.android_spyware_profile");
        assert_eq!(f.severity, "high");
        for fact in [
            "APK file",
            "no icon",
            "imitates",
            "accessibility",
            "notification access",
            "device administrator",
            "microphone",
            "SMS",
        ] {
            assert!(f.evidence.contains(fact), "{fact}: {}", f.evidence);
        }
        let check = report
            .checks
            .iter()
            .find(|c| c.id == "android_behavior")
            .unwrap();
        assert_eq!(check.status, "completed");
        assert!(check.detail.contains("1 matched the spyware profile"));
    }
    #[test]
    fn recognisable_tools_and_store_apps_are_review_points_or_nothing() {
        let mut inv = inventory(vec![
            // Visible, from F-Droid, with notification access: a review point.
            package(
                "org.fdroid.kde",
                Some("org.fdroid.fdroid"),
                &["READ_SMS", "READ_CONTACTS", "READ_CALL_LOG"],
            ),
            // Google services installed by hand on a phone without them.
            package(
                "com.google.android.gms",
                None,
                &[
                    "RECORD_AUDIO",
                    "ACCESS_FINE_LOCATION",
                    "READ_CONTACTS",
                    "CAMERA",
                ],
            ),
            // Store app with two special accesses: not reported.
            package(
                "com.whatsapp",
                Some("com.android.vending"),
                &["RECORD_AUDIO"],
            ),
        ]);
        inv.notification_listeners = vec!["org.fdroid.kde/.N".into(), "com.whatsapp/.N".into()];
        inv.accessibility_services = vec!["com.whatsapp/.A".into()];
        let mut report = Report::new("android", 1);
        analyze(&inv, &mut report);
        assert!(report
            .findings
            .iter()
            .all(|f| f.rule.starts_with("enigm.heuristic.")));
        assert_eq!(report.findings.len(), 2);
        assert!(!report
            .findings
            .iter()
            .any(|f| f.evidence.starts_with("com.whatsapp")));
    }
    #[test]
    fn background_microphone_use_counts_only_when_recent_and_off_screen() {
        let mut inv = inventory(vec![package("com.sync.service", None, &["RECORD_AUDIO"])]);
        inv.app_ops = vec![AppOp {
            package: "com.sync.service".into(),
            op: "RECORD_AUDIO".into(),
            seconds_ago: 7200,
            state: Some("fgsvc".into()),
        }];
        let mut report = Report::new("android", 1);
        analyze(&inv, &mut report);
        assert_eq!(
            report.findings[0].rule,
            "enigm.behavior.android_spyware_profile"
        );
        assert!(report.findings[0]
            .evidence
            .contains("used the microphone while not on screen 2 h ago"));
        // On screen, or a month ago: not background use.
        for (state, ago) in [("top", 7200), ("fgsvc", 40 * 86400)] {
            let mut inv = inventory(vec![package("com.sync.service", None, &["RECORD_AUDIO"])]);
            inv.app_ops = vec![AppOp {
                package: "com.sync.service".into(),
                op: "RECORD_AUDIO".into(),
                seconds_ago: ago,
                state: Some(state.into()),
            }];
            let mut report = Report::new("android", 1);
            analyze(&inv, &mut report);
            assert!(report
                .findings
                .iter()
                .all(|f| f.rule != "enigm.behavior.android_spyware_profile"));
        }
    }
    #[test]
    fn hidden_app_installed_over_usb_with_one_special_access_is_spyware_behaviour() {
        let mut inv = inventory(vec![
            package("com.police.agent", Some("com.android.shell"), &[]),
            // Same access from an APK file: a review point, as before.
            package("com.other.agent", None, &[]),
        ]);
        inv.accessibility_services = vec![
            "com.police.agent/.Acc".into(),
            "com.other.agent/.Acc".into(),
        ];
        let mut report = Report::new("android", 1);
        analyze(&inv, &mut report);
        let usb = report
            .findings
            .iter()
            .find(|f| f.evidence.starts_with("com.police.agent"))
            .unwrap();
        assert_eq!(usb.rule, "enigm.behavior.android_spyware_profile");
        assert!(usb
            .evidence
            .contains("installed from a computer over USB (ADB), not from an app store"));
        let apk = report
            .findings
            .iter()
            .find(|f| f.evidence.starts_with("com.other.agent"))
            .unwrap();
        assert_eq!(
            apk.rule,
            "enigm.heuristic.android_surveillance_capabilities"
        );
    }
    #[test]
    fn background_location_is_one_fact_with_the_latest_access() {
        let mut inv = inventory(vec![package(
            "com.example.notes",
            None,
            &["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION"],
        )]);
        inv.app_ops = ["FINE_LOCATION", "COARSE_LOCATION"]
            .iter()
            .zip([7200, 600])
            .map(|(op, seconds_ago)| AppOp {
                package: "com.example.notes".into(),
                op: op.to_string(),
                seconds_ago,
                state: Some("bg".into()),
            })
            .collect();
        let mut report = Report::new("android", 1);
        analyze(&inv, &mut report);
        let f = &report.findings[0];
        assert_eq!(f.rule, "enigm.heuristic.android_surveillance_capabilities");
        assert_eq!(
            f.evidence
                .matches("used location while not on screen")
                .count(),
            1
        );
        assert!(f
            .evidence
            .contains("used location while not on screen 10 min ago"));
    }
    #[test]
    fn unknown_launcher_never_claims_hidden_icons_and_missing_sources_reduce_coverage() {
        let mut inv = inventory(vec![package(
            "com.evil.spy",
            None,
            &["RECORD_AUDIO", "ACCESS_FINE_LOCATION"],
        )]);
        inv.launchable = None;
        inv.app_ops_status = "unsupported".into();
        inv.accessibility_services = vec!["com.evil.spy/.Acc".into()];
        let mut report = Report::new("android", 1);
        analyze(&inv, &mut report);
        assert_eq!(
            report.findings[0].rule,
            "enigm.heuristic.android_surveillance_capabilities"
        );
        assert!(!report.findings[0].evidence.contains("no icon"));
        let check = report
            .checks
            .iter()
            .find(|c| c.id == "android_behavior")
            .unwrap();
        assert_eq!(check.status, "skipped");
        assert!(check.detail.contains(
            "Not available on this phone: launcher icons, recent microphone, camera and location use"
        ));
    }
    #[test]
    fn integrity_reports_root_and_permissive_selinux_but_not_a_stock_phone() {
        let mut inv = inventory(vec![]);
        inv.properties = parse_properties("[ro.debuggable]: [0]\n[ro.build.tags]: [release-keys]\n[ro.boot.verifiedbootstate]: [green]\n");
        inv.selinux = Some("Enforcing".into());
        let mut report = Report::new("android", 1);
        analyze(&inv, &mut report);
        assert!(report.findings.is_empty());
        inv.su_paths = vec!["/system/xbin/su".into()];
        inv.selinux = Some("Permissive".into());
        inv.properties
            .insert("ro.boot.verifiedbootstate".into(), "orange".into());
        let mut report = Report::new("android", 1);
        analyze(&inv, &mut report);
        let f = &report.findings[0];
        assert_eq!(f.rule, "enigm.heuristic.android_system_integrity");
        assert_eq!(f.severity, "high");
        assert!(
            f.evidence.contains("/system/xbin/su")
                && f.evidence.contains("SELinux")
                && f.evidence.contains("bootloader")
        );
    }
    #[test]
    fn old_inventories_without_behaviour_data_add_nothing() {
        let mut inv = inventory(vec![package("com.evil.spy", None, &["RECORD_AUDIO"])]);
        inv.behavior_status = String::new();
        let mut report = Report::new("android", 1);
        assert!(analyze(&inv, &mut report).is_empty());
        assert!(report.findings.is_empty() && report.checks.is_empty());
    }
}
