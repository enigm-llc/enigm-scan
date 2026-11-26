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
    /^Apple sends this notification when it detects an attack by mercenary spyware/,
    t(
      "Apple envía este aviso cuando detecta un ataque con spyware mercenario contra el móvil. Apple no explica cómo lo detectó ni si el ataque tuvo éxito.",
      "Apple sends this notice when it detects an attack by mercenary spyware against the phone. Apple does not say how it found it or whether the attack succeeded.",
      "Apple envoie cet avis lorsqu’elle détecte une attaque par logiciel espion mercenaire contre le téléphone. Apple n’explique pas comment elle l’a détectée ni si l’attaque a réussi.",
      "Apple sendet diesen Hinweis, wenn es einen Angriff mit Söldner-Spyware auf das Telefon erkennt. Apple erklärt nicht, wie es ihn erkannt hat oder ob der Angriff erfolgreich war.",
      "Apple invia questo avviso quando rileva un attacco con spyware mercenario contro il telefono. Apple non spiega come l’ha rilevato né se l’attacco è riuscito.",
      "A Apple envia este aviso quando deteta um ataque com spyware mercenário contra o telemóvel. A Apple não explica como o detetou nem se o ataque teve êxito.",
    ),
  ],
  [
    /^Follow the steps in Apple's message, turn on Lockdown Mode/,
    t(
      "Sigue los pasos del mensaje de Apple, activa el Modo de aislamiento y pide ayuda experta cuanto antes. No restablezcas el móvil antes de que lo vea un experto.",
      "Follow the steps in Apple’s message, turn on Lockdown Mode and ask for expert help right away. Do not reset the phone before an expert has seen it.",
      "Suivez les étapes du message d’Apple, activez le mode Isolement et demandez sans attendre l’aide d’un expert. Ne réinitialisez pas le téléphone avant qu’un expert l’ait examiné.",
      "Folgen Sie den Schritten in Apples Nachricht, aktivieren Sie den Blockierungsmodus und holen Sie sofort fachkundige Hilfe. Setzen Sie das Telefon nicht zurück, bevor eine Fachperson es gesehen hat.",
      "Segui i passaggi del messaggio di Apple, attiva la modalità di isolamento e chiedi subito l’aiuto di un esperto. Non ripristinare il telefono prima che lo abbia visto un esperto.",
      "Siga os passos da mensagem da Apple, ative o Modo de Isolamento e peça ajuda especializada de imediato. Não reponha o telemóvel antes de um especialista o ver.",
    ),
  ],
  [
    /^Review point: spyware without servers of its own often reports to such hosts/,
    t(
      "Punto a revisar: el spyware que no tiene servidores propios suele enviar sus datos a este tipo de servicios. Pocas apps normales los usan, aunque algunos servicios domésticos y de juegos sí.",
      "Point to review: spyware without servers of its own often reports to such services. Few ordinary apps use them, though some home and gaming services do.",
      "Point à vérifier : les logiciels espions sans serveurs propres envoient souvent leurs données à ce type de service. Peu d’applications ordinaires les utilisent, même si certains services domestiques et de jeu le font.",
      "Zu prüfender Punkt: Spyware ohne eigene Server meldet sich oft bei solchen Diensten. Nur wenige gewöhnliche Apps nutzen sie, einige Heim- und Spieledienste allerdings schon.",
      "Punto da verificare: lo spyware senza server propri invia spesso i dati a servizi di questo tipo. Poche app comuni li usano, anche se alcuni servizi domestici e di gioco sì.",
      "Ponto a rever: o spyware sem servidores próprios envia muitas vezes os dados para este tipo de serviço. Poucas apps comuns os usam, embora alguns serviços domésticos e de jogos o façam.",
    ),
  ],
  [
    /^Find which app uses this host\./,
    t(
      "Averigua qué app usa este servidor. Si no la reconoces, pide a un experto que revise el móvil.",
      "Find out which app uses this server. If you do not recognise it, ask an expert to review the phone.",
      "Identifiez l’application qui utilise ce serveur. Si vous ne la reconnaissez pas, faites examiner le téléphone par un expert.",
      "Finden Sie heraus, welche App diesen Server nutzt. Wenn Sie sie nicht kennen, lassen Sie das Telefon von einer Fachperson prüfen.",
      "Scopri quale app usa questo server. Se non la riconosci, fai esaminare il telefono da un esperto.",
      "Descubra que app usa este servidor. Se não a reconhecer, peça a um especialista que reveja o telemóvel.",
    ),
  ],
  [
    /^Captured for at least 120 seconds, and while the copy ran up to 15 minutes/,
    t(
      "La red se observó al menos 120 segundos, y mientras duró la copia hasta 15 minutos, por el servicio USB autorizado del móvil. Es una observación limitada, no una vigilancia continua ni una prueba de que no haya espionaje.",
      "The network was observed for at least 120 seconds, and while the copy ran up to 15 minutes, through the phone’s authorised USB service. It is a limited observation, not continuous monitoring or proof that there is no surveillance.",
      "Le réseau a été observé au moins 120 secondes, et jusqu’à 15 minutes tant que la copie durait, via le service USB autorisé du téléphone. C’est une observation limitée, pas une surveillance continue ni la preuve d’une absence d’espionnage.",
      "Das Netzwerk wurde mindestens 120 Sekunden und während der Kopie bis zu 15 Minuten über den autorisierten USB-Dienst beobachtet. Das ist eine begrenzte Beobachtung, keine Dauerüberwachung und kein Beweis, dass keine Überwachung stattfindet.",
      "La rete è stata osservata almeno 120 secondi, e fino a 15 minuti mentre durava la copia, tramite il servizio USB autorizzato del telefono. È un’osservazione limitata, non un monitoraggio continuo né una prova di assenza di sorveglianza.",
      "A rede foi observada pelo menos 120 segundos, e até 15 minutos enquanto durou a cópia, através do serviço USB autorizado do telemóvel. É uma observação limitada, não uma monitorização contínua nem prova de que não há vigilância.",
    ),
  ],
  [
    /^Network coverage is partial: the observation did not reach 120 seconds/,
    t(
      "La cobertura de red es parcial: la observación no llegó a 120 segundos o no se pudo verificar. Se analiza el tráfico capturado sin suponer que la observación fue completa.",
      "Network coverage is partial: the observation did not reach 120 seconds or could not be verified. The captured traffic is analysed without assuming a complete observation.",
      "La couverture réseau est partielle : l’observation n’a pas atteint 120 secondes ou n’a pas pu être vérifiée. Le trafic capturé est analysé sans supposer une observation complète.",
      "Die Netzwerkabdeckung ist unvollständig: Die Beobachtung erreichte keine 120 Sekunden oder ließ sich nicht prüfen. Der erfasste Verkehr wird ohne Annahme einer vollständigen Beobachtung analysiert.",
      "La copertura di rete è parziale: l’osservazione non ha raggiunto 120 secondi o non è verificabile. Il traffico catturato è analizzato senza supporre un’osservazione completa.",
      "A cobertura da rede é parcial: a observação não chegou a 120 segundos ou não pôde ser verificada. O tráfego capturado é analisado sem assumir uma observação completa.",
    ),
  ],
  [
    /^IP endpoints, DNS questions and answers, TLS server names and HTTP hosts are decoded/,
    t(
      "Se leen las direcciones IP, las consultas y respuestas DNS, los nombres de servidor de las conexiones cifradas y los hosts HTTP. QUIC (HTTP/3) y el Client Hello cifrado ocultan el nombre del servidor, y el DNS cifrado, los túneles y los paquetes perdidos reducen la cobertura.",
      "IP addresses, DNS questions and answers, the server names of encrypted connections and HTTP hosts are read. QUIC (HTTP/3) and encrypted Client Hello hide the server name, and encrypted DNS, tunnels and lost packets reduce coverage.",
      "Les adresses IP, les requêtes et réponses DNS, les noms de serveur des connexions chiffrées et les hôtes HTTP sont lus. QUIC (HTTP/3) et le Client Hello chiffré masquent le nom du serveur, et le DNS chiffré, les tunnels et les paquets perdus réduisent la couverture.",
      "Gelesen werden IP-Adressen, DNS-Anfragen und -Antworten, die Servernamen verschlüsselter Verbindungen und HTTP-Hosts. QUIC (HTTP/3) und verschlüsseltes Client Hello verbergen den Servernamen; verschlüsseltes DNS, Tunnel und verlorene Pakete verringern die Abdeckung.",
      "Vengono letti gli indirizzi IP, le richieste e risposte DNS, i nomi di server delle connessioni cifrate e gli host HTTP. QUIC (HTTP/3) e il Client Hello cifrato nascondono il nome del server, e DNS cifrato, tunnel e pacchetti persi riducono la copertura.",
      "São lidos os endereços IP, as consultas e respostas DNS, os nomes de servidor das ligações encriptadas e os anfitriões HTTP. O QUIC (HTTP/3) e o Client Hello encriptado ocultam o nome do servidor, e o DNS encriptado, os túneis e os pacotes perdidos reduzem a cobertura.",
    ),
  ],
  [
    /^Review point: the phone contacted this address at a steady pace/,
    t(
      "Punto a revisar: el móvil contactó con esta dirección a un ritmo constante sin buscar nunca un nombre para ella, algo que hace el spyware para no dejar dominios. Algunos servicios también se conectan por dirección.",
      "Point to review: the phone contacted this address at a steady pace without ever looking up a name for it, which spyware does to leave no domain behind. Some services also connect by address.",
      "Point à vérifier : le téléphone a contacté cette adresse à un rythme régulier sans jamais en chercher le nom, ce que fait un logiciel espion pour ne pas laisser de domaine. Certains services se connectent aussi par adresse.",
      "Zu prüfender Punkt: Das Gerät hat diese Adresse in festem Takt kontaktiert, ohne je einen Namen dafür abzufragen; so vermeidet Spyware Domains. Manche Dienste verbinden sich ebenfalls direkt per Adresse.",
      "Punto da verificare: il telefono ha contattato questo indirizzo a ritmo costante senza mai cercarne il nome, come fa lo spyware per non lasciare domini. Anche alcuni servizi si collegano per indirizzo.",
      "Ponto a rever: o telemóvel contactou este endereço a um ritmo constante sem nunca procurar um nome para ele, o que o spyware faz para não deixar domínios. Alguns serviços também se ligam por endereço.",
    ),
  ],
  [
    /^If you do not recognise this destination, find which app uses it/,
    t(
      "Si no reconoces este destino, averigua qué app lo usa y pide a un experto que revise el móvil.",
      "If you do not recognise this destination, find which app uses it and ask an expert to review the phone.",
      "Si vous ne reconnaissez pas cette destination, trouvez quelle application l’utilise et faites examiner le téléphone par un expert.",
      "Wenn Sie dieses Ziel nicht kennen, finden Sie heraus, welche App es nutzt, und lassen Sie das Gerät von einer Fachperson prüfen.",
      "Se non riconosci questa destinazione, scopri quale app la usa e fai controllare il telefono da un esperto.",
      "Se não reconhece este destino, descubra que app o usa e peça a um especialista que reveja o telemóvel.",
    ),
  ],
  [
    /^Review point: spyware sends what it collects in the background/,
    t(
      "Punto a revisar: el spyware envía lo que recoge en segundo plano, pero las copias de seguridad y la sincronización también. El móvil lo cuenta desde la última vez que se reiniciaron sus estadísticas de uso.",
      "Point to review: spyware sends what it collects in the background, but backups and sync do too. The phone counts this since its usage statistics were last reset.",
      "Point à vérifier : un logiciel espion envoie ce qu’il collecte en arrière-plan, mais les sauvegardes et la synchronisation aussi. Le téléphone compte cela depuis la dernière remise à zéro de ses statistiques d’utilisation.",
      "Zu prüfender Punkt: Spyware sendet Gesammeltes im Hintergrund, aber auch Backups und Synchronisierung tun das. Das Gerät zählt seit dem letzten Zurücksetzen seiner Nutzungsstatistik.",
      "Punto da verificare: lo spyware invia in background ciò che raccoglie, ma lo fanno anche backup e sincronizzazione. Il telefono lo conta dall’ultimo azzeramento delle statistiche di utilizzo.",
      "Ponto a rever: o spyware envia o que recolhe em segundo plano, mas as cópias de segurança e a sincronização também. O telemóvel conta isto desde a última vez que as estatísticas de utilização foram repostas.",
    ),
  ],
  [
    /^If you do not recognise this app or why it sends so much/,
    t(
      "Si no reconoces esta app o por qué envía tanto, desinstálala y pide a un experto que revise el móvil.",
      "If you do not recognise this app or why it sends so much, uninstall it and ask an expert to review the phone.",
      "Si vous ne reconnaissez pas cette application ou pourquoi elle envoie autant, désinstallez-la et faites examiner le téléphone par un expert.",
      "Wenn Sie diese App nicht kennen oder nicht wissen, warum sie so viel sendet, deinstallieren Sie sie und lassen Sie das Gerät von einer Fachperson prüfen.",
      "Se non riconosci questa app o perché invia così tanto, disinstallala e fai controllare il telefono da un esperto.",
      "Se não reconhece esta app ou porque envia tanto, desinstale-a e peça a um especialista que reveja o telemóvel.",
    ),
  ],
  [
    /^Review point: the phone looked up a domain that imitates a trusted brand/,
    t(
      "Punto a revisar: el móvil consultó un dominio que imita a una marca de confianza. El phishing y el spyware usan nombres así, pero una consulta no muestra qué se envió.",
      "Point to review: the phone looked up a domain that imitates a trusted brand. Phishing and spyware use such names, but a lookup alone does not show what was sent.",
      "Point à vérifier : le téléphone a consulté un domaine qui imite une marque de confiance. Le hameçonnage et les logiciels espions utilisent de tels noms, mais une requête ne montre pas ce qui a été envoyé.",
      "Zu prüfender Punkt: Das Gerät hat eine Domain abgefragt, die eine vertrauenswürdige Marke nachahmt. Phishing und Spyware nutzen solche Namen, aber eine Abfrage zeigt nicht, was gesendet wurde.",
      "Punto da verificare: il telefono ha cercato un dominio che imita un marchio affidabile. Phishing e spyware usano nomi simili, ma una ricerca non mostra cosa è stato inviato.",
      "Ponto a rever: o telemóvel consultou um domínio que imita uma marca de confiança. O phishing e o spyware usam nomes assim, mas uma consulta não mostra o que foi enviado.",
    ),
  ],
  [
    /^Find which app or link led to this domain/,
    t(
      "Averigua qué app o enlace llevó a este dominio. Si no lo reconoces, pide a un experto que revise el móvil.",
      "Find which app or link led to this domain. If you do not recognise it, ask an expert to review the phone.",
      "Trouvez quelle application ou quel lien a mené à ce domaine. Si vous ne le reconnaissez pas, faites examiner le téléphone par un expert.",
      "Finden Sie heraus, welche App oder welcher Link zu dieser Domain führte. Wenn Sie sie nicht kennen, lassen Sie das Gerät von einer Fachperson prüfen.",
      "Scopri quale app o link ha portato a questo dominio. Se non lo riconosci, fai controllare il telefono da un esperto.",
      "Descubra que app ou ligação levou a este domínio. Se não o reconhece, peça a um especialista que reveja o telemóvel.",
    ),
  ],
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
    /^Review point: jailbreaking an iPhone/,
    t(
      "Punto a revisar: a veces es el propio dueño quien hace el jailbreak al iPhone. Aun así, elimina las protecciones que frenan al spyware y le permite esconderse de análisis como este.",
      "Point to review: owners sometimes jailbreak their own iPhone. It still removes the protections that keep spyware out and lets it hide from scans like this one.",
      "Point à vérifier : il arrive que le propriétaire jailbreake lui-même son iPhone. Cela supprime pourtant les protections contre les logiciels espions et leur permet de se cacher d’analyses comme celle-ci.",
      "Zu prüfender Punkt: Manchmal jailbreakt der Besitzer sein iPhone selbst. Dennoch entfallen damit Schutzmechanismen gegen Spyware, die sich so vor Analysen wie dieser verbergen kann.",
      "Punto da verificare: a volte è il proprietario a fare il jailbreak dell’iPhone. Ciò rimuove comunque le protezioni contro lo spyware e gli permette di nascondersi da analisi come questa.",
      "Ponto a rever: às vezes é o próprio dono que faz jailbreak ao iPhone. Ainda assim, isso remove as proteções contra spyware e permite-lhe esconder-se de análises como esta.",
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
      "Punto a revisar: el dominio imita una marca de confianza, es una dirección IP o está en un servicio gratuito que oculta quién lo controla. El spyware y el phishing suelen llegar así, pero esto no demuestra que se abriera el enlace ni que se instalara nada.",
      "Point to review: the domain imitates a trusted brand, is a bare address or is on a free service that hides who runs it. Spyware and phishing often arrive this way, but this does not show the link was opened or anything installed.",
      "Point à vérifier : le domaine imite une marque de confiance, est une adresse IP ou se trouve sur un service gratuit qui cache qui le gère. Les logiciels espions et le phishing arrivent souvent ainsi, mais cela ne prouve pas que le lien a été ouvert ni que quelque chose a été installé.",
      "Zu prüfender Punkt: Die Domain ahmt eine vertrauenswürdige Marke nach, ist eine reine IP-Adresse oder liegt bei einem kostenlosen Dienst, der verbirgt, wer sie betreibt. Spyware und Phishing kommen oft so, doch das zeigt nicht, dass der Link geöffnet oder etwas installiert wurde.",
      "Punto da verificare: il dominio imita un marchio affidabile, è un indirizzo IP o si trova su un servizio gratuito che nasconde chi lo gestisce. Spyware e phishing arrivano spesso così, ma ciò non dimostra che il link sia stato aperto o che sia stato installato qualcosa.",
      "Ponto a rever: o domínio imita uma marca de confiança, é um endereço IP ou está num serviço gratuito que esconde quem o gere. O spyware e o phishing chegam muitas vezes assim, mas isto não mostra que a ligação foi aberta nem que algo foi instalado.",
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
    "the iPhone is jailbroken: programs ran from a jailbreak's folders",
    t(
      "el iPhone tiene jailbreak: se ejecutaron programas desde las carpetas de un jailbreak",
      "the iPhone is jailbroken: programs ran from a jailbreak's folders",
      "l’iPhone est jailbreaké : des programmes ont tourné depuis les dossiers d’un jailbreak",
      "das iPhone ist gejailbreakt: Programme liefen aus den Ordnern eines Jailbreaks",
      "l’iPhone ha il jailbreak: alcuni programmi sono stati eseguiti dalle cartelle di un jailbreak",
      "o iPhone tem jailbreak: foram executados programas a partir das pastas de um jailbreak",
    ),
  ],
  [
    "installed from a computer over USB (ADB), not from an app store",
    t(
      "instalada desde un ordenador por USB (ADB), no desde una tienda",
      "installed from a computer over USB (ADB), not from an app store",
      "installée depuis un ordinateur par USB (ADB), pas depuis une boutique",
      "per USB von einem Computer installiert (ADB), nicht aus einem Store",
      "installata da un computer tramite USB (ADB), non da uno store",
      "instalada a partir de um computador por USB (ADB), não de uma loja",
    ),
  ],
  [
    "used location while not on screen",
    t(
      "usó la ubicación sin estar en pantalla",
      "used location while not on screen",
      "a utilisé la localisation hors écran",
      "nutzte den Standort im Hintergrund",
      "ha usato la posizione fuori dallo schermo",
      "usou a localização sem estar no ecrã",
    ),
  ],
  [
    "link to a dynamic DNS name, which follows a home or rented connection",
    t(
      "enlace a un nombre de DNS dinámico, que sigue a una conexión doméstica o alquilada",
      "link to a dynamic DNS name, which follows a home or rented connection",
      "lien vers un nom DNS dynamique, qui suit une connexion domestique ou louée",
      "Link zu einem dynamischen DNS-Namen, der einem privaten oder gemieteten Anschluss folgt",
      "link a un nome DNS dinamico, che segue una connessione domestica o noleggiata",
      "ligação para um nome de DNS dinâmico, que acompanha um acesso à internet doméstico ou alugado",
    ),
  ],
  [
    "link to a tunnel that exposes a computer to the internet",
    t(
      "enlace a un túnel que expone un ordenador a internet",
      "link to a tunnel that exposes a computer to the internet",
      "lien vers un tunnel qui expose un ordinateur à Internet",
      "Link zu einem Tunnel, der einen Computer im Internet erreichbar macht",
      "link a un tunnel che espone un computer a internet",
      "ligação para um túnel que expõe um computador à internet",
    ),
  ],
  [
    "link to a service that keeps what is sent to it for someone to collect",
    t(
      "enlace a un servicio que guarda lo que recibe para que alguien lo recoja",
      "link to a service that keeps what is sent to it for someone to collect",
      "lien vers un service qui conserve ce qu’on lui envoie pour que quelqu’un le récupère",
      "Link zu einem Dienst, der alles Gesendete aufbewahrt, bis jemand es abholt",
      "link a un servizio che conserva ciò che riceve perché qualcuno lo recuperi",
      "ligação para um serviço que guarda o que recebe para alguém o recolher",
    ),
  ],
  [
    "link to a bare IP address instead of a domain name",
    t(
      "enlace a una dirección IP en lugar de un nombre de dominio",
      "link to a bare IP address instead of a domain name",
      "lien vers une adresse IP au lieu d’un nom de domaine",
      "Link zu einer reinen IP-Adresse statt eines Domainnamens",
      "link a un indirizzo IP invece che a un nome di dominio",
      "ligação para um endereço IP em vez de um nome de domínio",
    ),
  ],
  [
    "a dynamic DNS name, which follows a home or rented connection",
    t(
      "un nombre de DNS dinámico, que sigue a una conexión doméstica o alquilada",
      "a dynamic DNS name, which follows a home or rented connection",
      "un nom DNS dynamique, qui suit une connexion domestique ou louée",
      "ein dynamischer DNS-Name, der einem privaten oder gemieteten Anschluss folgt",
      "un nome DNS dinamico, che segue una connessione domestica o noleggiata",
      "um nome de DNS dinâmico, que acompanha um acesso à internet doméstico ou alugado",
    ),
  ],
  [
    "a tunnel that exposes a computer to the internet",
    t(
      "un túnel que expone un ordenador a internet",
      "a tunnel that exposes a computer to the internet",
      "un tunnel qui expose un ordinateur à Internet",
      "ein Tunnel, der einen Computer im Internet erreichbar macht",
      "un tunnel che espone un computer a internet",
      "um túnel que expõe um computador à internet",
    ),
  ],
  [
    "a service that keeps what is sent to it for someone to collect",
    t(
      "un servicio que guarda lo que recibe para que alguien lo recoja",
      "a service that keeps what is sent to it for someone to collect",
      "un service qui conserve ce qu’on lui envoie pour que quelqu’un le récupère",
      "ein Dienst, der alles Gesendete aufbewahrt, bis jemand es abholt",
      "un servizio che conserva ciò che riceve perché qualcuno lo recuperi",
      "um serviço que guarda o que recebe para alguém o recolher",
    ),
  ],
  [
    "contacted by the phone",
    t(
      "contactado por el móvil",
      "contacted by the phone",
      "contacté par le téléphone",
      "vom Telefon kontaktiert",
      "contattato dal telefono",
      "contactado pelo telemóvel",
    ),
  ],
  [
    "attributed network packet:",
    t(
      "paquete de red del móvil:",
      "attributed network packet:",
      "paquet réseau du téléphone :",
      "Netzwerkpaket des Telefons:",
      "pacchetto di rete del telefono:",
      "pacote de rede do telemóvel:",
    ),
  ],
  [
    "attributed DNS question:",
    t(
      "consulta DNS del móvil:",
      "attributed DNS question:",
      "requête DNS du téléphone :",
      "DNS-Anfrage des Telefons:",
      "richiesta DNS del telefono:",
      "consulta DNS do telemóvel:",
    ),
  ],
  [
    "attributed DNS alias:",
    t(
      "alias DNS del móvil:",
      "attributed DNS alias:",
      "alias DNS du téléphone :",
      "DNS-Alias des Telefons:",
      "alias DNS del telefono:",
      "alias DNS do telemóvel:",
    ),
  ],
  [
    "attributed TLS server name:",
    t(
      "nombre de servidor TLS del móvil:",
      "attributed TLS server name:",
      "nom de serveur TLS du téléphone :",
      "TLS-Servername des Telefons:",
      "nome del server TLS del telefono:",
      "nome de servidor TLS do telemóvel:",
    ),
  ],
  [
    "attributed HTTP host:",
    t(
      "host HTTP del móvil:",
      "attributed HTTP host:",
      "hôte HTTP du téléphone :",
      "HTTP-Host des Telefons:",
      "host HTTP del telefono:",
      "host HTTP do telemóvel:",
    ),
  ],
  [
    "an executable ran from a folder this analysis does not recognise",
    t(
      "se ejecutó un programa desde una carpeta que este análisis no reconoce",
      "an executable ran from a folder this analysis does not recognise",
      "un exécutable a tourné depuis un dossier que cette analyse ne reconnaît pas",
      "ein Programm lief aus einem Ordner, den diese Analyse nicht kennt",
      "un eseguibile è stato avviato da una cartella che questa analisi non riconosce",
      "um executável correu a partir de uma pasta que esta análise não reconhece",
    ),
  ],
  [
    "an executable ran from ",
    t(
      "se ejecutó un programa desde ",
      "an executable ran from ",
      "un exécutable a tourné depuis ",
      "ein Programm lief aus ",
      "un eseguibile è stato avviato da ",
      "um executável correu a partir de ",
    ),
  ],
  [
    ", where iOS and App Store apps never run code",
    t(
      ", donde iOS y las apps de la App Store nunca ejecutan código",
      ", where iOS and App Store apps never run code",
      ", où iOS et les apps de l’App Store n’exécutent jamais de code",
      ", wo iOS und App-Store-Apps nie Code ausführen",
      ", dove iOS e le app dell’App Store non eseguono mai codice",
      ", onde o iOS e as apps da App Store nunca executam código",
    ),
  ],
  [
    "a system database folder",
    t(
      "una carpeta de bases de datos del sistema",
      "a system database folder",
      "un dossier de bases de données du système",
      "einem Datenbankordner des Systems",
      "una cartella di database di sistema",
      "uma pasta de bases de dados do sistema",
    ),
  ],
  [
    "a temporary folder",
    t(
      "una carpeta temporal",
      "a temporary folder",
      "un dossier temporaire",
      "einem temporären Ordner",
      "una cartella temporanea",
      "uma pasta temporária",
    ),
  ],
  [
    "the system administrator's folder",
    t(
      "la carpeta del administrador del sistema",
      "the system administrator's folder",
      "le dossier de l’administrateur du système",
      "dem Ordner des Systemadministrators",
      "la cartella dell’amministratore di sistema",
      "a pasta do administrador do sistema",
    ),
  ],
  [
    "the user's data folder",
    t(
      "la carpeta de datos del usuario",
      "the user's data folder",
      "le dossier de données de l’utilisateur",
      "dem Datenordner des Nutzers",
      "la cartella dei dati dell’utente",
      "a pasta de dados do utilizador",
    ),
  ],
  [
    "an app's data folder",
    t(
      "la carpeta de datos de una app",
      "an app's data folder",
      "le dossier de données d’une app",
      "dem Datenordner einer App",
      "la cartella dei dati di un’app",
      "a pasta de dados de uma app",
    ),
  ],
  [
    "a shared data folder",
    t(
      "una carpeta de datos compartidos",
      "a shared data folder",
      "un dossier de données partagées",
      "einem Ordner für gemeinsame Daten",
      "una cartella di dati condivisi",
      "uma pasta de dados partilhados",
    ),
  ],
  [
    "a disguised path",
    t(
      "una ruta disfrazada",
      "a disguised path",
      "un chemin déguisé",
      "einem getarnten Pfad",
      "un percorso camuffato",
      "um caminho disfarçado",
    ),
  ],
  [
    "was running when the sysdiagnose was created",
    t(
      "estaba en ejecución al crearse el sysdiagnose",
      "was running when the sysdiagnose was created",
      "était en cours d’exécution à la création du sysdiagnose",
      "lief, als die Sysdiagnose erstellt wurde",
      "era in esecuzione quando è stato creato il sysdiagnose",
      "estava em execução quando o sysdiagnose foi criado",
    ),
  ],
  [
    "its name imitates an Apple system service",
    t(
      "su nombre imita un servicio del sistema de Apple",
      "its name imitates an Apple system service",
      "son nom imite un service système d’Apple",
      "sein Name ahmt einen Apple-Systemdienst nach",
      "il suo nome imita un servizio di sistema Apple",
      "o seu nome imita um serviço do sistema da Apple",
    ),
  ],
  [
    "SMS or iMessage",
    t(
      "SMS o iMessage",
      "SMS or iMessage",
      "SMS ou iMessage",
      "SMS oder iMessage",
      "SMS o iMessage",
      "SMS ou iMessage",
    ),
  ],
  [
    "Safari history",
    t(
      "historial de Safari",
      "Safari history",
      "historique de Safari",
      "Safari-Verlauf",
      "cronologia di Safari",
      "histórico do Safari",
    ),
  ],
  [
    "Chrome history",
    t(
      "historial de Chrome",
      "Chrome history",
      "historique de Chrome",
      "Chrome-Verlauf",
      "cronologia di Chrome",
      "histórico do Chrome",
    ),
  ],
  [
    "Firefox history",
    t(
      "historial de Firefox",
      "Firefox history",
      "historique de Firefox",
      "Firefox-Verlauf",
      "cronologia di Firefox",
      "histórico do Firefox",
    ),
  ],
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
/** Enigm's phrases that carry data ($1, $2…): reasons, counts and dates. */
/** Enigm's phrases that carry data ($1, $2…): reasons, counts and dates.
 *  Applied before FRAGMENTS, which then translate the phrases around them. */
