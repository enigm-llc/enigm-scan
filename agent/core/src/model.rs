use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Report {
    pub schema_version: u8,
    pub started_at: String,
    pub finished_at: String,
    pub device: String,
    pub artifacts_analyzed: u64,
    pub network_connections: u64,
    pub checks: Vec<Check>,
    pub findings: Vec<Finding>,
    pub limitations: Vec<String>,
    pub engines: Vec<Engine>,
    pub rule_bundle_version: String,
    pub cleanup: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Check {
    pub id: String,
    pub name: String,
    pub status: String,
    pub detail: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Finding {
    pub id: String,
    pub category: String,
    pub source: String,
    pub evidence: String,
    pub severity: String,
    pub confidence: String,
    pub timestamp: Option<String>,
    pub rule: String,
    pub rule_version: String,
    pub limitations: Vec<String>,
    pub recommendation: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Engine {
    pub name: String,
    pub version: String,
}
pub fn timestamp() -> String {
    time::OffsetDateTime::now_utc()
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_default()
}
pub fn bounded(value: &str, limit: usize) -> String {
    value
        .chars()
        .filter(|c| !c.is_control())
        .take(limit)
        .collect()
}
impl Report {
    pub fn new(device: &str, bundle_version: u64) -> Self {
        Self {schema_version:1, started_at:timestamp(), finished_at:timestamp(), device:device.into(),
            artifacts_analyzed:0, network_connections:0, checks:vec![], findings:vec![],
            limitations:vec!["Only authorized, accessible artifacts were checked. No findings do not guarantee safety. A match is not a confirmed infection.".into()],
            engines:vec![Engine{name:"Enigm local engine".into(),version:env!("CARGO_PKG_VERSION").into()}],
            rule_bundle_version:bundle_version.to_string(),cleanup:"not_started".into()}
    }
    pub fn check(&mut self, id: &str, status: &str, detail: &str) {
        self.checks.push(Check {
            id: id.into(),
            name: id.into(),
            status: status.into(),
            detail: bounded(detail, 1800),
        });
    }
    pub fn finish(&mut self) {
        self.finished_at = timestamp();
    }
}
