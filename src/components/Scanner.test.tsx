// @vitest-environment jsdom
import { flowCopy } from "../shared/i18n/flow";
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { productCopy } from "../shared/i18n/product";
import { Scanner } from "./Scanner";
import { dictionaries } from "../shared/i18n/i18n";
import { agentDictionaries } from "../shared/i18n/agent";
import { native } from "../core/agent";
vi.mock("../core/agent", () => ({ native: vi.fn(), isDesktop: () => false }));
const a = agentDictionaries.en;
const caps = {
  rules: 759,
  ruleVersion: 2026102501,
  iosUsb: false,
  androidUsb: true,
  mvtIos: true,
  mvtAndroid: true,
};
beforeEach(() =>
  vi.mocked(native).mockImplementation(async (command) => {
    if (command === "capabilities") return caps;
    if (command === "choose_evidence") return "Synthetic fixture";
    if (command === "list_devices")
      return [{ id: "test-device", platform: "android", authorized: true }];
    if (command === "scan_status")
      return { phase: "ready", artifacts: 0, report: null, error: null };
    return null;
  }),
);
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const mount = () =>
  render(<Scanner language="en" t={dictionaries.en} onReport={vi.fn()} />);
it("requires consent for device discovery and selects the sole authorized device", async () => {
  mount();
  const detect = screen.getByRole("button", {
    name: "Find my phone",
  }) as HTMLButtonElement;
  expect(detect.disabled).toBe(true);
  expect(native).not.toHaveBeenCalledWith("list_devices", expect.anything());
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  await waitFor(() => expect(detect.disabled).toBe(false));
  fireEvent.click(detect);
  const start = await screen.findByRole("button", { name: "Start scan" });
  fireEvent.click(start);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("start_scan", {
      request: expect.objectContaining({
        device: "android",
        usbId: "test-device",
        consent: true,
        phoneIp: null,
        // Android reads its open connections by default (the option starts on).
        pcapConsent: true,
      }),
    }),
  );
  fireEvent.click(await screen.findByRole("button", { name: a.cancel }));
  expect(native).toHaveBeenCalledWith("cancel_scan");
});
it("offers the same connections option on Android, on by default, and honours it", async () => {
  const original = vi.mocked(native).getMockImplementation()!;
  vi.mocked(native).mockImplementation(async (...args) =>
    args[0] === "capabilities" ? caps : original(...args),
  );
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  const detect = screen.getByRole("button", { name: "Find my phone" });
  await waitFor(() =>
    expect((detect as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(detect);
  const start = await screen.findByRole("button", { name: "Start scan" });
  const connections = screen.getByRole("checkbox", {
    name: /^Also check its connections/,
  }) as HTMLInputElement;
  expect(connections.checked).toBe(true);
  expect(screen.getByText(flowCopy.en.optionNetworkAndroid)).toBeTruthy();
  // The iPhone-only deep check is not offered for Android.
  expect(
    screen.queryByRole("checkbox", {
      name: new RegExp(flowCopy.en.optionDeep),
    }),
  ).toBeNull();
  fireEvent.click(connections);
  fireEvent.click(start);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("start_scan", {
      request: expect.objectContaining({
        device: "android",
        pcapConsent: false,
      }),
    }),
  );
});
it("offers the iPhone deep check as an option, off by default", async () => {
  const original = vi.mocked(native).getMockImplementation()!;
  vi.mocked(native).mockImplementation(async (...args) => {
    if (args[0] === "capabilities") return { ...caps, iosUsb: true };
    if (args[0] === "list_devices")
      return [{ id: "iphone-fixture", platform: "ios", authorized: true }];
    return original(...args);
  });
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  const detect = screen.getByRole("button", { name: "Find my phone" });
  await waitFor(() =>
    expect((detect as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(detect);
  await screen.findByRole("button", { name: "Start scan" });
  const deep = screen.getByRole("checkbox", {
    name: new RegExp("^" + flowCopy.en.optionDeep),
  }) as HTMLInputElement;
  const network = screen.getByRole("checkbox", {
    name: /^Also check its connections/,
  }) as HTMLInputElement;
  expect(deep.checked).toBe(false);
  expect(network.checked).toBe(false);
  expect(screen.getByText(flowCopy.en.optionNetworkIos)).toBeTruthy();
});
it("never selects an unauthorized device or enables unavailable transports", async () => {
  const original = vi.mocked(native).getMockImplementation()!;
  vi.mocked(native).mockImplementation(async (...args) =>
    args[0] === "list_devices"
      ? [{ id: "locked", platform: "android", authorized: false }]
      : original(...args),
  );
  mount();
  await screen.findByText(/iPhone cable acquisition is not available/);
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Find my phone",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Find my phone" }));
  await screen.findByText(flowCopy.en.bannerUnlock);
  expect(screen.queryByRole("button", { name: "Start scan" })).toBeNull();
  expect(native).not.toHaveBeenCalledWith("start_scan", expect.anything());
});
it("requires explicit choice when more than one phone is authorized", async () => {
  const original = vi.mocked(native).getMockImplementation()!;
  vi.mocked(native).mockImplementation(async (...args) =>
    args[0] === "list_devices"
      ? ["one", "two"].map((id) => ({
          id,
          platform: "android",
          authorized: true,
        }))
      : original(...args),
  );
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Find my phone",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Find my phone",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Find my phone" }));
  await screen.findByText("two");
  expect(screen.queryByRole("button", { name: "Start scan" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Android.*two/ }));
  expect(screen.getByRole("button", { name: "Start scan" })).toBeTruthy();
});
it("blocks a double start while native authorization is pending", async () => {
  const original = vi.mocked(native).getMockImplementation()!;
  vi.mocked(native).mockImplementation(async (...args) =>
    args[0] === "start_scan" ? new Promise(() => {}) : original(...args),
  );
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  const detect = screen.getByRole("button", {
    name: "Find my phone",
  }) as HTMLButtonElement;
  await waitFor(() => expect(detect.disabled).toBe(false));
  fireEvent.click(detect);
  const start = await screen.findByRole("button", { name: "Start scan" });
  fireEvent.click(start);
  fireEvent.click(start);
  expect(
    vi
      .mocked(native)
      .mock.calls.filter(([command]) => command === "start_scan"),
  ).toHaveLength(1);
});

it("keeps iPhone trust pending and requires explicit network opt-in", async () => {
  const original = vi.mocked(native).getMockImplementation()!;
  vi.mocked(native).mockImplementation(async (...args) => {
    if (args[0] === "capabilities") return { ...caps, iosUsb: true };
    if (args[0] === "list_devices")
      return [
        {
          id: "iphone-fixture",
          name: "iPhone test",
          platform: "ios",
          authorized: false,
          needsTrust: true,
        },
      ];
    if (args[0] === "scan_status")
      return {
        phase: "failed",
        artifacts: 0,
        report: null,
        error: "backup_password_required",
      };
    return original(...args);
  });
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  const detect = screen.getByRole("button", {
    name: "Find my phone",
  }) as HTMLButtonElement;
  await waitFor(() => expect(detect.disabled).toBe(false));
  fireEvent.click(detect);
  const scan = await screen.findByRole("button", { name: "Start scan" });
  const network = screen.getByRole("checkbox", {
    name: /^Also check its connections/,
  }) as HTMLInputElement;
  expect(network.checked).toBe(false);
  fireEvent.click(network);
  fireEvent.click(scan);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("start_scan", {
      request: expect.objectContaining({
        device: "ios",
        usbId: "iphone-fixture",
        pcapConsent: true,
        backupPassword: null,
      }),
    }),
  );
  const password = await screen.findByLabelText(a.backupPassword, {
    exact: false,
  });
  expect(
    (screen.getByRole("button", { name: "Start scan" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.change(password, { target: { value: "synthetic-password" } });
  expect(
    (screen.getByRole("button", { name: "Start scan" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

it("offers iPhone-only discovery after automatic discovery fails, preserving consent", async () => {
  const implementation = vi.mocked(native).getMockImplementation()!;
  vi.mocked(native).mockImplementation(async (command, args) => {
    if (command === "list_devices") {
      if (args?.device === "auto") throw new Error("adb_server_failed");
      return [{ id: "iphone-retry", platform: "ios", authorized: true }];
    }
    return implementation(command, args);
  });
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Find my phone",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Find my phone" }));
  const retry = await screen.findByRole("button", {
    name: "Retry with iPhone",
  });
  expect(screen.getByText("adb_server_failed")).toBeTruthy();
  fireEvent.click(retry);
  await screen.findByRole("button", { name: "Start scan" });
  expect(native).toHaveBeenCalledWith("list_devices", {
    device: "ios",
    consent: true,
    locale: "en",
  });
  expect(screen.queryByText("adb_server_failed")).toBeNull();
});

it("explains native consent refusal without displaying arbitrary native errors", async () => {
  const implementation = vi.mocked(native).getMockImplementation()!;
  vi.mocked(native).mockImplementation(async (command, args) => {
    if (command === "list_devices") throw new Error("consent_required");
    return implementation(command, args);
  });
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  await waitFor(() =>
    expect(
      (
        screen.getByRole("button", {
          name: "Find my phone",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "Find my phone" }));
  await screen.findByText(/Authorization in the Enigm Scan window is required/);
});
it("prepares the user for iPhone prompts and explains each phone-side failure", async () => {
  for (const [error, message] of [
    ["device_locked", a.deviceLocked],
    ["device_disconnected", a.deviceDisconnected],
    ["device_not_trusted", a.deviceNotTrusted],
    ["device_trust_denied", a.deviceTrustDenied],
    ["device_passcode_timeout", a.devicePasscodeTimeout],
    ["device_cancelled", a.deviceCancelled],
  ]) {
    let started = false;
    let starts = 0;
    vi.mocked(native).mockImplementation(async (command) => {
      if (command === "capabilities") return { ...caps, iosUsb: true };
      if (command === "list_devices")
        return [{ id: "iphone-fixture", platform: "ios", authorized: true }];
      if (command === "start_scan") {
        started = true;
        starts += 1;
        return null;
      }
      if (command === "scan_status")
        return started
          ? { phase: "failed", artifacts: 0, report: null, error }
          : { phase: "ready", artifacts: 0, report: null, error: null };
      return null;
    });
    mount();
    fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
    const detect = screen.getByRole("button", {
      name: "Find my phone",
    }) as HTMLButtonElement;
    await waitFor(() => expect(detect.disabled).toBe(false));
    fireEvent.click(detect);
    const scan = await screen.findByRole("button", { name: "Start scan" });
    // The ready screen itself prepares the person for Trust and the passcode.
    expect(screen.getByText(flowCopy.en.readyIos)).toBeTruthy();
    fireEvent.click(scan);
    expect((await screen.findByRole("alert")).textContent).toBe(message);
    // The phone stays chosen: "Try again" restarts the scan directly.
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(starts).toBe(2));
    cleanup();
  }
});
it("shows an allowlisted diagnostic code when an iPhone copy fails unexpectedly", async () => {
  for (const [diagnostic, shown] of [
    [
      "exc:RuntimeError>OSError",
      "acquisition_failed · exc:RuntimeError>OSError",
    ],
    ["/Users/someone/secret backup", "acquisition_failed"],
  ]) {
    let started = false;
    vi.mocked(native).mockImplementation(async (command) => {
      if (command === "capabilities") return { ...caps, iosUsb: true };
      if (command === "list_devices")
        return [{ id: "iphone-fixture", platform: "ios", authorized: true }];
      if (command === "start_scan") {
        started = true;
        return null;
      }
      if (command === "scan_status")
        return started
          ? {
              phase: "failed",
              artifacts: 0,
              report: null,
              error: "acquisition_failed",
              diagnostic,
            }
          : { phase: "ready", artifacts: 0, report: null, error: null };
      return null;
    });
    mount();
    fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
    const detect = screen.getByRole("button", {
      name: "Find my phone",
    }) as HTMLButtonElement;
    await waitFor(() => expect(detect.disabled).toBe(false));
    fireEvent.click(detect);
    fireEvent.click(await screen.findByRole("button", { name: "Start scan" }));
    expect((await screen.findByRole("alert")).textContent).toBe(a.failCopy);
    expect(document.querySelector(".diagnostic-code code")?.textContent).toBe(
      shown,
    );
    expect(document.body.textContent).not.toContain("secret");
    cleanup();
  }
});
it("keeps the ready step to the options: no USB speed note, no second consent", async () => {
  for (const [usbSpeed, warned] of [
    [480_000_000, true],
    [5_000_000_000, false],
    [undefined, false],
  ] as const) {
    vi.mocked(native).mockImplementation(async (command) => {
      if (command === "capabilities") return { ...caps, iosUsb: true };
      if (command === "list_devices")
        return [
          { id: "iphone-fixture", platform: "ios", authorized: true, usbSpeed },
        ];
      if (command === "scan_status")
        return { phase: "ready", artifacts: 0, report: null, error: null };
      return null;
    });
    mount();
    fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
    const detect = screen.getByRole("button", {
      name: "Find my phone",
    }) as HTMLButtonElement;
    await waitFor(() => expect(detect.disabled).toBe(false));
    fireEvent.click(detect);
    await screen.findByRole("button", { name: "Start scan" });
    void warned;
    expect(screen.queryByText(a.usbSlow)).toBeNull();
    // Consent was given before the search; it is not asked again here.
    expect(screen.queryByRole("checkbox", { name: a.consent })).toBeNull();
    cleanup();
  }
});
it("waits for “Allow USB debugging” by itself and selects the phone once allowed", async () => {
  let refreshes = 0;
  let searches = 0;
  vi.mocked(native).mockImplementation(async (command) => {
    if (command === "capabilities") return caps;
    if (command === "list_devices") {
      searches += 1;
      return [{ id: "pixel", platform: "android", authorized: false }];
    }
    if (command === "refresh_devices") {
      refreshes += 1;
      return [{ id: "pixel", platform: "android", authorized: refreshes >= 2 }];
    }
    if (command === "scan_status")
      return { phase: "ready", artifacts: 0, report: null, error: null };
    return null;
  });
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  const detect = screen.getByRole("button", { name: "Find my phone" });
  await waitFor(() =>
    expect((detect as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(detect);
  expect(
    await screen.findByText(a.androidAllow, { exact: false }),
  ).toBeTruthy();
  expect(
    screen.getByText(/Waiting time left: 3:00|Waiting time left: 2:5\d/),
  ).toBeTruthy();
  const start = await screen.findByRole(
    "button",
    { name: "Start scan" },
    { timeout: 8000 },
  );
  await waitFor(() =>
    expect((start as HTMLButtonElement).disabled).toBe(false),
  );
  // One search and one consent: the rest came from the session's ADB server.
  expect(searches).toBe(1);
  expect(refreshes).toBe(2);
}, 15000);
it("offers to try again when the phone is not allowed within three minutes", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.mocked(native).mockImplementation(async (command) => {
    if (command === "capabilities") return caps;
    if (command === "list_devices" || command === "refresh_devices")
      return [{ id: "pixel", platform: "android", authorized: false }];
    if (command === "scan_status")
      return { phase: "ready", artifacts: 0, report: null, error: null };
    return null;
  });
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  const detect = screen.getByRole("button", { name: "Find my phone" });
  await waitFor(() =>
    expect((detect as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(detect);
  await screen.findByText(a.androidAllow, { exact: false });
  await vi.advanceTimersByTimeAsync(182_000);
  expect(await screen.findByText(a.androidAllowTimeout)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  vi.useRealTimers();
});