export const PATTERNS: Array<[RegExp, T]> = [
  [
    /^Apple warning about state-sponsored attack received on (.+)$/,
    t(
      "Aviso de Apple de un ataque dirigido recibido el $1",
      "Apple warning about a targeted attack received on $1",
      "Avis d’Apple d’une attaque ciblée reçu le $1",
      "Apple-Warnung vor einem gezielten Angriff erhalten am $1",
      "Avviso di Apple di un attacco mirato ricevuto il $1",
      "Aviso da Apple de um ataque dirigido recebido em $1",
    ),
  ],
  [
    /, (\d+) connections \(port (\d+)\) about every (\d+) seconds$/,
    t(
      ", $1 conexiones (puerto $2) cada $3 segundos aproximadamente",
      ", $1 connections (port $2) about every $3 seconds",
      ", $1 connexions (port $2) environ toutes les $3 secondes",
      ", $1 Verbindungen (Port $2) etwa alle $3 Sekunden",
      ", $1 connessioni (porta $2) circa ogni $3 secondi",
      ", $1 ligações (porta $2) a cada $3 segundos, aproximadamente",
    ),
  ],
  [
    /delayed (\d+) reboot\(s\) in shutdown\.log/g,
    t(
      "reinicios retrasados en shutdown.log: $1",
      "delayed $1 reboot(s) in shutdown.log",
      "redémarrages retardés dans shutdown.log : $1",
      "verzögerte Neustarts in shutdown.log: $1",
      "riavvii ritardati in shutdown.log: $1",
      "reinícios atrasados em shutdown.log: $1",
    ),
  ],
  [
    /crashed (\d+) time\(s\)/g,
    t(
      "fallos registrados: $1",
      "crashed $1 time(s)",
      "plantages : $1",
      "Abstürze: $1",
      "arresti anomali: $1",
      "falhas registadas: $1",
    ),
  ],
  [
    /^(\d+) crashes of the services that process incoming iMessages \((.+?)\) between (\S+) and (\S+)$/,
    t(
      "$1 fallos de los servicios que procesan los iMessage entrantes ($2) entre $3 y $4",
      "$1 crashes of the services that process incoming iMessages ($2) between $3 and $4",
      "$1 plantages des services qui traitent les iMessage entrants ($2) entre $3 et $4",
      "$1 Abstürze der Dienste, die eingehende iMessages verarbeiten ($2), zwischen $3 und $4",
      "$1 arresti dei servizi che elaborano gli iMessage in arrivo ($2) tra $3 e $4",
      "$1 falhas dos serviços que processam os iMessage recebidos ($2) entre $3 e $4",
    ),
  ],
  [
    /internationalised domain (\S+) imitates (\S+) with look-alike letters/,
    t(
      "el dominio internacionalizado $1 imita a $2 con letras parecidas",
      "internationalised domain $1 imitates $2 with look-alike letters",
      "le domaine internationalisé $1 imite $2 avec des lettres semblables",
      "die internationalisierte Domain $1 ahmt $2 mit ähnlichen Buchstaben nach",
      "il dominio internazionalizzato $1 imita $2 con lettere simili",
      "o domínio internacionalizado $1 imita $2 com letras semelhantes",
    ),
  ],
  [
    /internationalised domain (\S+) mixes Latin letters with look-alike letters from another alphabet/,
    t(
      "el dominio internacionalizado $1 mezcla letras latinas con letras parecidas de otro alfabeto",
      "internationalised domain $1 mixes Latin letters with look-alike letters from another alphabet",
      "le domaine internationalisé $1 mélange des lettres latines et des lettres semblables d’un autre alphabet",
      "die internationalisierte Domain $1 mischt lateinische Buchstaben mit ähnlichen aus einem anderen Alphabet",
      "il dominio internazionalizzato $1 mescola lettere latine con lettere simili di un altro alfabeto",
      "o domínio internacionalizado $1 mistura letras latinas com letras semelhantes de outro alfabeto",
    ),
  ],
  [
    /(\S+) is used as a subdomain of (\S+), which (\S+) does not own/,
    t(
      "$1 se usa como subdominio de $2, que no pertenece a $3",
      "$1 is used as a subdomain of $2, which $3 does not own",
      "$1 est utilisé comme sous-domaine de $2, qui n’appartient pas à $3",
      "$1 wird als Subdomain von $2 verwendet, die nicht $3 gehört",
      "$1 è usato come sottodominio di $2, che non appartiene a $3",
      "$1 é usado como subdomínio de $2, que não pertence a $3",
    ),
  ],
  [
    /(\S+) combines the name (\S+) with other words but is not owned by \2/,
    t(
      "$1 combina el nombre $2 con otras palabras, pero no pertenece a $2",
      "$1 combines the name $2 with other words but is not owned by $2",
      "$1 associe le nom $2 à d’autres mots mais n’appartient pas à $2",
      "$1 verbindet den Namen $2 mit anderen Wörtern, gehört aber nicht $2",
      "$1 combina il nome $2 con altre parole ma non appartiene a $2",
      "$1 combina o nome $2 com outras palavras, mas não pertence a $2",
    ),
  ],
  [
    /(\S+) uses the name (\S+) on a domain \2 does not own/,
    t(
      "$1 usa el nombre $2 en un dominio que no pertenece a $2",
      "$1 uses the name $2 on a domain $2 does not own",
      "$1 utilise le nom $2 sur un domaine qui n’appartient pas à $2",
      "$1 verwendet den Namen $2 auf einer Domain, die nicht $2 gehört",
      "$1 usa il nome $2 su un dominio che non appartiene a $2",
      "$1 usa o nome $2 num domínio que não pertence a $2",
    ),
  ],
  [
    /(\S+) spells (\S+) with look-alike characters/,
    t(
      "$1 escribe $2 con caracteres parecidos",
      "$1 spells $2 with look-alike characters",
      "$1 écrit $2 avec des caractères semblables",
      "$1 schreibt $2 mit ähnlichen Zeichen",
      "$1 scrive $2 con caratteri simili",
      "$1 escreve $2 com caracteres semelhantes",
    ),
  ],
  [
    /(\S+) is one letter away from (\S+)/,
    t(
      "$1 se diferencia de $2 en una sola letra",
      "$1 is one letter away from $2",
      "$1 ne diffère de $2 que d’une lettre",
      "$1 unterscheidet sich nur durch einen Buchstaben von $2",
      "$1 differisce da $2 per una sola lettera",
      "$1 difere de $2 numa só letra",
    ),
  ],
  [
    /\. Seen (\d+) time\(s\) in (.+?) between (\S+) and (\S+), e\.g\. /,
    t(
      ". Apariciones: $1, en $2, entre $3 y $4. Ejemplo: ",
      ". Seen $1 time(s) in $2 between $3 and $4, e.g. ",
      ". Occurrences : $1, dans $2, entre $3 et $4. Exemple : ",
      ". Vorkommen: $1, in $2, zwischen $3 und $4. Beispiel: ",
      ". Occorrenze: $1, in $2, tra $3 e $4. Esempio: ",
      ". Ocorrências: $1, em $2, entre $3 e $4. Exemplo: ",
    ),
  ],
  [
    /\. Seen (\d+) time\(s\) in (.+?) on (\S+), e\.g\. /,
    t(
      ". Apariciones: $1, en $2, el $3. Ejemplo: ",
      ". Seen $1 time(s) in $2 on $3, e.g. ",
      ". Occurrences : $1, dans $2, le $3. Exemple : ",
      ". Vorkommen: $1, in $2, am $3. Beispiel: ",
      ". Occorrenze: $1, in $2, il $3. Esempio: ",
      ". Ocorrências: $1, em $2, em $3. Exemplo: ",
    ),
  ],
  [
    /\. Seen (\d+) time\(s\) in (.+?), e\.g\. /,
    t(
      ". Apariciones: $1, en $2. Ejemplo: ",
      ". Seen $1 time(s) in $2, e.g. ",
      ". Occurrences : $1, dans $2. Exemple : ",
      ". Vorkommen: $1, in $2. Beispiel: ",
      ". Occorrenze: $1, in $2. Esempio: ",
      ". Ocorrências: $1, em $2. Exemplo: ",
    ),
  ],
  [
    /while not on screen (\d+) min ago/g,
    t(
      "while not on screen hace $1 min",
      "while not on screen $1 min ago",
      "while not on screen il y a $1 min",
      "while not on screen vor $1 Min.",
      "while not on screen $1 min fa",
      "while not on screen há $1 min",
    ),
  ],
  [
    /while not on screen (\d+) h ago/g,
    t(
      "while not on screen hace $1 h",
      "while not on screen $1 h ago",
      "while not on screen il y a $1 h",
      "while not on screen vor $1 Std.",
      "while not on screen $1 h fa",
      "while not on screen há $1 h",
    ),
  ],
  [
    /while not on screen (\d+) days ago/g,
    t(
      "while not on screen hace $1 días",
      "while not on screen $1 days ago",
      "while not on screen il y a $1 jours",
      "while not on screen vor $1 Tagen",
      "while not on screen $1 giorni fa",
      "while not on screen há $1 dias",
    ),
  ],
];

