use base64::{engine::general_purpose::STANDARD, Engine};
use ed25519_dalek::{Signature, VerifyingKey};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    net::IpAddr,
};
const MAX_BUNDLE: usize = 12 * 1024 * 1024;
/// Hosting and dynamic-DNS platforms whose subdomains belong to unrelated
/// customers. A rule naming one of them is matched exactly, never extended to
/// its subdomains (published indicators name the customer subdomain instead).
pub const SHARED_PARENTS: &[&str] = &[
    "000webhostapp.com",
    "amazonaws.com",
    "appspot.com",
    "azureedge.net",
    "azurewebsites.net",
    "blogspot.com",
    "cloudfront.net",
    "ddns.net",
    "duckdns.org",
    "dynu.net",
    "firebaseapp.com",
    "firebaseio.com",
    "fly.dev",
    "github.io",
    "glitch.me",
    "googleapis.com",
    "herokuapp.com",
    "hopto.org",
    "netlify.app",
    "ngrok-free.app",
    "ngrok.io",
    "no-ip.com",
    "no-ip.org",
    "onrender.com",
    "pages.dev",
    "repl.co",
    "sytes.net",
    "vercel.app",
    "web.app",
    "weebly.com",
    "wixsite.com",
    "wordpress.com",
    "workers.dev",
    "zapto.org",
];
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    Domain,
    Ip,
    Sha256,
    // Schema 2: indicator types matched by MVT's forensic modules.
    ProcessName,
    Email,
    FileName,
    FilePath,
    AppId,
    AppCertSha256,
    ConfigurationProfileId,
}
impl Kind {
    /// Types understood by schema 1 clients (apps released before schema 2).
    pub fn legacy(&self) -> bool {
        matches!(self, Kind::Domain | Kind::Ip | Kind::Sha256)
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Rule {
    pub id: String,
    pub kind: Kind,
    pub value: String,
    pub source: String,
    pub published: String,
}
impl Rule {
    /// Monitoring apps (parental control, location sharing) that are often
    /// installed knowingly: reported for review rather than as spyware.
    pub fn watchware(&self) -> bool {
        self.id.starts_with("watchware.")
    }
    /// The publication date the compiler records first (`2026-10-20, ...`),
    /// as a Unix time at midnight UTC.
    pub fn published_at(&self) -> Option<i64> {
        let date = self.published.get(..10)?;
        let mut parts = date.split('-').map(str::parse::<u16>);
        let (Some(Ok(year)), Some(Ok(month)), Some(Ok(day))) =
            (parts.next(), parts.next(), parts.next())
        else {
            return None;
        };
        let month = time::Month::try_from(u8::try_from(month).ok()?).ok()?;
        time::Date::from_calendar_date(year.into(), month, u8::try_from(day).ok()?)
            .ok()
            .map(|d| d.midnight().assume_utc().unix_timestamp())
    }
    /// How much a match says, from the kind of evidence and its age. Exact
    /// artefacts (file hashes, signing certificates, app and profile
    /// identifiers, file paths) do not change hands. Domains and above all IP
    /// addresses do: an old one may belong to someone else today.
    pub fn confidence(&self, at: i64) -> &'static str {
        const YEAR: i64 = 365 * 86400;
        let age = self.published_at().map(|p| (at - p).max(0) / YEAR);
        match self.kind {
            Kind::Sha256
            | Kind::AppCertSha256
            | Kind::AppId
            | Kind::ConfigurationProfileId
            | Kind::FilePath => "high",
            Kind::ProcessName | Kind::FileName | Kind::Email => "medium",
            Kind::Domain => match age {
                Some(0..=2) => "high",
                Some(3..=5) | None => "medium",
                Some(_) => "low",
            },
            Kind::Ip => match age {
                Some(0..=1) => "medium",
                _ => "low",
            },
        }
    }
    /// Threat family recorded by the compiler after the publication date
    /// (`2026-10-20, mSpy (stalkerware)`), when the source names one.
    pub fn family(&self) -> Option<&str> {
        self.published
            .split_once(", ")
            .map(|(_, family)| family)
            .filter(|f| !f.is_empty())
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Bundle {
    pub schema_version: u8,
    pub version: u64,
    pub issued_at: i64,
    pub expires_at: i64,
    pub rules: Vec<Rule>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Envelope {
    payload: String,
    signature: String,
}
#[derive(Debug)]
pub struct VerifiedRules {
    bundle: Bundle,
    index: HashMap<(Kind, String), Vec<usize>>,
}
impl VerifiedRules {
    /// Only this constructor can create a trusted ruleset. Caller owns the pinned
    /// public keys (one or more 32-byte Ed25519 keys, concatenated, so a new
    /// signing key can ship in the app before releases use it) and a durable
    /// monotonic version floor. No key from the envelope is accepted.
    pub fn verify(
        bytes: &[u8],
        keys: &[u8],
        now: i64,
        minimum_version: u64,
    ) -> Result<Self, String> {
        if bytes.len() > MAX_BUNDLE {
            return Err("rules_too_large".into());
        }
        let envelope: Envelope =
            serde_json::from_slice(bytes).map_err(|_| "invalid_rules_envelope")?;
        let payload = STANDARD
            .decode(envelope.payload)
            .map_err(|_| "invalid_rules_payload")?;
        let signature = STANDARD
            .decode(envelope.signature)
            .map_err(|_| "invalid_rules_signature")?;
        let (keys, rest) = keys.as_chunks::<32>();
        if keys.is_empty() || !rest.is_empty() || keys.len() > 8 {
            return Err("invalid_trust_key".into());
        }
        let signature = Signature::from_slice(&signature).map_err(|_| "invalid_rules_signature")?;
        let mut trusted = false;
        for key in keys {
            let key = VerifyingKey::from_bytes(key).map_err(|_| "invalid_trust_key")?;
            trusted |= key.verify_strict(&payload, &signature).is_ok();
        }
        if !trusted {
            return Err("untrusted_rules".into());
        }
        let bundle: Bundle =
            serde_json::from_slice(&payload).map_err(|_| "invalid_rules_schema")?;
        if !(1..=2).contains(&bundle.schema_version)
            || bundle.version < minimum_version
            || bundle.version == 0
        {
            return Err("rules_rollback_or_version".into());
        }
        if bundle.issued_at > now
            || bundle.expires_at <= now
            || bundle.expires_at <= bundle.issued_at
            || bundle.expires_at - bundle.issued_at > 90 * 86400
        {
            return Err("rules_expired_or_future".into());
        }
        if bundle.rules.is_empty() || bundle.rules.len() > 50000 {
            return Err("rules_count_invalid".into());
        }
        let mut ids = HashSet::new();
        let mut index: HashMap<(Kind, String), Vec<usize>> = HashMap::new();
        for (i, r) in bundle.rules.iter().enumerate() {
            if bundle.schema_version == 1 && !r.kind.legacy() {
                return Err("rules_kind_unsupported".into());
            }
            if r.id.is_empty()
                || r.id.len() > 100
                || !r
                    .id
                    .bytes()
                    .all(|c| c.is_ascii_alphanumeric() || b"._:-".contains(&c))
                || !ids.insert(&r.id)
            {
                return Err("rules_id_invalid".into());
            }
            let source = url::Url::parse(&r.source).map_err(|_| "rules_source_invalid")?;
            if source.scheme() != "https"
                || r.source.len() > 1800
                || source.host_str().is_none()
                || !source.username().is_empty()
                || source.password().is_some()
                || r.published.is_empty()
                || r.published.len() > 100
            {
                return Err("rules_source_invalid".into());
            }
            let normalized = normalize(&r.kind, &r.value).ok_or("rules_value_invalid")?;
            if normalized != r.value {
                return Err("rules_value_not_canonical".into());
            }
            index
                .entry((r.kind.clone(), normalized))
                .or_default()
                .push(i);
        }
        Ok(Self { bundle, index })
    }
    pub fn version(&self) -> u64 {
        self.bundle.version
    }
    /// When the release was signed: the "now" indicator ages are measured
    /// against, the same for every scan made with it.
    pub fn issued_at(&self) -> i64 {
        self.bundle.issued_at
    }
    pub fn len(&self) -> usize {
        self.bundle.rules.len()
    }
    pub fn is_empty(&self) -> bool {
        self.bundle.rules.is_empty()
    }
    pub fn matches(&self, kind: Kind, value: &str) -> Vec<&Rule> {
        let Some(value) = normalize(&kind, value) else {
            return vec![];
        };
        self.index
            .get(&(kind, value))
            .map(|ids| ids.iter().map(|i| &self.bundle.rules[*i]).collect())
            .unwrap_or_default()
    }
    pub fn rules(&self) -> &[Rule] {
        &self.bundle.rules
    }
    /// Domain rules matching `host` exactly or as one of its parent domains,
    /// as MVT does: infrastructure registered by an attacker includes its
    /// subdomains (`api.c2.example` belongs to `c2.example`). Each hit carries
    /// the published parent when the match was not exact. Rules that name a
    /// shared hosting platform are only matched exactly.
    pub fn domain_matches(&self, host: &str) -> Vec<(&Rule, Option<String>)> {
        let Some(host) = normalize(&Kind::Domain, host) else {
            return vec![];
        };
        let mut hits: Vec<(&Rule, Option<String>)> = self
            .matches(Kind::Domain, &host)
            .into_iter()
            .map(|rule| (rule, None))
            .collect();
        let labels: Vec<&str> = host.split('.').collect();
        for start in 1..labels.len().saturating_sub(1) {
            let parent = labels[start..].join(".");
            if SHARED_PARENTS.contains(&parent.as_str()) {
                continue;
            }
            if let Some(ids) = self.index.get(&(Kind::Domain, parent.clone())) {
                for i in ids {
                    let rule = &self.bundle.rules[*i];
                    if !hits.iter().any(|(r, _)| r.id == rule.id) {
                        hits.push((rule, Some(parent.clone())));
                    }
                }
            }
        }
        hits
    }
}
/// Free-text indicator values are passed to MVT inside STIX patterns, which it
/// splits on `=` and strips of quotes and brackets: those characters, control
/// characters and backslashes are rejected rather than escaped.
fn plain(value: &str, max: usize) -> bool {
    !value.is_empty()
        && value.len() <= max
        && value.trim() == value
        && !value
            .chars()
            .any(|c| c.is_control() || matches!(c, '=' | '\'' | '[' | ']' | '\\'))
}
pub fn normalize(kind: &Kind, value: &str) -> Option<String> {
    match kind {
        Kind::ProcessName => (plain(value, 255) && !value.contains('/')).then(|| value.into()),
        Kind::FileName => (plain(value, 255) && !value.contains('/')).then(|| value.into()),
        Kind::FilePath => (plain(value, 1024) && value.contains('/')).then(|| value.into()),
        Kind::ConfigurationProfileId => plain(value, 255).then(|| value.into()),
        Kind::Email => {
            let email = value.to_ascii_lowercase();
            let (local, host) = email.split_once('@')?;
            (plain(&email, 254)
                && !local.is_empty()
                && !host.is_empty()
                && !host.contains('@')
                && !email.contains(char::is_whitespace))
            .then_some(email)
        }
        Kind::AppId => {
            let parts: Vec<_> = value.split('.').collect();
            (value.len() <= 255
                && parts.len() >= 2
                && parts.iter().all(|p| {
                    !p.is_empty()
                        && p.bytes()
                            .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
                }))
            .then(|| value.into())
        }
        Kind::AppCertSha256 => normalize(&Kind::Sha256, value),
        Kind::Sha256 => {
            if value.len() == 64 && value.bytes().all(|c| c.is_ascii_hexdigit()) {
                Some(value.to_ascii_lowercase())
            } else {
                None
            }
        }
        Kind::Ip => value.parse::<IpAddr>().ok().map(|ip| ip.to_string()),
        Kind::Domain => {
            let d = value.trim_end_matches('.').to_ascii_lowercase();
            if d.len() > 253
                || !d.contains('.')
                || d.parse::<IpAddr>().is_ok()
                || !d.split('.').all(|s| {
                    !s.is_empty()
                        && s.len() <= 63
                        && !s.starts_with('-')
                        && !s.ends_with('-')
                        && s.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
                })
            {
                None
            } else {
                Some(d)
            }
        }
    }
}
#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};
    pub fn fixture(now: i64) -> (Vec<u8>, [u8; 32]) {
        let key = SigningKey::from_bytes(&[7; 32]);
        let payload = serde_json::to_vec(&Bundle {
            schema_version: 1,
            version: 1,
            issued_at: now - 1,
            expires_at: now + 100,
            rules: vec![Rule {
                id: "fixture.domain".into(),
                kind: Kind::Domain,
                value: "indicator.invalid".into(),
                source: "https://example.invalid/research".into(),
                published: "synthetic test only".into(),
            }],
        })
        .unwrap();
        let signature = key.sign(&payload);
        (serde_json::to_vec(&serde_json::json!({"payload":STANDARD.encode(&payload),"signature":STANDARD.encode(signature.to_bytes())})).unwrap(),key.verifying_key().to_bytes())
    }
    #[test]
    fn bundled_intelligence_verifies_at_release_time() {
        let bytes = include_bytes!("../../../src-tauri/resources/intelligence/bundle.json");
        let key = include_bytes!("../../../src-tauri/resources/intelligence/trusted-keys.bin");
        let release: serde_json::Value =
            serde_json::from_slice(include_bytes!("../../../intelligence/release.json")).unwrap();
        let rules = VerifiedRules::verify(
            bytes,
            key,
            release["issuedAt"].as_i64().unwrap(),
            release["version"].as_u64().unwrap(),
        )
        .unwrap();
        assert_eq!(rules.len() as u64, release["legacyRules"].as_u64().unwrap());
        // Schema 2 carries every compiled indicator, including forensic types.
        let full = include_bytes!("../../../src-tauri/resources/intelligence/bundle-v2.json");
        let rules = VerifiedRules::verify(
            full,
            key,
            release["issuedAt"].as_i64().unwrap(),
            release["version"].as_u64().unwrap(),
        )
        .unwrap();
        assert_eq!(rules.len() as u64, release["rules"].as_u64().unwrap());
        assert!(rules.rules().iter().any(|r| r.kind == Kind::ProcessName));
    }
    #[test]
    fn signature_expiry_and_rollback() {
        let (bytes, key) = fixture(1000);
        assert!(VerifiedRules::verify(&bytes, &key, 1000, 1).is_ok());
        assert!(VerifiedRules::verify(&bytes, &key, 1000, 2).is_err());
        assert!(VerifiedRules::verify(&bytes, &key, 1100, 1).is_err());
        assert!(VerifiedRules::verify(&bytes, &key, 900, 1).is_err());
        assert!(VerifiedRules::verify(&bytes, &[8; 32], 1000, 1).is_err());
        // During a key change the app trusts the current and the next key.
        let next = SigningKey::from_bytes(&[9; 32]).verifying_key().to_bytes();
        let both = [next, key].concat();
        assert!(VerifiedRules::verify(&bytes, &next, 1000, 1).is_err());
        assert!(VerifiedRules::verify(&bytes, &both, 1000, 1).is_ok());
        assert!(VerifiedRules::verify(&bytes, &both[..40], 1000, 1).is_err());
        assert!(VerifiedRules::verify(&bytes, &[], 1000, 1).is_err());
        let mut altered: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        altered["payload"] = serde_json::json!(STANDARD.encode(b"tampered"));
        assert!(
            VerifiedRules::verify(&serde_json::to_vec(&altered).unwrap(), &key, 1000, 1).is_err()
        );
    }
    #[test]
    fn confidence_follows_the_kind_of_evidence_and_its_age() {
        let rule = |kind, published: &str| Rule {
            id: "t.x".into(),
            kind,
            value: "x".into(),
            source: "https://example.invalid".into(),
            published: published.into(),
        };
        // 26 November 2026.
        let at = 1_795_651_200;
        assert_eq!(
            rule(Kind::Sha256, "2016-08-24, Pegasus").confidence(at),
            "high"
        );
        assert_eq!(
            rule(Kind::Domain, "2025-01-10, Predator").confidence(at),
            "high"
        );
        assert_eq!(
            rule(Kind::Domain, "2021-07-18, Pegasus").confidence(at),
            "medium"
        );
        assert_eq!(
            rule(Kind::Domain, "2016-08-24, Pegasus").confidence(at),
            "low"
        );
        assert_eq!(
            rule(Kind::Domain, "date unavailable").confidence(at),
            "medium"
        );
        assert_eq!(
            rule(Kind::Ip, "2026-03-03, Coruna").confidence(at),
            "medium"
        );
        assert_eq!(rule(Kind::Ip, "2021-07-18, Pegasus").confidence(at), "low");
        assert_eq!(
            rule(Kind::Domain, "2016-08-24, Pegasus").published_at(),
            Some(1_471_996_800)
        );
    }
    #[test]
    fn exact_domain_boundary() {
        let (bytes, key) = fixture(1000);
        let rules = VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap();
        assert_eq!(rules.matches(Kind::Domain, "INDICATOR.INVALID.").len(), 1);
        assert!(rules
            .matches(Kind::Domain, "notindicator.invalid")
            .is_empty());
        assert!(rules
            .matches(Kind::Domain, "indicator.invalid.attacker.invalid")
            .is_empty());
        assert!(rules
            .matches(Kind::Domain, "sub.indicator.invalid")
            .is_empty());
    }
    #[test]
    fn subdomains_of_published_domains_match_but_shared_platforms_do_not() {
        let rules = vec![
            rule("t.c2", Kind::Domain, "c2.example"),
            rule("t.shared", Kind::Domain, "firebaseio.com"),
            rule("t.customer", Kind::Domain, "spy-123.firebaseio.com"),
        ];
        let (bytes, key) = signed(2, rules, 1000);
        let verified = VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap();
        let exact = verified.domain_matches("C2.example.");
        assert_eq!(exact.len(), 1);
        assert_eq!(exact[0].1, None);
        let sub = verified.domain_matches("api.eu.c2.example");
        assert_eq!(sub.len(), 1);
        assert_eq!(sub[0].0.id, "t.c2");
        assert_eq!(sub[0].1.as_deref(), Some("c2.example"));
        // Label boundaries only: no suffix-string matches.
        assert!(verified.domain_matches("notc2.example").is_empty());
        assert!(verified.domain_matches("c2.example.evil").is_empty());
        // A platform rule never covers every customer of the platform.
        assert!(verified.domain_matches("other.firebaseio.com").is_empty());
        assert_eq!(verified.domain_matches("firebaseio.com").len(), 1);
        let customer = verified.domain_matches("x.spy-123.firebaseio.com");
        assert_eq!(customer.len(), 1);
        assert_eq!(customer[0].0.id, "t.customer");
    }
    fn signed(schema: u8, rules: Vec<Rule>, now: i64) -> (Vec<u8>, [u8; 32]) {
        let key = SigningKey::from_bytes(&[9; 32]);
        let payload = serde_json::to_vec(&Bundle {
            schema_version: schema,
            version: 2,
            issued_at: now - 1,
            expires_at: now + 100,
            rules,
        })
        .unwrap();
        let signature = key.sign(&payload);
        (
            serde_json::to_vec(&serde_json::json!({"payload":STANDARD.encode(&payload),"signature":STANDARD.encode(signature.to_bytes())})).unwrap(),
            key.verifying_key().to_bytes(),
        )
    }
    fn rule(id: &str, kind: Kind, value: &str) -> Rule {
        Rule {
            id: id.into(),
            kind,
            value: value.into(),
            source: "https://example.invalid/research".into(),
            published: "synthetic test only".into(),
        }
    }
    #[test]
    fn schema_two_carries_forensic_indicator_types_and_schema_one_stays_legacy() {
        let rules = vec![
            rule("t.process", Kind::ProcessName, "roleaccountd"),
            rule("t.email", Kind::Email, "attacker@example.invalid"),
            rule("t.file", Kind::FileName, "libtools.dylib"),
            rule(
                "t.path",
                Kind::FilePath,
                "/private/var/db/com.apple.xpc.roleaccountd.staging",
            ),
            rule("t.app", Kind::AppId, "com.example.stalker"),
            rule("t.cert", Kind::AppCertSha256, &"ab".repeat(32)),
            rule(
                "t.profile",
                Kind::ConfigurationProfileId,
                "com.example.profile",
            ),
        ];
        let (bytes, key) = signed(2, rules.clone(), 1000);
        let verified = VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap();
        assert_eq!(verified.len(), 7);
        assert_eq!(verified.matches(Kind::ProcessName, "roleaccountd").len(), 1);
        assert_eq!(
            verified
                .matches(Kind::Email, "Attacker@Example.invalid")
                .len(),
            1
        );
        // Schema 1 apps must never receive the new types.
        let (bytes, key) = signed(1, rules, 1000);
        assert_eq!(
            VerifiedRules::verify(&bytes, &key, 1000, 1).unwrap_err(),
            "rules_kind_unsupported"
        );
    }
    #[test]
    fn free_text_indicators_cannot_break_stix_patterns() {
        for (kind, bad) in [
            (Kind::ProcessName, "a=b"),
            (Kind::ProcessName, "it's"),
            (Kind::FileName, "dir/file"),
            (Kind::FilePath, "no-slash"),
            (Kind::FilePath, "/a]b"),
            (Kind::Email, "no-at-sign"),
            (Kind::Email, "a@b@c"),
            (Kind::AppId, "single"),
            (Kind::AppId, "com.bad id"),
            (Kind::AppCertSha256, "xyz"),
            (Kind::ConfigurationProfileId, " padded"),
            (Kind::ConfigurationProfileId, "line\nbreak"),
        ] {
            assert_eq!(normalize(&kind, bad), None, "{bad}");
        }
        assert_eq!(
            normalize(&Kind::Email, "A@B.example").as_deref(),
            Some("a@b.example")
        );
    }
}
