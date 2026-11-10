import { isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { isMacPlatform } from "@/lib/shortcuts";

export const isDesktop = isTauri();
export const isMacDesktop = isDesktop && isMacPlatform();
export const isLinuxDesktop =
  isDesktop &&
  typeof navigator !== "undefined" &&
  (/Linux/i.test(navigator.platform) || /Linux/i.test(navigator.userAgent));

function onDesktopEvent(event: string, callback: () => void): () => void {
  if (!isDesktop) return () => {};

  let unlisten: (() => void) | undefined;
  let disposed = false;

  void listen(event, () => callback())
    .then((removeListener) => {
      if (disposed) {
        removeListener();
      } else {
        unlisten = removeListener;
      }
    })
    .catch(() => {});

  return () => {
    disposed = true;
    unlisten?.();
  };
}

export function onCloseTabRequest(callback: () => void): () => void {
  return onDesktopEvent("close-tab", callback);
}

export function onPreviousTabRequest(callback: () => void): () => void {
  return onDesktopEvent("previous-tab", callback);
}
