import { useEffect, useMemo, useState } from "react";
import { getCurrentWindow, type Window as TauriWindow } from "@tauri-apps/api/window";
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from "@/components/icons";
import { isDesktop, isLinuxDesktop, isMacDesktop } from "@/lib/desktop";
import { cn } from "@/lib/utils";

type ResizeDirection =
  | "East"
  | "North"
  | "NorthEast"
  | "NorthWest"
  | "South"
  | "SouthEast"
  | "SouthWest"
  | "West";

const WINDOW_BUTTON_CLASS =
  "grid h-14 w-12 shrink-0 place-items-center text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800";

const RESIZE_HANDLES = [
  { direction: "North", className: "top-0 right-1 left-1 h-1 cursor-n-resize" },
  { direction: "South", className: "right-1 bottom-0 left-1 h-1 cursor-s-resize" },
  { direction: "West", className: "top-1 bottom-1 left-0 w-1 cursor-w-resize" },
  { direction: "East", className: "top-1 right-0 bottom-1 w-1 cursor-e-resize" },
  { direction: "NorthWest", className: "top-0 left-0 size-2 cursor-nw-resize" },
  { direction: "NorthEast", className: "top-0 right-0 size-2 cursor-ne-resize" },
  { direction: "SouthWest", className: "bottom-0 left-0 size-2 cursor-sw-resize" },
  { direction: "SouthEast", className: "right-0 bottom-0 size-2 cursor-se-resize" },
] as const satisfies readonly { direction: ResizeDirection; className: string }[];

function useMaximizedState(appWindow: TauriWindow) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let disposed = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let unlisten: (() => void) | undefined;

    const sync = () => {
      void appWindow
        .isMaximized()
        .then((maximized) => {
          if (!disposed) setIsMaximized(maximized);
        })
        .catch(() => {});
    };

    const scheduleSync = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(sync, 100);
    };

    sync();

    void appWindow
      .onResized(scheduleSync)
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
      if (timeout) clearTimeout(timeout);
      unlisten?.();
    };
  }, [appWindow]);

  return isMaximized;
}

function ResizeHandles({ appWindow }: { appWindow: TauriWindow }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-999">
      {RESIZE_HANDLES.map(({ direction, className }) => (
        <div
          key={direction}
          role="presentation"
          className={cn("pointer-events-auto absolute", className)}
          onMouseDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            void appWindow.startResizeDragging(direction).catch(() => {});
          }}
        />
      ))}
    </div>
  );
}

function WindowButtons({
  appWindow,
  isMaximized,
}: {
  appWindow: TauriWindow;
  isMaximized: boolean;
}) {
  return (
    <div className="app-region-no-drag flex h-14 items-stretch border-b border-gray-200 bg-white select-none dark:border-gray-800 dark:bg-gray-950">
      <button
        type="button"
        className={WINDOW_BUTTON_CLASS}
        aria-label="Minimize"
        title="Minimize"
        onClick={() => void appWindow.minimize().catch(() => {})}
      >
        <MinimizeIcon className="size-4" />
      </button>
      <button
        type="button"
        className={WINDOW_BUTTON_CLASS}
        aria-label={isMaximized ? "Restore" : "Maximize"}
        title={isMaximized ? "Restore" : "Maximize"}
        onClick={() => void appWindow.toggleMaximize().catch(() => {})}
      >
        {isMaximized ? <RestoreIcon className="size-4" /> : <MaximizeIcon className="size-4" />}
      </button>
      <button
        type="button"
        className={cn(
          WINDOW_BUTTON_CLASS,
          "hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white",
        )}
        aria-label="Close"
        title="Close"
        onClick={() => void appWindow.close().catch(() => {})}
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}

function DesktopWindowChrome() {
  const appWindow = useMemo(() => getCurrentWindow(), []);
  const isMaximized = useMaximizedState(appWindow);

  return (
    <>
      {isLinuxDesktop && !isMaximized && <ResizeHandles appWindow={appWindow} />}
      <div className="fixed top-0 right-0 z-1000">
        <WindowButtons appWindow={appWindow} isMaximized={isMaximized} />
      </div>
    </>
  );
}

export function WindowChrome() {
  if (!isDesktop || isMacDesktop) return null;
  return <DesktopWindowChrome />;
}
