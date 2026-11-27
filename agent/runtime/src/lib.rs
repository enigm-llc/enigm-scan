//! Native side of Enigm Scan: verified engines, phone acquisition, signed
//! intelligence updates and the private temporary folders of each session.
pub mod acquire;
pub mod adb;
pub mod awake;
pub mod engines;
pub mod intelligence;
pub mod process;
pub mod session;
pub mod updates;
#[cfg(windows)]
mod windows_job;

/// How the app names itself in its two requests to scan.enigm.io: its
/// version and the kind of system, the same for every copy of a release.
/// Nothing in it identifies the computer or the person; the download server
/// counts these anonymously (docs/STATISTICS.md).
pub fn user_agent() -> String {
    format!(
        "EnigmScan/{} ({}; {})",
        env!("CARGO_PKG_VERSION"),
        std::env::consts::OS,
        std::env::consts::ARCH
    )
}

#[cfg(test)]
mod user_agent_tests {
    #[test]
    fn names_only_the_version_and_the_kind_of_system() {
        let agent = super::user_agent();
        let expected = format!(
            "EnigmScan/{} ({}; {})",
            env!("CARGO_PKG_VERSION"),
            std::env::consts::OS,
            std::env::consts::ARCH
        );
        assert_eq!(agent, expected);
        assert!(agent.starts_with("EnigmScan/") && agent.is_ascii() && agent.len() < 64);
    }
}
