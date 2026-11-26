//! Bounded classic PCAP reader. It never captures, resolves, or sends traffic.
use crate::{
    model::Report,
    rules::{Kind, VerifiedRules},
    scan::Matches,
};
use std::{
    collections::{BTreeMap, HashMap, HashSet},
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
    if bytes.len() > 320 * 1024 * 1024 || bytes.len() < 24 {
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
    // Names the phone revealed (DNS questions and aliases, TLS server names,
    // HTTP hosts), for look-alike analysis after the loop.
    let mut questions: BTreeMap<String, Option<String>> = Default::default();
    let mut dns_questions_seen = 0usize;
    let mut tls_names = 0usize;
    let mut http_hosts = 0usize;
    // Names the phone opened web connections to (TLS or HTTP), not only
    // looked up.
    let mut web_names: HashSet<String> = HashSet::new();
    let mut encrypted_flows = HashSet::new();
    // When each TCP connection to a remote address and port was opened, to
    // find connections repeated at regular intervals.
    let mut opened: HashMap<(IpAddr, u16), Vec<i64>> = HashMap::new();
    // Which name each address answered for, to describe it in findings.
    let mut address_names: HashMap<IpAddr, String> = HashMap::new();
    // WireGuard packets (the protocol of Enigm's VPN and many others).
    let mut wireguard = 0usize;
    while at < bytes.len() {
        if cancel.load(Ordering::Relaxed) {
            return Err("cancelled".into());
        }
        packets += 1;
        if packets > 5_000_000 {
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
                let eth = u16be(&packet[12..]).ok_or("pcap_truncated")?;
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
        if connections.len() >= 500_000 && !connections.contains(&flow) {
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
        // Encrypted connections: HTTPS, DNS over TLS and QUIC (HTTP/3).
        if (proto == 6 && [443, 853].contains(&dport)) || (proto == 17 && dport == 443) {
            encrypted_flows.insert((dst, dport));
        }
        if proto == 6 && transport.len() >= 20 {
            let offset = ((transport[12] >> 4) as usize) * 4;
            let flags = transport[13];
            // A new connection: SYN without ACK, from the side that opens it.
            if flags & 0x12 == 0x02 {
                let times = opened.entry((dst, dport)).or_default();
                if times.len() < 1000 {
                    times.push(micros);
                }
            }
            if let Some(payload) = transport
                .get(offset..)
                .filter(|p| offset >= 20 && !p.is_empty())
            {
                let name = tls_server_name(payload)
                    .map(|name| (name, "attributed TLS server name"))
                    .or_else(|| http_host(payload).map(|name| (name, "attributed HTTP host")));
                if let Some((name, artifact)) = name {
                    if artifact.contains("TLS") {
                        tls_names += 1;
                    } else {
                        http_hosts += 1;
                    }
                    matcher.inspect(report, Kind::Domain, &name, artifact, time.clone());
                    if web_names.len() < 20000 {
                        web_names.insert(name.clone());
                    }
                    if address_names.len() < 20000 {
                        address_names.entry(dst).or_insert_with(|| name.clone());
                    }
                    if questions.len() < 20000 {
                        questions.entry(name).or_insert_with(|| time.clone());
                    }
                }
            }
        }
        if proto == 17 && wireguard_message(transport) {
            wireguard += 1;
        }
        if proto == 17 && (sport == 53 || dport == 53) && transport.len() >= 8 {
            let udp_len = u16be(&transport[4..]).unwrap_or(0) as usize;
            if udp_len < 8 || udp_len > transport.len() {
                unsupported += 1;
                continue;
            }
            let dns = &transport[8..udp_len];
            // Answers: aliases are names too, and addresses are named.
            for (name, answer) in dns_answers(dns).unwrap_or_default() {
                match answer {
                    Answer::Alias(target) => {
                        matcher.inspect(
                            report,
                            Kind::Domain,
                            &target,
                            "attributed DNS alias",
                            time.clone(),
                        );
                        if questions.len() < 20000 {
                            questions.entry(target).or_insert_with(|| time.clone());
                        }
                    }
                    Answer::Address(address) => {
                        if address_names.len() < 20000 {
                            address_names.entry(address).or_insert(name);
                        }
                    }
                }
            }
            if let Some(names) = dns_questions(dns) {
                dns_questions_seen += names.len();
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
    // Where spyware without servers of its own reports. Each class counts
    // only where ordinary use would not: data collection services always;
    // tunnels when the phone opened web connections through them (raw game
    // servers use them too); dynamic DNS names, which home servers, smart
    // homes and game servers also use, only when the phone connected to them
    // again and again at a steady pace, as remote access tools check in.
    use crate::infrastructure::{classify, Class};
    let mut hosted: BTreeMap<
        String,
        (
            crate::infrastructure::Hosting,
            Option<String>,
            Option<String>,
        ),
    > = BTreeMap::new();
    for (name, at) in &questions {
        if let Some(hosting) = classify(name).filter(|h| {
            h.class == Class::Collector || (h.class == Class::Tunnel && web_names.contains(name))
        }) {
            hosted.insert(name.clone(), (hosting, None, at.clone()));
        }
    }
    let mut beacons: Vec<(&(IpAddr, u16), &Vec<i64>)> = opened.iter().collect();
    beacons.sort_by_key(|(key, _)| **key);
    for ((address, port), times) in beacons {
        let Some(name) = address_names.get(address) else {
            continue;
        };
        let Some(hosting) = classify(name).filter(|h| h.class != Class::Collector) else {
            continue;
        };
        let Some(pace) = steady_interval(times) else {
            continue;
        };
        let pattern = format!(
            "{} connections (port {port}) about every {} seconds",
            times.len(),
            (pace + 500_000) / 1_000_000
        );
        let at = times.iter().max().and_then(|micros| {
            time::OffsetDateTime::from_unix_timestamp_nanos(*micros as i128 * 1000)
                .ok()
                .and_then(|x| {
                    x.format(&time::format_description::well_known::Rfc3339)
                        .ok()
                })
        });
        hosted
            .entry(name.clone())
            .and_modify(|entry| {
                entry.1.get_or_insert_with(|| pattern.clone());
            })
            .or_insert((hosting, Some(pattern), at));
    }
    for (name, (hosting, pattern, at)) in hosted.into_iter().take(10) {
        if report.findings.len() >= 500 {
            break;
        }
        report
            .findings
            .push(crate::infrastructure::finding(&name, &hosting, pattern, at));
    }
    // Connections opened again and again at a steady pace to a bare address
    // that was never named (no DNS lookup, no server name): how spyware can
    // report to its server without leaving a domain behind. Apps checking in
    // with a named service are ordinary and not reported.
    let mut periodic: Vec<(String, u16, usize, i64)> = opened
        .iter()
        .filter(|((address, _), _)| !address_names.contains_key(address) && public(address))
        .filter_map(|((address, port), times)| {
            let pace = steady_interval(times)?;
            Some((address.to_string(), *port, times.len(), pace))
        })
        .collect();
    periodic.sort();
    for (name, port, count, pace) in periodic.iter().take(10) {
        if report.findings.len() >= 500 {
            break;
        }
        report.findings.push(crate::extractions::finding(
            "enigm.heuristic.network_beacon",
            "network_periodic_connections",
            "low",
            &format!(
                "{count} connections to {name} (port {port}) about every {} seconds",
                pace / 1_000_000
            ),
            None,
            "Review point: the phone contacted this address at a steady pace without ever looking up a name for it, which spyware does to leave no domain behind. Some services also connect by address.",
            "If you do not recognise this destination, find which app uses it and ask an expert to review the phone.",
        ));
    }
    if !periodic.is_empty() {
        report.check(
            "network_periodic_connections",
            "completed",
            &format!(
                "{} destination(s) contacted repeatedly at a steady pace{}.",
                periodic.len(),
                if periodic.len() > 10 {
                    " (first 10 listed)"
                } else {
                    ""
                }
            ),
        );
    }
    report.check(
        "network_names",
        "completed",
        &format!(
            "{} destination names read ({dns_questions_seen} DNS lookups, {tls_names} TLS server names, {http_hosts} HTTP hosts) and compared with known spyware domains.",
            questions.len()
        ),
    );
    // Traffic carried by a VPN is encrypted inside it: when that is all the
    // phone sent, say why no destination could be read. Not a finding: a VPN
    // such as Enigm's protects the phone.
    if wireguard >= 10 && questions.is_empty() {
        report.check(
            "network_vpn",
            "completed",
            "The phone's traffic went through a VPN (WireGuard): its destinations travel encrypted inside it and could not be read. To check them, disconnect the VPN while the scan observes the network.",
        );
    }
    // Encrypted DNS or iCloud Private Relay hide lookups: say so.
    if dns_questions_seen == 0 && !encrypted_flows.is_empty() {
        let relay = questions
            .keys()
            .any(|name| name.ends_with("mask.icloud.com") || name.ends_with("mask-h2.icloud.com"));
        report.check(
            "network_encrypted_dns",
            "completed",
            &format!(
                "No unencrypted DNS lookups were seen across {} encrypted connections{}: destinations were read from the server names of encrypted connections and their addresses.",
                encrypted_flows.len(),
                if relay { "; iCloud Private Relay is on" } else { "; the phone uses encrypted DNS or iCloud Private Relay" }
            ),
        );
    }
    report.network_connections = connections.len() as u64;
    report.check("network_pcap","completed",&format!("{observed} device-attributed packets, {} unique bidirectional flows; observed Unix-microsecond interval {} to {}; {unsupported} packets not decoded.",connections.len(),first.unwrap_or_default(),last.unwrap_or_default()));
    if phone.is_none() {
        report.limitations.push("Captured for at least 120 seconds, and while the copy ran up to 15 minutes, through the selected phone’s authorized USB service. This is a limited observation, not continuous monitoring or proof of no surveillance.".into());
    }
    report.limitations.push(if phone.is_some() { "PCAP source and phone IP were explicitly confirmed by the operator; capture origin is not independently attested." } else { "The USB transport, rather than a manually entered IP, attributes this capture to the selected phone." }.into());
    report.limitations.push("IP endpoints, DNS questions and answers, TLS server names and HTTP hosts are decoded. QUIC (HTTP/3) and encrypted Client Hello hide server names, and encrypted DNS, tunnels, IP fragments and missing packets reduce coverage. No exfiltration inference is made.".into());
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
            // A capture may keep only the start of a packet (its headers and
            // what the analysis reads); the rest of the packet is not needed.
            let total = (u16be(&b[2..])? as usize).min(b.len());
            if ihl < 20 || total < ihl || u16be(&b[6..])? & 0x3fff != 0 {
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
            let len = (u16be(&b[4..])? as usize).min(b.len() - 40);
            if len == 0 || ![6, 17, 58].contains(&b[6]) {
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
/// An address on the internet: not private, local, link-local or multicast.
fn public(address: &IpAddr) -> bool {
    match address {
        IpAddr::V4(a) => {
            !(a.is_private()
                || a.is_loopback()
                || a.is_link_local()
                || a.is_multicast()
                || a.is_broadcast()
                || a.is_unspecified()
                || a.octets()[0] == 100 && a.octets()[1] & 0xc0 == 64)
        }
        IpAddr::V6(a) => {
            let first = a.segments()[0];
            !(a.is_loopback()
                || a.is_unspecified()
                || a.is_multicast()
                || first & 0xfe00 == 0xfc00
                || first & 0xffc0 == 0xfe80)
        }
    }
}
/// The pace of connections opened at least four times at a steady interval
/// between 20 seconds and 15 minutes (each gap within 15 % of the mean), in
/// microseconds.
fn steady_interval(times: &[i64]) -> Option<i64> {
    let mut times = times.to_vec();
    times.sort_unstable();
    times.dedup();
    if times.len() < 4 {
        return None;
    }
    let gaps: Vec<i64> = times.windows(2).map(|w| w[1] - w[0]).collect();
    let mean = gaps.iter().sum::<i64>() / gaps.len() as i64;
    if !(20_000_000..=900_000_000).contains(&mean) {
        return None;
    }
    gaps.iter()
        .all(|gap| (gap - mean).abs() * 100 <= mean * 15)
        .then_some(mean)
}
/// A WireGuard message by its fixed layout: type 1 to 4 followed by three
/// reserved zero bytes, and the size each type has (data messages are padded
/// to 16 bytes after a 16-byte header). The size is the one the UDP header
/// declares, since captures keep only the start of each packet.
fn wireguard_message(udp: &[u8]) -> bool {
    let Some(size) = u16be(&udp[4.min(udp.len())..]).map(|l| l as usize) else {
        return false;
    };
    let Some(head) = udp.get(8..12) else {
        return false;
    };
    if size < 8 + 32 || head[1..4] != [0, 0, 0] {
        return false;
    }
    let message = size - 8;
    match head[0] {
        1 => message == 148,
        2 => message == 92,
        3 => message == 64,
        4 => (message - 16) % 16 == 0,
        _ => false,
    }
}
/// A host name as written in a TLS Client Hello or an HTTP Host header.
fn host_name(bytes: &[u8]) -> Option<String> {
    let name = std::str::from_utf8(bytes)
        .ok()?
        .trim()
        .trim_end_matches('.');
    (!name.is_empty()
        && name.len() <= 253
        && name.contains('.')
        && name
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'.'))
    .then(|| name.to_ascii_lowercase())
}
/// The server name a TLS Client Hello asks for, when the hello starts in
/// this segment.
fn tls_server_name(p: &[u8]) -> Option<String> {
    if p.len() < 9 || p[0] != 0x16 || p[1] != 3 {
        return None;
    }
    let record = u16be(&p[3..])? as usize;
    let body = &p[5..];
    let body = &body[..body.len().min(record)];
    if body.first() != Some(&1) {
        return None;
    }
    // Handshake header, version and random.
    let mut at = 4 + 2 + 32;
    at += 1 + *body.get(at)? as usize;
    at += 2 + u16be(body.get(at..)?)? as usize;
    at += 1 + *body.get(at)? as usize;
    let extensions = u16be(body.get(at..)?)? as usize;
    at += 2;
    let end = (at + extensions).min(body.len());
    while at + 4 <= end {
        let kind = u16be(&body[at..])?;
        let len = u16be(&body[at + 2..])? as usize;
        at += 4;
        let data = body.get(at..at + len)?;
        if kind == 0 {
            let list = (2 + u16be(data)? as usize).min(data.len());
            let mut i = 2;
            while i + 3 <= list {
                let name_len = u16be(&data[i + 1..])? as usize;
                let name = data.get(i + 3..i + 3 + name_len)?;
                if data[i] == 0 {
                    return host_name(name);
                }
                i += 3 + name_len;
            }
            return None;
        }
        at += len;
    }
    None
}
/// The Host header of an unencrypted HTTP request.
fn http_host(p: &[u8]) -> Option<String> {
    const METHODS: [&[u8]; 7] = [
        b"GET ",
        b"POST ",
        b"HEAD ",
        b"PUT ",
        b"DELETE ",
        b"OPTIONS ",
        b"PATCH ",
    ];
    if !METHODS.iter().any(|m| p.starts_with(m)) {
        return None;
    }
    for line in p[..p.len().min(8192)].split(|&c| c == b'\n').skip(1) {
        let line = line.strip_suffix(b"\r").unwrap_or(line);
        if line.is_empty() {
            break;
        }
        if line.len() > 5 && line[..5].eq_ignore_ascii_case(b"host:") {
            let value = std::str::from_utf8(&line[5..]).ok()?.trim();
            let host = value
                .rsplit_once(':')
                .filter(|(_, port)| !port.is_empty() && port.bytes().all(|c| c.is_ascii_digit()))
                .map_or(value, |(host, _)| host);
            return host_name(host.as_bytes());
        }
    }
    None
}
enum Answer {
    Address(IpAddr),
    Alias(String),
}
/// Addresses and aliases in a DNS response, with the name each answers for.
fn dns_answers(b: &[u8]) -> Option<Vec<(String, Answer)>> {
    if b.len() < 12 || u16be(&b[2..])? & 0x8000 == 0 {
        return None;
    }
    let questions = u16be(&b[4..])?;
    let answers = u16be(&b[6..])?;
    if questions > 32 || answers > 64 {
        return None;
    }
    let mut cursor = 12;
    for _ in 0..questions {
        cursor = dns_name(b, cursor)?.1.checked_add(4)?;
    }
    let mut out = Vec::new();
    for _ in 0..answers {
        let (name, end) = dns_name(b, cursor)?;
        let kind = u16be(b.get(end..)?)?;
        let len = u16be(b.get(end + 8..)?)? as usize;
        let data = end + 10;
        let rdata = b.get(data..data + len)?;
        match (kind, len) {
            (1, 4) => out.push((
                name,
                Answer::Address(Ipv4Addr::new(rdata[0], rdata[1], rdata[2], rdata[3]).into()),
            )),
            (28, 16) => out.push((
                name,
                Answer::Address(Ipv6Addr::from(<[u8; 16]>::try_from(rdata).ok()?).into()),
            )),
            (5, _) => out.push((name, Answer::Alias(dns_name(b, data)?.0))),
            _ => {}
        }
        cursor = data + len;
    }
    Some(out)
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
    /// One IPv4 packet: TCP (flags and payload) or UDP (payload).
    fn ip4(
        src: [u8; 4],
        dst: [u8; 4],
        tcp: Option<u8>,
        sport: u16,
        dport: u16,
        payload: &[u8],
    ) -> Vec<u8> {
        let transport_len = if tcp.is_some() { 20 } else { 8 };
        let total = 20 + transport_len + payload.len();
        let mut packet = vec![0u8; 20 + transport_len];
        packet[0] = 0x45;
        packet[2..4].copy_from_slice(&(total as u16).to_be_bytes());
        packet[9] = if tcp.is_some() { 6 } else { 17 };
        packet[12..16].copy_from_slice(&src);
        packet[16..20].copy_from_slice(&dst);
        packet[20..22].copy_from_slice(&sport.to_be_bytes());
        packet[22..24].copy_from_slice(&dport.to_be_bytes());
        match tcp {
            Some(flags) => {
                packet[32] = 5 << 4;
                packet[33] = flags;
            }
            None => packet[24..26].copy_from_slice(&((8 + payload.len()) as u16).to_be_bytes()),
        }
        packet.extend(payload);
        packet
    }
    fn capture(packets: &[(u32, Vec<u8>)]) -> Vec<u8> {
        let mut pcap = vec![0xd4, 0xc3, 0xb2, 0xa1, 2, 0, 4, 0];
        pcap.extend([0u8; 12]);
        pcap.extend(101u32.to_le_bytes());
        for (sec, packet) in packets {
            pcap.extend(sec.to_le_bytes());
            pcap.extend(0u32.to_le_bytes());
            pcap.extend((packet.len() as u32).to_le_bytes());
            pcap.extend((packet.len() as u32).to_le_bytes());
            pcap.extend(packet);
        }
        pcap
    }
    /// A minimal TLS Client Hello asking for `name`.
    fn client_hello(name: &str) -> Vec<u8> {
        let mut sni = Vec::new();
        sni.extend(((3 + name.len()) as u16).to_be_bytes());
        sni.push(0);
        sni.extend((name.len() as u16).to_be_bytes());
        sni.extend(name.as_bytes());
        let mut ext = vec![0, 0];
        ext.extend((sni.len() as u16).to_be_bytes());
        ext.extend(&sni);
        let mut body = vec![3, 3];
        body.extend([0u8; 32]);
        body.push(0); // session id
        body.extend([0, 2, 0x13, 0x01]); // one cipher suite
        body.extend([1, 0]); // compression
        body.extend((ext.len() as u16).to_be_bytes());
        body.extend(&ext);
        let mut hs = vec![1, 0];
        hs.extend((body.len() as u16).to_be_bytes());
        hs.extend(&body);
        let mut record = vec![0x16, 3, 1];
        record.extend((hs.len() as u16).to_be_bytes());
        record.extend(&hs);
        record
    }
    fn analyzed(packets: &[(u32, Vec<u8>)]) -> Report {
        let (b, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&b, &key, 1000, 1).unwrap();
        let mut report = Report::new("ios", 1);
        analyze_usb_capture(
            &capture(packets),
            &rules,
            &mut report,
            &AtomicBool::new(false),
        )
        .unwrap();
        report
    }
    const PHONE: [u8; 4] = [192, 0, 2, 1];
    const SERVER: [u8; 4] = [198, 51, 100, 7];
    #[test]
    fn server_names_of_encrypted_connections_are_compared_with_indicators() {
        assert_eq!(
            tls_server_name(&client_hello("www.Example.com")).as_deref(),
            Some("www.example.com")
        );
        assert!(tls_server_name(b"\x16\x03\x01\x00").is_none());
        let report = analyzed(&[(
            1000,
            ip4(
                PHONE,
                SERVER,
                Some(0x18),
                50000,
                443,
                &client_hello("api.indicator.invalid"),
            ),
        )]);
        assert!(report.findings.iter().any(|f| f
            .evidence
            .starts_with("attributed TLS server name: api.indicator.invalid")));
        // No lookups in the clear: encrypted DNS or Private Relay, said so.
        assert!(report
            .checks
            .iter()
            .any(|c| c.id == "network_encrypted_dns"));
    }
    #[test]
    fn hosts_of_unencrypted_requests_are_compared_with_indicators() {
        assert_eq!(
            http_host(b"GET / HTTP/1.1\r\nhost: indicator.invalid:8080\r\n\r\n").as_deref(),
            Some("indicator.invalid")
        );
        assert!(http_host(b"HTTP/1.1 200 OK\r\nHost: a.b\r\n").is_none());
        let report = analyzed(&[(
            1000,
            ip4(
                PHONE,
                SERVER,
                Some(0x18),
                50000,
                80,
                b"POST /c HTTP/1.1\r\nHost: indicator.invalid\r\n\r\n",
            ),
        )]);
        assert!(report.findings.iter().any(|f| f
            .evidence
            .starts_with("attributed HTTP host: indicator.invalid")));
    }
    #[test]
    fn aliases_in_dns_answers_are_compared_and_addresses_named() {
        let mut dns = vec![0x12, 0x34, 0x81, 0x80, 0, 1, 0, 2, 0, 0, 0, 0];
        dns.extend(b"\x03cdn\x07example\x03com\x00\x00\x01\x00\x01");
        // cdn.example.com CNAME indicator.invalid
        dns.extend([0xc0, 12, 0, 5, 0, 1, 0, 0, 0, 60]);
        let target = b"\x09indicator\x07invalid\x00";
        dns.extend((target.len() as u16).to_be_bytes());
        dns.extend(target);
        // indicator.invalid A 198.51.100.7
        dns.extend([0xc0, 45, 0, 1, 0, 1, 0, 0, 0, 60, 0, 4]);
        dns.extend(SERVER);
        let answers = dns_answers(&dns).unwrap();
        assert!(
            matches!(&answers[0], (name, Answer::Alias(target)) if name == "cdn.example.com" && target == "indicator.invalid")
        );
        assert!(matches!(&answers[1], (_, Answer::Address(IpAddr::V4(a))) if a.octets() == SERVER));
        let report = analyzed(&[(1000, ip4([192, 0, 2, 53], PHONE, None, 53, 50000, &dns))]);
        assert!(report.findings.iter().any(|f| f
            .evidence
            .starts_with("attributed DNS alias: indicator.invalid")));
    }
    #[test]
    fn connections_at_a_steady_pace_are_a_review_point() {
        let s = 1_000_000;
        assert_eq!(
            steady_interval(&[0, 60 * s, 120 * s, 181 * s]),
            Some(60 * s + s / 3)
        );
        assert_eq!(steady_interval(&[0, 60 * s, 120 * s]), None);
        assert_eq!(steady_interval(&[0, 5 * s, 10 * s, 15 * s]), None);
        assert_eq!(steady_interval(&[0, 60 * s, 200 * s, 230 * s]), None);
        let syn = |sec: u32, port: u16| (sec, ip4(PHONE, SERVER, Some(0x02), port, 8443, &[]));
        let report = analyzed(&[
            syn(1000, 50001),
            syn(1060, 50002),
            syn(1120, 50003),
            syn(1180, 50004),
            syn(1185, 50005),
        ]);
        // Five openings but one breaks the pace: nothing to report.
        assert!(!report
            .findings
            .iter()
            .any(|f| f.rule == "enigm.heuristic.network_beacon"));
        let report = analyzed(&[
            syn(1000, 50001),
            syn(1060, 50002),
            syn(1120, 50003),
            syn(1180, 50004),
        ]);
        let beacon: Vec<_> = report
            .findings
            .iter()
            .filter(|f| f.rule == "enigm.heuristic.network_beacon")
            .collect();
        assert_eq!(beacon.len(), 1);
        assert_eq!(
            beacon[0].evidence,
            "4 connections to 198.51.100.7 (port 8443) about every 60 seconds"
        );
        assert!(report
            .checks
            .iter()
            .any(|c| c.id == "network_periodic_connections"));
        // A named destination checking in at a steady pace is ordinary.
        let mut named = vec![(
            999,
            ip4(
                PHONE,
                SERVER,
                Some(0x18),
                50000,
                8443,
                &client_hello("push.example.com"),
            ),
        )];
        named.extend([
            syn(1000, 50001),
            syn(1060, 50002),
            syn(1120, 50003),
            syn(1180, 50004),
        ]);
        let report = analyzed(&named);
        assert!(!report
            .findings
            .iter()
            .any(|f| f.rule == "enigm.heuristic.network_beacon"));
        assert!(!report
            .checks
            .iter()
            .any(|c| c.id == "network_periodic_connections"));
    }
    #[test]
    fn traffic_inside_a_vpn_is_explained_not_flagged() {
        let data = |sec: u32| {
            let mut message = vec![4, 0, 0, 0];
            message.extend([0u8; 12 + 64]);
            (sec, ip4(PHONE, SERVER, None, 51820, 51820, &message))
        };
        let report = analyzed(&(1000..1012).map(data).collect::<Vec<_>>());
        assert!(report.findings.is_empty());
        assert!(report
            .checks
            .iter()
            .any(|c| c.id == "network_vpn" && c.detail.contains("WireGuard")));
        // A handshake, kept as its headers and first bytes.
        let handshake = ip4(
            PHONE,
            SERVER,
            None,
            51820,
            51820,
            &[[1u8, 0, 0, 0].as_slice(), &[0; 144]].concat(),
        );
        assert!(wireguard_message(&handshake[20..20 + 8 + 32]));
        assert!(!wireguard_message(
            &ip4(PHONE, SERVER, None, 5000, 5000, &[4, 0, 0, 0, 1])[20..]
        ));
    }
    #[test]
    fn packets_kept_only_in_part_are_still_read() {
        // A downloaded packet of 1,400 bytes kept as its headers and 32 bytes.
        let full = ip4(SERVER, PHONE, Some(0x18), 443, 50000, &[0x17; 1360]);
        let kept = full[..20 + 20 + 32].to_vec();
        let mut pcap = capture(&[]);
        pcap.extend(1000u32.to_le_bytes());
        pcap.extend(0u32.to_le_bytes());
        pcap.extend((kept.len() as u32).to_le_bytes());
        pcap.extend((full.len() as u32).to_le_bytes());
        pcap.extend(&kept);
        let (b, key) = crate::rules::tests::fixture(1000);
        let rules = VerifiedRules::verify(&b, &key, 1000, 1).unwrap();
        let mut report = Report::new("ios", 1);
        analyze_usb_capture(&pcap, &rules, &mut report, &AtomicBool::new(false)).unwrap();
        assert_eq!(report.network_connections, 1);
        let detail = &report
            .checks
            .iter()
            .find(|c| c.id == "network_pcap")
            .unwrap()
            .detail;
        assert!(detail.contains("0 packets not decoded"), "{detail}");
    }
    #[test]
    fn hosting_counts_only_where_ordinary_use_would_not() {
        let hosted = |packets: &[(u32, Vec<u8>)]| -> Vec<String> {
            analyzed(packets)
                .findings
                .into_iter()
                .filter(|f| f.rule == "enigm.heuristic.suspicious_hosting")
                .map(|f| f.evidence)
                .collect()
        };
        let hello = |sec: u32, port: u16, name: &str| {
            (
                sec,
                ip4(PHONE, SERVER, Some(0x18), port, 443, &client_hello(name)),
            )
        };
        let syn = |sec: u32, port: u16| (sec, ip4(PHONE, SERVER, Some(0x02), port, 443, &[]));
        // A home server or smart home on dynamic DNS, opened now and then.
        assert!(hosted(&[hello(1000, 50000, "home.duckdns.org"), syn(1300, 50001)]).is_empty());
        // A web page or service behind a tunnel, and a data collection service.
        let found = hosted(&[
            hello(1000, 50000, "abc.trycloudflare.com"),
            hello(1001, 50001, "webhook.site"),
        ]);
        assert_eq!(found.len(), 2);
        assert!(found.iter().any(|e| e
            == "contacted by the phone: abc.trycloudflare.com: a tunnel that exposes a computer to the internet (Cloudflare Tunnel)"));
        // Dynamic DNS checked in with at a steady pace: how remote access tools
        // report.
        let mut beacon = vec![hello(999, 49999, "panel.duckdns.org")];
        beacon.extend([
            syn(1000, 50001),
            syn(1060, 50002),
            syn(1120, 50003),
            syn(1180, 50004),
        ]);
        assert_eq!(
            hosted(&beacon),
            vec!["contacted by the phone: panel.duckdns.org: a dynamic DNS name, which follows a home or rented connection (DuckDNS), 4 connections (port 443) about every 60 seconds"]
        );
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
