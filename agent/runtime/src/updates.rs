//! Whether a newer version of the app is published. The app never updates
//! itself: a newer version is offered on the website, where the person
//! downloads it. Only the public download manifest is read, the same one the
//! website shows; the request names the app's version and kind of system
//! (`crate::user_agent`) and nothing about the person or the computer.
use serde::Deserialize;
use std::{io::Read, time::Duration};

const MANIFEST: &str = "https://scan.enigm.io/downloads/manifest.json";
const LIMIT: u64 = 256 * 1024;

/// `major.minor.patch` as numbers; anything else is not a version.
pub fn parse(version: &str) -> Option<(u64, u64, u64)> {
    let mut parts = version.trim().split('.').map(|p| {
        (!p.is_empty() && p.len() <= 9 && p.bytes().all(|b| b.is_ascii_digit()))
            .then(|| p.parse::<u64>().ok())
            .flatten()
    });
    let version = (parts.next()??, parts.next()??, parts.next()??);
    parts.next().is_none().then_some(version)
}

/// The version the manifest publishes, when it is newer than `current`.
pub fn newer(manifest: &[u8], current: &str) -> Option<String> {
    #[derive(Deserialize)]
    struct Manifest {
        version: String,
    }
    let published: Manifest = serde_json::from_slice(manifest).ok()?;
    (parse(&published.version)? > parse(current)?).then_some(published.version)
}

/// Asks the website for the published version. Any failure (no network, a
/// slow or changed server) is the same as no newer version.
pub fn check(current: &str) -> Option<String> {
    let client = reqwest::blocking::Client::builder()
        .https_only(true)
        .user_agent(crate::user_agent())
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(5))
        .timeout(Duration::from_secs(8))
        .build()
        .ok()?;
    let response = client
        .get(MANIFEST)
        .header(reqwest::header::ACCEPT, "application/json")
        .send()
        .ok()?;
    if response.status() != reqwest::StatusCode::OK {
        return None;
    }
    let mut bytes = Vec::new();
    response.take(LIMIT + 1).read_to_end(&mut bytes).ok()?;
    if bytes.len() as u64 > LIMIT {
        return None;
    }
    newer(&bytes, current)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn only_a_higher_published_version_is_offered() {
        let manifest = br#"{"version":"0.7.4","channel":"candidate","files":[]}"#;
        assert_eq!(newer(manifest, "0.7.3").as_deref(), Some("0.7.4"));
        assert_eq!(newer(manifest, "0.7.4"), None);
        assert_eq!(newer(manifest, "0.8.0"), None);
        assert_eq!(
            newer(br#"{"version":"0.10.0"}"#, "0.9.9").as_deref(),
            Some("0.10.0")
        );
        for odd in [
            &br#"{"version":"1.0"}"#[..],
            br#"{"version":"1.0.0-beta"}"#,
            br#"{"version":"x"}"#,
            b"not json",
            br#"{}"#,
        ] {
            assert_eq!(newer(odd, "0.7.3"), None);
        }
    }
}
