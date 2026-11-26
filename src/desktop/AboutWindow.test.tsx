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

it("shows the app, its version and where to find it", () => {
  window.history.replaceState(null, "", "/?about&version=0.7.0");
  render(<AboutWindow />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "Enigm Scan",
  );
  expect(screen.getByText("Version 0.7.0")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Website" }).getAttribute("href"),
  ).toBe("https://scan.enigm.io");
  expect(
    screen.getByRole("link", { name: "Source code" }).getAttribute("href"),
  ).toBe("https://github.com/enigm-llc/enigm-scan");
  expect(screen.getByText("PolyForm Noncommercial 1.0.0")).toBeTruthy();
});

it("ignores a version that is not a plain number", () => {
  window.history.replaceState(null, "", "/?about&version=<b>1</b>");
  render(<AboutWindow />);
  expect(screen.queryByText(/Version/)).toBeNull();
});
