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
import { Toaster } from "../desktop/Toaster";
import { clearToasts } from "../desktop/toast";
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
  clearToasts();
  sessionStorage.clear();
  vi.resetAllMocks();
});
// Messages appear at the top of the app window, as in the app itself.
const mount = () =>
  render(
    <>
      <Toaster />
      <Scanner language="en" t={dictionaries.en} onReport={vi.fn()} />
    </>,
  );
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
/** An iPhone whose adapter moves through the phases the test sets. It is
 *  paired as soon as it is found, already trusted when `trusted` is set. */
function iphoneSession(options: { trusted?: boolean; device?: object } = {}) {
  const state = {
    phase: "ready",
    error: null as string | null,
    diagnostic: undefined as string | undefined,
    sysdiagnose: "",
    starts: 0,
    // What the copy ends with once Start is pressed.
    afterStart: { phase: "acquiring", error: null as string | null },
  };
  vi.mocked(native).mockImplementation(async (...args) => {
    const [command] = args;
    if (command === "capabilities") return { ...caps, iosUsb: true };
    if (command === "list_devices")
      return [
        {
          id: "iphone-fixture",
          platform: "ios",
          authorized: !!options.trusted,
          needsTrust: !options.trusted,
          ...options.device,
        },
      ];
    if (command === "start_scan") {
      state.starts += 1;
      state.error = null;
      state.phase = options.trusted ? "trusted" : "awaiting_trust";
      return null;
    }
    if (command === "cancel_scan") {
      state.phase = "cancelled";
      return null;
    }
    if (command === "finish_scan") {
      state.phase = "ready";
      return null;
    }
    if (command === "begin_copy") {
      state.phase = state.afterStart.phase;
      state.error = state.afterStart.error;
      return null;
    }
    if (command === "scan_status")
      return {
        phase: state.phase,
        artifacts: 0,
        report: null,
        error: state.error,
        diagnostic: state.diagnostic,
        acquisition: state.sysdiagnose
          ? {
              phase: state.phase,
              kept: 0,
              discarded: 0,
              receivedBytes: 0,
              storedBytes: 0,
              sysdiagnose: state.sysdiagnose,
            }
          : undefined,
      };
    return null;
  });
  return state;
}
async function search() {
  mount();
  fireEvent.click(screen.getByRole("checkbox", { name: a.consent }));
  const detect = screen.getByRole("button", { name: "Find my phone" });
  await waitFor(() =>
    expect((detect as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(detect);
}
async function readyIphone() {
  await search();
  const start = (await screen.findByRole("button", {
    name: "Start scan",
  })) as HTMLButtonElement;
  const deep = screen.getByRole("checkbox", {
    name: new RegExp("^" + flowCopy.en.optionDeep),
  }) as HTMLInputElement;
  const network = screen.getByRole("checkbox", {
    name: /^Also check its connections/,
  }) as HTMLInputElement;
  return { start, deep, network };
}
it("offers the iPhone deep check as an option, off by default", async () => {
  iphoneSession({ trusted: true });
  const { start, deep, network } = await readyIphone();
  expect(deep.checked).toBe(false);
  expect(network.checked).toBe(false);
  expect(screen.getByText(flowCopy.en.optionNetworkIos)).toBeTruthy();
  await waitFor(() => expect(start.disabled).toBe(false));
});
it("asks the iPhone for Trust while searching, as Android asks for USB debugging", async () => {
  const state = iphoneSession();
  await search();
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("start_scan", {
      request: expect.objectContaining({
        device: "ios",
        usbId: "iphone-fixture",
        hold: true,
      }),
    }),
  );
  // Still the search step: the phone asks for Trust there.
  await screen.findByText(flowCopy.en.deepTrustHint);
  expect(screen.queryByRole("button", { name: "Start scan" })).toBeNull();
  expect(
    (screen.getByRole("button", { name: "Find my phone" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  state.phase = "trusted";
  const start = (await screen.findByRole("button", {
    name: "Start scan",
  })) as HTMLButtonElement;
  expect(screen.getByText(flowCopy.en.readyIos)).toBeTruthy();
  await waitFor(() => expect(start.disabled).toBe(false));
  fireEvent.click(start);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("begin_copy", {
      captureNetwork: false,
    }),
  );
  expect(state.starts).toBe(1);
});
it("prepares a chosen deep check on the ready step and starts only once the phone confirms it", async () => {
  const state = iphoneSession({ trusted: true });
  const { start, deep, network } = await readyIphone();
  await waitFor(() => expect(start.disabled).toBe(false));
  fireEvent.click(deep);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("prepare_deep_check", {
      enabled: true,
    }),
  );
  expect(start.disabled).toBe(true);
  state.phase = "deep_wait";
  await screen.findByText(flowCopy.en.deepWaitHint);
  expect(start.disabled).toBe(true);
  state.phase = "deep_ready";
  state.sysdiagnose = "generating";
  await screen.findByText(flowCopy.en.deepReadyHint);
  await waitFor(() => expect(start.disabled).toBe(false));
  fireEvent.click(network);
  fireEvent.click(start);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("begin_copy", {
      captureNetwork: true,
    }),
  );
});
it("unticking the deep check before Start keeps the phone paired", async () => {
  const state = iphoneSession({ trusted: true });
  const { start, deep } = await readyIphone();
  fireEvent.click(deep);
  state.phase = "deep_wait";
  await screen.findByText(flowCopy.en.deepWaitHint);
  fireEvent.click(deep);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("prepare_deep_check", {
      enabled: false,
    }),
  );
  await waitFor(() => expect(start.disabled).toBe(false));
  expect(native).not.toHaveBeenCalledWith("cancel_scan");
  expect(state.starts).toBe(1);
});
it("a refused Trust goes back to the search and says to plug the cable in again", async () => {
  const state = iphoneSession();
  await search();
  await screen.findByText(flowCopy.en.deepTrustHint);
  state.phase = "failed";
  state.error = "device_trust_denied";
  expect((await screen.findByRole("alert")).textContent).toBe(
    a.deviceTrustDenied,
  );
  await waitFor(() => expect(native).toHaveBeenCalledWith("finish_scan"));
  expect(screen.getByText(flowCopy.en.chkRetry)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Find my phone" })).toBeTruthy();
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

it("requires explicit network opt-in and asks for an encrypted backup's password", async () => {
  const state = iphoneSession({ trusted: true });
  state.afterStart = { phase: "failed", error: "backup_password_required" };
  const { start, network } = await readyIphone();
  expect(network.checked).toBe(false);
  fireEvent.click(network);
  await waitFor(() => expect(start.disabled).toBe(false));
  fireEvent.click(start);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("begin_copy", {
      captureNetwork: true,
    }),
  );
  const password = await screen.findByLabelText(a.backupPassword, {
    exact: false,
  });
  const again = screen.getByRole("button", {
    name: "Start scan",
  }) as HTMLButtonElement;
  expect(again.disabled).toBe(true);
  fireEvent.change(password, { target: { value: "synthetic-password" } });
  expect(again.disabled).toBe(false);
  fireEvent.click(again);
  await waitFor(() =>
    expect(native).toHaveBeenCalledWith("start_scan", {
      request: expect.objectContaining({
        device: "ios",
        usbId: "iphone-fixture",
        pcapConsent: true,
        backupPassword: "synthetic-password",
      }),
    }),
  );
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
  });
  expect(screen.queryByText("adb_server_failed")).toBeNull();
});

it("explains a refused consent without displaying arbitrary native errors", async () => {
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
  await screen.findByText(/Tick the box to confirm the phone is yours/);
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
    clearToasts();
    const state = iphoneSession({ trusted: true });
    state.afterStart = { phase: "failed", error };
    const { start } = await readyIphone();
    // The ready screen prepares the person for the passcode.
    expect(screen.getByText(flowCopy.en.readyIos)).toBeTruthy();
    await waitFor(() => expect(start.disabled).toBe(false));
    fireEvent.click(start);
    expect((await screen.findByRole("alert")).textContent).toBe(message);
    // The phone stays chosen: "Try again" pairs it again at once.
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(state.starts).toBe(2));
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
    const state = iphoneSession({ trusted: true });
    state.afterStart = { phase: "failed", error: "acquisition_failed" };
    state.diagnostic = diagnostic;
    const { start } = await readyIphone();
    await waitFor(() => expect(start.disabled).toBe(false));
    fireEvent.click(start);
    expect((await screen.findByRole("alert")).textContent).toBe(a.failCopy);
    await waitFor(() =>
      expect(document.querySelector(".diagnostic-code code")?.textContent).toBe(
        shown,
      ),
    );
    expect(document.body.textContent).not.toContain("secret");
    cleanup();
  }
});
it("keeps the ready step to the options: no USB speed note, no second consent", async () => {
  for (const usbSpeed of [480_000_000, 5_000_000_000, undefined]) {
    iphoneSession({ trusted: true, device: { usbSpeed } });
    await readyIphone();
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
