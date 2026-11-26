import type { ReactNode } from "react";
import { CircleAlert, Info } from "lucide-react";

/**
 * A calm message: an icon, the words, and any action under them. Errors
 * get the red icon only; the text stays in the page's own colours.
 */
export function Notice({
  tone = "error",
  children,
  live = true,
}: {
  tone?: "error" | "info";
  children: ReactNode;
  live?: boolean;
}) {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    <div
      className={`notice is-${tone}`}
      role={live ? (tone === "error" ? "alert" : "status") : undefined}
    >
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
      <div className="notice-body">{children}</div>
    </div>
  );
}
