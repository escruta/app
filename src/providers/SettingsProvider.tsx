import { useCallback, useEffect, useMemo, useState } from "react";
import { SettingsContext } from "@/contexts";
import { SettingsModal } from "@/components/settings";
import { useAuth } from "@/hooks";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { currentUser } = useAuth();

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  useEffect(() => {
    if (!currentUser) {
      closeSettings();
    }
  }, [currentUser, closeSettings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        if (currentUser) {
          setIsSettingsOpen((open) => !open);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentUser]);

  const value = useMemo(
    () => ({ isSettingsOpen, openSettings, closeSettings }),
    [isSettingsOpen, openSettings, closeSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </SettingsContext.Provider>
  );
}