/** Replace Enigm's own phrases inside an evidence line; data stays as it is. */
export function translateFragments(value: string, language: Language) {
  if (language === "en") return value;
  let out = value;
  for (const [pattern, tr] of PATTERNS)
    out = out.replace(pattern, tr[language]);
  for (const [english, tr] of FRAGMENTS)
    out = out.split(english).join(tr[language]);
  return out;
}

type Detail = [RegExp, T];
/** Check details of the new engines; {n} are the captured numbers. */
export const EXTRA_DETAILS: Record<string, Detail[]> = {
  network_observation: [
    [
      /^Observed for (\d+) seconds \(at least 120, longer while the copy ran\)/,
      t(
        "Red observada durante {0} s (al menos 120, y más mientras duró la copia). Una amenaza que permanezca inactiva en ese tiempo puede no aparecer.",
        "Network observed for {0} s (at least 120, longer while the copy ran). A threat that stays quiet meanwhile may not show up.",
        "Réseau observé pendant {0} s (au moins 120, plus tant que la copie durait). Une menace restée inactive pendant ce temps peut ne pas apparaître.",
        "Netzwerk {0} s beobachtet (mindestens 120, länger während der Kopie). Eine in dieser Zeit inaktive Bedrohung wird möglicherweise nicht sichtbar.",
        "Rete osservata per {0} s (almeno 120, di più mentre durava la copia). Una minaccia inattiva in quel tempo potrebbe non comparire.",
        "Rede observada durante {0} s (pelo menos 120, mais enquanto durou a cópia). Uma ameaça inativa nesse tempo pode não aparecer.",
      ),
    ],
    [
      /^Observed for (\d+) of at least 120 seconds: the\ phone\ ended\ the\ capture\ and\ it\ could\ not\ be\ resumed/,
      t(
        "Red observada solo {0} de al menos 120 s: el móvil cerró la captura y no se pudo reanudar.",
        "Network observed for only {0} of at least 120 s: the phone ended the capture and it could not be resumed.",
        "Réseau observé seulement {0} s sur au moins 120 : le téléphone a arrêté la capture et elle n’a pas pu reprendre.",
        "Netzwerk nur {0} von mindestens 120 s beobachtet: das Gerät hat die Aufzeichnung beendet und sie ließ sich nicht fortsetzen.",
        "Rete osservata solo {0} s su almeno 120: il telefono ha chiuso la cattura e non è stato possibile riprenderla.",
        "Rede observada apenas {0} de pelo menos 120 s: o telemóvel terminou a captura e não foi possível retomá-la.",
      ),
    ],
    [
      /^Observed for (\d+) of at least 120 seconds: the\ capture\ could\ not\ start/,
      t(
        "Red observada solo {0} de al menos 120 s: la captura no pudo empezar.",
        "Network observed for only {0} of at least 120 s: the capture could not start.",
        "Réseau observé seulement {0} s sur au moins 120 : la capture n’a pas pu démarrer.",
        "Netzwerk nur {0} von mindestens 120 s beobachtet: die Aufzeichnung konnte nicht starten.",
        "Rete osservata solo {0} s su almeno 120: la cattura non è potuta partire.",
        "Rede observada apenas {0} de pelo menos 120 s: a captura não conseguiu começar.",
      ),
    ],
    [
      /^Observed for (\d+) of at least 120 seconds: the\ capture\ was\ interrupted/,
      t(
        "Red observada solo {0} de al menos 120 s: la captura se interrumpió.",
        "Network observed for only {0} of at least 120 s: the capture was interrupted.",
        "Réseau observé seulement {0} s sur au moins 120 : la capture a été interrompue.",
        "Netzwerk nur {0} von mindestens 120 s beobachtet: die Aufzeichnung wurde unterbrochen.",
        "Rete osservata solo {0} s su almeno 120: la cattura è stata interrotta.",
        "Rede observada apenas {0} de pelo menos 120 s: a captura foi interrompida.",
      ),
    ],
    [
      /^Observed for (\d+) of at least 120 seconds: the\ capture\ reached\ its\ size\ limit/,
      t(
        "Red observada solo {0} de al menos 120 s: la captura llegó a su tamaño máximo.",
        "Network observed for only {0} of at least 120 s: the capture reached its size limit.",
        "Réseau observé seulement {0} s sur au moins 120 : la capture a atteint sa taille maximale.",
        "Netzwerk nur {0} von mindestens 120 s beobachtet: die Aufzeichnung hat ihre Größengrenze erreicht.",
        "Rete osservata solo {0} s su almeno 120: la cattura ha raggiunto la dimensione massima.",
        "Rede observada apenas {0} de pelo menos 120 s: a captura atingiu o tamanho máximo.",
      ),
    ],
    [
      /^Observed for (\d+) of at least 120 seconds: its\ length\ could\ not\ be\ verified/,
      t(
        "Red observada solo {0} de al menos 120 s: no se pudo verificar su duración.",
        "Network observed for only {0} of at least 120 s: its length could not be verified.",
        "Réseau observé seulement {0} s sur au moins 120 : sa durée n’a pas pu être vérifiée.",
        "Netzwerk nur {0} von mindestens 120 s beobachtet: ihre Dauer ließ sich nicht prüfen.",
        "Rete osservata solo {0} s su almeno 120: la sua durata non è verificabile.",
        "Rede observada apenas {0} de pelo menos 120 s: a sua duração não pôde ser verificada.",
      ),
    ],
  ],
  network_names: [
    [
      /^(\d+) destination names read \((\d+) DNS lookups, (\d+) TLS server names, (\d+) HTTP hosts\)/,
      t(
        "{0} destinos leídos ({1} consultas DNS, {2} nombres de servidor de conexiones cifradas y {3} hosts HTTP) y comparados con dominios de spyware conocidos.",
        "{0} destination names read ({1} DNS lookups, {2} server names of encrypted connections, {3} HTTP hosts) and compared with known spyware domains.",
        "{0} noms de destination lus ({1} requêtes DNS, {2} noms de serveur de connexions chiffrées, {3} hôtes HTTP) et comparés aux domaines de logiciels espions connus.",
        "{0} Zielnamen gelesen ({1} DNS-Anfragen, {2} Servernamen verschlüsselter Verbindungen, {3} HTTP-Hosts) und mit bekannten Spyware-Domains abgeglichen.",
        "{0} nomi di destinazione letti ({1} richieste DNS, {2} nomi di server di connessioni cifrate, {3} host HTTP) e confrontati con domini di spyware noti.",
        "{0} nomes de destino lidos ({1} consultas DNS, {2} nomes de servidor de ligações encriptadas, {3} anfitriões HTTP) e comparados com domínios de spyware conhecidos.",
      ),
    ],
  ],
  network_encrypted_dns: [
    [
      /^No unencrypted DNS lookups were seen across (\d+) encrypted connections; iCloud Private Relay is on/,
      t(
        "No se vieron consultas DNS sin cifrar en {0} conexiones cifradas: iCloud Private Relay está activado. Los destinos se leyeron de los nombres de servidor de las conexiones cifradas y de sus direcciones.",
        "No unencrypted DNS lookups were seen across {0} encrypted connections: iCloud Private Relay is on. Destinations were read from the server names of encrypted connections and their addresses.",
        "Aucune requête DNS non chiffrée sur {0} connexions chiffrées : iCloud Private Relay est activé. Les destinations ont été lues dans les noms de serveur des connexions chiffrées et leurs adresses.",
        "Keine unverschlüsselten DNS-Anfragen in {0} verschlüsselten Verbindungen: iCloud Privat-Relay ist aktiv. Die Ziele wurden aus den Servernamen verschlüsselter Verbindungen und ihren Adressen gelesen.",
        "Nessuna richiesta DNS non cifrata su {0} connessioni cifrate: iCloud Private Relay è attivo. Le destinazioni sono state lette dai nomi di server delle connessioni cifrate e dai loro indirizzi.",
        "Nenhuma consulta DNS não encriptada em {0} ligações encriptadas: o iCloud Private Relay está ativo. Os destinos foram lidos dos nomes de servidor das ligações encriptadas e dos seus endereços.",
      ),
    ],
    [
      /^No unencrypted DNS lookups were seen across (\d+) encrypted connections/,
      t(
        "No se vieron consultas DNS sin cifrar en {0} conexiones cifradas: el móvil usa DNS cifrado o iCloud Private Relay. Los destinos se leyeron de los nombres de servidor de las conexiones cifradas y de sus direcciones.",
        "No unencrypted DNS lookups were seen across {0} encrypted connections: the phone uses encrypted DNS or iCloud Private Relay. Destinations were read from the server names of encrypted connections and their addresses.",
        "Aucune requête DNS non chiffrée sur {0} connexions chiffrées : le téléphone utilise un DNS chiffré ou iCloud Private Relay. Les destinations ont été lues dans les noms de serveur des connexions chiffrées et leurs adresses.",
        "Keine unverschlüsselten DNS-Anfragen in {0} verschlüsselten Verbindungen: Das Gerät nutzt verschlüsseltes DNS oder iCloud Privat-Relay. Die Ziele wurden aus den Servernamen verschlüsselter Verbindungen und ihren Adressen gelesen.",
        "Nessuna richiesta DNS non cifrata su {0} connessioni cifrate: il telefono usa DNS cifrato o iCloud Private Relay. Le destinazioni sono state lette dai nomi di server delle connessioni cifrate e dai loro indirizzi.",
        "Nenhuma consulta DNS não encriptada em {0} ligações encriptadas: o telemóvel usa DNS encriptado ou o iCloud Private Relay. Os destinos foram lidos dos nomes de servidor das ligações encriptadas e dos seus endereços.",
      ),
    ],
  ],
  network_periodic_connections: [
    [
      /^(\d+) destination\(s\) contacted repeatedly at a steady pace/,
      t(
        "{0} destinos contactados una y otra vez a un ritmo constante.",
        "{0} destination(s) contacted again and again at a steady pace.",
        "{0} destination(s) contactée(s) à plusieurs reprises à un rythme régulier.",
        "{0} Ziel(e) wiederholt in festem Takt kontaktiert.",
        "{0} destinazioni contattate più volte a ritmo costante.",
        "{0} destino(s) contactado(s) repetidamente a um ritmo constante.",
      ),
    ],
  ],
  android_background_upload: [
    [
      /^Background data per app was not reviewed/,
      t(
        "No se revisaron los datos enviados en segundo plano: no se pidió.",
        "Data sent in the background was not reviewed: it was not asked for.",
        "Les données envoyées en arrière-plan n’ont pas été vérifiées : ce n’était pas demandé.",
        "Im Hintergrund gesendete Daten wurden nicht geprüft: Das war nicht gewünscht.",
        "I dati inviati in background non sono stati controllati: non era richiesto.",
        "Os dados enviados em segundo plano não foram verificados: não foi pedido.",
      ),
    ],
    [
      /^(\d+) apps sent data in the background; (\d+) worth reviewing/,
      t(
        "{0} apps enviaron datos en segundo plano; {1} merecen revisión (instaladas fuera de las tiendas o con comportamiento de spyware).",
        "{0} apps sent data in the background; {1} worth reviewing (installed outside the stores or acting like spyware).",
        "{0} applications ont envoyé des données en arrière-plan ; {1} à vérifier (installées hors des boutiques ou agissant comme un logiciel espion).",
        "{0} Apps haben im Hintergrund Daten gesendet; {1} sind zu prüfen (außerhalb der Stores installiert oder mit Spyware-Verhalten).",
        "{0} app hanno inviato dati in background; {1} da verificare (installate fuori dagli store o con comportamento da spyware).",
        "{0} apps enviaram dados em segundo plano; {1} merecem revisão (instaladas fora das lojas ou com comportamento de spyware).",
      ),
    ],
  ],
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
        "Enlaces de mensajes, historial y consultas DNS revisados en busca de dominios que suplantan marcas, letras parecidas, enlaces a direcciones IP, a DNS dinámico o a túneles, y perfiles capaces de interceptar el tráfico. Dominios sospechosos: {0}. Perfiles a revisar: {1}. Un enlace con aspecto legítimo también puede ser malicioso.",
        "Links in messages, browsing history and DNS lookups checked for domains impersonating brands, look-alike letters, bare IP links, links to dynamic DNS or tunnels, and profiles able to intercept traffic. Suspicious domains: {0}. Profiles to review: {1}. A link that looks legitimate can still be malicious.",
        "Liens des messages, historique et requêtes DNS vérifiés pour repérer les domaines usurpant des marques, les lettres trompeuses, les liens vers des adresses IP, des DNS dynamiques ou des tunnels, et les profils capables d’intercepter le trafic. Domaines suspects : {0}. Profils à vérifier : {1}. Un lien d’apparence légitime peut aussi être malveillant.",
        "Links in Nachrichten, Browserverlauf und DNS-Anfragen auf Domains geprüft, die Marken nachahmen, ähnliche Buchstaben, Links zu IP-Adressen, dynamischem DNS oder Tunneln sowie Profile, die Verkehr abfangen können. Verdächtige Domains: {0}. Zu prüfende Profile: {1}. Auch ein seriös wirkender Link kann schädlich sein.",
        "Link nei messaggi, cronologia e richieste DNS controllati per domini che imitano marchi, lettere simili, link a indirizzi IP, a DNS dinamici o a tunnel, e profili in grado di intercettare il traffico. Domini sospetti: {0}. Profili da verificare: {1}. Anche un link dall’aspetto legittimo può essere dannoso.",
        "Ligações em mensagens, histórico e consultas DNS verificadas quanto a domínios que imitam marcas, letras semelhantes, ligações para endereços IP, DNS dinâmico ou túneis, e perfis capazes de intercetar o tráfego. Domínios suspeitos: {0}. Perfis a rever: {1}. Uma ligação com aspeto legítimo também pode ser maliciosa.",
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
