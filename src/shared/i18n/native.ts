import type { Language } from "./i18n";
import { EXTRA_DETAILS, EXTRA_TEXTS, translateFragments } from "./native-extra";

/**
 * The app writes checks, recommendations and limitations in English so
 * the JSON report stays stable across versions. These helpers show them in
 * the reader's language; numbers are carried over from the original text and
 * anything unrecognised is shown as written.
 */
type T = Record<Language, string>;
const LANGS: Language[] = ["es", "en", "fr", "de", "it", "pt"];
const t = (
  es: string,
  en: string,
  fr: string,
  de: string,
  it: string,
  pt: string,
): T => ({ es, en, fr, de, it, pt });

const NAMES: Record<string, T> = {
  evidence_snapshot: t(
    "Copia de las pruebas",
    "Evidence copy",
    "Copie des preuves",
    "Beweiskopie",
    "Copia delle prove",
    "Cópia das provas",
  ),
  local_indicators: t(
    "Comparación de archivos",
    "File comparison",
    "Comparaison des fichiers",
    "Dateiabgleich",
    "Confronto dei file",
    "Comparação de ficheiros",
  ),
  artifact_coverage: t(
    "Cobertura de archivos",
    "File coverage",
    "Couverture des fichiers",
    "Dateiabdeckung",
    "Copertura dei file",
    "Cobertura de ficheiros",
  ),
  android_app_inventory: t(
    "Apps instaladas",
    "Installed apps",
    "Applications installées",
    "Installierte Apps",
    "App installate",
    "Apps instaladas",
  ),
  android_network_snapshot: t(
    "Conexiones abiertas",
    "Open connections",
    "Connexions ouvertes",
    "Offene Verbindungen",
    "Connessioni aperte",
    "Ligações abertas",
  ),
  android_network_settings: t(
    "DNS y proxy",
    "DNS and proxy",
    "DNS et proxy",
    "DNS und Proxy",
    "DNS e proxy",
    "DNS e proxy",
  ),
  android_security_patch: t(
    "Parche de seguridad",
    "Security patch",
    "Correctif de sécurité",
    "Sicherheitspatch",
    "Patch di sicurezza",
    "Patch de segurança",
  ),
  mvt_artifact_analysis: t(
    "Análisis forense (MVT)",
    "Forensic analysis (MVT)",
    "Analyse forensique (MVT)",
    "Forensische Analyse (MVT)",
    "Analisi forense (MVT)",
    "Análise forense (MVT)",
  ),
  mvt_alert_import: t(
    "Alertas forenses (MVT)",
    "Forensic alerts (MVT)",
    "Alertes forensiques (MVT)",
    "Forensische Warnungen (MVT)",
    "Avvisi forensi (MVT)",
    "Alertas forenses (MVT)",
  ),
  mvt_routine_alerts: t(
    "Avisos habituales descartados",
    "Routine alerts set aside",
    "Alertes courantes écartées",
    "Übliche Warnungen ausgeblendet",
    "Avvisi abituali esclusi",
    "Alertas habituais descartados",
  ),
  mvt_alert_limit: t(
    "Límite de alertas",
    "Alert limit",
    "Limite d’alertes",
    "Warnungslimit",
    "Limite di avvisi",
    "Limite de alertas",
  ),
  evidence_correlation: t(
    "Correlación de eventos",
    "Event correlation",
    "Corrélation des événements",
    "Ereigniskorrelation",
    "Correlazione degli eventi",
    "Correlação de eventos",
  ),
  network_observation: t(
    "Observación de red",
    "Network observation",
    "Observation du réseau",
    "Netzwerkbeobachtung",
    "Osservazione della rete",
    "Observação da rede",
  ),
  network_pcap: t(
    "Tráfico de red",
    "Network traffic",
    "Trafic réseau",
    "Netzwerkverkehr",
    "Traffico di rete",
    "Tráfego de rede",
  ),
  network_findings_limit: t(
    "Límite de indicios de red",
    "Network finding limit",
    "Limite des signaux réseau",
    "Limit für Netzwerkhinweise",
    "Limite di indizi di rete",
    "Limite de indícios de rede",
  ),
  media_selection: t(
    "Fotos y vídeos omitidos",
    "Photos and videos skipped",
    "Photos et vidéos ignorées",
    "Fotos und Videos ausgelassen",
    "Foto e video esclusi",
    "Fotos e vídeos omitidos",
  ),
  backup_decryption: t(
    "Copia de seguridad cifrada",
    "Encrypted backup",
    "Sauvegarde chiffrée",
    "Verschlüsseltes Backup",
    "Backup cifrato",
    "Cópia de segurança encriptada",
  ),
  android_behavior: t(
    "Comportamiento de las apps",
    "App behaviour",
    "Comportement des applications",
    "Verhalten der Apps",
    "Comportamento delle app",
    "Comportamento das apps",
  ),
  android_system_integrity: t(
    "Integridad del sistema",
    "System integrity",
    "Intégrité du système",
    "Systemintegrität",
    "Integrità del sistema",
    "Integridade do sistema",
  ),
  enigm_link_and_profile_analysis: t(
    "Enlaces y perfiles",
    "Links and profiles",
    "Liens et profils",
    "Links und Profile",
    "Link e profili",
    "Ligações e perfis",
  ),
  ios_crash_reports: t(
    "Informes de fallos del iPhone",
    "iPhone crash reports",
    "Rapports de plantage de l’iPhone",
    "iPhone-Absturzberichte",
    "Rapporti di arresto dell’iPhone",
    "Relatórios de falhas do iPhone",
  ),
  ios_shutdown_log: t(
    "Registro de apagado del iPhone",
    "iPhone shutdown log",
    "Journal d’arrêt de l’iPhone",
    "iPhone-Ausschaltprotokoll",
    "Log di spegnimento dell’iPhone",
    "Registo de encerramento do iPhone",
  ),
  ios_diagnostics_finding_limit: t(
    "Límite de indicios de diagnóstico",
    "Diagnostics finding limit",
    "Limite des signaux de diagnostic",
    "Limit für Diagnosehinweise",
    "Limite di indizi diagnostici",
    "Limite de indícios de diagnóstico",
  ),
  network_lookalike_domains: t(
    "Dominios que imitan a otros",
    "Look-alike domains",
    "Domaines imitant d’autres",
    "Nachgeahmte Domains",
    "Domini che ne imitano altri",
    "Domínios que imitam outros",
  ),
  finding_limit: t(
    "Límite de indicios",
    "Finding limit",
    "Limite de signaux",
    "Hinweislimit",
    "Limite di indizi",
    "Limite de indícios",
  ),
};

