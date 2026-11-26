import { expect, it } from "vitest";
import { checkDetail, checkName, evidenceText, nativeText } from "./native";
import { ENIGM_QR } from "../../core/enigm-qr";

it("names checks and keeps unknown ones as written", () => {
  expect(checkName("android_app_inventory", "es")).toBe("Apps instaladas");
  expect(checkName("mvt_dumpsys_accessibility", "de")).toBe(
    "MVT · Bedienungshilfen",
  );
  expect(checkName("mvt_unknown_module", "es")).toBe("MVT · unknown_module");
  expect(checkName("something_new", "es")).toBe("something_new");
});

it("carries the numbers over when it translates a detail", () => {
  const detail =
    "214 installed packages (61 user-installed) compared with signed app identifiers; 61 APK files hashed and compared with known malware and stalkerware hashes.";
  expect(checkDetail("android_app_inventory", detail, "es")).toMatch(
    /^214 apps instaladas \(61 no preinstaladas\).*61 archivos/,
  );
  expect(
    checkDetail(
      "local_indicators",
      "4182 files read; 2380441600 bytes examined; 3 x",
      "es",
    ),
  ).toContain("2,4 GB");
  expect(
    checkDetail(
      "android_network_settings",
      "Private DNS is off. A global HTTP proxy is set.",
      "fr",
    ),
  ).toBe("DNS privé désactivé. Un proxy réseau est configuré.");
  expect(checkDetail("local_indicators", "a future format", "es")).toBe(
    "a future format",
  );
});

it("translates app texts and evidence written by Enigm only", () => {
  expect(
    nativeText(
      "Preserve the report and consult a qualified incident responder before modifying the device.",
      "it",
    ),
  ).toMatch(/^Conserva questo rapporto/);
  expect(
    nativeText(
      "Published indicator: 2026-10-20T19:19:29Z. Historical infrastructure may have changed ownership. A match alone does not prove infection.",
      "es",
    ),
  ).toContain("20 de octubre de 2026");
  expect(evidenceText("installed app com.spy.app", "es")).toBe(
    "App instalada: com.spy.app",
  );
  expect(evidenceText("Unrecognised engine text: x", "es")).toBe(
    "Unrecognised engine text: x",
  );
});

it("ships a square QR code", () => {
  expect(ENIGM_QR).toHaveLength(25);
  expect(ENIGM_QR.every((row) => /^[01]{25}$/.test(row))).toBe(true);
});

it("translates the behaviour, integrity and diagnostics texts", () => {
  expect(
    evidenceText(
      "System integrity: the bootloader is unlocked: the system can be modified with physical access",
      "es",
    ),
  ).toBe(
    "Integridad del sistema: el gestor de arranque está desbloqueado: el sistema se puede modificar con acceso físico",
  );
  expect(
    nativeText(
      "If you did not modify this phone, treat it as compromised: stop using it for sensitive communication and have it examined by an expert.",
      "es",
    ),
  ).toMatch(/^Si no modificaste tú este móvil/);
  expect(
    nativeText(
      "Only authorized, accessible artifacts were checked. No findings do not guarantee safety. A match is not a confirmed infection.",
      "de",
    ),
  ).toMatch(/^Nur autorisierte/);
  expect(
    checkDetail(
      "android_behavior",
      "61 apps not pre-installed were checked for spyware behaviour: hidden icons, names imitating system components, special access and sensitive permissions. 0 matched the spyware profile and 2 are listed for review. Read: x. This analysis cannot see apps hidden by a root exploit or a modified system.",
      "es",
    ),
  ).toMatch(/^61 apps no preinstaladas.*0 coinciden.*y 2 quedan/);
});

it("translates common MVT evidence", () => {
  expect(
    evidenceText(
      'Found accessibility service: "com.spy/.Watch" (enabled, bound)',
      "es",
    ),
  ).toBe("Servicio de accesibilidad activo: com.spy/.Watch");
  expect(
    evidenceText(
      '"package_verifier_enable = 0" (disabled APK package verification)',
      "pt",
    ),
  ).toBe(
    "Definição package_verifier_enable = 0 (verificação de pacotes APK desativada)",
  );
});

