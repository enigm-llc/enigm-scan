import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("./pdf");
  vi.resetModules();
});

describe("loadPdf", () => {
  it("fetches the exporter and jsPDF once per page", async () => {
    const { loadPdf } = await import("./pdf-loader");
    const first = loadPdf();
    expect(loadPdf()).toBe(first);
    const module = await first;
    expect(typeof module.downloadPdf).toBe("function");
  });

  it("retries after a failed chunk fetch", async () => {
    const loadJsPdf = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Failed to fetch dynamically imported module"),
      )
      .mockResolvedValue({});
    vi.doMock("./pdf", () => ({ loadJsPdf, downloadPdf: vi.fn() }));
    const { loadPdf, preloadPdf } = await import("./pdf-loader");
    preloadPdf();
    await expect(loadPdf()).rejects.toThrow("Failed to fetch");
    await expect(loadPdf()).resolves.toMatchObject({ loadJsPdf });
    expect(loadJsPdf).toHaveBeenCalledTimes(2);
  });
});
