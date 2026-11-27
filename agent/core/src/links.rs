//! Lexical analysis of links and host names that no published indicator
//! names yet. Mercenary spyware is commonly delivered by a one-click link in
//! an SMS, iMessage or WhatsApp message whose domain imitates a known brand,
//! news site or service, and stalkerware is often installed from a page
//! posing as an update. This module flags the impersonation itself:
//!
//! - internationalised (IDN) domains whose letters imitate a brand
//!   (`аpple.com` with a Cyrillic `а`),
//! - look-alike spellings of a brand (`whatsaap`, `g00gle`, `icl0ud`),
//! - a brand combined with other words in a domain it does not own
//!   (`apple-id-verify.com`, `whatsapp-update.info`),
//! - a brand's own domain used as a subdomain of another one
//!   (`icloud.com.account-check.net`),
//! - links to a bare public IP address,
//! - links to a host on a dynamic DNS, tunnel or data collection service,
//!   where phishing pages and spyware downloads are put up for free.
//!
//! Each result names the brand and the reason. These are review points: a
//! look-alike domain is a strong phishing sign but does not prove infection.
use std::net::IpAddr;

/// Brands people trust in messages, with the registrable domains they own.
/// `fuzzy` enables one-letter look-alike detection; it is off for brands
/// that are ordinary words (apple, signal, amazon...).
struct Brand {
    name: &'static str,
    owned: &'static [&'static str],
    fuzzy: bool,
}
const BRANDS: &[Brand] = &[
    Brand {
        name: "apple",
        owned: &[
            "apple.com",
            "apple.news",
            "icloud.com",
            "me.com",
            "mac.com",
            "apple-dns.net",
            "cdn-apple.com",
            "mzstatic.com",
            "itunes.com",
            "applecard.apple",
        ],
        fuzzy: false,
    },
    Brand {
        name: "icloud",
        owned: &["icloud.com", "icloud-content.com", "apple.com"],
        fuzzy: true,
    },
    Brand {
        name: "appleid",
        owned: &["apple.com"],
        fuzzy: true,
    },
    Brand {
        name: "google",
        owned: &[
            "google.com",
            "googleapis.com",
            "gstatic.com",
            "googleusercontent.com",
            "googlevideo.com",
            "google",
            "goo.gl",
            "g.co",
            "withgoogle.com",
            "googlesource.com",
            "googledrive.com",
            "google-analytics.com",
            "googletagmanager.com",
            "googlesyndication.com",
            "googleadservices.com",
            "googleblog.com",
            "doubleclick.net",
            "android.com",
            "youtube.com",
            "google.dev",
            "google.app",
        ],
        fuzzy: true,
    },
    Brand {
        name: "gmail",
        owned: &["gmail.com", "google.com"],
        fuzzy: false,
    },
    Brand {
        name: "android",
        owned: &["android.com", "google.com"],
        fuzzy: false,
    },
    Brand {
        name: "whatsapp",
        owned: &["whatsapp.com", "whatsapp.net", "wa.me"],
        fuzzy: true,
    },
    Brand {
        name: "telegram",
        owned: &["telegram.org", "t.me", "telegram.me", "telesco.pe"],
        fuzzy: true,
    },
    Brand {
        name: "signal",
        owned: &["signal.org", "signal.me", "signal.group", "signal.link"],
        fuzzy: false,
    },
    Brand {
        name: "facebook",
        owned: &[
            "facebook.com",
            "fb.com",
            "fb.me",
            "fbcdn.net",
            "facebook.net",
            "messenger.com",
        ],
        fuzzy: true,
    },
    Brand {
        name: "instagram",
        owned: &["instagram.com", "instagr.am", "cdninstagram.com"],
        fuzzy: true,
    },
    Brand {
        name: "messenger",
        owned: &["messenger.com", "facebook.com"],
        fuzzy: false,
    },
    Brand {
        name: "microsoft",
        owned: &[
            "microsoft.com",
            "microsoftonline.com",
            "live.com",
            "office.com",
            "office365.com",
            "msn.com",
            "windows.net",
            "azure.com",
        ],
        fuzzy: true,
    },
    Brand {
        name: "outlook",
        owned: &["outlook.com", "live.com", "microsoft.com", "office.com"],
        fuzzy: true,
    },
    Brand {
        name: "hotmail",
        owned: &["hotmail.com", "live.com", "outlook.com"],
        fuzzy: true,
    },
    Brand {
        name: "samsung",
        owned: &["samsung.com", "samsungcloud.com", "samsungapps.com"],
        fuzzy: true,
    },
    Brand {
        name: "paypal",
        owned: &["paypal.com", "paypal.me", "paypalobjects.com"],
        fuzzy: true,
    },
    Brand {
        name: "amazon",
        owned: &[
            "amazon.com",
            "amzn.to",
            "amazon.de",
            "amazon.es",
            "amazon.fr",
            "amazon.it",
            "amazon.co.uk",
            "amazon.com.mx",
            "amazon.com.br",
            "amazonaws.com",
            "media-amazon.com",
        ],
        fuzzy: false,
    },
    Brand {
        name: "netflix",
        owned: &["netflix.com", "nflxvideo.net", "nflximg.net"],
        fuzzy: true,
    },
    Brand {
        name: "youtube",
        owned: &[
            "youtube.com",
            "youtu.be",
            "ytimg.com",
            "google.com",
            "youtube-nocookie.com",
            "youtubekids.com",
        ],
        fuzzy: true,
    },
    Brand {
        name: "twitter",
        owned: &["twitter.com", "x.com", "t.co", "twimg.com"],
        fuzzy: true,
    },
    Brand {
        name: "linkedin",
        owned: &["linkedin.com", "lnkd.in", "licdn.com"],
        fuzzy: true,
    },
    Brand {
        name: "dropbox",
        owned: &["dropbox.com", "db.tt", "dropboxusercontent.com"],
        fuzzy: true,
    },
    Brand {
        name: "protonmail",
        owned: &["protonmail.com", "proton.me", "protonmail.ch"],
        fuzzy: true,
    },
    Brand {
        name: "viber",
        owned: &["viber.com"],
        fuzzy: false,
    },
    Brand {
        name: "tiktok",
        owned: &["tiktok.com", "tiktokcdn.com"],
        fuzzy: false,
    },
    Brand {
        name: "snapchat",
        owned: &["snapchat.com", "snap.com"],
        fuzzy: true,
    },
    Brand {
        name: "dhl",
        owned: &["dhl.com", "dhl.de", "dhl.es"],
        fuzzy: false,
    },
    Brand {
        name: "fedex",
        owned: &["fedex.com"],
        fuzzy: false,
    },
    Brand {
        name: "correos",
        owned: &["correos.es", "correos.com"],
        fuzzy: false,
    },
];
/// Two-label public suffixes, so that `example.co.uk` is one registrant.
const SECOND_LEVEL: &[&str] = &[
    "co.uk", "org.uk", "gov.uk", "ac.uk", "com.au", "net.au", "org.au", "co.jp", "co.kr", "com.br",
    "com.mx", "com.ar", "com.co", "com.tr", "com.cn", "com.hk", "com.tw", "co.in", "co.za",
    "com.sg", "com.my", "com.pk", "com.eg", "com.sa", "co.il", "com.ua", "com.pl", "co.nz",
    "gob.mx", "gob.es", "gov.br", "com.es", "com.ve", "com.pe", "com.ng", "co.id", "com.ph",
    "com.vn", "com.bd", "com.qa", "com.kw", "com.lb", "com.jo", "com.om", "co.ke",
];

