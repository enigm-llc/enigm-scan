import type { Language } from "./i18n";

/**
 * Texts written by the behaviour, link, profile and iPhone diagnostics
 * engines (agent/core behavior.rs, links.rs, extractions.rs and
 * ios_diagnostics.rs). Kept apart from native.ts, which they extend.
 */
type T = Record<Language, string>;
const t = (
  es: string,
  en: string,
  fr: string,
  de: string,
  it: string,
  pt: string,
): T => ({ es, en, fr, de, it, pt });

/** Whole sentences: recommendations and limitations. Groups are kept as-is. */
export const EXTRA_TEXTS: Array<[RegExp, T]> = [
  [
    /^Related network evidence (\S+) matches the same signed indicator within five minutes\./,
    t(
      "La evidencia de red {0} coincide con el mismo indicador firmado en menos de cinco minutos. No se verifica la precisión del reloj; esta relación no confirma una infección.",
      "Related network evidence {0} matches the same signed indicator within five minutes. Clock accuracy is not verified; this link does not confirm an infection.",
      "L’élément réseau {0} correspond au même indicateur signé à moins de cinq minutes d’écart. La précision de l’horloge n’est pas vérifiée ; ce lien ne confirme pas une infection.",
      "Der Netzwerkhinweis {0} passt innerhalb von fünf Minuten zum selben signierten Indikator. Die Uhrzeit wird nicht geprüft; dieser Zusammenhang bestätigt keine Infektion.",
      "L’elemento di rete {0} corrisponde allo stesso indicatore firmato entro cinque minuti. La precisione dell’orologio non è verificata; questo legame non conferma un’infezione.",
      "O vestígio de rede {0} corresponde ao mesmo indicador assinado em menos de cinco minutos. A precisão do relógio não é verificada; esta relação não confirma uma infeção.",
    ),
  ],
  [
    /^Related forensic event (\S+) matches the same signed indicator within five minutes\./,
    t(
      "El evento del móvil {0} coincide con el mismo indicador firmado en menos de cinco minutos. No se ha aumentado la gravedad ni la confianza.",
      "Related phone event {0} matches the same signed indicator within five minutes. Severity and confidence were not increased.",
      "L’événement du téléphone {0} correspond au même indicateur signé à moins de cinq minutes d’écart. La gravité et la confiance n’ont pas été augmentées.",
      "Das Telefonereignis {0} passt innerhalb von fünf Minuten zum selben signierten Indikator. Schweregrad und Vertrauen wurden nicht erhöht.",
      "L’evento del telefono {0} corrisponde allo stesso indicatore firmato entro cinque minuti. Gravità e affidabilità non sono state aumentate.",
      "O evento do telemóvel {0} corresponde ao mesmo indicador assinado em menos de cinco minutos. A gravidade e a confiança não foram aumentadas.",
    ),
  ],
  [
    /^Matched as a subdomain of the published domain (.+), which its registrant controls\.$/,
    t(
      "Coincide como subdominio del dominio publicado {0}, que controla quien lo registró.",
      "Matched as a subdomain of the published domain {0}, which its registrant controls.",
      "Correspondance en tant que sous-domaine du domaine publié {0}, contrôlé par son titulaire.",
      "Als Subdomain der veröffentlichten Domain {0} erkannt, die ihr Inhaber kontrolliert.",
      "Corrisponde come sottodominio del dominio pubblicato {0}, controllato da chi lo ha registrato.",
      "Corresponde como subdomínio do domínio publicado {0}, controlado por quem o registou.",
    ),
  ],
  [
    /^Only authorized, accessible artifacts were checked\./,
    t(
      "Solo se revisaron los datos autorizados y accesibles. No encontrar indicios no garantiza que el móvil sea seguro, y una coincidencia no confirma una infección.",
      "Only authorised, accessible data was checked. Finding nothing does not guarantee the phone is safe, and a match does not confirm an infection.",
      "Seules les données autorisées et accessibles ont été vérifiées. Ne rien trouver ne garantit pas que le téléphone est sûr, et une correspondance ne confirme pas une infection.",
      "Nur autorisierte, zugängliche Daten wurden geprüft. Kein Fund garantiert keine Sicherheit, und ein Treffer bestätigt keine Infektion.",
      "Sono stati controllati solo i dati autorizzati e accessibili. Non trovare nulla non garantisce che il telefono sia sicuro, e una corrispondenza non conferma un’infezione.",
      "Só foram verificados os dados autorizados e acessíveis. Não encontrar nada não garante que o telemóvel esteja seguro, e uma correspondência não confirma uma infeção.",
    ),
  ],
  [
    /^If you did not modify this phone, treat it as compromised/,
    t(
      "Si no modificaste tú este móvil, trátalo como comprometido: deja de usarlo para comunicaciones sensibles y haz que lo revise un experto.",
      "If you did not modify this phone, treat it as compromised: stop using it for sensitive conversations and have it examined by an expert.",
      "Si vous n’avez pas modifié ce téléphone, considérez-le comme compromis : cessez de l’utiliser pour des échanges sensibles et faites-le examiner par un expert.",
      "Wenn Sie dieses Gerät nicht selbst verändert haben, betrachten Sie es als kompromittiert: Nutzen Sie es nicht mehr für vertrauliche Kommunikation und lassen Sie es prüfen.",
      "Se non hai modificato tu questo telefono, consideralo compromesso: smetti di usarlo per comunicazioni sensibili e fallo esaminare da un esperto.",
      "Se não modificou este telemóvel, trate-o como comprometido: deixe de o usar para comunicações sensíveis e peça a um especialista que o analise.",
    ),
  ],
  [
    /^Review point: rooting or unlocking a phone/,
    t(
      "Punto a revisar: a veces es el propio dueño quien rootea o desbloquea el móvil. Aun así, elimina las protecciones que frenan al spyware y le permite esconderse de análisis como este.",
      "Point to review: owners sometimes root or unlock their own phone. It still removes the protections that keep spyware out and lets it hide from scans like this one.",
      "Point à vérifier : il arrive que le propriétaire roote ou déverrouille lui-même son téléphone. Cela supprime pourtant les protections contre les logiciels espions et leur permet de se cacher d’analyses comme celle-ci.",
      "Zu prüfender Punkt: Manchmal rootet oder entsperrt der Besitzer sein Gerät selbst. Dennoch entfallen damit Schutzmechanismen gegen Spyware, die sich so vor Analysen wie dieser verbergen kann.",
      "Punto da verificare: a volte è il proprietario a fare il root o a sbloccare il telefono. Ciò rimuove comunque le protezioni contro lo spyware e gli permette di nascondersi da analisi come questa.",
      "Ponto a rever: às vezes é o próprio dono que faz root ou desbloqueia o telemóvel. Ainda assim, isso remove as proteções contra spyware e permite-lhe esconder-se de análises como esta.",
    ),
  ],
  [
    /^Behavioural detection: no published indicator names this app/,
    t(
      "Detección por comportamiento: ningún indicador publicado nombra esta app, pero combina ocultarse con funciones de vigilancia, como hacen el stalkerware y el spyware mercenario.",
      "Behavioural detection: no published indicator names this app, but it combines hiding with surveillance features, as stalkerware and mercenary spyware do.",
      "Détection comportementale : aucun indicateur publié ne cite cette application, mais elle combine dissimulation et fonctions de surveillance, comme les stalkerwares et les logiciels espions mercenaires.",
      "Verhaltenserkennung: Kein veröffentlichter Indikator nennt diese App, doch sie verbindet Verstecken mit Überwachungsfunktionen, wie Stalkerware und Söldner-Spyware.",
      "Rilevamento comportamentale: nessun indicatore pubblicato cita questa app, ma unisce occultamento e funzioni di sorveglianza, come lo stalkerware e lo spyware mercenario.",
      "Deteção por comportamento: nenhum indicador publicado nomeia esta app, mas ela junta esconder-se a funções de vigilância, como o stalkerware e o spyware mercenário.",
    ),
  ],
  [
    /^Parental-control, anti-theft and device-management tools/,
    t(
      "Las apps de control parental, antirrobo o gestión de dispositivos pueden comportarse igual si el dueño las instala a sabiendas.",
      "Parental control, anti-theft and device management apps can behave the same way when the owner installs them knowingly.",
      "Les applications de contrôle parental, antivol ou de gestion d’appareils peuvent se comporter de la même façon si le propriétaire les installe en connaissance de cause.",
      "Kinderschutz-, Diebstahlschutz- und Geräteverwaltungs-Apps können sich genauso verhalten, wenn der Besitzer sie bewusst installiert.",
      "Le app di controllo parentale, antifurto o gestione dei dispositivi possono comportarsi allo stesso modo se il proprietario le installa consapevolmente.",
      "As apps de controlo parental, antirroubo ou gestão de dispositivos podem comportar-se da mesma forma se o dono as instalar de propósito.",
    ),
  ],
  [
    /^If you did not install this app yourself, do not uninstall it yet/,
    t(
      "Si no instalaste tú esta app, no la desinstales todavía: conserva el informe, aleja el móvil de conversaciones sensibles y contacta con un especialista en respuesta a incidentes o una organización de apoyo a personas vigiladas.",
      "If you did not install this app yourself, do not uninstall it yet: keep the report, keep the phone away from sensitive conversations and contact an incident responder or an organisation that supports people under surveillance.",
      "Si vous n’avez pas installé cette application vous-même, ne la désinstallez pas encore : conservez le rapport, éloignez le téléphone des conversations sensibles et contactez un spécialiste de la réponse aux incidents ou une association d’aide aux personnes surveillées.",
      "Wenn Sie diese App nicht selbst installiert haben, deinstallieren Sie sie noch nicht: Bewahren Sie den Bericht auf, halten Sie das Gerät von vertraulichen Gesprächen fern und wenden Sie sich an Fachleute für Vorfallsreaktion oder eine Hilfsorganisation für Überwachte.",
      "Se non hai installato tu questa app, non disinstallarla ancora: conserva il rapporto, tieni il telefono lontano da conversazioni sensibili e contatta uno specialista di risposta agli incidenti o un’organizzazione di supporto alle persone sorvegliate.",
      "Se não instalou esta app, não a desinstale ainda: guarde o relatório, afaste o telemóvel de conversas sensíveis e contacte um especialista em resposta a incidentes ou uma organização de apoio a pessoas vigiadas.",
    ),
  ],
  [
    /^Review point: these capabilities are needed by some legitimate apps/,
    t(
      "Punto a revisar: algunas apps legítimas necesitan estos accesos (gestores de contraseñas, herramientas de accesibilidad, apps de relojes, suites de seguridad). Por sí solos no indican una infección.",
      "Point to review: some legitimate apps need this access (password managers, accessibility tools, smartwatch apps, security suites). On its own it is not a sign of infection.",
      "Point à vérifier : certaines applications légitimes ont besoin de ces accès (gestionnaires de mots de passe, outils d’accessibilité, applications de montre, suites de sécurité). À eux seuls, ils n’indiquent pas une infection.",
      "Zu prüfender Punkt: Manche seriösen Apps brauchen diese Zugriffe (Passwortmanager, Bedienungshilfen, Smartwatch-Apps, Sicherheitssuiten). Für sich allein sind sie kein Hinweis auf eine Infektion.",
      "Punto da verificare: alcune app legittime hanno bisogno di questi accessi (gestori di password, strumenti di accessibilità, app per smartwatch, suite di sicurezza). Da soli non indicano un’infezione.",
      "Ponto a rever: algumas apps legítimas precisam destes acessos (gestores de palavras-passe, ferramentas de acessibilidade, apps de relógio, suites de segurança). Por si só não indicam uma infeção.",
    ),
  ],
  [
    /^Check that you recognise this app and installed it yourself/,
    t(
      "Comprueba que reconoces esta app y que la instalaste tú. Si no, quítale los accesos especiales en Ajustes y pide la revisión de un experto.",
      "Check that you recognise this app and installed it yourself. If not, remove its special access in Settings and ask an expert to review it.",
      "Vérifiez que vous reconnaissez cette application et que vous l’avez installée vous-même. Sinon, retirez ses accès spéciaux dans les Réglages et faites-la examiner par un expert.",
      "Prüfen Sie, ob Sie diese App kennen und selbst installiert haben. Wenn nicht, entziehen Sie ihr in den Einstellungen die Sonderzugriffe und lassen Sie sie prüfen.",
      "Verifica di riconoscere questa app e di averla installata tu. In caso contrario, revocale gli accessi speciali nelle Impostazioni e falla esaminare da un esperto.",
      "Confirme que reconhece esta app e que foi instalada por si. Se não, retire-lhe os acessos especiais nas Definições e peça a um especialista que a reveja.",
    ),
  ],
  [
    /^Review point: the domain imitates a trusted brand/,
    t(
      "Punto a revisar: el dominio imita una marca de confianza o usa una dirección IP. El spyware y el phishing suelen llegar así, pero esto no demuestra que se abriera el enlace ni que se instalara nada.",
      "Point to review: the domain imitates a trusted brand or uses a bare address. Spyware and phishing often arrive this way, but this does not show the link was opened or anything installed.",
      "Point à vérifier : le domaine imite une marque de confiance ou utilise une adresse IP. Les logiciels espions et le phishing arrivent souvent ainsi, mais cela ne prouve pas que le lien a été ouvert ni que quelque chose a été installé.",
      "Zu prüfender Punkt: Die Domain ahmt eine vertrauenswürdige Marke nach oder nutzt eine reine IP-Adresse. Spyware und Phishing kommen oft so, doch das zeigt nicht, dass der Link geöffnet oder etwas installiert wurde.",
      "Punto da verificare: il dominio imita un marchio affidabile o usa un indirizzo IP. Spyware e phishing arrivano spesso così, ma ciò non dimostra che il link sia stato aperto o che sia stato installato qualcosa.",
      "Ponto a rever: o domínio imita uma marca de confiança ou usa um endereço IP. O spyware e o phishing chegam muitas vezes assim, mas isto não mostra que a ligação foi aberta nem que algo foi instalado.",
    ),
  ],
  [
    /^Do not open the link\./,
    t(
      "No abras el enlace. Si ya lo abriste, anota cuándo, deja el móvil como está y pide a un experto que lo revise: la fecha le ayuda a buscar rastros.",
      "Do not open the link. If you already opened it, note when, leave the phone as it is and ask an expert to review it: the date helps them look for traces.",
      "N’ouvrez pas le lien. Si vous l’avez déjà ouvert, notez quand, laissez le téléphone en l’état et faites-le examiner par un expert : la date l’aide à chercher des traces.",
      "Öffnen Sie den Link nicht. Falls Sie ihn schon geöffnet haben, notieren Sie den Zeitpunkt, lassen Sie das Gerät unverändert und lassen Sie es prüfen: Das Datum hilft bei der Spurensuche.",
      "Non aprire il link. Se l’hai già aperto, annota quando, lascia il telefono com’è e fallo esaminare da un esperto: la data aiuta a cercare tracce.",
      "Não abra a ligação. Se já a abriu, anote quando, deixe o telemóvel como está e peça a um especialista que o reveja: a data ajuda a procurar vestígios.",
    ),
  ],
  [
    /^Review point: schools, employers and some VPN or filtering apps/,
    t(
      "Punto a revisar: colegios, empresas y algunas apps de VPN o filtrado instalan estos perfiles a propósito. El stalkerware y los ataques dirigidos también los usan para leer el tráfico o controlar el móvil.",
      "Point to review: schools, employers and some VPN or filtering apps install such profiles on purpose. Stalkerware and targeted attacks also use them to read traffic or control the phone.",
      "Point à vérifier : écoles, employeurs et certaines applications de VPN ou de filtrage installent ces profils volontairement. Les stalkerwares et les attaques ciblées s’en servent aussi pour lire le trafic ou contrôler le téléphone.",
      "Zu prüfender Punkt: Schulen, Arbeitgeber und manche VPN- oder Filter-Apps installieren solche Profile bewusst. Stalkerware und gezielte Angriffe nutzen sie ebenfalls, um Verkehr mitzulesen oder das Gerät zu steuern.",
      "Punto da verificare: scuole, aziende e alcune app di VPN o filtraggio installano questi profili di proposito. Anche lo stalkerware e gli attacchi mirati li usano per leggere il traffico o controllare il telefono.",
      "Ponto a rever: escolas, empresas e algumas apps de VPN ou filtragem instalam estes perfis de propósito. O stalkerware e os ataques dirigidos também os usam para ler o tráfego ou controlar o telemóvel.",
    ),
  ],
  [
    /^If you do not recognise this profile, remove it/,
    t(
      "Si no reconoces este perfil, elimínalo en Ajustes > General > VPN y gestión de dispositivos y pide a un experto que revise el móvil.",
      "If you do not recognise this profile, remove it in Settings > General > VPN & Device Management and ask an expert to review the phone.",
      "Si vous ne reconnaissez pas ce profil, supprimez-le dans Réglages > Général > VPN et gestion de l’appareil et faites examiner le téléphone par un expert.",
      "Wenn Sie dieses Profil nicht kennen, entfernen Sie es unter Einstellungen > Allgemein > VPN und Geräteverwaltung und lassen Sie das Gerät prüfen.",
      "Se non riconosci questo profilo, rimuovilo in Impostazioni > Generali > VPN e gestione dispositivi e fai esaminare il telefono da un esperto.",
      "Se não reconhece este perfil, remova-o em Definições > Geral > VPN e gestão de dispositivos e peça a um especialista que reveja o telemóvel.",
    ),
  ],
  [
    /^Behavioural detection: no published indicator names this process/,
    t(
      "Detección por comportamiento: ningún indicador publicado nombra este proceso. Pegasus se ejecutó desde carpetas así, y las herramientas de jailbreak también pueden hacerlo. Un iPhone con jailbreak pierde además las protecciones que frenan al spyware.",
      "Behavioural detection: no published indicator names this process. Pegasus ran from such folders, and jailbreak tools can too. A jailbroken iPhone also loses the protections that keep spyware out.",
      "Détection comportementale : aucun indicateur publié ne cite ce processus. Pegasus s’exécutait depuis de tels dossiers, et les outils de jailbreak peuvent aussi le faire. Un iPhone jailbreaké perd en outre les protections contre les logiciels espions.",
      "Verhaltenserkennung: Kein veröffentlichter Indikator nennt diesen Prozess. Pegasus lief aus solchen Ordnern, Jailbreak-Tools können das auch. Ein iPhone mit Jailbreak verliert zudem den Schutz vor Spyware.",
      "Rilevamento comportamentale: nessun indicatore pubblicato cita questo processo. Pegasus veniva eseguito da cartelle simili, e anche gli strumenti di jailbreak possono farlo. Un iPhone con jailbreak perde inoltre le protezioni contro lo spyware.",
      "Deteção por comportamento: nenhum indicador publicado nomeia este processo. O Pegasus executou-se a partir de pastas assim, e as ferramentas de jailbreak também o podem fazer. Um iPhone com jailbreak perde ainda as proteções contra spyware.",
    ),
  ],
  [
    /^Do not reset or update the phone yet/,
    t(
      "No restablezcas ni actualices el móvil todavía: conserva el informe y contacta con un especialista en respuesta a incidentes o una organización de apoyo a personas vigiladas. Reiniciar interrumpe la mayoría del spyware mercenario, pero no elimina la forma de volver a infectar.",
      "Do not reset or update the phone yet: keep the report and contact an incident responder or an organisation that supports people under surveillance. Restarting interrupts most mercenary spyware but does not remove the way back in.",
      "Ne réinitialisez ni ne mettez à jour le téléphone pour l’instant : conservez le rapport et contactez un spécialiste de la réponse aux incidents ou une association d’aide aux personnes surveillées. Un redémarrage interrompt la plupart des logiciels espions mercenaires, mais ne supprime pas le moyen de réinfection.",
      "Setzen Sie das Gerät noch nicht zurück und aktualisieren Sie es nicht: Bewahren Sie den Bericht auf und wenden Sie sich an Fachleute für Vorfallsreaktion oder eine Hilfsorganisation für Überwachte. Ein Neustart unterbricht die meiste Söldner-Spyware, beseitigt aber nicht den Weg zur erneuten Infektion.",
      "Non ripristinare né aggiornare ancora il telefono: conserva il rapporto e contatta uno specialista di risposta agli incidenti o un’organizzazione di supporto alle persone sorvegliate. Il riavvio interrompe la maggior parte dello spyware mercenario, ma non elimina il modo di reinfettarlo.",
      "Não reponha nem atualize o telemóvel ainda: guarde o relatório e contacte um especialista em resposta a incidentes ou uma organização de apoio a pessoas vigiadas. Reiniciar interrompe a maioria do spyware mercenário, mas não elimina a forma de voltar a infetar.",
    ),
  ],
  [
    /^Review point: new iOS versions may use folders/,
    t(
      "Punto a revisar: las versiones nuevas de iOS pueden usar carpetas que este análisis aún no conoce. Por sí solo no indica una infección.",
      "Point to review: new iOS versions may use folders this scan does not know yet. On its own it is not a sign of infection.",
      "Point à vérifier : les nouvelles versions d’iOS peuvent utiliser des dossiers que cette analyse ne connaît pas encore. À lui seul, ce n’est pas un signe d’infection.",
      "Zu prüfender Punkt: Neue iOS-Versionen können Ordner nutzen, die diese Analyse noch nicht kennt. Für sich allein ist das kein Hinweis auf eine Infektion.",
      "Punto da verificare: le nuove versioni di iOS possono usare cartelle che questa analisi non conosce ancora. Da solo non indica un’infezione.",
      "Ponto a rever: as versões novas do iOS podem usar pastas que esta análise ainda não conhece. Por si só não indica uma infeção.",
    ),
  ],
  [
    /^Ask an expert to review the process if you cannot identify it\.$/,
    t(
      "Si no sabes qué proceso es, pide a un experto que lo revise.",
      "If you cannot identify the process, ask an expert to review it.",
      "Si vous ne parvenez pas à identifier le processus, faites-le examiner par un expert.",
      "Wenn Sie den Prozess nicht zuordnen können, lassen Sie ihn prüfen.",
      "Se non riesci a identificare il processo, fallo esaminare da un esperto.",
      "Se não conseguir identificar o processo, peça a um especialista que o reveja.",
    ),
  ],
  [
    /^Review point: zero-click exploits such as FORCEDENTRY and BLASTPASS/,
    t(
      "Punto a revisar: ataques sin clic como FORCEDENTRY y BLASTPASS llegaron por estos servicios, y los intentos fallidos los hacen fallar. Un mensaje malformado pero inofensivo también puede hacerlo.",
      "Point to review: zero-click attacks such as FORCEDENTRY and BLASTPASS arrived through these services, and failed attempts crash them. A malformed but harmless message can crash them too.",
      "Point à vérifier : des attaques sans clic comme FORCEDENTRY et BLASTPASS sont passées par ces services, et les tentatives ratées les font planter. Un message mal formé mais inoffensif peut aussi le faire.",
      "Zu prüfender Punkt: Zero-Click-Angriffe wie FORCEDENTRY und BLASTPASS kamen über diese Dienste, und fehlgeschlagene Versuche bringen sie zum Absturz. Auch eine fehlerhafte, harmlose Nachricht kann das.",
      "Punto da verificare: attacchi zero-click come FORCEDENTRY e BLASTPASS sono arrivati da questi servizi, e i tentativi falliti li fanno arrestare. Anche un messaggio malformato ma innocuo può farlo.",
      "Ponto a rever: ataques sem clique como FORCEDENTRY e BLASTPASS chegaram por estes serviços, e as tentativas falhadas fazem-nos falhar. Uma mensagem malformada mas inofensiva também o pode fazer.",
    ),
  ],
  [
    /^Note who wrote to you around those times\./,
    t(
      "Anota quién te escribió en esos momentos. Si corres riesgo de vigilancia dirigida, activa el Modo de Aislamiento y pide a un experto que revise el móvil.",
      "Note who wrote to you around those times. If you are at risk of targeted surveillance, turn on Lockdown Mode and ask an expert to review the phone.",
      "Notez qui vous a écrit à ces moments-là. Si vous risquez une surveillance ciblée, activez le mode Isolement et faites examiner le téléphone par un expert.",
      "Notieren Sie, wer Ihnen zu diesen Zeiten geschrieben hat. Wenn Ihnen gezielte Überwachung droht, aktivieren Sie den Blockierungsmodus und lassen Sie das Gerät prüfen.",
      "Annota chi ti ha scritto in quei momenti. Se rischi una sorveglianza mirata, attiva la modalità di isolamento e fai esaminare il telefono da un esperto.",
      "Anote quem lhe escreveu nesses momentos. Se corre risco de vigilância dirigida, ative o Modo de Bloqueio e peça a um especialista que reveja o telemóvel.",
    ),
  ],
];

