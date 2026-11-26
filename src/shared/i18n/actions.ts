import type { Language } from "./i18n";
import type { Action } from "../../core/actions";

type T = Record<Language, string>;
const t = (
  es: string,
  en: string,
  fr: string,
  de: string,
  it: string,
  pt: string,
): T => ({ es, en, fr, de, it, pt });

/** The "What to do now" section of the PDF report. */
export const actionsTitle = t(
  "Qué hacer ahora",
  "What to do now",
  "Que faire maintenant",
  "Was Sie jetzt tun sollten",
  "Cosa fare ora",
  "O que fazer agora",
);
export const actionsLead = t(
  "Según lo que ha encontrado el análisis, en este orden:",
  "Based on what the scan found, in this order:",
  "D’après ce que l’analyse a trouvé, dans cet ordre :",
  "Nach dem, was die Analyse gefunden hat, in dieser Reihenfolge:",
  "In base a quanto trovato dall’analisi, in quest’ordine:",
  "Com base no que a análise encontrou, por esta ordem:",
);

export const actionCopy: Record<Action, T> = {
  stalkerwareSafety: t(
    "Piensa primero en tu seguridad. El stalkerware suele instalarlo alguien cercano y quitarlo le avisa. Si te sientes en riesgo, habla antes con un servicio de atención a víctimas de violencia; en stopstalkerware.org hay organizaciones que pueden ayudarte.",
    "Think about your safety first. Stalkerware is usually installed by someone close, and removing it alerts them. If you feel at risk, talk to a domestic violence support service before you do anything; stopstalkerware.org lists organisations that can help.",
    "Pensez d’abord à votre sécurité. Le logiciel de traque est souvent installé par un proche, et le supprimer le prévient. Si vous vous sentez en danger, contactez d’abord un service d’aide aux victimes de violences ; stopstalkerware.org recense des organisations qui peuvent vous aider.",
    "Denken Sie zuerst an Ihre Sicherheit. Stalkerware installiert meist jemand aus dem Umfeld, und das Entfernen alarmiert diese Person. Wenn Sie sich bedroht fühlen, wenden Sie sich zuerst an eine Beratungsstelle gegen häusliche Gewalt; stopstalkerware.org nennt Organisationen, die helfen.",
    "Pensa prima alla tua sicurezza. Lo stalkerware di solito lo installa una persona vicina, e rimuoverlo la avvisa. Se ti senti in pericolo, rivolgiti prima a un servizio di aiuto contro la violenza; su stopstalkerware.org trovi organizzazioni che possono aiutarti.",
    "Pense primeiro na sua segurança. O stalkerware costuma ser instalado por alguém próximo, e removê-lo alerta essa pessoa. Se se sentir em risco, fale primeiro com um serviço de apoio a vítimas de violência; em stopstalkerware.org há organizações que podem ajudar.",
  ),
  appleNotice: t(
    "Apple ha avisado de un ataque dirigido contra este iPhone. Sigue los pasos de su mensaje y activa el Modo de aislamiento en Ajustes > Privacidad y seguridad.",
    "Apple has warned of a targeted attack against this iPhone. Follow the steps in its message and turn on Lockdown Mode in Settings > Privacy & Security.",
    "Apple a signalé une attaque ciblée contre cet iPhone. Suivez les étapes de son message et activez le mode Isolement dans Réglages > Confidentialité et sécurité.",
    "Apple hat vor einem gezielten Angriff auf dieses iPhone gewarnt. Folgen Sie den Schritten in der Nachricht und aktivieren Sie den Blockierungsmodus unter Einstellungen > Datenschutz & Sicherheit.",
    "Apple ha segnalato un attacco mirato contro questo iPhone. Segui i passaggi del suo messaggio e attiva la modalità di isolamento in Impostazioni > Privacy e sicurezza.",
    "A Apple avisou de um ataque dirigido contra este iPhone. Siga os passos da mensagem e ative o Modo de Isolamento em Definições > Privacidade e segurança.",
  ),
  preserve: t(
    "No restablezcas, actualices ni desinstales nada todavía: borraría los rastros que necesita un experto. Guarda este informe y deja el móvil como está.",
    "Do not reset, update or uninstall anything yet: it would erase the traces an expert needs. Keep this report and leave the phone as it is.",
    "Ne réinitialisez, ne mettez à jour et ne désinstallez rien pour l’instant : cela effacerait les traces dont un expert a besoin. Conservez ce rapport et laissez le téléphone tel quel.",
    "Setzen Sie nichts zurück, aktualisieren oder deinstallieren Sie noch nichts: Das würde die Spuren löschen, die eine Fachperson braucht. Bewahren Sie diesen Bericht auf und lassen Sie das Telefon, wie es ist.",
    "Non ripristinare, aggiornare o disinstallare nulla per ora: cancelleresti le tracce che servono a un esperto. Conserva questo rapporto e lascia il telefono com’è.",
    "Não reponha, atualize nem desinstale nada por agora: apagaria os vestígios de que um especialista precisa. Guarde este relatório e deixe o telemóvel como está.",
  ),
  otherDevice: t(
    "Usa otro dispositivo de confianza para las conversaciones delicadas y mantén este móvil lejos de ellas hasta que lo revisen.",
    "Use another device you trust for sensitive conversations, and keep this phone away from them until it has been examined.",
    "Utilisez un autre appareil de confiance pour les conversations sensibles et tenez ce téléphone à l’écart jusqu’à ce qu’il soit examiné.",
    "Nutzen Sie für vertrauliche Gespräche ein anderes, vertrauenswürdiges Gerät und halten Sie dieses Telefon fern, bis es geprüft wurde.",
    "Usa un altro dispositivo di fiducia per le conversazioni delicate e tieni questo telefono lontano finché non viene esaminato.",
    "Use outro dispositivo de confiança para as conversas sensíveis e mantenha este telemóvel afastado até ser examinado.",
  ),
  expertHelp: t(
    "Pide ayuda experta gratuita: la línea de ayuda en seguridad digital de Access Now (accessnow.org/help) y el Security Lab de Amnistía Internacional (securitylab.amnesty.org) ayudan a periodistas, activistas y otras personas atacadas con spyware.",
    "Ask for free expert help: Access Now’s Digital Security Helpline (accessnow.org/help) and Amnesty International’s Security Lab (securitylab.amnesty.org) help journalists, activists and others targeted with spyware.",
    "Demandez l’aide gratuite d’experts : la ligne d’assistance en sécurité numérique d’Access Now (accessnow.org/help) et le Security Lab d’Amnesty International (securitylab.amnesty.org) aident les journalistes, militants et autres personnes visées par des logiciels espions.",
    "Holen Sie sich kostenlose fachkundige Hilfe: Die Digital Security Helpline von Access Now (accessnow.org/help) und das Security Lab von Amnesty International (securitylab.amnesty.org) helfen Journalisten, Aktivistinnen und anderen, die mit Spyware angegriffen werden.",
    "Chiedi l’aiuto gratuito di esperti: la linea di assistenza per la sicurezza digitale di Access Now (accessnow.org/help) e il Security Lab di Amnesty International (securitylab.amnesty.org) aiutano giornalisti, attivisti e altre persone colpite da spyware.",
    "Peça ajuda especializada gratuita: a linha de apoio em segurança digital da Access Now (accessnow.org/help) e o Security Lab da Amnistia Internacional (securitylab.amnesty.org) ajudam jornalistas, ativistas e outras pessoas atacadas com spyware.",
  ),
  modifiedSystem: t(
    "Si no rooteaste ni hiciste el jailbreak a este móvil tú mismo, trátalo como comprometido: sus protecciones están desactivadas. Haz que lo revisen antes de usarlo para algo delicado.",
    "If you did not root or jailbreak this phone yourself, treat it as compromised: its protections are off. Have it examined before using it for anything sensitive.",
    "Si vous n’avez pas rooté ou jailbreaké ce téléphone vous-même, considérez-le comme compromis : ses protections sont désactivées. Faites-le examiner avant de l’utiliser pour quoi que ce soit de sensible.",
    "Wenn Sie dieses Telefon nicht selbst gerootet oder gejailbreakt haben, behandeln Sie es als kompromittiert: Seine Schutzmechanismen sind aus. Lassen Sie es prüfen, bevor Sie es für Vertrauliches nutzen.",
    "Se non hai fatto tu il root o il jailbreak di questo telefono, consideralo compromesso: le sue protezioni sono disattivate. Fallo esaminare prima di usarlo per qualcosa di delicato.",
    "Se não fez root ou jailbreak a este telemóvel, trate-o como comprometido: as suas proteções estão desativadas. Peça que o examinem antes de o usar para algo sensível.",
  ),
  lockdown: t(
    "Actualiza iOS y, si crees que pueden atacarte, activa el Modo de aislamiento en Ajustes > Privacidad y seguridad: bloquea los ataques por mensajes como los que se han visto aquí.",
    "Update iOS and, if you may be targeted, turn on Lockdown Mode in Settings > Privacy & Security: it blocks message attacks like the ones seen here.",
    "Mettez iOS à jour et, si vous pensez être visé, activez le mode Isolement dans Réglages > Confidentialité et sécurité : il bloque les attaques par message comme celles observées ici.",
    "Aktualisieren Sie iOS und aktivieren Sie, falls Sie Ziel sein könnten, den Blockierungsmodus unter Einstellungen > Datenschutz & Sicherheit: Er blockiert Angriffe über Nachrichten wie die hier gesehenen.",
    "Aggiorna iOS e, se pensi di poter essere preso di mira, attiva la modalità di isolamento in Impostazioni > Privacy e sicurezza: blocca gli attacchi tramite messaggi come quelli visti qui.",
    "Atualize o iOS e, se puder ser alvo, ative o Modo de Isolamento em Definições > Privacidade e segurança: bloqueia ataques por mensagem como os que se viram aqui.",
  ),
  interception: t(
    "Quita los perfiles, VPN o proxys que no reconozcas (iPhone: Ajustes > General > VPN y gestión de dispositivos; Android: ajustes de red) y vuelve a analizar el móvil.",
    "Remove any profile, VPN or proxy you do not recognise (iPhone: Settings > General > VPN & Device Management; Android: network settings), then scan the phone again.",
    "Supprimez les profils, VPN ou proxys que vous ne reconnaissez pas (iPhone : Réglages > Général > VPN et gestion de l’appareil ; Android : paramètres réseau), puis analysez de nouveau le téléphone.",
    "Entfernen Sie Profile, VPNs oder Proxys, die Sie nicht kennen (iPhone: Einstellungen > Allgemein > VPN und Geräteverwaltung; Android: Netzwerkeinstellungen), und analysieren Sie das Telefon erneut.",
    "Rimuovi profili, VPN o proxy che non riconosci (iPhone: Impostazioni > Generali > VPN e gestione dispositivi; Android: impostazioni di rete) e analizza di nuovo il telefono.",
    "Remova perfis, VPN ou proxies que não reconheça (iPhone: Definições > Geral > VPN e gestão de dispositivos; Android: definições de rede) e analise de novo o telemóvel.",
  ),
  links: t(
    "No abras los enlaces señalados. Si ya los abriste, anota cuándo: la fecha ayuda a un experto a buscar rastros.",
    "Do not open the links listed. If you already did, write down when: the date helps an expert look for traces.",
    "N’ouvrez pas les liens signalés. Si vous l’avez déjà fait, notez quand : la date aide un expert à chercher des traces.",
    "Öffnen Sie die aufgeführten Links nicht. Falls doch, notieren Sie den Zeitpunkt: Das Datum hilft einer Fachperson bei der Spurensuche.",
    "Non aprire i link segnalati. Se lo hai già fatto, annota quando: la data aiuta un esperto a cercare tracce.",
    "Não abra as ligações assinaladas. Se já as abriu, anote quando: a data ajuda um especialista a procurar vestígios.",
  ),
  apps: t(
    "Comprueba que reconoces cada app señalada y que la instalaste tú. Desinstala las que no, o quítales los accesos especiales.",
    "Check that you recognise every app listed and installed it yourself. Uninstall the ones you did not, or take away their special access.",
    "Vérifiez que vous reconnaissez chaque appli signalée et que vous l’avez installée vous-même. Désinstallez les autres, ou retirez-leur leurs accès spéciaux.",
    "Prüfen Sie, ob Sie jede aufgeführte App kennen und selbst installiert haben. Deinstallieren Sie die anderen oder entziehen Sie ihnen die Sonderzugriffe.",
    "Verifica di riconoscere ogni app segnalata e di averla installata tu. Disinstalla le altre, o togli loro gli accessi speciali.",
    "Confirme que reconhece cada app assinalada e que a instalou. Desinstale as outras, ou retire-lhes os acessos especiais.",
  ),
  scanAgain: t(
    "Vuelve a analizar el móvil después de cualquier cambio y mantenlo, junto con sus apps, actualizado.",
    "Scan the phone again after any change, and keep it and its apps up to date.",
    "Analysez de nouveau le téléphone après tout changement, et gardez-le à jour, ainsi que ses applis.",
    "Analysieren Sie das Telefon nach jeder Änderung erneut und halten Sie es und seine Apps aktuell.",
    "Analizza di nuovo il telefono dopo ogni modifica e mantieni aggiornati lui e le sue app.",
    "Analise de novo o telemóvel depois de qualquer alteração e mantenha-o, a ele e às apps, atualizado.",
  ),
};
