//! Hosting that spyware reports to when it has no infrastructure of its own,
//! and that ordinary apps almost never use: dynamic DNS names that follow a
//! home or rented connection, tunnels that expose a computer to the internet,
//! services that keep whatever is sent to them for someone to collect, and
//! the Telegram bot API, which Android spyware and remote access tools use to
//! send what they collect. Stalkerware and spyware sold as a service,
//! documented by ESET, Lookout, Cyble and others, rely on them because they
//! cost nothing and hide who runs the server.
//!
//! A name only counts when it is a host inside one of these services (such as
//! `name.duckdns.org`), never the provider's own website.

/// What a host is, when it belongs to such a service: the service and how it
/// is described in the report.
pub struct Hosting {
    pub service: &'static str,
    pub kind: &'static str,
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

impl Hosting {
    /// Whether the host is where spyware sends data to, rather than where a
    /// link in a message would lead.
    pub fn reporting_only(&self) -> bool {
        self.service == "Telegram"
    }
}

/// The service `host` belongs to, if it is a host inside a dynamic DNS,
/// tunnel or data collection service, or the Telegram bot API.
pub fn classify(host: &str) -> Option<Hosting> {
    let host = host.trim_end_matches('.').to_ascii_lowercase();
    if host == "api.telegram.org" {
        return Some(Hosting {
            service: "Telegram",
            kind: "the Telegram bot API, which spyware uses to send what it collects",
        });
    }
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
        });
    }
    if let Some((_, service)) = TUNNELS.iter().find(|(suffix, _)| inside(suffix)) {
        return Some(Hosting {
            service,
            kind: "a tunnel that exposes a computer to the internet",
        });
    }
    COLLECTORS
        .iter()
        .find(|(suffix, _, exact)| inside(suffix) || (*exact && host == *suffix))
        .map(|(_, service, _)| Hosting {
            service,
            kind: "a service that keeps what is sent to it for someone to collect",
        })
}

/// The review point for a host of such a service the phone used.
pub fn finding(
    host: &str,
    hosting: &Hosting,
    artifact: &str,
    at: Option<String>,
) -> crate::model::Finding {
    crate::extractions::finding(
        "enigm.heuristic.suspicious_hosting",
        "network_suspicious_hosting",
        "medium",
        &format!("{artifact}: {host}: {} ({})", hosting.kind, hosting.service),
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
        assert_eq!(classify("api.telegram.org").unwrap().service, "Telegram");
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
        assert!(classify("web.telegram.org").is_none());
        assert!(classify("example.com").is_none());
    }
}