/** Phrases that Enigm composes into evidence lines, longest first. */
export const FRAGMENTS: Array<[string, T]> = [
  [
    "disabled Google Play Services apps verification",
    t(
      "verificación de apps de Google Play Services desactivada",
      "disabled Google Play Services apps verification",
      "vérification des applications par Google Play Services désactivée",
      "App-Überprüfung der Google-Play-Dienste deaktiviert",
      "verifica delle app di Google Play Services disattivata",
      "verificação de apps dos Serviços do Google Play desativada",
    ),
  ],
  [
    "disabled Google Play Protect",
    t(
      "Google Play Protect desactivado",
      "disabled Google Play Protect",
      "Google Play Protect désactivé",
      "Google Play Protect deaktiviert",
      "Google Play Protect disattivato",
      "Google Play Protect desativado",
    ),
  ],
  [
    "disabled APK package verification",
    t(
      "verificación de paquetes APK desactivada",
      "disabled APK package verification",
      "vérification des paquets APK désactivée",
      "APK-Paketprüfung deaktiviert",
      "verifica dei pacchetti APK disattivata",
      "verificação de pacotes APK desativada",
    ),
  ],
  [
    "disabled confirmation of adb apps installation",
    t(
      "confirmación de instalación de apps por ADB desactivada",
      "disabled confirmation of adb apps installation",
      "confirmation d’installation d’applications par ADB désactivée",
      "Bestätigung für App-Installationen über ADB deaktiviert",
      "conferma dell’installazione di app via ADB disattivata",
      "confirmação de instalação de apps por ADB desativada",
    ),
  ],
  [
    "disabled sharing of security reports",
    t(
      "envío de informes de seguridad desactivado",
      "disabled sharing of security reports",
      "partage des rapports de sécurité désactivé",
      "Teilen von Sicherheitsberichten deaktiviert",
      "condivisione dei rapporti di sicurezza disattivata",
      "partilha de relatórios de segurança desativada",
    ),
  ],
  [
    "disabled sharing of crash logs with manufacturer",
    t(
      "envío de registros de fallos al fabricante desactivado",
      "disabled sharing of crash logs with manufacturer",
      "partage des journaux de plantage avec le fabricant désactivé",
      "Teilen von Absturzprotokollen mit dem Hersteller deaktiviert",
      "condivisione dei log di arresto con il produttore disattivata",
      "partilha de registos de falhas com o fabricante desativada",
    ),
  ],
  [
    "disabled applications errors reports",
    t(
      "informes de errores de apps desactivados",
      "disabled applications errors reports",
      "rapports d’erreurs des applications désactivés",
      "Fehlerberichte von Apps deaktiviert",
      "segnalazioni di errori delle app disattivate",
      "relatórios de erros de apps desativados",
    ),
  ],
  [
    "enabled accessibility services",
    t(
      "servicios de accesibilidad activados",
      "enabled accessibility services",
      "services d’accessibilité activés",
      "Bedienungshilfen-Dienste aktiviert",
      "servizi di accessibilità attivati",
      "serviços de acessibilidade ativados",
    ),
  ],
  [
    "the bootloader is unlocked: the system can be modified with physical access",
    t(
      "el gestor de arranque está desbloqueado: el sistema se puede modificar con acceso físico",
      "the bootloader is unlocked: the system can be modified with physical access",
      "le chargeur d’amorçage est déverrouillé : le système peut être modifié avec un accès physique",
      "der Bootloader ist entsperrt: Das System lässt sich mit physischem Zugriff verändern",
      "il bootloader è sbloccato: il sistema può essere modificato con accesso fisico",
      "o bootloader está desbloqueado: o sistema pode ser modificado com acesso físico",
    ),
  ],
  [
    "the system is signed with test keys (custom or modified firmware)",
    t(
      "el sistema está firmado con claves de prueba (firmware personalizado o modificado)",
      "the system is signed with test keys (custom or modified firmware)",
      "le système est signé avec des clés de test (firmware personnalisé ou modifié)",
      "das System ist mit Testschlüsseln signiert (eigene oder veränderte Firmware)",
      "il sistema è firmato con chiavi di test (firmware personalizzato o modificato)",
      "o sistema está assinado com chaves de teste (firmware personalizado ou modificado)",
    ),
  ],
  [
    "SELinux is permissive: the system's app isolation is disabled",
    t(
      "SELinux está en modo permisivo: el aislamiento entre apps está desactivado",
      "SELinux is permissive: app isolation is turned off",
      "SELinux est permissif : l’isolement des applications est désactivé",
      "SELinux ist permissiv: Die App-Isolation ist deaktiviert",
      "SELinux è permissivo: l’isolamento delle app è disattivato",
      "o SELinux está permissivo: o isolamento entre apps está desativado",
    ),
  ],
  [
    "accessibility service enabled (can read the screen and typing)",
    t(
      "servicio de accesibilidad activado (puede leer la pantalla y lo que escribes)",
      "accessibility service on (can read the screen and typing)",
      "service d’accessibilité activé (peut lire l’écran et la saisie)",
      "Bedienungshilfe aktiv (kann Bildschirm und Eingaben lesen)",
      "servizio di accessibilità attivo (può leggere lo schermo e ciò che scrivi)",
      "serviço de acessibilidade ativo (pode ler o ecrã e o que escreves)",
    ),
  ],
  [
    "installed from an APK file, not from an app store",
    t(
      "instalada desde un archivo APK, no desde una tienda",
      "installed from an APK file, not from an app store",
      "installée depuis un fichier APK, pas depuis une boutique",
      "aus einer APK-Datei installiert, nicht aus einem Store",
      "installata da un file APK, non da uno store",
      "instalada a partir de um ficheiro APK, não de uma loja",
    ),
  ],
  [
    "its name imitates an Android or manufacturer component",
    t(
      "su nombre imita un componente de Android o del fabricante",
      "its name imitates an Android or manufacturer component",
      "son nom imite un composant d’Android ou du fabricant",
      "der Name ahmt eine Android- oder Herstellerkomponente nach",
      "il nome imita un componente di Android o del produttore",
      "o nome imita um componente do Android ou do fabricante",
    ),
  ],
  [
    "notification access (can read messages and codes)",
    t(
      "acceso a notificaciones (puede leer mensajes y códigos)",
      "notification access (can read messages and codes)",
      "accès aux notifications (peut lire messages et codes)",
      "Zugriff auf Mitteilungen (kann Nachrichten und Codes lesen)",
      "accesso alle notifiche (può leggere messaggi e codici)",
      "acesso a notificações (pode ler mensagens e códigos)",
    ),
  ],
  [
    "USB debugging accepts computers without asking",
    t(
      "la depuración USB acepta ordenadores sin preguntar",
      "USB debugging accepts computers without asking",
      "le débogage USB accepte les ordinateurs sans demander",
      "USB-Debugging akzeptiert Computer ohne Nachfrage",
      "il debug USB accetta computer senza chiedere",
      "a depuração USB aceita computadores sem perguntar",
    ),
  ],
  [
    "device administrator (can block its removal)",
    t(
      "administrador del dispositivo (puede impedir que se desinstale)",
      "device administrator (can block its removal)",
      "administrateur de l’appareil (peut empêcher sa suppression)",
      "Geräteadministrator (kann die Deinstallation verhindern)",
      "amministratore del dispositivo (può impedirne la rimozione)",
      "administrador do dispositivo (pode impedir a remoção)",
    ),
  ],
  [
    "always-on VPN (receives all traffic)",
    t(
      "VPN siempre activa (recibe todo el tráfico)",
      "always-on VPN (receives all traffic)",
      "VPN toujours active (reçoit tout le trafic)",
      "dauerhaftes VPN (empfängt den gesamten Verkehr)",
      "VPN sempre attiva (riceve tutto il traffico)",
      "VPN sempre ativa (recebe todo o tráfego)",
    ),
  ],
  [
    "superuser (root) binaries present",
    t(
      "hay binarios de superusuario (root)",
      "superuser (root) binaries present",
      "binaires superutilisateur (root) présents",
      "Superuser-Binärdateien (Root) vorhanden",
      "binari di superutente (root) presenti",
      "binários de superutilizador (root) presentes",
    ),
  ],
  [
    "keyboard enabled (can record typing)",
    t(
      "teclado activado (puede registrar lo que escribes)",
      "keyboard enabled (can record typing)",
      "clavier activé (peut enregistrer la saisie)",
      "Tastatur aktiv (kann Eingaben aufzeichnen)",
      "tastiera attiva (può registrare ciò che scrivi)",
      "teclado ativo (pode registar o que escreves)",
    ),
  ],
  [
    "its name uses system-like words",
    t(
      "su nombre usa palabras de sistema",
      "its name uses system-like words",
      "son nom utilise des mots système",
      "der Name nutzt systemähnliche Wörter",
      "il nome usa parole di sistema",
      "o nome usa palavras de sistema",
    ),
  ],
  [
    "its name refers to monitoring",
    t(
      "su nombre alude a vigilancia",
      "its name refers to monitoring",
      "son nom évoque la surveillance",
      "der Name verweist auf Überwachung",
      "il nome richiama la sorveglianza",
      "o nome refere vigilância",
    ),
  ],
  [
    "the system is a debuggable build",
    t(
      "el sistema es una compilación depurable",
      "the system is a debuggable build",
      "le système est une version débogable",
      "das System ist ein Debug-Build",
      "il sistema è una build di debug",
      "o sistema é uma compilação depurável",
    ),
  ],
  [
    "no icon in the app launcher",
    t(
      "sin icono en el menú de apps",
      "no icon in the app launcher",
      "aucune icône dans le lanceur",
      "kein Symbol im App-Menü",
      "nessuna icona nel launcher",
      "sem ícone no menu de apps",
    ),
  ],
  [
    "permissions granted",
    t(
      "permisos concedidos",
      "permissions granted",
      "autorisations accordées",
      "erteilte Berechtigungen",
      "permessi concessi",
      "permissões concedidas",
    ),
  ],
  [
    "used the microphone while not on screen",
    t(
      "usó el micrófono sin estar en pantalla",
      "used the microphone while not on screen",
      "a utilisé le micro hors écran",
      "nutzte das Mikrofon im Hintergrund",
      "ha usato il microfono fuori dallo schermo",
      "usou o microfone sem estar no ecrã",
    ),
  ],
  [
    "used the camera while not on screen",
    t(
      "usó la cámara sin estar en pantalla",
      "used the camera while not on screen",
      "a utilisé la caméra hors écran",
      "nutzte die Kamera im Hintergrund",
      "ha usato la fotocamera fuori dallo schermo",
      "usou a câmara sem estar no ecrã",
    ),
  ],
  [
    "System integrity",
    t(
      "Integridad del sistema",
      "System integrity",
      "Intégrité du système",
      "Systemintegrität",
      "Integrità del sistema",
      "Integridade do sistema",
    ),
  ],
  [
    "default SMS app",
    t(
      "app de SMS predeterminada",
      "default SMS app",
      "application SMS par défaut",
      "Standard-SMS-App",
      "app SMS predefinita",
      "app de SMS predefinida",
    ),
  ],
  [
    "first installed",
    t(
      "instalada por primera vez",
      "first installed",
      "installée pour la première fois",
      "erstmals installiert",
      "installata per la prima volta",
      "instalada pela primeira vez",
    ),
  ],
  [
    "(phone time)",
    t(
      "(hora del móvil)",
      "(phone time)",
      "(heure du téléphone)",
      "(Gerätezeit)",
      "(ora del telefono)",
      "(hora do telemóvel)",
    ),
  ],
  [
    "pre-installed",
    t(
      "preinstalada",
      "pre-installed",
      "préinstallée",
      "vorinstalliert",
      "preinstallata",
      "pré-instalada",
    ),
  ],
  [
    "installed by",
    t(
      "instalada por",
      "installed by",
      "installée par",
      "installiert von",
      "installata da",
      "instalada por",
    ),
  ],
  [
    "installed from",
    t(
      "instalada desde",
      "installed from",
      "installée depuis",
      "installiert aus",
      "installata da",
      "instalada a partir de",
    ),
  ],
];

