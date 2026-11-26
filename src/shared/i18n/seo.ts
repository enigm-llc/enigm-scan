import type { Language } from "./i18n";

export type PageKey = "home" | "how" | "download";

/**
 * Per-page title (as in Enigm Command: what the page is, then " - Enigm
 * Scan") and description, in every language.
 */
export const seo: Record<Language, Record<PageKey, [string, string]>> = {
  es: {
    home: [
      "¿Te están espiando el móvil? Analízalo gratis",
      "Enigm Scan busca rastros de spyware conocido, como Pegasus o Predator, en tu iPhone o Android. Gratis, sin cuenta y sin que tus datos salgan de tu ordenador.",
    ],
    how: [
      "Cómo funciona el análisis de spyware",
      "Descarga la app, conecta tu móvil por cable y recibe un informe claro. Qué revisamos, qué necesitas y cómo protegemos tu privacidad.",
    ],
    download: [
      "Descarga Enigm Scan para Mac, Windows o Linux",
      "Descarga la app gratuita que analiza tu iPhone o Android desde tu ordenador. Sin instalación y sin cuenta; tus datos nunca salen de tu ordenador.",
    ],
  },
  en: {
    home: [
      "Is someone spying on your phone? Check it for free",
      "Enigm Scan looks for traces of known spyware such as Pegasus or Predator on your iPhone or Android. Free, no account, and your data never leaves your computer.",
    ],
    how: [
      "How the spyware scan works",
      "Download the app, connect your phone with a cable and get a clear report. What we check, what you need and how we protect your privacy.",
    ],
    download: [
      "Download Enigm Scan for Mac, Windows or Linux",
      "Download the free app that scans your iPhone or Android from your computer. No installation, no account; your data never leaves your computer.",
    ],
  },
  fr: {
    home: [
      "Votre téléphone est-il espionné ? Vérifiez-le gratuitement",
      "Enigm Scan recherche des traces de logiciels espions connus comme Pegasus ou Predator sur votre iPhone ou Android. Gratuit, sans compte, et vos données ne quittent jamais votre ordinateur.",
    ],
    how: [
      "Comment fonctionne l’analyse de logiciels espions",
      "Téléchargez l’app, branchez votre téléphone et recevez un rapport clair. Ce que nous vérifions, ce qu’il vous faut et comment nous protégeons votre vie privée.",
    ],
    download: [
      "Téléchargez Enigm Scan pour Mac, Windows ou Linux",
      "Téléchargez l’app gratuite qui analyse votre iPhone ou Android depuis votre ordinateur. Sans installation ni compte ; vos données ne quittent jamais votre ordinateur.",
    ],
  },
  de: {
    home: [
      "Wird Ihr Smartphone ausspioniert? Kostenlos prüfen",
      "Enigm Scan sucht auf Ihrem iPhone oder Android nach Spuren bekannter Spyware wie Pegasus oder Predator. Kostenlos, ohne Konto, und Ihre Daten verlassen nie Ihren Computer.",
    ],
    how: [
      "So funktioniert die Spyware-Analyse",
      "App herunterladen, Smartphone per Kabel anschließen, klaren Bericht erhalten. Was wir prüfen, was Sie brauchen und wie wir Ihre Privatsphäre schützen.",
    ],
    download: [
      "Enigm Scan für Mac, Windows oder Linux herunterladen",
      "Laden Sie die kostenlose App herunter, die Ihr iPhone oder Android-Gerät von Ihrem Computer aus prüft. Ohne Installation und Konto; Ihre Daten verlassen nie Ihren Computer.",
    ],
  },
  it: {
    home: [
      "Il tuo telefono è spiato? Controllalo gratis",
      "Enigm Scan cerca tracce di spyware noti come Pegasus o Predator sul tuo iPhone o Android. Gratis, senza account, e i tuoi dati non lasciano mai il computer.",
    ],
    how: [
      "Come funziona l’analisi dello spyware",
      "Scarica l’app, collega il telefono con un cavo e ricevi un rapporto chiaro. Cosa controlliamo, cosa ti serve e come proteggiamo la tua privacy.",
    ],
    download: [
      "Scarica Enigm Scan per Mac, Windows o Linux",
      "Scarica l’app gratuita che analizza il tuo iPhone o Android dal computer. Senza installazione né account; i tuoi dati non lasciano mai il computer.",
    ],
  },
  pt: {
    home: [
      "Estão a espiar o seu telemóvel? Verifique grátis",
      "O Enigm Scan procura vestígios de spyware conhecido, como Pegasus ou Predator, no seu iPhone ou Android. Grátis, sem conta, e os seus dados nunca saem do seu computador.",
    ],
    how: [
      "Como funciona a análise de spyware",
      "Descarregue a app, ligue o telemóvel por cabo e receba um relatório claro. O que verificamos, o que precisa e como protegemos a sua privacidade.",
    ],
    download: [
      "Descarregue o Enigm Scan para Mac, Windows ou Linux",
      "Descarregue a app gratuita que analisa o seu iPhone ou Android a partir do computador. Sem instalação nem conta; os seus dados nunca saem do seu computador.",
    ],
  },
};
