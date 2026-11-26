import type { Language } from "./i18n";
type DeviceErrorCopy = {
  failed: string;
  consent: string;
  permission: string;
  ios: string;
  android: string;
  code: string;
};
export const deviceErrorCopy: Record<Language, DeviceErrorCopy> = {
  es: {
    failed:
      "No hemos podido detectar el móvil. Desbloquéalo, comprueba el cable y vuelve a intentarlo con su tipo de dispositivo.",
    consent:
      "Marca la casilla para confirmar que el móvil es tuyo o que tienes permiso de su dueño, y vuelve a buscarlo.",
    permission:
      "Tu ordenador ve el móvil, pero no tiene permiso para abrirlo por USB. En Linux, instala las reglas de Android para USB (por ejemplo, el paquete android-sdk-platform-tools-common), desconecta y vuelve a conectar el cable, e inténtalo de nuevo.",
    ios: "Reintentar con iPhone",
    android: "Reintentar con Android",
    code: "Código de diagnóstico",
  },
  en: {
    failed:
      "We could not detect the phone. Unlock it, check the cable and retry with its device type.",
    consent:
      "Tick the box to confirm the phone is yours or that you have its owner’s permission, then search again.",
    permission:
      "Your computer sees the phone but isn’t allowed to open it over USB. On Linux, install the Android USB rules (for example, the android-sdk-platform-tools-common package), unplug and replug the cable, and try again.",
    ios: "Retry with iPhone",
    android: "Retry with Android",
    code: "Diagnostic code",
  },
  fr: {
    failed:
      "Le téléphone n’a pas pu être détecté. Déverrouillez-le, vérifiez le câble et réessayez avec son type d’appareil.",
    consent:
      "Cochez la case pour confirmer que le téléphone est à vous ou que son propriétaire vous l’autorise, puis relancez la recherche.",
    permission:
      "Votre ordinateur voit le téléphone mais n’a pas le droit de l’ouvrir en USB. Sous Linux, installez les règles USB Android (par exemple le paquet android-sdk-platform-tools-common), débranchez puis rebranchez le câble et réessayez.",
    ios: "Réessayer avec iPhone",
    android: "Réessayer avec Android",
    code: "Code de diagnostic",
  },
  de: {
    failed:
      "Das Telefon konnte nicht erkannt werden. Entsperren Sie es, prüfen Sie das Kabel und versuchen Sie es mit seinem Gerätetyp erneut.",
    consent:
      "Bestätigen Sie mit dem Kästchen, dass das Smartphone Ihnen gehört oder Sie die Erlaubnis des Eigentümers haben, und suchen Sie erneut.",
    permission:
      "Ihr Computer erkennt das Smartphone, darf es aber nicht über USB öffnen. Installieren Sie unter Linux die Android-USB-Regeln (zum Beispiel das Paket android-sdk-platform-tools-common), stecken Sie das Kabel neu ein und versuchen Sie es erneut.",
    ios: "Mit iPhone erneut versuchen",
    android: "Mit Android erneut versuchen",
    code: "Diagnosecode",
  },
  it: {
    failed:
      "Non è stato possibile rilevare il telefono. Sbloccalo, controlla il cavo e riprova con il suo tipo di dispositivo.",
    consent:
      "Seleziona la casella per confermare che il telefono è tuo o che hai il permesso del proprietario, poi cerca di nuovo.",
    permission:
      "Il computer vede il telefono ma non ha il permesso di aprirlo via USB. Su Linux, installa le regole USB per Android (per esempio il pacchetto android-sdk-platform-tools-common), scollega e ricollega il cavo e riprova.",
    ios: "Riprova con iPhone",
    android: "Riprova con Android",
    code: "Codice diagnostico",
  },
  pt: {
    failed:
      "Não foi possível detetar o telemóvel. Desbloqueie-o, verifique o cabo e tente novamente com o seu tipo de dispositivo.",
    consent:
      "Marque a caixa para confirmar que o telemóvel é seu ou que tem autorização do proprietário e procure de novo.",
    permission:
      "O computador vê o telemóvel, mas não tem permissão para o abrir por USB. No Linux, instale as regras USB do Android (por exemplo, o pacote android-sdk-platform-tools-common), desligue e volte a ligar o cabo e tente novamente.",
    ios: "Tentar com iPhone",
    android: "Tentar com Android",
    code: "Código de diagnóstico",
  },
};
// Only fixed application error identifiers may be displayed, never raw logs/paths.
const allowed = new Set([
  "consent_required",
  "ios_transport_unavailable",
  "ios_startup_timeout",
  "ios_discovery_timeout",
  "device_enumeration_failed",
  "adb_server_failed",
  "adb_server_timeout",
  "adb_port_unavailable",
  "adb_session_expired",
  "engine_start_failed",
  "engine_timeout",
  "engine_failed",
  "engine_integrity_failed",
  "engine_unavailable",
  "engine_not_installed",
  "engine_permissions_invalid",
  "engine_unreadable",
  "engine_wait_failed",
  "engine_pipe_failed",
  "engine_output_limit",
  "state_unavailable",
  "engine_path_invalid",
  "workspace_failed",
  "origin_denied",
  "invalid_request",
  "scan_running",
  "android_usb_permission",
]);
export function deviceErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : error;
  if (typeof message === "string" && allowed.has(message)) return message;
  return "device_detection_failed";
}

/**
 * Scan-failure diagnostics from the app: a fixed lowercase code or
 * `exc:` followed by up to four exception class names. Anything else (free
 * text, paths, messages) is never displayed.
 */
export function diagnosticCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = "[A-Za-z_][A-Za-z0-9_]{0,47}";
  const pattern = new RegExp(
    `^(?:exc:${name}(?:>${name}){0,3}|[a-z][a-z0-9_]{2,47})$`,
  );
  return pattern.test(value) ? value : null;
}
