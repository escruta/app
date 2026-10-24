import { useDensity } from "@/hooks";
import { Dropdown } from "@/components/ui";
import { SettingsGroup } from "../shared/SettingsSection";

export function DensitySettings() {
  const { density, setDensity, DensityOptions: densityValues } = useDensity();

  return (
    <SettingsGroup
      title="Density"
      description="Adjust the spacing of lists, cards, and controls across the application."
    >
      <Dropdown<(typeof densityValues)[keyof typeof densityValues]>
        options={Object.values(densityValues)}
        selectedOption={density}
        onSelect={(option) => setDensity(option)}
        className="w-full max-w-xs"
      />
    </SettingsGroup>
  );
}
