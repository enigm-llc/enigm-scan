import { ArrowDown, ArrowRight, FileArchive } from "lucide-react";
import { BrandSymbol, ComputerIcon, DeviceIcon } from "./Brand";

export type LaptopScreen = "download" | "downloaded";

/**
 * A laptop for getting Enigm Scan: an arrow settling into a tray (no
 * invented progress), then the downloaded file opening as the app.
 * Decorative; the state is in text.
 */
export function LaptopStage({
  screen,
  platform,
}: {
  screen: LaptopScreen;
  platform?: string;
}) {
  const os =
    platform === "Windows" ? "windows" : platform === "Linux" ? "linux" : "mac";
  return (
    <div
      className={`constellation phone-stage laptop-stage is-${screen} os-${os}`}
      aria-hidden="true"
    >
      <div className="laptop">
        <div className="laptop-lid">
          <span className="laptop-camera" />
          <div className="laptop-screen">
            {os === "mac" && (
              <div className="laptop-bar mac">
                <span className="lights">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            {os === "linux" && (
              <div className="laptop-bar linux">
                <span className="activities" />
                <span className="clock" />
                <span className="tray">
                  <i />
                  <i />
                </span>
              </div>
            )}
            {os === "windows" && (
              <div className="laptop-taskbar">
                <span className="start">
                  <DeviceIcon device="windows" size={12} />
                </span>
                <i />
                <i />
                <i />
              </div>
            )}
            {screen === "downloaded" ? (
              <div className="laptop-open">
                <span className="laptop-file">
                  <FileArchive size={28} strokeWidth={1.5} />
                  <small>
                    {os === "windows" ? ".zip" : os === "linux" ? ".AppImage" : ".dmg"}
                  </small>
                </span>
                <span className="laptop-step">
                  <ArrowRight size={18} strokeWidth={2} />
                </span>
                <span className="laptop-app opening">
                  <BrandSymbol />
                </span>
              </div>
            ) : (
              <div className="laptop-get">
                <span className="laptop-app">
                  <BrandSymbol />
                </span>
                <b>Enigm Scan</b>
                <span className="laptop-arrow">
                  <ArrowDown size={20} strokeWidth={2} />
                </span>
                {platform && os !== "windows" && (
                  <span className="laptop-platform">
                    <ComputerIcon platform={platform} size={14} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="laptop-base" />
      </div>
    </div>
  );
}
