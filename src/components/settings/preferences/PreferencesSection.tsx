import { SettingsDivider, SettingsSection } from "../shared/SettingsSection";
import { AccessibilitySettings } from "./AccessibilitySection";
import { DensitySettings } from "./DensitySection";
import { DisplaySettings } from "./DisplaySection";
import { ThemeSettings } from "./ThemeSection";
import { WorkspaceSettings } from "./WorkspaceSection";

export function PreferencesSection() {
  return (
    <SettingsSection
      title="Preferences"
      description="Customize how Escruta looks and organizes your content across the application."
      className="gap-6"
    >
      <ThemeSettings />
      <SettingsDivider />
      <DisplaySettings />
      <SettingsDivider />
      <DensitySettings />
      <SettingsDivider />
      <WorkspaceSettings />
      <SettingsDivider />
      <AccessibilitySettings />
    </SettingsSection>
  );
}
