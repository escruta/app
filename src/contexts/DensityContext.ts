import { createContext } from "react";

export enum DensityOptions {
  Compact = "Compact",
  Comfortable = "Comfortable",
  Spacious = "Spacious",
}

interface DensityContextType {
  density: DensityOptions;
  setDensity: (density: DensityOptions) => void;
  DensityOptions: typeof DensityOptions;
}

export const DensityContext = createContext<DensityContextType | undefined>(undefined);