/** MVT modules people can recognise; the rest keep the module name. */
const MODULES: Array<[RegExp, T]> = [
  [
    /accessibility/,
    t(
      "Servicios de accesibilidad",
      "Accessibility services",
      "Services d’accessibilité",
      "Bedienungshilfen",
      "Servizi di accessibilità",
      "Serviços de acessibilidade",
    ),
  ],
  [
    /appops/,
    t(
      "Permisos de las apps",
      "App permissions",
      "Autorisations des applications",
      "App-Berechtigungen",
      "Autorizzazioni delle app",
      "Permissões das apps",
    ),
  ],
  [
    /batterydaily/,
    t(
      "Actualizaciones de apps por día",
      "App updates by day",
      "Mises à jour des applications par jour",
      "App-Updates pro Tag",
      "Aggiornamenti delle app per giorno",
      "Atualizações de apps por dia",
    ),
  ],
  [
    /batteryhistory/,
    t(
      "Historial de actividad de las apps",
      "App activity history",
      "Historique d’activité des applications",
      "Verlauf der App-Aktivität",
      "Cronologia delle attività delle app",
      "Histórico de atividade das apps",
    ),
  ],
  [
    /dbinfo/,
    t(
      "Bases de datos de las apps",
      "App databases",
      "Bases de données des applications",
      "App-Datenbanken",
      "Database delle app",
      "Bases de dados das apps",
    ),
  ],
  [
    /platformcompat/,
    t(
      "Compatibilidad de las apps",
      "App compatibility",
      "Compatibilité des applications",
      "App-Kompatibilität",
      "Compatibilità delle app",
      "Compatibilidade das apps",
    ),
  ],
  [
    /adb/,
    t(
      "Depuración USB (ADB)",
      "USB debugging (ADB)",
      "Débogage USB (ADB)",
      "USB-Debugging (ADB)",
      "Debug USB (ADB)",
      "Depuração USB (ADB)",
    ),
  ],
  [
    /timestamp/,
    t(
      "Fechas del informe de errores",
      "Bug report dates",
      "Dates du rapport de bogue",
      "Daten des Fehlerberichts",
      "Date della segnalazione di bug",
      "Datas do relatório de erros",
    ),
  ],
  [
    /rootbinar/,
    t(
      "Binarios de root",
      "Root binaries",
      "Binaires root",
      "Root-Binärdateien",
      "Binari di root",
      "Binários de root",
    ),
  ],
  [
    /battery/,
    t(
      "Historial de apps",
      "App history",
      "Historique des applications",
      "App-Verlauf",
      "Cronologia delle app",
      "Histórico das apps",
    ),
  ],
  [
    /package/,
    t(
      "Paquetes instalados",
      "Installed packages",
      "Paquets installés",
      "Installierte Pakete",
      "Pacchetti installati",
      "Pacotes instalados",
    ),
  ],
  [
    /setting/,
    t(
      "Ajustes del sistema",
      "System settings",
      "Réglages du système",
      "Systemeinstellungen",
      "Impostazioni di sistema",
      "Definições do sistema",
    ),
  ],
  [
    /getprop|propert/,
    t(
      "Propiedades del sistema",
      "System properties",
      "Propriétés du système",
      "Systemeigenschaften",
      "Proprietà di sistema",
      "Propriedades do sistema",
    ),
  ],
  [
    /tombstone/,
    t(
      "Cierres inesperados",
      "Unexpected crashes",
      "Plantages inattendus",
      "Unerwartete Abstürze",
      "Arresti imprevisti",
      "Falhas inesperadas",
    ),
  ],
  [
    /process/,
    t(
      "Procesos en ejecución",
      "Running processes",
      "Processus en cours",
      "Laufende Prozesse",
      "Processi in esecuzione",
      "Processos em execução",
    ),
  ],
  [
    /mount/,
    t(
      "Particiones del sistema",
      "System partitions",
      "Partitions du système",
      "Systempartitionen",
      "Partizioni di sistema",
      "Partições do sistema",
    ),
  ],
  [
    /receiver/,
    t(
      "Receptores de eventos",
      "Event receivers",
      "Récepteurs d’événements",
      "Ereignisempfänger",
      "Ricevitori di eventi",
      "Recetores de eventos",
    ),
  ],
  [
    /activit/,
    t(
      "Actividades de las apps",
      "App activities",
      "Activités des applications",
      "App-Aktivitäten",
      "Attività delle app",
      "Atividades das apps",
    ),
  ],
  [
    /sms|messag/,
    t(
      "Mensajes",
      "Messages",
      "Messages",
      "Nachrichten",
      "Messaggi",
      "Mensagens",
    ),
  ],
  [
    /safari|chrome|browser|webkit|history/,
    t(
      "Historial del navegador",
      "Browser history",
      "Historique du navigateur",
      "Browserverlauf",
      "Cronologia del browser",
      "Histórico do navegador",
    ),
  ],
  [
    /profile/,
    t(
      "Perfiles de configuración",
      "Configuration profiles",
      "Profils de configuration",
      "Konfigurationsprofile",
      "Profili di configurazione",
      "Perfis de configuração",
    ),
  ],
  [
    /shutdown|log/,
    t(
      "Registros del sistema",
      "System logs",
      "Journaux du système",
      "Systemprotokolle",
      "Log di sistema",
      "Registos do sistema",
    ),
  ],
];
export function moduleLabel(module: string, language: Language) {
  const key = module.toLowerCase().replace(/[^a-z]/g, "");
  const found = MODULES.find(([pattern]) => pattern.test(key));
  return found ? found[1][language] : null;
}

export function checkName(id: string, language: Language) {
  if (NAMES[id]) return NAMES[id][language];
  const module = id.match(/^mvt_(.+)$/)?.[1];
  if (module) return `MVT · ${moduleLabel(module, language) ?? module}`;
  return id;
}

const fmt = (template: string, values: Array<string | number>) =>
  template.replace(/\{(\d)\}/g, (_, i) => String(values[Number(i)] ?? ""));
const num = (value: string, language: Language) =>
  Number(value).toLocaleString(language);
function bytes(value: string, language: Language) {
  const n = Number(value);
  const [size, unit] =
    n >= 1e9
      ? [n / 1e9, "gigabyte"]
      : n >= 1e6
        ? [n / 1e6, "megabyte"]
        : [n / 1e3, "kilobyte"];
  return new Intl.NumberFormat(language, {
    style: "unit",
    unit,
    maximumFractionDigits: 1,
  }).format(size);
}
function day(value: string, language: Language) {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value,
  );
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(language, { dateStyle: "long" });
}

const STATE: Record<string, T> = {
  completed: t(
    "completada",
    "completed",
    "terminée",
    "abgeschlossen",
    "completata",
    "concluída",
  ),
  skipped: t(
    "omitida",
    "skipped",
    "ignorée",
    "übersprungen",
    "saltata",
    "omitida",
  ),
  empty: t(
    "completada, sin datos de este tipo en el móvil",
    "completed, no data of this kind on the phone",
    "terminée, aucune donnée de ce type sur le téléphone",
    "abgeschlossen, keine Daten dieser Art auf dem Smartphone",
    "completata, nessun dato di questo tipo sul telefono",
    "concluída, sem dados deste tipo no telemóvel",
  ),
  none: t(
    "no aplica a estos datos",
    "not applicable to this data",
    "sans objet pour ces données",
    "für diese Daten nicht anwendbar",
    "non applicabile a questi dati",
    "não se aplica a estes dados",
  ),
  failed: t(
    "fallida",
    "failed",
    "échouée",
    "fehlgeschlagen",
    "non riuscita",
    "falhada",
  ),
};

