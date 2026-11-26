import { useEffect, useRef, useState } from "react";
import { FolderOpen, LoaderCircle } from "lucide-react";
import {
  native,
  type AgentStatus,
  type Capabilities,
  type Device,
} from "../core/agent";
import { parseReport, type ScanReport } from "../core/report";
import { preloadPdf } from "../core/pdf-loader";
import { DEEP_CHECK_KEY } from "../core/scan-choices";
import { agentDictionaries } from "../shared/i18n/agent";
import { productCopy } from "../shared/i18n/product";
import type { Language, Copy } from "../shared/i18n/i18n";
import { DeviceIcon } from "./Brand";
import { toast } from "../desktop/toast";
import { PhoneStage, type PhoneScreen } from "./PhoneStage";
import { Notice } from "./Notice";
import { flowCopy } from "../shared/i18n/flow";
import { ScanProgress } from "./ScanProgress";
import {
  deviceErrorCopy,
  deviceErrorCode,
  diagnosticCode,
} from "../shared/i18n/device-errors";

export function Scanner({
  language,
  t,
  onReport,
  onCancelled,
}: {
  language: Language;
  t: Copy;
  onReport: (report: ScanReport) => void;
  /** The scan was cancelled and its session cleared: start again from the
   *  first step. */
  onCancelled?: () => void;
}) {
  const a = agentDictionaries[language],
    c = productCopy[language],
    f = flowCopy[language];
  // Load the PDF exporter ahead of the report.
  useEffect(preloadPdf, []);
  const [caps, setCaps] = useState<Capabilities | null>(null),
    [capError, setCapError] = useState(false);
  const [method, setMethod] = useState<"usb" | "files">("usb"),
    [device, setDevice] = useState<"ios" | "android">("ios");
  // iPhone: observe its traffic for 2 minutes (off unless asked).
  const [networkConsent, setNetworkConsent] = useState(false);
  // Android: read its open connections (no wait; on, as it always was).
  const [androidConnections, setAndroidConnections] = useState(true);
  // iPhone deep check: the owner presses buttons during the copy.
  // Kept for this tab, so a reload during the copy still shows its steps.
  const [deepConsent, setDeepConsentState] = useState(
    () => sessionStorage.getItem(DEEP_CHECK_KEY) === "1",
  );
  const setDeepConsent = (value: boolean) => {
    setDeepConsentState(value);
    if (value) sessionStorage.setItem(DEEP_CHECK_KEY, "1");
    else sessionStorage.removeItem(DEEP_CHECK_KEY);
  };
  const [consent, setConsent] = useState(false),
    [evidence, setEvidence] = useState("");
  // iPhone deep check prepared on the ready step: Trust and the three
  // buttons happen there, and Start waits for the phone's confirmation.
  const [prep, setPrep] = useState<AgentStatus | null>(null);
  const preparing = useRef(false);
  const [devices, setDevices] = useState<Device[]>([]),
    [selected, setSelected] = useState<Device | null>(null);
  const deepChosen =
    method === "usb" &&
    selected?.platform === "ios" &&
    !!caps?.iosUsb &&
    deepConsent;
  const prepConfirmed =
    prep?.phase === "deep_ready" ||
    (prep?.phase === "deep_wait" && !!prep.acquisition?.sysdiagnose);
  const [finding, setFinding] = useState(false),
    [searched, setSearched] = useState(false),
    [error, setError] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  // Failures the person can fix on the phone keep the chosen phone, so
  // "Try again" restarts the scan without going back through the steps.
  const RETRYABLE = [
    "device_not_trusted",
    "device_trust_denied",
    "device_locked",
    "device_passcode_timeout",
    "device_cancelled",
    "device_disconnected",
  ];
  const [searchRound, setSearchRound] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [androidWait, setAndroidWait] = useState<{
    start: number;
    timedOut: boolean;
  } | null>(null);
  const detectionCopy = deviceErrorCopy[language];
  const [encrypted, setEncrypted] = useState(false),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [starting, setStarting] = useState(false);
  const [status, setStatus] = useState<AgentStatus>({
    phase: "ready",
    artifacts: 0,
    error: null,
    report: null,
  });
  const running = useRef(false),
    lock = useRef(false),
    callback = useRef(onReport);
  callback.current = onReport;
  const cancelledCallback = useRef(onCancelled);
  cancelledCallback.current = onCancelled;
  const [rulesOnline, setRulesOnline] = useState<boolean | null>(null);
  // What the app can do comes first, so the search is ready at once; the
  // signed rules are refreshed afterwards and the figures follow.
  async function refresh() {
    let loaded = false;
    const load = async () => {
      setCaps(await native<Capabilities>("capabilities"));
      setCapError(false);
      loaded = true;
    };
    try {
      await load();
    } catch {}
    try {
      setRulesOnline(await native<boolean>("update_intelligence"));
      await load();
    } catch {}
    if (!loaded) setCapError(true);
  }
  useEffect(() => {
    void native<AgentStatus>("scan_status")
      .then((next) => {
        if (next.report) {
          callback.current(parseReport(JSON.stringify(next.report)));
          return;
        }
        if (
          [
            "awaiting_trust",
            "deep_wait",
            "awaiting_passcode",
            "passcode_retry",
            "acquiring",
            "capturing",
            "decrypting",
            "analyzing",
            "forensics",
            "network",
            "finalizing",
          ].includes(next.phase)
        ) {
          running.current = true;
          setStatus(next);
          setBusy(true);
          // A scan already running still shows how many indicators it uses.
          void native<Capabilities>("capabilities")
            .then(setCaps)
            .catch(() => {});
          return;
        }
        void refresh();
      })
      .catch(() => setCapError(true));
    return () => {
      if (running.current) void native("cancel_scan").catch(() => {});
    };
  }, []);
  useEffect(() => {
    if (!busy) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const next = await native<AgentStatus>("scan_status");
        if (!active) return;
        setError(false);
        setStatus(next);
        if (next.report) {
          const report = parseReport(JSON.stringify(next.report));
          running.current = false;
          setBusy(false);
          callback.current(report);
          return;
        }
        if (next.phase === "cancelled") {
          // Nothing of the cancelled scan stays: clear the session (the
          // copy and the phone link are already gone) and start over.
          running.current = false;
          await clearSession();
          if (!active) return;
          setBusy(false);
          cancelledCallback.current?.();
          return;
        }
        if (next.phase === "failed") {
          running.current = false;
          setBusy(false);
          if (next.error === "backup_password_required") {
            setEncrypted(true);
            setMethod("usb");
          } else if (!RETRYABLE.includes(next.error ?? "")) {
            setSelected(null);
          }
          return;
        }
        timer = setTimeout(poll, 500);
      } catch {
        if (active) {
          setError(true);
          setBusy(false);
          void native("cancel_scan").catch(() => {});
        }
      }
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [busy]);
  // Choosing the deep check on an iPhone prepares it right away: the phone
  // asks for Trust, then the owner presses the three buttons.
  const deepPrepare = deepChosen && consent && !busy && !!selected;
  useEffect(() => {
    if (!deepPrepare || preparing.current || !selected) return;
    preparing.current = true;
    void native("start_scan", {
      request: {
        device: "ios",
        consent,
        phoneIp: null,
        pcapConsent: false,
        usbId: selected.id,
        backupPassword: null,
        deepCheck: true,
        hold: true,
      },
    })
      .then(() => {
        running.current = true;
        setPrep({
          phase: "acquiring",
          artifacts: 0,
          error: null,
          report: null,
        });
      })
      .catch(() => {
        preparing.current = false;
        toast.error(f.deepFailed);
        setDeepConsent(false);
      });
  }, [deepPrepare]);
  // Unchosen while prepared: stop it; the poll below clears the session.
  useEffect(() => {
    if (!deepConsent && prep) void native("cancel_scan").catch(() => {});
  }, [deepConsent]);
  const prepActive = prep !== null && !busy;
  useEffect(() => {
    if (!prepActive) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const next = await native<AgentStatus>("scan_status");
        if (!active) return;
        if (next.phase === "failed" || next.phase === "cancelled") {
          // Nothing of it stays: the copy never started, and the pairing
          // and temporary folder went with the adapter.
          running.current = false;
          await clearSession();
          if (!active) return;
          preparing.current = false;
          setPrep(null);
          if (next.phase === "failed") {
            toast.error(failureMessage(next.error));
            setDeepConsent(false);
          }
          return;
        }
        setPrep(next);
      } catch {
        // Asked again below.
      }
      if (active) timer = setTimeout(poll, 500);
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [prepActive]);
  /** The deep check is confirmed: copy now, observing the network if
   *  chosen on this screen. */
  async function begin() {
    if (lock.current || !prep) return;
    lock.current = true;
    setStarting(true);
    try {
      await native("begin_copy", { captureNetwork: networkConsent });
      preparing.current = false;
      setStatus(prep);
      setPrep(null);
      setBusy(true);
    } catch {
      setError(true);
    } finally {
      setStarting(false);
      lock.current = false;
    }
  }
  /** Forget the native session; it refuses while the scan is still winding
   *  down, so try again for a few seconds. */
  async function clearSession() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        await native("finish_scan");
        return;
      } catch {
        await new Promise((done) => setTimeout(done, 150));
      }
    }
  }
  async function choose() {
    setDiscoveryError(null);
    if (lock.current) return;
    lock.current = true;
    try {
      setError(false);
      const value = await native<string | null>("choose_evidence");
      if (value) {
        setEvidence(value);
        setMethod("files");
        setSelected(null);
      }
    } catch {
      setError(true);
    } finally {
      lock.current = false;
    }
  }
  async function find(platform: "auto" | "ios" | "android" = "auto") {
    if (lock.current || !consent) return;
    lock.current = true;
    setSearchRound((round) => round + 1);
    setFinding(true);
    setSelected(null);
    setError(false);
    setDiscoveryError(null);
    try {
      const list = await native<Device[]>("list_devices", {
        device: platform,
        consent,
      });
      setDevices(list);
      setSearched(true);
      const allowed = list.filter((d) => d.authorized || d.needsTrust);
      if (allowed.length === 1) {
        setSelected(allowed[0]);
        setDevice(allowed[0].platform as "ios" | "android");
      }
    } catch (failure) {
      setDiscoveryError(deviceErrorCode(failure));
      setError(true);
    } finally {
      setFinding(false);
      lock.current = false;
    }
  }
  async function run() {
    setDiscoveryError(null);
    if (lock.current) return;
    lock.current = true;
    setStarting(true);
    setError(false);
    const secret = device === "ios" && encrypted ? password : null;
    setPassword("");
    try {
      await native("start_scan", {
        request: {
          device,
          consent,
          phoneIp: null,
          pcapConsent:
            method === "usb" &&
            (device === "ios"
              ? networkConsent
              : !!caps?.androidUsb && androidConnections),
          usbId: method === "usb" ? selected?.id : null,
          backupPassword: secret,
          deepCheck:
            method === "usb" &&
            device === "ios" &&
            !!caps?.iosUsb &&
            deepConsent,
        },
      });
      running.current = true;
      setStatus({
        phase: "acquiring",
        artifacts: 0,
        error: null,
        report: null,
      });
      setBusy(true);
    } catch {
      setError(true);
    } finally {
      setStarting(false);
      lock.current = false;
    }
  }
  // Android shows "Allow USB debugging?" after it is plugged in. The phone
  // list is read again every 2 s for up to 3 minutes and the phone is
  // selected once it is allowed, so no second search is needed.
  const ANDROID_WAIT = 180_000;
  const androidPending =
    method === "usb" &&
    searched &&
    !finding &&
    !busy &&
    !!caps?.androidUsb &&
    devices.some((d) => d.platform === "android" && !d.authorized && !d.issue);
  useEffect(() => {
    if (!androidPending) {
      setAndroidWait(null);
      return;
    }
    const start = Date.now();
    setNow(start);
    setAndroidWait({ start, timedOut: false });
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (!active) return;
      if (Date.now() - start >= ANDROID_WAIT) {
        setAndroidWait({ start, timedOut: true });
        return;
      }
      try {
        const list = await native<Device[]>("refresh_devices");
        if (!active) return;
        setDevices((previous) => [
          ...previous.filter((d) => d.platform !== "android"),
          ...list,
        ]);
        const allowed = list.filter((d) => d.authorized);
        if (allowed.length === 1) {
          setSelected(allowed[0]);
          setDevice("android");
          return;
        }
      } catch {
        // Keep waiting: a missed answer is not a refusal.
      }
      timer = setTimeout(tick, 2000);
    };
    timer = setTimeout(tick, 2000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [androidPending, searchRound]);
  // A clock for the labelled waiting times.
  useEffect(() => {
    if (!androidWait || androidWait.timedOut) return;
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, [androidWait]);
  const waitLeft = (start: number, total: number) => {
    const seconds = Math.min(
      total / 1000,
      Math.max(0, Math.ceil((start + total - now) / 1000)),
    );
    return a.waitLeft.replace(
      "{t}",
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    );
  };
  const ready = method === "files" ? !!evidence : !!selected;
  // Searched, and nothing is plugged in: say so in the heading, calmly.
  const missing =
    method === "usb" && searched && !finding && devices.length === 0;
  const unusable =
    method === "usb" &&
    searched &&
    devices.length > 0 &&
    !devices.some((d) => d.authorized || d.needsTrust);
  const failed =
    !busy &&
    ((error && !discoveryError) ||
      status.phase === "failed" ||
      !!discoveryError);
  const trouble = (
    reason: "unplugged" | "locked" | "trust" | "error",
    [title, detail]: [string, string],
  ): PhoneScreen => ({ kind: "problem", reason, title, detail });
  // What the phone itself shows when something went wrong.
  // Quiet checks beside the phone, matched to what went wrong.
  const checkList = (items: string[]) => ({ title: f.checkTitle, items });
  const checks =
    status.error === "device_disconnected"
      ? checkList([f.chkCable, f.chkPort, f.chkUnlock])
      : status.error === "device_locked"
        ? checkList([f.chkUnlock, f.chkAwake])
        : status.error === "device_not_trusted" ||
            status.error === "device_trust_denied" ||
            status.error === "device_passcode_timeout" ||
            status.error === "device_cancelled"
          ? checkList([f.chkApprove, f.chkRetry])
          : checkList([f.chkCable, f.chkUnlock, f.chkApprove, f.chkApp]);
  const problem: PhoneScreen | null = !failed
    ? null
    : discoveryError
      ? trouble("error", f.problemError)
      : status.error === "device_disconnected"
        ? trouble("unplugged", f.problemUnplugged)
        : status.error === "device_locked"
          ? trouble("locked", f.problemLocked)
          : status.error === "device_not_trusted" ||
              status.error === "device_trust_denied" ||
              status.error === "device_passcode_timeout" ||
              status.error === "device_cancelled"
            ? trouble("trust", f.problemTrust)
            : trouble("error", f.problemError);
  // Failures the person can act on get their own sentence.
  const failureMessage = (code?: string | null) =>
    code === "backup_password_required"
      ? c.backupPasswordNeeded
      : code === "insufficient_disk_space" || code === "evidence_snapshot_limit"
        ? c.diskSpaceNeeded
        : code === "device_locked"
          ? a.deviceLocked
          : code === "device_disconnected"
            ? a.deviceDisconnected
            : code === "device_not_trusted"
              ? a.deviceNotTrusted
              : code === "device_trust_denied"
                ? a.deviceTrustDenied
                : code === "device_passcode_timeout"
                  ? a.devicePasscodeTimeout
                  : code === "device_cancelled"
                    ? a.deviceCancelled
                    : code === "deep_check_failed"
                      ? f.deepFailed
                      : code?.startsWith("backup_")
                        ? a.backupError
                        : failureText(code);
  const failureText = (code?: string | null) =>
    code === "device_not_authorized"
      ? a.failNotAuthorized
      : code === "adb_session_expired" || code === "adb_session_required"
        ? a.failAdbExpired
        : code === "acquisition_failed" || code === "acquisition_incomplete"
          ? a.failCopy
          : code === "scan_running"
            ? a.failBusy
            : code === "ios_transport_unavailable"
              ? a.failAppleUsb
              : code === "ios_discovery_timeout"
                ? a.failIphoneMissing
                : code === "ios_startup_timeout"
                  ? a.failIosStart
                  : code === "adb_server_timeout" ||
                      code === "adb_server_failed" ||
                      code === "adb_port_unavailable"
                    ? a.failAdbStart
                    : code?.startsWith("engine_")
                      ? a.enginesMissing
                      : a.error;
  const canStart =
    !!caps &&
    consent &&
    ready &&
    (!encrypted || !!password) &&
    !starting &&
    // With the deep check chosen, only once the phone has confirmed it.
    (!deepChosen || prep?.phase === "deep_ready");
  const consentControl = (
    <label className="consent compact-consent">
      <input
        type="checkbox"
        checked={consent}
        disabled={finding || starting}
        onChange={(e) => {
          setConsent(e.target.checked);
          if (!e.target.checked) setSelected(null);
        }}
      />
      <span>{a.consent}</span>
    </label>
  );
  const alerts = !busy && (
    <>
      {discoveryError && error && !busy && (
        <Notice
          message={
            discoveryError === "consent_required"
              ? detectionCopy.consent
              : discoveryError === "android_usb_permission"
                ? detectionCopy.permission
                : [
                      "ios_transport_unavailable",
                      "scan_running",
                      "adb_session_expired",
                    ].includes(discoveryError) ||
                    discoveryError.startsWith("engine_")
                  ? failureText(discoveryError)
                  : detectionCopy.failed
          }
        >
          <div className="device-options">
            {(["ios", "android"] as const).map((platform) => (
              <button
                key={platform}
                disabled={finding || !consent}
                onClick={() => void find(platform)}
              >
                <DeviceIcon device={platform} size={18} />
                {detectionCopy[platform]}
              </button>
            ))}
          </div>
          <details>
            <summary>{detectionCopy.code}</summary>
            <code>{discoveryError}</code>
          </details>
        </Notice>
      )}
      {((error && !busy && !discoveryError) || status.phase === "failed") && (
        <>
          <Notice message={failureMessage(status.error)} />
          {status.phase === "failed" &&
            RETRYABLE.includes(status.error ?? "") &&
            selected && (
              <button
                className="quiet-action retry-scan"
                disabled={starting || !consent}
                onClick={() => void run()}
              >
                {f.tryAgain}
              </button>
            )}
          {status.phase === "failed" && diagnosticCode(status.error) && (
            <details className="diagnostic-code">
              <summary>{detectionCopy.code}</summary>
              <code>
                {[status.error, status.diagnostic]
                  .map(diagnosticCode)
                  .filter(Boolean)
                  .join(" · ")}
              </code>
            </details>
          )}
        </>
      )}
    </>
  );
  // The same optional checks, in the same form, for both phones. Each one
  // only when this app version does it.
  const options =
    selected?.platform === "ios"
      ? [
          {
            id: "network",
            title: f.optionNetwork,
            help: f.optionNetworkIos,
            checked: networkConsent,
            set: setNetworkConsent,
          },
          ...(caps?.iosUsb
            ? [
                {
                  id: "deep",
                  title: f.optionDeep,
                  help: f.optionDeepHelp,
                  checked: deepConsent,
                  set: setDeepConsent,
                },
              ]
            : []),
        ]
      : selected?.platform === "android" && caps?.androidUsb
        ? [
            {
              id: "network",
              title: f.optionNetwork,
              help: f.optionNetworkAndroid,
              checked: androidConnections,
              set: setAndroidConnections,
            },
          ]
        : [];
  return (
    <section
      className={`desktop-flow ${busy ? "is-running" : ""}`}
      aria-labelledby="scanner-heading"
    >
      {busy ? (
        <ScanProgress
          status={status}
          a={a}
          t={t}
          encrypted={encrypted}
          network={method === "usb" && device === "ios" && networkConsent}
          rules={caps?.rules}
          ios={method === "usb" && device === "ios"}
          diagnostics={!!caps?.iosUsb && deepConsent}
          onCancel={() =>
            void native("cancel_scan").catch(() => setError(true))
          }
        />
      ) : (
        <>
          {(() => {
            const shown =
              selected ?? (devices.length === 1 ? devices[0] : null);
            const platform = shown?.platform === "android" ? "android" : "ios";
            return (
              <PhoneStage
                language={language}
                platform={shown || problem ? platform : "auto"}
                cable={missing ? "unplugged" : undefined}
                facts={
                  shown && !problem
                    ? {
                        device: platform,
                        title:
                          shown.name ||
                          (platform === "ios" ? "iPhone" : "Android"),
                        detail: shown.authorized ? f.viaUsb : f.bannerUnlock,
                        items: [
                          { value: shown.id.slice(0, 18), label: f.deviceId },
                        ],
                      }
                    : undefined
                }
                checks={failed || missing || unusable ? checks : undefined}
                attention={
                  prep?.phase === "awaiting_trust" ||
                  (!!shown && !shown.authorized && !!shown.needsTrust)
                }
                press={
                  // The three buttons light up while the phone waits for them.
                  prep?.phase === "deep_wait" && !prepConfirmed
                }
                screen={
                  problem
                    ? problem
                    : prep?.phase === "awaiting_trust"
                      ? {
                          kind: "trust",
                          title: a.phoneTrustTitle,
                          no: a.phoneTrustNo,
                          yes: a.phoneTrustYes,
                        }
                      : prepConfirmed
                        ? { kind: "confirmed", title: f.deepConfirmedTitle }
                        : prep?.phase === "deep_wait"
                          ? { kind: "lock", subtitle: f.deepWaitTitle }
                          : shown
                            ? {
                                kind: "device",
                                platform,
                                name:
                                  shown.name ||
                                  (platform === "ios" ? "iPhone" : "Android"),
                                status: selected
                                  ? f.bannerReady
                                  : f.bannerUnlock,
                                ready: !!selected,
                              }
                            : {
                                kind: "guide",
                                trust: {
                                  title: a.phoneTrustTitle,
                                  body: f.trustBody,
                                  no: a.phoneTrustNo,
                                  yes: a.phoneTrustYes,
                                },
                                dev: {
                                  title: f.devTitle,
                                  main: f.devMain,
                                  section: f.devSection,
                                  usb: f.devUsb,
                                  hint: f.devUsbHint,
                                },
                                aside: {
                                  ios: f.asideIos,
                                  android: f.asideAndroid,
                                },
                              }
                }
              />
            );
          })()}
          <div className="console-copy">
            <ol className="process-steps" aria-label={a.progress}>
              {[a.stepConnect, a.stepCopy, a.stepAnalyze, a.stepReport].map(
                (name, position) => (
                  <li
                    key={name}
                    className={position === 0 ? "current" : ""}
                    aria-current={position === 0 ? "step" : undefined}
                  >
                    <span>{name}</span>
                  </li>
                ),
              )}
            </ol>
            <h1 id="scanner-heading">
              {ready
                ? f.readyTitle
                : missing
                  ? f.notFoundTitle
                  : c.connectTitle}
            </h1>
            <p className="flow-intro lede">
              {!ready
                ? missing
                  ? f.notFoundHelp
                  : f.connectHelp
                : device === "android"
                  ? f.readyAndroid
                  : f.readyIos}
            </p>
            {method === "usb" ? (
              <>
                {devices.length > 1 && (
                  <div className="connected-devices">
                    {devices.map((d) => (
                      <button
                        key={d.platform + d.id}
                        disabled={!(d.authorized || d.needsTrust) || starting}
                        aria-pressed={
                          selected?.id === d.id &&
                          selected?.platform === d.platform
                        }
                        onClick={() => {
                          setSelected(d);
                          setDevice(d.platform as "ios" | "android");
                        }}
                      >
                        <DeviceIcon
                          device={d.platform === "ios" ? "ios" : "android"}
                          size={19}
                        />
                        <span>
                          {d.name ||
                            (d.platform === "ios" ? "iPhone" : "Android")}
                          <small>{d.id}</small>
                        </span>
                        {!d.authorized && <small>{a.unlock}</small>}
                      </button>
                    ))}
                  </div>
                )}
                {androidWait && !androidWait.timedOut ? (
                  <p role="status" className="flow-note">
                    {a.androidAllow}{" "}
                    <span className="wait-left">
                      {waitLeft(androidWait.start, ANDROID_WAIT)}
                    </span>
                  </p>
                ) : androidWait?.timedOut ? (
                  <Notice message={a.androidAllowTimeout}>
                    <button
                      className="quiet-action"
                      disabled={finding}
                      onClick={() => void find("android")}
                    >
                      {f.tryAgain}
                    </button>
                  </Notice>
                ) : (
                  searched &&
                  devices.length > 0 &&
                  !devices.some((d) => d.authorized || d.needsTrust) && (
                    <p role="status" className="flow-note">
                      {a.unlock}
                    </p>
                  )
                )}
                {missing && (
                  <p role="status" className="visually-hidden">
                    {f.notFoundTitle}. {f.notFoundHelp}
                  </p>
                )}
                {caps && !caps.iosUsb && (
                  <p className="capability-note">{c.usbPending}</p>
                )}
              </>
            ) : (
              <div className="evidence-setup">
                <div className="device-options">
                  {(["ios", "android"] as const).map((d) => (
                    <button
                      key={d}
                      aria-pressed={device === d}
                      disabled={starting}
                      onClick={() => {
                        setDevice(d);
                        setEncrypted(false);
                        setPassword("");
                      }}
                    >
                      <DeviceIcon device={d} size={20} />
                      {d === "ios" ? "iPhone" : "Android"}
                    </button>
                  ))}
                </div>
                <button
                  className="evidence-selection"
                  disabled={starting}
                  onClick={choose}
                >
                  <FolderOpen size={18} />
                  {evidence || a.evidence}
                </button>
              </div>
            )}
            {device === "ios" &&
              caps?.mvtIos &&
              (method === "files" || encrypted) && (
                <>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={encrypted}
                      disabled={starting}
                      onChange={(e) => {
                        setEncrypted(e.target.checked);
                        setPassword("");
                      }}
                    />
                    {a.encryptedBackup}
                  </label>
                  {encrypted && (
                    <label className="field">
                      {a.backupPassword}
                      <input
                        type="password"
                        autoComplete="off"
                        maxLength={1024}
                        value={password}
                        disabled={starting}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <small>{a.passwordHelp}</small>
                    </label>
                  )}
                </>
              )}
            {method === "usb" && selected && options.length > 0 && (
              <div
                className="scan-options"
                role="group"
                aria-label={f.optionsLabel}
              >
                {options.map((option) => (
                  <label className="scan-option" key={option.id}>
                    <input
                      type="checkbox"
                      checked={option.checked}
                      disabled={starting}
                      onChange={(event) => option.set(event.target.checked)}
                    />
                    <span className="scan-option-text">
                      <b>
                        {option.title}
                        <span className="scan-option-badge">
                          {f.recommended}
                        </span>
                      </b>
                      {/* Once chosen, the deep check's line becomes its steps. */}
                      {!(option.id === "deep" && option.checked) && (
                        <small>{option.help}</small>
                      )}
                      {option.id === "deep" && option.checked && (
                        <span
                          className={`scan-option-steps ${prepConfirmed ? "is-ready" : ""}`}
                          role="status"
                        >
                          <span>
                            {prep?.phase === "awaiting_trust"
                              ? f.deepTrustHint
                              : prepConfirmed
                                ? f.deepReadyHint
                                : prep?.phase === "deep_wait"
                                  ? f.deepWaitHint
                                  : f.optionDeepSteps}
                          </span>
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="flow-action">
              {/* Asked once, before the search; not again for the same phone. */}
              {(!ready || method === "files") && consentControl}
              {ready ? (
                <button
                  className="primary"
                  disabled={!canStart}
                  onClick={() => void (deepChosen && prep ? begin() : run())}
                >
                  {starting && (
                    <LoaderCircle
                      size={18}
                      className="busy-icon"
                      aria-hidden="true"
                    />
                  )}
                  {method === "files" ? a.run : c.analyze}
                </button>
              ) : (
                <button
                  className="primary"
                  disabled={
                    !consent ||
                    finding ||
                    (!!caps && !caps.androidUsb && !caps.iosUsb)
                  }
                  onClick={() => void find()}
                >
                  {finding && (
                    <LoaderCircle
                      size={18}
                      className="busy-icon"
                      aria-hidden="true"
                    />
                  )}
                  {missing ? f.searchAgain : c.detect}
                </button>
              )}
            </div>
            {finding && (
              <p className="flow-note" role="status">
                {f.searchingHint}
              </p>
            )}
            {caps && method !== "files" && !caps.androidUsb && !caps.iosUsb && (
              <Notice message={a.enginesMissing} />
            )}
            {caps &&
              method === "files" &&
              !(device === "ios" ? caps.mvtIos : caps.mvtAndroid) && (
                <p className="capability-note">{a.noEngines}</p>
              )}
            {!caps && !capError && (
              <p role="status" className="visually-hidden">
                {c.loading}
              </p>
            )}
            {capError && (
              <Notice message={a.capError}>
                <button className="quiet-action" onClick={refresh}>
                  {c.retry}
                </button>
              </Notice>
            )}
            {alerts}
          </div>
        </>
      )}
    </section>
  );
}
