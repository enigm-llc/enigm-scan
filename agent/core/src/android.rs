//! Android inventory read over ADB without root: installed packages with
//! their installer and APK SHA-256, the phone's open network sockets, and the
//! settings that can redirect its traffic. Everything is matched locally
//! against the verified signed indicators; nothing leaves the computer.
use crate::{
    model::{bounded, Finding, Report},
    rules::{Kind, VerifiedRules},
    scan::Matches,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};

/// Bounded so that a hostile or huge device listing cannot exhaust memory.
pub const MAX_PACKAGES: usize = 4000;
pub const MAX_CONNECTIONS: usize = 4000;

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Package {
    pub id: String,
    pub path: String,
    pub installer: Option<String>,
    pub sha256: Option<String>,
    /// Pre-installed by the manufacturer (`pm list packages -s`), even when
    /// a store update moved its APK under /data/app.
    #[serde(default)]
    pub system: bool,
    /// Granted sensitive runtime permissions (short names, e.g. `RECORD_AUDIO`).
    #[serde(default)]
    pub granted: Vec<String>,
    /// `firstInstallTime` as reported by the phone, in its local time.
    #[serde(default)]
    pub first_install: Option<String>,
    /// The app's user ID (`pm list packages -U`), to match network usage.
    #[serde(default)]
    pub uid: Option<u32>,
}
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Inventory {
    pub packages: Vec<Package>,
    /// "completed", "unsupported" (denied by the OS) or "failed".
    pub packages_status: String,
    pub hashes_status: String,
    pub remote_addresses: Vec<String>,
    pub network_status: String,
    /// Bytes each app sent in the background (package, bytes), largest first,
    /// from the phone's network usage statistics.
    #[serde(default)]
    pub background_upload: Vec<(String, u64)>,
    /// "completed", "skipped", "unsupported" or "failed".
    #[serde(default)]
    pub upload_status: String,
    pub private_dns_mode: Option<String>,
    pub private_dns_host: Option<String>,
    pub http_proxy: Option<String>,
    // Behavioural data (see `behavior.rs`). Empty in inventories written by
    // older app versions, which then skip behavioural analysis.
    #[serde(default)]
    pub behavior_status: String,
    #[serde(default)]
    pub settings_status: String,
    #[serde(default)]
    pub accessibility_services: Vec<String>,
    #[serde(default)]
    pub notification_listeners: Vec<String>,
    #[serde(default)]
    pub input_methods: Vec<String>,
    #[serde(default)]
    pub default_input_method: Option<String>,
    #[serde(default)]
    pub default_sms: Option<String>,
    #[serde(default)]
    pub always_on_vpn: Option<String>,
    #[serde(default)]
    pub admins_status: String,
    #[serde(default)]
    pub device_admins: Vec<String>,
    /// Packages with a launcher icon; `None` when the phone cannot list them.
    #[serde(default)]
    pub launchable: Option<Vec<String>>,
    #[serde(default)]
    pub permissions_status: String,
    #[serde(default)]
    pub app_ops_status: String,
    #[serde(default)]
    pub app_ops: Vec<crate::behavior::AppOp>,
    #[serde(default)]
    pub integrity_status: String,
    #[serde(default)]
    pub properties: std::collections::BTreeMap<String, String>,
    #[serde(default)]
    pub selinux: Option<String>,
    #[serde(default)]
    pub su_paths: Vec<String>,
}

