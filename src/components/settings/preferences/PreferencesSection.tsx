import { Divider } from "@/components/ui";
import { SettingsSection } from "../shared/SettingsSection";
import { DensitySettings } from "./DensitySection";
import { DisplaySettings } from "./DisplaySection";
import { SortSettings } from "./SortSection";
import { ThemeSettings } from "./ThemeSection";

export function PreferencesSection() {
  return (
    <SettingsSection
      title="Preferences"
      description="Customize how Escruta looks and organizes your content across the application."
      className="gap-6"
    >
      <ThemeSettings />
      <Divider className="my-0" />
      <DisplaySettings />
      <Divider className="my-0" />
      <DensitySettings />
      <Divider className="my-0" />
      <SortSettings />
    </SettingsSection>
  );
}
