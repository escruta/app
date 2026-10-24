import { useContext } from "react";
import { DensityContext } from "@/contexts";

export function useDensity() {
  const context = useContext(DensityContext);
  if (context === undefined) {
    throw new Error("useDensity must be used within a DensityProvider");
  }
  return context;
}
