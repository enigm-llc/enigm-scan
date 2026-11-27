import type { ScanReport } from "./report";
export type Capabilities = {
  rules: number;
  ruleVersion: number;
  iosUsb: boolean;
  androidUsb: boolean;
  mvtIos: boolean;
  mvtAndroid: boolean;
};
/** Real acquisition progress: percentage reported by the phone and counters. */
export type AcquisitionProgress = {
  phase: string;
  percent?: number;
  kept: number;
  discarded: number;
  receivedBytes: number;
  storedBytes: number;
  /** The phone's network is being observed alongside the copy. */
  capturing?: boolean;
  /** A sysdiagnose the owner started during the copy (iPhone). */
  sysdiagnose?: "generating" | "ready";
  /** What the copy does once the data is out of the phone. */
  step?: "extracted" | "diagnostics" | "apps" | "connections";
  /** Android: installed apps whose permissions and access were read. */
  apps?: number;
  /** Android: open connections read from the phone. */
  connections?: number;
};
export type AgentStatus = {
  phase: string;
  artifacts: number;
  /** Checks the analysis has completed so far. */
  checks?: number;
  /** Network connections analysed. */
  connections?: number;
  error: string | null;
  report: ScanReport | null;
  acquisition?: AcquisitionProgress | null;
  /** Allowlisted diagnostic for an unexplained failure. */
  diagnostic?: string | null;
};
export type Device = {
  id: string;
  platform: string;
  authorized: boolean;
  needsTrust?: boolean;
  name?: string;
  /** USB link speed in bit/s, when the phone reports it. */
  usbSpeed?: number;
  /** Why the computer cannot open it (for example "usb_permission"). */
  issue?: string | null;
};
export const isDesktop = () => "__TAURI_INTERNALS__" in window;
export async function native<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!isDesktop()) throw new Error("app_only");
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}