/** [pattern, template per language, how each captured group is shown]. */
type Rule = [RegExp, T, Array<"n" | "b" | "d" | "s" | "raw">?];
const DETAILS: Record<string, Rule[]> = {
  evidence_snapshot: [
    [
      /^(\d+) acquired files checked in place.*?; (\d+) links or special entries removed/s,
      t(
        "Archivos obtenidos del móvil: {0}, revisados en un espacio temporal privado. Enlaces o entradas especiales eliminados antes del análisis: {1}.",
        "Files acquired from the phone: {0}, checked in a private temporary workspace. Links or special entries removed before analysis: {1}.",
        "Fichiers obtenus du téléphone : {0}, vérifiés dans un espace temporaire privé. Liens ou entrées spéciales supprimés avant l’analyse : {1}.",
        "Vom Smartphone übernommene Dateien: {0}, geprüft in einem privaten temporären Bereich. Vor der Analyse entfernte Links oder Sondereinträge: {1}.",
        "File acquisiti dal telefono: {0}, controllati in uno spazio temporaneo privato. Collegamenti o voci speciali rimossi prima dell’analisi: {1}.",
        "Ficheiros obtidos do telemóvel: {0}, verificados num espaço temporário privado. Ligações ou entradas especiais removidas antes da análise: {1}.",
      ),
      ["n", "n"],
    ],
    [
      /^(\d+) authorized files copied to a private parser workspace; (\d+) entries omitted/s,
      t(
        "{0} archivos copiados a un espacio privado de análisis; {1} entradas omitidas. Los originales no se pasaron a los analizadores.",
        "{0} files copied to a private analysis workspace; {1} entries omitted. Originals were not passed to the parsers.",
        "{0} fichiers copiés dans un espace d’analyse privé ; {1} entrées ignorées. Les originaux n’ont pas été transmis aux analyseurs.",
        "{0} Dateien in einen privaten Analysebereich kopiert; {1} Einträge ausgelassen. Die Originale wurden nicht an die Parser übergeben.",
        "{0} file copiati in uno spazio di analisi privato; {1} voci omesse. Gli originali non sono stati passati agli analizzatori.",
        "{0} ficheiros copiados para um espaço de análise privado; {1} entradas omitidas. Os originais não foram passados aos analisadores.",
      ),
      ["n", "n"],
    ],
  ],
  local_indicators: [
    [
      /^(\d+) files read; (\d+) bytes examined; (\d+) /,
      t(
        "{0} archivos leídos ({1}) y comparados con los indicadores firmados; {2} entradas inaccesibles, especiales o fuera de límite omitidas.",
        "{0} files read ({1}) and compared with the signed indicators; {2} inaccessible, special or over-limit entries omitted.",
        "{0} fichiers lus ({1}) et comparés aux indicateurs signés ; {2} entrées inaccessibles, spéciales ou hors limite ignorées.",
        "{0} Dateien gelesen ({1}) und mit den signierten Indikatoren abgeglichen; {2} unzugängliche, spezielle oder über dem Limit liegende Einträge ausgelassen.",
        "{0} file letti ({1}) e confrontati con gli indicatori firmati; {2} voci inaccessibili, speciali o oltre il limite omesse.",
        "{0} ficheiros lidos ({1}) e comparados com os indicadores assinados; {2} entradas inacessíveis, especiais ou acima do limite omitidas.",
      ),
      ["n", "b", "n"],
    ],
  ],
  artifact_coverage: [
    [
      /^Some artifacts were not analyzed/,
      t(
        "Algunos archivos no se analizaron porque superaban los límites de seguridad del análisis.",
        "Some files were not analysed because they exceeded the scan’s safety limits.",
        "Certains fichiers n’ont pas été analysés car ils dépassaient les limites de sécurité de l’analyse.",
        "Einige Dateien wurden nicht analysiert, weil sie die Sicherheitsgrenzen der Analyse überschritten.",
        "Alcuni file non sono stati analizzati perché superavano i limiti di sicurezza dell’analisi.",
        "Alguns ficheiros não foram analisados porque excediam os limites de segurança da análise.",
      ),
    ],
  ],
  android_app_inventory: [
    [
      /^(\d+) installed packages \((\d+) user-installed\).*?(\d+) APK files hashed/s,
      t(
        "{0} apps instaladas ({1} no preinstaladas) comparadas con identificadores de apps espía conocidas; {2} archivos de instalación comparados con las huellas de malware y stalkerware conocidos.",
        "{0} installed apps ({1} not pre-installed) compared with known spy app identifiers; {2} install files compared with the fingerprints of known malware and stalkerware.",
        "{0} applications installées ({1} non préinstallées) comparées aux identifiants d’applications espionnes connues ; {2} fichiers d’installation comparés aux empreintes de malwares et stalkerwares connus.",
        "{0} installierte Apps ({1} nicht vorinstalliert) mit Kennungen bekannter Spionage-Apps abgeglichen; {2} Installationsdateien mit Fingerabdrücken bekannter Malware und Stalkerware verglichen.",
        "{0} app installate ({1} non preinstallate) confrontate con gli identificativi di app spia note; {2} file di installazione confrontati con le impronte di malware e stalkerware noti.",
        "{0} apps instaladas ({1} não pré-instaladas) comparadas com identificadores de apps de espionagem conhecidas; {2} ficheiros de instalação comparados com as impressões de malware e stalkerware conhecidos.",
      ),
      ["n", "n", "n"],
    ],
  ],
  android_network_snapshot: [
    [
      /^Open connections were not reviewed/,
      t(
        "No se revisaron las conexiones abiertas: no se pidió.",
        "Open connections were not reviewed: it was not requested.",
        "Les connexions ouvertes n’ont pas été examinées : ce n’était pas demandé.",
        "Offene Verbindungen wurden nicht geprüft: Dies wurde nicht angefordert.",
        "Le connessioni aperte non sono state controllate: non era stato richiesto.",
        "As ligações abertas não foram verificadas: não foi pedido.",
      ),
    ],
    [
      /^(\d+) public addresses/,
      t(
        "{0} direcciones públicas con conexiones abiertas, comparadas con servidores de spyware y stalkerware conocidos. Refleja solo las conexiones abiertas en ese momento.",
        "{0} public addresses with open connections, compared with known spyware and stalkerware servers. It shows only the connections open at that moment.",
        "{0} adresses publiques avec des connexions ouvertes, comparées aux serveurs de logiciels espions et stalkerwares connus. Seules les connexions ouvertes à ce moment-là apparaissent.",
        "{0} öffentliche Adressen mit offenen Verbindungen, abgeglichen mit Servern bekannter Spyware und Stalkerware. Erfasst nur die in diesem Moment offenen Verbindungen.",
        "{0} indirizzi pubblici con connessioni aperte, confrontati con server di spyware e stalkerware noti. Mostra solo le connessioni aperte in quel momento.",
        "{0} endereços públicos com ligações abertas, comparados com servidores de spyware e stalkerware conhecidos. Mostra apenas as ligações abertas nesse momento.",
      ),
      ["n"],
    ],
  ],
  android_security_patch: [
    [
      /last update: (\d{4}-\d{2}-\d{2})/,
      t(
        "El móvil lleva más de seis meses sin actualizaciones de seguridad (la última es del {0}). Instala la última actualización del sistema: un móvil desactualizado es más fácil de atacar, pero esto no es un indicio de spyware.",
        "The phone has had no security updates for more than six months (the last one is from {0}). Install the latest system update: an outdated phone is easier to attack, but this is not a sign of spyware.",
        "Le téléphone n’a reçu aucune mise à jour de sécurité depuis plus de six mois (la dernière date du {0}). Installez la dernière mise à jour du système : un téléphone obsolète est plus facile à attaquer, mais ce n’est pas un signe de logiciel espion.",
        "Das Smartphone hat seit mehr als sechs Monaten keine Sicherheitsupdates erhalten (das letzte ist vom {0}). Installieren Sie das neueste Systemupdate: Ein veraltetes Gerät ist leichter angreifbar, aber das ist kein Hinweis auf Spyware.",
        "Il telefono non riceve aggiornamenti di sicurezza da oltre sei mesi (l’ultimo è del {0}). Installa l’ultimo aggiornamento di sistema: un telefono non aggiornato è più facile da attaccare, ma non è un segno di spyware.",
        "O telemóvel está há mais de seis meses sem atualizações de segurança (a última é de {0}). Instale a atualização mais recente do sistema: um telemóvel desatualizado é mais fácil de atacar, mas isto não é um indício de spyware.",
      ),
      ["d"],
    ],
  ],
  mvt_alert_import: [
    [
      /^(\d+) alert output files parsed; (\d+) alerts returned/,
      t(
        "{0} módulos de MVT con resultados; {1} alertas en total, antes de separar las habituales.",
        "{0} MVT modules with results; {1} alerts in total, before routine ones are set aside.",
        "{0} modules MVT avec des résultats ; {1} alertes au total, avant d’écarter les alertes courantes.",
        "{0} MVT-Module mit Ergebnissen; insgesamt {1} Warnungen, bevor übliche ausgeblendet werden.",
        "{0} moduli MVT con risultati; {1} avvisi in totale, prima di escludere quelli abituali.",
        "{0} módulos do MVT com resultados; {1} alertas no total, antes de separar as habituais.",
      ),
      ["n", "n"],
    ],
  ],
  mvt_routine_alerts: [
    [
      /^(\d+) MVT heuristics omitted/,
      t(
        "{0} avisos habituales en móviles sin infectar (actualizaciones de apps, servicios del fabricante, apps de tiendas y la propia depuración USB del análisis) no se muestran. Ninguno coincidía con un indicador firmado.",
        "{0} alerts that are common on phones that are not infected (app updates, the manufacturer’s services, store apps and the scan’s own USB debugging) are not shown. None matched a signed indicator.",
        "{0} alertes courantes sur des téléphones sains (mises à jour d’applications, services du fabricant, applications des boutiques et le débogage USB de l’analyse elle-même) ne sont pas affichées. Aucune ne correspondait à un indicateur signé.",
        "{0} auf nicht infizierten Geräten übliche Warnungen (App-Updates, Herstellerdienste, Store-Apps und das USB-Debugging der Analyse selbst) werden nicht angezeigt. Keine entsprach einem signierten Indikator.",
        "{0} avvisi comuni sui telefoni non infetti (aggiornamenti delle app, servizi del produttore, app degli store e il debug USB dell’analisi stessa) non vengono mostrati. Nessuno corrispondeva a un indicatore firmato.",
        "{0} alertas habituais em telemóveis sem infeção (atualizações de apps, serviços do fabricante, apps de lojas e a própria depuração USB da análise) não são mostrados. Nenhum correspondia a um indicador assinado.",
      ),
      ["n"],
    ],
  ],
  evidence_correlation: [
    [
      /^(\d+) distinct/,
      t(
        "{0} pares de eventos del móvil y de la red comparten un indicador firmado con menos de cinco minutos de diferencia. Que no haya correlación no descarta el spyware.",
        "{0} pairs of phone and network events share a signed indicator less than five minutes apart. No correlation does not rule out spyware.",
        "{0} paires d’événements du téléphone et du réseau partagent un indicateur signé à moins de cinq minutes d’écart. L’absence de corrélation n’exclut pas un logiciel espion.",
        "{0} Paare von Geräte- und Netzwerkereignissen teilen einen signierten Indikator im Abstand von weniger als fünf Minuten. Fehlende Korrelation schließt Spyware nicht aus.",
        "{0} coppie di eventi del telefono e della rete condividono un indicatore firmato a meno di cinque minuti di distanza. L’assenza di correlazione non esclude lo spyware.",
        "{0} pares de eventos do telemóvel e da rede partilham um indicador assinado com menos de cinco minutos de diferença. A ausência de correlação não exclui spyware.",
      ),
      ["n"],
    ],
  ],
  network_observation: [
    [
      /^Observed for ([\d.]+) seconds of the planned 120 seconds\. Observation window completed/,
      t(
        "Red observada durante {0} s de los 120 previstos. Una amenaza inactiva en ese intervalo puede no aparecer.",
        "Network observed for {0} s of the planned 120. A threat that stays quiet during that window may not show up.",
        "Réseau observé pendant {0} s sur les 120 prévues. Une menace inactive pendant cet intervalle peut ne pas apparaître.",
        "Netzwerk {0} s von geplanten 120 beobachtet. Eine in diesem Zeitraum inaktive Bedrohung wird möglicherweise nicht sichtbar.",
        "Rete osservata per {0} s dei 120 previsti. Una minaccia inattiva in quell’intervallo potrebbe non comparire.",
        "Rede observada durante {0} s dos 120 previstos. Uma ameaça inativa nesse intervalo pode não aparecer.",
      ),
      ["s"],
    ],
    [
      /^Observed for ([\d.]+) seconds of the planned 120 seconds/,
      t(
        "Red observada solo {0} s de los 120 previstos: la captura terminó antes o no se pudo verificar su duración.",
        "Network observed for only {0} s of the planned 120: the capture ended early or its length could not be verified.",
        "Réseau observé seulement {0} s sur les 120 prévues : la capture s’est arrêtée plus tôt ou sa durée n’a pas pu être vérifiée.",
        "Netzwerk nur {0} s von geplanten 120 beobachtet: Die Aufzeichnung endete früher oder ihre Dauer ließ sich nicht prüfen.",
        "Rete osservata solo per {0} s dei 120 previsti: la cattura è terminata prima o la sua durata non è verificabile.",
        "Rede observada apenas {0} s dos 120 previstos: a captura terminou antes ou a sua duração não pôde ser verificada.",
      ),
      ["s"],
    ],
  ],
  network_pcap: [
    [
      /^(\d+) device-attributed packets, (\d+) unique bidirectional flows.*?(\d+) packets not decoded/s,
      t(
        "{0} paquetes del móvil y {1} conexiones distintas comparados con servidores de spyware conocidos; {2} paquetes no se pudieron decodificar.",
        "{0} phone packets and {1} distinct connections compared with known spyware servers; {2} packets could not be decoded.",
        "{0} paquets du téléphone et {1} connexions distinctes comparés aux serveurs de logiciels espions connus ; {2} paquets n’ont pas pu être décodés.",
        "{0} Pakete des Geräts und {1} unterschiedliche Verbindungen mit bekannten Spyware-Servern abgeglichen; {2} Pakete konnten nicht dekodiert werden.",
        "{0} pacchetti del telefono e {1} connessioni distinte confrontati con server di spyware noti; {2} pacchetti non decodificabili.",
        "{0} pacotes do telemóvel e {1} ligações distintas comparados com servidores de spyware conhecidos; {2} pacotes não puderam ser descodificados.",
      ),
      ["n", "n", "n"],
    ],
    [
      /^Network observation was not requested/,
      t(
        "No se pidió observar la red o no está disponible para este móvil.",
        "Network observation was not requested or is not available for this phone.",
        "L’observation du réseau n’a pas été demandée ou n’est pas disponible pour ce téléphone.",
        "Die Netzwerkbeobachtung wurde nicht angefordert oder ist für dieses Gerät nicht verfügbar.",
        "L’osservazione della rete non è stata richiesta o non è disponibile per questo telefono.",
        "A observação da rede não foi pedida ou não está disponível para este telemóvel.",
      ),
    ],
  ],
  media_selection: [
    [
      /^(\d+) personal photo\/video/,
      t(
        "{0} fotos y vídeos personales no se guardaron ni se analizaron. Se conservaron la estructura de la copia, las bases de datos y los adjuntos de mensajes y apps.",
        "{0} personal photos and videos were not stored or analysed. The backup structure, databases and message and app attachments were kept.",
        "{0} photos et vidéos personnelles n’ont été ni stockées ni analysées. La structure de la sauvegarde, les bases de données et les pièces jointes ont été conservées.",
        "{0} persönliche Fotos und Videos wurden weder gespeichert noch analysiert. Struktur des Backups, Datenbanken und Anhänge von Nachrichten und Apps blieben erhalten.",
        "{0} foto e video personali non sono stati salvati né analizzati. Sono stati conservati la struttura del backup, i database e gli allegati di messaggi e app.",
        "{0} fotos e vídeos pessoais não foram guardados nem analisados. Mantiveram-se a estrutura da cópia, as bases de dados e os anexos de mensagens e apps.",
      ),
      ["n"],
    ],
  ],
  backup_decryption: [
    [
      /^The selected backup was unlocked locally/,
      t(
        "La copia de seguridad se desbloqueó en tu ordenador con la contraseña indicada. Los datos descifrados no salen de la sesión temporal.",
        "The backup was unlocked on your computer with the password you gave. Decrypted data never leaves the temporary session.",
        "La sauvegarde a été déverrouillée sur votre ordinateur avec le mot de passe indiqué. Les données déchiffrées ne quittent pas la session temporaire.",
        "Das Backup wurde auf Ihrem Computer mit dem angegebenen Passwort entsperrt. Entschlüsselte Daten verlassen die temporäre Sitzung nicht.",
        "Il backup è stato sbloccato sul tuo computer con la password indicata. I dati decifrati non lasciano la sessione temporanea.",
        "A cópia de segurança foi desbloqueada no seu computador com a palavra-passe indicada. Os dados desencriptados não saem da sessão temporária.",
      ),
    ],
  ],
  finding_limit: [
    [
      /./,
      t(
        "Solo se incluyen los primeros 500 indicios.",
        "Only the first 500 findings are included.",
        "Seuls les 500 premiers signaux sont inclus.",
        "Nur die ersten 500 Hinweise sind enthalten.",
        "Sono inclusi solo i primi 500 indizi.",
        "Só são incluídos os primeiros 500 indícios.",
      ),
    ],
  ],
  mvt_alert_limit: [
    [
      /./,
      t(
        "Solo se incluyen los primeros 500 indicios.",
        "Only the first 500 findings are included.",
        "Seuls les 500 premiers signaux sont inclus.",
        "Nur die ersten 500 Hinweise sind enthalten.",
        "Sono inclusi solo i primi 500 indizi.",
        "Só são incluídos os primeiros 500 indícios.",
      ),
    ],
  ],
};
const DNS: Rule[] = [
  [
    /Private DNS uses (\S+), compared/,
    t(
      "DNS privado: {0}, comparado con servidores de spyware conocidos.",
      "Private DNS: {0}, compared with known spyware servers.",
      "DNS privé : {0}, comparé aux serveurs de logiciels espions connus.",
      "Privates DNS: {0}, mit bekannten Spyware-Servern abgeglichen.",
      "DNS privato: {0}, confrontato con server di spyware noti.",
      "DNS privado: {0}, comparado com servidores de spyware conhecidos.",
    ),
    ["raw"],
  ],
  [
    /Private DNS is off\./,
    t(
      "DNS privado desactivado.",
      "Private DNS is off.",
      "DNS privé désactivé.",
      "Privates DNS ist aus.",
      "DNS privato disattivato.",
      "DNS privado desativado.",
    ),
  ],
  [
    /Private DNS is automatic/,
    t(
      "DNS privado automático.",
      "Private DNS is automatic.",
      "DNS privé automatique.",
      "Privates DNS automatisch.",
      "DNS privato automatico.",
      "DNS privado automático.",
    ),
  ],
  [
    /A global HTTP proxy is set\./,
    t(
      "Hay un proxy de red configurado.",
      "A network proxy is set.",
      "Un proxy réseau est configuré.",
      "Ein Netzwerk-Proxy ist eingerichtet.",
      "È configurato un proxy di rete.",
      "Há um proxy de rede configurado.",
    ),
  ],
  [
    /No global HTTP proxy\./,
    t(
      "Sin proxy de red.",
      "No network proxy.",
      "Aucun proxy réseau.",
      "Kein Netzwerk-Proxy.",
      "Nessun proxy di rete.",
      "Sem proxy de rede.",
    ),
  ],
];

