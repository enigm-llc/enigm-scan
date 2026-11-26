//! Public signed intelligence only. This client never accepts a URL or evidence.
use enigm_scan_core::rules::VerifiedRules;
use std::{
    io::{Read, Write},
    path::Path,
    time::Duration,
};

// Schema 2 (all indicator types). Apps released before schema 2 keep the schema 1 URL.
const ENDPOINT: &str = "https://scan.enigm.io/downloads/intelligence-v2.json";
const LIMIT: u64 = 12 * 1024 * 1024;

pub fn bounded_read(reader: impl Read) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();
    reader
        .take(LIMIT + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| "rules_download_failed")?;
    if bytes.len() as u64 > LIMIT {
        return Err("rules_too_large".into());
    }
    Ok(bytes)
}

pub fn download() -> Result<Vec<u8>, String> {
    let client = reqwest::blocking::Client::builder()
        .https_only(true)
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(5))
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|_| "rules_download_failed")?;
    let response = client
        .get(ENDPOINT)
        .header(reqwest::header::ACCEPT, "application/json")
        .send()
        .map_err(|_| "rules_download_failed")?;
    if response.status() != reqwest::StatusCode::OK {
        return Err("rules_download_failed".into());
    }
    if response.content_length().is_some_and(|size| size > LIMIT) {
        return Err("rules_too_large".into());
    }
    bounded_read(response)
}

/// Select the highest currently valid authenticated bundle, including offline.
/// A malformed update cannot replace the last valid local bundle.
pub fn select<'a>(
    candidates: impl IntoIterator<Item = &'a [u8]>,
    keys: &[u8],
    now: i64,
    floor: u64,
) -> Result<Vec<u8>, String> {
    let mut best: Option<(u64, &[u8])> = None;
    for bytes in candidates {
        if let Ok(rules) = VerifiedRules::verify(bytes, keys, now, floor) {
            if best
                .as_ref()
                .is_none_or(|(version, _)| rules.version() > *version)
            {
                best = Some((rules.version(), bytes));
            }
        }
    }
    best.map(|(_, bytes)| bytes.to_vec())
        .ok_or("no_valid_rules".into())
}

pub fn cached(data: &Path) -> Option<Vec<u8>> {
    bounded_read(std::fs::File::open(data.join("intelligence.json")).ok()?).ok()
}

/// Atomic replacement: partial downloads and crashes never truncate the cache.
pub fn save(data: &Path, bytes: &[u8], keys: &[u8], now: i64, floor: u64) -> Result<(), String> {
    VerifiedRules::verify(bytes, keys, now, floor)?;
    let mut file = tempfile::NamedTempFile::new_in(data).map_err(|_| "rules_cache_failed")?;
    file.write_all(bytes).map_err(|_| "rules_cache_failed")?;
    file.as_file()
        .sync_all()
        .map_err(|_| "rules_cache_failed")?;
    file.persist(data.join("intelligence.json"))
        .map_err(|_| "rules_cache_failed")?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    const BUNDLE: &[u8] = include_bytes!("../../../src-tauri/resources/intelligence/bundle.json");
    const KEY: &[u8; 32] =
        include_bytes!("../../../src-tauri/resources/intelligence/public-key.bin");
    fn now() -> i64 {
        use base64::Engine;
        let envelope: serde_json::Value = serde_json::from_slice(BUNDLE).unwrap();
        let payload = base64::engine::general_purpose::STANDARD
            .decode(envelope["payload"].as_str().unwrap())
            .unwrap();
        let bundle: serde_json::Value = serde_json::from_slice(&payload).unwrap();
        bundle["issuedAt"].as_i64().unwrap() + 1
    }
    #[test]
    fn invalid_remote_keeps_valid_offline_but_never_ignores_expiry_or_floor() {
        assert_eq!(
            select([&b"tampered"[..], BUNDLE], KEY, now(), 1).unwrap(),
            BUNDLE
        );
        assert!(select([BUNDLE], KEY, now() + 100 * 86400, 1).is_err());
        assert!(select([BUNDLE], KEY, now(), u64::MAX).is_err());
    }
    #[test]
    fn cache_replacement_is_verified_and_preserves_last_good_copy() {
        let dir = tempfile::tempdir().unwrap();
        save(dir.path(), BUNDLE, KEY, now(), 1).unwrap();
        assert!(save(dir.path(), b"tampered", KEY, now(), 1).is_err());
        assert_eq!(cached(dir.path()).unwrap(), BUNDLE);
        save(dir.path(), BUNDLE, KEY, now(), 1).unwrap();
        assert_eq!(cached(dir.path()).unwrap(), BUNDLE);
    }
    #[test]
    fn chunked_payloads_are_bounded_without_content_length() {
        assert!(bounded_read(std::io::repeat(0).take(LIMIT + 1)).is_err());
        assert_eq!(bounded_read(&b"payload"[..]).unwrap(), b"payload");
    }
}
