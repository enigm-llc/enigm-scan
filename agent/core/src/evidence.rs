//! Prepare authorized evidence before handing it to external parsers.
use cap_std::fs::Dir;
use std::{
    fs,
    io::{Read, Write},
    path::Path,
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};

pub struct Snapshot {
    pub files: u64,
    pub skipped: u64,
    /// A safety limit stopped the copy early. The copied subset is still
    /// analyzed, but coverage must be reported as partial.
    pub truncated: bool,
}
/// Safety bounds for copying user-selected evidence. Reaching them reduces
/// coverage instead of discarding the whole scan.
pub struct Limits {
    pub entries: usize,
    pub duration: Duration,
}
pub const COPY_LIMITS: Limits = Limits {
    entries: 1_000_000,
    duration: Duration::from_secs(2 * 3600),
};
/// The destination must be a new directory in the agent's private workspace.
/// No symlinks, special files, arbitrary archive extraction or source writes.
pub fn snapshot(
    source: &Path,
    destination: &Path,
    cancel: &AtomicBool,
) -> Result<Snapshot, String> {
    snapshot_within(source, destination, cancel, &COPY_LIMITS)
}
pub fn snapshot_within(
    source: &Path,
    destination: &Path,
    cancel: &AtomicBool,
    limits: &Limits,
) -> Result<Snapshot, String> {
    let root = source.canonicalize().map_err(|_| "evidence_unavailable")?;
    if !root.is_dir() {
        return Err("evidence_not_directory".into());
    }
    let parent = destination
        .parent()
        .ok_or("workspace_failed")?
        .canonicalize()
        .map_err(|_| "workspace_failed")?;
    if parent.starts_with(&root) {
        return Err("evidence_workspace_overlap".into());
    }
    let input = Dir::open_ambient_dir(&root, cap_std::ambient_authority())
        .map_err(|_| "evidence_unavailable")?;
    fs::create_dir(destination).map_err(|_| "workspace_failed")?;
    let started = Instant::now();
    let mut result = Snapshot {
        files: 0,
        skipped: 0,
        truncated: false,
    };
    let reserve = (fs2::available_space(destination).map_err(|_| "workspace_failed")? / 20)
        .clamp(512 * 1024 * 1024, 2 * 1024 * 1024 * 1024);
    let mut chunk = [0u8; 65536];
    'entries: for (index, entry) in walkdir::WalkDir::new(&root)
        .follow_links(false)
        .max_depth(40)
        .into_iter()
        .enumerate()
    {
        if cancel.load(Ordering::SeqCst) {
            return Err("cancelled".into());
        }
        if index >= limits.entries || started.elapsed() > limits.duration {
            result.truncated = true;
            break;
        }
        let entry = match entry {
            Ok(e) => e,
            Err(_) => {
                result.skipped += 1;
                continue;
            }
        };
        if entry.file_type().is_dir() {
            if entry.depth() == 40 {
                result.skipped += 1;
            }
            continue;
        }
        if !entry.file_type().is_file() {
            result.skipped += 1;
            continue;
        }
        let relative = entry
            .path()
            .strip_prefix(&root)
            .map_err(|_| "evidence_path_invalid")?;
        let mut file = match input.open(relative) {
            Ok(f) => f,
            Err(_) => {
                result.skipped += 1;
                continue;
            }
        };
        let meta = file.metadata().map_err(|_| "evidence_unavailable")?;
        if !meta.is_file() {
            result.skipped += 1;
            continue;
        }
        let free = fs2::available_space(destination).map_err(|_| "workspace_failed")?;
        if meta.len() > free.saturating_sub(reserve) {
            return Err("insufficient_disk_space".into());
        }
        let target = destination.join(relative);
        fs::create_dir_all(target.parent().ok_or("evidence_path_invalid")?)
            .map_err(|_| "workspace_failed")?;
        let mut output = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&target)
            .map_err(|_| "workspace_failed")?;
        let mut size = 0u64;
        loop {
            if cancel.load(Ordering::SeqCst) {
                return Err("cancelled".into());
            }
            if started.elapsed() > limits.duration {
                // Never leave a partially copied file for parsers.
                drop(output);
                fs::remove_file(&target).map_err(|_| "workspace_failed")?;
                result.truncated = true;
                break 'entries;
            }
            let n = file.read(&mut chunk).map_err(|_| "evidence_unavailable")?;
            if n == 0 {
                break;
            }
            size += n as u64;
            if size % (64 * 1024 * 1024) < n as u64
                && fs2::available_space(destination).map_err(|_| "workspace_failed")? < reserve
            {
                return Err("insufficient_disk_space".into());
            }
            output
                .write_all(&chunk[..n])
                .map_err(|_| "workspace_failed")?;
        }
        result.files += 1;
    }
    Ok(result)
}
/// Evidence written by our own adapters into the private session workspace is
/// already isolated from user files, so it is not copied again (copying a large
/// device backup doubled disk use and hit copy limits). Device-controlled
/// content is still untrusted: remove anything that is not a regular file or
/// directory, so parsers never follow links or open special files.
pub fn sanitize_in_place(root: &Path, cancel: &AtomicBool) -> Result<Snapshot, String> {
    let meta = fs::symlink_metadata(root).map_err(|_| "evidence_unavailable")?;
    if !meta.is_dir() {
        return Err("evidence_not_directory".into());
    }
    let mut result = Snapshot {
        files: 0,
        skipped: 0,
        truncated: false,
    };
    for entry in walkdir::WalkDir::new(root).follow_links(false) {
        if cancel.load(Ordering::SeqCst) {
            return Err("cancelled".into());
        }
        let entry = entry.map_err(|_| "evidence_unavailable")?;
        let kind = entry.file_type();
        if kind.is_dir() {
            continue;
        }
        if kind.is_file() {
            result.files += 1;
            continue;
        }
        fs::remove_file(entry.path()).map_err(|_| "evidence_sanitize_failed")?;
        result.skipped += 1;
    }
    Ok(result)
}
/// Number of files inside a zip archive (an Android bugreport), read from its
/// end-of-central-directory record without extracting anything. The scan
/// counts these as the files reviewed, not the single archive.
/// The count comes from the archive itself, which the phone produced: values
/// beyond any real bug report are ignored rather than shown as files read.
pub const MAX_ZIP_ENTRIES: u64 = 5_000_000;
pub fn zip_entries(path: &Path) -> Option<u64> {
    zip_entries_raw(path).filter(|n| *n <= MAX_ZIP_ENTRIES)
}
fn zip_entries_raw(path: &Path) -> Option<u64> {
    use std::io::{Read, Seek, SeekFrom};
    let mut file = fs::File::open(path).ok()?;
    let len = file.metadata().ok()?.len();
    let tail = len.min(66_000 + 22);
    file.seek(SeekFrom::Start(len - tail)).ok()?;
    let mut buf = vec![0u8; tail as usize];
    file.read_exact(&mut buf).ok()?;
    let at = (0..buf.len().saturating_sub(21))
        .rev()
        .find(|&i| buf[i..i + 4] == [0x50, 0x4b, 0x05, 0x06])?;
    let entries = u16::from_le_bytes([buf[at + 10], buf[at + 11]]) as u64;
    if entries != 0xffff {
        return Some(entries);
    }
    // ZIP64: the locator just before the record points at the real count.
    let locator = at.checked_sub(20)?;
    if buf[locator..locator + 4] != [0x50, 0x4b, 0x06, 0x07] {
        return None;
    }
    let offset = u64::from_le_bytes(buf[locator + 8..locator + 16].try_into().ok()?);
    file.seek(SeekFrom::Start(offset)).ok()?;
    let mut record = [0u8; 40];
    file.read_exact(&mut record).ok()?;
    (record[..4] == [0x50, 0x4b, 0x06, 0x06])
        .then(|| u64::from_le_bytes(record[32..40].try_into().unwrap_or_default()))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ignores_an_implausible_zip_entry_count() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("forged.zip");
        // ZIP64 end record claiming u64::MAX entries, its locator, then the classic record.
        let mut zip = vec![0x50, 0x4b, 0x06, 0x06];
        zip.extend_from_slice(&[0u8; 28]);
        zip.extend_from_slice(&u64::MAX.to_le_bytes());
        zip.extend_from_slice(&[0x50, 0x4b, 0x06, 0x07, 0, 0, 0, 0]);
        zip.extend_from_slice(&0u64.to_le_bytes());
        zip.extend_from_slice(&[1, 0, 0, 0]);
        zip.extend_from_slice(&[0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 0, 0, 0xff, 0xff]);
        zip.extend_from_slice(&[0u8; 10]);
        fs::write(&path, &zip).unwrap();
        assert_eq!(zip_entries_raw(&path), Some(u64::MAX));
        assert_eq!(zip_entries(&path), None);
    }
    #[test]
    fn creates_independent_snapshot_and_leaves_source_unchanged() {
        let input = tempfile::tempdir().unwrap();
        let work = tempfile::tempdir().unwrap();
        fs::create_dir(input.path().join("nested")).unwrap();
        fs::write(input.path().join("nested/artifact"), b"synthetic evidence").unwrap();
        let target = work.path().join("snapshot");
        let result = snapshot(input.path(), &target, &AtomicBool::new(false)).unwrap();
        assert_eq!(result.files, 1);
        assert_eq!(result.skipped, 0);
        fs::write(target.join("nested/artifact"), b"parser changed copy").unwrap();
        assert_eq!(
            fs::read(input.path().join("nested/artifact")).unwrap(),
            b"synthetic evidence"
        );
    }
    #[cfg(unix)]
    #[test]
    fn excludes_external_links_and_honors_cancellation() {
        let input = tempfile::tempdir().unwrap();
        let work = tempfile::tempdir().unwrap();
        fs::write(work.path().join("private"), b"not authorized").unwrap();
        std::os::unix::fs::symlink(work.path().join("private"), input.path().join("link")).unwrap();
        let target = work.path().join("snapshot");
        let result = snapshot(input.path(), &target, &AtomicBool::new(false)).unwrap();
        assert_eq!(result.skipped, 1);
        assert!(!target.join("link").exists());
        assert!(snapshot(
            input.path(),
            &work.path().join("cancelled"),
            &AtomicBool::new(true)
        )
        .is_err());
    }
    #[test]
    fn copy_limits_reduce_coverage_instead_of_failing() {
        let input = tempfile::tempdir().unwrap();
        let work = tempfile::tempdir().unwrap();
        for n in 0..5 {
            fs::write(input.path().join(format!("artifact-{n}")), b"synthetic").unwrap();
        }
        let limits = Limits {
            entries: 3,
            duration: Duration::from_secs(60),
        };
        let target = work.path().join("snapshot");
        let result =
            snapshot_within(input.path(), &target, &AtomicBool::new(false), &limits).unwrap();
        assert!(result.truncated);
        assert_eq!(result.files, 2);
        assert_eq!(fs::read_dir(&target).unwrap().count(), 2);
        let full = snapshot(
            input.path(),
            &work.path().join("full"),
            &AtomicBool::new(false),
        )
        .unwrap();
        assert!(!full.truncated);
        assert_eq!(full.files, 5);
    }
    #[cfg(unix)]
    #[test]
    fn sanitizes_acquired_evidence_without_copying_or_touching_link_targets() {
        let outside = tempfile::tempdir().unwrap();
        let acquired = tempfile::tempdir().unwrap();
        fs::write(outside.path().join("private"), b"not authorized").unwrap();
        fs::create_dir(acquired.path().join("ab")).unwrap();
        fs::write(acquired.path().join("ab/abcdef"), b"synthetic backup file").unwrap();
        std::os::unix::fs::symlink(
            outside.path().join("private"),
            acquired.path().join("ab/link"),
        )
        .unwrap();
        std::os::unix::fs::symlink(outside.path(), acquired.path().join("dir-link")).unwrap();
        let result = sanitize_in_place(acquired.path(), &AtomicBool::new(false)).unwrap();
        assert_eq!((result.files, result.skipped), (1, 2));
        assert!(fs::symlink_metadata(acquired.path().join("ab/link")).is_err());
        assert!(fs::symlink_metadata(acquired.path().join("dir-link")).is_err());
        assert_eq!(
            fs::read(outside.path().join("private")).unwrap(),
            b"not authorized"
        );
        assert!(sanitize_in_place(acquired.path(), &AtomicBool::new(true)).is_err());
    }
    #[test]
    fn counts_the_files_inside_a_zip() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("bugreport.zip");
        // Minimal archive: an end-of-central-directory record for 3 entries.
        let mut eocd = vec![0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, 3, 0, 3, 0];
        eocd.extend_from_slice(&[0; 10]);
        let mut bytes = vec![0u8; 100];
        bytes.extend_from_slice(&eocd);
        fs::write(&path, bytes).unwrap();
        assert_eq!(zip_entries(&path), Some(3));
        fs::write(&path, b"not a zip").unwrap();
        assert_eq!(zip_entries(&path), None);
    }
}
