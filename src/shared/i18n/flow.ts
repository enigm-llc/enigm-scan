import type { Language } from "./i18n";

/** Copy for the guided journey: get the app, link it, connect the phone. */
export type FlowCopy = {
  /** After the download: open the app. */
  openTitle: string;
  openMac: string;
  openWindows: string;
  openLinux: string;
  openAfter: string;
  /** Optional checks offered before starting, the same way on both phones. */
  optionsLabel: string;
  optionNetwork: string;
  optionNetworkIos: string;
  optionNetworkAndroid: string;
  optionDeep: string;
  optionDeepHelp: string;
  /** Shown under the deep check once chosen: press the buttons before starting. */
  optionDeepSteps: string;
  recommended: string;
  aboutVersion: string;
  aboutBody: string;
  aboutReleased: string;
  scrollMore: string;
  pdfSaved: string;
  /** Short lines for the progress card: what is being done right now. */
  cardCopying: string;
  cardSkipping: string;
  cardWaiting: string;
  cardFinishing: string;
  cardDecrypting: string;
  cardComparing: string;
  cardForensics: string;
  cardNetwork: string;
  cardCleanup: string;
  cardObserving: string;
  cardDeepPreparing: string;
  /** After Trust, before the copy: the owner starts the deep check. */
  deepWaitTitle: string;
  deepWaitHint: string;
  deepConfirmedTitle: string;
  deepConfirmedHint: string;
  deepSkip: string;
  cardDeepReady: string;
  /** Closing the app: everything of the session was deleted. */
  closeNow: string;
  welcomeTitle: string;
  welcomeBody: string;
  welcomeAction: string;
  /** The phone step. */
  connectHelp: string;
  readyIos: string;
  readyAndroid: string;
  readyTitle: string;
  /** Android's own USB debugging prompt, as the phone shows it. */
  trustAndroid: string;
  trustAndroidNow: string;
  usbDebugTitle: string;
  usbDebugBody: string;
  usbDebugAlways: string;
  usbDebugCancel: string;
  usbDebugAllow: string;
  /** The banner shown on the phone once it is detected. */
  bannerReady: string;
  bannerUnlock: string;
  /** What happens after the download, step by step. */
  nextTitle: string;
  viaUsb: string;
  deviceId: string;
  factPercent: string;
  factLeft: string;
  factCopied: string;
  factReceived: string;
  factSigned: string;
  factFiles: string;
  factFile: string;
  factElapsed: string;
  checkTitle: string;
  chkCable: string;
  chkPort: string;
  chkUnlock: string;
  chkAwake: string;
  chkApprove: string;
  chkRetry: string;
  chkApp: string;
  /** Android's Developer options screen, as the phone shows it. */
  devTitle: string;
  devMain: string;
  devSection: string;
  devUsb: string;
  devUsbHint: string;
  /** iPhone's Trust alert body. */
  trustBody: string;
  /** Beside the phone while it is still unknown. */
  asideIos: string;
  asideAndroid: string;
  searchingHint: string;
  problemUnplugged: [string, string];
  problemLocked: [string, string];
  problemTrust: [string, string];
  problemError: [string, string];
  tryAgain: string;
  notFoundTitle: string;
  notFoundHelp: string;
  searchAgain: string;
  downloadAgain: string;
  changeSystem: string;
  next: [string, string, string, string];
};

