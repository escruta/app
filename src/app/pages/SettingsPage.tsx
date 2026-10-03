import { TopBar } from "@/components";
import { SettingsContent } from "@/components/settings";

export default function SettingsPage() {
  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>Settings - Escruta</title>
      <TopBar title="Settings" />

      <div className="relative flex-1 overflow-hidden">
        <SettingsContent />
      </div>
    </div>
  );
}
