//! Hosting that spyware reports to when it has no infrastructure of its own:
//! dynamic DNS names that follow a home or rented connection, tunnels that
//! expose a computer to the internet, and services that keep whatever is sent
//! to them for someone to collect. Remote access tools and stalkerware,
//! documented by ESET, Lookout, Cyble and others, rely on them because they
//! cost nothing and hide who runs the server.
//!
//! Each class is used where it is specific enough not to accuse ordinary
//! use: home servers, game servers and smart homes also use dynamic DNS and
//! tunnels (see `network.rs`, `links.rs` and `android.rs`).
//!
//! A name only counts when it is a host inside one of these services (such as
//! `name.duckdns.org`), never the provider's own website.

/// The kind of service a host belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Class {
    DynamicDns,
    Tunnel,
    Collector,
}
/// What a host is, when it belongs to such a service: the service and how it
/// is described in the report.
pub struct Hosting {
    pub service: &'static str,
    pub kind: &'static str,
    pub class: Class,
}

const DYNAMIC_DNS: &[(&str, &str)] = &[
    ("duckdns.org", "DuckDNS"),
    ("ddns.net", "No-IP"),
    ("hopto.org", "No-IP"),
    ("zapto.org", "No-IP"),
    ("sytes.net", "No-IP"),
    ("serveftp.com", "No-IP"),
    ("servehttp.com", "No-IP"),
    ("servebeer.com", "No-IP"),
    ("serveblog.net", "No-IP"),
    ("servegame.com", "No-IP"),
    ("servepics.com", "No-IP"),
    ("redirectme.net", "No-IP"),
    ("myftp.biz", "No-IP"),
    ("myftp.org", "No-IP"),
    ("bounceme.net", "No-IP"),
    ("ddns.me", "No-IP"),
    ("no-ip.biz", "No-IP"),
    ("no-ip.info", "No-IP"),
    ("no-ip.org", "No-IP"),
    ("noip.me", "No-IP"),
    ("gotdns.ch", "No-IP"),
    ("onthewifi.com", "No-IP"),
    ("ddnsking.com", "No-IP"),
    ("dynu.net", "Dynu"),
    ("freeddns.org", "Dynu"),
    ("kozow.com", "Dynu"),
    ("dyndns.org", "Dyn"),
    ("dyndns.info", "Dyn"),
    ("dynalias.com", "Dyn"),
    ("homeip.net", "Dyn"),
    ("dnsalias.com", "Dyn"),
    ("selfip.com", "Dyn"),
    ("mooo.com", "FreeDNS"),
    ("chickenkiller.com", "FreeDNS"),
    ("ydns.eu", "YDNS"),
    ("dedyn.io", "deSEC"),
    ("dynv6.net", "dynv6"),
    ("ipv64.net", "IPv64"),
    ("linkpc.net", "Dynu"),
    ("3utilities.com", "No-IP"),
];
const TUNNELS: &[(&str, &str)] = &[
    ("ngrok.io", "ngrok"),
    ("ngrok.app", "ngrok"),
    ("ngrok-free.app", "ngrok"),
    ("ngrok.dev", "ngrok"),
    ("ngrok-free.dev", "ngrok"),
    ("trycloudflare.com", "Cloudflare Tunnel"),
    ("loca.lt", "localtunnel"),
    ("localtunnel.me", "localtunnel"),
    ("serveo.net", "Serveo"),
    ("serveousercontent.com", "Serveo"),
    ("portmap.io", "Portmap"),
    ("portmap.host", "Portmap"),
    ("pagekite.me", "PageKite"),
    ("localhost.run", "localhost.run"),
    ("lhr.life", "localhost.run"),
    ("telebit.io", "Telebit"),
    ("bore.pub", "bore"),
    ("tunnelmole.net", "Tunnelmole"),
    ("pinggy.link", "Pinggy"),
    ("pinggy.online", "Pinggy"),
    ("devtunnels.ms", "Microsoft Dev Tunnels"),
    ("loophole.site", "Loophole"),
    ("loclx.io", "LocalXpose"),
];

