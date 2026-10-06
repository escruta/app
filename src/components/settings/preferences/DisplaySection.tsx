import { useCookie } from "@/hooks";
import { Dropdown } from "@/components/ui";
import { SettingsGroup } from "../shared/SettingsSection";
import {
  VIEW_MODE_COOKIE_KEY,
  VIEW_MODE_LABELS,
  VIEW_MODES,
  type ViewMode,
} from "../lib/view-mode";

export function DisplaySettings() {
  const [viewMode, setViewMode] = useCookie<ViewMode>(VIEW_MODE_COOKIE_KEY, "grid");

  return (
    <SettingsGroup
      title="Display"
      description="Choose how notebooks are displayed across the application."
    >
      <Dropdown<ViewMode>
        options={VIEW_MODES}
        selectedOption={viewMode}
        onSelect={(option) => setViewMode(option)}
        className="w-full max-w-xs"
        renderOption={(option) => VIEW_MODE_LABELS[option]}
      />
    </SettingsGroup>
  );
}
