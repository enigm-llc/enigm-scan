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
