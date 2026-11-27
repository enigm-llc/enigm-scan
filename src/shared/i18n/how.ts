import type { Language } from "./i18n";

export type HowCopy = {
  title: string;
  intro: string;
  steps: Array<[string, string]>;
  checkTitle: string;
  checks: string[];
  compatTitle: string;
  compat: string[];
  compatHeads: [string, string, string];
  privacyTitle: string;
  faqTitle: string;
  faqSub: string;
  heroTitle: string;
  heroSub: string;
  familiesTitle: string;
  familiesSub: string;
  indicatorsWord: string;
  privacyCards: Array<[string, string]>;
  finalTitle: string;
  finalSub: string;
};

export const howCopy: Record<Language, HowCopy> = {
  es: {
    compatHeads: ["Ordenador", "Móvil", "Cable"],
    heroTitle: "El spyware se esconde bien.",
    heroSub:
      "Sabemos dónde buscarlo. Desde tu ordenador, sin que tus datos salgan de él",
    familiesTitle: "Lo que buscamos",
    familiesSub:
      "Indicadores de Amnistía Internacional, MVT, Echap, ESET y Emerging Threats, verificados y firmados por Enigm, y detección propia de Enigm.",
    indicatorsWord: "indicadores",
    privacyCards: [
      ["En tu ordenador", "La copia y el análisis ocurren en él."],
      ["Sin cuenta", "Ni registro, ni correo, ni tarjeta."],
      ["Fotos fuera", "En iPhone, fotos y vídeos no se copian."],
      ["Código abierto", "Cualquiera puede revisar cómo funciona."],
    ],
    finalTitle: "Sal de dudas hoy.",
    finalSub: "Gratis y sin cuenta. Solo necesitas un cable.",
    title: "Cómo funciona",
    intro: "Tres pasos. Todo ocurre en tu ordenador.",
    steps: [
      [
        "Descarga Enigm Scan",
        "Una pequeña app para Mac, Windows o Linux. Al abrirla, te guía paso a paso.",
      ],
      [
        "Conecta tu móvil",
        "Con un cable y la pantalla desbloqueada. En iPhone acepta «Confiar» e introduce tu código; en Android, activa la depuración USB.",
      ],
      [
        "Recibe tu informe",
        "Tu ordenador busca spyware conocido y comportamientos de espionaje, y te da un informe claro que puedes guardar en PDF.",
      ],
    ],
    checkTitle: "Qué revisamos",
    checks: [
      "Mensajes, iMessage y adjuntos, y los enlaces que contienen.",
      "Historial y datos de navegación.",
      "Apps, procesos y los permisos que usan.",
      "Perfiles de configuración, certificados e integridad del sistema.",
      "Dominios y conexiones, también por DNS privado o proxy.",
      "Registros del iPhone: fallos de apps, apagados y procesos en marcha.",
    ],
    compatTitle: "Compatibilidad",
    compat: [
      "Un Mac o un PC con Windows o Linux.",
      "Analizamos iPhone y móviles Android en busca de spyware.",
      "Un cable USB que transmita datos, no solo carga.",
    ],
    privacyTitle: "Privacidad",
    faqTitle: "Preguntas frecuentes",
    faqSub:
      "Todo lo que necesitas saber antes, durante y después del análisis.",
  },
  en: {
    compatHeads: ["Computer", "Phone", "Cable"],
    heroTitle: "Spyware hides well.",
    heroSub:
      "We know where to look. From your computer, without your data ever leaving it",
    familiesTitle: "What we look for",
    familiesSub:
      "Indicators from Amnesty International, MVT, Echap, ESET and Emerging Threats, verified and signed by Enigm, plus Enigm’s own detection.",
    indicatorsWord: "indicators",
    privacyCards: [
      ["On your computer", "The copy and the analysis happen there."],
      ["No account", "No sign-up, no email, no card."],
      ["Photos stay out", "On iPhone, photos and videos are not copied."],
      ["Open source", "Anyone can check how it works."],
    ],
    finalTitle: "Find out today.",
    finalSub: "Free, no account. All you need is a cable.",
    title: "How it works",
    intro: "Three steps. Everything happens on your computer.",
    steps: [
      [
        "Download Enigm Scan",
        "A small app for Mac, Windows or Linux. Open it and it guides you step by step.",
      ],
      [
        "Connect your phone",
        "With a cable and the screen unlocked. On iPhone, tap “Trust” and enter your passcode; on Android, turn on USB debugging.",
      ],
      [
        "Get your report",
        "Your computer looks for known spyware and spying behaviour, and gives you a clear report you can save as a PDF.",
      ],
    ],
    checkTitle: "What we check",
    checks: [
      "Messages, iMessage and attachments, and the links they contain.",
      "Browsing history and data.",
      "Apps, processes and the permissions they use.",
      "Configuration profiles, certificates and system integrity.",
      "Domains and connections, including private DNS or a proxy.",
      "iPhone logs: app crashes, shutdowns and running processes.",
    ],
    compatTitle: "Compatibility",
    compat: [
      "A Mac or a PC with Windows or Linux.",
      "We scan iPhone and Android phones for spyware.",
      "A USB cable that carries data, not just power.",
    ],
    privacyTitle: "Privacy",
    faqTitle: "Frequently asked questions",
    faqSub: "Everything you need to know before, during and after the scan.",
  },
  fr: {
    compatHeads: ["Ordinateur", "Téléphone", "Câble"],
    heroTitle: "Les logiciels espions se cachent bien.",
    heroSub:
      "Nous savons où les chercher. Depuis votre ordinateur, sans que vos données le quittent",
    familiesTitle: "Ce que nous cherchons",
    familiesSub:
      "Indicateurs d’Amnesty International, MVT, Echap, ESET et Emerging Threats, vérifiés et signés par Enigm, et détection propre à Enigm.",
    indicatorsWord: "indicateurs",
    privacyCards: [
      ["Sur votre ordinateur", "La copie et l’analyse s’y déroulent."],
      ["Sans compte", "Ni inscription, ni e-mail, ni carte."],
      ["Photos exclues", "Sur iPhone, photos et vidéos ne sont pas copiées."],
      ["Open source", "Chacun peut vérifier son fonctionnement."],
    ],
    finalTitle: "Levez le doute aujourd’hui.",
    finalSub: "Gratuit et sans compte. Il suffit d’un câble.",
    title: "Comment ça marche",
    intro: "Trois étapes. Tout se passe sur votre ordinateur.",
    steps: [
      [
        "Téléchargez Enigm Scan",
        "Une petite application pour Mac, Windows ou Linux. Ouvrez-la, elle vous guide pas à pas.",
      ],
      [
        "Branchez votre téléphone",
        "Avec un câble et l’écran déverrouillé. Sur iPhone, touchez « Se fier » et saisissez votre code ; sur Android, activez le débogage USB.",
      ],
      [
        "Recevez votre rapport",
        "Votre ordinateur cherche des logiciels espions connus et des comportements d’espionnage, et vous remet un rapport clair à enregistrer en PDF.",
      ],
    ],
    checkTitle: "Ce que nous vérifions",
    checks: [
      "Messages, iMessage et pièces jointes, et les liens qu’ils contiennent.",
      "Historique et données de navigation.",
      "Applications, processus et autorisations utilisées.",
      "Profils de configuration, certificats et intégrité du système.",
      "Domaines et connexions, y compris via DNS privé ou proxy.",
      "Journaux de l’iPhone : plantages d’applications, arrêts et processus en cours.",
    ],
    compatTitle: "Compatibilité",
    compat: [
      "Un Mac ou un PC sous Windows ou Linux.",
      "Nous analysons les iPhone et les téléphones Android à la recherche de logiciels espions.",
      "Un câble USB qui transmet les données, pas seulement la charge.",
    ],
    privacyTitle: "Confidentialité",
    faqTitle: "Questions fréquentes",
    faqSub: "Tout ce qu’il faut savoir avant, pendant et après l’analyse.",
  },
  de: {
    compatHeads: ["Computer", "Handy", "Kabel"],
    heroTitle: "Spyware versteckt sich gut.",
    heroSub:
      "Wir wissen, wo wir suchen müssen. Von Ihrem Computer aus, ohne dass Ihre Daten ihn verlassen",
    familiesTitle: "Wonach wir suchen",
    familiesSub:
      "Indikatoren von Amnesty International, MVT, Echap, ESET und Emerging Threats, von Enigm geprüft und signiert, dazu Enigms eigene Erkennung.",
    indicatorsWord: "Indikatoren",
    privacyCards: [
      ["Auf Ihrem Computer", "Kopie und Analyse finden dort statt."],
      ["Kein Konto", "Keine Anmeldung, keine E-Mail, keine Karte."],
      [
        "Fotos bleiben draußen",
        "Auf dem iPhone werden Fotos und Videos nicht kopiert.",
      ],
      ["Open Source", "Jeder kann prüfen, wie es funktioniert."],
    ],
    finalTitle: "Gewissheit, heute.",
    finalSub: "Kostenlos, ohne Konto. Sie brauchen nur ein Kabel.",
    title: "So funktioniert es",
    intro: "Drei Schritte. Alles passiert auf Ihrem Computer.",
    steps: [
      [
        "Enigm Scan herunterladen",
        "Eine kleine App für Mac, Windows oder Linux. Öffnen Sie sie, und sie führt Sie Schritt für Schritt.",
      ],
      [
        "Handy verbinden",
        "Mit einem Kabel und entsperrtem Bildschirm. Auf dem iPhone „Vertrauen“ tippen und den Code eingeben; auf Android das USB-Debugging aktivieren.",
      ],
      [
        "Bericht erhalten",
        "Ihr Computer sucht nach bekannter Spyware und Spionageverhalten und erstellt einen klaren Bericht, den Sie als PDF speichern können.",
      ],
    ],
    checkTitle: "Was wir prüfen",
    checks: [
      "Nachrichten, iMessage und Anhängen sowie den enthaltenen Links.",
      "Browserverlauf und -daten.",
      "Apps, Prozessen und ihren Berechtigungen.",
      "Konfigurationsprofilen, Zertifikaten und Systemintegrität.",
      "Domains und Verbindungen, auch über privates DNS oder Proxy.",
      "iPhone-Protokollen: App-Abstürze, Ausschaltvorgänge und laufende Prozesse.",
    ],
    compatTitle: "Kompatibilität",
    compat: [
      "Ein Mac oder ein PC mit Windows oder Linux.",
      "Wir prüfen iPhones und Android-Handys auf Spyware.",
      "Ein USB-Kabel, das Daten überträgt, nicht nur Strom.",
    ],
    privacyTitle: "Datenschutz",
    faqTitle: "Häufige Fragen",
    faqSub: "Alles, was Sie vor, während und nach der Analyse wissen sollten.",
  },
  it: {
    compatHeads: ["Computer", "Telefono", "Cavo"],
    heroTitle: "Lo spyware si nasconde bene.",
    heroSub:
      "Sappiamo dove cercarlo. Dal tuo computer, senza che i tuoi dati lo lascino",
    familiesTitle: "Cosa cerchiamo",
    familiesSub:
      "Indicatori di Amnesty International, MVT, Echap, ESET ed Emerging Threats, verificati e firmati da Enigm, più il rilevamento proprio di Enigm.",
    indicatorsWord: "indicatori",
    privacyCards: [
      ["Sul tuo computer", "Copia e analisi avvengono lì."],
      ["Senza account", "Niente registrazione, email o carta."],
      ["Foto escluse", "Su iPhone foto e video non vengono copiati."],
      ["Open source", "Chiunque può verificare come funziona."],
    ],
    finalTitle: "Togliti il dubbio oggi.",
    finalSub: "Gratis e senza account. Basta un cavo.",
    title: "Come funziona",
    intro: "Tre passaggi. Tutto avviene sul tuo computer.",
    steps: [
      [
        "Scarica Enigm Scan",
        "Una piccola app per Mac, Windows o Linux. Aprila e ti guida passo dopo passo.",
      ],
      [
        "Collega il telefono",
        "Con un cavo e lo schermo sbloccato. Su iPhone tocca «Autorizza» e inserisci il codice; su Android attiva il debug USB.",
      ],
      [
        "Ricevi il rapporto",
        "Il computer cerca spyware noti e comportamenti di spionaggio, e ti dà un rapporto chiaro da salvare in PDF.",
      ],
    ],
    checkTitle: "Cosa controlliamo",
    checks: [
      "Messaggi, iMessage e allegati, e i link che contengono.",
      "Cronologia e dati di navigazione.",
      "App, processi e i permessi che usano.",
      "Profili di configurazione, certificati e integrità del sistema.",
      "Domini e connessioni, anche tramite DNS privato o proxy.",
      "Log dell’iPhone: arresti delle app, spegnimenti e processi in esecuzione.",
    ],
    compatTitle: "Compatibilità",
    compat: [
      "Un Mac o un PC con Windows o Linux.",
      "Analizziamo iPhone e telefoni Android alla ricerca di spyware.",
      "Un cavo USB che trasmetta dati, non solo ricarica.",
    ],
    privacyTitle: "Privacy",
    faqTitle: "Domande frequenti",
    faqSub: "Tutto ciò che serve sapere prima, durante e dopo l’analisi.",
  },
  pt: {
    compatHeads: ["Computador", "Telemóvel", "Cabo"],
    heroTitle: "O spyware esconde-se bem.",
    heroSub:
      "Sabemos onde procurá-lo. A partir do seu computador, sem que os seus dados saiam dele",
    familiesTitle: "O que procuramos",
    familiesSub:
      "Indicadores da Amnistia Internacional, MVT, Echap, ESET e Emerging Threats, verificados e assinados pela Enigm, e deteção própria da Enigm.",
    indicatorsWord: "indicadores",
    privacyCards: [
      ["No seu computador", "A cópia e a análise acontecem nele."],
      ["Sem conta", "Sem registo, e-mail ou cartão."],
      ["Fotos de fora", "No iPhone, fotos e vídeos não são copiados."],
      ["Código aberto", "Qualquer pessoa pode ver como funciona."],
    ],
    finalTitle: "Tire a dúvida hoje.",
    finalSub: "Grátis e sem conta. Só precisa de um cabo.",
    title: "Como funciona",
    intro: "Três passos. Tudo acontece no seu computador.",
    steps: [
      [
        "Descarregue o Enigm Scan",
        "Uma pequena app para Mac, Windows ou Linux. Ao abri-la, guia-o passo a passo.",
      ],
      [
        "Ligue o telemóvel",
        "Com um cabo e o ecrã desbloqueado. No iPhone toque em «Confiar» e introduza o código; no Android, ative a depuração USB.",
      ],
      [
        "Receba o relatório",
        "O computador procura spyware conhecido e comportamentos de espionagem, e dá-lhe um relatório claro que pode guardar em PDF.",
      ],
    ],
    checkTitle: "O que verificamos",
    checks: [
      "Mensagens, iMessage e anexos, e as ligações que contêm.",
      "Histórico e dados de navegação.",
      "Apps, processos e as permissões que usam.",
      "Perfis de configuração, certificados e integridade do sistema.",
      "Domínios e ligações, também por DNS privado ou proxy.",
      "Registos do iPhone: falhas de apps, encerramentos e processos em execução.",
    ],
    compatTitle: "Compatibilidade",
    compat: [
      "Um Mac ou um PC com Windows ou Linux.",
      "Analisamos iPhone e telemóveis Android à procura de spyware.",
      "Um cabo USB que transmita dados, não só carga.",
    ],
    privacyTitle: "Privacidade",
    faqTitle: "Perguntas frequentes",
    faqSub: "Tudo o que precisa de saber antes, durante e depois da análise.",
  },
};
