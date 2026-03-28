import { useTheme } from "@/hooks";
import { CommonBar } from "@/components";
import { Dropdown } from "@/components/ui";

export function AppearanceSection() {
  const { themePreference, setTheme, ThemeOptions } = useTheme();

  return (
    <CommonBar className="z-10 flex-col items-start justify-center">
      <h2 className="mb-4 text-xl font-medium">Appearance</h2>
      <div className="flex items-center gap-4">
        <Dropdown<(typeof ThemeOptions)[keyof typeof ThemeOptions]>
          options={Object.values(ThemeOptions)}
          selectedOption={themePreference}
          onSelect={(option) =>
            setTheme(option as (typeof ThemeOptions)[keyof typeof ThemeOptions])
          }
          label="Theme: "
        />
      </div>
    </CommonBar>
  );
}