/// Registrable domain (`a.b.example.co.uk` → `example.co.uk`). On shared
/// hosting platforms each customer subdomain is its own site
/// (`google-login.web.app`), as in the public suffix list.
pub fn registrable(host: &str) -> &str {
    for shared in crate::rules::SHARED_PARENTS {
        if let Some(rest) = host.strip_suffix(shared).and_then(|r| r.strip_suffix('.')) {
            let customer = rest.rsplit('.').next().unwrap_or(rest);
            return &host[host.len() - shared.len() - customer.len() - 1..];
        }
    }
    let labels: Vec<&str> = host.split('.').collect();
    let n = labels.len();
    if n <= 2 {
        return host;
    }
    let last_two = format!("{}.{}", labels[n - 2], labels[n - 1]);
    let keep = if SECOND_LEVEL.contains(&last_two.as_str()) {
        3
    } else {
        2
    };
    let tail: usize = labels[n - keep..].iter().map(|l| l.len()).sum::<usize>() + keep - 1;
    &host[host.len() - tail..]
}
fn owned_by(brand: &Brand, host: &str) -> bool {
    let site = registrable(host);
    if brand
        .owned
        .iter()
        .any(|d| site == *d || host == *d || host.ends_with(&format!(".{d}")))
    {
        return true;
    }
    // Country domains of the brand itself (google.es, samsung.de, amazon.co.jp).
    site.strip_prefix(brand.name)
        .and_then(|rest| rest.strip_prefix('.'))
        .is_some_and(|suffix| {
            (suffix.len() == 2 && suffix.bytes().all(|c| c.is_ascii_lowercase()))
                || SECOND_LEVEL.contains(&suffix)
        })
}
/// Ordinary words one letter away from a brand.
const ORDINARY: &[&str] = &[
    "twister", "samsun", "googly", "goggle", "outlooks", "dropbot",
];
/// Letters from other scripts that look like Latin letters.
fn confusable(c: char) -> char {
    match c {
        'а' | 'ɑ' | 'α' => 'a',
        'Ь' | 'Ƅ' => 'b',
        'с' | 'ϲ' => 'c',
        'ԁ' => 'd',
        'е' | 'ё' | 'ε' => 'e',
        'ɡ' => 'g',
        'һ' => 'h',
        'і' | 'ι' | 'ı' | 'ӏ' => 'i',
        'ј' => 'j',
        'κ' | 'к' => 'k',
        'ⅼ' => 'l',
        'м' => 'm',
        'ո' | 'п' => 'n',
        'о' | 'ο' | 'օ' | 'ө' => 'o',
        'р' | 'ρ' => 'p',
        'ԛ' => 'q',
        'г' => 'r',
        'ѕ' => 's',
        'т' | 'τ' => 't',
        'υ' | 'ս' => 'u',
        'ν' | 'ѵ' => 'v',
        'ԝ' | 'ѡ' => 'w',
        'х' | 'χ' => 'x',
        'у' | 'γ' => 'y',
        'ᴢ' => 'z',
        other => other,
    }
}
/// Digits and pairs that imitate letters in look-alike domains.
fn unleet(token: &str) -> String {
    token
        .replace("rn", "m")
        .replace("vv", "w")
        .chars()
        .map(|c| match c {
            '0' => 'o',
            '1' => 'l',
            '3' => 'e',
            '4' => 'a',
            '5' => 's',
            '7' => 't',
            '@' => 'a',
            other => other,
        })
        .collect()
}
/// Optimal string alignment distance, bounded to small inputs.
fn distance(a: &str, b: &str) -> usize {
    let a: Vec<char> = a.chars().collect();
    let b: Vec<char> = b.chars().collect();
    if a.len().abs_diff(b.len()) > 2 || a.len() > 64 || b.len() > 64 {
        return 3;
    }
    let mut d = vec![vec![0usize; b.len() + 1]; a.len() + 1];
    for (i, row) in d.iter_mut().enumerate() {
        row[0] = i;
    }
    for (j, cell) in d[0].iter_mut().enumerate() {
        *cell = j;
    }
    for i in 1..=a.len() {
        for j in 1..=b.len() {
            let cost = usize::from(a[i - 1] != b[j - 1]);
            d[i][j] = (d[i - 1][j] + 1)
                .min(d[i][j - 1] + 1)
                .min(d[i - 1][j - 1] + cost);
            if i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1] {
                d[i][j] = d[i][j].min(d[i - 2][j - 2] + 1);
            }
        }
    }
    d[a.len()][b.len()]
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Assessment {
    pub host: String,
    pub reason: String,
    /// `high` for script homographs, `medium` for other impersonation,
    /// `low` for bare IP links.
    pub severity: &'static str,
}
/// Lower-case host of a link or bare host name.
pub fn host_of(link: &str) -> Option<String> {
    let link = link
        .trim()
        .trim_end_matches(['.', ',', ')', ']', '"', '\'']);
    let with_scheme = if link.contains("://") {
        link.to_string()
    } else {
        format!("https://{link}")
    };
    let url = url::Url::parse(&with_scheme).ok()?;
    if !["http", "https"].contains(&url.scheme()) {
        return None;
    }
    match url.host()? {
        url::Host::Domain(d) => Some(d.trim_end_matches('.').to_ascii_lowercase()),
        url::Host::Ipv4(ip) => Some(ip.to_string()),
        url::Host::Ipv6(ip) => Some(ip.to_string()),
    }
}
fn public_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            !(v4.is_private()
                || v4.is_loopback()
                || v4.is_link_local()
                || v4.is_unspecified()
                || v4.is_broadcast()
                || v4.is_documentation()
                || v4.octets()[0] == 100 && (64..128).contains(&v4.octets()[1]))
        }
        IpAddr::V6(v6) => {
            !(v6.is_loopback()
                || v6.is_unspecified()
                || (v6.segments()[0] & 0xfe00) == 0xfc00
                || (v6.segments()[0] & 0xffc0) == 0xfe80)
        }
    }
}
/// Where a link was seen. Messages are where one-click attacks and phishing
/// arrive; browsing history also contains every third-party site visited,
/// so only the strongest signals are applied to it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Context {
    Message,
    Browsing,
}
/// Assess one link (`https://...`) or bare host name.
pub fn assess(link: &str) -> Option<Assessment> {
    assess_in(link, Context::Message)
}
pub fn assess_in(link: &str, context: Context) -> Option<Assessment> {
    let host = host_of(link)?;
    if let Ok(ip) = host.parse::<IpAddr>() {
        return (context == Context::Message && public_ip(ip)).then(|| Assessment {
            reason: "link to a bare IP address instead of a domain name".into(),
            host,
            severity: "low",
        });
    }
    if context == Context::Message {
        if let Some(hosting) = crate::infrastructure::classify(&host) {
            return Some(Assessment {
                reason: format!("link to {} ({})", hosting.kind, hosting.service),
                host,
                // Someone's home server is a dynamic DNS name too.
                severity: if hosting.class == crate::infrastructure::Class::DynamicDns {
                    "low"
                } else {
                    "medium"
                },
            });
        }
    }
    assess_host_in(&host, context)
}
/// Assess a host name already known to be a domain.
pub fn assess_host(host: &str) -> Option<Assessment> {
    assess_host_in(host, Context::Message)
}
fn assess_host_in(host: &str, context: Context) -> Option<Assessment> {
    let host = host.trim_end_matches('.').to_ascii_lowercase();
    if host.len() > 253 || !host.contains('.') {
        return None;
    }
    let site = registrable(&host).to_string();
    let label = site.split('.').next().unwrap_or("");
    let result = |reason: String, severity| {
        Some(Assessment {
            host: host.clone(),
            reason,
            severity,
        })
    };
    // 1. Homographs: letters from other scripts that spell a brand.
    if host.split('.').any(|l| l.starts_with("xn--")) {
        let (unicode, errors) = idna::domain_to_unicode(&host);
        if errors.is_ok() {
            let unicode_site = registrable(&unicode).to_string();
            let unicode_label = unicode_site.split('.').next().unwrap_or("");
            let skeleton: String = unicode_label.chars().map(confusable).collect();
            if skeleton != unicode_label && skeleton.is_ascii() {
                if let Some(brand) = BRANDS
                    .iter()
                    .find(|b| skeleton == b.name || skeleton.split('-').any(|t| t == b.name))
                {
                    return result(format!("internationalised domain {unicode} imitates {} with look-alike letters", brand.name), "high");
                }
            }
            let latin = unicode_label.chars().any(|c| c.is_ascii_alphabetic());
            let other = unicode_label
                .chars()
                .any(|c| !c.is_ascii() && c.is_alphabetic());
            if latin
                && other
                && skeleton.chars().filter(char::is_ascii_alphabetic).count()
                    == unicode_label.chars().filter(|c| c.is_alphabetic()).count()
            {
                return result(format!("internationalised domain {unicode} mixes Latin letters with look-alike letters from another alphabet"), "medium");
            }
        }
        return None;
    }
    for brand in BRANDS {
        if owned_by(brand, &host) {
            continue;
        }
        // 2. A brand's own domain placed in front of someone else's.
        if let Some(owned) = brand.owned.iter().find(|d| {
            d.contains('.') && host.starts_with(&format!("{d}.")) && registrable(&host) != **d
        }) {
            return result(
                format!(
                    "{owned} is used as a subdomain of {site}, which {} does not own",
                    brand.name
                ),
                "medium",
            );
        }
        let tokens: Vec<&str> = label.split('-').filter(|t| !t.is_empty()).collect();
        // 3. The brand combined with other words in a domain it does not own.
        if context == Context::Message && tokens.len() > 1 && tokens.contains(&brand.name) {
            return result(
                format!(
                    "{site} combines the name {} with other words but is not owned by {}",
                    brand.name, brand.name
                ),
                "medium",
            );
        }
        if context == Context::Message && tokens == [brand.name] {
            return result(
                format!(
                    "{site} uses the name {} on a domain {} does not own",
                    brand.name, brand.name
                ),
                "low",
            );
        }
        for token in &tokens {
            if *token == brand.name {
                continue;
            }
            // 4. Look-alike spellings.
            let plain = unleet(token);
            if plain == brand.name {
                return result(
                    format!("{site} spells {} with look-alike characters", brand.name),
                    "medium",
                );
            }
            if brand.fuzzy
                && brand.name.len() >= 6
                && token.len() >= 5
                && token.chars().next() == brand.name.chars().next()
                && *token != format!("{}s", brand.name)
                && !ORDINARY.contains(token)
                && distance(token, brand.name) == 1
            {
                return result(
                    format!("{site} is one letter away from {}", brand.name),
                    "medium",
                );
            }
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    fn reason(link: &str) -> Option<String> {
        assess(link).map(|a| a.reason)
    }
    #[test]
    fn owned_brand_domains_and_ordinary_sites_are_not_flagged() {
        for link in [
            "https://www.apple.com/es/iphone",
            "https://support.apple.com",
            "https://appleid.apple.com/account",
            "https://www.icloud.com/photos",
            "https://chat.whatsapp.com/abc",
            "https://wa.me/123",
            "https://t.me/channel",
            "https://accounts.google.com",
            "https://www.google.es/maps",
            "https://mail.google.com",
            "https://www.amazon.co.uk/dp/1",
            "https://login.microsoftonline.com",
            "https://elpais.com/internacional",
            "https://applebees.com",
            "https://www.signalhire.com",
            "https://pineapple-recipes.com",
            "https://192.168.1.1/admin",
            "https://münchen.de",
            "https://xn--mnchen-3ya.de",
        ] {
            assert_eq!(reason(link), None, "{link}");
        }
    }
    #[test]
    fn impersonation_is_flagged_with_its_reason() {
        let cases = [
            ("https://xn--pple-43d.com/verify", "imitates apple", "high"),
            (
                "https://apple-id-verify.com/login",
                "combines the name apple",
                "medium",
            ),
            (
                "https://whatsapp-update.info/apk",
                "combines the name whatsapp",
                "medium",
            ),
            (
                "https://icloud.com.account-check.net/",
                "icloud.com is used as a subdomain",
                "medium",
            ),
            ("https://g00gle.com", "look-alike characters", "medium"),
            (
                "http://icl0ud-support.com",
                "look-alike characters",
                "medium",
            ),
            (
                "https://whatsaap.com/x",
                "one letter away from whatsapp",
                "medium",
            ),
            ("https://telegrarn.org", "look-alike characters", "medium"),
            ("http://203.0.113.9/x", "", ""),
            ("http://8.8.4.4/payload", "bare IP address", "low"),
        ];
        for (link, expected, severity) in cases {
            let got = assess(link);
            if expected.is_empty() {
                assert_eq!(got, None, "{link}");
                continue;
            }
            let got = got.unwrap_or_else(|| panic!("{link}"));
            assert!(got.reason.contains(expected), "{link}: {}", got.reason);
            assert_eq!(got.severity, severity, "{link}");
        }
    }
    #[test]
    fn message_links_to_dynamic_dns_or_tunnels_are_flagged_but_not_in_browsing() {
        let found = assess("https://update-now.duckdns.org/app.apk").unwrap();
        assert_eq!(found.severity, "low");
        assert_eq!(
            found.reason,
            "link to a dynamic DNS name, which follows a home or rented connection (DuckDNS)"
        );
        assert_eq!(
            assess("https://abc.trycloudflare.com/").unwrap().severity,
            "medium"
        );
        assert!(assess_in("https://abc.trycloudflare.com/", Context::Browsing).is_none());
        assert!(assess("https://api.telegram.org/bot1/sendMessage").is_none());
        assert!(assess("https://www.duckdns.org/").is_none());
    }
    #[test]
    fn browsing_history_gets_only_the_strongest_signals_and_words_stay_words() {
        assert_eq!(
            assess_in("https://google-analytics.com/collect", Context::Browsing),
            None
        );
        assert_eq!(
            assess_in("https://apple-history-fans.com", Context::Browsing),
            None
        );
        assert!(assess_in("https://apple-history-fans.com", Context::Message).is_some());
        assert_eq!(assess_in("http://8.8.4.4/", Context::Browsing), None);
        assert!(assess_in("https://xn--pple-43d.com", Context::Browsing).is_some());
        assert!(assess_in("https://g00gle.com", Context::Browsing).is_some());
        for ordinary in [
            "https://twister.com",
            "https://samsun.bel.tr",
            "https://my-cloud.com",
            "https://google.dev",
        ] {
            assert_eq!(assess(ordinary), None, "{ordinary}");
        }
        // A brand on a generic domain it does not own is not a country domain.
        let info = assess("https://whatsapp.info/download").unwrap();
        assert!(info.reason.contains("does not own") && info.severity == "low");
    }
    #[test]
    fn registrable_domains_respect_two_label_suffixes() {
        assert_eq!(registrable("a.b.example.co.uk"), "example.co.uk");
        assert_eq!(registrable("x.y.example.com"), "example.com");
        assert_eq!(registrable("example.com"), "example.com");
        assert_eq!(
            registrable("a.google-login.web.app"),
            "google-login.web.app"
        );
        assert!(assess("https://google-login.web.app").is_some());
        assert_eq!(distance("whatsaap", "whatsapp"), 1);
        assert_eq!(distance("whatsapp", "whatsapp"), 0);
        assert_eq!(distance("wahtsapp", "whatsapp"), 1);
    }
}