function apply(rule: Rule, match: RegExpMatchArray, language: Language) {
  const kinds = rule[2] ?? [];
  const values = match.slice(1).map((value, i) =>
    kinds[i] === "n"
      ? num(value, language)
      : kinds[i] === "b"
        ? bytes(value, language)
        : kinds[i] === "d"
          ? day(value, language)
          : kinds[i] === "s"
            ? Number(value).toLocaleString(language, {
                maximumFractionDigits: 1,
              })
            : value,
  );
  return fmt(rule[1][language], values);
}

export function checkDetail(id: string, detail: string, language: Language) {
  if (id === "android_network_settings") {
    const parts = DNS.map((rule) => {
      const match = detail.match(rule[0]);
      return match ? apply(rule, match, language) : null;
    }).filter(Boolean);
    return parts.length ? parts.join(" ") : detail;
  }
  if (id.startsWith("mvt_") && !NAMES[id]) {
    const match = detail.match(
      /^Extraction: (\w+); indicator matching: (\w+)\./,
    );
    if (match) {
      const state = (s: string) => STATE[s]?.[language] ?? s;
      return fmt(
        t(
          "Extracción: {0}. Comparación con indicadores: {1}.",
          "Extraction: {0}. Indicator matching: {1}.",
          "Extraction : {0}. Comparaison aux indicateurs : {1}.",
          "Extraktion: {0}. Indikatorabgleich: {1}.",
          "Estrazione: {0}. Confronto con gli indicatori: {1}.",
          "Extração: {0}. Comparação com indicadores: {1}.",
        )[language],
        [state(match[1]), state(match[2])],
      );
    }
  }
  for (const rule of DETAILS[id] ?? []) {
    const match = detail.match(rule[0]);
    if (match) return apply(rule, match, language);
  }
  for (const [pattern, tr] of EXTRA_DETAILS[id] ?? []) {
    const match = detail.match(pattern);
    if (match)
      return fmt(
        tr[language],
        match.slice(1).map((v) => (/^\d+$/.test(v) ? num(v, language) : v)),
      );
  }
  return detail;
}