it("translates what the network analysis writes", () => {
  const es = "es" as const;
  // Check names.
  for (const id of [
    "network_names",
    "network_encrypted_dns",
    "network_periodic_connections",
    "android_background_upload",
  ])
    expect(checkName(id, es)).not.toBe(id);
  // Check details, as the app writes them.
  const details: Array<[string, string, string]> = [
    [
      "network_observation",
      "Observed for 342 seconds (at least 120, longer while the copy ran). Observation completed; a threat that stays quiet meanwhile may not show up.",
      "Red observada durante 342 s",
    ],
    [
      "network_observation",
      "Observed for 61 of at least 120 seconds: the phone ended the capture and it could not be resumed.",
      "el móvil cerró la captura y no se pudo reanudar",
    ],
    [
      "network_observation",
      "Observed for 0 of at least 120 seconds: the capture could not start.",
      "la captura no pudo empezar",
    ],
    [
      "network_names",
      "12 destination names read (0 DNS lookups, 11 TLS server names, 1 HTTP hosts) and compared with known spyware domains.",
      "12 destinos leídos",
    ],
    [
      "network_encrypted_dns",
      "No unencrypted DNS lookups were seen across 9 encrypted connections; iCloud Private Relay is on: destinations were read from the server names of encrypted connections and their addresses.",
      "iCloud Private Relay está activado",
    ],
    [
      "network_periodic_connections",
      "2 destination(s) contacted repeatedly at a steady pace.",
      "2 destinos contactados",
    ],
    [
      "android_background_upload",
      "31 apps sent data in the background; 1 worth reviewing (installed outside the stores or acting like spyware).",
      "31 apps enviaron datos",
    ],
  ];
  for (const [id, detail, expected] of details)
    expect(checkDetail(id, detail, es)).toContain(expected);
  // Limitations and recommendations.
  for (const text of [
    "Captured for at least 120 seconds, and while the copy ran up to 15 minutes, through the selected phone’s authorized USB service. This is a limited observation, not continuous monitoring or proof of no surveillance.",
    "Network coverage is partial: the observation did not reach 120 seconds or could not be verified. The captured traffic is analyzed without implying a complete observation.",
    "IP endpoints, DNS questions and answers, TLS server names and HTTP hosts are decoded. QUIC (HTTP/3) and encrypted Client Hello hide server names, and encrypted DNS, tunnels, IP fragments and missing packets reduce coverage. No exfiltration inference is made.",
    "Review point: the phone contacted this address at a steady pace without ever looking up a name for it, which spyware does to leave no domain behind. Some services also connect by address.",
    "If you do not recognise this destination, find which app uses it and ask an expert to review the phone.",
    "Review point: spyware sends what it collects in the background, but backups and sync do too. The phone counts this since its usage statistics were last reset.",
    "If you do not recognise this app or why it sends so much, uninstall it and ask an expert to review the phone.",
  ])
    expect(nativeText(text, es)).not.toBe(text);
  // Evidence lines.
  expect(
    evidenceText(
      "4 connections to api.example.com (port 443) about every 60 seconds",
      es,
    ),
  ).toBe(
    "4 conexiones a api.example.com (puerto 443) cada 60 segundos aproximadamente",
  );
  expect(evidenceText("com.example.x sent 30 MB in the background", es)).toBe(
    "com.example.x envió 30 MB en segundo plano",
  );
});

