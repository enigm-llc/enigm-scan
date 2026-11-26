// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
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

it("gives each step its own URL and the logo returns to the start", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Scan my phone/ }));
  expect(location.pathname).toBe("/download");
  fireEvent.click(screen.getByRole("link", { name: "Enigm Scan" }));
  expect(location.pathname).toBe("/");
  expect(
    screen.getByRole("heading", { name: /^Your phone knows where you are/ }),
  ).toBeTruthy();
});
