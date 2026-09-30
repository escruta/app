/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_ESCRUTA_CORE_URL: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

declare interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  windowControls?: {
    setOverlayColors: (backgroundColor: string, symbolColor: string) => void;
  };
  shortcuts?: {
    onCloseTabRequest: (callback: () => void) => () => void;
  };
}

declare interface Window {
  electronAPI?: ElectronAPI;
}
