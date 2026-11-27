use std::{
    io::{Read, Write},
    path::Path,
    process::{Command, Stdio},
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};
pub struct Output {
    pub code: Option<i32>,
    /// The signal that ended the process (Unix), e.g. a resource limit.
    pub signal: Option<i32>,
    pub stdout: Vec<u8>,
    pub stderr: Vec<u8>,
}
const MAX_OUTPUT: usize = 1024 * 1024;
/// Largest file an engine may write. Evidence writers (USB acquisition and
/// backup decryption) reproduce device files, which can exceed 2 GiB; their
/// disk use is bounded separately by free-space guards. A fixed 2 GiB limit
/// made the iPhone adapter fail with EFBIG (Python ignores SIGXFSZ) and close
/// the USB connection when the phone sent a larger backup file.
const DEFAULT_FILE_LIMIT: u64 = 2 * 1024 * 1024 * 1024;
const EVIDENCE_FILE_LIMIT: u64 = 256 * 1024 * 1024 * 1024;
/// CPU time allowed to an engine. The wall-clock deadline is the real bound;
/// the CPU limit only stops runaway work and must never be shorter than the
/// deadline. A fixed 900 s limit would kill (SIGXCPU) an iPhone copy after
/// about 40-60 minutes (measured: 76 s of CPU per 5 minutes over USB 2.0),
/// long before its four-hour deadline.
fn cpu_limit_seconds(timeout: Duration) -> u64 {
    timeout.as_secs().saturating_add(60).max(900)
}
/// The last bytes a monitored program wrote, for an observer that reads its
/// own progress lines (ADB's percentage) while it runs.
type Tail = std::sync::Arc<std::sync::Mutex<Vec<u8>>>;
/// Called while a monitored program runs, with the last bytes it wrote.
type Observer<'a> = &'a dyn Fn(&[u8]);
const TAIL_BYTES: usize = 512;
fn drain(mut stream: impl Read, tail: Option<Tail>) -> Vec<u8> {
    let mut kept = Vec::new();
    let mut chunk = [0u8; 8192];
    loop {
        match stream.read(&mut chunk) {
            Ok(0) | Err(_) => break,
            Ok(n) => {
                if let Some(Ok(mut last)) = tail.as_ref().map(|t| t.lock()) {
                    last.extend_from_slice(&chunk[..n]);
                    let excess = last.len().saturating_sub(TAIL_BYTES);
                    last.drain(..excess);
                }
                let remaining = MAX_OUTPUT - kept.len();
                kept.extend_from_slice(&chunk[..n.min(remaining)])
            }
        }
    }
    kept
}
/// Programs and arguments come only from fixed adapters after catalog verification.
/// Pipes are drained concurrently and capped; no private stdout is logged.
pub fn run(
    executable: &Path,
    args: &[String],
    workspace: &Path,
    cancel: &AtomicBool,
    timeout: Duration,
) -> Result<Output, String> {
    run_with_usb(executable, args, workspace, cancel, timeout, true)
}
pub(crate) fn run_with_usb(
    executable: &Path,
    args: &[String],
    workspace: &Path,
    cancel: &AtomicBool,
    timeout: Duration,
    usb: bool,
) -> Result<Output, String> {
    run_inner(
        executable,
        args,
        workspace,
        cancel,
        timeout,
        usb,
        None,
        None,
        DEFAULT_FILE_LIMIT,
    )
}
/// Secret input travels over an anonymous pipe, never argv or the environment.
pub(crate) fn run_with_input(
    executable: &Path,
    args: &[String],
    workspace: &Path,
    cancel: &AtomicBool,
    timeout: Duration,
    input: &[u8],
) -> Result<Output, String> {
    if input.len() > 4096 {
        return Err("secret_input_invalid".into());
    }
    run_inner(
        executable,
        args,
        workspace,
        cancel,
        timeout,
        true,
        Some(input),
        None,
        EVIDENCE_FILE_LIMIT,
    )
}
/// Observe only fixed adapter status while retaining cancellation and process
/// isolation. The observer gets the last bytes the program wrote.
pub(crate) fn run_monitored(
    executable: &Path,
    args: &[String],
    workspace: &Path,
    cancel: &AtomicBool,
    timeout: Duration,
    observe: &dyn Fn(&[u8]),
) -> Result<Output, String> {
    run_inner(
        executable,
        args,
        workspace,
        cancel,
        timeout,
        true,
        None,
        Some(observe),
        EVIDENCE_FILE_LIMIT,
    )
}
// The private worker behind the public run_* helpers, which fix most of
// these per use.
#[allow(clippy::too_many_arguments)]
fn run_inner(
    executable: &Path,
    args: &[String],
    workspace: &Path,
    cancel: &AtomicBool,
    timeout: Duration,
    usb: bool,
    input: Option<&[u8]>,
    observe: Option<Observer>,
    file_limit: u64,
) -> Result<Output, String> {
    if cancel.load(Ordering::SeqCst) {
        return Err("cancelled".into());
    }
    // macOS has no Linux-style parent-death signal. For the owned foreground
    // ADB server, a fixed shell guard watches a pipe whose writer lives here.
    // EOF on application exit/crash terminates the server; arguments stay data.
    let parent_watch = cfg!(target_os = "macos")
        && args.len() == 4
        && args[0] == "-L"
        && args[2] == "server"
        && args[3] == "nodaemon";
    let mut cmd = if parent_watch {
        let mut command = Command::new("/bin/sh");
        command.args(["-c", "\"$@\" </dev/null & server=$!; IFS= read -r guard; kill -TERM \"$server\" 2>/dev/null; wait \"$server\"", "enigm-adb-guard"]);
        command.arg(executable);
        command
    } else {
        Command::new(executable)
    };
    cmd.args(args)
        .current_dir(workspace)
        .env_clear()
        .stdin(if parent_watch || input.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    for key in ["SYSTEMROOT", "WINDIR", "COMSPEC"] {
        if let Some(value) = std::env::var_os(key) {
            cmd.env(key, value);
        }
    }
    cmd.env("HOME", workspace)
        .env("USERPROFILE", workspace)
        .env("XDG_CONFIG_HOME", workspace.join("config"))
        .env("XDG_CACHE_HOME", workspace.join("cache"));
    // Python, PyInstaller and native helpers must keep temporary files inside
    // the session directory so its cleanup includes their scratch data.
    let temporary = workspace.join("temporary");
    std::fs::create_dir_all(&temporary).map_err(|_| "workspace_failed")?;
    cmd.env("TMPDIR", &temporary)
        .env("TMP", &temporary)
        .env("TEMP", &temporary);
    cmd.env("ADB_USB", if usb { "1" } else { "0" })
        .env("ADB_MDNS", "0")
        .env("ADB_MDNS_AUTO_CONNECT", "0")
        .env("ADB_EMU", "0")
        .env("ANDROID_USER_HOME", workspace.join(".android"));
    // Lets adapters stop (and remove what they wrote) if this application
    // exits while they run: macOS has no parent-death signal, so an iPhone
    // copy otherwise continued orphaned into an unmanaged workspace.
    cmd.env("ENIGM_PARENT_PID", std::process::id().to_string());
    cmd.env("MVT_NETWORK_ACCESS_ALLOWED", "false")
        .env("ENIGM_MVT_COVERAGE", "1")
        .env("MVT_CONFIG_FOLDER", workspace.join("mvt-config"))
        .env("MVT_NO_CHECK_UPDATES", "1")
        .env("PYTHONNOUSERSITE", "1")
        .env("PYTHONUTF8", "1")
        .env("PYTHONPATH", "");
    // A minimal PATH prevents evidence directories from supplying commands.
    #[cfg(unix)]
    cmd.env("PATH", "/usr/bin:/bin");
    #[cfg(windows)]
    if let Some(root) = std::env::var_os("SYSTEMROOT") {
        cmd.env("PATH", Path::new(&root).join("System32"));
    }
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        cmd.process_group(0);
        #[cfg(target_os = "linux")]
        let parent_pid = std::process::id();
        let cpu_seconds = cpu_limit_seconds(timeout) as libc::rlim_t;
        let file_bytes = file_limit as libc::rlim_t;
        // SAFETY: between fork and exec the closure only makes async-signal-safe
        // system calls (prctl, getppid, setrlimit) and allocates nothing.
        // nosemgrep: rust.lang.security.unsafe-usage.unsafe-usage
        unsafe {
            cmd.pre_exec(move || {
                #[cfg(target_os = "linux")]
                if libc::prctl(libc::PR_SET_PDEATHSIG, libc::SIGKILL) != 0
                    || libc::getppid() as u32 != parent_pid
                {
                    // The parent is gone or cannot be watched. No allocation
                    // here: only a raw OS error is safe between fork and exec.
                    return Err(std::io::Error::from_raw_os_error(libc::ESRCH));
                }
                let cpu = libc::rlimit {
                    rlim_cur: cpu_seconds,
                    rlim_max: cpu_seconds,
                };
                if libc::setrlimit(libc::RLIMIT_CPU, &cpu) != 0 {
                    return Err(std::io::Error::last_os_error());
                }
                let file = libc::rlimit {
                    rlim_cur: file_bytes,
                    rlim_max: file_bytes,
                };
                if libc::setrlimit(libc::RLIMIT_FSIZE, &file) != 0 {
                    return Err(std::io::Error::last_os_error());
                }
                Ok(())
            });
        }
    }
    let mut child = cmd.spawn().map_err(|_| "engine_start_failed")?;
    let mut lifetime_pipe = child.stdin.take();
    #[cfg(windows)]
    let mut job = Some(crate::windows_job::Job::attach(&mut child)?);
    let out = child.stdout.take().ok_or("engine_pipe_failed")?;
    let err = child.stderr.take().ok_or("engine_pipe_failed")?;
    let tail: Option<Tail> = observe.map(|_| Tail::default());
    let (out_tail, err_tail) = (tail.clone(), tail.clone());
    let stdout = std::thread::spawn(move || drain(out, out_tail));
    let stderr = std::thread::spawn(move || drain(err, err_tail));
    if let Some(input) = input {
        // At most one pipe-buffer of input; output is already being drained.
        // Close stdin immediately so the fixed adapter can read through EOF.
        let mut pipe = lifetime_pipe.take().ok_or("engine_pipe_failed")?;
        if pipe.write_all(input).is_err() {
            let _ = child.kill();
            let _ = child.wait();
            return Err("engine_pipe_failed".into());
        }
    }
    let started = Instant::now();
    let mut failure = None;
    let mut observed = Instant::now();
    let status = loop {
        if observed.elapsed() >= Duration::from_millis(250) {
            if let Some(observe) = observe {
                let last = tail
                    .as_ref()
                    .and_then(|t| t.lock().ok().map(|b| b.clone()))
                    .unwrap_or_default();
                observe(&last);
            }
            observed = Instant::now();
        }
        if cancel.load(Ordering::SeqCst) || started.elapsed() >= timeout {
            failure = Some(if cancel.load(Ordering::SeqCst) {
                "cancelled"
            } else {
                "engine_timeout"
            });
            #[cfg(unix)]
            // SAFETY: kill takes plain integers; the group is the one created for this child.
            // nosemgrep: rust.lang.security.unsafe-usage.unsafe-usage
            unsafe {
                libc::kill(-(child.id() as i32), libc::SIGKILL);
            }
            #[cfg(windows)]
            drop(job.take());
            let _ = child.kill();
            break child.wait().map_err(|_| "engine_wait_failed")?;
        }
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => std::thread::sleep(Duration::from_millis(50)),
            Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err("engine_wait_failed".into());
            }
        }
    };
    // Kill descendants retaining inherited pipes after the parent exits.
    #[cfg(unix)]
    // SAFETY: kill takes plain integers; the group is the one created for this child.
    // nosemgrep: rust.lang.security.unsafe-usage.unsafe-usage
    unsafe {
        libc::kill(-(child.id() as i32), libc::SIGKILL);
    }
    #[cfg(windows)]
    drop(job.take());
    let out = stdout.join().unwrap_or_default();
    let err = stderr.join().unwrap_or_default();
    if let Some(reason) = failure {
        return Err(reason.into());
    }
    #[cfg(unix)]
    let signal = {
        use std::os::unix::process::ExitStatusExt;
        status.signal()
    };
    #[cfg(not(unix))]
    let signal = None;
    Ok(Output {
        code: status.code(),
        signal,
        stdout: out,
        stderr: err,
    })
}
#[cfg(all(test, unix))]
mod tests {
    use super::*;
    #[test]
    fn private_input_is_delivered_and_closed() {
        let work = tempfile::tempdir().unwrap();
        let input = "synthetic-pässword\nwith newline".as_bytes();
        let result = run_with_input(
            Path::new("/bin/cat"),
            &[],
            work.path(),
            &AtomicBool::new(false),
            Duration::from_secs(2),
            input,
        )
        .unwrap();
        assert_eq!(result.code, Some(0));
        assert_eq!(result.stdout, input);
        assert!(result.stderr.is_empty());
    }
    #[test]
    fn cancellation_prevents_spawn() {
        let d = tempfile::tempdir().unwrap();
        assert_eq!(
            run(
                Path::new("/bin/true"),
                &[],
                d.path(),
                &AtomicBool::new(true),
                Duration::from_secs(1)
            )
            .err()
            .unwrap(),
            "cancelled"
        )
    }
    #[test]
    fn timeouts_terminate_processes() {
        let d = tempfile::tempdir().unwrap();
        assert_eq!(
            run(
                Path::new("/bin/sleep"),
                &["10".into()],
                d.path(),
                &AtomicBool::new(false),
                Duration::from_millis(50)
            )
            .err()
            .unwrap(),
            "engine_timeout"
        )
    }
    fn limits(run: impl Fn(&[String], &Path) -> Output) -> (u64, u64) {
        let d = tempfile::tempdir().unwrap();
        let out = run(&["-c".into(), "ulimit -t; ulimit -f".into()], d.path());
        let text = String::from_utf8(out.stdout).unwrap();
        let values: Vec<u64> = text.lines().map(|v| v.trim().parse().unwrap()).collect();
        // `ulimit -f` counts 512- or 1024-byte blocks depending on the shell.
        (values[0], values[1])
    }
    #[test]
    fn long_engines_get_cpu_time_for_their_whole_deadline() {
        // Regression: fixed 900 s CPU and 2 GiB file limits interrupted long
        // iPhone copies (four-hour deadline).
        let four_hours = Duration::from_secs(4 * 3600);
        let (cpu, file) = limits(|args, work| {
            run_monitored(
                Path::new("/bin/sh"),
                args,
                work,
                &AtomicBool::new(false),
                four_hours,
                &|_| {},
            )
            .unwrap()
        });
        assert!(cpu >= four_hours.as_secs(), "cpu limit {cpu}");
        let evidence_file = file;
        // Short engines keep the original bounds.
        let (cpu, file) = limits(|args, work| {
            run(
                Path::new("/bin/sh"),
                args,
                work,
                &AtomicBool::new(false),
                Duration::from_secs(15),
            )
            .unwrap()
        });
        assert_eq!(cpu, 900);
        assert!(file > 0);
        // Evidence writers may write 256 GiB files; others keep 2 GiB.
        assert_eq!(evidence_file, file * 128);
        assert_eq!(cpu_limit_seconds(Duration::from_secs(2 * 3600)), 7260);
    }
    #[test]
    fn signal_terminations_are_reported() {
        let d = tempfile::tempdir().unwrap();
        let out = run(
            Path::new("/bin/sh"),
            &["-c".into(), "kill -XCPU $$".into()],
            d.path(),
            &AtomicBool::new(false),
            Duration::from_secs(5),
        )
        .unwrap();
        assert_eq!((out.code, out.signal), (None, Some(libc::SIGXCPU)));
    }
    #[test]
    fn environment_does_not_inherit_secrets() {
        let d = tempfile::tempdir().unwrap();
        let result = run(
            Path::new("/usr/bin/env"),
            &[],
            d.path(),
            &AtomicBool::new(false),
            Duration::from_secs(2),
        )
        .unwrap();
        let out = String::from_utf8(result.stdout).unwrap();
        assert!(!out.contains("CLOUDFLARE"));
        assert!(!out.contains("GITHUB_TOKEN"));
        assert!(out
            .lines()
            .any(|line| line == format!("ENIGM_PARENT_PID={}", std::process::id())));
        for key in ["TMPDIR", "TMP", "TEMP"] {
            assert!(out
                .lines()
                .any(|line| line == format!("{key}={}", d.path().join("temporary").display())));
        }
        assert_eq!(result.code, Some(0))
    }
}
