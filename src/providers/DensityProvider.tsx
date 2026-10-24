import { type ReactNode, useEffect } from "react";
import { DensityContext, DensityOptions } from "@/contexts";
import { useCookie } from "@/hooks";

const DENSITY_COOKIE_KEY = "uiDensity";

export function DensityProvider({ children }: { children: ReactNode }) {
  const { value, setValue } = useCookie<DensityOptions>(
    DENSITY_COOKIE_KEY,
    DensityOptions.Comfortable,
  );

  const density = value ?? DensityOptions.Comfortable;

  useEffect(() => {
    document.documentElement.dataset.density = density.toLowerCase();
  }, [density]);

  const contextValue = {
    density,
    setDensity: setValue,
    DensityOptions,
  };

  return <DensityContext.Provider value={contextValue}>{children}</DensityContext.Provider>;
}
