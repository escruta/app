import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function resolveIconPath(): string | undefined {
  if (process.platform === "darwin") {
    return undefined;
  }

  const iconFile = process.platform === "win32" ? "AppIcon.ico" : "AppIcon.png";

  if (app.isPackaged) {
    return path.join(process.resourcesPath, iconFile);
  }

  return path.join(app.getAppPath(), "src", "assets", iconFile);
}

function windowFromEvent(event: { sender: Electron.WebContents }): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

function registerWindowControls() {
  ipcMain.on("window:set-overlay-colors", (event, { color, symbolColor }) => {
    windowFromEvent(event)?.setTitleBarOverlay({ color, symbolColor });
  });
}

function createWindow() {
  const isMac = process.platform === "darwin";

  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: "Escruta",
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    titleBarOverlay: isMac
      ? false
      : {
          color: "#ffffff",
          symbolColor: "#1a1a1a",
          height: 48,
        },
    icon: resolveIconPath(),
    backgroundColor: "#0A0A0A",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/main_window/index.html"));
  }
}

app.whenReady().then(() => {
  registerWindowControls();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
