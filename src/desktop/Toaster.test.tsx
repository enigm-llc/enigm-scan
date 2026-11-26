// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { Toaster } from "./Toaster";
import { clearToasts, toast } from "./toast";

afterEach(() => {
  cleanup();
  clearToasts();
  vi.useRealTimers();
});

it("shows each message once, at most three, and lets them go on their own", () => {
  vi.useFakeTimers();
  render(<Toaster />);
  act(() => {
    toast.error("The phone was disconnected.");
    toast.error("The phone was disconnected.");
    toast.info("One");
    toast.info("Two");
    toast.success("Report saved");
  });
  // The repeated message appears once; the oldest gives way to the newest.
  expect(screen.queryByText("The phone was disconnected.")).toBeNull();
  expect(screen.getAllByRole("status")).toHaveLength(3);
  act(() => {
    vi.advanceTimersByTime(10_000);
  });
  expect(screen.queryByText("Report saved")).toBeNull();
});

it("announces errors as alerts and closes a message when it is clicked", () => {
  render(<Toaster />);
  act(() => toast.error("Something went wrong."));
  const alert = screen.getByRole("alert");
  expect(alert.className).toContain("is-error");
  fireEvent.click(alert);
  expect(screen.queryByRole("alert")).toBeNull();
});
