import { expect, it } from "vitest";
import { desktopOs } from "./native-shell";

it("recognises the system from each platform's webview", () => {
  expect(
    desktopOs(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    ),
  ).toBe("macos");
  expect(
    desktopOs(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/142.0",
    ),
  ).toBe("windows");
  expect(
    desktopOs("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15"),
  ).toBe("linux");
});
