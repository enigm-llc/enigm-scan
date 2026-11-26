use crate::{adb, engines::Catalog, process};
use serde::{Deserialize, Serialize};
use std::{
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, AtomicU8},
    time::Duration,
};
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub id: String,
    pub platform: String,
    pub authorized: bool,
    #[serde(default)]
    pub needs_trust: bool,
    #[serde(default)]
    pub name: Option<String>,
    /// USB link speed in bit/s reported by the host's USB multiplexer.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub usb_speed: Option<u64>,
    /// Why a present phone cannot be used yet (for example, the host has no
    /// permission to open it). Absent when there is nothing to report.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub issue: Option<String>,
}
fn valid_id(id: &str) -> bool {
    id.as_bytes()
        .first()
        .is_some_and(|b| b.is_ascii_alphanumeric())
        && id.len() <= 128
        && id
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"-_.:".contains(&c))
}
pub fn devices(
    catalog: &Catalog,
    platform: &str,
    work: &Path,
    cancel: &AtomicBool,
    adb_session: Option<&adb::Session>,
) -> Result<Vec<Device>, String> {
    if platform == "ios" && catalog.available("ios-usb") {
        let (program, _) = catalog.resolve("ios-usb")?;
        let out = process::run(
            &program,
            &["list".into()],
            work,
            cancel,
            // Startup (unpacking and loading the adapter's libraries) happens
            // before Python's separate 12-second USB deadline starts. On a Mac
            // that checks every freshly unpacked library, startup alone was
            // measured at about 45 s, so leave it ample room.
            Duration::from_secs(180),
        )
        .map_err(|error| {
            if error == "engine_timeout" {
                if work.join("ios-discovery-started").is_file() {
                    "ios_discovery_timeout".to_string()
                } else {
                    "ios_startup_timeout".to_string()
                }
            } else {
                error
            }
        })?;
        if out.code == Some(80) {
            return Err("ios_discovery_timeout".into());
        }
        if out.code != Some(0) {
            return Err("ios_transport_unavailable".into());
        }
        let devices: Vec<Device> =
            serde_json::from_slice(&out.stdout).map_err(|_| "device_enumeration_failed")?;
        if devices.len() > 32
            || devices.iter().any(|d| {
                !valid_id(&d.id)
                    || d.platform != "ios"
                    || d.name.as_ref().is_some_and(|s| s.len() > 320)
                    || d.usb_speed
                        .is_some_and(|speed| speed == 0 || speed > 100_000_000_000)
            })
        {
            return Err("device_enumeration_failed".into());
        }
        return Ok(devices);
    }
    let (tool, args) = match platform {
        "android" => ("adb", vec!["devices".into(), "-l".into()]),
        "ios" => ("idevice_id", vec!["-l".into()]),
        _ => return Err("invalid_device".into()),
    };
    let (program, _) = catalog.resolve(tool)?;
    let out = if platform == "android" {
        adb_session.ok_or("adb_session_required")?.run(
            catalog,
            &args,
            work,
            cancel,
            Duration::from_secs(15),
        )?
    } else {
        process::run(&program, &args, work, cancel, Duration::from_secs(15))?
    };
    if out.code != Some(0) {
        return Err("device_enumeration_failed".into());
    }
    let text = String::from_utf8(out.stdout).map_err(|_| "device_enumeration_failed")?;
    Ok(parse_devices(platform, &text))
}
fn parse_devices(platform: &str, text: &str) -> Vec<Device> {
    text.lines()
        .filter_map(|line| {
            let parts: Vec<_> = line.split_whitespace().collect();
            let id = *parts.first()?;
            if !valid_id(id) || id == "List" || id.starts_with('*') {
                return None;
            }
            // ADB reports a phone in several states while it negotiates the
            // key: every one of them means "plugged in", so none is dropped.
            let (authorized, issue) = if platform == "android" {
                match *parts.get(1)? {
                    "device" => (true, None),
                    "unauthorized" | "authorizing" | "connecting" | "offline" => (false, None),
                    // "no permissions (...)": the host may not open the USB device.
                    "no" => (false, Some("usb_permission".to_string())),
                    _ => return None,
                }
            } else {
                (true, None)
            };
            Some(Device {
                id: id.into(),
                platform: platform.into(),
                authorized,
                needs_trust: false,
                name: parts
                    .iter()
                    .find_map(|part| part.strip_prefix("model:"))
                    .map(|name| name.replace('_', " ")),
                usb_speed: None,
                issue,
            })
        })
        .take(32)
        .collect()
}
/// What the person chose for one acquisition.
#[derive(Default)]
pub struct Options<'a> {
    /// The iPhone backup is encrypted and its password will be supplied.
    pub password_supplied: bool,
    /// iPhone: observe its traffic; Android: read its open connections.
    pub capture_network: bool,
    /// iPhone: wait, after Trust, for the owner to start a sysdiagnose.
    pub deep_check: bool,
    /// Set when the owner continues without the deep check.
    pub skip_deep_check: Option<&'a AtomicBool>,
    /// iPhone paired while searching: after Trust, hold the copy until
    /// Start. `START_HOLD`, or `START_DEEP` while the owner prepares the deep
    /// check, then `START_COPY` or `START_COPY_WITH_NETWORK`.
    pub start: Option<&'a AtomicU8>,
}
pub const START_HOLD: u8 = 0;
pub const START_COPY: u8 = 1;
pub const START_COPY_WITH_NETWORK: u8 = 2;
pub const START_DEEP: u8 = 3;
/// What the adapter reads for each `start` value (`start_choice` in
/// scripts/engines/ios_entry.py).
fn start_word(choice: u8) -> &'static [u8] {
    match choice {
        START_COPY => b"no-network",
        START_COPY_WITH_NETWORK => b"network",
        START_DEEP => b"deep",
        _ => b"hold",
    }
}
/// Written in the workspace for the iPhone adapter: continue without the
/// deep check (`DEEP_SKIP` in scripts/engines/ios_entry.py).
const DEEP_SKIP: &str = "skip-deep-check";
/// Written in the workspace with the owner's latest choice for a held copy
/// (`START_COPY` in scripts/engines/ios_entry.py).
const START_FILE: &str = "start-copy";
// The device, its workspace and the session's controls; grouping them
// would only move the same list into a struct used once.
#[allow(clippy::too_many_arguments)]
pub fn acquire(
    catalog: &Catalog,
    platform: &str,
    id: &str,
    work: &Path,
    cancel: &AtomicBool,
    adb_session: Option<&adb::Session>,
    options: &Options,
    on_progress: &dyn Fn(&Progress),
    on_diagnostic: &dyn Fn(&str),
) -> Result<PathBuf, String> {
    let (password_supplied, capture_network) = (options.password_supplied, options.capture_network);
    if !valid_id(id) {
        return Err("invalid_device".into());
    }
    if !devices(catalog, platform, work, cancel, adb_session)?
        .iter()
        .any(|d| d.id == id && (d.authorized || (platform == "ios" && d.needs_trust)))
    {
        return Err("device_not_authorized".into());
    }
    let (tool, args, target) = if platform == "android" {
        let evidence = work.join("acquired");
        std::fs::create_dir(&evidence).map_err(|_| "workspace_failed")?;
        let path = evidence.join("bugreport.zip");
        (
            "adb",
            vec![
                "-s".into(),
                id.into(),
                "bugreport".into(),
                path.to_string_lossy().into_owned(),
            ],
            path,
        )
    } else if catalog.available("ios-usb") {
        (
            "ios-usb",
            vec![
                "backup".into(),
                id.into(),
                if password_supplied {
                    "encrypted".into()
                } else {
                    "plain".into()
                },
                if capture_network {
                    "network".into()
                } else {
                    "no-network".into()
                },
                if options.start.is_some() {
                    "hold".into()
                } else if options.deep_check {
                    "deep".into()
                } else {
                    "no-deep".into()
                },
            ],
            work.join("ios-backup").join(id),
        )
    } else {
        let path = work.join("ios-backup");
        std::fs::create_dir(&path).map_err(|_| "workspace_failed")?;
        (
            "idevicebackup2",
            vec![
                "-u".into(),
                id.into(),
                "backup".into(),
                "--full".into(),
                path.to_string_lossy().into_owned(),
            ],
            path,
        )
    };
    let (program, _) = catalog.resolve(tool)?;
    let out = if platform == "android" {
        // The bug report arrives as one file: how much of it has been copied
        // so far, measured on disk, is the copy's progress.
        let evidence = target.parent().map(Path::to_path_buf).unwrap_or_default();
        adb_session.ok_or("adb_session_required")?.run_monitored(
            catalog,
            &args,
            work,
            cancel,
            Duration::from_secs(1800),
            &|| {
                let copied = copied_bytes(&evidence);
                if copied > 0 {
                    on_progress(&Progress {
                        phase: "acquiring".into(),
                        percent: None,
                        kept: 0,
                        discarded: 0,
                        received_bytes: 0,
                        stored_bytes: copied,
                        capturing: false,
                        sysdiagnose: None,
                    });
                }
            },
        )?
    } else {
        // The choice last handed to the adapter; it starts at "hold".
        let written = AtomicU8::new(u8::MAX);
        process::run_monitored(
            &program,
            &args,
            work,
            cancel,
            Duration::from_secs(4 * 60 * 60),
            &|| {
                if let Some(progress) = acquisition_progress(work) {
                    on_progress(&progress);
                }
                if options
                    .skip_deep_check
                    .is_some_and(|skip| skip.load(std::sync::atomic::Ordering::SeqCst))
                    && !work.join(DEEP_SKIP).exists()
                {
                    let _ = std::fs::write(work.join(DEEP_SKIP), b"skip");
                }
                if let Some(start) = options.start {
                    let choice = start.load(std::sync::atomic::Ordering::SeqCst);
                    if choice != written.load(std::sync::atomic::Ordering::SeqCst) {
                        // Written whole, then renamed over the previous one,
                        // so the adapter never reads a half-written choice.
                        // A failed rename (the file briefly open on Windows)
                        // is tried again on the next tick.
                        let partial = work.join("start-copy.partial");
                        if std::fs::write(&partial, start_word(choice)).is_ok()
                            && std::fs::rename(&partial, work.join(START_FILE)).is_ok()
                        {
                            written.store(choice, std::sync::atomic::Ordering::SeqCst);
                        }
                    }
                }
            },
        )?
    };
    if platform == "ios" && out.code == Some(78) {
        return Err("backup_password_required".into());
    }
    if platform == "ios" && out.code == Some(79) {
        return Err("insufficient_disk_space".into());
    }
    // Actionable phone states reported by the adapter.
    if platform == "ios" {
        let code = match out.code {
            Some(81) => Some("device_locked"),
            Some(82) => Some("device_disconnected"),
            Some(83) => Some("device_not_trusted"),
            Some(84) => Some("device_cancelled"),
            // "Don't Trust" pressed, and a passcode prompt the phone dropped
            // unanswered on every attempt (the adapter already retried).
            Some(85) => Some("device_trust_denied"),
            Some(86) => Some("device_passcode_timeout"),
            // The phone could not be asked whether the deep check started.
            Some(87) => Some("deep_check_failed"),
            _ => None,
        };
        if let Some(code) = code {
            return Err(code.into());
        }
    }
    if out.code != Some(0) || !target.exists() {
        if let Some(code) = failure_diagnostic(&out) {
            on_diagnostic(&code);
        }
        return Err("acquisition_failed".into());
    }
    if platform == "android" {
        if let Some(session) = adb_session {
            let inventory = android_inventory(catalog, session, id, work, cancel, capture_network);
            if cancel.load(std::sync::atomic::Ordering::Relaxed) {
                return Err("cancelled".into());
            }
            if let Ok(bytes) = serde_json::to_vec(&inventory) {
                let _ = std::fs::write(work.join(ANDROID_INVENTORY), bytes);
            }
        }
    }
    // ADB owns a temporary USB authorization; no wireless connection or reboot is requested.
    Ok(target)
}
/// Written next to the evidence, outside the parser snapshot.
pub const ANDROID_INVENTORY: &str = "android-inventory.json";
/// Crash reports and the sysdiagnose shutdown log read by the iOS adapter.
pub const IOS_DIAGNOSTICS: &str = "ios-diagnostics";
/// Read-only `adb shell` queries that need no root: installed packages and
/// their installer, APK hashes, open sockets (only when the person asked to
/// review connections) and traffic-redirect settings. Each step is best
/// effort; a refused step is recorded, never fatal.
pub fn android_inventory(
    catalog: &Catalog,
    session: &adb::Session,
    id: &str,
    work: &Path,
    cancel: &AtomicBool,
    connections: bool,
) -> enigm_scan_core::android::Inventory {
    use enigm_scan_core::android;
    let shell = |command: &str, seconds: u64| -> Option<String> {
        if cancel.load(std::sync::atomic::Ordering::Relaxed) {
            return None;
        }
        let args = vec!["-s".into(), id.into(), "shell".into(), command.into()];
        let out = session
            .run(catalog, &args, work, cancel, Duration::from_secs(seconds))
            .ok()?;
        (out.code == Some(0)).then(|| String::from_utf8_lossy(&out.stdout).into_owned())
    };
    let mut inventory = android::Inventory::default();
    match shell("pm list packages -f -i -U", 120) {
        Some(text) => {
            inventory.packages = android::parse_packages(&text);
            inventory.packages_status = if inventory.packages.is_empty() {
                "failed"
            } else {
                "completed"
            }
            .into();
        }
        None => inventory.packages_status = "failed".into(),
    }
    if let Some(text) = shell("pm list packages -s", 120) {
        android::mark_system(&mut inventory.packages, &text);
    }
    let paths: Vec<String> = inventory
        .packages
        .iter()
        .filter(|p| android::hashable(&p.path))
        .map(|p| p.path.clone())
        .collect();
    let mut hashed = 0;
    for chunk in paths.chunks(40) {
        let quoted: Vec<String> = chunk.iter().map(|p| format!("'{p}'")).collect();
        // `; true`: an unreadable APK must not discard the hashes that were produced.
        let command = format!("sha256sum {} 2>/dev/null; true", quoted.join(" "));
        if let Some(text) = shell(&command, 300) {
            hashed += android::apply_hashes(&mut inventory.packages, &text);
        }
    }
    inventory.hashes_status = if paths.is_empty() {
        "skipped"
    } else if hashed == 0 {
        "unsupported"
    } else {
        "completed"
    }
    .into();
    match connections
        .then(|| {
            shell(
                "cat /proc/net/tcp /proc/net/tcp6 /proc/net/udp /proc/net/udp6 2>/dev/null; true",
                60,
            )
        })
        .flatten()
    {
        _ if !connections => inventory.network_status = "skipped".into(),
        Some(text) if text.contains("local_address") => {
            inventory.remote_addresses = android::parse_proc_net(&text);
            inventory.network_status = "completed".into();
        }
        // Android 10+ may deny /proc/net to the shell user.
        Some(_) => inventory.network_status = "unsupported".into(),
        None => inventory.network_status = "failed".into(),
    }
    // What each app sent in the background, from the phone's own network
    // usage statistics (readable without root, unlike live connections on
    // Android 10 and later).
    inventory.upload_status = if !connections {
        "skipped".into()
    } else {
        match shell("dumpsys netstats detail", 90) {
            Some(text) if text.contains("UID stats:") => {
                let sent = android::parse_background_upload(&text);
                let mut apps: Vec<(String, u64)> = inventory
                    .packages
                    .iter()
                    .filter_map(|p| Some((p.id.clone(), *sent.get(&p.uid?)?)))
                    .filter(|(_, bytes)| *bytes > 0)
                    .collect();
                apps.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
                apps.truncate(200);
                inventory.background_upload = apps;
                "completed".into()
            }
            Some(_) => "unsupported".into(),
            None => "failed".into(),
        }
    };
    let setting = |name: &str| {
        shell(&format!("settings get global {name}"), 30)
            .map(|v| v.trim().to_string())
            .filter(|v| !v.is_empty() && v != "null" && v.len() <= 253)
    };
    inventory.private_dns_mode = setting("private_dns_mode");
    inventory.private_dns_host = setting("private_dns_specifier");
    inventory.http_proxy = setting("http_proxy");
    behavior_inventory(&shell, &mut inventory);
    inventory
}
/// Fixed shell commands for behavioural data. Built only from constants.
#[derive(Clone, Copy)]
enum BehaviorCommand {
    Settings,
    Launcher,
    Permissions,
    /// One operation per command: each answer stays within the output bound.
    AppOps(&'static str),
    Integrity,
}
impl BehaviorCommand {
    fn text(self) -> String {
        use enigm_scan_core::behavior;
        match self {
            Self::Settings => format!(
                "for k in {}; do echo \"$k=$(settings get secure $k)\"; done; true",
                [
                    "enabled_accessibility_services",
                    "enabled_notification_listeners",
                    "enabled_input_methods",
                    "default_input_method",
                    "sms_default_application",
                    "always_on_vpn_app",
                ]
                .join(" ")
            ),
            Self::Launcher => "cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER 2>/dev/null; true".into(),
            // Filtered on the phone: the full dump exceeds the bounded output.
            Self::Permissions => format!(
                "dumpsys package packages 2>/dev/null | grep -E '^  Package \\[|firstInstallTime=|permission\\.({}): granted=true'; true",
                behavior::SENSITIVE_PERMISSIONS
                    .iter()
                    .map(|(p, _)| *p)
                    .collect::<Vec<_>>()
                    .join("|")
            ),
            Self::AppOps(op) => {
                format!("echo '#op {op}'; dumpsys appops --op {op} 2>/dev/null; true")
            }
            Self::Integrity => format!(
                "getprop; echo '#selinux'; getenforce 2>/dev/null; echo '#su'; ls {} 2>/dev/null; true",
                behavior::SU_PATHS.join(" ")
            ),
        }
    }
}
/// Read-only queries for behavioural analysis (`enigm_scan_core::behavior`):
/// special access, launcher icons, granted permissions, recent microphone and
/// camera use and system integrity. Fixed commands, no root, best effort.
fn behavior_inventory(
    shell: &dyn Fn(&str, u64) -> Option<String>,
    inventory: &mut enigm_scan_core::android::Inventory,
) {
    use enigm_scan_core::behavior;
    inventory.behavior_status = "completed".into();
    match shell(&BehaviorCommand::Settings.text(), 60) {
        Some(text) if text.contains("enabled_accessibility_services=") => {
            let settings = behavior::parse_settings(&text);
            let components = |key: &str| {
                settings
                    .get(key)
                    .map(|v| behavior::parse_components(v))
                    .unwrap_or_default()
            };
            inventory.accessibility_services = components("enabled_accessibility_services");
            inventory.notification_listeners = components("enabled_notification_listeners");
            inventory.input_methods = components("enabled_input_methods");
            inventory.default_input_method = components("default_input_method").into_iter().next();
            let package = |key: &str| {
                settings
                    .get(key)
                    .filter(|v| !v.contains(['/', ' ', ':']) && v.contains('.') && v.len() <= 255)
                    .cloned()
            };
            inventory.default_sms = package("sms_default_application");
            inventory.always_on_vpn = package("always_on_vpn_app");
            inventory.settings_status = "completed".into();
        }
        _ => inventory.settings_status = "failed".into(),
    }
    match shell("dumpsys device_policy 2>/dev/null; true", 60) {
        Some(text) if text.contains("Device Policy") => {
            inventory.device_admins = behavior::parse_device_admins(&text);
            inventory.admins_status = "completed".into();
        }
        _ => inventory.admins_status = "unsupported".into(),
    }
    inventory.launchable = shell(&BehaviorCommand::Launcher.text(), 60)
        .and_then(|text| behavior::parse_launchable(&text));
    match shell(&BehaviorCommand::Permissions.text(), 120) {
        Some(text) if text.contains("Package [") => {
            let grants = behavior::parse_package_grants(&text);
            for package in inventory.packages.iter_mut() {
                if let Some((granted, installed)) = grants.get(&package.id) {
                    package.granted = granted.iter().cloned().collect();
                    package.first_install = installed.clone();
                }
            }
            inventory.permissions_status = "completed".into();
        }
        _ => inventory.permissions_status = "unsupported".into(),
    }
    let mut answered = false;
    for op in behavior::WATCHED_OPS {
        if let Some(text) = shell(&BehaviorCommand::AppOps(op).text(), 60)
            .filter(|text| text.contains("Package ") || text.contains("AppOps"))
        {
            answered = true;
            inventory.app_ops.extend(behavior::parse_app_ops(&text));
        }
    }
    inventory.app_ops_status = if answered { "completed" } else { "unsupported" }.into();
    match shell(&BehaviorCommand::Integrity.text(), 60) {
        Some(text) if text.contains("#selinux") => {
            let (props, rest) = text.split_once("#selinux").unwrap_or((&text, ""));
            let (selinux, su) = rest.split_once("#su").unwrap_or((rest, ""));
            inventory.properties = behavior::parse_properties(props);
            inventory.selinux = selinux
                .trim()
                .lines()
                .next()
                .map(str::trim)
                .filter(|v| ["Enforcing", "Permissive", "Disabled"].contains(v))
                .map(str::to_owned);
            inventory.su_paths = behavior::parse_su_paths(su);
            inventory.integrity_status = if inventory.properties.is_empty() {
                "unsupported"
            } else {
                "completed"
            }
            .into();
        }
        _ => inventory.integrity_status = "failed".into(),
    }
}
/// A fixed, non-sensitive diagnostic for an unexplained adapter failure: the
/// resource limit or signal that ended it, or the adapter's own diagnostic
/// line (a fixed code or exception class names only). Anything else is dropped.
pub fn failure_diagnostic(out: &process::Output) -> Option<String> {
    if let Some(signal) = out.signal {
        #[cfg(unix)]
        {
            if signal == libc::SIGXCPU {
                return Some("engine_cpu_limit".into());
            }
            if signal == libc::SIGXFSZ {
                return Some("engine_file_size_limit".into());
            }
        }
        return Some(format!("engine_signal_{signal}"));
    }
    let text = std::str::from_utf8(&out.stderr).ok()?;
    let value = text
        .lines()
        .rev()
        .find_map(|line| line.trim_end().strip_prefix("diagnostic:"))?;
    valid_diagnostic(value).then(|| value.to_string())
}
/// `exc:Name>Name` (up to four Python class names) or a lowercase fixed code.
pub fn valid_diagnostic(value: &str) -> bool {
    let name = |part: &str| {
        part.len() <= 48
            && part
                .bytes()
                .next()
                .is_some_and(|b| b.is_ascii_alphabetic() || b == b'_')
            && part.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_')
    };
    if let Some(chain) = value.strip_prefix("exc:") {
        let parts: Vec<_> = chain.split('>').collect();
        return parts.len() <= 4 && parts.iter().all(|part| name(part));
    }
    (3..=48).contains(&value.len())
        && value.as_bytes()[0].is_ascii_lowercase()
        && value
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
}
/// Real acquisition progress published by the adapter: the phase, the
/// completion percentage reported by the phone and observed counters.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub phase: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub percent: Option<f64>,
    pub kept: u64,
    pub discarded: u64,
    pub received_bytes: u64,
    pub stored_bytes: u64,
    /// The phone's network is being observed alongside the copy.
    #[serde(default)]
    pub capturing: bool,
    /// The owner started a sysdiagnose on the phone during the copy:
    /// "generating", then "ready". Absent when none was started.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub sysdiagnose: Option<String>,
}
/// Bytes written so far by the files directly in `dir` (the Android bug
/// report while ADB copies it).
fn copied_bytes(dir: &Path) -> u64 {
    std::fs::read_dir(dir)
        .map(|entries| {
            entries
                .filter_map(Result::ok)
                .filter_map(|entry| entry.metadata().ok())
                .filter(|meta| meta.is_file())
                .map(|meta| meta.len())
                .sum()
        })
        .unwrap_or(0)
}
fn acquisition_progress(work: &Path) -> Option<Progress> {
    use std::io::Read;
    let mut bytes = Vec::new();
    std::fs::File::open(work.join("acquisition-status.json"))
        .ok()?
        .take(1025)
        .read_to_end(&mut bytes)
        .ok()?;
    if bytes.len() > 1024 {
        return None;
    }
    let value: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    let phase = value["phase"].as_str()?;
    // Guidance phases come from the phone's own prompts (Trust, passcode).
    if ![
        "acquiring",
        "capturing",
        "awaiting_trust",
        "awaiting_passcode",
        // The phone dropped an unanswered passcode prompt; the copy restarts.
        "passcode_retry",
        // After Trust, waiting for the owner to start the deep check.
        "deep_wait",
        // Paired while searching, waiting for Start on the ready step.
        "trusted",
        // The deep check, prepared on the ready step, is confirmed.
        "deep_ready",
    ]
    .contains(&phase)
    {
        return None;
    }
    let count = |key: &str| value[key].as_u64().unwrap_or(0);
    Some(Progress {
        phase: phase.to_string(),
        percent: value["percent"]
            .as_f64()
            .filter(|p| p.is_finite() && (0.0..=100.0).contains(p)),
        kept: count("kept"),
        discarded: count("discarded"),
        received_bytes: count("receivedBytes"),
        stored_bytes: count("storedBytes"),
        capturing: value["capturing"].as_bool().unwrap_or(false),
        sysdiagnose: value["sysdiagnose"]
            .as_str()
            .filter(|s| ["generating", "ready"].contains(s))
            .map(str::to_owned),
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn the_android_copy_is_measured_by_the_bytes_on_disk() {
        let dir = tempfile::tempdir().unwrap();
        assert_eq!(copied_bytes(dir.path()), 0);
        std::fs::write(dir.path().join("bugreport.zip"), vec![0u8; 4096]).unwrap();
        std::fs::create_dir(dir.path().join("inner")).unwrap();
        assert_eq!(copied_bytes(dir.path()), 4096);
        assert_eq!(copied_bytes(&dir.path().join("missing")), 0);
    }
    #[test]
    fn each_start_choice_has_the_word_the_ios_adapter_reads() {
        assert_eq!(start_word(START_HOLD), b"hold");
        assert_eq!(start_word(START_DEEP), b"deep");
        assert_eq!(start_word(START_COPY), b"no-network");
        assert_eq!(start_word(START_COPY_WITH_NETWORK), b"network");
        assert_eq!(start_word(u8::MAX), b"hold");
    }
    #[test]
    fn progress_reports_only_known_sysdiagnose_states() {
        let work = tempfile::tempdir().unwrap();
        let status = |value: serde_json::Value| {
            std::fs::write(
                work.path().join("acquisition-status.json"),
                value.to_string(),
            )
            .unwrap();
            acquisition_progress(work.path()).unwrap().sysdiagnose
        };
        assert_eq!(status(serde_json::json!({"phase": "acquiring"})), None);
        assert_eq!(
            status(serde_json::json!({"phase": "acquiring", "sysdiagnose": "generating"}))
                .as_deref(),
            Some("generating")
        );
        assert_eq!(
            status(serde_json::json!({"phase": "acquiring", "sysdiagnose": "<script>"})),
            None
        );
    }
    #[test]
    fn progress_accepts_only_real_adapter_phases_with_bounded_input() {
        let work = tempfile::tempdir().unwrap();
        let path = work.path().join("acquisition-status.json");
        assert!(acquisition_progress(work.path()).is_none());
        std::fs::write(&path, r#"{"phase":"capturing"}"#).unwrap();
        assert_eq!(
            acquisition_progress(work.path())
                .map(|p| p.phase)
                .as_deref(),
            Some("capturing")
        );
        std::fs::write(&path, r#"{"phase":"awaiting_passcode"}"#).unwrap();
        assert_eq!(
            acquisition_progress(work.path())
                .map(|p| p.phase)
                .as_deref(),
            Some("awaiting_passcode")
        );
        std::fs::write(&path, r#"{"phase":"passcode_retry"}"#).unwrap();
        assert_eq!(
            acquisition_progress(work.path())
                .map(|p| p.phase)
                .as_deref(),
            Some("passcode_retry")
        );
        std::fs::write(&path, r#"{"phase":"deep_wait","sysdiagnose":"generating"}"#).unwrap();
        let deep = acquisition_progress(work.path()).unwrap();
        assert_eq!(deep.phase, "deep_wait");
        assert_eq!(deep.sysdiagnose.as_deref(), Some("generating"));
        // Paired while searching, waiting for Start.
        std::fs::write(&path, r#"{"phase":"trusted"}"#).unwrap();
        assert_eq!(
            acquisition_progress(work.path())
                .map(|p| p.phase)
                .as_deref(),
            Some("trusted")
        );
        // Prepared in advance and confirmed, waiting for Start.
        std::fs::write(
            &path,
            r#"{"phase":"deep_ready","sysdiagnose":"generating"}"#,
        )
        .unwrap();
        assert_eq!(
            acquisition_progress(work.path())
                .map(|p| p.phase)
                .as_deref(),
            Some("deep_ready")
        );
        for invalid in [r#"{"phase":"completed"}"#, r#"{"phase":"network""#] {
            std::fs::write(&path, invalid).unwrap();
            assert!(acquisition_progress(work.path()).is_none());
        }
        std::fs::write(
            &path,
            r#"{"phase":"acquiring","percent":42.5,"kept":10,"discarded":3,"receivedBytes":900,"storedBytes":400}"#,
        )
        .unwrap();
        assert_eq!(
            acquisition_progress(work.path()),
            Some(Progress {
                phase: "acquiring".into(),
                percent: Some(42.5),
                kept: 10,
                discarded: 3,
                received_bytes: 900,
                stored_bytes: 400,
                capturing: false,
                sysdiagnose: None,
            })
        );
        std::fs::write(&path, r#"{"phase":"awaiting_passcode","capturing":true}"#).unwrap();
        assert!(acquisition_progress(work.path()).unwrap().capturing);
        std::fs::write(&path, r#"{"phase":"acquiring","capturing":"yes"}"#).unwrap();
        assert!(!acquisition_progress(work.path()).unwrap().capturing);
        // Out-of-range or negative figures are dropped, never passed through.
        std::fs::write(&path, r#"{"phase":"acquiring","percent":140,"kept":-1}"#).unwrap();
        let p = acquisition_progress(work.path()).unwrap();
        assert_eq!((p.percent, p.kept), (None, 0));
        std::fs::write(path, vec![b' '; 1025]).unwrap();
        assert!(acquisition_progress(work.path()).is_none());
    }
    #[cfg(unix)]
    #[test]
    fn iphone_discovery_allows_cold_start_beyond_old_twenty_second_limit() {
        use sha2::{Digest, Sha256};
        use std::os::unix::fs::PermissionsExt;
        let work = tempfile::tempdir().unwrap();
        let script = b"#!/bin/sh\nsleep 21\nprintf '[]'\n";
        let executable = work.path().join("ios-fixture");
        std::fs::write(&executable, script).unwrap();
        std::fs::set_permissions(&executable, std::fs::Permissions::from_mode(0o755)).unwrap();
        let manifest = serde_json::json!([{"id":"ios-usb","file":"ios-fixture","version":"fixture","sha256":enigm_scan_core::hex(&Sha256::digest(script))}]);
        let catalog = Catalog::new(
            work.path().to_path_buf(),
            &serde_json::to_vec(&manifest).unwrap(),
        )
        .unwrap();
        let result = devices(&catalog, "ios", work.path(), &AtomicBool::new(false), None).unwrap();
        assert!(result.is_empty());
    }
    #[test]
    fn diagnostics_expose_only_fixed_codes_and_exception_class_names() {
        let out = |stderr: &str, signal: Option<i32>| process::Output {
            code: if signal.is_some() { None } else { Some(1) },
            signal,
            stdout: Vec::new(),
            stderr: stderr.as_bytes().to_vec(),
        };
        assert_eq!(
            failure_diagnostic(&out(
                "ios_transport_failed\ndiagnostic:exc:RuntimeError>OSError\n",
                None
            ))
            .as_deref(),
            Some("exc:RuntimeError>OSError")
        );
        assert_eq!(
            failure_diagnostic(&out("diagnostic:acquisition_incomplete", None)).as_deref(),
            Some("acquisition_incomplete")
        );
        for unsafe_line in [
            "diagnostic:exc:OSError: [Errno 28] /private/var/secret",
            "diagnostic:exc:A>B>C>D>E",
            "diagnostic:Device of Someone",
            "diagnostic:exc:",
            "Traceback (most recent call last): secret",
        ] {
            assert_eq!(
                failure_diagnostic(&out(unsafe_line, None)),
                None,
                "{unsafe_line}"
            );
        }
        #[cfg(unix)]
        {
            assert_eq!(
                failure_diagnostic(&out("", Some(libc::SIGXCPU))).as_deref(),
                Some("engine_cpu_limit")
            );
            assert_eq!(
                failure_diagnostic(&out("", Some(libc::SIGXFSZ))).as_deref(),
                Some("engine_file_size_limit")
            );
            assert_eq!(
                failure_diagnostic(&out("", Some(libc::SIGKILL))).as_deref(),
                Some("engine_signal_9")
            );
        }
    }
    #[test]
    fn iphone_listing_keeps_a_bounded_usb_speed() {
        let parsed: Vec<Device> = serde_json::from_str(
            r#"[{"id":"device-1","platform":"ios","authorized":true,"usbSpeed":480000000}]"#,
        )
        .unwrap();
        assert_eq!(parsed[0].usb_speed, Some(480_000_000));
        assert!(serde_json::to_string(&parsed[0])
            .unwrap()
            .contains("\"usbSpeed\":480000000"));
        let legacy: Vec<Device> =
            serde_json::from_str(r#"[{"id":"device-1","platform":"ios","authorized":true}]"#)
                .unwrap();
        assert_eq!(legacy[0].usb_speed, None);
        assert!(!serde_json::to_string(&legacy[0])
            .unwrap()
            .contains("usbSpeed"));
    }
    #[test]
    fn preserves_authorization_state() {
        let d=parse_devices("android","List of devices attached\nSERIAL1 device product:test\nSERIAL2 unauthorized\nSERIAL3 offline\n");
        assert_eq!(d.len(), 3);
        assert!(d[0].authorized);
        assert!(!d[1].authorized);
        assert!(!d[2].authorized)
    }
    #[test]
    fn keeps_phones_that_are_still_negotiating_or_lack_permission() {
        let d = parse_devices(
            "android",
            "List of devices attached\nA1 authorizing usb:1-2 transport_id:1\nA2 connecting usb:1-3\nA3        no permissions (missing udev rules? user is in the plugdev group); see [http://developer.android.com/tools/device.html] usb:1-2 transport_id:1\n",
        );
        assert_eq!(d.len(), 3);
        assert!(d.iter().all(|d| !d.authorized));
        assert_eq!(d[0].issue, None);
        assert_eq!(d[2].issue.as_deref(), Some("usb_permission"));
    }
    #[test]
    #[cfg(unix)]
    fn behavior_commands_run_in_a_posix_shell_with_phone_tools() {
        // Stand-ins for the phone's `settings`, `dumpsys`, `cmd`, `getprop`
        // and `getenforce`, so the exact command text is executed.
        let bin = tempfile::tempdir().unwrap();
        let tool = |name: &str, body: &str| {
            let path = bin.path().join(name);
            std::fs::write(&path, format!("#!/bin/sh\n{body}\n")).unwrap();
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
        };
        tool(
            "settings",
            r#"[ "$3" = enabled_accessibility_services ] && echo com.evil.spy/.Acc || echo null"#,
        );
        tool(
            "dumpsys",
            r#"case "$1" in
package) printf '  Package [com.evil.spy] (1):\n    firstInstallTime=2026-11-20 09:13:44\n      android.permission.RECORD_AUDIO: granted=true\n      android.permission.INTERNET: granted=true\n      android.permission.CAMERA\n' ;;
appops) printf '  Uid 1:\n    Package com.evil.spy:\n      %s (allow):\n          Access: [bg-s] 2026-11-24 21:00:00.000 (-1h) duration=+1s\n' "$3" ;;
esac"#,
        );
        tool(
            "cmd",
            "printf '1 activities found:\\n    com.whatsapp/.Main\\n'",
        );
        tool(
            "getprop",
            "printf '[ro.debuggable]: [0]\\n[ro.build.tags]: [release-keys]\\n'",
        );
        tool("getenforce", "echo Enforcing");
        let run = |command: BehaviorCommand| {
            let out = std::process::Command::new("sh")
                .arg("-c")
                .arg(command.text())
                .env("PATH", format!("{}:/usr/bin:/bin", bin.path().display()))
                .output()
                .unwrap();
            assert!(out.status.success());
            String::from_utf8(out.stdout).unwrap()
        };
        use enigm_scan_core::behavior;
        let settings = behavior::parse_settings(&run(BehaviorCommand::Settings));
        assert_eq!(
            settings["enabled_accessibility_services"],
            "com.evil.spy/.Acc"
        );
        assert_eq!(settings.len(), 1);
        let grants = behavior::parse_package_grants(&run(BehaviorCommand::Permissions));
        assert_eq!(
            grants["com.evil.spy"].0.iter().collect::<Vec<_>>(),
            vec!["RECORD_AUDIO"]
        );
        let ops: Vec<_> = behavior::WATCHED_OPS
            .iter()
            .flat_map(|op| behavior::parse_app_ops(&run(BehaviorCommand::AppOps(op))))
            .collect();
        assert_eq!(ops.len(), behavior::WATCHED_OPS.len());
        assert!(ops
            .iter()
            .all(|o| o.state.as_deref() == Some("bg") && o.seconds_ago == 3600));
        assert_eq!(
            behavior::parse_launchable(&run(BehaviorCommand::Launcher)),
            Some(vec!["com.whatsapp".to_string()])
        );
        let integrity = run(BehaviorCommand::Integrity);
        assert!(integrity.contains("#selinux\nEnforcing\n#su\n"));
        assert_eq!(behavior::parse_properties(&integrity).len(), 2);
    }
    #[test]
    fn rejects_argument_injection_serials() {
        assert!(!valid_id("-s evil device"));
        assert!(!valid_id("$(touch secret)"));
        assert!(valid_id("00008110-00112233"))
    }
}
