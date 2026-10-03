import { createContext } from "react";

interface SettingsContextType {
  openSettings: () => void;
  closeSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