export const flowCopy: Record<Language, FlowCopy> = {
  es: {
    optionsLabel: "Opciones del análisis",
    optionNetwork: "Revisar también sus conexiones",
    optionNetworkIos:
      "Observa el tráfico del iPhone durante 2 minutos mientras se copia.",
    optionNetworkAndroid:
      "Compara las conexiones abiertas del móvil con servidores de spyware conocidos. No añade espera.",
    optionDeep: "Análisis profundo",
    optionDeepHelp:
      "Revisa el registro de apagado del iPhone. Añade unos 10 minutos.",
    recommended: "Recomendado",
    aboutVersion: "Versión {v}",
    aboutBody: "Detección de spyware para iPhone y Android",
    aboutReleased: "Publicada el {d}",
    scrollMore: "Ver más",
    pdfSaved: "Informe guardado",
    optionDeepSteps:
      "Después de «Confiar» te pediremos pulsar a la vez tres botones del iPhone. La copia empieza cuando el iPhone lo confirme.",
    cardCopying: "Copiando archivos",
    cardSkipping: "Saltando fotos y vídeos",
    cardWaiting: "Esperando más datos del móvil",
    cardFinishing: "Recibiendo los últimos datos",
    cardDecrypting: "Descifrando la copia",
    cardComparing: "Comparando con indicadores de spyware",
    cardForensics: "Revisando registros, mensajes y apps",
    cardNetwork: "Revisando las conexiones",
    cardCleanup: "Borrando los archivos temporales",
    cardObserving: "Observando la red",
    cardDeepPreparing: "El iPhone prepara el análisis profundo",
    deepWaitTitle: "Activa el análisis profundo",
    deepWaitHint:
      "Pulsa a la vez los tres botones marcados en el iPhone y suéltalos al notar la vibración. No los mantengas: llamarías a emergencias.",
    deepConfirmedTitle: "Análisis profundo activado",
    deepConfirmedHint: "El iPhone prepara el registro. Empezamos la copia.",
    deepSkip: "Seguir sin análisis profundo",
    cardDeepReady: "Análisis profundo completo",
    closeNow: "Cerrar",
    welcomeTitle: "Bienvenido a Enigm Scan",
    welcomeBody:
      "Revisa tu iPhone o Android en busca de spyware conocido. Tus datos nunca salen de este ordenador y se borran al cerrar la app.",
    welcomeAction: "Analizar mi móvil",
    openTitle: "Abre Enigm Scan",
    openMac: "Abre el archivo .dmg y haz doble clic en Enigm Scan.",
    openWindows: "Descomprime el archivo .zip y abre Enigm Scan.",
    openLinux: "Da permiso de ejecución al AppImage y ábrelo.",
    openAfter: "Al abrirla, la app te guía paso a paso.",
    connectHelp:
      "Conéctalo al ordenador con un cable USB de datos y deja la pantalla desbloqueada. Si puedes, usa el cable original: algunos cables solo cargan.",
    readyIos:
      "Al empezar, tu iPhone te pedirá «Confiar» y tu código. Después, déjalo conectado hasta el final.",
    readyAndroid:
      "Al empezar, tu móvil te pedirá permitir la depuración USB. Después, déjalo conectado hasta el final.",
    readyTitle: "Todo listo",
    trustAndroid: "Permite la depuración USB",
    trustAndroidNow:
      "Acepta el aviso en la pantalla de tu móvil. Empezamos al instante.",
    usbDebugTitle: "¿Permitir depuración USB?",
    usbDebugBody: "Huella digital de la clave RSA del ordenador:",
    usbDebugAlways: "Permitir siempre desde este ordenador",
    usbDebugCancel: "Cancelar",
    usbDebugAllow: "Permitir",
    bannerReady: "Conectado a tu ordenador",
    bannerUnlock: "Desbloquéalo para continuar",
    downloadAgain: "Volver a descargar",
    changeSystem: "Cambiar",
    notFoundTitle: "Aún no vemos tu móvil",
    notFoundHelp:
      "Revisa que el cable transmita datos y que la pantalla esté desbloqueada. En Android, activa también la depuración USB.",
    searchAgain: "Buscar de nuevo",
    tryAgain: "Reintentar",
    problemUnplugged: ["Cable desconectado", "Vuelve a conectarlo para seguir"],
    problemLocked: ["Móvil bloqueado", "Desbloquéalo para seguir"],
    problemTrust: ["Sin autorización", "Acepta el aviso en el móvil"],
    problemError: ["Algo ha fallado", "Revisa el mensaje en el ordenador"],
    searchingHint:
      "Buscando tu móvil… Si el móvil pide «Permitir depuración USB» o «Confiar», acéptalo.",
    devTitle: "Opciones de desarrollador",
    devMain: "Usar opciones de desarrollador",
    devSection: "Depuración",
    devUsb: "Depuración USB",
    devUsbHint: "Modo de depuración cuando el USB está conectado",
    trustBody:
      "Tus ajustes y datos estarán accesibles desde este ordenador cuando esté conectado.",
    asideIos: "Pulsa «Confiar» y escribe tu código.",
    asideAndroid: "Activa «Depuración USB» en Opciones de desarrollador.",
    checkTitle: "Revisa",
    chkCable: "Un cable USB de datos, no solo de carga",
    chkPort: "Conéctalo directo al ordenador, sin adaptadores",
    chkUnlock: "El móvil desbloqueado",
    chkAwake: "La pantalla encendida hasta que empiece la copia",
    chkApprove: "«Confiar» en iPhone o la depuración USB en Android, aceptados",
    chkRetry: "Si lo rechazaste, desconecta y vuelve a conectar el cable",
    chkApp: "Enigm Scan abierto en tu ordenador",
    viaUsb: "Conectado por USB",
    deviceId: "Identificador",
    factPercent: "copiado",
    factLeft: "restante (estimado)",
    factCopied: "copiados",
    factReceived: "recibidos",
    factSigned: "indicadores firmados",
    factFiles: "archivos revisados",
    factFile: "archivo revisado",
    factElapsed: "transcurrido",
    nextTitle: "Después, sin salir de tu ordenador",
    next: [
      "Conecta el móvil con un cable y acepta su aviso.",
      "Una copia temporal en tu ordenador. Nada sale de él.",
      "Tu ordenador la compara con indicadores de spyware conocido.",
      "Un resultado claro, en PDF si quieres. La copia se borra al terminar.",
    ],
  },
  en: {
    optionsLabel: "Scan options",
    optionNetwork: "Also check its connections",
    optionNetworkIos:
      "Watches the iPhone’s traffic for 2 minutes while it copies.",
    optionNetworkAndroid:
      "Compares the phone’s open connections with known spyware servers. Adds no waiting.",
    optionDeep: "Deep check",
    optionDeepHelp: "Reviews the iPhone’s shutdown log. Adds about 10 minutes.",
    recommended: "Recommended",
    aboutVersion: "Version {v}",
    aboutBody: "Spyware detection for iPhone and Android",
    aboutReleased: "Released {d}",
    scrollMore: "See more",
    pdfSaved: "Report saved",
    optionDeepSteps:
      "After “Trust”, we’ll ask you to press three iPhone buttons at the same time. The copy starts once the iPhone confirms it.",
    cardCopying: "Copying files",
    cardSkipping: "Skipping photos and videos",
    cardWaiting: "Waiting for more data from the phone",
    cardFinishing: "Receiving the last data",
    cardDecrypting: "Decrypting the copy",
    cardComparing: "Comparing with spyware indicators",
    cardForensics: "Reviewing logs, messages and apps",
    cardNetwork: "Reviewing connections",
    cardCleanup: "Deleting the temporary files",
    cardObserving: "Watching the network",
    cardDeepPreparing: "The iPhone is preparing the deep check",
    deepWaitTitle: "Start the deep check",
    deepWaitHint:
      "Press the three marked buttons on the iPhone at the same time and release them when you feel the vibration. Don’t hold them: that calls emergency services.",
    deepConfirmedTitle: "Deep check started",
    deepConfirmedHint: "The iPhone is preparing the log. Starting the copy.",
    deepSkip: "Continue without the deep check",
    cardDeepReady: "Deep check complete",
    closeNow: "Close",
    welcomeTitle: "Welcome to Enigm Scan",
    welcomeBody:
      "Checks your iPhone or Android for known spyware. Your data never leaves this computer and is deleted when you close the app.",
    welcomeAction: "Scan my phone",
    openTitle: "Open Enigm Scan",
    openMac: "Open the .dmg file and double-click Enigm Scan.",
    openWindows: "Unzip the .zip file and open Enigm Scan.",
    openLinux: "Make the AppImage executable and open it.",
    openAfter: "Once it opens, the app guides you step by step.",
    connectHelp:
      "Plug it into the computer with a USB data cable and keep the screen unlocked. Use the original cable if you can: some cables only charge.",
    readyIos:
      "When you start, your iPhone will ask you to “Trust” and for its passcode. Then leave it connected until the end.",
    readyAndroid:
      "When you start, your phone will ask you to allow USB debugging. Then leave it connected until the end.",
    readyTitle: "All set",
    trustAndroid: "Allow USB debugging",
    trustAndroidNow:
      "Accept the prompt on your phone’s screen. We start right away.",
    usbDebugTitle: "Allow USB debugging?",
    usbDebugBody: "The computer’s RSA key fingerprint is:",
    usbDebugAlways: "Always allow from this computer",
    usbDebugCancel: "Cancel",
    usbDebugAllow: "Allow",
    bannerReady: "Connected to your computer",
    bannerUnlock: "Unlock it to continue",
    downloadAgain: "Download again",
    changeSystem: "Change",
    notFoundTitle: "We can’t see your phone yet",
    notFoundHelp:
      "Check that the cable carries data and the screen is unlocked. On Android, also turn on USB debugging.",
    searchAgain: "Search again",
    tryAgain: "Try again",
    problemUnplugged: ["Cable unplugged", "Plug it back in to continue"],
    problemLocked: ["Phone locked", "Unlock it to continue"],
    problemTrust: ["Not authorised", "Accept the prompt on the phone"],
    problemError: ["Something went wrong", "See the message on your computer"],
    searchingHint:
      "Looking for your phone… If the phone asks to “Allow USB debugging” or to “Trust”, accept it.",
    devTitle: "Developer options",
    devMain: "Use developer options",
    devSection: "Debugging",
    devUsb: "USB debugging",
    devUsbHint: "Debug mode when USB is connected",
    trustBody:
      "Your settings and data will be accessible from this computer when connected.",
    asideIos: "Tap “Trust” and enter your passcode.",
    asideAndroid: "Turn on “USB debugging” in Developer options.",
    checkTitle: "Check",
    chkCable: "A USB data cable, not a charge-only one",
    chkPort: "Plugged straight into the computer, no adapters",
    chkUnlock: "The phone unlocked",
    chkAwake: "The screen on until the copy starts",
    chkApprove: "“Trust” on iPhone or USB debugging on Android, accepted",
    chkRetry: "If you declined, unplug and plug the cable back in",
    chkApp: "Enigm Scan open on your computer",
    viaUsb: "Connected over USB",
    deviceId: "Identifier",
    factPercent: "copied",
    factLeft: "left (estimate)",
    factCopied: "copied",
    factReceived: "received",
    factSigned: "signed indicators",
    factFiles: "files checked",
    factFile: "file checked",
    factElapsed: "elapsed",
    nextTitle: "Then, without leaving your computer",
    next: [
      "Plug in the phone with a cable and accept its prompt.",
      "A temporary copy on your computer. Nothing leaves it.",
      "Your computer checks it against known spyware indicators.",
      "A clear result, as a PDF if you like. The copy is deleted at the end.",
    ],
  },
  fr: {
    optionsLabel: "Options de l’analyse",
    optionNetwork: "Vérifier aussi ses connexions",
    optionNetworkIos:
      "Observe le trafic de l’iPhone pendant 2 minutes pendant la copie.",
    optionNetworkAndroid:
      "Compare les connexions ouvertes du téléphone avec des serveurs de logiciels espions connus. Sans attente.",
    optionDeep: "Analyse approfondie",
    optionDeepHelp:
      "Examine le journal d’arrêt de l’iPhone. Comptez environ 10 minutes de plus.",
    recommended: "Recommandé",
    aboutVersion: "Version {v}",
    aboutBody: "Détection de logiciels espions pour iPhone et Android",
    aboutReleased: "Publiée le {d}",
    scrollMore: "Voir plus",
    pdfSaved: "Rapport enregistré",
    optionDeepSteps:
      "Après « Faire confiance », nous vous demanderons d’appuyer en même temps sur trois boutons de l’iPhone. La copie commence dès que l’iPhone le confirme.",
    cardCopying: "Copie des fichiers",
    cardSkipping: "Photos et vidéos ignorées",
    cardWaiting: "En attente de données du téléphone",
    cardFinishing: "Réception des dernières données",
    cardDecrypting: "Déchiffrement de la copie",
    cardComparing: "Comparaison avec les indicateurs de logiciels espions",
    cardForensics: "Examen des journaux, messages et applications",
    cardNetwork: "Examen des connexions",
    cardCleanup: "Suppression des fichiers temporaires",
    cardObserving: "Observation du réseau",
    cardDeepPreparing: "L’iPhone prépare l’analyse approfondie",
    deepWaitTitle: "Lancez l’analyse approfondie",
    deepWaitHint:
      "Appuyez en même temps sur les trois boutons indiqués sur l’iPhone et relâchez-les dès que vous sentez la vibration. Ne les maintenez pas : cela appellerait les secours.",
    deepConfirmedTitle: "Analyse approfondie lancée",
    deepConfirmedHint: "L’iPhone prépare le journal. La copie commence.",
    deepSkip: "Continuer sans l’analyse approfondie",
    cardDeepReady: "Analyse approfondie terminée",
    closeNow: "Fermer",
    welcomeTitle: "Bienvenue dans Enigm Scan",
    welcomeBody:
      "Vérifie si votre iPhone ou Android contient un logiciel espion connu. Vos données ne quittent jamais cet ordinateur et sont effacées à la fermeture de l’app.",
    welcomeAction: "Analyser mon téléphone",
    openTitle: "Ouvrez Enigm Scan",
    openMac: "Ouvrez le fichier .dmg et double-cliquez sur Enigm Scan.",
    openWindows: "Décompressez le fichier .zip et ouvrez Enigm Scan.",
    openLinux: "Rendez l’AppImage exécutable et ouvrez-la.",
    openAfter: "Une fois ouverte, l’app vous guide pas à pas.",
    connectHelp:
      "Branchez-le à l’ordinateur avec un câble USB de données et gardez l’écran déverrouillé. Utilisez si possible le câble d’origine : certains câbles ne font que charger.",
    readyIos:
      "Au démarrage, votre iPhone vous demandera « Se fier » et votre code. Ensuite, laissez-le branché jusqu’à la fin.",
    readyAndroid:
      "Au démarrage, votre téléphone vous demandera d’autoriser le débogage USB. Ensuite, laissez-le branché jusqu’à la fin.",
    readyTitle: "Tout est prêt",
    trustAndroid: "Autorisez le débogage USB",
    trustAndroidNow:
      "Acceptez le message sur l’écran du téléphone. Nous commençons aussitôt.",
    usbDebugTitle: "Autoriser le débogage USB ?",
    usbDebugBody: "Empreinte numérique de la clé RSA de l’ordinateur :",
    usbDebugAlways: "Toujours autoriser sur cet ordinateur",
    usbDebugCancel: "Annuler",
    usbDebugAllow: "Autoriser",
    bannerReady: "Connecté à votre ordinateur",
    bannerUnlock: "Déverrouillez-le pour continuer",
    downloadAgain: "Télécharger à nouveau",
    changeSystem: "Changer",
    notFoundTitle: "Nous ne voyons pas encore votre téléphone",
    notFoundHelp:
      "Vérifiez que le câble transmet des données et que l’écran est déverrouillé. Sur Android, activez aussi le débogage USB.",
    searchAgain: "Rechercher à nouveau",
    tryAgain: "Réessayer",
    problemUnplugged: ["Câble débranché", "Rebranchez-le pour continuer"],
    problemLocked: ["Téléphone verrouillé", "Déverrouillez-le pour continuer"],
    problemTrust: ["Non autorisé", "Acceptez le message sur le téléphone"],
    problemError: [
      "Un problème est survenu",
      "Voir le message sur l’ordinateur",
    ],
    searchingHint:
      "Recherche de votre téléphone… Si le téléphone demande « Autoriser le débogage USB » ou « Se fier », acceptez.",
    devTitle: "Options pour les développeurs",
    devMain: "Utiliser les options pour les développeurs",
    devSection: "Débogage",
    devUsb: "Débogage USB",
    devUsbHint: "Mode débogage lorsqu’un câble USB est connecté",
    trustBody:
      "Vos réglages et données seront accessibles depuis cet ordinateur lorsqu’il est connecté.",
    asideIos: "Touchez « Se fier » et saisissez votre code.",
    asideAndroid:
      "Activez « Débogage USB » dans les options pour les développeurs.",
    checkTitle: "Vérifiez",
    chkCable: "Un câble USB de données, pas seulement de charge",
    chkPort: "Branché directement à l’ordinateur, sans adaptateur",
    chkUnlock: "Le téléphone déverrouillé",
    chkAwake: "L’écran allumé jusqu’au début de la copie",
    chkApprove:
      "« Se fier » sur iPhone ou le débogage USB sur Android, acceptés",
    chkRetry: "Si vous avez refusé, débranchez puis rebranchez le câble",
    chkApp: "Enigm Scan ouvert sur votre ordinateur",
    viaUsb: "Connecté en USB",
    deviceId: "Identifiant",
    factPercent: "copié",
    factLeft: "restant (estimation)",
    factCopied: "copiés",
    factReceived: "reçus",
    factSigned: "indicateurs signés",
    factFiles: "fichiers vérifiés",
    factFile: "fichier vérifié",
    factElapsed: "écoulé",
    nextTitle: "Ensuite, sans quitter votre ordinateur",
    next: [
      "Branchez le téléphone avec un câble et acceptez son message.",
      "Une copie temporaire sur votre ordinateur. Rien n’en sort.",
      "Votre ordinateur la compare à des indicateurs de logiciels espions connus.",
      "Un résultat clair, en PDF si vous le souhaitez. La copie est effacée à la fin.",
    ],
  },
  de: {
    optionsLabel: "Analyseoptionen",
    optionNetwork: "Auch seine Verbindungen prüfen",
    optionNetworkIos:
      "Beobachtet den Datenverkehr des iPhones 2 Minuten lang während des Kopierens.",
    optionNetworkAndroid:
      "Gleicht die offenen Verbindungen des Telefons mit bekannten Spyware-Servern ab. Ohne Wartezeit.",
    optionDeep: "Tiefenprüfung",
    optionDeepHelp:
      "Prüft das Ausschaltprotokoll des iPhones. Dauert etwa 10 Minuten länger.",
    recommended: "Empfohlen",
    aboutVersion: "Version {v}",
    aboutBody: "Spyware-Erkennung für iPhone und Android",
    aboutReleased: "Veröffentlicht am {d}",
    scrollMore: "Mehr anzeigen",
    pdfSaved: "Bericht gespeichert",
    optionDeepSteps:
      "Nach „Vertrauen“ bitten wir Sie, gleichzeitig drei Tasten am iPhone zu drücken. Die Kopie beginnt, sobald das iPhone es bestätigt.",
    cardCopying: "Dateien werden kopiert",
    cardSkipping: "Fotos und Videos werden übersprungen",
    cardWaiting: "Warten auf weitere Daten vom Telefon",
    cardFinishing: "Die letzten Daten werden empfangen",
    cardDecrypting: "Die Kopie wird entschlüsselt",
    cardComparing: "Abgleich mit Spyware-Indikatoren",
    cardForensics: "Protokolle, Nachrichten und Apps werden geprüft",
    cardNetwork: "Verbindungen werden geprüft",
    cardCleanup: "Temporäre Dateien werden gelöscht",
    cardObserving: "Netzwerk wird beobachtet",
    cardDeepPreparing: "Das iPhone bereitet die Tiefenprüfung vor",
    deepWaitTitle: "Tiefenprüfung starten",
    deepWaitHint:
      "Drücken Sie gleichzeitig die drei markierten Tasten am iPhone und lassen Sie sie los, sobald Sie die Vibration spüren. Nicht gedrückt halten: Das ruft den Notruf an.",
    deepConfirmedTitle: "Tiefenprüfung gestartet",
    deepConfirmedHint:
      "Das iPhone bereitet das Protokoll vor. Die Kopie beginnt.",
    deepSkip: "Ohne Tiefenprüfung fortfahren",
    cardDeepReady: "Tiefenprüfung abgeschlossen",
    closeNow: "Schließen",
    welcomeTitle: "Willkommen bei Enigm Scan",
    welcomeBody:
      "Prüft Ihr iPhone oder Android-Gerät auf bekannte Spyware. Ihre Daten verlassen diesen Computer nie und werden beim Schließen der App gelöscht.",
    welcomeAction: "Mein Telefon prüfen",
    openTitle: "Öffnen Sie Enigm Scan",
    openMac: "Öffnen Sie die .dmg-Datei und doppelklicken Sie auf Enigm Scan.",
    openWindows: "Entpacken Sie die .zip-Datei und öffnen Sie Enigm Scan.",
    openLinux: "Machen Sie das AppImage ausführbar und öffnen Sie es.",
    openAfter: "Danach führt Sie die App Schritt für Schritt.",
    connectHelp:
      "Schließen Sie es mit einem USB-Datenkabel an den Computer an und lassen Sie den Bildschirm entsperrt. Verwenden Sie nach Möglichkeit das Originalkabel: Manche Kabel laden nur.",
    readyIos:
      "Beim Start fragt Ihr iPhone nach „Vertrauen“ und Ihrem Code. Lassen Sie es danach bis zum Ende angeschlossen.",
    readyAndroid:
      "Beim Start fragt Ihr Smartphone, ob USB-Debugging erlaubt werden soll. Lassen Sie es danach bis zum Ende angeschlossen.",
    readyTitle: "Alles bereit",
    trustAndroid: "Erlauben Sie USB-Debugging",
    trustAndroidNow:
      "Bestätigen Sie den Hinweis auf dem Bildschirm Ihres Smartphones. Wir beginnen sofort.",
    usbDebugTitle: "USB-Debugging zulassen?",
    usbDebugBody: "Fingerabdruck des RSA-Schlüssels dieses Computers:",
    usbDebugAlways: "Von diesem Computer immer zulassen",
    usbDebugCancel: "Abbrechen",
    usbDebugAllow: "Zulassen",
    bannerReady: "Mit Ihrem Computer verbunden",
    bannerUnlock: "Zum Fortfahren entsperren",
    downloadAgain: "Erneut herunterladen",
    changeSystem: "Ändern",
    notFoundTitle: "Wir sehen Ihr Smartphone noch nicht",
    notFoundHelp:
      "Prüfen Sie, ob das Kabel Daten überträgt und der Bildschirm entsperrt ist. Aktivieren Sie unter Android auch USB-Debugging.",
    searchAgain: "Erneut suchen",
    tryAgain: "Erneut versuchen",
    problemUnplugged: ["Kabel getrennt", "Zum Fortfahren erneut anschließen"],
    problemLocked: ["Smartphone gesperrt", "Zum Fortfahren entsperren"],
    problemTrust: [
      "Nicht autorisiert",
      "Hinweis auf dem Smartphone bestätigen",
    ],
    problemError: [
      "Etwas ist schiefgelaufen",
      "Siehe Meldung auf dem Computer",
    ],
    searchingHint:
      "Wir suchen Ihr Smartphone … Fragt es nach „USB-Debugging zulassen“ oder „Vertrauen“, bestätigen Sie das.",
    devTitle: "Entwickleroptionen",
    devMain: "Entwickleroptionen verwenden",
    devSection: "Debugging",
    devUsb: "USB-Debugging",
    devUsbHint: "Debugmodus bei USB-Verbindung",
    trustBody:
      "Deine Einstellungen und Daten sind von diesem Computer aus zugänglich, wenn er verbunden ist.",
    asideIos: "Tippen Sie auf „Vertrauen“ und geben Sie Ihren Code ein.",
    asideAndroid: "Aktivieren Sie „USB-Debugging“ in den Entwickleroptionen.",
    checkTitle: "Prüfen Sie",
    chkCable: "Ein USB-Datenkabel, kein reines Ladekabel",
    chkPort: "Direkt am Computer, ohne Adapter",
    chkUnlock: "Das Smartphone entsperrt",
    chkAwake: "Den Bildschirm an, bis die Kopie beginnt",
    chkApprove:
      "„Vertrauen“ auf dem iPhone oder USB-Debugging auf Android bestätigt",
    chkRetry: "Falls abgelehnt: Kabel trennen und wieder anschließen",
    chkApp: "Enigm Scan auf Ihrem Computer geöffnet",
    viaUsb: "Per USB verbunden",
    deviceId: "Kennung",
    factPercent: "kopiert",
    factLeft: "verbleibend (geschätzt)",
    factCopied: "kopiert",
    factReceived: "empfangen",
    factSigned: "signierte Indikatoren",
    factFiles: "geprüfte Dateien",
    factFile: "geprüfte Datei",
    factElapsed: "vergangen",
    nextTitle: "Danach, ohne Ihren Computer zu verlassen",
    next: [
      "Schließen Sie das Smartphone per Kabel an und bestätigen Sie den Hinweis.",
      "Eine vorübergehende Kopie auf Ihrem Computer. Nichts verlässt ihn.",
      "Ihr Computer vergleicht sie mit Indikatoren bekannter Spyware.",
      "Ein klares Ergebnis, auf Wunsch als PDF. Die Kopie wird am Ende gelöscht.",
    ],
  },
  it: {
    optionsLabel: "Opzioni dell’analisi",
    optionNetwork: "Controlla anche le sue connessioni",
    optionNetworkIos:
      "Osserva il traffico dell’iPhone per 2 minuti durante la copia.",
    optionNetworkAndroid:
      "Confronta le connessioni aperte del telefono con server di spyware noti. Nessuna attesa in più.",
    optionDeep: "Analisi approfondita",
    optionDeepHelp:
      "Controlla il registro di spegnimento dell’iPhone. Aggiunge circa 10 minuti.",
    recommended: "Consigliato",
    aboutVersion: "Versione {v}",
    aboutBody: "Rilevamento di spyware per iPhone e Android",
    aboutReleased: "Pubblicata il {d}",
    scrollMore: "Mostra di più",
    pdfSaved: "Rapporto salvato",
    optionDeepSteps:
      "Dopo «Autorizza» ti chiederemo di premere insieme tre tasti dell’iPhone. La copia inizia quando l’iPhone lo conferma.",
    cardCopying: "Copia dei file",
    cardSkipping: "Foto e video saltati",
    cardWaiting: "In attesa di altri dati dal telefono",
    cardFinishing: "Ricezione degli ultimi dati",
    cardDecrypting: "Decifratura della copia",
    cardComparing: "Confronto con gli indicatori di spyware",
    cardForensics: "Controllo di registri, messaggi e app",
    cardNetwork: "Controllo delle connessioni",
    cardCleanup: "Eliminazione dei file temporanei",
    cardObserving: "Osservazione della rete",
    cardDeepPreparing: "L’iPhone sta preparando l’analisi approfondita",
    deepWaitTitle: "Avvia l’analisi approfondita",
    deepWaitHint:
      "Premi insieme i tre tasti indicati sull’iPhone e rilasciali appena senti la vibrazione. Non tenerli premuti: chiameresti i soccorsi.",
    deepConfirmedTitle: "Analisi approfondita avviata",
    deepConfirmedHint: "L’iPhone sta preparando il registro. Inizia la copia.",
    deepSkip: "Continua senza analisi approfondita",
    cardDeepReady: "Analisi approfondita completata",
    closeNow: "Chiudi",
    welcomeTitle: "Benvenuto in Enigm Scan",
    welcomeBody:
      "Controlla se il tuo iPhone o Android ha spyware noti. I tuoi dati non lasciano mai questo computer e vengono cancellati alla chiusura dell’app.",
    welcomeAction: "Analizza il mio telefono",
    openTitle: "Apri Enigm Scan",
    openMac: "Apri il file .dmg e fai doppio clic su Enigm Scan.",
    openWindows: "Estrai il file .zip e apri Enigm Scan.",
    openLinux: "Rendi eseguibile l’AppImage e aprila.",
    openAfter: "Una volta aperta, l’app ti guida passo dopo passo.",
    connectHelp:
      "Collegalo al computer con un cavo USB dati e lascia lo schermo sbloccato. Se puoi, usa il cavo originale: alcuni cavi servono solo a caricare.",
    readyIos:
      "All’avvio, l’iPhone ti chiederà «Autorizza» e il codice. Poi lascialo collegato fino alla fine.",
    readyAndroid:
      "All’avvio, il telefono ti chiederà di consentire il debug USB. Poi lascialo collegato fino alla fine.",
    readyTitle: "Tutto pronto",
    trustAndroid: "Consenti il debug USB",
    trustAndroidNow:
      "Accetta l’avviso sullo schermo del telefono. Iniziamo subito.",
    usbDebugTitle: "Consentire il debug USB?",
    usbDebugBody: "Impronta digitale della chiave RSA del computer:",
    usbDebugAlways: "Consenti sempre da questo computer",
    usbDebugCancel: "Annulla",
    usbDebugAllow: "Consenti",
    bannerReady: "Collegato al computer",
    bannerUnlock: "Sbloccalo per continuare",
    downloadAgain: "Scarica di nuovo",
    changeSystem: "Cambia",
    notFoundTitle: "Non vediamo ancora il tuo telefono",
    notFoundHelp:
      "Controlla che il cavo trasmetta dati e che lo schermo sia sbloccato. Su Android, attiva anche il debug USB.",
    searchAgain: "Cerca di nuovo",
    tryAgain: "Riprova",
    problemUnplugged: ["Cavo scollegato", "Ricollegalo per continuare"],
    problemLocked: ["Telefono bloccato", "Sbloccalo per continuare"],
    problemTrust: ["Non autorizzato", "Accetta l’avviso sul telefono"],
    problemError: [
      "Qualcosa non ha funzionato",
      "Leggi il messaggio sul computer",
    ],
    searchingHint:
      "Cerchiamo il telefono… Se chiede «Consentire il debug USB» o «Autorizza», accetta.",
    devTitle: "Opzioni sviluppatore",
    devMain: "Usa Opzioni sviluppatore",
    devSection: "Debug",
    devUsb: "Debug USB",
    devUsbHint: "Modalità debug quando è connesso tramite USB",
    trustBody:
      "Le impostazioni e i dati saranno accessibili da questo computer quando è collegato.",
    asideIos: "Tocca «Autorizza» e inserisci il codice.",
    asideAndroid: "Attiva «Debug USB» in Opzioni sviluppatore.",
    checkTitle: "Controlla",
    chkCable: "Un cavo USB dati, non solo di ricarica",
    chkPort: "Collegato direttamente al computer, senza adattatori",
    chkUnlock: "Il telefono sbloccato",
    chkAwake: "Lo schermo acceso finché non inizia la copia",
    chkApprove: "«Autorizza» su iPhone o il debug USB su Android, accettati",
    chkRetry: "Se hai rifiutato, scollega e ricollega il cavo",
    chkApp: "Enigm Scan aperto sul computer",
    viaUsb: "Collegato via USB",
    deviceId: "Identificativo",
    factPercent: "copiato",
    factLeft: "rimanente (stima)",
    factCopied: "copiati",
    factReceived: "ricevuti",
    factSigned: "indicatori firmati",
    factFiles: "file controllati",
    factFile: "file controllato",
    factElapsed: "trascorso",
    nextTitle: "Poi, senza lasciare il tuo computer",
    next: [
      "Collega il telefono con un cavo e accetta l’avviso.",
      "Una copia temporanea sul tuo computer. Nulla ne esce.",
      "Il computer la confronta con indicatori di spyware noti.",
      "Un risultato chiaro, in PDF se vuoi. La copia viene cancellata alla fine.",
    ],
  },
  pt: {
    optionsLabel: "Opções da análise",
    optionNetwork: "Verificar também as ligações",
    optionNetworkIos:
      "Observa o tráfego do iPhone durante 2 minutos enquanto copia.",
    optionNetworkAndroid:
      "Compara as ligações abertas do telemóvel com servidores de spyware conhecidos. Sem espera adicional.",
    optionDeep: "Análise profunda",
    optionDeepHelp:
      "Revê o registo de encerramento do iPhone. Acrescenta cerca de 10 minutos.",
    recommended: "Recomendado",
    aboutVersion: "Versão {v}",
    aboutBody: "Deteção de spyware para iPhone e Android",
    aboutReleased: "Publicada a {d}",
    scrollMore: "Ver mais",
    pdfSaved: "Relatório guardado",
    optionDeepSteps:
      "Depois de «Confiar», vamos pedir-lhe que prima ao mesmo tempo três botões do iPhone. A cópia começa quando o iPhone o confirmar.",
    cardCopying: "A copiar ficheiros",
    cardSkipping: "A ignorar fotos e vídeos",
    cardWaiting: "À espera de mais dados do telemóvel",
    cardFinishing: "A receber os últimos dados",
    cardDecrypting: "A decifrar a cópia",
    cardComparing: "A comparar com indicadores de spyware",
    cardForensics: "A rever registos, mensagens e apps",
    cardNetwork: "A rever as ligações",
    cardCleanup: "A apagar os ficheiros temporários",
    cardObserving: "A observar a rede",
    cardDeepPreparing: "O iPhone está a preparar a análise profunda",
    deepWaitTitle: "Ative a análise profunda",
    deepWaitHint:
      "Prima ao mesmo tempo os três botões assinalados no iPhone e solte-os quando sentir a vibração. Não os mantenha premidos: ligaria para a emergência.",
    deepConfirmedTitle: "Análise profunda ativada",
    deepConfirmedHint:
      "O iPhone está a preparar o registo. A cópia vai começar.",
    deepSkip: "Continuar sem análise profunda",
    cardDeepReady: "Análise profunda concluída",
    closeNow: "Fechar",
    welcomeTitle: "Bem-vindo ao Enigm Scan",
    welcomeBody:
      "Verifica se o seu iPhone ou Android tem spyware conhecido. Os seus dados nunca saem deste computador e são apagados ao fechar a app.",
    welcomeAction: "Analisar o meu telemóvel",
    openTitle: "Abra o Enigm Scan",
    openMac: "Abra o ficheiro .dmg e faça duplo clique em Enigm Scan.",
    openWindows: "Descomprima o ficheiro .zip e abra o Enigm Scan.",
    openLinux: "Dê permissão de execução ao AppImage e abra-o.",
    openAfter: "Depois de aberta, a app guia-o passo a passo.",
    connectHelp:
      "Ligue-o ao computador com um cabo USB de dados e mantenha o ecrã desbloqueado. Se puder, use o cabo original: alguns cabos só carregam.",
    readyIos:
      "Ao começar, o iPhone pede-lhe «Confiar» e o código. Depois, deixe-o ligado até ao fim.",
    readyAndroid:
      "Ao começar, o telemóvel pede-lhe para permitir a depuração USB. Depois, deixe-o ligado até ao fim.",
    readyTitle: "Tudo pronto",
    trustAndroid: "Permita a depuração USB",
    trustAndroidNow:
      "Aceite o aviso no ecrã do telemóvel. Começamos de imediato.",
    usbDebugTitle: "Permitir depuração USB?",
    usbDebugBody: "Impressão digital da chave RSA do computador:",
    usbDebugAlways: "Permitir sempre a partir deste computador",
    usbDebugCancel: "Cancelar",
    usbDebugAllow: "Permitir",
    bannerReady: "Ligado ao seu computador",
    bannerUnlock: "Desbloqueie-o para continuar",
    downloadAgain: "Descarregar novamente",
    changeSystem: "Alterar",
    notFoundTitle: "Ainda não vemos o seu telemóvel",
    notFoundHelp:
      "Confirme que o cabo transmite dados e que o ecrã está desbloqueado. No Android, ative também a depuração USB.",
    searchAgain: "Procurar novamente",
    tryAgain: "Tentar novamente",
    problemUnplugged: ["Cabo desligado", "Volte a ligá-lo para continuar"],
    problemLocked: ["Telemóvel bloqueado", "Desbloqueie-o para continuar"],
    problemTrust: ["Sem autorização", "Aceite o aviso no telemóvel"],
    problemError: ["Algo correu mal", "Veja a mensagem no computador"],
    searchingHint:
      "A procurar o seu telemóvel… Se o telemóvel pedir «Permitir depuração USB» ou «Confiar», aceite.",
    devTitle: "Opções de programador",
    devMain: "Utilizar opções de programador",
    devSection: "Depuração",
    devUsb: "Depuração USB",
    devUsbHint: "Modo de depuração quando o USB está ligado",
    trustBody:
      "As suas definições e dados ficarão acessíveis a partir deste computador quando estiver ligado.",
    asideIos: "Toque em «Confiar» e introduza o código.",
    asideAndroid: "Ative «Depuração USB» nas opções de programador.",
    checkTitle: "Verifique",
    chkCable: "Um cabo USB de dados, não só de carga",
    chkPort: "Ligado diretamente ao computador, sem adaptadores",
    chkUnlock: "O telemóvel desbloqueado",
    chkAwake: "O ecrã ligado até a cópia começar",
    chkApprove: "«Confiar» no iPhone ou a depuração USB no Android, aceites",
    chkRetry: "Se recusou, desligue e volte a ligar o cabo",
    chkApp: "O Enigm Scan aberto no computador",
    viaUsb: "Ligado por USB",
    deviceId: "Identificador",
    factPercent: "copiado",
    factLeft: "restante (estimativa)",
    factCopied: "copiados",
    factReceived: "recebidos",
    factSigned: "indicadores assinados",
    factFiles: "ficheiros verificados",
    factFile: "ficheiro verificado",
    factElapsed: "decorrido",
    nextTitle: "Depois, sem sair do seu computador",
    next: [
      "Ligue o telemóvel com um cabo e aceite o aviso.",
      "Uma cópia temporária no seu computador. Nada sai dele.",
      "O computador compara-a com indicadores de spyware conhecido.",
      "Um resultado claro, em PDF se quiser. A cópia é apagada no fim.",
    ],
  },
};
