import { useRef } from "react";
import { DitherHalftoneBackground, TopBar } from "@/components";
import { SettingsContent } from "@/components/settings";

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>Settings - Escruta</title>
      <TopBar title="Settings" />

      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <DitherHalftoneBackground
          variant="settings"
          interactionTargetRef={containerRef}
          className="hidden lg:block"
        />
        <SettingsContent />
      </div>
    </div>
  );
}
