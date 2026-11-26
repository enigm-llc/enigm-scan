//! Keeps the computer from idle-sleeping while a scan runs, released when the
//! guard is dropped (scan finished, failed or cancelled).
//!
//! - macOS: `/usr/bin/caffeinate -i -s -w <pid>` (idle and, on AC power,
//!   system sleep). `-w` also ends it if this application exits abnormally.
//! - Windows: `SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED)` on
//!   the scan thread, cleared on drop. The guard must be dropped on the thread
//!   that created it.
//! - Linux: `systemd-inhibit --what=idle:sleep` holding a child that exits
//!   with this process. Without systemd/logind no inhibitor is available.
//!
//! Limitations: closing a laptop lid, low battery or an administrator policy
//! can still put the computer to sleep; the display may still turn off.
//! Failure to inhibit never fails a scan.
#[cfg(unix)]
use std::process::{Child, Command, Stdio};

pub struct KeepAwake {
    #[cfg(unix)]
    child: Option<Child>,
    #[cfg(windows)]
    active: bool,
}

impl KeepAwake {
    pub fn start() -> Self {
        #[cfg(unix)]
        {
            Self {
                child: spawn_inhibitor(),
            }
        }
        #[cfg(windows)]
        {
            use windows_sys::Win32::System::Power::{
                SetThreadExecutionState, ES_CONTINUOUS, ES_SYSTEM_REQUIRED,
            };
            let previous = unsafe { SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED) };
            Self {
                active: previous != 0,
            }
        }
        #[cfg(not(any(unix, windows)))]
        {
            Self {}
        }
    }

    /// Whether the platform accepted the request.
    pub fn active(&self) -> bool {
        #[cfg(unix)]
        {
            self.child.is_some()
        }
        #[cfg(windows)]
        {
            self.active
        }
        #[cfg(not(any(unix, windows)))]
        {
            false
        }
    }
}

#[cfg(unix)]
fn inhibitor_command() -> Option<Command> {
    let pid = std::process::id().to_string();
    #[cfg(target_os = "macos")]
    {
        let mut command = Command::new("/usr/bin/caffeinate");
        command.args(["-i", "-s", "-w", &pid]);
        Some(command)
    }
    #[cfg(target_os = "linux")]
    {
        let program = ["/usr/bin/systemd-inhibit", "/bin/systemd-inhibit"]
            .into_iter()
            .find(|path| std::path::Path::new(path).is_file())?;
        let mut command = Command::new(program);
        // `tail --pid` ends with this process even if it is killed.
        command.args([
            "--what=idle:sleep",
            "--who=Enigm Scan",
            "--why=Analysing a phone",
            "--mode=block",
            "/usr/bin/tail",
            "-f",
            "/dev/null",
            "--pid",
            &pid,
        ]);
        Some(command)
    }
    #[cfg(not(any(target_os = "macos", target_os = "linux")))]
    {
        let _ = pid;
        None
    }
}

#[cfg(unix)]
fn spawn_inhibitor() -> Option<Child> {
    let mut command = inhibitor_command()?;
    command
        .env_clear()
        .env("PATH", "/usr/bin:/bin")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    let mut child = command.spawn().ok()?;
    // An inhibitor that exits immediately (no logind, denied) is not active.
    std::thread::sleep(std::time::Duration::from_millis(150));
    match child.try_wait() {
        Ok(None) => Some(child),
        _ => None,
    }
}

impl Drop for KeepAwake {
    fn drop(&mut self) {
        #[cfg(unix)]
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        #[cfg(windows)]
        if self.active {
            use windows_sys::Win32::System::Power::{SetThreadExecutionState, ES_CONTINUOUS};
            unsafe {
                SetThreadExecutionState(ES_CONTINUOUS);
            }
        }
    }
}

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::*;
    fn assertion_present(child: u32) -> bool {
        let out = Command::new("/usr/bin/pmset")
            .args(["-g", "assertions"])
            .output()
            .unwrap();
        let owner = format!("pid {child}(caffeinate)");
        String::from_utf8_lossy(&out.stdout)
            .lines()
            .any(|line| line.contains(&owner) && line.contains("PreventUserIdleSystemSleep"))
    }
    #[test]
    fn holds_and_releases_the_sleep_assertion() {
        let guard = KeepAwake::start();
        assert!(guard.active());
        let child = guard.child.as_ref().unwrap().id();
        assert!(assertion_present(child));
        drop(guard);
        // The caffeinate process is gone once the guard is dropped.
        assert!(!assertion_present(child));
    }
}

#[cfg(all(test, target_os = "linux"))]
mod tests {
    use super::*;
    #[test]
    fn inhibitor_is_optional_and_released() {
        // CI runners may lack logind; the guard must never fail the scan.
        let guard = KeepAwake::start();
        let child = guard.child.as_ref().map(|child| child.id());
        drop(guard);
        if let Some(pid) = child {
            assert!(!std::path::Path::new(&format!("/proc/{pid}")).exists());
        }
    }
}
