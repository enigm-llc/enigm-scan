import type { Language } from "./i18n";

/** Copy for the report page and the PDF report. */
export type ReportCopy = {
  /** Clears this report and the phone session, back to the device search. */
  scanAnother: string;
  statsTitle: string;
  bySeverity: string;
  /** Under the empty severity bar when nothing was found. */
  noSignsAnyLevel: string;
  duration: string;
  reportTitle: string;
  execTitle: string;
  execClean: string;
  execFindings: string;
  execInsufficient: string;
  checksTitle: string;
  sessionTitle: string;
  start: string;
  end: string;
  generatedNote: string;
  findingsLead: string;
  noFindingsLead: string;
  page: string;
  promoTitle: string;
  promoCta: string;
  resultLabel: string;
  reviewTitle: string;
  reviewTag: string;
  execReview: string;
  eventDate: string;
  qrCaption: string;
  promoPoints: string[];
  promoMore: [string, string];
};

export const reportCopy: Record<Language, ReportCopy> = {
  es: {
    scanAnother: "Escanear otro móvil",
    statsTitle: "Resumen del análisis",
    bySeverity: "Indicios por criticidad",
    noSignsAnyLevel: "Ninguno detectado",
    duration: "Duración",
    reportTitle: "Informe de análisis de spyware",
    execTitle: "Resumen ejecutivo",
    execClean:
      "Se analizó un {device} el {date}. Se {files|revisó|revisaron} {files} {files|archivo|archivos} con {checks} comprobaciones y no se encontró ningún rastro de spyware conocido. Ningún análisis garantiza al 100 % que un móvil esté limpio, pero es una comprobación seria.",
    execFindings:
      "Se analizó un {device} el {date}. Se {files|revisó|revisaron} {files} {files|archivo|archivos} con {checks} comprobaciones y se {findings|encontró|encontraron} {findings} {findings|indicio|indicios} ({breakdown}). Un indicio no confirma una infección: conserva este informe, no restaures el móvil y consulta con un especialista en seguridad digital.",
    execInsufficient:
      "Se analizó un {device} el {date}, pero no se pudieron revisar suficientes datos para llegar a una conclusión. Vuelve a analizarlo con el móvil desbloqueado y conectado hasta el final.",
    checksTitle: "Comprobaciones",
    sessionTitle: "Sesión",
    start: "Inicio",
    end: "Fin",
    generatedNote:
      "Generado en tu ordenador con Enigm Scan. Ningún dato del móvil ni de este informe se ha enviado a Enigm.",
    findingsLead:
      "Cada indicio indica qué se encontró, dónde y qué hacer. Un indicio no confirma una infección.",
    noFindingsLead:
      "No hemos encontrado rastros de spyware conocido en los datos revisados.",
    page: "Página",
    promoTitle: "Ahora, habla en privado",
    promoCta: "Descubre Enigm en enigm.io",
    resultLabel: "Resultado",
    reviewTitle: "Puntos a revisar",
    reviewTag: "Para revisar",
    execReview:
      "Además, hay {reviews} {reviews|punto|puntos} a revisar: {reviews|un ajuste o app que no es spyware conocido, pero conviene comprobar que lo reconoces|ajustes o apps que no son spyware conocido, pero conviene comprobar que los reconoces}.",
    eventDate: "Fecha del evento",
    qrCaption: "Escanea para abrir enigm.io",
    promoPoints: [
      "Mensajes y llamadas cifrados de extremo a extremo",
      "Sin correo electrónico ni número de teléfono",
      "Una empresa suiza de privacidad",
    ],
    promoMore: [
      "Más información en enigm.io",
      "Documentación en docs.enigm.io",
    ],
  },
  en: {
    scanAnother: "Scan another phone",
    statsTitle: "Scan summary",
    bySeverity: "Signs by severity",
    noSignsAnyLevel: "None detected",
    duration: "Duration",
    reportTitle: "Spyware scan report",
    execTitle: "Executive summary",
    execClean:
      "An {device} was scanned on {date}. {files} {files|file was|files were} checked with {checks} checks and no trace of known spyware was found. No scan can guarantee 100% that a phone is clean, but this is a serious check.",
    execFindings:
      "An {device} was scanned on {date}. {files} {files|file was|files were} checked with {checks} checks and {findings} {findings|sign was|signs were} found ({breakdown}). A sign does not confirm an infection: keep this report, do not reset the phone and talk to a digital security specialist.",
    execInsufficient:
      "An {device} was scanned on {date}, but not enough data could be checked to reach a conclusion. Scan it again with the phone unlocked and connected until the end.",
    checksTitle: "Checks",
    sessionTitle: "Session",
    start: "Start",
    end: "End",
    generatedNote:
      "Created on your computer with Enigm Scan. No data from the phone or this report was sent to Enigm.",
    findingsLead:
      "Each sign shows what was found, where and what to do. A sign does not confirm an infection.",
    noFindingsLead:
      "We found no traces of known spyware in the data we checked.",
    page: "Page",
    promoTitle: "Now, talk in private",
    promoCta: "Discover Enigm at enigm.io",
    resultLabel: "Result",
    reviewTitle: "Points to review",
    reviewTag: "To review",
    execReview:
      "There {reviews|is|are} also {reviews} {reviews|point|points} to review: {reviews|a setting or app that is not known spyware, but worth checking that you recognise it|settings or apps that are not known spyware, but worth checking that you recognise them}.",
    eventDate: "Event date",
    qrCaption: "Scan to open enigm.io",
    promoPoints: [
      "End-to-end encrypted messages and calls",
      "No email address or phone number",
      "A Swiss privacy company",
    ],
    promoMore: ["More at enigm.io", "Documentation at docs.enigm.io"],
  },
  fr: {
    scanAnother: "Analyser un autre téléphone",
    statsTitle: "Résumé de l’analyse",
    bySeverity: "Indices par gravité",
    noSignsAnyLevel: "Aucun détecté",
    duration: "Durée",
    reportTitle: "Rapport d’analyse de logiciels espions",
    execTitle: "Synthèse",
    execClean:
      "Un {device} a été analysé le {date}. {files} {files|fichier a été vérifié|fichiers ont été vérifiés} avec {checks} contrôles et aucune trace de logiciel espion connu n’a été trouvée. Aucune analyse ne garantit à 100 % qu’un téléphone est sain, mais c’est une vérification sérieuse.",
    execFindings:
      "Un {device} a été analysé le {date}. {files} {files|fichier a été vérifié|fichiers ont été vérifiés} avec {checks} contrôles et {findings} {findings|indice a été trouvé|indices ont été trouvés} ({breakdown}). Un indice ne confirme pas une infection : conservez ce rapport, ne réinitialisez pas le téléphone et consultez un spécialiste de la sécurité numérique.",
    execInsufficient:
      "Un {device} a été analysé le {date}, mais trop peu de données ont pu être vérifiées pour conclure. Relancez l’analyse avec le téléphone déverrouillé et branché jusqu’à la fin.",
    checksTitle: "Contrôles",
    sessionTitle: "Session",
    start: "Début",
    end: "Fin",
    generatedNote:
      "Créé sur votre ordinateur avec Enigm Scan. Aucune donnée du téléphone ni de ce rapport n’a été envoyée à Enigm.",
    findingsLead:
      "Chaque indice indique ce qui a été trouvé, où, et quoi faire. Un indice ne confirme pas une infection.",
    noFindingsLead:
      "Nous n’avons trouvé aucune trace de logiciel espion connu dans les données examinées.",
    page: "Page",
    promoTitle: "Maintenant, parlez en privé",
    promoCta: "Découvrez Enigm sur enigm.io",
    resultLabel: "Résultat",
    reviewTitle: "Points à vérifier",
    reviewTag: "À vérifier",
    execReview:
      "Il y a aussi {reviews} {reviews|point|points} à vérifier : {reviews|un réglage ou une application qui n’est pas un logiciel espion connu, mais qu’il vaut mieux reconnaître|des réglages ou applications qui ne sont pas des logiciels espions connus, mais qu’il vaut mieux reconnaître}.",
    eventDate: "Date de l’événement",
    qrCaption: "Scannez pour ouvrir enigm.io",
    promoPoints: [
      "Messages et appels chiffrés de bout en bout",
      "Sans adresse e-mail ni numéro de téléphone",
      "Une entreprise suisse de confidentialité",
    ],
    promoMore: [
      "En savoir plus sur enigm.io",
      "Documentation sur docs.enigm.io",
    ],
  },
  de: {
    scanAnother: "Weiteres Telefon prüfen",
    statsTitle: "Zusammenfassung der Analyse",
    bySeverity: "Hinweise nach Schweregrad",
    noSignsAnyLevel: "Keine erkannt",
    duration: "Dauer",
    reportTitle: "Spyware-Analysebericht",
    execTitle: "Zusammenfassung",
    execClean:
      "Ein {device} wurde am {date} analysiert. {files} {files|Datei wurde|Dateien wurden} mit {checks} Prüfungen untersucht, und es wurde keine Spur bekannter Spyware gefunden. Keine Analyse garantiert zu 100 %, dass ein Smartphone sauber ist, aber dies ist eine ernsthafte Prüfung.",
    execFindings:
      "Ein {device} wurde am {date} analysiert. {files} {files|Datei wurde|Dateien wurden} mit {checks} Prüfungen untersucht, und es {findings|wurde|wurden} {findings} {findings|Hinweis|Hinweise} gefunden ({breakdown}). Ein Hinweis bestätigt keine Infektion: Bewahren Sie diesen Bericht auf, setzen Sie das Smartphone nicht zurück und wenden Sie sich an Fachleute für digitale Sicherheit.",
    execInsufficient:
      "Ein {device} wurde am {date} analysiert, aber es konnten nicht genug Daten geprüft werden, um zu einem Ergebnis zu kommen. Analysieren Sie es erneut, entsperrt und bis zum Ende angeschlossen.",
    checksTitle: "Prüfungen",
    sessionTitle: "Sitzung",
    start: "Beginn",
    end: "Ende",
    generatedNote:
      "Auf Ihrem Computer mit Enigm Scan erstellt. Keine Daten des Smartphones oder dieses Berichts wurden an Enigm gesendet.",
    findingsLead:
      "Jeder Hinweis zeigt, was gefunden wurde, wo und was zu tun ist. Ein Hinweis bestätigt keine Infektion.",
    noFindingsLead:
      "Wir haben in den geprüften Daten keine Spuren bekannter Spyware gefunden.",
    page: "Seite",
    promoTitle: "Jetzt privat sprechen",
    promoCta: "Enigm entdecken auf enigm.io",
    resultLabel: "Ergebnis",
    reviewTitle: "Zu prüfende Punkte",
    reviewTag: "Zu prüfen",
    execReview:
      "Außerdem gibt es {reviews} {reviews|zu prüfenden Punkt: eine Einstellung oder App, die keine bekannte Spyware ist, die Sie aber kennen sollten|zu prüfende Punkte: Einstellungen oder Apps, die keine bekannte Spyware sind, die Sie aber kennen sollten}.",
    eventDate: "Datum des Ereignisses",
    qrCaption: "Scannen, um enigm.io zu öffnen",
    promoPoints: [
      "Ende-zu-Ende-verschlüsselte Nachrichten und Anrufe",
      "Ohne E-Mail-Adresse oder Telefonnummer",
      "Ein Schweizer Unternehmen für Privatsphäre",
    ],
    promoMore: ["Mehr auf enigm.io", "Dokumentation auf docs.enigm.io"],
  },
  it: {
    scanAnother: "Analizza un altro telefono",
    statsTitle: "Riepilogo dell’analisi",
    bySeverity: "Segni per gravità",
    noSignsAnyLevel: "Nessuno rilevato",
    duration: "Durata",
    reportTitle: "Rapporto di analisi dello spyware",
    execTitle: "Sintesi",
    execClean:
      "È stato analizzato un {device} il {date}. {files|È stato controllato|Sono stati controllati} {files} file con {checks} verifiche e non è stata trovata alcuna traccia di spyware noti. Nessuna analisi garantisce al 100% che un telefono sia pulito, ma è un controllo serio.",
    execFindings:
      "È stato analizzato un {device} il {date}. {files|È stato controllato|Sono stati controllati} {files} file con {checks} verifiche e {findings|è stato trovato|sono stati trovati} {findings} {findings|segno|segni} ({breakdown}). Un segno non conferma un’infezione: conserva questo rapporto, non ripristinare il telefono e rivolgiti a uno specialista di sicurezza digitale.",
    execInsufficient:
      "È stato analizzato un {device} il {date}, ma non è stato possibile controllare abbastanza dati per concludere. Ripeti l’analisi con il telefono sbloccato e collegato fino alla fine.",
    checksTitle: "Verifiche",
    sessionTitle: "Sessione",
    start: "Inizio",
    end: "Fine",
    generatedNote:
      "Creato sul tuo computer con Enigm Scan. Nessun dato del telefono o di questo rapporto è stato inviato a Enigm.",
    findingsLead:
      "Ogni segno indica cosa è stato trovato, dove e cosa fare. Un segno non conferma un’infezione.",
    noFindingsLead:
      "Non abbiamo trovato tracce di spyware noti nei dati esaminati.",
    page: "Pagina",
    promoTitle: "Ora parla in privato",
    promoCta: "Scopri Enigm su enigm.io",
    resultLabel: "Risultato",
    reviewTitle: "Punti da verificare",
    reviewTag: "Da verificare",
    execReview:
      "{reviews|C’è anche|Ci sono anche} {reviews} {reviews|punto|punti} da verificare: {reviews|un’impostazione o app che non è uno spyware noto, ma che conviene riconoscere|impostazioni o app che non sono spyware noti, ma che conviene riconoscere}.",
    eventDate: "Data dell’evento",
    qrCaption: "Scansiona per aprire enigm.io",
    promoPoints: [
      "Messaggi e chiamate cifrati end-to-end",
      "Senza email né numero di telefono",
      "Un’azienda svizzera della privacy",
    ],
    promoMore: ["Scopri di più su enigm.io", "Documentazione su docs.enigm.io"],
  },
  pt: {
    scanAnother: "Analisar outro telemóvel",
    statsTitle: "Resumo da análise",
    bySeverity: "Sinais por gravidade",
    noSignsAnyLevel: "Nenhum detetado",
    duration: "Duração",
    reportTitle: "Relatório de análise de spyware",
    execTitle: "Resumo executivo",
    execClean:
      "Foi analisado um {device} em {date}. {files|Foi verificado|Foram verificados} {files} {files|ficheiro|ficheiros} com {checks} verificações e não foi encontrado nenhum vestígio de spyware conhecido. Nenhuma análise garante a 100 % que um telemóvel está limpo, mas é uma verificação séria.",
    execFindings:
      "Foi analisado um {device} em {date}. {files|Foi verificado|Foram verificados} {files} {files|ficheiro|ficheiros} com {checks} verificações e {findings|foi encontrado|foram encontrados} {findings} {findings|sinal|sinais} ({breakdown}). Um sinal não confirma uma infeção: guarde este relatório, não reponha o telemóvel e fale com um especialista em segurança digital.",
    execInsufficient:
      "Foi analisado um {device} em {date}, mas não foi possível verificar dados suficientes para chegar a uma conclusão. Volte a analisá-lo com o telemóvel desbloqueado e ligado até ao fim.",
    checksTitle: "Verificações",
    sessionTitle: "Sessão",
    start: "Início",
    end: "Fim",
    generatedNote:
      "Criado no seu computador com o Enigm Scan. Nenhum dado do telemóvel ou deste relatório foi enviado à Enigm.",
    findingsLead:
      "Cada sinal indica o que foi encontrado, onde e o que fazer. Um sinal não confirma uma infeção.",
    noFindingsLead:
      "Não encontrámos vestígios de spyware conhecido nos dados revistos.",
    page: "Página",
    promoTitle: "Agora, fale em privado",
    promoCta: "Conheça a Enigm em enigm.io",
    resultLabel: "Resultado",
    reviewTitle: "Pontos a rever",
    reviewTag: "Para rever",
    execReview:
      "Há ainda {reviews} {reviews|ponto|pontos} a rever: {reviews|uma definição ou app que não é spyware conhecido, mas convém confirmar que a reconhece|definições ou apps que não são spyware conhecido, mas convém confirmar que os reconhece}.",
    eventDate: "Data do evento",
    qrCaption: "Leia o código para abrir enigm.io",
    promoPoints: [
      "Mensagens e chamadas encriptadas de ponta a ponta",
      "Sem email nem número de telefone",
      "Uma empresa suíça de privacidade",
    ],
    promoMore: ["Mais informação em enigm.io", "Documentação em docs.enigm.io"],
  },
};
