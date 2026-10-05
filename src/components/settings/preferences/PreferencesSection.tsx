import { useTheme } from "@/hooks";
import { Divider, Dropdown } from "@/components/ui";
import { SettingsGroup, SettingsSection } from "../shared/SettingsSection";
import { DisplaySettings } from "./DisplaySection";
import { SortSettings } from "./SortSection";

export function PreferencesSection() {
  const { themePreference, setTheme, ThemeOptions } = useTheme();

  return (
    <SettingsSection
      title="Preferences"
      description="Customize how Escruta looks and organizes your content across the application."
    >
      <SettingsGroup title="Theme">
        <Dropdown<(typeof ThemeOptions)[keyof typeof ThemeOptions]>
          options={Object.values(ThemeOptions)}
          selectedOption={themePreference}
          onSelect={(option) =>
            setTheme(option as (typeof ThemeOptions)[keyof typeof ThemeOptions])
          }
          className="w-full max-w-xs"
        />
      </SettingsGroup>
      <Divider />
      <DisplaySettings />
      <Divider />
      <SortSettings />
    </SettingsSection>
  );
}
