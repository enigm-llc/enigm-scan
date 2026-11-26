import type { Language } from "./i18n";
export const footerCopy: Record<
  Language,
  { legal: string; light: string; dark: string; system: string }
> = {
  en: { legal: "Legal", light: "Light", dark: "Dark", system: "System" },
  es: { legal: "Legal", light: "Claro", dark: "Oscuro", system: "Sistema" },
  fr: {
    legal: "Mentions légales",
    light: "Clair",
    dark: "Sombre",
    system: "Système",
  },
  de: { legal: "Rechtliches", light: "Hell", dark: "Dunkel", system: "System" },
  it: { legal: "Legale", light: "Chiaro", dark: "Scuro", system: "Sistema" },
  pt: { legal: "Jurídico", light: "Claro", dark: "Escuro", system: "Sistema" },
};
