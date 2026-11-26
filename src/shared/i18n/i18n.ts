import { useState } from "react";
export const languages = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
} as const;
export type Language = keyof typeof languages;
const en = {
  title: "Know what's happening on your phone.",
  subtitle:
    "Scan your device for known spyware indicators, suspicious connections and potential security threats.",
  start: "Start Free Scan",
  desktopRequired: "Continue on a PC or Mac",
  desktopLink: "Address for your computer",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  docs: "Documentation",
  theme: "Appearance",
  language: "Open language list",
  files: "Files analyzed",
  rules: "Detection rules",
  next: "Continue",
  consent: "I own this device or have the explicit consent of its data owner.",
  close: "Close",
  results: "Your report",
  imported: "Imported report · authenticity not verified",
  checks: "Checks completed",
  allChecks: "All checks",
  artifacts: "Files checked",
  network: "Connections",
  limitations: "Coverage and limitations",
  findings: "Signs",
  pdf: "Download PDF",
  pdfCharacters:
    "Characters unavailable in the PDF font or invisible controls are shown as [U+XXXX]. JSON preserves the original text.",
  json: "Download JSON",
  invalid:
    "This file is not a valid Enigm Scan report, exceeds a limit, or contains inconsistent totals.",
  exportError: "The report could not be exported. Try again.",
  completed: "Completed",
  skipped: "Skipped",
  unsupported: "Unsupported",
  failed: "Failed",
  severity: "Severity",
  confidence: "Confidence",
  source: "Source",
  evidence: "Evidence",
  recommendation: "Recommendation",
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  informational: "Informational",
  cleanup: "Cleanup status",
  not_started: "Not started",
  partial: "Partial",
  engines: "Engine versions",
  ruleVersion: "Rule bundle version",
  footer: "Local by design. Clear about its limits.",
  device: "Device",
  summary: "Summary",
  warning: "A sign doesn’t confirm an infection.",
};
export type Copy = typeof en;
const es: Copy = {
  title: "Conoce qué ocurre en tu teléfono.",
  subtitle:
    "Analiza tu dispositivo en busca de indicadores conocidos de spyware, conexiones sospechosas y posibles amenazas.",
  start: "Iniciar análisis gratuito",
  desktopRequired: "Continúa en un PC o Mac",
  desktopLink: "Dirección para tu ordenador",
  copyLink: "Copiar enlace",
  linkCopied: "Enlace copiado",
  docs: "Documentación",
  theme: "Apariencia",
  language: "Abrir lista de idiomas",
  files: "Archivos analizados",
  rules: "Reglas de detección",
  next: "Continuar",
  consent:
    "Soy propietario del dispositivo o tengo el consentimiento explícito de su propietario.",
  close: "Cerrar",
  results: "Tu informe",
  imported: "Informe importado · autenticidad no verificada",
  checks: "Comprobaciones completadas",
  allChecks: "Todas las comprobaciones",
  artifacts: "Archivos revisados",
  network: "Conexiones",
  limitations: "Cobertura y limitaciones",
  findings: "Indicios",
  pdf: "Descargar PDF",
  pdfCharacters:
    "Los caracteres no disponibles en la fuente del PDF o los controles invisibles se muestran como [U+XXXX]. El JSON conserva el texto original.",
  json: "Descargar JSON",
  invalid:
    "El archivo no es un informe válido de Enigm Scan, supera un límite o contiene totales incoherentes.",
  exportError: "No se ha podido exportar el informe. Vuelve a intentarlo.",
  completed: "Completada",
  skipped: "Omitida",
  unsupported: "No compatible",
  failed: "Fallida",
  severity: "Gravedad",
  confidence: "Confianza",
  source: "Fuente",
  evidence: "Evidencia",
  recommendation: "Recomendación",
  critical: "Crítica",
  high: "Alta",
  medium: "Media",
  low: "Baja",
  informational: "Informativa",
  cleanup: "Estado de limpieza",
  not_started: "No iniciada",
  partial: "Parcial",
  engines: "Versiones de motores",
  ruleVersion: "Versión de reglas",
  footer: "Local por diseño. Claro sobre sus límites.",
  device: "Dispositivo",
  summary: "Resumen",
  warning: "Un indicio no confirma una infección.",
};
const fr: Copy = {
  title: "Comprenez ce qui se passe sur votre téléphone.",
  subtitle:
    "Recherchez des indicateurs connus de logiciels espions, des connexions suspectes et des menaces potentielles.",
  start: "Lancer une analyse gratuite",
  desktopRequired: "Continuez sur un PC ou un Mac",
  desktopLink: "Adresse pour votre ordinateur",
  copyLink: "Copier le lien",
  linkCopied: "Lien copié",
  docs: "Documentation",
  theme: "Apparence",
  language: "Ouvrir la liste des langues",
  files: "Fichiers analysés",
  rules: "Règles de détection",
  next: "Continuer",
  consent:
    "Je possède cet appareil ou j’ai le consentement explicite de son propriétaire.",
  close: "Fermer",
  results: "Votre rapport",
  imported: "Rapport importé · authenticité non vérifiée",
  checks: "Vérifications terminées",
  allChecks: "Toutes les vérifications",
  artifacts: "Fichiers vérifiés",
  network: "Connexions",
  limitations: "Couverture et limites",
  findings: "Indices",
  pdf: "Télécharger le PDF",
  pdfCharacters:
    "Les caractères absents de la police PDF ou les contrôles invisibles apparaissent sous la forme [U+XXXX]. Le JSON conserve le texte original.",
  json: "Télécharger le JSON",
  invalid:
    "Ce fichier n’est pas un rapport Enigm Scan valide, dépasse une limite ou contient des totaux incohérents.",
  exportError: "Impossible d’exporter le rapport. Réessayez.",
  completed: "Terminée",
  skipped: "Ignorée",
  unsupported: "Non compatible",
  failed: "Échouée",
  severity: "Gravité",
  confidence: "Confiance",
  source: "Source",
  evidence: "Preuve",
  recommendation: "Recommandation",
  critical: "Critique",
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
  informational: "Information",
  cleanup: "État du nettoyage",
  not_started: "Non commencé",
  partial: "Partiel",
  engines: "Versions des moteurs",
  ruleVersion: "Version des règles",
  footer: "Local par conception. Des limites explicites.",
  device: "Appareil",
  summary: "Résumé",
  warning: "Un indice ne confirme pas une infection.",
};
const de: Copy = {
  title: "Verstehen Sie, was auf Ihrem Telefon passiert.",
  subtitle:
    "Prüfen Sie Ihr Gerät auf bekannte Spyware-Indikatoren, verdächtige Verbindungen und mögliche Bedrohungen.",
  start: "Kostenlose Prüfung starten",
  desktopRequired: "Auf einem PC oder Mac fortfahren",
  desktopLink: "Adresse für Ihren Computer",
  copyLink: "Link kopieren",
  linkCopied: "Link kopiert",
  docs: "Dokumentation",
  theme: "Erscheinungsbild",
  language: "Sprachliste öffnen",
  files: "Analysierte Dateien",
  rules: "Erkennungsregeln",
  next: "Weiter",
  consent:
    "Ich besitze dieses Gerät oder habe die ausdrückliche Zustimmung des Eigentümers.",
  close: "Schließen",
  results: "Ihr Bericht",
  imported: "Importierter Bericht · Echtheit nicht verifiziert",
  checks: "Abgeschlossene Kontrollen",
  allChecks: "Alle Prüfungen",
  artifacts: "Geprüfte Dateien",
  network: "Verbindungen",
  limitations: "Abdeckung und Grenzen",
  findings: "Hinweise",
  pdf: "PDF herunterladen",
  pdfCharacters:
    "In der PDF-Schrift fehlende Zeichen und unsichtbare Steuerzeichen werden als [U+XXXX] angezeigt. JSON bewahrt den Originaltext.",
  json: "JSON herunterladen",
  invalid:
    "Die Datei ist kein gültiger Enigm-Scan-Bericht, überschreitet ein Limit oder enthält widersprüchliche Summen.",
  exportError: "Der Bericht konnte nicht exportiert werden. Erneut versuchen.",
  completed: "Abgeschlossen",
  skipped: "Übersprungen",
  unsupported: "Nicht unterstützt",
  failed: "Fehlgeschlagen",
  severity: "Schweregrad",
  confidence: "Vertrauen",
  source: "Quelle",
  evidence: "Beleg",
  recommendation: "Empfehlung",
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
  informational: "Information",
  cleanup: "Bereinigungsstatus",
  not_started: "Nicht begonnen",
  partial: "Teilweise",
  engines: "Engine-Versionen",
  ruleVersion: "Regelversion",
  footer: "Lokal konzipiert. Klare Grenzen.",
  device: "Gerät",
  summary: "Zusammenfassung",
  warning: "Ein Hinweis bestätigt keine Infektion.",
};
const it: Copy = {
  title: "Scopri cosa succede sul tuo telefono.",
  subtitle:
    "Cerca indicatori noti di spyware, connessioni sospette e potenziali minacce sul tuo dispositivo.",
  start: "Avvia analisi gratuita",
  desktopRequired: "Continua su PC o Mac",
  desktopLink: "Indirizzo per il computer",
  copyLink: "Copia link",
  linkCopied: "Link copiato",
  docs: "Documentazione",
  theme: "Aspetto",
  language: "Apri elenco delle lingue",
  files: "File analizzati",
  rules: "Regole di rilevamento",
  next: "Continua",
  consent:
    "Possiedo il dispositivo o ho il consenso esplicito del proprietario.",
  close: "Chiudi",
  results: "Il tuo rapporto",
  imported: "Rapporto importato · autenticità non verificata",
  checks: "Controlli completati",
  allChecks: "Tutti i controlli",
  artifacts: "File controllati",
  network: "Connessioni",
  limitations: "Copertura e limiti",
  findings: "Indizi",
  pdf: "Scarica PDF",
  pdfCharacters:
    "I caratteri non disponibili nel font PDF o i controlli invisibili sono indicati come [U+XXXX]. Il JSON conserva il testo originale.",
  json: "Scarica JSON",
  invalid:
    "Il file non è un rapporto Enigm Scan valido, supera un limite o contiene totali incoerenti.",
  exportError: "Impossibile esportare il rapporto. Riprova.",
  completed: "Completato",
  skipped: "Saltato",
  unsupported: "Non supportato",
  failed: "Fallito",
  severity: "Gravità",
  confidence: "Confidenza",
  source: "Fonte",
  evidence: "Prova",
  recommendation: "Raccomandazione",
  critical: "Critica",
  high: "Alta",
  medium: "Media",
  low: "Bassa",
  informational: "Informativa",
  cleanup: "Stato pulizia",
  not_started: "Non iniziata",
  partial: "Parziale",
  engines: "Versioni dei motori",
  ruleVersion: "Versione regole",
  footer: "Locale per progetto. Limiti chiari.",
  device: "Dispositivo",
  summary: "Riepilogo",
  warning: "Un indizio non conferma un’infezione.",
};
const pt: Copy = {
  title: "Saiba o que acontece no seu telefone.",
  subtitle:
    "Procure indicadores conhecidos de spyware, ligações suspeitas e potenciais ameaças no seu dispositivo.",
  start: "Iniciar análise gratuita",
  desktopRequired: "Continue num PC ou Mac",
  desktopLink: "Endereço para o computador",
  copyLink: "Copiar ligação",
  linkCopied: "Ligação copiada",
  docs: "Documentação",
  theme: "Aparência",
  language: "Abrir lista de idiomas",
  files: "Ficheiros analisados",
  rules: "Regras de deteção",
  next: "Continuar",
  consent:
    "Sou proprietário do dispositivo ou tenho o consentimento explícito do proprietário.",
  close: "Fechar",
  results: "O seu relatório",
  imported: "Relatório importado · autenticidade não verificada",
  checks: "Verificações concluídas",
  allChecks: "Todas as verificações",
  artifacts: "Ficheiros verificados",
  network: "Ligações",
  limitations: "Cobertura e limitações",
  findings: "Indícios",
  pdf: "Descarregar PDF",
  pdfCharacters:
    "Os caracteres indisponíveis na fonte PDF ou os controlos invisíveis são apresentados como [U+XXXX]. O JSON preserva o texto original.",
  json: "Descarregar JSON",
  invalid:
    "O ficheiro não é um relatório Enigm Scan válido, excede um limite ou contém totais incoerentes.",
  exportError: "Não foi possível exportar o relatório. Tente novamente.",
  completed: "Concluída",
  skipped: "Ignorada",
  unsupported: "Não suportada",
  failed: "Falhou",
  severity: "Gravidade",
  confidence: "Confiança",
  source: "Fonte",
  evidence: "Evidência",
  recommendation: "Recomendação",
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  informational: "Informativa",
  cleanup: "Estado de limpeza",
  not_started: "Não iniciada",
  partial: "Parcial",
  engines: "Versões dos motores",
  ruleVersion: "Versão das regras",
  footer: "Local por conceção. Limites claros.",
  device: "Dispositivo",
  summary: "Resumo",
  warning: "Um indício não confirma uma infeção.",
};
export const dictionaries: Record<Language, Copy> = { en, es, fr, de, it, pt };
export function resolveLanguage(value: string): Language {
  const normalized = value
    .toLowerCase()
    .split(/[-_,;]/)[0]
    .trim();
  const alias =
    normalized === "ge" ? "de" : normalized === "pr" ? "pt" : normalized;
  return Object.hasOwn(languages, alias) ? (alias as Language) : "en";
}
/** First supported language in the browser's preference list, else English. */
export function detectLanguage(): Language {
  const preferred =
    typeof navigator === "undefined"
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  for (const value of preferred) {
    if (!value) continue;
    const code = resolveLanguage(value);
    if (code !== "en" || value.toLowerCase().startsWith("en")) return code;
  }
  return "en";
}
/** The saved choice, or the browser's language. */
export function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem("enigm-scan-language");
    if (saved) return resolveLanguage(saved);
  } catch {}
  return detectLanguage();
}
export function useI18N() {
  const [language, setLanguage] = useState<Language>(() => {
    return initialLanguage();
  });
  return {
    language,
    setLanguage: (value: Language) => {
      setLanguage(value);
      try {
        localStorage.setItem("enigm-scan-language", value);
      } catch {}
    },
    t: dictionaries[language],
  };
}
