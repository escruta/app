import { useDensity } from "@/hooks";
import { cn } from "@/lib/utils";
import { SettingsGroup } from "../shared/SettingsSection";
import { PreferenceOptionButton, SelectionIndicator } from "./PreferenceCard";

function DensityPreview({
  rows,
  gapPx,
  paddingPx,
  barHeightPx,
  selected,
}: {
  rows: number;
  gapPx: number;
  paddingPx: number;
  barHeightPx: number;
  selected: boolean;
}) {
  return (
    <div
      className="flex h-full w-full flex-col justify-center"
      style={{ gap: `${gapPx}px`, padding: `${paddingPx}px` }}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 rounded-xs border px-2 transition-colors duration-200",
            selected
              ? "border-blue-200/90 bg-white dark:border-blue-800/60 dark:bg-gray-900"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
          )}
          style={{ paddingTop: `${paddingPx - 2}px`, paddingBottom: `${paddingPx - 2}px` }}
        >
          <span
            className={cn(
              "shrink-0 rounded-xs transition-colors duration-200",
              selected ? "bg-blue-500 dark:bg-blue-400" : "bg-gray-300 dark:bg-gray-600",
            )}
            style={{ width: `${barHeightPx + 4}px`, height: `${barHeightPx + 4}px` }}
          />
          <span
            className="w-full rounded-xs bg-gray-200 dark:bg-gray-700"
            style={{ height: `${barHeightPx}px` }}
          />
        </div>
      ))}
    </div>
  );
}

export function DensitySettings() {
  const { density, setDensity, DensityOptions } = useDensity();

  const options = [
    {
      value: DensityOptions.Compact,
      label: "Compact",
      description: "More content in view",
      previewProps: { rows: 4, gapPx: 3, paddingPx: 5, barHeightPx: 4 },
    },
    {
      value: DensityOptions.Comfortable,
      label: "Comfortable",
      description: "Balanced default spacing",
      previewProps: { rows: 3, gapPx: 5, paddingPx: 7, barHeightPx: 5 },
    },
    {
      value: DensityOptions.Spacious,
      label: "Spacious",
      description: "Extra breathing room",
      previewProps: { rows: 2, gapPx: 8, paddingPx: 10, barHeightPx: 6 },
    },
  ];

  return (
    <SettingsGroup
      title="Density"
      description="Adjust the spacing of lists, cards, and controls across the application."
    >
      <div role="radiogroup" aria-label="Density" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const isSelected = density === option.value;
          return (
            <PreferenceOptionButton
              key={option.value}
              selected={isSelected}
              onSelect={() => setDensity(option.value)}
              className="gap-3"
            >
              <div
                className={cn(
                  "h-20 w-full overflow-hidden rounded-xs border transition-colors duration-200",
                  isSelected
                    ? "border-blue-200 bg-blue-50/60 dark:border-blue-800/70 dark:bg-blue-950/20"
                    : "border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-950/60",
                )}
              >
                <DensityPreview {...option.previewProps} selected={isSelected} />
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
