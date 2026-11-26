import type { Language } from "./i18n";
const en = {
  backupError:
    "The backup could not be decrypted completely. Check its password and integrity, then retry. No completed analysis is implied.",
  encryptedBackup: "Encrypted iOS backup",
  backupPassword: "Backup password",
  passwordHelp:
    "Used locally for this analysis. It is not saved. Decrypted files are removed with the session.",
  decrypting: "Opening the encrypted backup",
  title: "Analyze locally",
  evidence: "Choose evidence folder",
  rules: "Load a signed rule update",
  run: "Analyze selected data",
  cancel: "Cancel",
  progress: "Analysis progress",
  pauseMotion: "Pause animations",
  resumeMotion: "Resume animations",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  acquiring: "Copying to your computer",
  analyzing: "Looking for spyware",
  forensics: "Taking a closer look",
  finalizing: "Preparing your report",
  network: "Checking connections",
  capturing: "Watching connections",
  localProcessing: "Everything happens on your computer",
  completed: "Analysis complete",
  failed: "Analysis could not complete",
  consent: "This phone is mine, or its owner has given me permission",
  device: "Device",
  usb: "Connected phone",
  deviceLocked:
    "The iPhone was locked. Unlock it, keep the screen on and press “Try again”.",
  awaiting_trust: "Tap “Trust” on your iPhone",
  awaiting_passcode: "Enter the passcode on your iPhone",
  trustNow: "Unlock it and accept. We’ll start right away.",
  passcodeNow: "It authorizes the copy. We continue as soon as you enter it.",
  deviceDisconnected:
    "The iPhone was disconnected. Check the cable and start again.",
  deviceNotTrusted: "The iPhone did not answer “Trust”.",
  deviceCancelled:
    "The copy was cancelled on the iPhone. Press “Try again” whenever you like.",
  elapsed: "Elapsed {t}",
  remaining: "About {t} left",
  estimateNote: "Estimate based on the phone’s own progress.",
  lessThanMinute: "less than a minute",
  actCapture:
    "Watching the iPhone’s connections to compare them with known spyware servers · {t} left.",
  deepTitle: "Deep check",
  deepHold: "Don't hold them: that calls emergency services.",
  usbSlow:
    "Slow connection (USB 2.0): the copy may take over an hour. A USB 3 cable speeds it up.",
  actCopy:
    "Copying messages, settings and apps to a temporary folder on this computer. Keep the phone connected and unlocked meanwhile.",
  actDecrypt:
    "Decrypting the copy with your password, only on this computer. The password is not stored anywhere.",
  actIndicators:
    "Checking every file against {n} signed indicators of known spyware and stalkerware, from public sources and Enigm.",
  actCleanup:
    "Deleting the temporary files of the copy. This computer keeps only the report, if you choose to save it.",
  statDiscarded: "photos and videos skipped",
  unlock: "Unlock it and accept the prompt on the phone.",
  code: "Single-use pairing key",
  error: "We couldn’t finish the scan. Please try again.",
  nativeReport: "Analyzed on your computer",
  finishError:
    "The session could not be closed. Your report remains available. Wait for the operation to finish and retry.",
  failNotAuthorized:
    "The phone was not available when the scan started. Check that it is still connected and unlocked and, on Android, that USB debugging was accepted. Then search for it again.",
  failAdbExpired:
    "The USB connection to the phone closed. Search for it again to start over.",
  failCopy:
    "The phone could not be copied. Check that the cable is still connected and the screen unlocked, then start again.",
  failBusy:
    "A scan is already running. Wait for it to finish or cancel it in the Enigm Scan window.",
  failAppleUsb:
    "To check an iPhone, this computer needs Apple’s USB service: on Windows, install Apple Devices from the Microsoft Store; on Linux, install usbmuxd. Then try again.",
  failIphoneMissing:
    "We could not find the iPhone. Check that it is connected and unlocked. On Windows this needs Apple Devices from the Microsoft Store; on Linux, usbmuxd.",
  failAdbStart:
    "The Android USB tool took too long to start. Try again; if it keeps happening, restart the computer.",
  failIosStart:
    "The iPhone component took too long to start; the first time, an antivirus may be checking it. Try again.",
  passcode_retry: "Enter the passcode again",
  passcodeRetryNow:
    "The iPhone closed the passcode request unanswered, so the copy starts again. Unlock it and enter the passcode when asked.",
  waitLeft: "Waiting time left: {t}",
  deviceTrustDenied: "“Trust” was declined on the iPhone.",
  devicePasscodeTimeout:
    "The iPhone closed the passcode request several times unanswered. Press “Try again” and enter the passcode when it appears.",
  androidAllow: "Accept “Allow USB debugging” on the phone.",
  androidAllowTimeout:
    "The phone did not allow USB debugging within 3 minutes. Unlock it and press “Try again”.",
  enginesMissing:
    "Some parts of Enigm Scan are missing on this computer; an antivirus may have removed them. Download Enigm Scan again from scan.enigm.io.",
  noEngines:
    "USB or forensic engines are unavailable in this build. Local file checks remain available, with reduced coverage.",
  files: "Existing local evidence",
  method: "Analysis method",
  ready: "Ready",
  ruleVersion: "Active rule version",
  capError:
    "Rules are unavailable, expired or invalid. Load a valid signed update before scanning.",
  stepConnect: "Connect",
  stepCopy: "Local copy",
  stepExtract: "Extract",
  stepAnalyze: "Analyze",
  stepReport: "Report",
  phoneTrustTitle: "Trust This Computer?",
  phoneTrustNo: "Don’t Trust",
  phoneTrustYes: "Trust",
  phonePasscode: "Enter Passcode",
  phoneKeep: "Keep it connected",
  noteCodeMaybe: "if asked, type it on your iPhone",
};
export type AgentCopy = typeof en;
const es: AgentCopy = {
  backupError:
    "No se ha podido descifrar la copia completamente. Revisa la contraseña y la integridad de la copia e inténtalo de nuevo. El análisis no se considera completado.",
  encryptedBackup: "Copia iOS cifrada",
  backupPassword: "Contraseña de la copia",
  passwordHelp:
    "Se usa localmente para este análisis y no se guarda. Los archivos descifrados se eliminan con la sesión.",
  decrypting: "Abriendo la copia cifrada",
  title: "Analizar localmente",
  evidence: "Elegir carpeta de evidencias",
  rules: "Cargar actualización de reglas firmada",
  run: "Analizar datos seleccionados",
  cancel: "Cancelar",
  progress: "Progreso del análisis",
  pauseMotion: "Pausar animaciones",
  resumeMotion: "Reanudar animaciones",
  pauseLabel: "Pausar",
  resumeLabel: "Reanudar",
  acquiring: "Copiando a tu ordenador",
  analyzing: "Buscando spyware",
  forensics: "Revisando a fondo",
  finalizing: "Preparando tu informe",
  network: "Revisando conexiones",
  capturing: "Observando conexiones",
  localProcessing: "Todo ocurre en tu ordenador",
  completed: "Análisis completado",
  failed: "No se ha podido completar el análisis",
  consent: "Este móvil es mío o tengo permiso de su dueño",
  device: "Dispositivo",
  usb: "Teléfono conectado",
  deviceLocked:
    "El iPhone estaba bloqueado. Desbloquéalo, deja la pantalla encendida y pulsa «Reintentar».",
  awaiting_trust: "Pulsa «Confiar» en tu iPhone",
  awaiting_passcode: "Introduce el código en tu iPhone",
  trustNow: "Desbloquéalo y acepta. Empezamos al instante.",
  passcodeNow: "Sirve para autorizar la copia. Seguimos en cuanto lo escribas.",
  deviceDisconnected:
    "El iPhone se ha desconectado. Revisa el cable y vuelve a empezar.",
  deviceNotTrusted: "El iPhone no respondió a «Confiar».",
  deviceCancelled:
    "La copia se canceló desde el iPhone. Pulsa «Reintentar» cuando quieras.",
  elapsed: "Llevamos {t}",
  remaining: "Tiempo restante estimado: {t}",
  estimateNote: "Estimación según el avance que informa el propio teléfono.",
  lessThanMinute: "menos de un minuto",
  actCapture:
    "Observamos las conexiones del iPhone para compararlas con servidores de spyware conocidos · tiempo restante: {t}.",
  deepTitle: "Análisis profundo",
  deepHold: "No los mantengas: llamarías a emergencias.",
  usbSlow:
    "Conexión lenta (USB 2.0): la copia puede tardar más de una hora. Un cable USB 3 la acelera.",
  actCopy:
    "Copiamos mensajes, ajustes y apps a una carpeta temporal de este ordenador. Deja el móvil conectado y desbloqueado mientras tanto.",
  actDecrypt:
    "Desciframos la copia con tu contraseña, solo en este ordenador. La contraseña no se guarda en ningún sitio.",
  actIndicators:
    "Comparamos cada archivo con {n} indicadores firmados de spyware y stalkerware conocidos, de fuentes públicas y de Enigm.",
  actCleanup:
    "Borramos los archivos temporales de la copia. Este ordenador solo conservará el informe si decides guardarlo.",
  statDiscarded: "fotos y vídeos omitidos",
  unlock: "Desbloquéalo y acepta el aviso del móvil.",
  code: "Clave de emparejamiento de un solo uso",
  error: "No hemos podido terminar el análisis. Vuelve a intentarlo.",
  nativeReport: "Analizado en tu ordenador",
  finishError:
    "No se ha podido cerrar la sesión. El informe sigue disponible. Espera a que termine la operación y vuelve a intentarlo.",
  failNotAuthorized:
    "El móvil no estaba disponible al empezar. Comprueba que sigue conectado y desbloqueado y, en Android, que aceptaste la depuración USB. Después, vuelve a buscarlo.",
  failAdbExpired:
    "La conexión USB con el móvil se cerró. Vuelve a buscarlo para empezar de nuevo.",
  failCopy:
    "No se pudo copiar el móvil. Comprueba que el cable sigue conectado y la pantalla desbloqueada, y vuelve a empezar.",
  failBusy:
    "Ya hay un análisis en marcha. Espera a que termine o cancélalo en la ventana de Enigm Scan.",
  failAppleUsb:
    "Para revisar un iPhone, este ordenador necesita el servicio USB de Apple: en Windows, instala Apple Devices desde Microsoft Store; en Linux, instala usbmuxd. Después, vuelve a intentarlo.",
  failIphoneMissing:
    "No encontramos el iPhone. Comprueba que está conectado y desbloqueado. En Windows hace falta Apple Devices, de Microsoft Store; en Linux, usbmuxd.",
  failAdbStart:
    "La herramienta USB de Android tardó demasiado en arrancar. Vuelve a intentarlo; si se repite, reinicia el ordenador.",
  failIosStart:
    "El componente de iPhone tardó demasiado en arrancar; la primera vez puede estar revisándolo el antivirus. Vuelve a intentarlo.",
  passcode_retry: "Vuelve a escribir el código",
  passcodeRetryNow:
    "El iPhone cerró la petición del código sin respuesta, así que la copia vuelve a empezar. Desbloquéalo y escribe el código cuando te lo pida.",
  waitLeft: "Tiempo de espera restante: {t}",
  deviceTrustDenied: "Se rechazó «Confiar» en el iPhone.",
  devicePasscodeTimeout:
    "El iPhone cerró varias veces la petición del código sin respuesta. Pulsa «Reintentar» y escribe el código cuando aparezca.",
  androidAllow: "Acepta «Permitir depuración USB» en el teléfono.",
  androidAllowTimeout:
    "El teléfono no permitió la depuración USB en 3 minutos. Desbloquéalo y pulsa «Reintentar».",
  enginesMissing:
    "Faltan partes de Enigm Scan en este ordenador; puede que un antivirus las haya quitado. Descárgalo de nuevo desde scan.enigm.io.",
  noEngines:
    "Los motores USB o forenses no están disponibles en esta compilación. Puedes analizar archivos locales con cobertura reducida.",
  files: "Evidencias locales existentes",
  method: "Método de análisis",
  ready: "Preparado",
  ruleVersion: "Versión activa de reglas",
  capError:
    "Las reglas no están disponibles, han caducado o no son válidas. Carga una actualización firmada válida antes de analizar.",
  stepConnect: "Conectar",
  stepCopy: "Copia local",
  stepExtract: "Extraer",
  stepAnalyze: "Analizar",
  stepReport: "Informe",
  phoneTrustTitle: "¿Confiar en este ordenador?",
  phoneTrustNo: "No confiar",
  phoneTrustYes: "Confiar",
  phonePasscode: "Introduce el código",
  phoneKeep: "Déjalo conectado",
  noteCodeMaybe: "si te lo pide, escríbelo en tu iPhone",
};
const fr: AgentCopy = {
  backupError:
    "La sauvegarde n’a pas pu être entièrement déchiffrée. Vérifiez son mot de passe et son intégrité, puis réessayez. L’analyse n’est pas terminée.",
  encryptedBackup: "Sauvegarde iOS chiffrée",
  backupPassword: "Mot de passe de la sauvegarde",
  passwordHelp:
    "Utilisé localement pour cette analyse, sans enregistrement. Les fichiers déchiffrés sont supprimés avec la session.",
  decrypting: "Ouverture de la sauvegarde chiffrée",
  title: "Analyser localement",
  evidence: "Choisir le dossier de preuves",
  rules: "Charger des règles signées",
  run: "Analyser les données sélectionnées",
  cancel: "Annuler",
  progress: "Progression de l’analyse",
  pauseMotion: "Mettre les animations en pause",
  resumeMotion: "Reprendre les animations",
  pauseLabel: "Pause",
  resumeLabel: "Reprendre",
  acquiring: "Copie vers votre ordinateur",
  analyzing: "Recherche de logiciels espions",
  forensics: "Examen approfondi",
  finalizing: "Préparation de votre rapport",
  network: "Vérification des connexions",
  capturing: "Observation des connexions",
  localProcessing: "Tout se passe sur votre ordinateur",
  completed: "Analyse terminée",
  failed: "L’analyse n’a pas abouti",
  consent: "Ce téléphone est à moi ou son propriétaire m’y autorise",
  device: "Appareil",
  usb: "Téléphone connecté",
  deviceLocked:
    "L’iPhone était verrouillé. Déverrouillez-le, laissez l’écran allumé et appuyez sur « Réessayer ».",
  awaiting_trust: "Touchez « Se fier » sur votre iPhone",
  awaiting_passcode: "Saisissez le code sur votre iPhone",
  trustNow: "Déverrouillez-le et acceptez. Nous commençons aussitôt.",
  passcodeNow:
    "Il autorise la copie. Nous continuons dès que vous l’avez saisi.",
  deviceDisconnected:
    "L’iPhone a été déconnecté. Vérifiez le câble et recommencez.",
  deviceNotTrusted: "L’iPhone n’a pas répondu à « Se fier ».",
  deviceCancelled:
    "La copie a été annulée sur l’iPhone. Appuyez sur « Réessayer » quand vous voulez.",
  elapsed: "Écoulé : {t}",
  remaining: "Encore environ {t}",
  estimateNote: "Estimation selon l’avancement indiqué par le téléphone.",
  lessThanMinute: "moins d’une minute",
  actCapture:
    "Observation des connexions de l’iPhone pour les comparer à des serveurs de logiciels espions connus · encore {t}.",
  deepTitle: "Analyse approfondie",
  deepHold: "Ne les maintenez pas : cela appelle les urgences.",
  usbSlow:
    "Connexion lente (USB 2.0) : la copie peut prendre plus d’une heure. Un câble USB 3 l’accélère.",
  actCopy:
    "Copie des messages, réglages et applications dans un dossier temporaire de cet ordinateur. Gardez le téléphone branché et déverrouillé.",
  actDecrypt:
    "Déchiffrement de la copie avec votre mot de passe, uniquement sur cet ordinateur. Le mot de passe n’est enregistré nulle part.",
  actIndicators:
    "Comparaison de chaque fichier avec {n} indicateurs signés de logiciels espions et de stalkerwares connus, issus de sources publiques et d’Enigm.",
  actCleanup:
    "Suppression des fichiers temporaires de la copie. Cet ordinateur ne garde que le rapport, si vous choisissez de l’enregistrer.",
  statDiscarded: "photos et vidéos ignorées",
  unlock: "Déverrouillez-le et acceptez l’alerte du téléphone.",
  code: "Clé d’appairage à usage unique",
  error: "Impossible de terminer l’analyse. Réessayez.",
  nativeReport: "Analysé sur votre ordinateur",
  finishError:
    "La session n’a pas pu être fermée. Le rapport reste disponible. Attendez la fin de l’opération puis réessayez.",
  failNotAuthorized:
    "Le téléphone n’était pas disponible au démarrage. Vérifiez qu’il est toujours branché et déverrouillé et, sur Android, que le débogage USB a été accepté. Puis recherchez-le à nouveau.",
  failAdbExpired:
    "La connexion USB avec le téléphone s’est fermée. Recherchez-le à nouveau pour recommencer.",
  failCopy:
    "Le téléphone n’a pas pu être copié. Vérifiez que le câble est toujours branché et l’écran déverrouillé, puis recommencez.",
  failBusy:
    "Une analyse est déjà en cours. Attendez qu’elle se termine ou annulez-la dans la fenêtre d’Enigm Scan.",
  failAppleUsb:
    "Pour vérifier un iPhone, cet ordinateur a besoin du service USB d’Apple : sous Windows, installez Apple Devices depuis le Microsoft Store ; sous Linux, installez usbmuxd. Puis réessayez.",
  failIphoneMissing:
    "L’iPhone est introuvable. Vérifiez qu’il est branché et déverrouillé. Sous Windows, il faut Apple Devices depuis le Microsoft Store ; sous Linux, usbmuxd.",
  failAdbStart:
    "L’outil USB Android a mis trop de temps à démarrer. Réessayez ; si cela se reproduit, redémarrez l’ordinateur.",
  failIosStart:
    "Le composant iPhone a mis trop de temps à démarrer ; la première fois, un antivirus peut l’analyser. Réessayez.",
  passcode_retry: "Saisissez à nouveau le code",
  passcodeRetryNow:
    "L’iPhone a fermé la demande de code sans réponse : la copie recommence. Déverrouillez-le et saisissez le code quand il le demande.",
  waitLeft: "Temps d’attente restant : {t}",
  deviceTrustDenied: "« Se fier » a été refusé sur l’iPhone.",
  devicePasscodeTimeout:
    "L’iPhone a fermé plusieurs fois la demande de code sans réponse. Appuyez sur « Réessayer » et saisissez le code quand il s’affiche.",
  androidAllow: "Acceptez « Autoriser le débogage USB » sur le téléphone.",
  androidAllowTimeout:
    "Le téléphone n’a pas autorisé le débogage USB en 3 minutes. Déverrouillez-le et appuyez sur « Réessayer ».",
  enginesMissing:
    "Des éléments d’Enigm Scan manquent sur cet ordinateur ; un antivirus les a peut-être supprimés. Téléchargez à nouveau Enigm Scan depuis scan.enigm.io.",
  noEngines:
    "Les moteurs USB ou forensiques sont indisponibles dans cette version. Les vérifications locales restent disponibles avec une couverture réduite.",
  files: "Preuves locales existantes",
  method: "Méthode d’analyse",
  ready: "Prêt",
  ruleVersion: "Version active des règles",
  capError:
    "Règles absentes, expirées ou invalides. Chargez une mise à jour signée valide avant l’analyse.",
  stepConnect: "Connecter",
  stepCopy: "Copie locale",
  stepExtract: "Extraire",
  stepAnalyze: "Analyser",
  stepReport: "Rapport",
  phoneTrustTitle: "Se fier à cet ordinateur ?",
  phoneTrustNo: "Ne pas se fier",
  phoneTrustYes: "Se fier",
  phonePasscode: "Saisissez le code",
  phoneKeep: "Laissez-le branché",
  noteCodeMaybe: "s’il est demandé, saisissez-le sur l’iPhone",
};
const de: AgentCopy = {
  backupError:
    "Das Backup konnte nicht vollständig entschlüsselt werden. Prüfen Sie Passwort und Integrität und versuchen Sie es erneut. Die Analyse ist nicht abgeschlossen.",
  encryptedBackup: "Verschlüsseltes iOS-Backup",
  backupPassword: "Backup-Passwort",
  passwordHelp:
    "Wird nur lokal für diese Analyse verwendet und nicht gespeichert. Entschlüsselte Dateien werden mit der Sitzung gelöscht.",
  decrypting: "Verschlüsseltes Backup wird geöffnet",
  title: "Lokal analysieren",
  evidence: "Beweisordner auswählen",
  rules: "Signierte Regeln laden",
  run: "Ausgewählte Daten analysieren",
  cancel: "Abbrechen",
  progress: "Analysefortschritt",
  pauseMotion: "Animationen pausieren",
  resumeMotion: "Animationen fortsetzen",
  pauseLabel: "Pausieren",
  resumeLabel: "Fortsetzen",
  acquiring: "Kopie auf Ihren Computer",
  analyzing: "Suche nach Spyware",
  forensics: "Genauere Prüfung",
  finalizing: "Ihr Bericht wird erstellt",
  network: "Verbindungen werden geprüft",
  capturing: "Verbindungen werden beobachtet",
  localProcessing: "Alles geschieht auf Ihrem Computer",
  completed: "Analyse abgeschlossen",
  failed: "Analyse konnte nicht abgeschlossen werden",
  consent: "Dieses Handy gehört mir oder der Besitzer hat es mir erlaubt",
  device: "Gerät",
  usb: "Verbundenes Telefon",
  deviceLocked:
    "Das iPhone war gesperrt. Entsperren Sie es, lassen Sie den Bildschirm an und tippen Sie auf „Erneut versuchen“.",
  awaiting_trust: "Tippen Sie auf dem iPhone auf „Vertrauen“",
  awaiting_passcode: "Geben Sie den Code auf Ihrem iPhone ein",
  trustNow: "Entsperren Sie es und bestätigen Sie. Wir starten sofort.",
  passcodeNow: "Er erlaubt die Kopie. Es geht weiter, sobald Sie ihn eingeben.",
  deviceDisconnected:
    "Das iPhone wurde getrennt. Prüfen Sie das Kabel und starten Sie neu.",
  deviceNotTrusted: "Das iPhone hat „Vertrauen“ nicht beantwortet.",
  deviceCancelled:
    "Die Kopie wurde auf dem iPhone abgebrochen. Tippen Sie auf „Erneut versuchen“, wann Sie möchten.",
  elapsed: "Bisher {t}",
  remaining: "Noch etwa {t}",
  estimateNote: "Schätzung anhand des vom Telefon gemeldeten Fortschritts.",
  lessThanMinute: "weniger als eine Minute",
  actCapture:
    "Die Verbindungen des iPhones werden beobachtet und mit bekannten Spyware-Servern abgeglichen · noch {t}.",
  deepTitle: "Tiefenprüfung",
  deepHold: "Nicht halten: Sonst startet ein Notruf.",
  usbSlow:
    "Langsame Verbindung (USB 2.0): Die Kopie kann über eine Stunde dauern. Ein USB‑3-Kabel beschleunigt sie.",
  actCopy:
    "Nachrichten, Einstellungen und Apps werden in einen temporären Ordner auf diesem Computer kopiert. Lassen Sie das Smartphone verbunden und entsperrt.",
  actDecrypt:
    "Die Kopie wird mit Ihrem Passwort entschlüsselt, nur auf diesem Computer. Das Passwort wird nirgends gespeichert.",
  actIndicators:
    "Jede Datei wird mit {n} signierten Indikatoren bekannter Spyware und Stalkerware abgeglichen, aus öffentlichen Quellen und von Enigm.",
  actCleanup:
    "Die temporären Dateien der Kopie werden gelöscht. Auf diesem Computer bleibt nur der Bericht, wenn Sie ihn speichern.",
  statDiscarded: "Fotos und Videos übersprungen",
  unlock: "Entsperren Sie es und bestätigen Sie die Meldung auf dem Handy.",
  code: "Einmaliger Kopplungsschlüssel",
  error:
    "Die Prüfung konnte nicht abgeschlossen werden. Versuchen Sie es erneut.",
  nativeReport: "Auf Ihrem Computer geprüft",
  finishError:
    "Die Sitzung konnte nicht geschlossen werden. Der Bericht bleibt verfügbar. Warten Sie auf das Ende des Vorgangs und versuchen Sie es erneut.",
  failNotAuthorized:
    "Das Smartphone war beim Start nicht verfügbar. Prüfen Sie, ob es noch verbunden und entsperrt ist und ob unter Android das USB-Debugging bestätigt wurde. Suchen Sie es dann erneut.",
  failAdbExpired:
    "Die USB-Verbindung zum Smartphone wurde beendet. Suchen Sie es erneut, um neu zu beginnen.",
  failCopy:
    "Das Smartphone konnte nicht kopiert werden. Prüfen Sie, ob das Kabel noch steckt und der Bildschirm entsperrt ist, und beginnen Sie erneut.",
  failBusy:
    "Es läuft bereits eine Analyse. Warten Sie, bis sie fertig ist, oder brechen Sie sie im Fenster von Enigm Scan ab.",
  failAppleUsb:
    "Um ein iPhone zu prüfen, braucht dieser Computer den USB-Dienst von Apple: Installieren Sie unter Windows Apple Devices aus dem Microsoft Store, unter Linux usbmuxd. Versuchen Sie es dann erneut.",
  failIphoneMissing:
    "Wir finden das iPhone nicht. Prüfen Sie, ob es verbunden und entsperrt ist. Unter Windows wird Apple Devices aus dem Microsoft Store benötigt, unter Linux usbmuxd.",
  failAdbStart:
    "Das USB-Werkzeug für Android hat zu lange zum Starten gebraucht. Versuchen Sie es erneut; passiert das wieder, starten Sie den Computer neu.",
  failIosStart:
    "Die iPhone-Komponente hat zu lange zum Starten gebraucht; beim ersten Mal prüft sie eventuell der Virenschutz. Versuchen Sie es erneut.",
  passcode_retry: "Geben Sie den Code erneut ein",
  passcodeRetryNow:
    "Das iPhone hat die Code-Abfrage unbeantwortet geschlossen, daher beginnt die Kopie neu. Entsperren Sie es und geben Sie den Code ein, wenn es danach fragt.",
  waitLeft: "Verbleibende Wartezeit: {t}",
  deviceTrustDenied: "„Vertrauen“ wurde auf dem iPhone abgelehnt.",
  devicePasscodeTimeout:
    "Das iPhone hat die Code-Abfrage mehrmals unbeantwortet geschlossen. Tippen Sie auf „Erneut versuchen“ und geben Sie den Code ein, sobald er abgefragt wird.",
  androidAllow: "Bestätigen Sie „USB-Debugging zulassen“ auf dem Smartphone.",
  androidAllowTimeout:
    "Das Smartphone hat USB-Debugging nicht innerhalb von 3 Minuten zugelassen. Entsperren Sie es und tippen Sie auf „Erneut versuchen“.",
  enginesMissing:
    "Auf diesem Computer fehlen Teile von Enigm Scan; möglicherweise hat ein Virenschutz sie entfernt. Laden Sie Enigm Scan erneut von scan.enigm.io herunter.",
  noEngines:
    "USB- oder Forensik-Engines sind in diesem Build nicht verfügbar. Lokale Dateiprüfungen mit eingeschränkter Abdeckung sind möglich.",
  files: "Vorhandene lokale Belege",
  method: "Analysemethode",
  ready: "Bereit",
  ruleVersion: "Aktive Regelversion",
  capError:
    "Regeln fehlen, sind abgelaufen oder ungültig. Vor der Analyse ein gültiges signiertes Update laden.",
  stepConnect: "Verbinden",
  stepCopy: "Lokale Kopie",
  stepExtract: "Extrahieren",
  stepAnalyze: "Prüfen",
  stepReport: "Bericht",
  phoneTrustTitle: "Diesem Computer vertrauen?",
  phoneTrustNo: "Nicht vertrauen",
  phoneTrustYes: "Vertrauen",
  phonePasscode: "Code eingeben",
  phoneKeep: "Verbunden lassen",
  noteCodeMaybe: "falls gefragt, auf dem iPhone eingeben",
};
const it: AgentCopy = {
  backupError:
    "Il backup non è stato decifrato completamente. Verifica la password e l’integrità e riprova. L’analisi non è completata.",
  encryptedBackup: "Backup iOS cifrato",
  backupPassword: "Password del backup",
  passwordHelp:
    "Usata localmente per questa analisi, senza salvarla. I file decifrati vengono eliminati insieme alla sessione.",
  decrypting: "Apertura del backup cifrato",
  title: "Analizza localmente",
  evidence: "Scegli cartella delle prove",
  rules: "Carica regole firmate",
  run: "Analizza dati selezionati",
  cancel: "Annulla",
  progress: "Avanzamento analisi",
  pauseMotion: "Metti in pausa le animazioni",
  resumeMotion: "Riprendi le animazioni",
  pauseLabel: "Pausa",
  resumeLabel: "Riprendi",
  acquiring: "Copia sul tuo computer",
  analyzing: "Ricerca di spyware",
  forensics: "Analisi approfondita",
  finalizing: "Preparazione del rapporto",
  network: "Controllo delle connessioni",
  capturing: "Osservazione delle connessioni",
  localProcessing: "Tutto avviene sul tuo computer",
  completed: "Analisi completata",
  failed: "Impossibile completare l’analisi",
  consent: "Questo telefono è mio o il proprietario mi ha dato il permesso",
  device: "Dispositivo",
  usb: "Telefono collegato",
  deviceLocked:
    "L’iPhone era bloccato. Sbloccalo, lascia lo schermo acceso e premi «Riprova».",
  awaiting_trust: "Tocca «Autorizza» sul tuo iPhone",
  awaiting_passcode: "Inserisci il codice sul tuo iPhone",
  trustNow: "Sbloccalo e accetta. Iniziamo subito.",
  passcodeNow:
    "Serve ad autorizzare la copia. Continuiamo appena lo inserisci.",
  deviceDisconnected:
    "L’iPhone si è scollegato. Controlla il cavo e ricomincia.",
  deviceNotTrusted: "L’iPhone non ha risposto ad «Autorizza».",
  deviceCancelled:
    "La copia è stata annullata sull’iPhone. Premi «Riprova» quando vuoi.",
  elapsed: "Trascorso: {t}",
  remaining: "Tempo rimanente stimato: {t}",
  estimateNote: "Stima basata sull’avanzamento indicato dal telefono.",
  lessThanMinute: "meno di un minuto",
  actCapture:
    "Osserviamo le connessioni dell’iPhone per confrontarle con server di spyware noti · ancora {t}.",
  deepTitle: "Analisi approfondita",
  deepHold: "Non tenerli premuti: chiameresti i soccorsi.",
  usbSlow:
    "Connessione lenta (USB 2.0): la copia può richiedere più di un’ora. Un cavo USB 3 la velocizza.",
  actCopy:
    "Copiamo messaggi, impostazioni e app in una cartella temporanea di questo computer. Tieni il telefono collegato e sbloccato.",
  actDecrypt:
    "Decifriamo la copia con la tua password, solo su questo computer. La password non viene salvata da nessuna parte.",
  actIndicators:
    "Confrontiamo ogni file con {n} indicatori firmati di spyware e stalkerware noti, da fonti pubbliche e di Enigm.",
  actCleanup:
    "Cancelliamo i file temporanei della copia. Su questo computer resta solo il rapporto, se decidi di salvarlo.",
  statDiscarded: "foto e video saltati",
  unlock: "Sbloccalo e accetta l’avviso sul telefono.",
  code: "Chiave di associazione monouso",
  error: "Non è stato possibile completare l’analisi. Riprova.",
  nativeReport: "Analizzato sul tuo computer",
  finishError:
    "Non è stato possibile chiudere la sessione. Il rapporto resta disponibile. Attendi il completamento dell’operazione e riprova.",
  failNotAuthorized:
    "Il telefono non era disponibile all’avvio. Controlla che sia ancora collegato e sbloccato e, su Android, che il debug USB sia stato accettato. Poi cercalo di nuovo.",
  failAdbExpired:
    "La connessione USB con il telefono si è chiusa. Cercalo di nuovo per ricominciare.",
  failCopy:
    "Non è stato possibile copiare il telefono. Controlla che il cavo sia ancora collegato e lo schermo sbloccato, poi ricomincia.",
  failBusy:
    "C’è già un’analisi in corso. Attendi che finisca o annullala nella finestra di Enigm Scan.",
  failAppleUsb:
    "Per controllare un iPhone, questo computer ha bisogno del servizio USB di Apple: su Windows installa Apple Devices dal Microsoft Store; su Linux installa usbmuxd. Poi riprova.",
  failIphoneMissing:
    "Non troviamo l’iPhone. Controlla che sia collegato e sbloccato. Su Windows serve Apple Devices dal Microsoft Store; su Linux, usbmuxd.",
  failAdbStart:
    "Lo strumento USB per Android ha impiegato troppo ad avviarsi. Riprova; se succede di nuovo, riavvia il computer.",
  failIosStart:
    "Il componente per iPhone ha impiegato troppo ad avviarsi; la prima volta un antivirus potrebbe analizzarlo. Riprova.",
  passcode_retry: "Inserisci di nuovo il codice",
  passcodeRetryNow:
    "L’iPhone ha chiuso la richiesta del codice senza risposta, quindi la copia ricomincia. Sbloccalo e inserisci il codice quando lo chiede.",
  waitLeft: "Tempo di attesa rimanente: {t}",
  deviceTrustDenied: "«Autorizza» è stato rifiutato sull’iPhone.",
  devicePasscodeTimeout:
    "L’iPhone ha chiuso più volte la richiesta del codice senza risposta. Premi «Riprova» e inserisci il codice quando compare.",
  androidAllow: "Accetta «Consentire il debug USB» sul telefono.",
  androidAllowTimeout:
    "Il telefono non ha consentito il debug USB entro 3 minuti. Sbloccalo e premi «Riprova».",
  enginesMissing:
    "Mancano parti di Enigm Scan su questo computer; forse le ha rimosse un antivirus. Scarica di nuovo Enigm Scan da scan.enigm.io.",
  noEngines:
    "I motori USB o forensi non sono disponibili in questa versione. Puoi verificare file locali con copertura ridotta.",
  files: "Prove locali esistenti",
  method: "Metodo di analisi",
  ready: "Pronto",
  ruleVersion: "Versione attiva delle regole",
  capError:
    "Regole assenti, scadute o non valide. Carica un aggiornamento firmato valido prima dell’analisi.",
  stepConnect: "Collega",
  stepCopy: "Copia locale",
  stepExtract: "Estrai",
  stepAnalyze: "Analizza",
  stepReport: "Rapporto",
  phoneTrustTitle: "Autorizzare questo computer?",
  phoneTrustNo: "Non autorizzare",
  phoneTrustYes: "Autorizza",
  phonePasscode: "Inserisci il codice",
  phoneKeep: "Lascialo collegato",
  noteCodeMaybe: "se richiesto, inseriscilo sull’iPhone",
};
const pt: AgentCopy = {
  backupError:
    "Não foi possível decifrar a cópia completamente. Verifique a palavra-passe e a integridade e tente novamente. A análise não está concluída.",
  encryptedBackup: "Cópia iOS cifrada",
  backupPassword: "Palavra-passe da cópia",
  passwordHelp:
    "Usada localmente nesta análise, sem ser guardada. Os ficheiros decifrados são eliminados com a sessão.",
  decrypting: "A abrir a cópia encriptada",
  title: "Analisar localmente",
  evidence: "Escolher pasta de evidências",
  rules: "Carregar regras assinadas",
  run: "Analisar dados selecionados",
  cancel: "Cancelar",
  progress: "Progresso da análise",
  pauseMotion: "Pausar animações",
  resumeMotion: "Retomar animações",
  pauseLabel: "Pausar",
  resumeLabel: "Retomar",
  acquiring: "A copiar para o seu computador",
  analyzing: "À procura de spyware",
  forensics: "Análise aprofundada",
  finalizing: "A preparar o seu relatório",
  network: "A verificar ligações",
  capturing: "A observar ligações",
  localProcessing: "Tudo acontece no seu computador",
  completed: "Análise concluída",
  failed: "Não foi possível concluir a análise",
  consent: "Este telemóvel é meu ou o dono deu-me autorização",
  device: "Dispositivo",
  usb: "Telefone ligado",
  deviceLocked:
    "O iPhone estava bloqueado. Desbloqueie-o, deixe o ecrã ligado e prima «Tentar novamente».",
  awaiting_trust: "Toque em «Confiar» no seu iPhone",
  awaiting_passcode: "Introduza o código no seu iPhone",
  trustNow: "Desbloqueie-o e aceite. Começamos de imediato.",
  passcodeNow:
    "Serve para autorizar a cópia. Continuamos assim que o introduzires.",
  deviceDisconnected: "O iPhone desligou-se. Verifique o cabo e recomece.",
  deviceNotTrusted: "O iPhone não respondeu a «Confiar».",
  deviceCancelled:
    "A cópia foi cancelada no iPhone. Prima «Tentar novamente» quando quiser.",
  elapsed: "Decorrido: {t}",
  remaining: "Tempo restante estimado: {t}",
  estimateNote: "Estimativa com base no progresso indicado pelo telefone.",
  lessThanMinute: "menos de um minuto",
  actCapture:
    "A observar as ligações do iPhone para as comparar com servidores de spyware conhecidos · faltam {t}.",
  deepTitle: "Análise profunda",
  deepHold: "Não os mantenha premidos: ligaria para a emergência.",
  usbSlow:
    "Ligação lenta (USB 2.0): a cópia pode demorar mais de uma hora. Um cabo USB 3 acelera-a.",
  actCopy:
    "A copiar mensagens, definições e apps para uma pasta temporária deste computador. Mantenha o telemóvel ligado e desbloqueado.",
  actDecrypt:
    "A desencriptar a cópia com a sua palavra-passe, só neste computador. A palavra-passe não fica guardada em lado nenhum.",
  actIndicators:
    "A comparar cada ficheiro com {n} indicadores assinados de spyware e stalkerware conhecidos, de fontes públicas e da Enigm.",
  actCleanup:
    "A apagar os ficheiros temporários da cópia. Este computador só guarda o relatório, se decidir guardá-lo.",
  statDiscarded: "fotos e vídeos saltados",
  unlock: "Desbloqueie-o e aceite o aviso no telemóvel.",
  code: "Chave de emparelhamento de utilização única",
  error: "Não foi possível concluir a análise. Tente novamente.",
  nativeReport: "Analisado no seu computador",
  finishError:
    "Não foi possível encerrar a sessão. O relatório continua disponível. Aguarda o fim da operação e tenta novamente.",
  failNotAuthorized:
    "O telemóvel não estava disponível ao começar. Confirme que continua ligado e desbloqueado e, no Android, que aceitou a depuração USB. Depois, procure-o de novo.",
  failAdbExpired:
    "A ligação USB com o telemóvel fechou-se. Procure-o de novo para recomeçar.",
  failCopy:
    "Não foi possível copiar o telemóvel. Confirme que o cabo continua ligado e o ecrã desbloqueado, e recomece.",
  failBusy:
    "Já há uma análise em curso. Aguarde que termine ou cancele-a na janela do Enigm Scan.",
  failAppleUsb:
    "Para verificar um iPhone, este computador precisa do serviço USB da Apple: no Windows, instale o Apple Devices a partir da Microsoft Store; no Linux, instale o usbmuxd. Depois, tente novamente.",
  failIphoneMissing:
    "Não encontramos o iPhone. Confirme que está ligado e desbloqueado. No Windows é necessário o Apple Devices, da Microsoft Store; no Linux, o usbmuxd.",
  failAdbStart:
    "A ferramenta USB do Android demorou demasiado a arrancar. Tente novamente; se voltar a acontecer, reinicie o computador.",
  failIosStart:
    "O componente do iPhone demorou demasiado a arrancar; na primeira vez, um antivírus pode estar a analisá-lo. Tente novamente.",
  passcode_retry: "Introduza o código de novo",
  passcodeRetryNow:
    "O iPhone fechou o pedido do código sem resposta, por isso a cópia recomeça. Desbloqueie-o e introduza o código quando o pedir.",
  waitLeft: "Tempo de espera restante: {t}",
  deviceTrustDenied: "«Confiar» foi recusado no iPhone.",
  devicePasscodeTimeout:
    "O iPhone fechou várias vezes o pedido do código sem resposta. Prima «Tentar novamente» e introduza o código quando aparecer.",
  androidAllow: "Aceite «Permitir depuração USB» no telemóvel.",
  androidAllowTimeout:
    "O telemóvel não permitiu a depuração USB em 3 minutos. Desbloqueie-o e prima «Tentar novamente».",
  enginesMissing:
    "Faltam partes do Enigm Scan neste computador; talvez um antivírus as tenha removido. Descarregue de novo o Enigm Scan em scan.enigm.io.",
  noEngines:
    "Os motores USB ou forenses não estão disponíveis nesta compilação. As verificações locais continuam disponíveis com cobertura reduzida.",
  files: "Evidências locais existentes",
  method: "Método de análise",
  ready: "Pronto",
  ruleVersion: "Versão ativa das regras",
  capError:
    "Regras indisponíveis, expiradas ou inválidas. Carregue uma atualização assinada válida antes de analisar.",
  stepConnect: "Ligar",
  stepCopy: "Cópia local",
  stepExtract: "Extrair",
  stepAnalyze: "Analisar",
  stepReport: "Relatório",
  phoneTrustTitle: "Confiar neste computador?",
  phoneTrustNo: "Não confiar",
  phoneTrustYes: "Confiar",
  phonePasscode: "Introduza o código",
  phoneKeep: "Deixe-o ligado",
  noteCodeMaybe: "se for pedido, introduza-o no iPhone",
};
export const agentDictionaries: Record<Language, AgentCopy> = {
  en,
  es,
  fr,
  de,
  it,
  pt,
};
