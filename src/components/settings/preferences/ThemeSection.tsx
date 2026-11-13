import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";
import { SettingsGroup } from "../shared/SettingsSection";
import { PreferenceOptionButton, SelectionIndicator } from "./PreferenceCard";

function LightThemePreview() {
  return (
    <div className="flex h-full w-full flex-col bg-gray-50">
      <div className="flex h-4 items-center gap-1.5 border-b border-gray-200 bg-white px-2">
        <span className="size-1.5 rounded-xs bg-blue-500" />
        <span className="h-1 w-8 rounded-xs bg-gray-300" />
      </div>
      <div className="grid flex-1 grid-cols-2 gap-1.5 p-2">
        <div className="flex flex-col justify-between rounded-xs border border-gray-200 bg-white p-1.5">
          <span className="size-2 rounded-xs bg-blue-500" />
          <div className="flex flex-col gap-1">
            <span className="h-1 w-full rounded-xs bg-gray-700/70" />
            <span className="h-1 w-2/3 rounded-xs bg-gray-300" />
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xs border border-gray-200 bg-white p-1.5">
          <span className="size-2 rounded-xs bg-blue-100" />
          <div className="flex flex-col gap-1">
            <span className="h-1 w-4/5 rounded-xs bg-gray-300" />
            <span className="h-1 w-1/2 rounded-xs bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DarkThemePreview() {
  return (
    <div className="flex h-full w-full flex-col bg-gray-950">
      <div className="flex h-4 items-center gap-1.5 border-b border-gray-800 bg-gray-900 px-2">
        <span className="size-1.5 rounded-xs bg-blue-400" />
        <span className="h-1 w-8 rounded-xs bg-gray-600" />
      </div>
      <div className="grid flex-1 grid-cols-2 gap-1.5 p-2">
        <div className="flex flex-col justify-between rounded-xs border border-gray-800 bg-gray-900 p-1.5">
          <span className="size-2 rounded-xs bg-blue-400" />
          <div className="flex flex-col gap-1">
            <span className="h-1 w-full rounded-xs bg-gray-300/80" />
            <span className="h-1 w-2/3 rounded-xs bg-gray-700" />
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xs border border-gray-800 bg-gray-900 p-1.5">
          <span className="size-2 rounded-xs bg-blue-900/70" />
          <div className="flex flex-col gap-1">
            <span className="h-1 w-4/5 rounded-xs bg-gray-700" />
            <span className="h-1 w-1/2 rounded-xs bg-gray-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemThemePreview() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="grid h-full w-full grid-cols-2">
        <div className="flex flex-col border-r border-gray-300/60 bg-gray-50">
          <div className="flex h-4 items-center gap-1 border-b border-gray-200 bg-white px-1.5">
            <span className="size-1.5 rounded-xs bg-blue-500" />
            <span className="h-1 w-5 rounded-xs bg-gray-300" />
          </div>
          <div className="flex flex-1 flex-col justify-between p-1.5">
            <div className="flex h-full flex-col justify-between rounded-xs border border-gray-200 bg-white p-1.5">
              <span className="size-2 rounded-xs bg-blue-500" />
              <div className="flex flex-col gap-1">
                <span className="h-1 w-full rounded-xs bg-gray-700/70" />
                <span className="h-1 w-2/3 rounded-xs bg-gray-300" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col bg-gray-950">
          <div className="flex h-4 items-center justify-end gap-1 border-b border-gray-800 bg-gray-900 px-1.5">
            <span className="h-1 w-5 rounded-xs bg-gray-700" />
          </div>
          <div className="flex flex-1 flex-col justify-between p-1.5">
            <div className="flex h-full flex-col justify-between rounded-xs border border-gray-800 bg-gray-900 p-1.5">
              <span className="size-2 rounded-xs bg-blue-400" />
              <div className="flex flex-col gap-1">
                <span className="h-1 w-full rounded-xs bg-gray-300/80" />
                <span className="h-1 w-2/3 rounded-xs bg-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeSettings() {
  const { themePreference, effectiveTheme, setTheme, ThemeOptions } = useTheme();

  const options = [
    {
      value: ThemeOptions.System,
      label: "System",
      description: `Matches device (${effectiveTheme === "dark" ? "dark" : "light"})`,
      preview: <SystemThemePreview />,
    },
    {
      value: ThemeOptions.Light,
      label: "Light",
      description: "Bright, crisp surface",
      preview: <LightThemePreview />,
    },
    {
      value: ThemeOptions.Dark,
      label: "Dark",
      description: "Low-light comfort",
      preview: <DarkThemePreview />,
    },
  ];

  return (
    <SettingsGroup title="Theme" description="Choose how Escruta looks on this device.">
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = themePreference === option.value;
          return (
            <PreferenceOptionButton
              key={option.value}
              selected={isSelected}
              onSelect={() => setTheme(option.value)}
              className="gap-3"
            >
              <div
                className={cn(
                  "h-20 w-full overflow-hidden rounded-xs border transition-colors duration-200",
                  isSelected
                    ? "border-blue-300 dark:border-blue-500/60"
                    : "border-gray-200 dark:border-gray-800",
                )}
              >
                {option.preview}
              </div>

              <div className="flex w-full items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isSelected
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-900 dark:text-gray-100",
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
                <SelectionIndicator selected={isSelected} className="mt-0.5" />
              </div>
            </PreferenceOptionButton>
          );
        })}
      </div>
    </SettingsGroup>
  );
}
