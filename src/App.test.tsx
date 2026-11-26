// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import App from "./App";
import manifest from "../releases/manifest.json";
import { agentDictionaries } from "./shared/i18n/agent";
import * as agent from "./core/agent";
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "language", {
    configurable: true,
    value: "en",
  });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  window.scrollTo = vi.fn();
  history.replaceState(null, "", "/");
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, "__TAURI_INTERNALS__");
});
describe("website journey", () => {
  it("offers verified packages without device consent, reports or local connections", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: /^Your phone knows where you are, who you talk to and what you write\./,
      }),
    ).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByLabelText("Open a local report")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Scan my phone" }));
    fireEvent.click(screen.getByRole("button", { name: /^Your computer/ }));
    fireEvent.click(
      screen.getByRole("menuitemradio", { name: "macOS · Intel" }),
    );
    const downloads = screen.getAllByRole("link", {
      name: "Download Enigm Scan",
    });
    expect(
      downloads.some((link) =>
        link.getAttribute("href")?.includes("macos-x86_64.dmg"),
      ),
    ).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("changes product copy with the selected language", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open language list" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Español" }));
    expect(
      screen.getByRole("heading", {
        name: /^Tu móvil sabe dónde estás, con quién hablas y qué escribes\./,
      }),
    ).toBeTruthy();
  });
});
it("has six complete agent dictionaries", () => {
  for (const d of Object.values(agentDictionaries))
    expect(Object.keys(d).sort()).toEqual(
      Object.keys(agentDictionaries.en).sort(),
    );
});

it("routes an iPhone to the computer handoff without device-consent or app-launch controls", () => {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
  );
  render(<App />);
  // Phones see the promise and a way to learn how it works; nothing starts here.
  expect(screen.queryByRole("button", { name: "Scan my phone" })).toBeNull();
  expect(
    screen.getByRole("heading", {
      name: /^Your phone knows where you are/,
    }),
  ).toBeTruthy();
  expect(
    screen.getAllByText("Free, no account, no excuses").length,
  ).toBeGreaterThan(0);
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByRole("link", { name: "Open Enigm Scan" })).toBeNull();
  fireEvent.click(
    screen.getAllByRole("link", { name: /How Enigm Scan works/ })[0],
  );
  expect(location.pathname).toBe("/how-it-works");
  // The page ends with the handoff to a computer: one action, no field.
  expect(
    screen.getByRole("button", { name: /Copy link|Share link/ }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("textbox", { name: "Address for your computer" }),
  ).toBeNull();
});

it("opens the How it works page from the header and drops the privacy toggle", () => {
  render(<App />);
  expect(screen.queryByRole("button", { name: "Privacy" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Compatibility/ })).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "How it works" }));
  expect(location.pathname).toBe("/how-it-works");
  expect(
    screen.getByRole("heading", { name: /^Spyware hides well\./ }),
  ).toBeTruthy();
  expect(
    screen.getByRole("heading", { name: "Frequently asked questions" }),
  ).toBeTruthy();
  expect(
    screen.getByText(
      "Does my data, or my phone’s data, ever leave my computer?",
    ),
  ).toBeTruthy();
  expect(screen.getByText("Pegasus")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "Enigm Scan" }));
  expect(location.pathname).toBe("/");
  expect(
    screen.queryByRole("heading", { name: /^Spyware hides well\./ }),
  ).toBeNull();
});

it("uses the first supported browser language and keeps a saved choice", async () => {
  const { detectLanguage } = await import("./shared/i18n/i18n");
  const spy = vi.spyOn(navigator, "languages", "get");
  spy.mockReturnValue(["ca-ES", "es-ES", "en"]);
  expect(detectLanguage()).toBe("es");
  spy.mockReturnValue(["ja-JP", "de-CH"]);
  expect(detectLanguage()).toBe("de");
  spy.mockReturnValue(["ja-JP"]);
  expect(detectLanguage()).toBe("en");
  spy.mockReturnValue(["fr-FR"]);
  localStorage.setItem("enigm-scan-language", "it");
  render(<App />);
  expect(document.documentElement.lang).toBe("it");
});

it("serves How it works at an English URL and rewrites the Spanish one", () => {
  history.replaceState(null, "", "/como-funciona");
  render(<App />);
  expect(location.pathname).toBe("/how-it-works");
  expect(
    screen.getByRole("heading", { name: /^Spyware hides well\./ }),
  ).toBeTruthy();
});
