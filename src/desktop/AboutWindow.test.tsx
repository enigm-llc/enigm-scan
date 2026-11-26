// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AboutWindow from "./AboutWindow";

beforeEach(() => {
  Object.defineProperty(navigator, "language", {
    configurable: true,
    value: "en",
  });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

it("shows the app, its version, release date and copyright", () => {
  window.history.replaceState(
    null,
    "",
    "/?about&version=0.7.1&released=2026-11-26",
  );
  render(<AboutWindow />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "Enigm Scan",
  );
  expect(screen.getByText("Version 0.7.1")).toBeTruthy();
  // The date follows the language's own format (in English, "Nov 26, 2026").
  expect(screen.getByText(/^Released .*26.*2026$/)).toBeTruthy();
  expect(screen.getByText("© 2026 Enigm")).toBeTruthy();
});

it("ignores a version or a date that is not well formed", () => {
  window.history.replaceState(
    null,
    "",
    "/?about&version=<b>1</b>&released=yesterday",
  );
  render(<AboutWindow />);
  expect(screen.queryByText(/Version/)).toBeNull();
  expect(screen.queryByText(/Released/)).toBeNull();
});
