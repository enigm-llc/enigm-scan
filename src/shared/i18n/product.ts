import type { Language } from "./i18n";
type ProductCopy = {
  webShare: string;
  webShared: string;
  offerTitle: string;
  offerBody: string;
  offerAction: string;
  offerDetails: string;
  offerProducts: { name: string; description: string }[];

  title: string;
  intro: string;
  computer: string;
  steps: string[];
  scopeHelp: string;
  connectTitle: string;
  connectHelp: string;
  detect: string;
  files: string;
  analyze: string;
  usbPending: string;
  backupPasswordNeeded: string;
  diskSpaceNeeded: string;
  freeLine: string;
  mobileFinalTitle: string;
  mobileFinalSub: string;
  knownSpyware: string;
  mobileWhat: string;
  mobileStep1: string;
  mobileStep2: string;
  mobileStep3: string;
  review: string;
  noSignals: string;
  insufficient: string;
  partial: string;
  coverage: string;
  close: string;
  rules: string;
  loading: string;
  retry: string;
};
export const productCopy: Record<Language, ProductCopy> = {
  es: {
    backupPasswordNeeded:
      "Tus copias del iPhone están cifradas. Escribe la contraseña de la copia (no la de tu Apple ID) para continuar.",
    diskSpaceNeeded:
      "No queda espacio libre suficiente. Libera espacio en el ordenador y vuelve a empezar.",
    webShare: "Compartir enlace",
    webShared: "Enlace compartido",
    offerTitle: "Ahora, habla en privado",
    offerBody:
      "Mensajería y llamadas privadas de los creadores de Enigm Scan, con entornos dedicados para equipos.",
    offerAction: "Probar Enigm",
    offerDetails: "Todo el ecosistema Enigm",
    offerProducts: [
      {
        name: "Enigm · Enigm Server",
        description:
          "Mensajería y llamadas privadas, con entornos dedicados para tus equipos.",
      },
      {
        name: "Enigm OS · Enigm Link · Enigm Key",
        description:
          "Sistema operativo seguro, entorno USB protegido y llave física de emergencia.",
      },
      {
        name: "Enigm eSIM · Enigm Gateway",
        description:
          "Conectividad móvil y un router diseñado para proteger tu red con VPN cifrada y protección DNS.",
      },
      {
        name: "Enigm Command",
        description:
          "Gestiona tus productos, dispositivos y suscripciones desde un mismo lugar.",
      },
    ],

    title: "Busca señales de spyware.",
    intro:
      "Analiza tu móvil desde el ordenador. Recibe un informe claro, sin subir tus datos.",
    computer: "Tu ordenador",
    steps: ["Descarga", "Conecta", "Revisa"],
    scopeHelp:
      "Lo comparamos con miles de indicadores de spyware conocido. Ningún análisis garantiza al 100 % que nadie te espíe.",
    connectTitle: "Conecta tu móvil",
    connectHelp: "Un cable y la pantalla desbloqueada. Nada más.",
    detect: "Buscar mi móvil",
    files: "Usar una copia existente",
    analyze: "Empezar análisis",
    usbPending:
      "La conexión por cable de iPhone aún no está disponible. Puedes analizar una copia local.",
    review: "Hemos encontrado indicios",
    noSignals: "No hay spyware conocido",
    insufficient: "Faltan datos para concluir",
    partial: "Algunas comprobaciones no se pudieron hacer",
    coverage: "Qué hemos revisado",
    close: "Cerrar aplicación",
    rules: "Reglas verificadas",
    loading: "Preparando…",
    retry: "Reintentar",
    mobileWhat:
      "Enigm Scan busca spyware conocido en tu iPhone o Android desde un ordenador.",
    mobileStep1: "Abre scan.enigm.io en tu PC o Mac",
    mobileStep2: "Conecta tu móvil con un cable",
    mobileStep3: "Recibe tu informe",
    knownSpyware: "spyware conocido",
    mobileFinalTitle: "Continúa en tu PC o Mac.",
    mobileFinalSub: "Abre scan.enigm.io en tu ordenador y conecta el móvil.",
    freeLine: "Gratis, sin cuenta, sin excusas",
  },
  en: {
    backupPasswordNeeded:
      "Your iPhone backups are encrypted. Enter the backup password (not your Apple ID password) to continue.",
    diskSpaceNeeded:
      "Not enough free space. Free up space on your computer and start again.",
    webShare: "Share link",
    webShared: "Link shared",
    offerTitle: "Now, talk in private",
    offerBody:
      "Private messaging and calls from the makers of Enigm Scan, with dedicated environments for teams.",
    offerAction: "Try Enigm",
    offerDetails: "The whole Enigm ecosystem",
    offerProducts: [
      {
        name: "Enigm · Enigm Server",
        description:
          "Private messaging and calls, with dedicated environments for your teams.",
      },
      {
        name: "Enigm OS · Enigm Link · Enigm Key",
        description:
          "A secure operating system, protected USB environment and physical emergency key.",
      },
      {
        name: "Enigm eSIM · Enigm Gateway",
        description:
          "Mobile connectivity and a router designed to protect your network with an encrypted VPN and DNS protection.",
      },
      {
        name: "Enigm Command",
        description:
          "Manage your products, devices and subscriptions in one place.",
      },
    ],

    title: "Look for signs of spyware.",
    intro:
      "Analyze your phone from your computer. Get a clear report without uploading your data.",
    computer: "Your computer",
    steps: ["Download", "Connect", "Review"],
    scopeHelp:
      "We compared it with thousands of known spyware indicators. No scan can guarantee 100% that nobody is spying on you.",
    connectTitle: "Connect your phone",
    connectHelp: "A cable and an unlocked screen. That’s all.",
    detect: "Find my phone",
    files: "Use an existing backup",
    analyze: "Start scan",
    usbPending:
      "iPhone cable acquisition is not available yet. You can analyze a local backup.",
    review: "We found signs",
    noSignals: "No known spyware",
    insufficient: "Not enough data to conclude",
    partial: "Some checks couldn’t be run",
    coverage: "What we checked",
    close: "Close application",
    rules: "Verified rules",
    loading: "Getting ready…",
    retry: "Try again",
    mobileWhat:
      "Enigm Scan looks for known spyware on your iPhone or Android from a computer.",
    mobileStep1: "Open scan.enigm.io on your PC or Mac",
    mobileStep2: "Connect your phone with a cable",
    mobileStep3: "Get your report",
    knownSpyware: "known spyware",
    mobileFinalTitle: "Continue on your PC or Mac.",
    mobileFinalSub:
      "Open scan.enigm.io on your computer and connect your phone.",
    freeLine: "Free, no account, no excuses",
  },
  fr: {
    backupPasswordNeeded:
      "Vos sauvegardes d’iPhone sont chiffrées. Saisissez le mot de passe de la sauvegarde (pas celui de votre identifiant Apple) pour continuer.",
    diskSpaceNeeded:
      "Espace libre insuffisant. Libérez de l’espace sur l’ordinateur et recommencez.",
    webShare: "Partager le lien",
    webShared: "Lien partagé",
    offerTitle: "Maintenant, parlez en privé",
    offerBody:
      "Messagerie et appels privés par les créateurs d’Enigm Scan, avec des environnements dédiés aux équipes.",
    offerAction: "Essayer Enigm",
    offerDetails: "Tout l’écosystème Enigm",
    offerProducts: [
      {
        name: "Enigm · Enigm Server",
        description:
          "Messagerie et appels privés, avec des environnements dédiés à vos équipes.",
      },
      {
        name: "Enigm OS · Enigm Link · Enigm Key",
        description:
          "Un système d’exploitation sécurisé, un environnement USB protégé et une clé physique d’urgence.",
      },
      {
        name: "Enigm eSIM · Enigm Gateway",
        description:
          "Une connectivité mobile et un routeur conçu pour protéger votre réseau avec un VPN chiffré et une protection DNS.",
      },
      {
        name: "Enigm Command",
        description:
          "Gérez vos produits, appareils et abonnements au même endroit.",
      },
    ],

    title: "Recherchez des signes de spyware.",
    intro:
      "Analysez votre téléphone depuis votre ordinateur. Obtenez un rapport clair, sans envoyer vos données.",
    computer: "Votre ordinateur",
    steps: ["Téléchargez", "Connectez", "Consultez"],
    scopeHelp:
      "Nous l’avons comparé à des milliers d’indicateurs de logiciels espions connus. Aucune analyse ne garantit à 100 % que personne ne vous espionne.",
    connectTitle: "Branchez votre téléphone",
    connectHelp: "Un câble et l’écran déverrouillé. Rien de plus.",
    detect: "Rechercher mon téléphone",
    files: "Utiliser une sauvegarde existante",
    analyze: "Lancer l’analyse",
    usbPending:
      "L’acquisition par câble sur iPhone est indisponible. Vous pouvez analyser une sauvegarde locale.",
    review: "Nous avons trouvé des indices",
    noSignals: "Aucun logiciel espion connu",
    insufficient: "Pas assez de données pour conclure",
    partial: "Certaines vérifications n’ont pas pu être faites",
    coverage: "Ce que nous avons vérifié",
    close: "Fermer l’application",
    rules: "Règles vérifiées",
    loading: "Préparation…",
    retry: "Réessayer",
    mobileWhat:
      "Enigm Scan recherche les logiciels espions connus sur votre iPhone ou Android depuis un ordinateur.",
    mobileStep1: "Ouvrez scan.enigm.io sur votre PC ou Mac",
    mobileStep2: "Branchez votre téléphone avec un câble",
    mobileStep3: "Recevez votre rapport",
    knownSpyware: "logiciel espion connu",
    mobileFinalTitle: "Continuez sur votre PC ou Mac.",
    mobileFinalSub:
      "Ouvrez scan.enigm.io sur votre ordinateur et branchez votre téléphone.",
    freeLine: "Gratuit, sans compte, sans excuses",
  },
  de: {
    backupPasswordNeeded:
      "Ihre iPhone-Backups sind verschlüsselt. Geben Sie das Backup-Passwort ein (nicht Ihr Apple-ID-Passwort), um fortzufahren.",
    diskSpaceNeeded:
      "Nicht genug freier Speicher. Schaffe Platz auf dem Computer und starte neu.",
    webShare: "Link teilen",
    webShared: "Link geteilt",
    offerTitle: "Jetzt privat sprechen",
    offerBody:
      "Private Nachrichten und Anrufe von den Machern von Enigm Scan, mit eigenen Umgebungen für Teams.",
    offerAction: "Enigm ausprobieren",
    offerDetails: "Das gesamte Enigm-Ökosystem",
    offerProducts: [
      {
        name: "Enigm · Enigm Server",
        description:
          "Private Nachrichten und Anrufe mit dedizierten Umgebungen für Ihre Teams.",
      },
      {
        name: "Enigm OS · Enigm Link · Enigm Key",
        description:
          "Ein sicheres Betriebssystem, eine geschützte USB-Umgebung und ein physischer Notfallschlüssel.",
      },
      {
        name: "Enigm eSIM · Enigm Gateway",
        description:
          "Mobilfunk und ein Router zum Schutz Ihres Netzwerks mit verschlüsseltem VPN und DNS-Schutz.",
      },
      {
        name: "Enigm Command",
        description:
          "Verwalten Sie Produkte, Geräte und Abonnements an einem Ort.",
      },
    ],

    title: "Suche nach Spuren von Spyware.",
    intro:
      "Analysieren Sie Ihr Smartphone am Computer. Sie erhalten einen verständlichen Bericht, ohne Ihre Daten hochzuladen.",
    computer: "Ihr Computer",
    steps: ["Herunterladen", "Verbinden", "Prüfen"],
    scopeHelp:
      "Wir haben es mit Tausenden Indikatoren bekannter Spyware verglichen. Keine Analyse garantiert zu 100 %, dass Sie niemand ausspioniert.",
    connectTitle: "Verbinden Sie Ihr Handy",
    connectHelp: "Ein Kabel und ein entsperrter Bildschirm. Mehr nicht.",
    detect: "Mein Handy suchen",
    files: "Vorhandenes Backup verwenden",
    analyze: "Prüfung starten",
    usbPending:
      "iPhone-Erfassung per Kabel ist noch nicht verfügbar. Eine lokale Sicherung kann analysiert werden.",
    review: "Wir haben Hinweise gefunden",
    noSignals: "Keine bekannte Spyware",
    insufficient: "Zu wenige Daten für ein Ergebnis",
    partial: "Einige Prüfungen waren nicht möglich",
    coverage: "Was wir geprüft haben",
    close: "Anwendung schließen",
    rules: "Verifizierte Regeln",
    loading: "Wird vorbereitet…",
    retry: "Erneut versuchen",
    mobileWhat:
      "Enigm Scan sucht von einem Computer aus nach bekannter Spyware auf Ihrem iPhone oder Android.",
    mobileStep1: "Öffnen Sie scan.enigm.io auf Ihrem PC oder Mac",
    mobileStep2: "Verbinden Sie Ihr Handy per Kabel",
    mobileStep3: "Erhalten Sie Ihren Bericht",
    knownSpyware: "bekannte Spyware",
    mobileFinalTitle: "Weiter am PC oder Mac.",
    mobileFinalSub:
      "Öffnen Sie scan.enigm.io am Computer und verbinden Sie Ihr Handy.",
    freeLine: "Kostenlos, ohne Konto, ohne Ausreden",
  },
  it: {
    backupPasswordNeeded:
      "I backup del tuo iPhone sono cifrati. Inserisci la password del backup (non quella del tuo ID Apple) per continuare.",
    diskSpaceNeeded:
      "Spazio libero insufficiente. Libera spazio sul computer e ricomincia.",
    webShare: "Condividi link",
    webShared: "Link condiviso",
    offerTitle: "Ora parla in privato",
    offerBody:
      "Messaggi e chiamate private dai creatori di Enigm Scan, con ambienti dedicati ai team.",
    offerAction: "Prova Enigm",
    offerDetails: "Tutto l’ecosistema Enigm",
    offerProducts: [
      {
        name: "Enigm · Enigm Server",
        description:
          "Messaggi e chiamate private, con ambienti dedicati ai tuoi team.",
      },
      {
        name: "Enigm OS · Enigm Link · Enigm Key",
        description:
          "Un sistema operativo sicuro, un ambiente USB protetto e una chiave fisica di emergenza.",
      },
      {
        name: "Enigm eSIM · Enigm Gateway",
        description:
          "Connettività mobile e un router progettato per proteggere la rete con VPN cifrata e protezione DNS.",
      },
      {
        name: "Enigm Command",
        description:
          "Gestisci prodotti, dispositivi e abbonamenti in un unico posto.",
      },
    ],

    title: "Cerca segnali di spyware.",
    intro:
      "Analizza il telefono dal computer. Ricevi un rapporto chiaro, senza caricare i tuoi dati.",
    computer: "Il tuo computer",
    steps: ["Scarica", "Collega", "Consulta"],
    scopeHelp:
      "Lo abbiamo confrontato con migliaia di indicatori di spyware noti. Nessuna analisi garantisce al 100 % che nessuno ti spii.",
    connectTitle: "Collega il tuo telefono",
    connectHelp: "Un cavo e lo schermo sbloccato. Nient’altro.",
    detect: "Cerca il mio telefono",
    files: "Usa un backup esistente",
    analyze: "Avvia l’analisi",
    usbPending:
      "L’acquisizione via cavo su iPhone non è ancora disponibile. Puoi analizzare un backup locale.",
    review: "Abbiamo trovato indizi",
    noSignals: "Nessuno spyware noto",
    insufficient: "Dati insufficienti per concludere",
    partial: "Alcuni controlli non sono stati possibili",
    coverage: "Cosa abbiamo controllato",
    close: "Chiudi applicazione",
    rules: "Regole verificate",
    loading: "Preparazione…",
    retry: "Riprova",
    mobileWhat:
      "Enigm Scan cerca spyware noti sul tuo iPhone o Android da un computer.",
    mobileStep1: "Apri scan.enigm.io sul tuo PC o Mac",
    mobileStep2: "Collega il telefono con un cavo",
    mobileStep3: "Ricevi il tuo rapporto",
    knownSpyware: "spyware noto",
    mobileFinalTitle: "Continua sul tuo PC o Mac.",
    mobileFinalSub: "Apri scan.enigm.io sul computer e collega il telefono.",
    freeLine: "Gratis, senza account, senza scuse",
  },
  pt: {
    backupPasswordNeeded:
      "As cópias do seu iPhone estão encriptadas. Escreva a palavra-passe da cópia (não a do seu ID Apple) para continuar.",
    diskSpaceNeeded:
      "Espaço livre insuficiente. Liberta espaço no computador e recomeça.",
    webShare: "Partilhar ligação",
    webShared: "Ligação partilhada",
    offerTitle: "Agora, fala em privado",
    offerBody:
      "Mensagens e chamadas privadas dos criadores do Enigm Scan, com ambientes dedicados para equipas.",
    offerAction: "Experimentar o Enigm",
    offerDetails: "Todo o ecossistema Enigm",
    offerProducts: [
      {
        name: "Enigm · Enigm Server",
        description:
          "Mensagens e chamadas privadas, com ambientes dedicados às suas equipas.",
      },
      {
        name: "Enigm OS · Enigm Link · Enigm Key",
        description:
          "Um sistema operativo seguro, um ambiente USB protegido e uma chave física de emergência.",
      },
      {
        name: "Enigm eSIM · Enigm Gateway",
        description:
          "Conectividade móvel e um router concebido para proteger a rede com VPN cifrada e proteção DNS.",
      },
      {
        name: "Enigm Command",
        description: "Gere produtos, dispositivos e subscrições num só lugar.",
      },
    ],

    title: "Procura sinais de spyware.",
    intro:
      "Analise o telemóvel no computador. Receba um relatório claro, sem enviar os seus dados.",
    computer: "O seu computador",
    steps: ["Transfere", "Liga", "Revê"],
    scopeHelp:
      "Comparámo-lo com milhares de indicadores de spyware conhecido. Nenhuma análise garante a 100 % que ninguém o espia.",
    connectTitle: "Ligue o seu telemóvel",
    connectHelp: "Um cabo e o ecrã desbloqueado. Mais nada.",
    detect: "Procurar o meu telemóvel",
    files: "Usar uma cópia existente",
    analyze: "Iniciar análise",
    usbPending:
      "A aquisição por cabo no iPhone ainda não está disponível. Podes analisar uma cópia local.",
    review: "Encontrámos indícios",
    noSignals: "Nenhum spyware conhecido",
    insufficient: "Dados insuficientes para concluir",
    partial: "Algumas verificações não foram possíveis",
    coverage: "O que verificámos",
    close: "Fechar aplicação",
    rules: "Regras verificadas",
    loading: "A preparar…",
    retry: "Tentar novamente",
    mobileWhat:
      "O Enigm Scan procura spyware conhecido no seu iPhone ou Android a partir de um computador.",
    mobileStep1: "Abra scan.enigm.io no seu PC ou Mac",
    mobileStep2: "Ligue o telemóvel com um cabo",
    mobileStep3: "Receba o seu relatório",
    knownSpyware: "spyware conhecido",
    mobileFinalTitle: "Continue no seu PC ou Mac.",
    mobileFinalSub: "Abra scan.enigm.io no computador e ligue o telemóvel.",
    freeLine: "Grátis, sem conta, sem desculpas",
  },
};
