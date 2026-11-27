import type { Language } from "./i18n";
type SiteCopy = {
  start: string;
  title: string;
  intro: string;
  download: string;
  runHelp: string;
  downloadTitle: string;
  help: string;
  howButton: string;
  footer: string;
};
export const siteCopy: Record<Language, SiteCopy> = {
  es: {
    title: "Tu móvil sabe dónde estás, con quién hablas y qué escribes.",
    intro: "Comprobamos que nadie más lo sepa",
    download: "Descargar Enigm Scan",
    runHelp:
      "Enigm Scan es una app pequeña, sin instalación, que analiza tu móvil desde tu ordenador. Ábrela y te guía paso a paso. Tus datos nunca salen de tu ordenador.",
    downloadTitle: "Primero, la app",
    help: "Cómo funciona",
    howButton: "Cómo funciona Enigm Scan",
    footer: "Swiss privacy",
    start: "Analizar mi móvil",
  },
  en: {
    title:
      "Your phone knows where you are, who you talk to and what you write.",
    intro: "We check that nobody else does",
    download: "Download Enigm Scan",
    runHelp:
      "Enigm Scan is a small app, with nothing to install, that checks your phone from your computer. Open it and it guides you step by step. Your data never leaves your computer.",
    downloadTitle: "First, the app",
    help: "How it works",
    howButton: "How Enigm Scan works",
    footer: "Swiss privacy",
    start: "Scan my phone",
  },
  fr: {
    title:
      "Votre téléphone sait où vous êtes, à qui vous parlez et ce que vous écrivez.",
    intro: "Nous vérifions que personne d’autre ne le sait",
    download: "Télécharger Enigm Scan",
    runHelp:
      "Enigm Scan est une petite application, sans installation, qui analyse votre téléphone depuis votre ordinateur. Ouvrez-la, elle vous guide pas à pas. Vos données ne quittent jamais votre ordinateur.",
    downloadTitle: "D’abord, l’app",
    help: "Fonctionnement",
    howButton: "Comment fonctionne Enigm Scan",
    footer: "Swiss privacy",
    start: "Analyser mon téléphone",
  },
  de: {
    title:
      "Ihr Handy weiß, wo Sie sind, mit wem Sie sprechen und was Sie schreiben.",
    intro: "Wir prüfen, dass es sonst niemand weiß",
    download: "Enigm Scan herunterladen",
    runHelp:
      "Enigm Scan ist eine kleine App ohne Installation, die Ihr Smartphone von Ihrem Computer aus prüft. Öffnen Sie sie, und sie führt Sie Schritt für Schritt. Ihre Daten verlassen Ihren Computer nie.",
    downloadTitle: "Zuerst die App",
    help: "So funktioniert es",
    howButton: "So funktioniert Enigm Scan",
    footer: "Swiss privacy",
    start: "Mein Handy prüfen",
  },
  it: {
    title: "Il tuo telefono sa dove sei, con chi parli e cosa scrivi.",
    intro: "Controlliamo che nessun altro lo sappia",
    download: "Scarica Enigm Scan",
    runHelp:
      "Enigm Scan è una piccola app, senza installazione, che analizza il telefono dal tuo computer. Aprila e ti guida passo dopo passo. I tuoi dati non lasciano mai il tuo computer.",
    downloadTitle: "Prima, l’app",
    help: "Come funziona",
    howButton: "Come funziona Enigm Scan",
    footer: "Swiss privacy",
    start: "Analizza il mio telefono",
  },
  pt: {
    title: "O seu telemóvel sabe onde está, com quem fala e o que escreve.",
    intro: "Confirmamos que mais ninguém sabe",
    download: "Descarregar o Enigm Scan",
    runHelp:
      "O Enigm Scan é uma pequena app, sem instalação, que analisa o seu telemóvel a partir do computador. Abra-a e ela guia-o passo a passo. Os seus dados nunca saem do seu computador.",
    downloadTitle: "Primeiro, a app",
    help: "Como funciona",
    howButton: "Como funciona o Enigm Scan",
    footer: "Swiss privacy",
    start: "Analisar o meu telemóvel",
  },
};
