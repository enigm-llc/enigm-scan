#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use enigm_scan_core::{model::Report, rules::VerifiedRules};
use enigm_scan_runtime::{
    acquire, adb, awake,
    engines::{analyze_mvt, decrypt_ios_backup, Catalog},
    intelligence,
};
use serde::{Deserialize, Serialize};
use std::{
    io::Read,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, AtomicU8, Ordering},
        Arc, Mutex,
    },
};
use tauri::{Manager, State, WebviewWindow};
mod menu;
/// Set once the window has cleared the session and is quitting: from then
/// on, closing and quitting go straight through.
static QUITTING: AtomicBool = AtomicBool::new(false);
/// Closing or quitting goes through the window first (`DesktopApp`): it
/// deletes the session and shows the Enigm invitation, then quits. Called for
/// the close button, Quit and Cmd+Q.
fn ask_to_close(app: &tauri::AppHandle) {
    // A window that stopped answering must not trap the person: a third
    // close within a few seconds quits anyway (the session is still cleared).
    static ASKED: Mutex<Vec<std::time::Instant>> = Mutex::new(Vec::new());
    if let Ok(mut asked) = ASKED.lock() {
        asked.retain(|at| at.elapsed() < std::time::Duration::from_secs(8));
        asked.push(std::time::Instant::now());
        if asked.len() >= 3 {
            QUITTING.store(true, Ordering::SeqCst);
            app.exit(0);
            return;
        }
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        let _ = window.eval("window.__enigmCloseRequested?.()");
    }
}
/// The interface language, for windows the app opens itself.
static LANGUAGE: Mutex<String> = Mutex::new(String::new());
/// Whether a page may load inside an app window: only the app's own pages.
/// Any other https link opens in the system browser instead.
fn own_page(url: &tauri::Url) -> bool {
    let own = url.scheme() == "tauri"
        || url.host_str() == Some("tauri.localhost")
        || (cfg!(debug_assertions) && url.host_str() == Some("127.0.0.1"));
    if !own {
        if let Some(link) = external_link(url.as_str()) {
            let _ = open_in_browser(&link);
        }
    }
    own
}
/// Windows start hidden and appear once their page has loaded, so the
/// webview's blank white canvas never shows before the app's own colours.
fn show_when_loaded(window: tauri::WebviewWindow, payload: tauri::webview::PageLoadPayload<'_>) {
    if payload.event() == tauri::webview::PageLoadEvent::Finished {
        let _ = window.show();
    }
}
/// The About window, opened from the macOS app menu, laid out like the
/// system's own: the app icon, name, version, release date and copyright. It
/// runs no native commands.
fn open_about(app: &tauri::AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("about") {
        window.show()?;
        return window.set_focus();
    }
    let language = LANGUAGE
        .lock()
        .map(|language| language.clone())
        .unwrap_or_default();
    let page = format!(
        "index.html?about&version={}&released={}",
        app.package_info().version,
        env!("ENIGM_RELEASE_DATE")
    );
    let builder =
        tauri::WebviewWindowBuilder::new(app, "about", tauri::WebviewUrl::App(page.into()))
            .title(menu::about_title(&language))
            // macOS adds the transparent title bar (28 px) to the content.
            .inner_size(
                350.0,
                if cfg!(target_os = "macos") {
                    318.0
                } else {
                    290.0
                },
            )
            .resizable(false)
            .maximizable(false)
            .minimizable(false)
            .center()
            .visible(false)
            .incognito(true)
            .on_page_load(show_when_loaded)
            .on_navigation(own_page)
            .on_new_window(|url, _| {
                if let Some(link) = external_link(url.as_str()) {
                    let _ = open_in_browser(&link);
                }
                tauri::webview::NewWindowResponse::Deny
            });
    // macOS: the content runs under a transparent title bar, as in the
    // system's own apps, instead of a separate bar of a slightly different
    // grey.
    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true);
    builder.build()?;
    Ok(())
}
const BUILTIN_BUNDLE: &[u8] = include_bytes!("../resources/intelligence/bundle-v2.json");
const PUBLIC_KEY: &[u8; 32] = include_bytes!("../resources/intelligence/public-key.bin");
const MIN_RULE_VERSION: u64 = 2026112301;
const ENGINE_MANIFEST: &[u8] = include_bytes!("../resources/engines/manifest.json");
#[derive(Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
struct Status {
    phase: String,
    artifacts: u64,
    error: Option<String>,
    report: Option<Report>,
    /// Real device acquisition progress (phone-reported percentage, counters).
    acquisition: Option<acquire::Progress>,
    /// Allowlisted diagnostic for an unexplained failure (fixed code or
    /// exception class names only; never messages, paths or device data).
    diagnostic: Option<String>,
}
#[derive(Default)]
struct Selection {
    evidence: Option<PathBuf>,
    pcap: Option<PathBuf>,
    rules: Option<Vec<u8>>,
    usb: Option<Arc<adb::Session>>,
}
struct Agent {
    status: Arc<Mutex<Status>>,
    selection: Mutex<Selection>,
    running: Arc<AtomicBool>,
    cancel: Arc<AtomicBool>,
    /// The owner continues without the deep check (see `skip_deep_check`).
    skip_deep: Arc<AtomicBool>,
    /// A deep check prepared in advance holds the copy until Start (see
    /// `begin_copy`).
    start: Arc<AtomicU8>,
    catalog: Arc<Catalog>,
    data: PathBuf,
}
fn local(window: &WebviewWindow) -> Result<(), String> {
    if window.label() != "main" {
        return Err("origin_denied".into());
    }
    let url = window.url().map_err(|_| "origin_denied")?;
    let packaged = url.scheme() == "tauri"
        || ((url.scheme() == "https" || url.scheme() == "http")
            && url.host_str() == Some("tauri.localhost"));
    let dev = cfg!(debug_assertions)
        && url.scheme() == "http"
        && url.host_str() == Some("127.0.0.1")
        && url.port() == Some(5173);
    if !packaged && !dev {
        return Err("origin_denied".into());
    }
    Ok(())
}
fn idle(a: &Agent) -> Result<(), String> {
    if a.running.load(Ordering::SeqCst) {
        Err("scan_running".into())
    } else {
        Ok(())
    }
}
/// What a file chooser asks for.
enum Pick {
    Folder,
    Open(&'static str, &'static [&'static str]),
    Save(String, String),
}
/// A file or folder chooser from the app window, brought to the front like
/// `ask`. On Linux it is GTK's native chooser (the desktop portal when there
/// is one, GTK's own otherwise): the default backend needed a portal or
/// zenity, and without them nothing opened.
async fn pick_path(window: &WebviewWindow, pick: Pick) -> Option<std::path::PathBuf> {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_always_on_top(true);
    let _ = window.set_focus();
    let path = chooser(window, pick).await;
    let _ = window.set_always_on_top(false);
    path
}
#[cfg(target_os = "linux")]
async fn chooser(window: &WebviewWindow, pick: Pick) -> Option<std::path::PathBuf> {
    let (tx, rx) = std::sync::mpsc::channel();
    let target = window.clone();
    let show = move |blocking: bool| {
        use gtk::prelude::*;
        let parent = target.gtk_window().ok();
        let action = match pick {
            Pick::Folder => gtk::FileChooserAction::SelectFolder,
            Pick::Open(..) => gtk::FileChooserAction::Open,
            Pick::Save(..) => gtk::FileChooserAction::Save,
        };
        let dialog =
            gtk::FileChooserNative::new(Some("Enigm Scan"), parent.as_ref(), action, None, None);
        let filter = |name: &str, extensions: &[&str]| {
            let filter = gtk::FileFilter::new();
            filter.set_name(Some(name));
            for extension in extensions {
                filter.add_pattern(&format!("*.{extension}"));
            }
            filter
        };
        match &pick {
            Pick::Folder => {}
            Pick::Open(name, extensions) => dialog.add_filter(filter(name, extensions)),
            Pick::Save(file, extension) => {
                dialog.add_filter(filter(&extension.to_uppercase(), &[extension.as_str()]));
                dialog.set_current_name(file);
                dialog.set_do_overwrite_confirmation(true);
            }
        }
        if blocking {
            let path = (dialog.run() == gtk::ResponseType::Accept)
                .then(|| dialog.filename())
                .flatten();
            dialog.destroy();
            let _ = tx.send(path);
            return;
        }
        // Answered through a callback so the main loop keeps serving the
        // browser while the chooser is open (see `question`).
        let sender = std::sync::Mutex::new(Some(tx));
        // A native chooser is not a window: nothing else keeps it alive while
        // it is shown, so the response handler holds a reference.
        let hold = dialog.clone();
        dialog.connect_response(move |dialog, answer| {
            let _alive = &hold;
            let path = (answer == gtk::ResponseType::Accept)
                .then(|| dialog.filename())
                .flatten();
            if let Some(tx) = sender.lock().ok().and_then(|mut slot| slot.take()) {
                let _ = tx.send(path);
            }
            dialog.destroy();
        });
        dialog.show();
    };
    if gtk::is_initialized_main_thread() {
        show(true);
        return rx.recv().ok().flatten();
    }
    window.run_on_main_thread(move || show(false)).ok()?;
    tauri::async_runtime::spawn_blocking(move || rx.recv().ok().flatten())
        .await
        .ok()
        .flatten()
}
#[cfg(not(target_os = "linux"))]
async fn chooser(_window: &WebviewWindow, pick: Pick) -> Option<std::path::PathBuf> {
    let dialog = rfd::AsyncFileDialog::new();
    let picked = match pick {
        Pick::Folder => dialog.pick_folder().await,
        Pick::Open(name, extensions) => dialog.add_filter(name, extensions).pick_file().await,
        Pick::Save(file, extension) => {
            dialog
                .set_file_name(file)
                .add_filter(extension.to_uppercase(), &[extension.as_str()])
                .save_file()
                .await
        }
    };
    picked.map(|handle| handle.path().to_path_buf())
}
#[tauri::command]
async fn choose_evidence(
    window: WebviewWindow,
    state: State<'_, Agent>,
) -> Result<Option<String>, String> {
    local(&window)?;
    idle(&state)?;
    let picked = pick_path(&window, Pick::Folder).await;
    idle(&state)?;
    if let Some(picked) = picked {
        let path = picked.canonicalize().map_err(|_| "evidence_unavailable")?;
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
        state
            .selection
            .lock()
            .map_err(|_| "state_unavailable")?
            .evidence = Some(path);
        Ok(Some(name))
    } else {
        Ok(None)
    }
}
#[tauri::command]
async fn choose_pcap(
    window: WebviewWindow,
    state: State<'_, Agent>,
) -> Result<Option<String>, String> {
    local(&window)?;
    idle(&state)?;
    let picked = pick_path(&window, Pick::Open("PCAP", &["pcap", "cap"])).await;
    idle(&state)?;
    if let Some(picked) = picked {
        let path = picked.canonicalize().map_err(|_| "pcap_unavailable")?;
        if std::fs::metadata(&path)
            .map_err(|_| "pcap_unavailable")?
            .len()
            > 128 * 1024 * 1024
        {
            return Err("pcap_size_invalid".into());
        }
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
        state
            .selection
            .lock()
            .map_err(|_| "state_unavailable")?
            .pcap = Some(path);
        Ok(Some(name))
    } else {
        Ok(None)
    }
}
#[tauri::command]
async fn update_intelligence(
    window: WebviewWindow,
    state: State<'_, Agent>,
) -> Result<bool, String> {
    local(&window)?;
    idle(&state)?;
    let downloaded = tauri::async_runtime::spawn_blocking(intelligence::download)
        .await
        .map_err(|_| "rules_download_failed")?;
    idle(&state)?;
    let now = time::OffsetDateTime::now_utc().unix_timestamp();
    let floor = minimum(&state.data)?;
    let cached = intelligence::cached(&state.data);
    let mut selection = state.selection.lock().map_err(|_| "state_unavailable")?;
    let mut candidates = vec![BUILTIN_BUNDLE];
    if let Some(ref bytes) = cached {
        candidates.push(bytes);
    }
    if let Some(ref bytes) = selection.rules {
        candidates.push(bytes);
    }
    if let Ok(ref bytes) = downloaded {
        candidates.push(bytes);
    }
    let bytes = intelligence::select(candidates, PUBLIC_KEY, now, floor)?;
    let fresh = downloaded.as_ref().is_ok_and(|remote| remote == &bytes);
    intelligence::save(&state.data, &bytes, PUBLIC_KEY, now, floor)?;
    selection.rules = Some(bytes);
    Ok(fresh)
}
/// Highest authenticated, unexpired bundle among the embedded copy, the verified
/// local cache and the session selection. An expired embedded bundle must not
/// disable an app that already holds a newer valid update.
fn current_rules(data: &std::path::Path, selected: Option<&[u8]>) -> Result<Vec<u8>, String> {
    let cached = intelligence::cached(data);
    let mut candidates = vec![BUILTIN_BUNDLE];
    if let Some(ref bytes) = cached {
        candidates.push(bytes);
    }
    if let Some(bytes) = selected {
        candidates.push(bytes);
    }
    intelligence::select(
        candidates,
        PUBLIC_KEY,
        time::OffsetDateTime::now_utc().unix_timestamp(),
        minimum(data)?,
    )
}
/// Device backups can be tens of gigabytes. Many Linux distributions mount
/// `/tmp` as RAM-backed tmpfs, so use the disk-backed `/var/tmp` unless the
/// user chose a location through TMPDIR. Other systems keep their temp dir.
fn scan_workspace_root() -> PathBuf {
    #[cfg(target_os = "linux")]
    if std::env::var_os("TMPDIR").is_none() {
        let disk = PathBuf::from("/var/tmp");
        if disk.is_dir() {
            return disk;
        }
    }
    // Only the base: each session creates its own randomly named folder in it,
    // mode 0700 and locked while in use.
    // nosemgrep: rust.lang.security.temp-dir.temp-dir
    std::env::temp_dir()
}
fn minimum(data: &std::path::Path) -> Result<u64, String> {
    let path = data.join("rules-version");
    match std::fs::read_to_string(path) {
        Ok(s) => s
            .trim()
            .parse::<u64>()
            .map(|n| n.max(MIN_RULE_VERSION))
            .map_err(|_| "rules_state_invalid".into()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(MIN_RULE_VERSION),
        Err(_) => Err("rules_state_unavailable".into()),
    }
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Capabilities {
    rules: usize,
    rule_version: u64,
    /// The iPhone adapter is present: backup, crash reports, the deep check.
    ios_usb: bool,
    /// ADB is present: Android discovery, polling and open connections.
    android_usb: bool,
    mvt_ios: bool,
    mvt_android: bool,
}
#[tauri::command]
fn capabilities(window: WebviewWindow, state: State<'_, Agent>) -> Result<Capabilities, String> {
    local(&window)?;
    let selection = state.selection.lock().map_err(|_| "state_unavailable")?;
    let bytes = current_rules(&state.data, selection.rules.as_deref())?;
    let rules = VerifiedRules::verify(
        &bytes,
        PUBLIC_KEY,
        time::OffsetDateTime::now_utc().unix_timestamp(),
        minimum(&state.data)?,
    )?;
    // Each check verifies a whole engine folder: run it once per engine.
    let ios = state.catalog.available("ios-usb");
    let android = state.catalog.available("adb");
    Ok(Capabilities {
        rules: rules.len(),
        rule_version: rules.version(),
        ios_usb: ios,
        android_usb: android,
        mvt_ios: state.catalog.available("mvt-ios"),
        mvt_android: state.catalog.available("mvt-android"),
    })
}
#[tauri::command]
async fn list_devices(
    window: WebviewWindow,
    state: State<'_, Agent>,
    device: String,
    consent: bool,
) -> Result<Vec<acquire::Device>, String> {
    local(&window)?;
    idle(&state)?;
    // The owner confirms the phone is theirs, or that they have its owner's
    // permission, with the checkbox before searching.
    if !consent {
        return Err("consent_required".into());
    }
    let catalog = state.catalog.clone();
    let existing = state
        .selection
        .lock()
        .map_err(|_| "state_unavailable")?
        .usb
        .clone();
    let (devices, session) = tauri::async_runtime::spawn_blocking(move || -> Result<_, String> {
        let work = tempfile::tempdir().map_err(|_| "workspace_failed")?;
        if !["auto", "android", "ios"].contains(&device.as_str()) {
            return Err("invalid_device".into());
        }
        let android = (device == "android" || device == "auto") && catalog.available("adb");
        let ios = (device == "ios" || device == "auto") && catalog.available("ios-usb");
        let mut fresh = false;
        let session = if android {
            Some(match existing.filter(|session| session.alive()) {
                Some(session) => session,
                None => {
                    fresh = true;
                    Arc::new(adb::Session::start(&catalog)?)
                }
            })
        } else {
            None
        };
        let mut devices = Vec::new();
        if android {
            // A new ADB server needs a moment for its first USB scan, and a
            // phone that shows "Allow USB debugging?" stays unauthorized until
            // the person accepts it. Wait briefly for the first, and longer
            // for the second, so one search is enough.
            let start = std::time::Instant::now();
            let scan = std::time::Duration::from_secs(if fresh { 3 } else { 0 });
            let approval = std::time::Duration::from_secs(25);
            loop {
                let found = acquire::devices(
                    &catalog,
                    "android",
                    work.path(),
                    &AtomicBool::new(false),
                    session.as_deref(),
                )?;
                let ready = found.iter().any(|d| d.authorized);
                // Waiting only helps a phone that is asking for approval.
                let pending = !ready && found.iter().any(|d| d.issue.is_none());
                let elapsed = start.elapsed();
                if ready || (!pending && elapsed >= scan) || (pending && elapsed >= approval) {
                    if !ready
                        && !found.is_empty()
                        && found
                            .iter()
                            .all(|d| d.issue.as_deref() == Some("usb_permission"))
                    {
                        return Err("android_usb_permission".into());
                    }
                    devices.extend(found);
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(700));
            }
        }
        if ios {
            // In an automatic search, an iPhone transport that cannot start
            // (no Apple driver, no usbmuxd) must not hide an Android phone that
            // was found. Report its error only when nothing was found at all.
            match acquire::devices(
                &catalog,
                "ios",
                work.path(),
                &AtomicBool::new(false),
                session.as_deref(),
            ) {
                Ok(found) => devices.extend(found),
                // With nothing found, a missing Apple USB service says nothing
                // about an Android phone that still needs USB debugging: on
                // Linux usbmuxd only runs while an Apple device is plugged in.
                // Report "no phone yet" instead, whose guidance covers both.
                Err(error)
                    if device == "auto"
                        && devices.is_empty()
                        && error == "ios_transport_unavailable" => {}
                Err(error) if device == "ios" || devices.is_empty() => return Err(error),
                Err(_) => {}
            }
        }
        Ok((devices, session))
    })
    .await
    .map_err(|_| "engine_failed")??;
    idle(&state)?;
    state.selection.lock().map_err(|_| "state_unavailable")?.usb = session;
    Ok(devices)
}
/// Android phones seen by the ADB server of the current session, without a new
/// consent question: the owner already authorized this search, and only that
/// session's server is asked. Lets the web wait for "Allow USB debugging"
/// without the person searching again. Never starts the iPhone adapter.
#[tauri::command]
async fn refresh_devices(
    window: WebviewWindow,
    state: State<'_, Agent>,
) -> Result<Vec<acquire::Device>, String> {
    local(&window)?;
    idle(&state)?;
    let catalog = state.catalog.clone();
    let session = state
        .selection
        .lock()
        .map_err(|_| "state_unavailable")?
        .usb
        .clone()
        .filter(|session| session.alive())
        .ok_or("adb_session_expired")?;
    tauri::async_runtime::spawn_blocking(move || {
        let work = tempfile::tempdir().map_err(|_| "workspace_failed")?;
        acquire::devices(
            &catalog,
            "android",
            work.path(),
            &AtomicBool::new(false),
            Some(&session),
        )
    })
    .await
    .map_err(|_| "engine_failed")?
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ScanRequest {
    device: String,
    consent: bool,
    phone_ip: Option<String>,
    pcap_consent: bool,
    usb_id: Option<String>,
    backup_password: Option<String>,
    /// iPhone: hold the copy until the owner starts the deep check.
    #[serde(default)]
    deep_check: bool,
    /// iPhone deep check prepared in advance: after Trust and its
    /// confirmation, wait for `begin_copy` before copying.
    #[serde(default)]
    hold: bool,
}
#[tauri::command]
fn start_scan(
    window: WebviewWindow,
    state: State<'_, Agent>,
    request: ScanRequest,
) -> Result<(), String> {
    local(&window)?;
    idle(&state)?;
    if !["ios", "android"].contains(&request.device.as_str()) {
        return Err("invalid_device".into());
    }
    if request.backup_password.as_ref().is_some_and(|password| {
        request.device != "ios" || password.is_empty() || password.len() > 4096
    }) {
        return Err("backup_password_invalid".into());
    }
    if !request.consent {
        return Err("consent_required".into());
    }
    let mut selection = state.selection.lock().map_err(|_| "state_unavailable")?;
    let evidence = selection.evidence.clone();
    if request.usb_id.is_none() && evidence.is_none() {
        return Err("evidence_required".into());
    }
    if request.device == "android"
        && request.usb_id.is_some()
        && !selection
            .usb
            .as_ref()
            .is_some_and(|session| session.alive())
    {
        return Err("adb_session_required".into());
    }
    let pcap = selection.pcap.clone();
    // iPhone: observe the phone's traffic for a fixed window. Android: read
    // the phone's open connections (no traffic). Both only when asked.
    let capture_network = request.pcap_consent && pcap.is_none() && request.usb_id.is_some();

    let phone = if pcap.is_some() {
        if !request.pcap_consent {
            return Err("pcap_consent_required".into());
        }
        Some(
            request
                .phone_ip
                .as_deref()
                .ok_or("phone_ip_required")?
                .parse::<std::net::IpAddr>()
                .map_err(|_| "phone_ip_invalid")?,
        )
    } else {
        None
    };
    let rules_bytes = current_rules(&state.data, selection.rules.as_deref())?;
    let rules = VerifiedRules::verify(
        &rules_bytes,
        PUBLIC_KEY,
        time::OffsetDateTime::now_utc().unix_timestamp(),
        minimum(&state.data)?,
    )?;
    // Persist the authenticated highest version before use; missing state never permits versions below the compiled floor.
    std::fs::write(
        state.data.join("rules-version.tmp"),
        rules.version().to_string(),
    )
    .map_err(|_| "rules_state_unavailable")?;
    #[cfg(windows)]
    if state.data.join("rules-version").exists() {
        std::fs::remove_file(state.data.join("rules-version"))
            .map_err(|_| "rules_state_unavailable")?;
    }
    std::fs::rename(
        state.data.join("rules-version.tmp"),
        state.data.join("rules-version"),
    )
    .map_err(|_| "rules_state_unavailable")?;
    if state.running.swap(true, Ordering::SeqCst) {
        return Err("scan_running".into());
    }
    state.cancel.store(false, Ordering::SeqCst);
    state.skip_deep.store(false, Ordering::SeqCst);
    state.start.store(acquire::START_HOLD, Ordering::SeqCst);
    *state.status.lock().map_err(|_| "state_unavailable")? = Status {
        phase: "acquiring".into(),
        ..Default::default()
    };
    selection.rules = Some(rules_bytes);
    let usb = selection.usb.take();
    drop(selection);
    let status = state.status.clone();
    let running = state.running.clone();
    let cancel = state.cancel.clone();
    let skip_deep = state.skip_deep.clone();
    let deep_check = request.deep_check && request.device == "ios";
    let held = deep_check && request.hold;
    let start = state.start.clone();
    let catalog = state.catalog.clone();
    std::thread::spawn(move || {
        // Held for the whole scan on this thread; dropping it (success,
        // failure or cancellation) lets the computer sleep again.
        let _awake = awake::KeepAwake::start();
        let run = || -> Result<Report, String> {
            let work = tempfile::Builder::new()
                .prefix("enigm-scan-")
                .tempdir_in(scan_workspace_root())
                .map_err(|_| "workspace_failed")?;
            // Marks the workspace as in use, so the next start removes it if
            // this process is killed before it can (see `remove_leftovers`).
            let lock =
                enigm_scan_runtime::session::hold(work.path()).map_err(|_| "workspace_failed")?;
            let acquired = request.usb_id.is_some();
            let target = if let Some(id) = request.usb_id {
                acquire::acquire(
                    &catalog,
                    &request.device,
                    &id,
                    work.path(),
                    &cancel,
                    usb.as_deref(),
                    &acquire::Options {
                        password_supplied: request.backup_password.is_some(),
                        capture_network,
                        deep_check,
                        skip_deep_check: Some(&skip_deep),
                        start: held.then_some(start.as_ref()),
                    },
                    &|progress| {
                        if let Ok(mut s) = status.lock() {
                            s.phase = progress.phase.clone();
                            s.acquisition = Some(progress.clone());
                        }
                    },
                    &|code| {
                        if let Ok(mut s) = status.lock() {
                            s.diagnostic = Some(code.to_string());
                        }
                    },
                )?
            } else {
                evidence.ok_or("evidence_required")?
            };
            // Prepared in advance, network observation was chosen at Start.
            let capture_network = if held {
                start.load(Ordering::SeqCst) == acquire::START_COPY_WITH_NETWORK
            } else {
                capture_network
            };
            let usb_cleanup = usb
                .as_ref()
                .map(|session| session.shutdown())
                .unwrap_or(true);
            drop(usb);
            let root = if target.is_dir() {
                target.as_path()
            } else {
                target.parent().ok_or("evidence_unavailable")?
            };
            // USB acquisitions already live in the private workspace: sanitize
            // them in place. User-selected folders are copied so external
            // parsers never receive the original files.
            let (mut snapshot, copied) = if acquired {
                let checked = enigm_scan_core::evidence::sanitize_in_place(root, &cancel)?;
                (root.to_path_buf(), checked)
            } else {
                let path = work.path().join("evidence-snapshot");
                let copied = enigm_scan_core::evidence::snapshot(root, &path, &cancel)?;
                (path, copied)
            };
            let decrypted = request.backup_password.is_some();
            if let Some(password) = request.backup_password {
                if let Ok(mut s) = status.lock() {
                    s.phase = "decrypting".into();
                }
                let output = work.path().join("decrypted-backup");
                decrypt_ios_backup(
                    &catalog,
                    &snapshot,
                    &output,
                    work.path(),
                    &cancel,
                    &password,
                )?;
                drop(password);
                let checked = enigm_scan_core::evidence::sanitize_in_place(&output, &cancel)?;
                if checked.skipped != 0 {
                    return Err("backup_decryption_incomplete".into());
                }
                snapshot = output;
            }
            if let Ok(mut s) = status.lock() {
                s.phase = "analyzing".into();
            }
            let parser_target = if target.is_dir() {
                snapshot.clone()
            } else {
                snapshot.join(target.file_name().ok_or("evidence_path_invalid")?)
            };
            let mut report = enigm_scan_core::scan::scan_directory(
                &snapshot,
                &request.device,
                &rules,
                &cancel,
                |n| {
                    if let Ok(mut s) = status.lock() {
                        s.artifacts = n
                    }
                },
            )?;
            if let Ok(mut s) = status.lock() {
                s.phase = "forensics".into()
            }
            let complete = copied.skipped == 0 && !copied.truncated;
            report.check("evidence_snapshot", if complete { "completed" } else { "skipped" },
                &if acquired {
                    format!("{} acquired files checked in place inside the private temporary workspace; {} links or special entries removed before parsing. No additional copy was made.", copied.files, copied.skipped)
                } else {
                    format!("{} authorized files copied to a private parser workspace; {} entries omitted{}. Original files were not passed to external parsers. Streaming copy checks available disk space and preserves a free-space reserve; safety limits: 1000000 entries, depth 40, 2 hours.", copied.files, copied.skipped, if copied.truncated { "; copy stopped at a safety limit" } else { "" })
                });
            if copied.truncated {
                report.limitations.push("The evidence copy stopped at a safety limit. Only the copied subset was analyzed; remaining files were not examined.".into());
            }
            if let Ok(bytes) = std::fs::read(work.path().join("acquisition-summary.json")) {
                if let Ok(value) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                    if value["policy"] == "personal-library-media-v1" {
                        let excluded = value["excludedMediaFiles"].as_u64().unwrap_or(0);
                        report.check("media_selection", "completed", &format!("{} personal photo/video payloads omitted from storage. Original backup manifest, library databases, message attachments and unknown paths retained. Apple may still transfer omitted payloads over USB.", excluded));
                        report.limitations.push("Personal photo/video payloads in recognized library paths were intentionally not stored or content-scanned. Library metadata and potentially relevant message/app attachments were retained. This selective acquisition is not a complete device backup.".into());
                    }
                }
            }
            if decrypted {
                report.check("backup_decryption", "completed", "The selected backup was unlocked locally with the supplied password. Only available copied artifacts were decrypted; absent backup files cannot be recovered. Decrypted data is confined to the temporary session.");
            }
            if let Ok(bytes) = std::fs::read(work.path().join(acquire::ANDROID_INVENTORY)) {
                if let Ok(inventory) =
                    serde_json::from_slice::<enigm_scan_core::android::Inventory>(&bytes)
                {
                    enigm_scan_core::android::analyze(&inventory, &rules, &mut report);
                }
            }
            // iPhone process traces: crash reports and the shutdown log.
            if request.device == "ios" {
                enigm_scan_core::ios_diagnostics::analyze(
                    &work.path().join(acquire::IOS_DIAGNOSTICS),
                    &rules,
                    &mut report,
                );
            }
            // An Android bugreport is one zip holding the phone's dumps: count
            // the files inside it as the files reviewed.
            if request.device == "android" {
                if let Some(entries) = enigm_scan_core::evidence::zip_entries(&parser_target) {
                    report.artifacts_analyzed = report.artifacts_analyzed.max(entries);
                }
            }
            match analyze_mvt(
                &catalog,
                &request.device,
                &parser_target,
                work.path(),
                &rules,
                &cancel,
                &mut report,
            ) {
                Ok(()) => {}
                Err(e) if e == "cancelled" => return Err(e),
                Err(e) => report.check(
                    "mvt_artifact_analysis",
                    if e == "engine_not_installed" {
                        "unsupported"
                    } else {
                        "failed"
                    },
                    &e,
                ),
            }
            if let (Some(pcap), Some(phone)) = (pcap, phone) {
                if let Ok(mut s) = status.lock() {
                    s.phase = "network".into()
                }
                let mut bytes = Vec::new();
                std::fs::File::open(pcap)
                    .map_err(|_| "pcap_unavailable")?
                    .take(128 * 1024 * 1024 + 1)
                    .read_to_end(&mut bytes)
                    .map_err(|_| "pcap_unavailable")?;
                // Apply network results transactionally, so malformed captures cannot leave partial findings presented as complete.
                let mut network_report = report.clone();
                match enigm_scan_core::network::analyze_pcap(
                    &bytes,
                    phone,
                    &rules,
                    &mut network_report,
                    &cancel,
                ) {
                    Ok(()) => report = network_report,
                    Err(e) if e == "cancelled" => return Err(e),
                    Err(e) => report.check("network_pcap", "failed", &e),
                }
            } else if capture_network && request.device == "ios" {
                if let Ok(mut s) = status.lock() {
                    s.phase = "network".into();
                }
                // Missing or interrupted observation metadata must never imply full coverage.
                let observation = std::fs::read(work.path().join("network-status.json"))
                    .ok()
                    .filter(|bytes| bytes.len() <= 4096)
                    .and_then(|bytes| serde_json::from_slice::<serde_json::Value>(&bytes).ok());
                let duration = observation
                    .as_ref()
                    .and_then(|value| value["durationSeconds"].as_f64())
                    .filter(|seconds| seconds.is_finite() && *seconds >= 0.0)
                    .unwrap_or(0.0);
                let complete = observation.as_ref().is_some_and(|value| {
                    value["status"] == "completed"
                        && value["reason"] == "duration_reached"
                        && duration >= 120.0
                });
                report.check("network_observation", if complete { "completed" } else { "failed" },
                    &format!("Observed for {:.1} seconds of the planned 120 seconds. {}",
                        duration, if complete { "Observation window completed; inactive threats may remain undetected." }
                        else { "Partial observation: capture ended early or its duration could not be verified." }));
                if !complete {
                    report.limitations.push("Network coverage is partial: the full 120-second observation was not completed or verified. Available captured traffic is analyzed without implying a complete observation.".into());
                }
                let capture = work.path().join("device-network.pcap");
                let result = (|| {
                    let mut bytes = Vec::new();
                    std::fs::File::open(capture)
                        .map_err(|_| "network_capture_unavailable".to_string())?
                        .take(32 * 1024 * 1024 + 1)
                        .read_to_end(&mut bytes)
                        .map_err(|_| "network_capture_unavailable".to_string())?;
                    let mut candidate = report.clone();
                    enigm_scan_core::network::analyze_usb_capture(
                        &bytes,
                        &rules,
                        &mut candidate,
                        &cancel,
                    )?;
                    Ok::<_, String>(candidate)
                })();
                match result {
                    Ok(candidate) => report = candidate,
                    Err(e) if e == "cancelled" => return Err(e),
                    Err(e) => report.check("network_pcap", "failed", &e),
                }
            } else if request.device == "ios" {
                // Network capture exists only for iPhone; Android reads its open
                // connections in android_network_snapshot instead.
                report.check(
                    "network_pcap",
                    "skipped",
                    "Network observation was not requested or is unavailable.",
                );
            }
            if cancel.load(Ordering::SeqCst) {
                return Err("cancelled".into());
            }
            if let Ok(mut s) = status.lock() {
                s.phase = "finalizing".into();
            }
            drop(lock); // Windows cannot remove a folder with an open file.
            report.cleanup = if work.close().is_ok() && usb_cleanup {
                "completed"
            } else {
                "partial"
            }
            .into();
            report.limitations.push("Cleanup refers only to the temporary workspace. User-selected source evidence and downloaded reports are retained; deletion is not guaranteed secure erasure.".into());
            // Correlation pairs forensic events with captured traffic: only
            // meaningful when the phone's network was observed.
            if report.checks.iter().any(|c| c.id == "network_observation") {
                enigm_scan_core::correlate::corroborate(&mut report);
            }
            report.finish();
            Ok(report)
        };
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(run))
            .unwrap_or_else(|_| Err("engine_failed".into()));
        if let Ok(mut s) = status.lock() {
            match result {
                Ok(report) => {
                    s.phase = "completed".into();
                    s.report = Some(report)
                }
                Err(e) => {
                    s.phase = if e == "cancelled" {
                        "cancelled"
                    } else {
                        "failed"
                    }
                    .into();
                    s.error = Some(e)
                }
            }
        }
        running.store(false, Ordering::SeqCst);
    });
    Ok(())
}
#[tauri::command]
fn scan_status(window: WebviewWindow, state: State<'_, Agent>) -> Result<Status, String> {
    local(&window)?;
    Ok(state
        .status
        .lock()
        .map_err(|_| "state_unavailable")?
        .clone())
}
#[tauri::command]
fn cancel_scan(window: WebviewWindow, state: State<'_, Agent>) -> Result<(), String> {
    local(&window)?;
    state.cancel.store(true, Ordering::SeqCst);
    state
        .selection
        .lock()
        .map_err(|_| "state_unavailable")?
        .usb
        .take();
    Ok(())
}
/// Start the copy of an iPhone whose deep check was prepared in advance and
/// confirmed, with or without observing its network.
#[tauri::command]
fn begin_copy(
    window: WebviewWindow,
    state: State<'_, Agent>,
    capture_network: bool,
) -> Result<(), String> {
    local(&window)?;
    if !state.running.load(Ordering::SeqCst) {
        return Err("scan_not_running".into());
    }
    state.start.store(
        if capture_network {
            acquire::START_COPY_WITH_NETWORK
        } else {
            acquire::START_COPY
        },
        Ordering::SeqCst,
    );
    Ok(())
}
/// The owner continues the iPhone copy without the deep check.
#[tauri::command]
fn skip_deep_check(window: WebviewWindow, state: State<'_, Agent>) -> Result<(), String> {
    local(&window)?;
    state.skip_deep.store(true, Ordering::SeqCst);
    Ok(())
}
#[tauri::command]
async fn finish_scan(window: WebviewWindow, state: State<'_, Agent>) -> Result<(), String> {
    local(&window)?;
    idle(&state)?;
    *state.status.lock().map_err(|_| "state_unavailable")? = Status::default();
    *state.selection.lock().map_err(|_| "state_unavailable")? = Selection::default();
    Ok(())
}
#[tauri::command]
async fn save_export(
    window: WebviewWindow,
    state: State<'_, Agent>,
    format: String,
    bytes: Vec<u8>,
    name: Option<String>,
) -> Result<bool, String> {
    local(&window)?;
    idle(&state)?;
    if bytes.len() > 8 * 1024 * 1024 {
        return Err("export_too_large".into());
    }
    match format.as_str() {
        "pdf" if bytes.starts_with(b"%PDF-") => {}
        "json" if serde_json::from_slice::<Report>(&bytes).is_ok() => {}
        _ => return Err("export_invalid".into()),
    }
    let picked = pick_path(
        &window,
        Pick::Save(export_name(name.as_deref(), &format), format.clone()),
    )
    .await;
    if let Some(mut path) = picked {
        path.set_extension(format);
        std::fs::write(path, bytes).map_err(|_| "export_failed")?;
        Ok(true)
    } else {
        Ok(false)
    }
}
/// The proposed file name: the page's dated name when it has the expected
/// shape (enigm-scan-report-YYYYMMDDHHMM.pdf), the plain one otherwise.
fn export_name(name: Option<&str>, format: &str) -> String {
    name.filter(|name| {
        name.strip_prefix("enigm-scan-report-")
            .and_then(|rest| rest.strip_suffix(&format!(".{format}")))
            .is_some_and(|stamp| stamp.len() == 12 && stamp.bytes().all(|b| b.is_ascii_digit()))
    })
    .map(str::to_string)
    .unwrap_or_else(|| format!("enigm-scan-report.{format}"))
}
#[tauri::command]
fn remove_pcap(window: WebviewWindow, state: State<'_, Agent>) -> Result<(), String> {
    local(&window)?;
    idle(&state)?;
    state
        .selection
        .lock()
        .map_err(|_| "state_unavailable")?
        .pcap = None;
    Ok(())
}
/// An address the system browser may open: https only, with a host, no
/// credentials, bounded length. Report sources and help pages qualify;
/// anything else (files, scripts, the app's own pages) does not.
fn external_link(url: &str) -> Option<tauri::Url> {
    let parsed = tauri::Url::parse(url).ok()?;
    (url.len() <= 2048
        && parsed.scheme() == "https"
        && parsed.host_str().is_some_and(|host| !host.is_empty())
        && parsed.username().is_empty()
        && parsed.password().is_none())
    .then_some(parsed)
}
/// Opens a link in the system browser. Links never open inside the app
/// window, which only shows the app itself.
fn open_in_browser(url: &tauri::Url) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let result = std::process::Command::new("/usr/bin/open")
        .arg(url.as_str())
        .status();
    #[cfg(target_os = "windows")]
    let result = std::process::Command::new("rundll32.exe")
        .args(["url.dll,FileProtocolHandler", url.as_str()])
        .status();
    #[cfg(target_os = "linux")]
    let result = std::process::Command::new("xdg-open")
        .arg(url.as_str())
        .status();
    match result {
        Ok(status) if status.success() => Ok(()),
        _ => Err("browser_unavailable".into()),
    }
}
#[tauri::command]
async fn open_link(window: WebviewWindow, url: String) -> Result<(), String> {
    local(&window)?;
    let link = external_link(&url).ok_or("link_denied")?;
    tauri::async_runtime::spawn_blocking(move || open_in_browser(&link))
        .await
        .map_err(|_| "browser_unavailable".to_string())?
}
#[tauri::command]
fn close_application(window: WebviewWindow, state: State<'_, Agent>) -> Result<(), String> {
    local(&window)?;
    // From the closing screen: a running scan stops, everything is cleared
    // on the exit event and the app quits.
    QUITTING.store(true, Ordering::SeqCst);
    state.cancel.store(true, Ordering::SeqCst);
    window.app_handle().exit(0);
    Ok(())
}
/// The macOS menu bar in the interface's language (the system's, as the
/// webview reports it). Other systems have no app menu.
#[tauri::command]
fn set_menu_language(window: WebviewWindow, language: String) -> Result<(), String> {
    local(&window)?;
    if !["en", "es", "fr", "de", "it", "pt"].contains(&language.as_str()) {
        return Err("language_unsupported".into());
    }
    if let Ok(mut current) = LANGUAGE.lock() {
        current.clone_from(&language);
    }
    #[cfg(target_os = "macos")]
    {
        let app = window.app_handle();
        let built = menu::build(app, &language).map_err(|_| "menu_failed")?;
        app.set_menu(built).map_err(|_| "menu_failed")?;
    }
    Ok(())
}
/// Forget everything this session holds: the report and progress, the chosen
/// evidence, the phone connection (its ADB server and private folder) and the
/// browser link. Run when the app closes or quits, so a later start, or the
/// page reconnecting to it, never finds the previous report.
fn end_session(state: &Agent) {
    state.cancel.store(true, Ordering::SeqCst);
    if let Ok(mut status) = state.status.lock() {
        *status = Status::default();
    }
    if let Ok(mut selection) = state.selection.lock() {
        *selection = Selection::default();
    }
}
/// Temporary folders of earlier runs that ended without cleaning up (killed,
/// crashed, power loss): analysis workspaces, private ADB homes and browser
/// profiles. Folders a running copy of the app still holds are kept.
fn remove_leftovers(keep: &Path) {
    use enigm_scan_runtime::session::remove_abandoned;
    // Only folders with our prefixes whose lock is free are removed.
    // nosemgrep: rust.lang.security.temp-dir.temp-dir
    let temp = std::env::temp_dir();
    let work = scan_workspace_root();
    let _ = remove_abandoned(&temp, "enigm-scan-browser-", Some(keep));
    let _ = remove_abandoned(&work, "enigm-scan-", Some(keep));
    let _ = remove_abandoned(&temp, "enigm-adb-", None);
}
/// Where the bundled resources sit relative to the real (link-free) path of
/// the executable, for each packaging: a macOS app bundle, a Linux AppImage or
/// package (`usr/bin` next to `usr/lib/<product>`), the Windows folder.
fn bundle_resources(exe: &Path, product: &str, os: &str) -> Option<PathBuf> {
    let dir = exe.parent()?;
    match os {
        "macos" => Some(dir.parent()?.join("Resources")),
        "linux" => Some(dir.parent()?.join("lib").join(product)),
        "windows" => Some(dir.to_path_buf()),
        _ => None,
    }
}
/// The engines folder. Tauri refuses to locate resources on macOS when the
/// app's path goes through a symbolic link (a disk image mounted under /tmp,
/// which is a link to /private/tmp), so fall back to the executable's real
/// location. That is safe: every engine is verified against the hashes
/// embedded in this binary before it runs, wherever it is found.
fn engines_root(
    tauri_dir: Option<PathBuf>,
    exe: Option<PathBuf>,
    product: &str,
) -> Option<PathBuf> {
    let found = |dir: PathBuf| {
        let root = dir.join("resources/engines");
        root.is_dir().then_some(root)
    };
    tauri_dir.and_then(found).or_else(|| {
        let exe = exe?.canonicalize().ok()?;
        found(bundle_resources(&exe, product, std::env::consts::OS)?)
    })
}
fn system_language() -> String {
    #[cfg_attr(not(target_os = "macos"), allow(unused_mut))]
    let mut tag = ["LC_ALL", "LC_MESSAGES", "LANG"]
        .iter()
        .filter_map(|key| std::env::var(key).ok())
        .find(|value| !value.is_empty() && value != "C" && value != "POSIX")
        .unwrap_or_default();
    #[cfg(target_os = "macos")]
    if tag.is_empty() {
        tag = std::process::Command::new("/usr/bin/defaults")
            .args(["read", "-g", "AppleLocale"])
            .output()
            .ok()
            .and_then(|out| String::from_utf8(out.stdout).ok())
            .unwrap_or_default();
    }
    tag.trim()
        .chars()
        .take(2)
        .collect::<String>()
        .to_lowercase()
}
/// Why the app cannot start, in the person's language, with what to do.
fn startup_problem(language: &str, os: &str) -> &'static str {
    match (language, os == "macos") {
        ("es", true) => "Enigm Scan no puede encontrar sus componentes desde esta ubicación. Abre Enigm Scan desde el disco montado o desde Aplicaciones.",
        ("fr", true) => "Enigm Scan ne trouve pas ses composants depuis cet emplacement. Ouvrez Enigm Scan depuis le disque monté ou depuis Applications.",
        ("de", true) => "Enigm Scan findet seine Komponenten an diesem Ort nicht. Öffnen Sie Enigm Scan vom eingebundenen Volume oder aus dem Ordner Programme.",
        ("it", true) => "Enigm Scan non trova i suoi componenti da questa posizione. Apri Enigm Scan dal disco montato o da Applicazioni.",
        ("pt", true) => "O Enigm Scan não encontra os seus componentes nesta localização. Abra o Enigm Scan a partir do disco montado ou de Aplicações.",
        (_, true) => "Enigm Scan cannot find its components from this location. Open Enigm Scan from the mounted disk or from Applications.",
        ("es", false) => "Enigm Scan no puede encontrar sus componentes. Descarga de nuevo la app desde scan.enigm.io y ábrela sin mover sus archivos.",
        ("fr", false) => "Enigm Scan ne trouve pas ses composants. Téléchargez à nouveau l’app depuis scan.enigm.io et ouvrez-la sans déplacer ses fichiers.",
        ("de", false) => "Enigm Scan findet seine Komponenten nicht. Laden Sie die App erneut von scan.enigm.io herunter und öffnen Sie sie, ohne ihre Dateien zu verschieben.",
        ("it", false) => "Enigm Scan non trova i suoi componenti. Scarica di nuovo l’app da scan.enigm.io e aprila senza spostarne i file.",
        ("pt", false) => "O Enigm Scan não encontra os seus componentes. Transfira novamente a app a partir de scan.enigm.io e abra-a sem mover os seus ficheiros.",
        (_, false) => "Enigm Scan cannot find its components. Download the app again from scan.enigm.io and open it without moving its files.",
    }
}
/// A message the person must read before the app quits (no window exists yet).
fn alert(text: &str) {
    #[cfg(target_os = "linux")]
    {
        use gtk::prelude::*;
        if gtk::is_initialized_main_thread() {
            let dialog = gtk::MessageDialog::new(
                None::<&gtk::Window>,
                gtk::DialogFlags::MODAL,
                gtk::MessageType::Error,
                gtk::ButtonsType::Ok,
                text,
            );
            dialog.set_title("Enigm Scan");
            dialog.set_keep_above(true);
            dialog.run();
            dialog.close();
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        rfd::MessageDialog::new()
            .set_title("Enigm Scan")
            .set_description(text)
            .set_level(rfd::MessageLevel::Error)
            .set_buttons(rfd::MessageButtons::Ok)
            .show();
    }
}
fn main() {
    // The portable application owns its browser profile for this invocation only.
    // Keep the directory alive until the event loop and webviews have stopped.
    let browser_session =
        enigm_scan_runtime::session::start().expect("Unable to create a private browser session");
    // Folders left by runs that were killed instead of closed.
    remove_leftovers(browser_session.path());
    let browser_data = browser_session.path().join("webview");
    let mut browser_session = Some(browser_session);
    let builder = tauri::Builder::default();
    // macOS shows the app menu in its own bar at the top of the screen;
    // Windows and Linux would draw one inside the window, so they get none.
    #[cfg(target_os = "macos")]
    let builder = builder.menu(|app| menu::build(app, &system_language()));
    let app = builder
        .setup(move |app| {
            let data = app.path().app_local_data_dir()?;
            std::fs::create_dir_all(&data)?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                std::fs::set_permissions(&data, std::fs::Permissions::from_mode(0o700))?;
            }
            // The argument is only compared with a fixed flag.
            // nosemgrep: rust.lang.security.args.args
            let self_check = std::env::args().any(|arg| arg == "--portable-self-check");
            let Some(root) = engines_root(
                app.path().resource_dir().ok(),
                // Locates the bundled engines, which are verified by SHA-256 before use.
                // nosemgrep: rust.lang.security.current-exe.current-exe
                std::env::current_exe().ok(),
                &app.package_info().name,
            ) else {
                let text = startup_problem(&system_language(), std::env::consts::OS);
                eprintln!("{text}");
                if !self_check {
                    alert(text);
                }
                app.handle().exit(3);
                return Ok(());
            };
            let catalog = Catalog::new(root, ENGINE_MANIFEST).map_err(std::io::Error::other)?;
            // CI runs this from the extracted/mounted portable package. It
            // verifies resource discovery and all engine/support hashes, never
            // opens a device, starts a scan or launches an engine.
            if self_check {
                for id in ["mvt-ios", "mvt-android", "adb", "ios-usb"] {
                    catalog.resolve(id).map_err(std::io::Error::other)?;
                }
                app.handle().exit(0);
                return Ok(());
            }
            app.manage(Agent {
                status: Arc::new(Mutex::new(Status::default())),
                selection: Mutex::new(Selection::default()),
                running: Arc::new(AtomicBool::new(false)),
                cancel: Arc::new(AtomicBool::new(false)),
                skip_deep: Arc::new(AtomicBool::new(false)),
                start: Arc::new(AtomicU8::new(acquire::START_HOLD)),
                catalog: Arc::new(catalog),
                data,
            });
            let main = tauri::WebviewWindowBuilder::from_config(
                app.handle(),
                &app.config().app.windows[0],
            )?
            .data_directory(browser_data)
            .visible(false)
            .on_page_load(show_when_loaded)
            .incognito(true)
            // The window only ever shows the app. A link that would leave
            // it opens in the system browser instead (https only).
            .on_navigation(own_page)
            .on_new_window(|url, _| {
                if let Some(link) = external_link(url.as_str()) {
                    let _ = open_in_browser(&link);
                }
                tauri::webview::NewWindowResponse::Deny
            });
            // macOS: content under a transparent title bar (see open_about).
            #[cfg(target_os = "macos")]
            let main = main
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true);
            let window = main.build()?;
            // If the page never reports that it loaded, show the window anyway.
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(4));
                let _ = window.show();
            });
            Ok(())
        })
        .on_menu_event(|app, event| {
            if event.id() == menu::ABOUT {
                let _ = open_about(app);
            }
            if event.id() == menu::DOCS {
                if let Some(link) = external_link(menu::DOCS_URL) {
                    let _ = open_in_browser(&link);
                }
            }
        })
        .on_window_event(|window, event| {
            // Only the main window ends the session; the About window just
            // closes.
            if window.label() != "main" {
                return;
            }
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // The window deletes the session and shows the Enigm
                // invitation first; then closing ends the session and quits
                // on every system (macOS would otherwise keep the app alive
                // in the Dock).
                if !QUITTING.load(Ordering::SeqCst) {
                    api.prevent_close();
                    ask_to_close(window.app_handle());
                    return;
                }
                if let Some(state) = window.try_state::<Agent>() {
                    end_session(&state);
                }
                window.app_handle().exit(0);
            }
        })
        .invoke_handler(tauri::generate_handler![
            open_link,
            close_application,
            set_menu_language,
            choose_evidence,
            choose_pcap,
            update_intelligence,
            capabilities,
            list_devices,
            refresh_devices,
            start_scan,
            scan_status,
            cancel_scan,
            skip_deep_check,
            begin_copy,
            finish_scan,
            save_export,
            remove_pcap
        ])
        .build(tauri::generate_context!())
        .expect("Unable to start Enigm Scan");
    // `run` never returns on macOS (the process exits from inside it), so the
    // session is cleaned up on the exit event, the last one on every system.
    app.run(move |handle, event| {
        // Quit from the menu or Cmd+Q goes through the window, like closing.
        if let tauri::RunEvent::ExitRequested {
            code: None, api, ..
        } = &event
        {
            if !QUITTING.load(Ordering::SeqCst) {
                api.prevent_exit();
                ask_to_close(handle);
                return;
            }
        }
        if let tauri::RunEvent::Exit = event {
            if let Some(state) = handle.try_state::<Agent>() {
                end_session(&state);
            }
            // Webview processes can briefly retain handles on Windows; the
            // next start removes what is left. A failure must not be
            // misrepresented as forensic evidence cleanup (reported separately).
            if let Some(session) = browser_session.take() {
                let _ = session.close();
            }
        }
    });
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn resources_are_found_through_the_real_path_of_a_linked_app() {
        let temp = tempfile::tempdir().unwrap();
        let real = temp.path().join("real");
        let exe = real.join("usr/bin/enigm-scan");
        std::fs::create_dir_all(exe.parent().unwrap()).unwrap();
        std::fs::write(&exe, b"").unwrap();
        let engines = real.join("usr/lib/Enigm Scan/resources/engines");
        std::fs::create_dir_all(&engines).unwrap();
        let linked = temp.path().join("linked");
        #[cfg(unix)]
        std::os::unix::fs::symlink(&real, &linked).unwrap();
        #[cfg(unix)]
        {
            // Tauri gave up (as it does on macOS for linked paths).
            let found = engines_root(None, Some(linked.join("usr/bin/enigm-scan")), "Enigm Scan");
            if std::env::consts::OS == "linux" {
                assert_eq!(found, Some(engines.canonicalize().unwrap()));
            }
        }
        // Tauri's own answer wins when it holds the engines.
        let tauri_dir = real.join("usr/lib/Enigm Scan");
        assert_eq!(
            engines_root(Some(tauri_dir), None, "x"),
            Some(engines.clone())
        );
        // Nowhere to be found: the caller shows the explanation and quits.
        assert_eq!(engines_root(Some(temp.path().into()), None, "x"), None);
    }
    #[test]
    fn exports_keep_the_dated_name_only_in_its_exact_shape() {
        assert_eq!(
            export_name(Some("enigm-scan-report-202611252154.pdf"), "pdf"),
            "enigm-scan-report-202611252154.pdf"
        );
        for odd in [
            "../../etc/passwd",
            "enigm-scan-report-2026.pdf",
            "enigm-scan-report-202611252154.json",
            "enigm-scan-report-20261125215a.pdf",
            "other.pdf",
        ] {
            assert_eq!(export_name(Some(odd), "pdf"), "enigm-scan-report.pdf");
        }
        assert_eq!(export_name(None, "json"), "enigm-scan-report.json");
    }
    #[test]
    fn only_plain_https_links_leave_the_app() {
        for allowed in [
            "https://scan.enigm.io/how-it-works",
            "https://github.com/AssoEchap/stalkerware-indicators",
        ] {
            assert!(external_link(allowed).is_some(), "{allowed}");
        }
        for denied in [
            "http://example.com",
            "file:///etc/passwd",
            "javascript:alert(1)",
            "tauri://localhost/index.html",
            "https://user:pass@example.com",
            "https://",
            "not a url",
        ] {
            assert!(external_link(denied).is_none(), "{denied}");
        }
        assert!(external_link(&format!("https://e.io/{}", "a".repeat(2100))).is_none());
    }
    #[test]
    fn each_packaging_keeps_resources_in_its_own_place() {
        let mac = Path::new("/private/tmp/m/Enigm Scan.app/Contents/MacOS/enigm-scan");
        assert_eq!(
            bundle_resources(mac, "Enigm Scan", "macos"),
            Some(PathBuf::from(
                "/private/tmp/m/Enigm Scan.app/Contents/Resources"
            ))
        );
        let linux = Path::new("/tmp/.mount_x/usr/bin/enigm-scan");
        assert_eq!(
            bundle_resources(linux, "Enigm Scan", "linux"),
            Some(PathBuf::from("/tmp/.mount_x/usr/lib/Enigm Scan"))
        );
        let windows = Path::new("/c/Enigm Scan/enigm-scan.exe");
        assert_eq!(
            bundle_resources(windows, "Enigm Scan", "windows"),
            Some(PathBuf::from("/c/Enigm Scan"))
        );
    }
    #[test]
    fn startup_problem_tells_mac_users_where_to_open_the_app() {
        assert!(startup_problem("es", "macos")
            .contains("Abre Enigm Scan desde el disco montado o desde Aplicaciones"));
        for language in ["en", "es", "fr", "de", "it", "pt", "zz"] {
            assert!(!startup_problem(language, "linux").is_empty());
            assert!(startup_problem(language, "macos").contains("Enigm Scan"));
        }
    }
    #[test]
    fn ending_a_session_forgets_the_report_and_selection() {
        let temp = tempfile::tempdir().unwrap();
        let catalog = Catalog::new(temp.path().into(), ENGINE_MANIFEST).unwrap();
        let agent = Agent {
            status: Arc::new(Mutex::new(Status {
                phase: "complete".into(),
                artifacts: 3,
                ..Status::default()
            })),
            selection: Mutex::new(Selection {
                evidence: Some(temp.path().into()),
                ..Selection::default()
            }),
            running: Arc::new(AtomicBool::new(false)),
            cancel: Arc::new(AtomicBool::new(false)),
            skip_deep: Arc::new(AtomicBool::new(false)),
            start: Arc::new(AtomicU8::new(acquire::START_HOLD)),
            catalog: Arc::new(catalog),
            data: temp.path().into(),
        };
        end_session(&agent);
        let status = agent.status.lock().unwrap();
        assert!(status.phase.is_empty() && status.report.is_none() && status.artifacts == 0);
        assert!(agent.selection.lock().unwrap().evidence.is_none());
    }
    #[test]
    fn leftovers_of_a_killed_run_are_removed_at_start() {
        let temp = tempfile::tempdir().unwrap();
        let crashed = temp.path().join("enigm-scan-abc");
        std::fs::create_dir(&crashed).unwrap();
        drop(enigm_scan_runtime::session::hold(&crashed).unwrap());
        std::fs::write(crashed.join("Manifest.db"), b"x").unwrap();
        let live = temp.path().join("enigm-scan-live");
        std::fs::create_dir(&live).unwrap();
        let _held = enigm_scan_runtime::session::hold(&live).unwrap();
        enigm_scan_runtime::session::remove_abandoned(temp.path(), "enigm-scan-", None);
        assert!(!crashed.exists() && live.exists());
    }
}