fn package_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 255
        && value
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'.' || c == b'_')
}
/// `pm list packages -f -i -U` lines:
/// `package:/data/app/~~x==/com.app-y==/base.apk=com.app  installer=com.android.vending uid:10123`
pub fn parse_packages(text: &str) -> Vec<Package> {
    let mut packages = Vec::new();
    for line in text.lines() {
        let Some(rest) = line.trim().strip_prefix("package:") else {
            continue;
        };
        let mut fields = rest.split_whitespace();
        let Some(first) = fields.next() else { continue };
        // The path itself may contain '=', so the package id follows the last one.
        let Some(split) = first.rfind('=') else {
            continue;
        };
        let (path, id) = (&first[..split], &first[split + 1..]);
        if !package_id(id) || path.is_empty() || path.len() > 1024 {
            continue;
        }
        let installer = fields
            .find_map(|field| field.strip_prefix("installer="))
            .filter(|value| *value != "null" && package_id(value))
            .map(str::to_owned);
        let uid = rest
            .split_whitespace()
            .find_map(|field| field.strip_prefix("uid:"))
            .and_then(|value| value.split(',').next()?.parse().ok());
        packages.push(Package {
            id: id.into(),
            path: path.into(),
            installer,
            uid,
            ..Default::default()
        });
        if packages.len() >= MAX_PACKAGES {
            break;
        }
    }
    packages
}
/// Bytes sent in the background per app user ID, from the "UID stats"
/// section of `dumpsys netstats detail` (`set=DEFAULT` is background; only
/// untagged totals, `tag=0x0`, so nothing is counted twice).
pub fn parse_background_upload(text: &str) -> std::collections::HashMap<u32, u64> {
    let mut sent = std::collections::HashMap::new();
    let mut section = false;
    let mut current: Option<u32> = None;
    for line in text.lines().take(2_000_000) {
        let trimmed = line.trim();
        if trimmed.ends_with("stats:") && !trimmed.starts_with("ident=") {
            section = trimmed == "UID stats:";
            current = None;
            continue;
        }
        if !section {
            continue;
        }
        if trimmed.starts_with("ident=") {
            let field = |name: &str| {
                trimmed
                    .split_whitespace()
                    .find_map(|f| f.strip_prefix(name))
                    .map(str::to_owned)
            };
            current = (field("set=").as_deref() == Some("DEFAULT")
                && field("tag=").as_deref() == Some("0x0"))
            .then(|| field("uid=")?.parse().ok())
            .flatten();
            continue;
        }
        let Some(uid) = current else { continue };
        let bytes = trimmed
            .split_whitespace()
            .find_map(|f| f.strip_prefix("tb=").or_else(|| f.strip_prefix("txBytes=")))
            .and_then(|value| value.parse::<u64>().ok());
        if let Some(bytes) = bytes {
            let total: &mut u64 = sent.entry(uid).or_default();
            *total = total.saturating_add(bytes);
        }
    }
    sent
}
/// Marks the packages listed by `pm list packages -s` as pre-installed.
pub fn mark_system(packages: &mut [Package], text: &str) -> usize {
    let ids: std::collections::HashSet<&str> = text
        .lines()
        .filter_map(|line| line.trim().strip_prefix("package:"))
        .map(|id| id.split_whitespace().next().unwrap_or(""))
        .filter(|id| package_id(id))
        .collect();
    let mut marked = 0;
    for package in packages.iter_mut().filter(|p| ids.contains(p.id.as_str())) {
        package.system = true;
        marked += 1;
    }
    marked
}
/// Package installers that mean "installed from an APK file": the system
/// package installer or no installer at all. Stores and MDM are excluded.
pub(crate) const SIDELOAD_INSTALLERS: &[&str] = &[
    "com.google.android.packageinstaller",
    "com.android.packageinstaller",
    "com.android.shell",
];
impl Inventory {
    pub fn package(&self, id: &str) -> Option<&Package> {
        self.packages.iter().find(|p| p.id == id)
    }
    /// Pre-installed, or installed from a known app store. `None` when the
    /// package is not in the inventory, so callers keep the alert.
    pub fn trusted(&self, id: &str) -> Option<bool> {
        self.package(id)
            .map(|p| p.system || p.installer.as_deref().is_some_and(|i| STORES.contains(&i)))
    }
}
fn sideloaded(package: &Package) -> bool {
    !package.system
        && package.path.starts_with("/data/app/")
        && package
            .installer
            .as_deref()
            .is_none_or(|i| SIDELOAD_INSTALLERS.contains(&i))
}
/// Paths that are safe to pass to `sha256sum` inside single quotes.
pub fn hashable(path: &str) -> bool {
    (path.starts_with("/data/app/") || path.starts_with("/data/app-private/"))
        && path.ends_with(".apk")
        && !path.contains(['\'', '\n', '\r', '\0', '\\'])
}
/// `sha256sum` output: `<64 hex>  <path>`.
pub fn apply_hashes(packages: &mut [Package], text: &str) -> usize {
    let mut applied = 0;
    for line in text.lines() {
        let mut parts = line.splitn(2, char::is_whitespace);
        let (Some(hash), Some(path)) = (parts.next(), parts.next()) else {
            continue;
        };
        let path = path.trim();
        if hash.len() != 64 || !hash.bytes().all(|c| c.is_ascii_hexdigit()) {
            continue;
        }
        for package in packages.iter_mut().filter(|p| p.path == path) {
            package.sha256 = Some(hash.to_ascii_lowercase());
            applied += 1;
        }
    }
    applied
}
fn public(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            !(v4.is_unspecified()
                || v4.is_loopback()
                || v4.is_private()
                || v4.is_link_local()
                || v4.is_broadcast()
                || v4.is_multicast()
                || v4.octets()[0] == 100 && (64..128).contains(&v4.octets()[1]))
        }
        IpAddr::V6(v6) => {
            if let Some(v4) = v6.to_ipv4_mapped() {
                return public(IpAddr::V4(v4));
            }
            let first = v6.segments()[0];
            !(v6.is_unspecified()
                || v6.is_loopback()
                || v6.is_multicast()
                || first & 0xfe00 == 0xfc00
                || first & 0xffc0 == 0xfe80)
        }
    }
}
fn hex_ipv4(hex: &str) -> Option<IpAddr> {
    let value = u32::from_str_radix(hex, 16).ok()?;
    // /proc/net stores the address in host (little-endian) byte order.
    Some(IpAddr::V4(Ipv4Addr::from(value.swap_bytes())))
}
fn hex_ipv6(hex: &str) -> Option<IpAddr> {
    if hex.len() != 32 {
        return None;
    }
    let mut bytes = [0u8; 16];
    for word in 0..4 {
        let value = u32::from_str_radix(&hex[word * 8..word * 8 + 8], 16).ok()?;
        bytes[word * 4..word * 4 + 4].copy_from_slice(&value.to_le_bytes());
    }
    Some(IpAddr::V6(Ipv6Addr::from(bytes)))
}
/// Remote public addresses from `/proc/net/{tcp,tcp6,udp,udp6}`.
pub fn parse_proc_net(text: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for line in text.lines() {
        let fields: Vec<&str> = line.split_whitespace().collect();
        if fields.len() < 3 || !fields[0].ends_with(':') {
            continue;
        }
        let Some((address, _port)) = fields[2].split_once(':') else {
            continue;
        };
        let ip = match address.len() {
            8 => hex_ipv4(address),
            32 => hex_ipv6(address),
            _ => None,
        };
        if let Some(ip) = ip.filter(|ip| public(*ip)) {
            let ip = match ip {
                IpAddr::V6(v6) => v6
                    .to_ipv4_mapped()
                    .map(IpAddr::V4)
                    .unwrap_or(IpAddr::V6(v6)),
                v4 => v4,
            };
            let value = ip.to_string();
            if !out.contains(&value) {
                out.push(value);
            }
        }
        if out.len() >= MAX_CONNECTIONS {
            break;
        }
    }
    out
}
/// Stores Android ships with, by manufacturer. Apps from anywhere else are
/// listed for review: sideloading is how most stalkerware gets installed.
pub(crate) const STORES: &[&str] = &[
    "com.android.vending",
    "com.google.android.packageinstaller.store",
    "com.sec.android.app.samsungapps",
    "com.huawei.appmarket",
    "com.amazon.venezia",
    "com.xiaomi.market",
    "com.xiaomi.mipicks",
    "com.heytap.market",
    "com.oppo.market",
    "com.bbk.appstore",
    "com.nothing.appstore",
    "com.oneplus.market",
    "com.lenovo.leos.appstore",
    "com.motorola.ccc.ota",
];
/// Apps that sent a lot in the background: a review point only for an app
/// installed outside the stores (over 20 MB) or one that already acts like
/// spyware (over 5 MB). Backups and sync of ordinary apps are only counted.
fn background_upload(inventory: &Inventory, described: &BTreeSet<String>, report: &mut Report) {
    const MB: u64 = 1024 * 1024;
    if inventory.upload_status.is_empty() {
        return;
    }
    let mut flagged = 0;
    for (id, bytes) in &inventory.background_upload {
        let package = inventory.packages.iter().find(|p| &p.id == id);
        let spyware_like = described.contains(id);
        let outside_stores = package.is_some_and(sideloaded);
        if !((spyware_like && *bytes > 5 * MB) || (outside_stores && *bytes > 20 * MB)) {
            continue;
        }
        flagged += 1;
        if flagged > 10 || report.findings.len() >= 500 {
            continue;
        }
        report.findings.push(heuristic(
            "background_upload",
            "android_background_upload",
            if spyware_like { "medium" } else { "low" },
            &format!("{id} sent {} MB in the background", bytes / MB),
            "Review point: spyware sends what it collects in the background, but backups and sync do too. The phone counts this since its usage statistics were last reset.",
            "If you do not recognise this app or why it sends so much, uninstall it and ask an expert to review the phone.",
        ));
    }
    report.check(
        "android_background_upload",
        &inventory.upload_status,
        &if inventory.upload_status == "skipped" {
            "Background data per app was not reviewed: the person did not ask for it.".to_string()
        } else {
            format!(
                "{} apps sent data in the background; {flagged} worth reviewing (installed outside the stores or acting like spyware).",
                inventory.background_upload.len()
            )
        },
    );
}
fn heuristic(
    id: &str,
    category: &str,
    severity: &str,
    evidence: &str,
    limitation: &str,
    recommendation: &str,
) -> Finding {
    let digest = Sha256::digest(format!("{category}\0{evidence}").as_bytes());
    Finding {
        id: format!("android.{}", crate::hex(&digest))[..40].into(),
        category: category.into(),
        source: "https://github.com/enigm-llc/enigm-scan".into(),
        evidence: bounded(evidence, 1800),
        severity: severity.into(),
        confidence: "low".into(),
        timestamp: None,
        rule: format!("enigm.heuristic.{id}"),
        rule_version: "1".into(),
        limitations: vec![limitation.into()],
        recommendation: recommendation.into(),
    }
}

