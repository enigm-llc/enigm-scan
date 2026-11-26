import type { Language } from "./i18n";
type HomeCopy = {
  connect: string;
  consent: string;
  open: string;
  scan: string;
  report: string;
  intro: string;
};
export const homeCopy: Record<Language, HomeCopy> = {
  en: {
    connect: "I have opened the app",
    consent: "I am authorized to analyze this device.",
    scan: "Prepare",
    report: "Analysis",
    intro: "Check your phone’s security",
    open: "Open the portable app on this computer. Start the analysis there, then connect it below to follow its progress here.",
  },
  es: {
    connect: "Ya tengo la app abierta",
    consent: "Tengo autorización para analizar este dispositivo.",
    scan: "Preparar",
    report: "Análisis",
    intro: "Analiza la seguridad de tu móvil",
    open: "Abre la app portátil en este ordenador. Inicia allí el análisis y conéctala aquí para seguir su progreso.",
  },
  fr: {
    connect: "J’ai ouvert l’application",
    consent: "Je suis autorisé à analyser cet appareil.",
    scan: "Préparer",
    report: "Analyse",
    intro: "Vérifiez la sécurité de votre téléphone",
    open: "Ouvrez l’app portable sur cet ordinateur. Lancez l’analyse, puis connectez-la ici pour suivre sa progression.",
  },
  de: {
    connect: "Die App ist geöffnet",
    consent: "Ich bin zur Analyse dieses Geräts berechtigt.",
    scan: "Vorbereiten",
    report: "Analyse",
    intro: "Prüfen Sie die Sicherheit Ihres Smartphones",
    open: "Öffnen Sie die portable App auf diesem Computer. Starten Sie dort die Analyse und verbinden Sie sie hier, um den Fortschritt zu verfolgen.",
  },
  it: {
    connect: "Ho aperto l’app",
    consent: "Ho l’autorizzazione ad analizzare questo dispositivo.",
    scan: "Prepara",
    report: "Analisi",
    intro: "Verifica la sicurezza del tuo telefono",
    open: "Apri l’app portatile su questo computer. Avvia l’analisi e collegala qui per seguirne l’avanzamento.",
  },
  pt: {
    connect: "Já abri a app",
    consent: "Tenho autorização para analisar este dispositivo.",
    scan: "Preparar",
    report: "Análise",
    intro: "Analise a segurança do seu telemóvel",
    open: "Abra a app portátil neste computador. Inicie a análise e ligue-a aqui para acompanhar o progresso.",
  },
};