/** Recommendations and limitations written by the app. */
const TEXTS: Rule[] = [
  [
    /^Preserve the report and consult a qualified incident responder before modifying the device\.$/,
    t(
      "Conserva este informe y consulta con un especialista en respuesta a incidentes antes de tocar el móvil.",
      "Keep this report and consult a qualified incident responder before changing anything on the phone.",
      "Conservez ce rapport et consultez un spécialiste de la réponse aux incidents avant de modifier le téléphone.",
      "Bewahren Sie diesen Bericht auf und wenden Sie sich an eine Fachperson für Vorfallsreaktion, bevor Sie am Gerät etwas ändern.",
      "Conserva questo rapporto e consulta uno specialista di risposta agli incidenti prima di modificare il telefono.",
      "Guarde este relatório e consulte um especialista em resposta a incidentes antes de alterar o telemóvel.",
    ),
  ],
  [
    /^Preserve the evidence and obtain expert review before taking destructive action\.$/,
    t(
      "Conserva las pruebas y pide una revisión experta antes de borrar o restaurar nada.",
      "Keep the evidence and get an expert review before deleting or restoring anything.",
      "Conservez les preuves et faites-les examiner par un expert avant de supprimer ou de restaurer quoi que ce soit.",
      "Bewahren Sie die Beweise auf und lassen Sie sie prüfen, bevor Sie etwas löschen oder zurücksetzen.",
      "Conserva le prove e chiedi una revisione esperta prima di cancellare o ripristinare qualsiasi cosa.",
      "Guarde as provas e peça uma revisão especializada antes de apagar ou restaurar o que quer que seja.",
    ),
  ],
  [
    /^Check whether you recognise this app or setting\. If you do not, review it with an expert\.$/,
    t(
      "Comprueba si reconoces esta app o este ajuste. Si no, revísalo con un experto.",
      "Check whether you recognise this app or setting. If you don’t, review it with an expert.",
      "Vérifiez si vous reconnaissez cette application ou ce réglage. Sinon, faites-le examiner par un expert.",
      "Prüfen Sie, ob Sie diese App oder Einstellung kennen. Wenn nicht, lassen Sie sie von einer Fachperson prüfen.",
      "Verifica se riconosci questa app o impostazione. In caso contrario, falla esaminare da un esperto.",
      "Confirme se reconhece esta app ou definição. Se não, reveja-a com um especialista.",
    ),
  ],
  [
    /^Check that you recognise every app listed\. Uninstall any you did not install yourself\.$/,
    t(
      "Comprueba que reconoces todas las apps de la lista. Desinstala las que no hayas instalado tú.",
      "Check that you recognise every app listed. Uninstall any you did not install yourself.",
      "Vérifiez que vous reconnaissez chaque application de la liste. Désinstallez celles que vous n’avez pas installées vous-même.",
      "Prüfen Sie, ob Sie jede aufgeführte App kennen. Deinstallieren Sie alle, die Sie nicht selbst installiert haben.",
      "Verifica di riconoscere ogni app dell’elenco. Disinstalla quelle che non hai installato tu.",
      "Confirme que reconhece todas as apps da lista. Desinstale as que não foram instaladas por si.",
    ),
  ],
  [
    /^If you did not set this proxy, remove it in the network settings and review the device with an expert\.$/,
    t(
      "Si no configuraste tú este proxy, quítalo en los ajustes de red y revisa el móvil con un experto.",
      "If you did not set this proxy, remove it in the network settings and have the phone reviewed by an expert.",
      "Si vous n’avez pas configuré ce proxy, supprimez-le dans les réglages réseau et faites examiner le téléphone par un expert.",
      "Wenn Sie diesen Proxy nicht eingerichtet haben, entfernen Sie ihn in den Netzwerkeinstellungen und lassen Sie das Gerät prüfen.",
      "Se non hai impostato tu questo proxy, rimuovilo dalle impostazioni di rete e fai controllare il telefono da un esperto.",
      "Se não configurou este proxy, remova-o nas definições de rede e peça a um especialista que reveja o telemóvel.",
    ),
  ],
  [
    /^Published indicator: (.+?)\. Historical infrastructure may have changed ownership\. A match alone does not prove infection\.$/,
    t(
      "Indicador publicado el {0}. La infraestructura antigua puede haber cambiado de dueño: una coincidencia por sí sola no prueba una infección.",
      "Indicator published on {0}. Old infrastructure may have changed hands: a match alone does not prove infection.",
      "Indicateur publié le {0}. L’ancienne infrastructure peut avoir changé de propriétaire : une correspondance seule ne prouve pas une infection.",
      "Indikator veröffentlicht am {0}. Alte Infrastruktur kann den Besitzer gewechselt haben: Ein Treffer allein beweist keine Infektion.",
      "Indicatore pubblicato il {0}. La vecchia infrastruttura può aver cambiato proprietario: una corrispondenza da sola non prova un’infezione.",
      "Indicador publicado a {0}. A infraestrutura antiga pode ter mudado de dono: uma correspondência por si só não prova uma infeção.",
    ),
    ["d"],
  ],
  [
    /^MVT alert (matching a signed indicator, )?reproduced with its original severity\./,
    t(
      "Alerta de MVT que coincide con un indicador firmado, con su criticidad original. Una coincidencia no confirma por sí sola una infección.",
      "MVT alert matching a signed indicator, with its original severity. A match does not confirm an infection on its own.",
      "Alerte MVT correspondant à un indicateur signé, avec sa criticité d’origine. Une correspondance ne confirme pas à elle seule une infection.",
      "MVT-Warnung, die einem signierten Indikator entspricht, mit ihrer ursprünglichen Schwere. Ein Treffer allein bestätigt keine Infektion.",
      "Avviso MVT corrispondente a un indicatore firmato, con la sua gravità originale. Una corrispondenza da sola non conferma un’infezione.",
      "Alerta do MVT que corresponde a um indicador assinado, com a sua gravidade original. Uma correspondência não confirma por si só uma infeção.",
    ),
  ],
  [
    /^MVT heuristic without a known spyware or stalkerware indicator/,
    t(
      "Aviso de MVT sin indicador de spyware conocido. Señala ajustes o apps que conviene revisar y es habitual en móviles sin infectar.",
      "MVT alert with no known spyware indicator. It points at settings or apps worth reviewing and is common on phones that are not infected.",
      "Alerte MVT sans indicateur de logiciel espion connu. Elle signale des réglages ou des applications à vérifier et est fréquente sur des téléphones sains.",
      "MVT-Warnung ohne bekannten Spyware-Indikator. Sie weist auf prüfenswerte Einstellungen oder Apps hin und ist auf nicht infizierten Geräten häufig.",
      "Avviso MVT senza indicatori di spyware noti. Segnala impostazioni o app da verificare ed è comune su telefoni non infetti.",
      "Alerta do MVT sem indicador de spyware conhecido. Aponta definições ou apps que convém rever e é habitual em telemóveis sem infeção.",
    ),
  ],
  [
    /^Installing outside an app store is common for legitimate apps too/,
    t(
      "Instalar fuera de una tienda también es habitual con apps legítimas. Es un punto a revisar, no un indicio de infección.",
      "Installing outside an app store is common for legitimate apps too. This is a point to review, not a sign of infection.",
      "L’installation hors boutique est aussi courante pour des applications légitimes. C’est un point à vérifier, pas un signe d’infection.",
      "Auch seriöse Apps werden oft außerhalb eines Stores installiert. Das ist ein Prüfpunkt, kein Hinweis auf eine Infektion.",
      "Installare fuori da uno store è comune anche per app legittime. È un punto da verificare, non un segno di infezione.",
      "Instalar fora de uma loja também é habitual em apps legítimas. É um ponto a rever, não um indício de infeção.",
    ),
  ],
  [
    /^Some workplaces configure proxies on purpose/,
    t(
      "Algunas empresas configuran un proxy a propósito, pero el malware también puede usarlo para interceptar el tráfico.",
      "Some workplaces set a proxy on purpose, but malware can also use one to intercept traffic.",
      "Certaines entreprises configurent un proxy volontairement, mais un malware peut aussi s’en servir pour intercepter le trafic.",
      "Manche Arbeitgeber richten bewusst einen Proxy ein, doch auch Malware kann ihn nutzen, um Datenverkehr abzufangen.",
      "Alcune aziende configurano un proxy di proposito, ma anche un malware può usarlo per intercettare il traffico.",
      "Algumas empresas configuram um proxy de propósito, mas o malware também o pode usar para intercetar o tráfego.",
    ),
  ],
  [
    /^Binary artifact interpretation requires MVT/,
    t(
      "Para interpretar archivos binarios hace falta MVT o un analizador compatible: la búsqueda en texto no lee copias cifradas, bases SQLite ni archivos comprimidos.",
      "Binary files need MVT or a compatible parser: plain text search cannot read encrypted backups, SQLite databases or compressed archives.",
      "Les fichiers binaires nécessitent MVT ou un analyseur compatible : la recherche textuelle ne lit pas les sauvegardes chiffrées, les bases SQLite ni les archives compressées.",
      "Binärdateien benötigen MVT oder einen kompatiblen Parser: Die Textsuche liest keine verschlüsselten Backups, SQLite-Datenbanken oder komprimierten Archive.",
      "I file binari richiedono MVT o un analizzatore compatibile: la ricerca testuale non legge backup cifrati, database SQLite né archivi compressi.",
      "Os ficheiros binários precisam do MVT ou de um analisador compatível: a pesquisa de texto não lê cópias encriptadas, bases SQLite nem arquivos comprimidos.",
    ),
  ],
  [
    /^Captured for up to 120 seconds/,
    t(
      "La red se observó un máximo de 120 segundos por el servicio USB autorizado del móvil. Es una observación limitada, no una vigilancia continua ni una prueba de que no haya espionaje.",
      "The network was observed for up to 120 seconds through the phone’s authorised USB service. It is a limited observation, not continuous monitoring or proof that there is no surveillance.",
      "Le réseau a été observé jusqu’à 120 secondes via le service USB autorisé du téléphone. C’est une observation limitée, pas une surveillance continue ni la preuve d’une absence d’espionnage.",
      "Das Netzwerk wurde bis zu 120 Sekunden über den autorisierten USB-Dienst beobachtet. Das ist eine begrenzte Beobachtung, keine Dauerüberwachung und kein Beweis, dass keine Überwachung stattfindet.",
      "La rete è stata osservata fino a 120 secondi tramite il servizio USB autorizzato del telefono. È un’osservazione limitata, non un monitoraggio continuo né una prova di assenza di sorveglianza.",
      "A rede foi observada até 120 segundos através do serviço USB autorizado do telemóvel. É uma observação limitada, não uma monitorização contínua nem prova de que não há vigilância.",
    ),
  ],
  [
    /^Cleanup refers only to the temporary workspace/,
    t(
      "La limpieza se refiere solo al espacio temporal del análisis. Las pruebas que elegiste y los informes descargados se conservan, y el borrado no equivale a un borrado seguro.",
      "Cleanup refers only to the scan’s temporary workspace. Evidence you selected and downloaded reports are kept, and deletion is not secure erasure.",
      "Le nettoyage concerne uniquement l’espace temporaire de l’analyse. Les preuves choisies et les rapports téléchargés sont conservés, et la suppression n’est pas un effacement sécurisé.",
      "Die Bereinigung betrifft nur den temporären Arbeitsbereich. Ausgewählte Beweise und heruntergeladene Berichte bleiben erhalten; Löschen ist kein sicheres Überschreiben.",
      "La pulizia riguarda solo lo spazio temporaneo dell’analisi. Le prove scelte e i rapporti scaricati restano, e l’eliminazione non è una cancellazione sicura.",
      "A limpeza refere-se apenas ao espaço temporário da análise. As provas escolhidas e os relatórios descarregados mantêm-se, e apagar não é um apagamento seguro.",
    ),
  ],
  [
    /^MVT exit success does not prove all artifact modules completed/,
    t(
      "Que MVT termine bien no garantiza que todos sus módulos se completaran: los datos cifrados, ausentes o no compatibles pueden quedar sin analizar.",
      "MVT finishing successfully does not mean every module completed: encrypted, missing or unsupported data may be skipped.",
      "La réussite de MVT ne garantit pas que tous ses modules aient abouti : les données chiffrées, absentes ou non prises en charge peuvent être ignorées.",
      "Ein erfolgreicher MVT-Lauf heißt nicht, dass alle Module abgeschlossen wurden: Verschlüsselte, fehlende oder nicht unterstützte Daten können übersprungen werden.",
      "Il completamento di MVT non garantisce che tutti i moduli siano andati a buon fine: dati cifrati, mancanti o non supportati possono essere saltati.",
      "O MVT terminar bem não garante que todos os módulos foram concluídos: dados encriptados, ausentes ou não suportados podem ficar por analisar.",
    ),
  ],
  [
    /^Network coverage is partial/,
    t(
      "La cobertura de red es parcial: no se completaron ni verificaron los 120 segundos. Se analiza el tráfico capturado sin suponer que la observación fue completa.",
      "Network coverage is partial: the full 120 seconds were not completed or verified. The captured traffic is analysed without assuming a complete observation.",
      "La couverture réseau est partielle : les 120 secondes n’ont pas été complétées ou vérifiées. Le trafic capturé est analysé sans supposer une observation complète.",
      "Die Netzwerkabdeckung ist unvollständig: Die 120 Sekunden wurden nicht abgeschlossen oder geprüft. Der erfasste Verkehr wird ohne Annahme einer vollständigen Beobachtung analysiert.",
      "La copertura di rete è parziale: i 120 secondi non sono stati completati o verificati. Il traffico catturato è analizzato senza supporre un’osservazione completa.",
      "A cobertura da rede é parcial: os 120 segundos não foram concluídos nem verificados. O tráfego capturado é analisado sem assumir uma observação completa.",
    ),
  ],
  [
    /^Only classic PCAP IPv4\/IPv6 IP endpoints and UDP DNS questions are decoded/,
    t(
      "Solo se leen las direcciones IP y las consultas DNS sin cifrar. El DNS o TLS cifrado, los túneles y los paquetes perdidos reducen la cobertura.",
      "Only IP addresses and unencrypted DNS queries are read. Encrypted DNS or TLS, tunnels and lost packets reduce coverage.",
      "Seules les adresses IP et les requêtes DNS non chiffrées sont lues. Le DNS ou TLS chiffré, les tunnels et les paquets perdus réduisent la couverture.",
      "Nur IP-Adressen und unverschlüsselte DNS-Anfragen werden gelesen. Verschlüsseltes DNS oder TLS, Tunnel und verlorene Pakete verringern die Abdeckung.",
      "Vengono letti solo gli indirizzi IP e le richieste DNS non cifrate. DNS o TLS cifrati, tunnel e pacchetti persi riducono la copertura.",
      "Só são lidos os endereços IP e as consultas DNS não encriptadas. DNS ou TLS encriptado, túneis e pacotes perdidos reduzem a cobertura.",
    ),
  ],
  [
    /^Personal photo\/video payloads in recognized library paths/,
    t(
      "Las fotos y vídeos personales de la biblioteca no se guardaron ni se analizaron; sí sus metadatos y los adjuntos que pueden ser relevantes. No es una copia completa del móvil.",
      "Personal photos and videos in the library were not stored or analysed; their metadata and possibly relevant attachments were. This is not a complete backup of the phone.",
      "Les photos et vidéos personnelles de la photothèque n’ont été ni stockées ni analysées ; leurs métadonnées et les pièces jointes pertinentes l’ont été. Ce n’est pas une sauvegarde complète.",
      "Persönliche Fotos und Videos der Mediathek wurden weder gespeichert noch analysiert, wohl aber Metadaten und möglicherweise relevante Anhänge. Kein vollständiges Backup.",
      "Foto e video personali della libreria non sono stati salvati né analizzati; i metadati e gli allegati potenzialmente rilevanti sì. Non è un backup completo.",
      "As fotos e vídeos pessoais da biblioteca não foram guardados nem analisados; os metadados e anexos possivelmente relevantes sim. Não é uma cópia completa.",
    ),
  ],
  [
    /^The evidence copy stopped at a safety limit/,
    t(
      "La copia de las pruebas se detuvo en un límite de seguridad: solo se analizó la parte copiada.",
      "The evidence copy stopped at a safety limit: only the copied part was analysed.",
      "La copie des preuves s’est arrêtée à une limite de sécurité : seule la partie copiée a été analysée.",
      "Die Beweiskopie stoppte an einer Sicherheitsgrenze: Nur der kopierte Teil wurde analysiert.",
      "La copia delle prove si è fermata a un limite di sicurezza: è stata analizzata solo la parte copiata.",
      "A cópia das provas parou num limite de segurança: só a parte copiada foi analisada.",
    ),
  ],
];

