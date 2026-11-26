//! Consent and capability planning. No device access or network side effects.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Device {
    Ios,
    Android,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Host {
    Mac,
    Windows,
    Linux,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Capture {
    Rvi,
    AndroidVpn,
    Unavailable,
}
#[derive(Debug, Default)]
pub struct Capabilities {
    pub rvi_available: bool,
    pub android_vpn_available: bool,
    pub device_identity_verified: bool,
}
/// Capability is established by an adapter, never inferred from USB attachment.
pub fn capture_method(host: Host, device: Device, c: &Capabilities, consent: bool) -> Capture {
    if !consent || !c.device_identity_verified {
        return Capture::Unavailable;
    }
    match (host, device) {
        (Host::Mac, Device::Ios) if c.rvi_available => Capture::Rvi,
        (_, Device::Android) if c.android_vpn_available => Capture::AndroidVpn,
        _ => Capture::Unavailable,
    }
}
#[derive(Debug, PartialEq, Eq)]
pub enum SessionError {
    ConsentRequired,
    AlreadyStarted,
    NotRunning,
    Closed,
}
#[derive(Debug, Default)]
pub struct Session {
    consent: bool,
    running: bool,
    closed: bool,
}
impl Session {
    pub fn authorize(&mut self, explicit_owner_consent: bool) -> Result<(), SessionError> {
        if self.closed {
            return Err(SessionError::Closed);
        }
        if self.running {
            return Err(SessionError::AlreadyStarted);
        }
        self.consent = explicit_owner_consent;
        Ok(())
    }
    pub fn start(&mut self) -> Result<(), SessionError> {
        if self.closed {
            return Err(SessionError::Closed);
        }
        if !self.consent {
            return Err(SessionError::ConsentRequired);
        }
        if self.running {
            return Err(SessionError::AlreadyStarted);
        }
        self.running = true;
        Ok(())
    }
    pub fn revoke(&mut self) {
        self.consent = false;
        self.running = false;
        self.closed = true;
    }
    pub fn can_access_device(&self) -> bool {
        self.consent && self.running && !self.closed
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn no_access_without_consent() {
        let mut s = Session::default();
        assert_eq!(s.start(), Err(SessionError::ConsentRequired));
        assert!(!s.can_access_device());
    }
    #[test]
    fn revocation_is_terminal() {
        let mut s = Session::default();
        s.authorize(true).unwrap();
        s.start().unwrap();
        assert!(s.can_access_device());
        s.revoke();
        assert!(!s.can_access_device());
        assert_eq!(s.start(), Err(SessionError::Closed));
        assert_eq!(s.authorize(true), Err(SessionError::Closed));
    }
    #[test]
    fn usb_never_implies_capture() {
        assert_eq!(
            capture_method(Host::Mac, Device::Ios, &Capabilities::default(), true),
            Capture::Unavailable
        );
    }
    #[test]
    fn capture_requires_consent_and_attribution() {
        let mut c = Capabilities {
            rvi_available: true,
            android_vpn_available: true,
            device_identity_verified: false,
        };
        assert_eq!(
            capture_method(Host::Mac, Device::Ios, &c, true),
            Capture::Unavailable
        );
        c.device_identity_verified = true;
        assert_eq!(
            capture_method(Host::Mac, Device::Ios, &c, false),
            Capture::Unavailable
        );
        assert_eq!(
            capture_method(Host::Windows, Device::Ios, &c, true),
            Capture::Unavailable
        );
        assert_eq!(
            capture_method(Host::Mac, Device::Ios, &c, true),
            Capture::Rvi
        );
        assert_eq!(
            capture_method(Host::Linux, Device::Android, &c, true),
            Capture::AndroidVpn
        );
    }
}

pub mod android;
pub mod behavior;
pub mod extractions;
pub mod ios_diagnostics;
pub mod links;
pub mod model;
pub mod network;
pub mod rules;
pub mod scan;

pub mod evidence;

pub mod correlate;
