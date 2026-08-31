import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  windowControls: {
    setOverlayColors: (color: string, symbolColor: string) =>
      ipcRenderer.send("window:set-overlay-colors", { color, symbolColor }),
  },
  auth: {
    startDeviceLogin: (mode: "signin" | "signup") =>
      ipcRenderer.invoke("auth:start-device-login", mode),
  },
});
