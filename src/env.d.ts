/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_ESCRUTA_CORE_URL: string;
  readonly VITE_ESCRUTA_AUTH_URL?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Magic constants injected by @electron-forge/plugin-vite into the main process.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

declare interface AuthElectronAPI {
  startDeviceLogin: (
    mode: "signin" | "signup",
  ) => Promise<{ token: string; expiresIn?: number } | null>;
}

declare interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  windowControls?: {
    setOverlayColors: (backgroundColor: string, symbolColor: string) => void;
  };
  auth?: AuthElectronAPI;
}

declare interface Window {
  electronAPI?: ElectronAPI;
}
