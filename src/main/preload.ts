import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  windowControls: {
    setOverlayColors: (color: string, symbolColor: string) =>
      ipcRenderer.send("window:set-overlay-colors", { color, symbolColor }),
  },
  shortcuts: {
    onCloseTabRequest: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on("shortcut:close-tab", listener);
      return () => ipcRenderer.removeListener("shortcut:close-tab", listener);
    },
  },
});