/// Match the inventory against the signed indicators and record coverage.
/// Indicator matches become findings; review points use `enigm.heuristic.*`.
pub fn analyze(inventory: &Inventory, rules: &VerifiedRules, report: &mut Report) {
    let mut matches = Matches::new(rules);
    let mut hashed = 0;
    for package in inventory.packages.iter().take(MAX_PACKAGES) {
        matches.inspect(
            report,
            Kind::AppId,
            &package.id,
            &format!("installed app {}", package.id),
            None,
        );
        if let Some(hash) = &package.sha256 {
            hashed += 1;
            matches.inspect(
                report,
                Kind::Sha256,
                hash,
                &format!("APK of {}", package.id),
                None,
            );
        }
    }
    for address in inventory.remote_addresses.iter().take(MAX_CONNECTIONS) {
        matches.inspect(report, Kind::Ip, address, "open network connection", None);
    }
    if let Some(host) = &inventory.private_dns_host {
        matches.inspect(report, Kind::Domain, host, "private DNS server", None);
        if let Some(found) = crate::links::assess_in(host, crate::links::Context::Browsing) {
            if report.findings.len() < 500 {
                report.findings.push(heuristic(
                    "private_dns_lookalike",
                    "android_private_dns",
                    "high",
                    &format!("Private DNS uses {host}: {}", found.reason),
                    "A private DNS server sees every address the phone looks up and can redirect it. A server imitating a known brand is not a normal choice.",
                    "If you did not set it, switch Private DNS to automatic and have the phone reviewed by an expert.",
                ));
            }
        }
    }
    if let Some(proxy) = &inventory.http_proxy {
        let host = proxy.rsplit_once(':').map(|(h, _)| h).unwrap_or(proxy);
        matches.inspect(report, Kind::Domain, host, "HTTP proxy", None);
        matches.inspect(report, Kind::Ip, host, "HTTP proxy", None);
    }
    let third_party: Vec<&Package> = inventory
        .packages
        .iter()
        .filter(|p| !p.system && p.path.starts_with("/data/app/"))
        .collect();
    report.check(
        "android_app_inventory",
        &inventory.packages_status,
        &format!(
            "{} installed packages ({} user-installed) compared with signed app identifiers; {} APK files hashed and compared with known malware and stalkerware hashes.",
            inventory.packages.len(), third_party.len(), hashed
        ),
    );
    report.check(
        "android_network_snapshot",
        &inventory.network_status,
        &if inventory.network_status == "skipped" {
            "Open connections were not reviewed: the person did not ask for it.".to_string()
        } else {
            format!(
                "{} public addresses with open sockets compared with known spyware and stalkerware infrastructure. A snapshot shows only connections open at that moment.",
                inventory.remote_addresses.len()
            )
        },
    );
    report.network_connections = report
        .network_connections
        .saturating_add(inventory.remote_addresses.len() as u64);
    // Apps that act like spyware get their own finding with the evidence.
    let described = crate::behavior::analyze(inventory, report);
    background_upload(inventory, &described, report);
    // Review points: never presented as infections.
    // Only apps installed from an APK file: other stores (F-Droid, work
    // profiles…) and updates of pre-installed apps are not review points.
    let sideloaded: Vec<&str> = inventory
        .packages
        .iter()
        .filter(|p| sideloaded(p) && !described.contains(&p.id))
        .map(|p| p.id.as_str())
        .collect();
    if !sideloaded.is_empty() && report.findings.len() < 500 {
        report.findings.push(heuristic(
            "sideloaded",
            "android_sideloaded_apps",
            "low",
            &format!("{} app(s) not installed from a known app store: {}", sideloaded.len(), sideloaded.join(", ")),
            "Installing outside an app store is common for legitimate apps too. This is a point to review, not an indicator of infection.",
            "Check that you recognise every app listed. Uninstall any you did not install yourself.",
        ));
    }
    if let Some(proxy) = inventory
        .http_proxy
        .as_ref()
        .filter(|p| !p.is_empty() && p.as_str() != ":0")
    {
        // A proxy on dynamic DNS or a tunnel sends the phone's traffic to
        // someone's own computer, not to a workplace or a provider.
        let host = proxy.rsplit_once(':').map_or(proxy.as_str(), |(h, _)| h);
        let hosting = crate::infrastructure::classify(host)
            .filter(|h| h.class != crate::infrastructure::Class::Collector);
        if report.findings.len() < 500 {
            report.findings.push(heuristic(
                "proxy",
                "android_traffic_redirect",
                if hosting.is_some() { "high" } else { "medium" },
                &match &hosting {
                    Some(h) => format!(
                        "A global HTTP proxy is configured: {proxy} ({}, {})",
                        h.kind, h.service
                    ),
                    None => format!("A global HTTP proxy is configured: {proxy}"),
                },
                "Some workplaces configure proxies on purpose. Malware can also use one to intercept traffic.",
                "If you did not set this proxy, remove it in the network settings and review the device with an expert.",
            ));
        }
    }
    let dns = match (
        inventory.private_dns_mode.as_deref(),
        inventory.private_dns_host.as_deref(),
    ) {
        (Some("hostname"), Some(host)) if !host.is_empty() => {
            format!("Private DNS uses {host}, compared with known spyware infrastructure.")
        }
        (Some("off"), _) => "Private DNS is off.".into(),
        _ => "Private DNS is automatic or not reported.".into(),
    };
    let proxy = if inventory.http_proxy.is_some() {
        "A global HTTP proxy is set."
    } else {
        "No global HTTP proxy."
    };
    report.check(
        "android_network_settings",
        "completed",
        &format!("{dns} {proxy}"),
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn a_proxy_on_dynamic_dns_is_high_and_a_self_hosted_private_dns_is_not_flagged() {
        let (b, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&b, &key, 1000, 1).unwrap();
        let inventory = Inventory {
            private_dns_mode: Some("hostname".into()),
            private_dns_host: Some("adguard.duckdns.org".into()),
            http_proxy: Some("relay.duckdns.org:8080".into()),
            ..Default::default()
        };
        let mut report = Report::new("android", 1);
        analyze(&inventory, &rules, &mut report);
        let proxy: Vec<_> = report
            .findings
            .iter()
            .filter(|f| f.category == "android_traffic_redirect")
            .collect();
        assert_eq!(proxy.len(), 1);
        assert_eq!(proxy[0].severity, "high");
        assert!(proxy[0].evidence.contains("(a dynamic DNS name"));
        assert!(!report
            .findings
            .iter()
            .any(|f| f.evidence.contains("adguard")));
    }
    #[test]
    fn package_user_ids_are_read() {
        let packages = parse_packages(
            "package:/data/app/~~a==/x-1==/base.apk=com.example.x installer=com.android.vending uid:10234\n\
             package:/system/app/Y/Y.apk=com.example.y installer=null uid:1000,1001\n\
             package:/data/app/~~b==/z-1==/base.apk=com.example.z\n",
        );
        let uids: Vec<_> = packages.iter().map(|p| p.uid).collect();
        assert_eq!(uids, vec![Some(10234), Some(1000), None]);
    }
    #[test]
    fn background_upload_is_read_from_network_statistics() {
        let text = "Dev stats:\n  ident=[{type=WIFI}] uid=-1 set=ALL tag=0x0\n    st=1 rb=1 rp=1 tb=999999 tp=1 op=0\n\
UID stats:\n\
  ident=[{type=WIFI}] uid=10234 set=DEFAULT tag=0x0\n\
    NetworkStatsHistory: bucketDuration=7200\n\
      st=1700000000 rb=5 rp=1 tb=1000 tp=2 op=0\n\
      st=1700007200 rb=5 rp=1 tb=2000 tp=2 op=0\n\
  ident=[{type=MOBILE}] uid=10234 set=FOREGROUND tag=0x0\n\
      st=1700000000 rb=5 rp=1 tb=50000 tp=2 op=0\n\
  ident=[{type=MOBILE}] uid=10234 set=DEFAULT tag=0xffffff01\n\
      st=1700000000 rb=5 rp=1 tb=70000 tp=2 op=0\n\
  ident=[{type=MOBILE}] uid=10500 set=DEFAULT tag=0x0\n\
    NetworkStatsHistory: bucketDuration=3600\n\
      bucketStart=1 activeTime=1 rxBytes=1 rxPackets=1 txBytes=300 txPackets=1 operations=0\n\
UID tag stats:\n\
  ident=[{type=WIFI}] uid=10500 set=DEFAULT tag=0x0\n\
      st=1 rb=1 rp=1 tb=123456 tp=1 op=0\n";
        let sent = parse_background_upload(text);
        // Background, untagged totals only; both formats; other sections ignored.
        assert_eq!(sent.get(&10234), Some(&3000));
        assert_eq!(sent.get(&10500), Some(&300));
        assert_eq!(sent.len(), 2);
    }
    #[test]
    fn heavy_background_upload_is_a_review_point_only_for_unusual_apps() {
        const MB: u64 = 1024 * 1024;
        let app = |id: &str, installer: Option<&str>| Package {
            id: id.into(),
            path: format!("/data/app/~~x==/{id}-1==/base.apk"),
            installer: installer.map(str::to_owned),
            ..Default::default()
        };
        let inventory = Inventory {
            packages: vec![
                app("com.example.backup", Some("com.android.vending")),
                app("com.example.sideloaded", None),
                app("com.example.watcher", Some("com.android.vending")),
            ],
            upload_status: "completed".into(),
            background_upload: vec![
                ("com.example.backup".into(), 900 * MB),
                ("com.example.sideloaded".into(), 30 * MB),
                ("com.example.watcher".into(), 6 * MB),
            ],
            ..Default::default()
        };
        let mut report = Report::new("android", 1);
        let described: BTreeSet<String> = ["com.example.watcher".to_string()].into();
        background_upload(&inventory, &described, &mut report);
        let found: Vec<_> = report
            .findings
            .iter()
            .map(|f| (f.evidence.as_str(), f.severity.as_str()))
            .collect();
        // A store app's backups are only counted.
        assert_eq!(
            found,
            vec![
                ("com.example.sideloaded sent 30 MB in the background", "low"),
                ("com.example.watcher sent 6 MB in the background", "medium"),
            ]
        );
        assert!(report
            .checks
            .iter()
            .any(|c| c.id == "android_background_upload"
                && c.detail
                    .starts_with("3 apps sent data in the background; 2 worth")));
    }
    #[test]
    fn signed_families_name_the_threat_and_monitoring_apps_are_not_spyware() {
        let bytes = include_bytes!("../../../src-tauri/resources/intelligence/bundle-v2.json");
        let key = include_bytes!("../../../src-tauri/resources/intelligence/public-key.bin");
        let release: serde_json::Value =
            serde_json::from_slice(include_bytes!("../../../intelligence/release.json")).unwrap();
        let rules =
            VerifiedRules::verify(bytes, key, release["issuedAt"].as_i64().unwrap(), 1).unwrap();
        let app = |id: &str| Package {
            id: id.into(),
            path: "/data/app/~~a==/x-1==/base.apk".into(),
            installer: Some("com.android.vending".into()),
            ..Default::default()
        };
        // Life360 is watchware in Echap's list; BadBazaar comes from ESET.
        let inventory = Inventory {
            packages: vec![
                app("com.life360.android.safetymapd"),
                app("org.telegram.FlyGram"),
            ],
            packages_status: "completed".into(),
            ..Default::default()
        };
        let mut report = Report::new("android", rules.version());
        analyze(&inventory, &rules, &mut report);
        let life360 = report
            .findings
            .iter()
            .find(|f| f.evidence.contains("life360"))
            .unwrap();
        assert_eq!(life360.category, "known_monitoring_app");
        assert_eq!(life360.severity, "low");
        assert!(life360.rule.starts_with("watchware."));
        assert!(
            life360.evidence.ends_with("— Life360 (watchware)"),
            "{}",
            life360.evidence
        );
        let flygram = report
            .findings
            .iter()
            .find(|f| f.evidence.contains("FlyGram"))
            .unwrap();
        assert_eq!(flygram.category, "known_appid_indicator");
        assert!(
            flygram.evidence.ends_with("— BadBazaar"),
            "{}",
            flygram.evidence
        );
        assert!(flygram
            .source
            .starts_with("https://github.com/eset/malware-ioc/tree/"));
        // Shared front ends never become indicators (they were in BTMOB).
        for ip in ["142.251.183.138", "104.21.64.137", "74.125.132.95"] {
            assert!(rules.matches(Kind::Ip, ip).is_empty(), "{ip}");
        }
    }
    #[test]
    fn parses_packages_paths_installers_and_rejects_noise() {
        let text = "package:/data/app/~~a1b==/com.whatsapp-x9==/base.apk=com.whatsapp  installer=com.android.vending uid:10201\n\
            package:/system/app/Camera/Camera.apk=com.nothing.camera  installer=null uid:10050\n\
            package:/data/app/~~q==/com.evil.spy-1==/base.apk=com.evil.spy  installer=null uid:10333\n\
            package:/data/app/bad/base.apk=com.bad;rm  installer=null\n\
            garbage line\n";
        let p = parse_packages(text);
        assert_eq!(p.len(), 3);
        assert_eq!(p[0].id, "com.whatsapp");
        assert_eq!(p[0].path, "/data/app/~~a1b==/com.whatsapp-x9==/base.apk");
        assert_eq!(p[0].installer.as_deref(), Some("com.android.vending"));
        assert_eq!(p[1].installer, None);
        assert!(hashable(&p[2].path));
        assert!(!hashable(&p[1].path));
        assert!(!hashable("/data/app/x'; rm -rf /'.apk"));
    }
    #[test]
    fn applies_sha256sum_output_to_the_right_package() {
        let mut p = parse_packages(
            "package:/data/app/~~a==/com.a-b==/base.apk=com.a  installer=null uid:1\n",
        );
        let n = apply_hashes(
            &mut p,
            &format!(
                "{}  /data/app/~~a==/com.a-b==/base.apk\nnot a hash  x\n",
                "AB".repeat(32)
            ),
        );
        assert_eq!(n, 1);
        assert_eq!(p[0].sha256.as_deref(), Some(&*"ab".repeat(32)));
    }
    #[test]
    fn parses_public_remote_addresses_from_proc_net() {
        // 8.8.8.8:443 established, 127.0.0.1 and 192.168.1.10 skipped, IPv6 2001:db8::1, v4-mapped 1.1.1.1.
        let text = "  sl  local_address rem_address   st\n\
            0: 0100007F:1F90 08080808:01BB 01 0\n\
            1: 0100007F:1F90 0100007F:0050 01 0\n\
            2: 0100007F:1F90 0A01A8C0:0050 01 0\n\
            3: 00000000000000000000000000000000:0000 B80D0120000000000000000001000000:01BB 01\n\
            4: 00000000000000000000000000000000:0000 0000000000000000FFFF000001010101:01BB 01\n";
        assert_eq!(
            parse_proc_net(text),
            vec!["8.8.8.8", "2001:db8::1", "1.1.1.1"]
        );
    }
    #[test]
    fn signed_app_ids_and_hashes_are_detections_and_sideloading_is_only_a_review_point() {
        let bytes = include_bytes!("../../../src-tauri/resources/intelligence/bundle-v2.json");
        let key = include_bytes!("../../../src-tauri/resources/intelligence/public-key.bin");
        let release: serde_json::Value =
            serde_json::from_slice(include_bytes!("../../../intelligence/release.json")).unwrap();
        let rules =
            VerifiedRules::verify(bytes, key, release["issuedAt"].as_i64().unwrap(), 1).unwrap();
        let app = rules
            .rules()
            .iter()
            .find(|r| r.kind == Kind::AppId)
            .unwrap();
        let hash = rules
            .rules()
            .iter()
            .find(|r| r.kind == Kind::Sha256)
            .unwrap();
        let inventory = Inventory {
            packages: vec![
                Package {
                    id: app.value.clone(),
                    path: "/data/app/~~a==/x-1==/base.apk".into(),
                    installer: None,
                    sha256: Some(hash.value.clone()),
                    ..Default::default()
                },
                Package {
                    id: "com.example.notes".into(),
                    path: "/data/app/~~b==/n-1==/base.apk".into(),
                    installer: Some("com.android.vending".into()),
                    sha256: Some("0".repeat(64)),
                    ..Default::default()
                },
            ],
            packages_status: "completed".into(),
            hashes_status: "completed".into(),
            remote_addresses: vec!["8.8.8.8".into()],
            network_status: "completed".into(),
            ..Default::default()
        };
        let mut report = Report::new("android", rules.version());
        analyze(&inventory, &rules, &mut report);
        let detections: Vec<_> = report
            .findings
            .iter()
            .filter(|f| !f.rule.starts_with("enigm.heuristic."))
            .collect();
        assert_eq!(detections.len(), 2);
        assert!(detections.iter().any(|f| f.rule == app.id));
        assert!(detections.iter().any(|f| f.rule == hash.id));
        let review: Vec<_> = report
            .findings
            .iter()
            .filter(|f| f.rule == "enigm.heuristic.sideloaded")
            .collect();
        assert_eq!(review.len(), 1);
        assert_eq!(review[0].confidence, "low");
        assert!(!review[0].evidence.contains("com.example.notes"));
        assert!(report
            .checks
            .iter()
            .any(|c| c.id == "android_app_inventory" && c.status == "completed"));
        assert_eq!(report.network_connections, 1);
    }
    #[test]
    fn connections_not_requested_are_reported_as_skipped() {
        let bytes = include_bytes!("../../../src-tauri/resources/intelligence/bundle-v2.json");
        let key = include_bytes!("../../../src-tauri/resources/intelligence/public-key.bin");
        let release: serde_json::Value =
            serde_json::from_slice(include_bytes!("../../../intelligence/release.json")).unwrap();
        let rules =
            VerifiedRules::verify(bytes, key, release["issuedAt"].as_i64().unwrap(), 1).unwrap();
        let inventory = Inventory {
            packages_status: "completed".into(),
            hashes_status: "skipped".into(),
            network_status: "skipped".into(),
            ..Default::default()
        };
        let mut report = Report::new("android", rules.version());
        analyze(&inventory, &rules, &mut report);
        let check = report
            .checks
            .iter()
            .find(|c| c.id == "android_network_snapshot")
            .unwrap();
        assert_eq!(check.status, "skipped");
        assert!(check
            .detail
            .starts_with("Open connections were not reviewed"));
        assert_eq!(report.network_connections, 0);
    }
}
