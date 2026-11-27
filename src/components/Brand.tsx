import { Monitor } from "lucide-react";
/** Official Enigm artwork, used unmodified. */
export function BrandLogo() {
  return (
    <span className="brand-logo" aria-hidden="true">
      <img
        className="brand-light"
        src="/brand/enigm-logo-black.svg"
        alt=""
        width="160"
        height="48"
      />
      <img
        className="brand-dark"
        src="/brand/enigm-logo-white.svg"
        alt=""
        width="160"
        height="48"
      />
    </span>
  );
}
export function BrandSymbol() {
  return (
    <span className="brand-symbol" aria-hidden="true">
      <img
        className="brand-light"
        src="/brand/enigm-symbol-black.svg"
        alt=""
        width="32"
        height="36"
      />
      <img
        className="brand-dark"
        src="/brand/enigm-symbol-white.svg"
        alt=""
        width="32"
        height="36"
      />
    </span>
  );
}
export function DeviceIcon({
  device,
  size = 28,
  tint = false,
  tight = false,
}: Readonly<{
  device: "ios" | "android" | "linux" | "windows";
  size?: number;
  /** Paint the logo in the surrounding text colour. */
  tint?: boolean;
  /** Use the logo cropped to its own shape, so it centres in a badge. */
  tight?: boolean;
}>) {
  const name = device === "ios" ? "apple" : device;
  const src = `/platforms/${name}${tight && (device === "ios" || device === "android") ? "-tight" : ""}.svg`;
  if (tint)
    return (
      <span
        className="platform-icon tinted"
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
        }}
      />
    );
  return (
    <img
      className="platform-icon"
      src={`/platforms/${device === "ios" ? "apple" : device}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  );
}

export function ComputerIcon({
  platform,
  size = 18,
}: Readonly<{
  platform: string;
  size?: number;
}>) {
  if (platform === "macOS") return <DeviceIcon device="ios" size={size} />;
  if (platform === "Windows")
    return <DeviceIcon device="windows" size={size} />;
  if (platform === "Linux") return <DeviceIcon device="linux" size={size} />;
  return <Monitor size={size} strokeWidth={1.5} aria-hidden="true" />;
}