const LANGS: Language[] = ["es", "en", "fr", "de", "it", "pt"];
/** Replace Enigm's own phrases inside an evidence line; data stays as it is. */
export function translateFragments(value: string, language: Language) {
  if (language === "en") return value;
  let out = value;
  for (const [english, tr] of FRAGMENTS)
    out = out.split(english).join(tr[language]);
  return out;
}

type Detail = [RegExp, T];
/** Check details of the new engines; {n} are the captured numbers. */
export const EXTRA_DETAILS: Record<string, Detail[]> = {
  android_behavior: [
    [
      /^(\d+) apps not pre-installed were checked for spyware behaviour.*?(\d+) matched the spyware profile and (\d+) are listed for review/s,
      t(
        "{0} apps no preinstaladas revisadas en busca de comportamiento de spyware: iconos ocultos, nombres que imitan al sistema, accesos especiales y permisos sensibles. {1} coinciden con el perfil de spyware y {2} quedan como puntos a revisar. No se ven las apps ocultas por un root o un sistema modificado.",
        "{0} apps not pre-installed checked for spyware behaviour: hidden icons, names imitating the system, special access and sensitive permissions. {1} matched the spyware profile and {2} are points to review. Apps hidden by root or a modified system cannot be seen.",
        "{0} applications non préinstallées vérifiées pour un comportement de logiciel espion : icônes cachées, noms imitant le système, accès spéciaux et autorisations sensibles. {1} correspondent au profil et {2} sont des points à vérifier. Les applications cachées par un root ou un système modifié restent invisibles.",
        "{0} nicht vorinstallierte Apps auf Spyware-Verhalten geprüft: versteckte Symbole, systemähnliche Namen, Sonderzugriffe und sensible Berechtigungen. {1} entsprechen dem Spyware-Profil, {2} sind zu prüfende Punkte. Durch Root oder ein verändertes System versteckte Apps bleiben unsichtbar.",
        "{0} app non preinstallate controllate per comportamenti da spyware: icone nascoste, nomi che imitano il sistema, accessi speciali e permessi sensibili. {1} corrispondono al profilo di spyware e {2} sono punti da verificare. Le app nascoste da root o da un sistema modificato non sono visibili.",
        "{0} apps não pré-instaladas verificadas quanto a comportamento de spyware: ícones ocultos, nomes que imitam o sistema, acessos especiais e permissões sensíveis. {1} correspondem ao perfil de spyware e {2} são pontos a rever. As apps escondidas por root ou um sistema modificado não são visíveis.",
      ),
    ],
  ],
  android_system_integrity: [
    [
      /No sign of a modified system was found/,
      t(
        "Revisados binarios de superusuario, modo de SELinux, firma del sistema, modo depurable y bloqueo del gestor de arranque. Sin señales de un sistema modificado.",
        "Checked superuser binaries, SELinux mode, system signature, debuggable flags and bootloader lock. No sign of a modified system.",
        "Binaires superutilisateur, mode SELinux, signature du système, mode débogable et verrouillage du chargeur d’amorçage vérifiés. Aucun signe de système modifié.",
        "Superuser-Binärdateien, SELinux-Modus, Systemsignatur, Debug-Status und Bootloader-Sperre geprüft. Kein Hinweis auf ein verändertes System.",
        "Controllati binari di superutente, modalità SELinux, firma del sistema, modalità di debug e blocco del bootloader. Nessun segno di sistema modificato.",
        "Verificados binários de superutilizador, modo SELinux, assinatura do sistema, modo depurável e bloqueio do bootloader. Sem sinais de sistema modificado.",
      ),
    ],
    [
      / (\d+) sign\(s\) of a modified system/,
      t(
        "Revisados binarios de superusuario, modo de SELinux, firma del sistema, modo depurable y bloqueo del gestor de arranque. Señales de un sistema modificado: {0}.",
        "Checked superuser binaries, SELinux mode, system signature, debuggable flags and bootloader lock. Signs of a modified system: {0}.",
        "Binaires superutilisateur, mode SELinux, signature du système, mode débogable et verrouillage du chargeur d’amorçage vérifiés. Signes de système modifié : {0}.",
        "Superuser-Binärdateien, SELinux-Modus, Systemsignatur, Debug-Status und Bootloader-Sperre geprüft. Hinweise auf ein verändertes System: {0}.",
        "Controllati binari di superutente, modalità SELinux, firma del sistema, modalità di debug e blocco del bootloader. Segni di sistema modificato: {0}.",
        "Verificados binários de superutilizador, modo SELinux, assinatura do sistema, modo depurável e bloqueio do bootloader. Sinais de sistema modificado: {0}.",
      ),
    ],
  ],
  enigm_link_and_profile_analysis: [
    [
      /(\d+) suspicious domain\(s\).*?; (\d+) profile\(s\) for review/s,
      t(
        "Enlaces de mensajes, historial y consultas DNS revisados en busca de dominios que suplantan marcas, letras parecidas, enlaces a direcciones IP y perfiles capaces de interceptar el tráfico. Dominios sospechosos: {0}. Perfiles a revisar: {1}. Un enlace con aspecto legítimo también puede ser malicioso.",
        "Links in messages, browsing history and DNS lookups checked for domains impersonating brands, look-alike letters, bare IP links and profiles able to intercept traffic. Suspicious domains: {0}. Profiles to review: {1}. A link that looks legitimate can still be malicious.",
        "Liens des messages, historique et requêtes DNS vérifiés pour repérer les domaines usurpant des marques, les lettres trompeuses, les liens vers des adresses IP et les profils capables d’intercepter le trafic. Domaines suspects : {0}. Profils à vérifier : {1}. Un lien d’apparence légitime peut aussi être malveillant.",
        "Links in Nachrichten, Browserverlauf und DNS-Anfragen auf Domains geprüft, die Marken nachahmen, ähnliche Buchstaben, IP-Links und Profile, die Verkehr abfangen können. Verdächtige Domains: {0}. Zu prüfende Profile: {1}. Auch ein seriös wirkender Link kann schädlich sein.",
        "Link nei messaggi, cronologia e richieste DNS controllati per domini che imitano marchi, lettere simili, link a indirizzi IP e profili in grado di intercettare il traffico. Domini sospetti: {0}. Profili da verificare: {1}. Anche un link dall’aspetto legittimo può essere dannoso.",
        "Ligações em mensagens, histórico e consultas DNS verificadas quanto a domínios que imitam marcas, letras semelhantes, ligações para endereços IP e perfis capazes de intercetar o tráfego. Domínios suspeitos: {0}. Perfis a rever: {1}. Uma ligação com aspeto legítimo também pode ser maliciosa.",
      ),
    ],
  ],
  ios_crash_reports: [
    [
      /^(\d+) crash report\(s\).*?read over USB.*?; (\d+) executable\(s\) ran from folders where code never runs/s,
      t(
        "{0} informes de fallos leídos por USB. Los nombres y rutas de los procesos se compararon con los indicadores firmados y con ubicaciones inusuales: {1} se ejecutaron desde carpetas donde nunca se ejecuta código. El iPhone guarda estos informes durante un tiempo limitado.",
        "{0} crash reports read over USB. Process names and paths were compared with the signed indicators and with unusual locations: {1} ran from folders where code never runs. The iPhone keeps these reports for a limited time.",
        "{0} rapports de plantage lus par USB. Les noms et chemins des processus ont été comparés aux indicateurs signés et aux emplacements inhabituels : {1} se sont exécutés depuis des dossiers où aucun code ne s’exécute. L’iPhone conserve ces rapports pendant une durée limitée.",
        "{0} Absturzberichte über USB gelesen. Prozessnamen und -pfade wurden mit den signierten Indikatoren und ungewöhnlichen Orten abgeglichen: {1} liefen aus Ordnern, in denen nie Code läuft. Das iPhone bewahrt diese Berichte nur begrenzt auf.",
        "{0} rapporti di arresto letti via USB. Nomi e percorsi dei processi sono stati confrontati con gli indicatori firmati e con posizioni insolite: {1} sono stati eseguiti da cartelle in cui il codice non viene mai eseguito. L’iPhone conserva questi rapporti per un tempo limitato.",
        "{0} relatórios de falhas lidos por USB. Os nomes e caminhos dos processos foram comparados com os indicadores assinados e com localizações invulgares: {1} executaram-se a partir de pastas onde nunca se executa código. O iPhone guarda estes relatórios durante um tempo limitado.",
      ),
    ],
    [
      /^Crash reports could not be read over USB/,
      t(
        "No se pudieron leer los informes de fallos por USB.",
        "The crash reports could not be read over USB.",
        "Les rapports de plantage n’ont pas pu être lus par USB.",
        "Die Absturzberichte konnten nicht über USB gelesen werden.",
        "Non è stato possibile leggere i rapporti di arresto via USB.",
        "Não foi possível ler os relatórios de falhas por USB.",
      ),
    ],
  ],
  ios_shutdown_log: [
    [
      /^(\d+) reboot record\(s\).*?; (\d+) process\(es\) delayed a reboot/s,
      t(
        "{0} reinicios registrados; {1} procesos retrasaron un reinicio. Cada uno se comparó con los indicadores firmados y se buscaron ejecutables en carpetas inusuales, el método con el que Kaspersky encontró Pegasus.",
        "{0} reboots recorded; {1} processes delayed a reboot. Each was compared with the signed indicators and checked for executables in unusual folders, the method Kaspersky used to find Pegasus.",
        "{0} redémarrages enregistrés ; {1} processus ont retardé un redémarrage. Chacun a été comparé aux indicateurs signés et vérifié pour des exécutables dans des dossiers inhabituels, la méthode avec laquelle Kaspersky a trouvé Pegasus.",
        "{0} Neustarts aufgezeichnet; {1} Prozesse verzögerten einen Neustart. Jeder wurde mit den signierten Indikatoren abgeglichen und auf Programme in ungewöhnlichen Ordnern geprüft, die Methode, mit der Kaspersky Pegasus fand.",
        "{0} riavvii registrati; {1} processi hanno ritardato un riavvio. Ognuno è stato confrontato con gli indicatori firmati e controllato per eseguibili in cartelle insolite, il metodo con cui Kaspersky ha trovato Pegasus.",
        "{0} reinícios registados; {1} processos atrasaram um reinício. Cada um foi comparado com os indicadores assinados e verificado quanto a executáveis em pastas invulgares, o método com que a Kaspersky encontrou o Pegasus.",
      ),
    ],
    [
      /^The phone has no sysdiagnose/,
      t(
        "El iPhone no tiene un sysdiagnose, que guarda el registro de apagado. Para incluirlo, haz el análisis profundo durante la copia.",
        "The iPhone has no sysdiagnose, which holds the shutdown log. To include it, do the deep check during the copy.",
        "L’iPhone n’a pas de sysdiagnose, qui contient le journal d’arrêt. Pour l’inclure, faites l’analyse approfondie pendant la copie.",
        "Das iPhone hat keine Sysdiagnose, die das Ausschaltprotokoll enthält. Um sie einzubeziehen, führen Sie während der Kopie die Tiefenprüfung durch.",
        "L’iPhone non ha un sysdiagnose, che contiene il registro di spegnimento. Per includerlo, esegui l’analisi approfondita durante la copia.",
        "O iPhone não tem um sysdiagnose, que guarda o registo de encerramento. Para o incluir, faça a análise profunda durante a cópia.",
      ),
    ],
    [
      /^A sysdiagnose was still being generated/,
      t(
        "El sysdiagnose aún se estaba generando al terminar. Vuelve a analizar en unos minutos para incluirlo.",
        "The sysdiagnose was still being generated when the scan ended. Scan again in a few minutes to include it.",
        "Le sysdiagnose était encore en cours de création à la fin. Relancez l’analyse dans quelques minutes pour l’inclure.",
        "Die Sysdiagnose wurde am Ende noch erstellt. Analysieren Sie in einigen Minuten erneut, um sie einzubeziehen.",
        "Il sysdiagnose era ancora in preparazione alla fine. Ripeti l’analisi tra qualche minuto per includerlo.",
        "O sysdiagnose ainda estava a ser gerado no fim. Volta a analisar dentro de alguns minutos para o incluir.",
      ),
    ],
    [
      /^The newest sysdiagnose is too large/,
      t(
        "El sysdiagnose más reciente no cabe en el espacio libre del disco; no se leyó su registro de apagado.",
        "The newest sysdiagnose does not fit in the free disk space; its shutdown log was not read.",
        "Le sysdiagnose le plus récent ne tient pas dans l’espace disque libre ; son journal d’arrêt n’a pas été lu.",
        "Die neueste Sysdiagnose passt nicht in den freien Speicher; ihr Ausschaltprotokoll wurde nicht gelesen.",
        "Il sysdiagnose più recente non entra nello spazio libero su disco; il suo registro di spegnimento non è stato letto.",
        "O sysdiagnose mais recente não cabe no espaço livre do disco; o registo de encerramento não foi lido.",
      ),
    ],
    [
      /^The newest sysdiagnose has no shutdown log/,
      t(
        "El sysdiagnose más reciente no incluye registro de apagado.",
        "The newest sysdiagnose has no shutdown log.",
        "Le sysdiagnose le plus récent ne contient pas de journal d’arrêt.",
        "Die neueste Sysdiagnose enthält kein Ausschaltprotokoll.",
        "Il sysdiagnose più recente non contiene il registro di spegnimento.",
        "O sysdiagnose mais recente não inclui registo de encerramento.",
      ),
    ],
    [
      /^The sysdiagnose could not be read over USB/,
      t(
        "No se pudo leer el sysdiagnose por USB; no se analizó el registro de apagado.",
        "The sysdiagnose could not be read over USB; the shutdown log was not analysed.",
        "Le sysdiagnose n’a pas pu être lu par USB ; le journal d’arrêt n’a pas été analysé.",
        "Die Sysdiagnose konnte nicht über USB gelesen werden; das Ausschaltprotokoll wurde nicht analysiert.",
        "Non è stato possibile leggere il sysdiagnose via USB; il registro di spegnimento non è stato analizzato.",
        "Não foi possível ler o sysdiagnose por USB; o registo de encerramento não foi analisado.",
      ),
    ],
  ],
  network_lookalike_domains: [
    [
      /^(\d+) looked-up domain\(s\) imitate a trusted brand(?: \(first (\d+) listed\))?\.$/,
      t(
        "Dominios consultados que imitan una marca de confianza: {0}.",
        "Looked-up domains imitating a trusted brand: {0}.",
        "Domaines consultés imitant une marque de confiance : {0}.",
        "Abgefragte Domains, die eine vertrauenswürdige Marke imitieren: {0}.",
        "Domini consultati che imitano un marchio affidabile: {0}.",
        "Domínios consultados que imitam uma marca de confiança: {0}.",
      ),
    ],
  ],
  network_findings_limit: [
    [
      /./,
      t(
        "Se alcanzó el límite de indicios; el informe está incompleto.",
        "Finding limit reached; the report is incomplete.",
        "Limite de signaux atteinte ; le rapport est incomplet.",
        "Hinweislimit erreicht; der Bericht ist unvollständig.",
        "Raggiunto il limite di indizi; il rapporto è incompleto.",
        "Limite de indícios atingido; o relatório está incompleto.",
      ),
    ],
  ],
  ios_diagnostics_finding_limit: [
    [
      /./,
      t(
        "Se alcanzó el límite de indicios; las trazas de procesos están incompletas.",
        "Finding limit reached; process traces are incomplete.",
        "Limite de signaux atteinte ; les traces de processus sont incomplètes.",
        "Hinweislimit erreicht; die Prozessspuren sind unvollständig.",
        "Raggiunto il limite di indizi; le tracce dei processi sono incomplete.",
        "Limite de indícios atingido; os vestígios de processos estão incompletos.",
      ),
    ],
  ],
};
export const extraLanguages = LANGS;
