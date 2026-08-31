import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;
const AUTH_URL =
  process.env.ESCRUTA_AUTH_URL || (isDev ? "http://localhost:3000" : "https://account.escruta.com");
const BACKEND_URL =
  process.env.ESCRUTA_CORE_URL || (isDev ? "http://localhost:8080" : "https://api.escruta.com");

const DEVICE_LOGIN_TIMEOUT_MS = 10 * 60 * 1000;

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

function registerAuthIpc() {
  ipcMain.handle("auth:start-device-login", async (_event, mode: "signin" | "signup") => {
    const deviceCode = randomUUID();
    const url = `${AUTH_URL}/${mode}?device_code=${encodeURIComponent(deviceCode)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEVICE_LOGIN_TIMEOUT_MS);

    console.log(`[device-login] AUTH_URL=${AUTH_URL} BACKEND_URL=${BACKEND_URL}`);
    console.log(`[device-login] opening browser: ${url}`);

    try {
      await fetch(`${BACKEND_URL}/device/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode }),
      });

      shell.openExternal(url);

      const deadline = Date.now() + DEVICE_LOGIN_TIMEOUT_MS;
      while (Date.now() < deadline) {
        let res: Response;
        try {
          res = await fetch(
            `${BACKEND_URL}/device/token?device_code=${encodeURIComponent(deviceCode)}`,
            {
              signal: controller.signal,
            },
          );
        } catch (err) {
          console.error("[device-login] poll request failed", err);
          return null;
        }

        if (res.ok) {
          const data = (await res.json()) as { token: string; expiresIn?: number };
          console.log("[device-login] succeeded");
          return { token: data.token, expiresIn: data.expiresIn };
        }

        if (res.status === 400) {
          const error = (await res.json().catch(() => ({}))) as { error?: string };
          if (error.error === "expired_token") return null;
          // otherwise: still pending, keep polling
        } else {
          console.error(`[device-login] unexpected status ${res.status} from /device/token`);
          return null;
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      return null;
    } catch (err) {
      console.error("[device-login] error", err);
      return null;
    } finally {
      clearTimeout(timeout);
    }
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

  mainWindow.once("ready-to-show", () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });
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
  registerAuthIpc();
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