/// Services that store every request sent to them for someone to read:
/// built for testing, used to receive stolen data. `true` when the service's
/// own name is the address used.
const COLLECTORS: &[(&str, &str, bool)] = &[
    ("webhook.site", "Webhook.site", true),
    ("m.pipedream.net", "Pipedream", false),
    ("requestcatcher.com", "Request Catcher", false),
    ("free.beeceptor.com", "Beeceptor", false),
    ("interact.sh", "Interactsh", false),
    ("oast.fun", "Interactsh", false),
    ("oast.live", "Interactsh", false),
    ("oast.me", "Interactsh", false),
    ("oast.online", "Interactsh", false),
    ("oast.pro", "Interactsh", false),
    ("oast.site", "Interactsh", false),
    ("burpcollaborator.net", "Burp Collaborator", false),
    ("oastify.com", "Burp Collaborator", false),
];

/// The service `host` belongs to, if it is a host inside a dynamic DNS,
/// tunnel or data collection service.
pub fn classify(host: &str) -> Option<Hosting> {
    let host = host.trim_end_matches('.').to_ascii_lowercase();
    // A host inside the service, not the provider's own website.
    let inside = |suffix: &str| {
        host.len() > suffix.len() + 1
            && host.ends_with(suffix)
            && host.as_bytes()[host.len() - suffix.len() - 1] == b'.'
            && host != format!("www.{suffix}")
    };
    if let Some((_, service)) = DYNAMIC_DNS.iter().find(|(suffix, _)| inside(suffix)) {
        return Some(Hosting {
            service,
            kind: "a dynamic DNS name, which follows a home or rented connection",
            class: Class::DynamicDns,
        });
    }
    if let Some((_, service)) = TUNNELS.iter().find(|(suffix, _)| inside(suffix)) {
        return Some(Hosting {
            service,
            kind: "a tunnel that exposes a computer to the internet",
            class: Class::Tunnel,
        });
    }
    COLLECTORS
        .iter()
        .find(|(suffix, _, exact)| inside(suffix) || (*exact && host == *suffix))
        .map(|(_, service, _)| Hosting {
            service,
            kind: "a service that keeps what is sent to it for someone to collect",
            class: Class::Collector,
        })
}

/// The review point for a host of such a service the phone used; `pattern`
/// adds how it was contacted when that is what makes it suspicious.
pub fn finding(
    host: &str,
    hosting: &Hosting,
    pattern: Option<String>,
    at: Option<String>,
) -> crate::model::Finding {
    crate::extractions::finding(
        "enigm.heuristic.suspicious_hosting",
        "network_suspicious_hosting",
        "medium",
        &format!(
            "contacted by the phone: {host}: {} ({}){}",
            hosting.kind,
            hosting.service,
            pattern.map(|p| format!(", {p}")).unwrap_or_default()
        ),
        at,
        "Review point: spyware without servers of its own often reports to such hosts. Few ordinary apps use them, though some home and gaming services do.",
        "Find which app uses this host. If you do not recognise it, ask an expert to review the phone.",
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn hosts_inside_these_services_count_but_not_their_websites() {
        assert_eq!(classify("panel.duckdns.org").unwrap().service, "DuckDNS");
        assert_eq!(classify("A1.Ngrok-Free.App.").unwrap().service, "ngrok");
        assert!(classify("api.telegram.org").is_none());
        assert_eq!(classify("webhook.site").unwrap().service, "Webhook.site");
        assert_eq!(
            classify("eo1x2y.m.pipedream.net").unwrap().service,
            "Pipedream"
        );
        assert_eq!(classify("c0ffee.oast.fun").unwrap().service, "Interactsh");
        assert!(classify("pipedream.com").is_none());
        assert!(classify("oast.fun").is_none());
        assert!(classify("duckdns.org").is_none());
        assert!(classify("www.duckdns.org").is_none());
        assert!(classify("www.noip.com").is_none());
        assert!(classify("notduckdns.org").is_none());
        assert_eq!(classify("x.duckdns.org").unwrap().class, Class::DynamicDns);
        assert_eq!(classify("webhook.site").unwrap().class, Class::Collector);
        assert!(classify("example.com").is_none());
    }
}
