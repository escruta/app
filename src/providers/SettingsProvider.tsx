import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { SettingsContext } from "@/contexts";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const openSettings = useCallback(() => navigate("/settings"), [navigate]);
  const closeSettings = useCallback(() => navigate(-1), [navigate]);

  const value = useMemo(() => ({ openSettings, closeSettings }), [openSettings, closeSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
