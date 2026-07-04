import {
  AccountSection,
  AppearanceSection,
  SortSection,
  ViewModeSection,
} from "@/components/settings";
import { TopBar } from "@/components";

export default function SettingsPage() {
  return (
    <div className="flex h-screen max-h-full w-full flex-col">
      <title>Settings - Escruta</title>
      <TopBar title="Settings" />

      <div className="flex-1 overflow-auto bg-gray-50 p-3 md:p-4 dark:bg-gray-950">
        <div className="mx-auto max-w-5xl">
          <AppearanceSection />
          <ViewModeSection />
          <SortSection />
          <AccountSection />
        </div>
      </div>
    </div>
  );
}
