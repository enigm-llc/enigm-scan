//! Private per-run browser profile directories in the system temp folder.
//!
//! Each run holds an exclusive lock on a file inside its directory for its whole
//! lifetime. An app that is killed instead of closed cannot remove its
//! directory, so the next start removes directories whose lock nobody holds.
//! Directories of an app that is still running stay untouched.
use fs2::FileExt;
use std::{
    fs::File,
    path::{Path, PathBuf},
    time::{Duration, SystemTime},
};
const PREFIX: &str = "enigm-scan-browser-";
const LOCK: &str = ".session-lock";
/// Directories from releases without a lock file are removed only when empty or
/// clearly stale, never while a recent run could still be using them.
const LEGACY_STALE: Duration = Duration::from_secs(24 * 3600);
pub struct Session {
    dir: tempfile::TempDir,
    _lock: File,
}
impl Session {
    pub fn path(&self) -> &Path {
        self.dir.path()
    }
    /// Remove the directory; a failure is not presented as evidence cleanup.
    pub fn close(self) -> std::io::Result<()> {
        let Session { dir, _lock } = self;
        drop(_lock);
        dir.close()
    }
}
pub fn start_in(temp: &Path) -> std::io::Result<Session> {
    let dir = tempfile::Builder::new().prefix(PREFIX).tempdir_in(temp)?;
    let lock = File::create(dir.path().join(LOCK))?;
    lock.try_lock_exclusive()?;
    Ok(Session { dir, _lock: lock })
}
pub fn start() -> std::io::Result<Session> {
    // Only the base: each session creates its own randomly named folder in it,
    // mode 0700 and locked while in use.
    // nosemgrep: rust.lang.security.temp-dir.temp-dir
    start_in(&std::env::temp_dir())
}
/// Hold an exclusive lock inside a temporary folder for as long as the
/// returned file lives, so a later start can tell an abandoned folder (from a
/// killed or crashed app) from one a running app still uses. Drop
/// the file before removing the folder: Windows cannot delete an open file.
pub fn hold(dir: &Path) -> std::io::Result<File> {
    let lock = File::create(dir.join(LOCK))?;
    lock.try_lock_exclusive()?;
    Ok(lock)
}
/// The tag of the Cache Directory Tagging convention: backup tools that
/// follow it (tar, Borg, restic and others) skip the folder holding it.
const CACHEDIR_TAG: &str = "Signature: 8a477f597d28d172789f06886806bc55\n# Enigm Scan: a temporary copy of a phone, deleted when the scan ends.\n";
/// Files `keep_private` adds, which stay until the folder is removed.
const MARKS: [&str; 2] = ["CACHEDIR.TAG", ".metadata_never_index"];
/// Keep a scan folder out of the computer's backups and search indexes, so
/// the copy of a phone never outlives the scan there: Time Machine (and its
/// local snapshots) and Spotlight on macOS, the search index on Windows and,
/// on every system, backup tools that honour CACHEDIR.TAG. Best effort: a
/// mark that cannot be set does not stop the scan.
pub fn keep_private(dir: &Path) {
    let _ = std::fs::write(dir.join(MARKS[0]), CACHEDIR_TAG);
    #[cfg(target_os = "macos")]
    {
        // Spotlight does not index a folder holding this file.
        let _ = File::create(dir.join(MARKS[1]));
        // What `tmutil addexclusion` sets: a binary property list holding
        // "com.apple.backupd".
        const VALUE: &[u8] = b"bplist00_\x10\x11com.apple.backupd\x08\x00\x00\x00\x00\x00\x00\x01\x01\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x1c";
        use std::os::unix::ffi::OsStrExt;
        if let Ok(path) = std::ffi::CString::new(dir.as_os_str().as_bytes()) {
            // SAFETY: both strings are NUL-terminated and VALUE outlives the call.
            unsafe {
                libc::setxattr(
                    path.as_ptr(),
                    c"com.apple.metadata:com_apple_backup_excludeItem".as_ptr(),
                    VALUE.as_ptr().cast(),
                    VALUE.len(),
                    0,
                    0,
                );
            }
        }
    }
    #[cfg(windows)]
    {
        use std::os::windows::ffi::OsStrExt;
        use windows_sys::Win32::Storage::FileSystem::{
            GetFileAttributesW, SetFileAttributesW, FILE_ATTRIBUTE_NOT_CONTENT_INDEXED,
            INVALID_FILE_ATTRIBUTES,
        };
        let wide: Vec<u16> = dir.as_os_str().encode_wide().chain([0]).collect();
        // SAFETY: `wide` is a NUL-terminated path that lives through both calls.
        unsafe {
            let current = GetFileAttributesW(wide.as_ptr());
            if current != INVALID_FILE_ATTRIBUTES {
                SetFileAttributesW(wide.as_ptr(), current | FILE_ATTRIBUTE_NOT_CONTENT_INDEXED);
            }
        }
    }
}
/// Delete from a scan folder everything already analysed, as soon as it is,
/// instead of at the end: all but its lock, its marks and the entries named
/// in `keep`. What cannot be deleted now goes with the folder at the end.
pub fn discard(dir: &Path, keep: &[&str]) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if name == LOCK || MARKS.contains(&name.as_ref()) || keep.contains(&name.as_ref()) {
            continue;
        }
        let path = entry.path();
        // Never follow a link out of the folder: remove the link itself.
        let _ = match entry.file_type() {
            Ok(kind) if kind.is_dir() => std::fs::remove_dir_all(&path),
            _ => std::fs::remove_file(&path),
        };
    }
}
/// Remove orphaned profile directories left by killed apps. Returns the
/// removed paths. Symlinks and entries that are not directories are ignored.
pub fn remove_orphans_in(temp: &Path, keep: &Path) -> Vec<PathBuf> {
    remove_abandoned(temp, PREFIX, Some(keep))
}
/// Remove folders named `<prefix>*` in `root` whose lock nobody holds (see
/// `hold`). Folders without a lock file, from releases before the lock, are
/// removed only when empty or older than a day.
pub fn remove_abandoned(root: &Path, prefix: &str, keep: Option<&Path>) -> Vec<PathBuf> {
    let mut removed = Vec::new();
    let Ok(entries) = std::fs::read_dir(root) else {
        return removed;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if Some(path.as_path()) == keep
            || !entry
                .file_name()
                .to_str()
                .is_some_and(|name| name.starts_with(prefix))
            || !std::fs::symlink_metadata(&path).is_ok_and(|m| m.is_dir())
        {
            continue;
        }
        let orphan = match File::open(path.join(LOCK)) {
            // Lockable means no running app holds it.
            Ok(lock) => {
                let free = lock.try_lock_exclusive().is_ok();
                drop(lock);
                free
            }
            Err(_) => {
                let empty = std::fs::read_dir(&path).is_ok_and(|mut d| d.next().is_none());
                let stale = std::fs::symlink_metadata(&path)
                    .and_then(|m| m.modified())
                    .ok()
                    .and_then(|t| SystemTime::now().duration_since(t).ok())
                    .is_some_and(|age| age > LEGACY_STALE);
                empty || stale
            }
        };
        if orphan && std::fs::remove_dir_all(&path).is_ok() {
            removed.push(path);
        }
    }
    removed
}
pub fn remove_orphans(keep: &Path) -> Vec<PathBuf> {
    // Only folders with our prefix whose lock is free are removed.
    // nosemgrep: rust.lang.security.temp-dir.temp-dir
    remove_orphans_in(&std::env::temp_dir(), keep)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn removes_only_profiles_nobody_is_using() {
        let temp = tempfile::tempdir().unwrap();
        let current = start_in(temp.path()).unwrap();
        let running = start_in(temp.path()).unwrap();
        // A killed app: its directory remains but its lock is released.
        let killed = start_in(temp.path()).unwrap();
        let killed_path = killed.path().to_path_buf();
        std::fs::write(killed_path.join("webview-data"), b"x").unwrap();
        std::mem::forget(killed.dir.keep());
        drop(killed._lock);
        // An empty directory from an older release without a lock file.
        let legacy = temp.path().join(format!("{PREFIX}legacy"));
        std::fs::create_dir(&legacy).unwrap();
        // Unrelated entries are never touched.
        let other = temp.path().join("unrelated");
        std::fs::create_dir(&other).unwrap();
        // A process another test starts at this moment can inherit the
        // released lock until it executes its program; the next pass sees it
        // free, as the app's next start would.
        let mut removed = remove_orphans_in(temp.path(), current.path());
        for _ in 0..50 {
            if !killed_path.exists() {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(20));
            removed.extend(remove_orphans_in(temp.path(), current.path()));
        }
        assert!(!killed_path.exists());
        assert!(!legacy.exists());
        assert!(running.path().exists());
        assert!(current.path().exists());
        assert!(other.exists());
        assert_eq!(removed.len(), 2);
        current.close().unwrap();
        running.close().unwrap();
    }
    #[test]
    fn abandoned_work_folders_are_removed_and_held_ones_kept() {
        let temp = tempfile::tempdir().unwrap();
        let held = temp.path().join("enigm-scan-held");
        let abandoned = temp.path().join("enigm-scan-crashed");
        let other = temp.path().join("enigm-adb-other");
        for dir in [&held, &abandoned, &other] {
            std::fs::create_dir(dir).unwrap();
        }
        let lock = hold(&held).unwrap();
        drop(hold(&abandoned).unwrap()); // its app died: lock released
        std::fs::write(abandoned.join("evidence"), b"x").unwrap();
        let removed = remove_abandoned(temp.path(), "enigm-scan-", None);
        assert_eq!(removed, vec![abandoned.clone()]);
        assert!(held.exists() && other.exists() && !abandoned.exists());
        drop(lock);
        // Other tests in this binary start processes in parallel; one forked
        // at that moment briefly shares the lock until it executes. The app
        // removes leftovers before it starts any process, so retry here only.
        let mut removed = Vec::new();
        for _ in 0..50 {
            removed = remove_abandoned(temp.path(), "enigm-scan-", None);
            if !removed.is_empty() {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(20));
        }
        assert_eq!(removed, vec![held]);
    }
    #[test]
    fn a_scan_folder_stays_out_of_backups_and_drops_what_was_analysed() {
        let temp = tempfile::tempdir().unwrap();
        let dir = temp.path();
        let lock = hold(dir).unwrap();
        keep_private(dir);
        let tag = std::fs::read_to_string(dir.join("CACHEDIR.TAG")).unwrap();
        assert!(tag.starts_with("Signature: 8a477f597d28d172789f06886806bc55"));
        #[cfg(target_os = "macos")]
        {
            assert!(dir.join(".metadata_never_index").is_file());
            let out = std::process::Command::new("xattr")
                .arg("-p")
                .arg("com.apple.metadata:com_apple_backup_excludeItem")
                .arg(dir)
                .output()
                .unwrap();
            assert!(out.status.success());
            let status = std::process::Command::new("tmutil")
                .arg("isexcluded")
                .arg(dir)
                .output()
                .unwrap();
            assert!(String::from_utf8_lossy(&status.stdout).contains("[Excluded]"));
        }
        std::fs::create_dir_all(dir.join("ios-backup/0000")).unwrap();
        std::fs::write(dir.join("ios-backup/0000/Manifest.db"), b"x").unwrap();
        std::fs::write(dir.join("android-inventory.json"), b"{}").unwrap();
        std::fs::write(dir.join("device-network.pcap"), b"p").unwrap();
        #[cfg(unix)]
        {
            let outside = temp
                .path()
                .parent()
                .unwrap()
                .join(format!("enigm-discard-outside-{}", std::process::id()));
            std::fs::create_dir_all(&outside).unwrap();
            std::fs::write(outside.join("keep"), b"k").unwrap();
            std::os::unix::fs::symlink(&outside, dir.join("link")).unwrap();
            discard(dir, &["device-network.pcap"]);
            assert!(
                outside.join("keep").is_file(),
                "a link is removed, not followed"
            );
            std::fs::remove_dir_all(&outside).unwrap();
        }
        #[cfg(not(unix))]
        discard(dir, &["device-network.pcap"]);
        assert!(!dir.join("ios-backup").exists());
        assert!(!dir.join("android-inventory.json").exists());
        assert!(dir.join("device-network.pcap").exists());
        assert!(dir.join(LOCK).exists() && dir.join("CACHEDIR.TAG").exists());
        drop(lock);
    }
}
