//! Owned transient ADB server. Never uses or terminates the user's default server.
use crate::{engines::Catalog, process};
use std::{
    net::{TcpListener, TcpStream},
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread::JoinHandle,
    time::{Duration, Instant},
};

pub struct Session {
    port: u16,
    stop: Arc<AtomicBool>,
    worker: Mutex<Option<JoinHandle<Result<process::Output, String>>>>,
    /// Marks the private HOME as in use (see `session::hold`); released
    /// before the folder is removed.
    lock: Mutex<Option<std::fs::File>>,
    work: Mutex<Option<Arc<tempfile::TempDir>>>,
}
impl Session {
    pub fn start(catalog: &Catalog) -> Result<Self, String> {
        Self::start_with_usb(catalog, true)
    }
    fn start_with_usb(catalog: &Catalog, usb: bool) -> Result<Self, String> {
        let (program, _) = catalog.resolve("adb")?;
        let work = Arc::new(
            tempfile::Builder::new()
                .prefix("enigm-adb-")
                .tempdir()
                .map_err(|_| "workspace_failed")?,
        );
        let lock = crate::session::hold(work.path()).map_err(|_| "workspace_failed")?;
        let reservation = TcpListener::bind("127.0.0.1:0").map_err(|_| "adb_port_unavailable")?;
        let port = reservation
            .local_addr()
            .map_err(|_| "adb_port_unavailable")?
            .port();
        let stop = Arc::new(AtomicBool::new(false));
        let thread_stop = stop.clone();
        let thread_work = work.clone();
        drop(reservation);
        let worker = std::thread::spawn(move || {
            process::run_with_usb(
                &program,
                &[
                    "-L".into(),
                    format!("tcp:{port}"),
                    "server".into(),
                    "nodaemon".into(),
                ],
                thread_work.path(),
                &thread_stop,
                Duration::from_secs(3600),
                usb,
            )
        });
        let session = Self {
            port,
            stop,
            worker: Mutex::new(Some(worker)),
            lock: Mutex::new(Some(lock)),
            work: Mutex::new(Some(work)),
        };
        let deadline = Instant::now() + Duration::from_secs(10);
        while Instant::now() < deadline {
            if !session.alive() {
                return Err("adb_server_failed".into());
            }
            if TcpStream::connect_timeout(
                &std::net::SocketAddr::from(([127, 0, 0, 1], port)),
                Duration::from_millis(100),
            )
            .is_ok()
            {
                return Ok(session);
            }
            std::thread::sleep(Duration::from_millis(50));
        }
        Err("adb_server_timeout".into())
    }
    pub fn alive(&self) -> bool {
        !self.stop.load(Ordering::SeqCst)
            && self
                .worker
                .lock()
                .ok()
                .is_some_and(|worker| worker.as_ref().is_some_and(|worker| !worker.is_finished()))
    }
    pub fn shutdown(&self) -> bool {
        self.stop.store(true, Ordering::SeqCst);
        let Ok(mut worker) = self.worker.lock() else {
            return false;
        };
        if let Some(worker) = worker.take() {
            let _ = worker.join();
        }
        if let Ok(mut lock) = self.lock.lock() {
            lock.take();
        }
        let Ok(mut work) = self.work.lock() else {
            return false;
        };
        match work.take() {
            Some(work) => Arc::try_unwrap(work)
                .map(|work| work.close().is_ok())
                .unwrap_or(false),
            None => true,
        }
    }
    pub fn run(
        &self,
        catalog: &Catalog,
        args: &[String],
        work: &Path,
        cancel: &AtomicBool,
        timeout: Duration,
    ) -> Result<process::Output, String> {
        if !self.alive() {
            return Err("adb_session_expired".into());
        }
        let (program, _) = catalog.resolve("adb")?;
        process::run(
            &program,
            &client_arguments(self.port, args),
            work,
            cancel,
            timeout,
        )
    }
}
impl Session {
    /// Like `run`, calling `observe` about once a second while it runs.
    pub fn run_monitored(
        &self,
        catalog: &Catalog,
        args: &[String],
        work: &Path,
        cancel: &AtomicBool,
        timeout: Duration,
        observe: &dyn Fn(&[u8]),
    ) -> Result<process::Output, String> {
        if !self.alive() {
            return Err("adb_session_expired".into());
        }
        let (program, _) = catalog.resolve("adb")?;
        process::run_monitored(
            &program,
            &client_arguments(self.port, args),
            work,
            cancel,
            timeout,
            observe,
        )
    }
}
fn client_arguments(port: u16, args: &[String]) -> Vec<String> {
    // An explicit numeric host is treated as remote by ADB's server launcher.
    // If this owned server exits, clients fail instead of creating a detached daemon.
    let mut all = vec![
        "-H".into(),
        "127.0.0.1".into(),
        "-P".into(),
        port.to_string(),
    ];
    all.extend_from_slice(args);
    all
}
impl Drop for Session {
    fn drop(&mut self) {
        self.shutdown();
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    #[ignore = "requires the packaged official ADB binary; never enables USB"]
    fn packaged_server_is_temporary_and_clients_cannot_restart_it() {
        let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../src-tauri/resources/engines")
            .canonicalize()
            .unwrap();
        let catalog = Catalog::new(
            root.clone(),
            &std::fs::read(root.join("manifest.json")).unwrap(),
        )
        .unwrap();
        let session = Session::start_with_usb(&catalog, false).unwrap();
        let port = session.port;
        let work = tempfile::tempdir().unwrap();
        let args = vec!["devices".into(), "-l".into()];
        let result = session
            .run(
                &catalog,
                &args,
                work.path(),
                &AtomicBool::new(false),
                Duration::from_secs(10),
            )
            .unwrap();
        assert_eq!(result.code, Some(0));
        assert_eq!(
            String::from_utf8(result.stdout).unwrap().trim(),
            "List of devices attached"
        );
        let private_path = session
            .work
            .lock()
            .unwrap()
            .as_ref()
            .unwrap()
            .path()
            .to_owned();
        assert!(session.shutdown());
        assert!(!private_path.exists());
        drop(session);
        assert!(TcpStream::connect(("127.0.0.1", port)).is_err());
        let (program, _) = catalog.resolve("adb").unwrap();
        let result = process::run_with_usb(
            &program,
            &client_arguments(port, &args),
            work.path(),
            &AtomicBool::new(false),
            Duration::from_secs(10),
            false,
        )
        .unwrap();
        assert_ne!(result.code, Some(0));
        assert!(TcpStream::connect(("127.0.0.1", port)).is_err());
    }
    #[test]
    fn clients_always_use_explicit_numeric_loopback_and_owned_port() {
        assert_eq!(
            client_arguments(43128, &["devices".into(), "-l".into()]),
            vec!["-H", "127.0.0.1", "-P", "43128", "devices", "-l"]
        );
    }
}