it("translates the spyware intelligence texts", () => {
  const es = "es" as const;
  for (const id of ["ios_running_processes", "ios_lockdown_mode"])
    expect(checkName(id, es)).not.toBe(id);
  expect(
    checkDetail(
      "ios_running_processes",
      "212 process(es) were running when the sysdiagnose was created on 2026-11-26T09:12:00Z. Each was checked against signed process and path indicators and for executables running from unusual folders.",
      es,
    ),
  ).toMatch(
    /^212 procesos estaban en ejecución al crearse el sysdiagnose, el 26 de noviembre de 2026\./,
  );
  expect(
    checkDetail(
      "ios_lockdown_mode",
      "Lockdown Mode is off. People at risk of targeted spyware can turn it on in Settings, Privacy & Security.",
      es,
    ),
  ).toContain("Ajustes > Privacidad y seguridad");
  for (const text of [
    "Review point: spyware without servers of its own often reports to such hosts. Few ordinary apps use them, though some home and gaming services do.",
    "Find which app uses this host. If you do not recognise it, ask an expert to review the phone.",
    "Review point: the domain imitates a trusted brand, is a bare address or is on a free service that hides who runs it. Spyware and phishing are often delivered this way, but this alone does not show that the link was opened or that anything was installed.",
    "Review point: jailbreaking an iPhone is sometimes done by its owner. It also removes the protections that keep spyware out and lets it hide from scans like this one.",
  ])
    for (const language of ["es", "fr", "de", "it", "pt"] as const)
      expect(nativeText(text, language)).not.toBe(text);
  const evidence: Array<[string, string]> = [
    [
      "contacted by the phone: panel.duckdns.org: a dynamic DNS name, which follows a home or rented connection (DuckDNS)",
      "contactado por el móvil: panel.duckdns.org: un nombre de DNS dinámico, que sigue a una conexión doméstica o alquilada (DuckDNS)",
    ],
    [
      "contacted by the phone: panel.duckdns.org: a dynamic DNS name, which follows a home or rented connection (DuckDNS), 4 connections (port 443) about every 60 seconds",
      "contactado por el móvil: panel.duckdns.org: un nombre de DNS dinámico, que sigue a una conexión doméstica o alquilada (DuckDNS), 4 conexiones (puerto 443) cada 60 segundos aproximadamente",
    ],
    [
      "A global HTTP proxy is configured: relay.duckdns.org:8080 (a dynamic DNS name, which follows a home or rented connection, DuckDNS)",
      "Hay un proxy de red configurado: relay.duckdns.org:8080 (un nombre de DNS dinámico, que sigue a una conexión doméstica o alquilada, DuckDNS)",
    ],
    [
      "System integrity: the iPhone is jailbroken: programs ran from a jailbreak's folders (/var/jb/usr/sbin/sshd)",
      "Integridad del sistema: el iPhone tiene jailbreak: se ejecutaron programas desde las carpetas de un jailbreak (/var/jb/usr/sbin/sshd)",
    ],
    [
      "x.duckdns.org: link to a dynamic DNS name, which follows a home or rented connection (DuckDNS). Seen 2 time(s) in SMS or iMessage between 2026-11-20T10:00:00Z and 2026-11-21T09:00:00Z, e.g. https://x.duckdns.org/app",
      "x.duckdns.org: enlace a un nombre de DNS dinámico, que sigue a una conexión doméstica o alquilada (DuckDNS). Apariciones: 2, en SMS o iMessage, entre 2026-11-20T10:00:00Z y 2026-11-21T09:00:00Z. Ejemplo: https://x.duckdns.org/app",
    ],
    [
      "apple-id-verify.com: apple-id-verify.com combines the name apple with other words but is not owned by apple. Seen 1 time(s) in WhatsApp, e.g. https://apple-id-verify.com/",
      "apple-id-verify.com: apple-id-verify.com combina el nombre apple con otras palabras, pero no pertenece a apple. Apariciones: 1, en WhatsApp. Ejemplo: https://apple-id-verify.com/",
    ],
    [
      "/private/var/db/com.apple.xpc.roleaccountd.staging/bh: an executable ran from a system database folder, where iOS and App Store apps never run code; delayed 2 reboot(s) in shutdown.log (2026-11-20T10:00:00Z); was running when the sysdiagnose was created",
      "/private/var/db/com.apple.xpc.roleaccountd.staging/bh: se ejecutó un programa desde una carpeta de bases de datos del sistema, donde iOS y las apps de la App Store nunca ejecutan código; reinicios retrasados en shutdown.log: 2 (2026-11-20T10:00:00Z); estaba en ejecución al crearse el sysdiagnose",
    ],
    [
      "com.police.agent: installed from a computer over USB (ADB), not from an app store; accessibility service enabled (can read the screen and typing); used location while not on screen 10 min ago",
      "com.police.agent: instalada desde un ordenador por USB (ADB), no desde una tienda; servicio de accesibilidad activado (puede leer la pantalla y lo que escribes); usó la ubicación sin estar en pantalla hace 10 min",
    ],
  ];
  for (const [english, spanish] of evidence)
    expect(evidenceText(english, es)).toBe(spanish);
  // Every other language of the app has them too, with no English phrase
  // left behind.
  const englishPhrases =
    /contacted by|dynamic DNS name|tunnel that|link to|Seen \d|executable ran|never run code|reboot\(s\)|sysdiagnose was created|installed from a computer|while not on screen| ago\b|about every|jailbroken|jailbreak's|global HTTP proxy/;
  for (const language of ["fr", "de", "it", "pt"] as const) {
    for (const id of ["ios_running_processes", "ios_lockdown_mode"])
      expect(checkName(id, language)).not.toBe(id);
    for (const [english] of evidence)
      expect(evidenceText(english, language)).not.toMatch(englishPhrases);
  }
  // Engine messages that are not Enigm's stay as written.
  expect(evidenceText("Found a file on 2026-11-20, e.g. x", es)).toBe(
    "Found a file on 2026-11-20, e.g. x",
  );
});
