import { useEffect, type ReactNode } from "react";
import { toast } from "../desktop/toast";

/**
 * A message for the person: shown at the top of the window and gone after a
 * few seconds (see Toaster). Actions that go with it, such as "Try again",
 * stay on the screen where they belong.
 */
export function Notice({
  message,
  tone = "error",
  children,
}: {
  message: string;
  tone?: "error" | "info" | "success";
  children?: ReactNode;
}) {
  useEffect(() => {
    toast[tone](message);
  }, [message, tone]);
  return children ? <div className="notice-actions">{children}</div> : null;
}
