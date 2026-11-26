import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { dismissToast, subscribeToasts, type Toast } from "./toast";

const ICONS = { error: CircleAlert, info: Info, success: CircleCheck };

/**
 * Messages at the top of the window, as in Enigm Command: a rounded pill,
 * red for errors, green for success, neutral otherwise. Each leaves on its
 * own after a few seconds, or when clicked.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);
  return (
    <div className="toaster" aria-live="polite">
      {toasts.map(({ id, tone, message }) => {
        const Icon = ICONS[tone];
        return (
          <button
            key={id}
            className={`toast is-${tone}`}
            role={tone === "error" ? "alert" : "status"}
            onClick={() => dismissToast(id)}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{message}</span>
          </button>
        );
      })}
    </div>
  );
}
