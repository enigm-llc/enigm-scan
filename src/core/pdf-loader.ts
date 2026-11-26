type PdfModule = typeof import("./pdf");
let pending: Promise<PdfModule> | undefined;

/**
 * Loads the PDF exporter and jsPDF once per page. Each deploy replaces the
 * hashed chunks, so a page that waits until the end of a scan (often more than
 * an hour) to fetch them gets 404s and cannot export. Call it as soon as a
 * report can be produced; a failed load is retried on the next call.
 */
export function loadPdf(): Promise<PdfModule> {
  if (!pending) {
    const loading = import("./pdf").then(async (module) => {
      await module.loadJsPdf();
      return module;
    });
    pending = loading;
    loading.catch(() => {
      if (pending === loading) pending = undefined;
    });
  }
  return pending;
}

export function preloadPdf() {
  loadPdf().catch(() => {});
}
