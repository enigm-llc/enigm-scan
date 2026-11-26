import { expect, it } from "vitest";
import { deviceErrorCode, diagnosticCode } from "./device-errors";
it("never exposes arbitrary paths or subprocess output", () => {
  expect(
    deviceErrorCode(new Error("/Users/private/backup: secret output")),
  ).toBe("device_detection_failed");
  expect(deviceErrorCode("consent_required")).toBe("consent_required");
  expect(deviceErrorCode(new TypeError("Failed to fetch"))).toBe(
    "device_detection_failed",
  );
});
it("shows scan diagnostics only as fixed codes or exception class names", () => {
  expect(diagnosticCode("exc:RuntimeError>OSError")).toBe(
    "exc:RuntimeError>OSError",
  );
  expect(diagnosticCode("engine_cpu_limit")).toBe("engine_cpu_limit");
  for (const unsafe of [
    "exc:OSError: [Errno 28] /private/var/secret",
    "exc:A>B>C>D>E",
    "Device of Someone",
    "/Users/someone/backup",
    "",
    null,
    42,
  ])
    expect(diagnosticCode(unsafe)).toBeNull();
});
