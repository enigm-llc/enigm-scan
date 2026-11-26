import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ComputerIcon } from "./Brand";

export type OsFile = { filename: string; platform: string; arch: string };

export const osLabel = (f: OsFile) =>
  `${f.platform} · ${
    f.platform === "macOS"
      ? f.arch === "arm64"
        ? "Apple Silicon"
        : "Intel"
      : f.arch
  }`;

/**
 * The computer chooser, drawn like the footer menus (as in Enigm Command):
 * a quiet trigger, a raised list below it, the current choice ticked.
 */
export function OsMenu({
  files,
  value,
  label,
  onChange,
}: {
  files: OsFile[];
  value: string;
  label: string;
  onChange: (filename: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = files.find((f) => f.filename === value);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    root.current
      ?.querySelector<HTMLElement>(
        '[role="menuitemradio"][aria-checked="true"], [role="menuitemradio"]',
      )
      ?.focus();
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div
      className="os-menu appearance-control"
      ref={root}
      onKeyDown={(e) => {
        if (!open) {
          if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
          }
          return;
        }
        if (e.key === "Escape" || e.key === "Tab") {
          if (e.key === "Escape") e.preventDefault();
          close();
        }
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          const items = Array.from(
            root.current?.querySelectorAll<HTMLButtonElement>(
              '[role="menuitemradio"]',
            ) ?? [],
          );
          const i = items.indexOf(document.activeElement as HTMLButtonElement);
          items[
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? items.length - 1
                : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                  items.length
          ]?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="os-trigger"
        aria-label={current ? `${label}: ${osLabel(current)}` : label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {current && <ComputerIcon platform={current.platform} size={16} />}
        <span>{current ? osLabel(current) : label}</span>
        <ChevronDown
          size={16}
          className={open ? "chevron-open" : ""}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="appearance-options" role="menu" aria-label={label}>
          {files.map((f) => (
            <button
              key={f.filename}
              role="menuitemradio"
              aria-checked={f.filename === value}
              onClick={() => {
                onChange(f.filename);
                close();
              }}
            >
              <ComputerIcon platform={f.platform} size={16} />
              {osLabel(f)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
