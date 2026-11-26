//! Bounded classic PCAP reader. It never captures, resolves, or sends traffic.
use crate::{
    model::Report,
    rules::{Kind, VerifiedRules},
    scan::Matches,
};
use std::{
    collections::HashSet,
    net::{IpAddr, Ipv4Addr, Ipv6Addr},
    sync::atomic::{AtomicBool, Ordering},
};
fn u16be(b: &[u8]) -> Option<u16> {
    Some(u16::from_be_bytes(b.get(..2)?.try_into().ok()?))
}
fn u32_at(b: &[u8], at: usize, le: bool) -> Option<u32> {
    let bytes = b.get(at..at + 4)?.try_into().ok()?;
    Some(if le {
        u32::from_le_bytes(bytes)
    } else {
        u32::from_be_bytes(bytes)
    })
}
pub fn analyze_pcap(
    bytes: &[u8],
    phone: IpAddr,
    rules: &VerifiedRules,
    report: &mut Report,
    cancel: &AtomicBool,
) -> Result<(), String> {
    analyze(bytes, Some(phone), rules, report, cancel)
}
/// Only for captures made directly by the authorized USB adapter, never imports.
pub fn analyze_usb_capture(
    bytes: &[u8],
    rules: &VerifiedRules,
    report: &mut Report,
    cancel: &AtomicBool,
) -> Result<(), String> {
    analyze(bytes, None, rules, report, cancel)
}
fn analyze(
    bytes: &[u8],
    phone: Option<IpAddr>,
    rules: &VerifiedRules,
    report: &mut Report,
    cancel: &AtomicBool,
) -> Result<(), String> {
    if bytes.len() > 128 * 1024 * 1024 || bytes.len() < 24 {
        return Err("pcap_size_invalid".into());
    }
    let (le, nano) = match &bytes[..4] {
        [0xd4, 0xc3, 0xb2, 0xa1] => (true, false),
        [0xa1, 0xb2, 0xc3, 0xd4] => (false, false),
        [0x4d, 0x3c, 0xb2, 0xa1] => (true, true),
        [0xa1, 0xb2, 0x3c, 0x4d] => (false, true),
        _ => return Err("pcap_format_unsupported".into()),
    };
    let link = u32_at(bytes, 20, le).ok_or("pcap_header_invalid")?;
    if ![1, 101, 113].contains(&link) {
        return Err("pcap_link_unsupported".into());
    }
    let mut at = 24;
    let mut connections = HashSet::new();
    let mut observed = 0;
    let mut unsupported = 0;
    let mut packets = 0;
    let mut first = None;
    let mut last = None;
    let mut matcher = Matches::new(rules);
    // Names the phone looked up, for look-alike analysis after the loop.
    let mut questions: std::collections::BTreeMap<String, Option<String>> = Default::default();
    while at < bytes.len() {
        if cancel.load(Ordering::Relaxed) {
            return Err("cancelled".into());
        }
        packets += 1;
        if packets > 1_000_000 {
            return Err("pcap_packet_limit".into());
        }
        let sec = u32_at(bytes, at, le).ok_or("pcap_truncated")?;
        let fraction = u32_at(bytes, at + 4, le).ok_or("pcap_truncated")?;
        if fraction >= if nano { 1_000_000_000 } else { 1_000_000 } {
            return Err("pcap_timestamp_invalid".into());
        }
        let len = u32_at(bytes, at + 8, le).ok_or("pcap_truncated")? as usize;
        let original = u32_at(bytes, at + 12, le).ok_or("pcap_truncated")? as usize;
        if len > original || len > 1024 * 1024 {
            return Err("pcap_packet_invalid".into());
        }
        at += 16;
        let packet = bytes.get(at..at + len).ok_or("pcap_truncated")?;
        at += len;
        let payload = match link {
            1 => {
                if packet.len() < 14 {
                    unsupported += 1;
                    continue;
                }
                let eth = u16be(&packet[12..]).unwrap();
                if ![0x800, 0x86dd].contains(&eth) {
                    unsupported += 1;
                    continue;
                }
                &packet[14..]
            }
            113 => {
                if packet.len() < 16 {
                    unsupported += 1;
                    continue;
                }
                &packet[16..]
            }
            _ => packet,
        };
        let Some((src, dst, proto, transport)) = ip_packet(payload) else {
            unsupported += 1;
            continue;
        };
        if phone.is_some_and(|ip| src != ip && dst != ip) {
            continue;
        }
        observed += 1;
        let micros = (sec as i64) * 1_000_000 + (fraction as i64) / if nano { 1000 } else { 1 };
        first = Some(first.map_or(micros, |x: i64| x.min(micros)));
        last = Some(last.map_or(micros, |x: i64| x.max(micros)));
        let time = time::OffsetDateTime::from_unix_timestamp_nanos(micros as i128 * 1000)
            .ok()
            .and_then(|x| {
                x.format(&time::format_description::well_known::Rfc3339)
                    .ok()
            });
        let sport = if [6, 17].contains(&proto) {
            u16be(transport).unwrap_or(0)
        } else {
            0
        };
        let dport = if [6, 17].contains(&proto) {
            transport.get(2..).and_then(u16be).unwrap_or(0)
        } else {
            0
        };
        let source_first = phone.map_or((src, sport) <= (dst, dport), |ip| src == ip);
        let flow = if source_first {
            format!("{proto}:{src}:{sport}>{dst}:{dport}")
        } else {
            format!("{proto}:{dst}:{dport}>{src}:{sport}")
        };
        if connections.len() >= 100000 && !connections.contains(&flow) {
            return Err("pcap_connection_limit".into());
        }
        connections.insert(flow);
        let remote = if source_first { dst } else { src };
        if phone.is_none() {
            let other = if source_first { src } else { dst };
            matcher.inspect(
                report,
                Kind::Ip,
                &other.to_string(),
                "USB captured network packet",
                time.clone(),
            );
        }
        matcher.inspect(
            report,
            Kind::Ip,
            &remote.to_string(),
            "attributed network packet",
            time.clone(),
        );
        if proto == 17 && (sport == 53 || dport == 53) && transport.len() >= 8 {
            let udp_len = u16be(&transport[4..]).unwrap_or(0) as usize;
            if udp_len < 8 || udp_len > transport.len() {
                unsupported += 1;
                continue;
            }
            let dns = &transport[8..udp_len];
            if let Some(names) = dns_questions(dns) {
                for name in names {
                    matcher.inspect(
                        report,
                        Kind::Domain,
                        &name,
                        "attributed DNS question",
                        time.clone(),
                    );
                    if questions.len() < 20000 {
                        questions.entry(name).or_insert_with(|| time.clone());
                    }
                }
            } else {
                unsupported += 1
            }
        }
    }
    if observed == 0 {
        return Err("pcap_device_not_observed".into());
    }
    // Look-alike domains the phone resolved, even if no indicator names them.
    let mut lookalikes = 0;
    for (name, at) in &questions {
        let Some(found) = crate::links::assess_in(name, crate::links::Context::Browsing) else {
            continue;
        };
        lookalikes += 1;
        if lookalikes > 20 || report.findings.len() >= 500 {
            continue;
        }
        report.findings.push(crate::extractions::finding(
            "enigm.heuristic.suspicious_link",
            "suspicious_link",
            found.severity,
            &format!("attributed DNS question: {name}: {}", found.reason),
            at.clone(),
            "Review point: the phone looked up a domain that imitates a trusted brand. Phishing and spyware infrastructure use such names, but a lookup alone does not show what was sent.",
            "Find which app or link led to this domain. If you do not recognise it, ask an expert to review the phone.",
        ));
    }
    if lookalikes > 0 {
        report.check(
            "network_lookalike_domains",
            "completed",
            &format!(
                "{} looked-up domain(s) imitate a trusted brand{}.",
                lookalikes,
                if lookalikes > 20 {
                    " (first 20 listed)"
                } else {
                    ""
                }
            ),
        );
    }
    report.network_connections = connections.len() as u64;
    report.check("network_pcap","completed",&format!("{observed} device-attributed packets, {} unique bidirectional flows; observed Unix-microsecond interval {} to {}; {unsupported} packets not decoded.",connections.len(),first.unwrap_or_default(),last.unwrap_or_default()));
    if phone.is_none() {
        report.limitations.push("Captured for up to 120 seconds through the selected phone’s authorized USB service. This is a limited observation, not continuous monitoring or proof of no surveillance.".into());
    }
    report.limitations.push(if phone.is_some() { "PCAP source and phone IP were explicitly confirmed by the operator; capture origin is not independently attested." } else { "The USB transport, rather than a manually entered IP, attributes this capture to the selected phone." }.into());
    report.limitations.push("Only classic PCAP IPv4/IPv6 IP endpoints and UDP DNS questions are decoded. Encrypted DNS/TLS content, IP fragments, extension headers, tunnels and missing packets reduce coverage. No exfiltration inference is made.".into());
    if matcher.truncated {
        report.check(
            "network_findings_limit",
            "skipped",
            "Finding limit reached; report is incomplete.",
        )
    }
    Ok(())
}
fn ip_packet(b: &[u8]) -> Option<(IpAddr, IpAddr, u8, &[u8])> {
    match b.first()? >> 4 {
        4 => {
            if b.len() < 20 {
                return None;
            }
            let ihl = ((b[0] & 15) as usize) * 4;
            let total = u16be(&b[2..])? as usize;
            if ihl < 20 || total < ihl || total > b.len() || u16be(&b[6..])? & 0x3fff != 0 {
                return None;
            }
            Some((
                Ipv4Addr::new(b[12], b[13], b[14], b[15]).into(),
                Ipv4Addr::new(b[16], b[17], b[18], b[19]).into(),
                b[9],
                &b[ihl..total],
            ))
        }
        6 => {
            if b.len() < 40 {
                return None;
            }
            let len = u16be(&b[4..])? as usize;
            if len == 0 || len + 40 > b.len() || ![6, 17, 58].contains(&b[6]) {
                return None;
            }
            Some((
                Ipv6Addr::from(<[u8; 16]>::try_from(&b[8..24]).ok()?).into(),
                Ipv6Addr::from(<[u8; 16]>::try_from(&b[24..40]).ok()?).into(),
                b[6],
                &b[40..40 + len],
            ))
        }
        _ => None,
    }
}
fn dns_questions(b: &[u8]) -> Option<Vec<String>> {
    if b.len() < 12 {
        return None;
    }
    let count = u16be(&b[4..])?;
    if count > 32 {
        return None;
    }
    let mut cursor = 12;
    let mut names = Vec::new();
    for _ in 0..count {
        let (name, end) = dns_name(b, cursor)?;
        cursor = end.checked_add(4)?;
        if cursor > b.len() {
            return None;
        }
        names.push(name)
    }
    Some(names)
}
fn dns_name(b: &[u8], start: usize) -> Option<(String, usize)> {
    let mut at = start;
    let mut end = None;
    let mut labels = Vec::new();
    let mut seen = HashSet::new();
    let mut size = 0;
    for _ in 0..128 {
        if !seen.insert(at) {
            return None;
        }
        let n = *b.get(at)?;
        if n == 0 {
            return Some((labels.join("."), end.unwrap_or(at + 1)));
        }
        if n & 0xc0 == 0xc0 {
            let target = (((n & 0x3f) as usize) << 8) | *b.get(at + 1)? as usize;
            if end.is_none() {
                end = Some(at + 2)
            }
            at = target;
            continue;
        }
        if n > 63 {
            return None;
        }
        let label = b.get(at + 1..at + 1 + n as usize)?;
        if !label.is_ascii() {
            return None;
        }
        size += n as usize + 1;
        if size > 254 {
            return None;
        }
        labels.push(std::str::from_utf8(label).ok()?.to_ascii_lowercase());
        at += n as usize + 1;
    }
    None
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn look_alike_domains_looked_up_by_the_phone_are_review_points() {
        let (bytes, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap();
        let mut report = Report::new("ios", 1);
        analyze_usb_capture(
            &dns_pcap_for(&["www", "g00gle", "com"]),
            &rules,
            &mut report,
            &AtomicBool::new(false),
        )
        .unwrap();
        let review: Vec<_> = report
            .findings
            .iter()
            .filter(|f| f.rule == "enigm.heuristic.suspicious_link")
            .collect();
        assert_eq!(review.len(), 1);
        assert!(review[0]
            .evidence
            .starts_with("attributed DNS question: www.g00gle.com"));
        assert_eq!(review[0].timestamp.as_deref(), Some("1970-01-01T00:16:40Z"));
        let mut report = Report::new("ios", 1);
        analyze_usb_capture(
            &dns_pcap_for(&["www", "google", "com"]),
            &rules,
            &mut report,
            &AtomicBool::new(false),
        )
        .unwrap();
        assert!(report.findings.is_empty());
    }
    #[test]
    fn usb_capture_requires_observed_packets_and_never_claims_manual_ip_attribution() {
        let (bundle, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&bundle, &key, 1000, 1).unwrap();
        let mut report = Report::new("ios", 1);
        analyze_usb_capture(&dns_pcap(), &rules, &mut report, &AtomicBool::new(false)).unwrap();
        assert_eq!(report.network_connections, 1);
        assert!(!report.findings.is_empty());
        assert!(report
            .limitations
            .iter()
            .any(|line| line.contains("USB transport")));
        assert!(!report
            .limitations
            .iter()
            .any(|line| line.contains("confirmed by the operator")));
        assert!(analyze_usb_capture(
            &dns_pcap()[..24],
            &rules,
            &mut Report::new("ios", 1),
            &AtomicBool::new(false)
        )
        .is_err());
    }
    #[test]
    fn rejects_dns_compression_loops() {
        assert!(dns_name(&[0xc0, 0], 0).is_none())
    }
    #[test]
    fn parses_dns_questions_without_resolving() {
        let mut b = vec![0; 12];
        b[5] = 1;
        b.extend(b"\x09indicator\x07invalid\x00\x00\x01\x00\x01");
        assert_eq!(dns_questions(&b).unwrap(), vec!["indicator.invalid"])
    }
    #[test]
    fn rejects_truncated_ipv4() {
        assert!(ip_packet(&[0x45]).is_none())
    }
    fn dns_pcap() -> Vec<u8> {
        dns_pcap_for(&["indicator", "invalid"])
    }
    fn dns_pcap_for(labels: &[&str]) -> Vec<u8> {
        let mut dns = vec![0; 12];
        dns[5] = 1;
        for label in labels {
            dns.push(label.len() as u8);
            dns.extend(label.as_bytes());
        }
        dns.extend(b"\x00\x00\x01\x00\x01");
        let mut packet = vec![0u8; 28];
        packet[0] = 0x45;
        packet[2..4].copy_from_slice(&((28 + dns.len()) as u16).to_be_bytes());
        packet[9] = 17;
        packet[12..16].copy_from_slice(&[192, 0, 2, 1]);
        packet[16..20].copy_from_slice(&[192, 0, 2, 53]);
        packet[20..22].copy_from_slice(&12345u16.to_be_bytes());
        packet[22..24].copy_from_slice(&53u16.to_be_bytes());
        packet[24..26].copy_from_slice(&((8 + dns.len()) as u16).to_be_bytes());
        packet.extend(dns);
        let mut pcap = vec![0xd4, 0xc3, 0xb2, 0xa1, 2, 0, 4, 0];
        pcap.extend([0u8; 12]);
        pcap.extend(101u32.to_le_bytes());
        for sec in [1000u32, 1001] {
            pcap.extend(sec.to_le_bytes());
            pcap.extend(0u32.to_le_bytes());
            pcap.extend((packet.len() as u32).to_le_bytes());
            pcap.extend((packet.len() as u32).to_le_bytes());
            pcap.extend(&packet);
        }
        pcap
    }
    #[test]
    fn matches_attributed_dns_and_counts_unique_flows() {
        let (b, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&b, &key, 1000, 1).unwrap();
        let mut report = Report::new("android", 1);
        analyze_pcap(
            &dns_pcap(),
            "192.0.2.1".parse().unwrap(),
            &rules,
            &mut report,
            &AtomicBool::new(false),
        )
        .unwrap();
        assert_eq!(report.network_connections, 1);
        assert_eq!(report.findings.len(), 1);
        assert_eq!(
            report.findings[0].timestamp.as_deref(),
            Some("1970-01-01T00:16:40Z")
        );
    }
    #[test]
    fn excludes_other_devices_and_obeys_cancellation() {
        let (b, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&b, &key, 1000, 1).unwrap();
        let mut report = Report::new("android", 1);
        assert_eq!(
            analyze_pcap(
                &dns_pcap(),
                "192.0.2.2".parse().unwrap(),
                &rules,
                &mut report,
                &AtomicBool::new(false)
            )
            .unwrap_err(),
            "pcap_device_not_observed"
        );
        assert!(report.findings.is_empty());
        assert_eq!(report.network_connections, 0);
        assert_eq!(
            analyze_pcap(
                &dns_pcap(),
                "192.0.2.1".parse().unwrap(),
                &rules,
                &mut report,
                &AtomicBool::new(true)
            )
            .unwrap_err(),
            "cancelled"
        );
    }
    #[test]
    fn malformed_pcaps_never_panic() {
        let (b, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&b, &key, 1000, 1).unwrap();
        for len in 0..512 {
            let mut r = Report::new("ios", 1);
            assert!(analyze_pcap(
                &vec![0; len],
                "192.0.2.1".parse().unwrap(),
                &rules,
                &mut r,
                &AtomicBool::new(false)
            )
            .is_err())
        }
    }
}
