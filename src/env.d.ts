/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_ESCRUTA_CORE_URL: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Magic constants injected by @electron-forge/plugin-vite into the main process.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

declare interface ElectronAPI {
  isElectron: boolean;
  platform: string;
}

declare interface Window {
  electronAPI?: ElectronAPI;
}

declare interface ElectronAPI {
  isElectron: boolean;
  platform: string;
}

declare interface Window {
  electronAPI?: ElectronAPI;
}
