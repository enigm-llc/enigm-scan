import type { Language } from "./i18n";

type DownloadText = {
  title: string;
  notice: string;
  download: string;
  help: string;
  mobile: string;
};
export const downloadText: Record<Language, DownloadText> = {
  en: {
    title: "Download Enigm Scan",
    notice:
      "Test candidate · unsigned. Real-device validation and Apple notarization are pending.",
    download: "Download",
    help: "macOS 13+: choose the package for your processor. Linux: AppImage x64. Keep operating-system protections enabled; macOS may block this unsigned build.",
    mobile: "Download and run the scanner on a computer.",
  },
  es: {
    title: "Descargar Enigm Scan",
    notice:
      "Candidato de prueba · sin firma. Pendientes la validación en dispositivos reales y la notarización de Apple.",
    download: "Descargar",
    help: "macOS 13+: elige el paquete para tu procesador. Linux: AppImage x64. Mantén activadas las protecciones del sistema; macOS puede bloquear esta versión sin firma.",
    mobile: "Descarga y ejecuta el escáner desde un ordenador.",
  },
  fr: {
    title: "Télécharger Enigm Scan",
    notice:
      "Version de test · non signée. La validation sur appareils réels et la notarisation Apple restent à effectuer.",
    download: "Télécharger",
    help: "macOS 13+ : choisissez le paquet adapté à votre processeur. Linux : AppImage x64. Gardez les protections du système activées ; macOS peut bloquer cette version non signée.",
    mobile: "Téléchargez et exécutez le scanner sur un ordinateur.",
  },
  de: {
    title: "Enigm Scan herunterladen",
    notice:
      "Testversion · nicht signiert. Tests mit realen Geräten und Apple-Notarisierung stehen aus.",
    download: "Herunterladen",
    help: "macOS 13+: Paket passend zum Prozessor wählen. Linux: AppImage x64. Lassen Sie den Systemschutz aktiviert; macOS kann diese unsignierte Version blockieren.",
    mobile:
      "Laden Sie den Scanner auf einem Computer herunter und führen Sie ihn dort aus.",
  },
  it: {
    title: "Scarica Enigm Scan",
    notice:
      "Versione di prova · non firmata. Validazione su dispositivi reali e notarizzazione Apple ancora da completare.",
    download: "Scarica",
    help: "macOS 13+: scegli il pacchetto per il tuo processore. Linux: AppImage x64. Mantieni attive le protezioni del sistema; macOS potrebbe bloccare questa versione non firmata.",
    mobile: "Scarica ed esegui lo scanner su un computer.",
  },
  pt: {
    title: "Transferir Enigm Scan",
    notice:
      "Versão de teste · sem assinatura. A validação em dispositivos reais e a notarização Apple estão pendentes.",
    download: "Transferir",
    help: "macOS 13+: escolha o pacote para o seu processador. Linux: AppImage x64. Mantenha as proteções do sistema ativas; o macOS pode bloquear esta versão sem assinatura.",
    mobile: "Transfere e executa o scanner num computador.",
  },
};