export function nativeText(value: string, language: Language) {
  for (const rule of TEXTS) {
    const match = value.match(rule[0]);
    if (match) return apply(rule, match, language);
  }
  for (const [pattern, tr] of EXTRA_TEXTS) {
    const match = value.match(pattern);
    if (match)
      return tr[language].replace(
        /\{(\d)\}/g,
        (_, i) => match[Number(i) + 1] ?? "",
      );
  }
  return value;
}

/** Evidence lines from Enigm and MVT; identifiers are kept exactly. */
const EVIDENCE: Rule[] = [
  [
    /^Found accessibility service:? "?([^"(]+?)"?(?: \([^)]*\))?$/s,
    t(
      "Servicio de accesibilidad activo: {0}",
      "Active accessibility service: {0}",
      "Service d’accessibilité actif : {0}",
      "Aktiver Bedienungshilfen-Dienst: {0}",
      "Servizio di accessibilità attivo: {0}",
      "Serviço de acessibilidade ativo: {0}",
    ),
    ["raw"],
  ],
  [
    /^"(.+?) = (.*)" \((.+)\)$/s,
    t(
      "Ajuste {0} = {1} ({2})",
      "Setting {0} = {1} ({2})",
      "Réglage {0} = {1} ({2})",
      "Einstellung {0} = {1} ({2})",
      "Impostazione {0} = {1} ({2})",
      "Definição {0} = {1} ({2})",
    ),
    ["raw", "raw", "raw"],
  ],
  [
    /^Root binary found: (.+?) \(binary: (.+)\)$/s,
    t(
      "Binario de root encontrado: {0} ({1})",
      "Root binary found: {0} ({1})",
      "Binaire root trouvé : {0} ({1})",
      "Root-Binärdatei gefunden: {0} ({1})",
      "Binario di root trovato: {0} ({1})",
      "Binário de root encontrado: {0} ({1})",
    ),
    ["raw", "raw"],
  ],
  [
    /^Found trusted ADB key for user '(.+?)' with fingerprint '(.+)'$/s,
    t(
      "Clave ADB de confianza para el usuario {0}, huella {1}",
      "Trusted ADB key for user {0}, fingerprint {1}",
      "Clé ADB de confiance pour l’utilisateur {0}, empreinte {1}",
      "Vertrauenswürdiger ADB-Schlüssel für Benutzer {0}, Fingerabdruck {1}",
      "Chiave ADB attendibile per l’utente {0}, impronta {1}",
      "Chave ADB de confiança para o utilizador {0}, impressão {1}",
    ),
    ["raw", "raw"],
  ],
  [
    /^Found an invalid trusted ADB host key: (.+)$/s,
    t(
      "Clave ADB de confianza no válida: {0}",
      "Invalid trusted ADB host key: {0}",
      "Clé ADB de confiance non valide : {0}",
      "Ungültiger vertrauenswürdiger ADB-Schlüssel: {0}",
      "Chiave ADB attendibile non valida: {0}",
      "Chave ADB de confiança inválida: {0}",
    ),
    ["raw"],
  ],
  [
    /^Package '(.+?)' had risky permission '(.+?)' set to '(.+?)' at (.+)$/s,
    t(
      "La app {0} tenía el permiso de riesgo {1} en «{2}» el {3}",
      "App {0} had risky permission {1} set to “{2}” at {3}",
      "L’application {0} avait l’autorisation à risque {1} sur « {2} » le {3}",
      "Die App {0} hatte die riskante Berechtigung {1} auf „{2}“ am {3}",
      "L’app {0} aveva il permesso rischioso {1} impostato su «{2}» il {3}",
      "A app {0} tinha a permissão de risco {1} definida como «{2}» em {3}",
    ),
    ["raw", "raw", "raw", "raw"],
  ],
  [
    /^Suspicious mount options found for (.+?): (.+)$/s,
    t(
      "Opciones de montaje sospechosas en {0}: {1}",
      "Suspicious mount options on {0}: {1}",
      "Options de montage suspectes sur {0} : {1}",
      "Verdächtige Mount-Optionen für {0}: {1}",
      "Opzioni di montaggio sospette su {0}: {1}",
      "Opções de montagem suspeitas em {0}: {1}",
    ),
    ["raw", "raw"],
  ],
  [
    /^installed app (.+)$/s,
    t(
      "App instalada: {0}",
      "Installed app: {0}",
      "Application installée : {0}",
      "Installierte App: {0}",
      "App installata: {0}",
      "App instalada: {0}",
    ),
    ["raw"],
  ],
  [
    /^APK of ([^:]+): (.+)$/s,
    t(
      "Archivo de instalación de {0}: {1}",
      "Install file of {0}: {1}",
      "Fichier d’installation de {0} : {1}",
      "Installationsdatei von {0}: {1}",
      "File di installazione di {0}: {1}",
      "Ficheiro de instalação de {0}: {1}",
    ),
    ["raw", "raw"],
  ],
  [
    /^open network connection: (.+)$/s,
    t(
      "Conexión de red abierta: {0}",
      "Open network connection: {0}",
      "Connexion réseau ouverte : {0}",
      "Offene Netzwerkverbindung: {0}",
      "Connessione di rete aperta: {0}",
      "Ligação de rede aberta: {0}",
    ),
    ["raw"],
  ],
  [
    /^private DNS server: (.+)$/s,
    t(
      "Servidor DNS privado: {0}",
      "Private DNS server: {0}",
      "Serveur DNS privé : {0}",
      "Privater DNS-Server: {0}",
      "Server DNS privato: {0}",
      "Servidor DNS privado: {0}",
    ),
    ["raw"],
  ],
  [
    /^HTTP proxy: (.+)$/s,
    t(
      "Proxy de red: {0}",
      "Network proxy: {0}",
      "Proxy réseau : {0}",
      "Netzwerk-Proxy: {0}",
      "Proxy di rete: {0}",
      "Proxy de rede: {0}",
    ),
    ["raw"],
  ],
  [
    /^(\d+) app\(s\) not installed from a known app store: (.+)$/s,
    t(
      "{0} apps no instaladas desde una tienda conocida: {1}",
      "{0} apps not installed from a known app store: {1}",
      "{0} applications non installées depuis une boutique connue : {1}",
      "{0} Apps nicht aus einem bekannten Store installiert: {1}",
      "{0} app non installate da uno store noto: {1}",
      "{0} apps não instaladas a partir de uma loja conhecida: {1}",
    ),
    ["raw", "raw"],
  ],
  [
    /^A global HTTP proxy is configured: (.+)$/s,
    t(
      "Hay un proxy de red configurado: {0}",
      "A network proxy is set: {0}",
      "Un proxy réseau est configuré : {0}",
      "Ein Netzwerk-Proxy ist eingerichtet: {0}",
      "È configurato un proxy di rete: {0}",
      "Há um proxy de rede configurado: {0}",
    ),
    ["raw"],
  ],
];
export function evidenceText(value: string, language: Language) {
  for (const rule of EVIDENCE) {
    const match = value.match(rule[0]);
    if (match)
      return translateFragments(apply(rule, match, language), language);
  }
  return translateFragments(value, language);
}

export const nativeLanguages = LANGS;
