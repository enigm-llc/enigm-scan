import type { Language } from "./i18n";
type SiteCopy = {
  start: string;
  source: string;
  copy: string;
  title: string;
  intro: string;
  download: string;
  runHelp: string;
  downloadTitle: string;
  connect: string;
  failed: string;
  open: string;
  ready: string;
  close: string;
  steps: string[];
  help: string;
  howButton: string;
  footer: string;
  retry: string;
  waiting: string;
};
export const siteCopy: Record<Language, SiteCopy> = {
  es: {
    title: "Tu móvil sabe dónde estás, con quién hablas y qué escribes.",
    intro: "Comprobamos que nadie más lo sepa.",
    download: "Descargar Enigm Scan",
    runHelp:
      "Enigm Scan es una app pequeña, sin instalación, que analiza tu móvil desde tu ordenador. Ábrela y te guía paso a paso. Tus datos nunca salen de tu ordenador.",
    downloadTitle: "Primero, la app",
    connect: "Conectar",
    failed:
      "No encontramos Enigm Scan en tu ordenador. Ábrelo y vuelve a intentarlo.",
    open: "Abrir Scan",
    ready: "Listo para conectar",
    close: "Desconectar",
    steps: ["Descarga", "Conecta", "Analiza"],
    help: "Cómo funciona",
    howButton: "Cómo funciona Enigm Scan",
    footer: "Swiss privacy",
    retry: "Reintentar conexión",
    waiting: "Esperando tu autorización en la web",
    start: "Analizar mi móvil",
    source: "Código abierto",
    copy: "Copiar enlace de conexión",
  },
  en: {
    title:
      "Your phone knows where you are, who you talk to and what you write.",
    intro: "We check that nobody else does.",
    download: "Download Enigm Scan",
    runHelp:
      "Enigm Scan is a small app, with nothing to install, that checks your phone from your computer. Open it and it guides you step by step. Your data never leaves your computer.",
    downloadTitle: "First, the app",
    connect: "Connect",
    failed: "We can’t find Enigm Scan on your computer. Open it and try again.",
    open: "Open Scan",
    ready: "Ready to connect",
    close: "Disconnect",
    steps: ["Download", "Connect", "Analyze"],
    help: "How it works",
    howButton: "How Enigm Scan works",
    footer: "Swiss privacy",
    retry: "Retry connection",
    waiting: "Waiting for your approval on the website",
    start: "Scan my phone",
    source: "Open source",
    copy: "Copy connection link",
  },
  fr: {
    title:
      "Votre téléphone sait où vous êtes, à qui vous parlez et ce que vous écrivez.",
    intro: "Nous vérifions que personne d’autre ne le sait.",
    download: "Télécharger Enigm Scan",
    runHelp:
      "Enigm Scan est une petite application, sans installation, qui analyse votre téléphone depuis votre ordinateur. Ouvrez-la, elle vous guide pas à pas. Vos données ne quittent jamais votre ordinateur.",
    downloadTitle: "D’abord, l’app",
    connect: "Connecter",
    failed:
      "Enigm Scan est introuvable sur votre ordinateur. Ouvrez-le et réessayez.",
    open: "Ouvrir Scan",
    ready: "Prêt à connecter",
    close: "Déconnecter",
    steps: ["Téléchargez", "Connectez", "Analysez"],
    help: "Fonctionnement",
    howButton: "Comment fonctionne Enigm Scan",
    footer: "Swiss privacy",
    retry: "Réessayer la connexion",
    waiting: "En attente de votre accord sur le site",
    start: "Analyser mon téléphone",
    source: "Code ouvert",
    copy: "Copier le lien de connexion",
  },
  de: {
    title:
      "Ihr Handy weiß, wo Sie sind, mit wem Sie sprechen und was Sie schreiben.",
    intro: "Wir prüfen, dass es sonst niemand weiß.",
    download: "Enigm Scan herunterladen",
    runHelp:
      "Enigm Scan ist eine kleine App ohne Installation, die Ihr Smartphone von Ihrem Computer aus prüft. Öffnen Sie sie, und sie führt Sie Schritt für Schritt. Ihre Daten verlassen Ihren Computer nie.",
    downloadTitle: "Zuerst die App",
    connect: "Verbinden",
    failed:
      "Enigm Scan wurde auf Ihrem Computer nicht gefunden. Öffnen Sie es und versuchen Sie es erneut.",
    open: "Scan öffnen",
    ready: "Bereit zur Verbindung",
    close: "Trennen",
    steps: ["Herunterladen", "Verbinden", "Analysieren"],
    help: "So funktioniert es",
    howButton: "So funktioniert Enigm Scan",
    footer: "Swiss privacy",
    retry: "Verbindung erneut versuchen",
    waiting: "Warten auf Ihre Zustimmung auf der Website",
    start: "Mein Handy prüfen",
    source: "Open Source",
    copy: "Verbindungslink kopieren",
  },
  it: {
    title: "Il tuo telefono sa dove sei, con chi parli e cosa scrivi.",
    intro: "Controlliamo che nessun altro lo sappia.",
    download: "Scarica Enigm Scan",
    runHelp:
      "Enigm Scan è una piccola app, senza installazione, che analizza il telefono dal tuo computer. Aprila e ti guida passo dopo passo. I tuoi dati non lasciano mai il tuo computer.",
    downloadTitle: "Prima, l’app",
    connect: "Collega",
    failed: "Non troviamo Enigm Scan sul tuo computer. Aprilo e riprova.",
    open: "Apri Scan",
    ready: "Pronto alla connessione",
    close: "Disconnetti",
    steps: ["Scarica", "Collega", "Analizza"],
    help: "Come funziona",
    howButton: "Come funziona Enigm Scan",
    footer: "Swiss privacy",
    retry: "Riprova la connessione",
    waiting: "In attesa della tua autorizzazione sul sito",
    start: "Analizza il mio telefono",
    source: "Codice aperto",
    copy: "Copia il link di connessione",
  },
  pt: {
    title: "O seu telemóvel sabe onde está, com quem fala e o que escreve.",
    intro: "Confirmamos que mais ninguém sabe.",
    download: "Descarregar o Enigm Scan",
    runHelp:
      "O Enigm Scan é uma pequena app, sem instalação, que analisa o seu telemóvel a partir do computador. Abra-a e ela guia-o passo a passo. Os seus dados nunca saem do seu computador.",
    downloadTitle: "Primeiro, a app",
    connect: "Ligar",
    failed:
      "Não encontramos o Enigm Scan no seu computador. Abra-o e tente novamente.",
    open: "Abrir Scan",
    ready: "Pronto para ligar",
    close: "Desligar",
    steps: ["Transfere", "Liga", "Analisa"],
    help: "Como funciona",
    howButton: "Como funciona o Enigm Scan",
    footer: "Swiss privacy",
    retry: "Tentar ligar novamente",
    waiting: "À espera da sua autorização no site",
    start: "Analisar o meu telemóvel",
    source: "Código aberto",
    copy: "Copiar ligação de conexão",
  },
};
