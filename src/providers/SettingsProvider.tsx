import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { SettingsContext } from "@/contexts";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const openSettings = useCallback(() => navigate("/settings"), [navigate]);
  const closeSettings = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        openSettings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSettings]);

  const value = useMemo(() => ({ openSettings, closeSettings }), [openSettings, closeSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
