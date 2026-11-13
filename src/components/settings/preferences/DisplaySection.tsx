import { GridIcon, ListIcon } from "@/components/icons";
import { useCookie } from "@/hooks";
import { cn } from "@/lib/utils";
import { SettingsGroup } from "../shared/SettingsSection";
import { VIEW_MODE_COOKIE_KEY, VIEW_MODE_LABELS, type ViewMode } from "../lib/view-mode";
import { PreferenceOptionButton, SelectionIndicator } from "./PreferenceCard";

function GridLayoutPreview({ selected }: { selected: boolean }) {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-1.5 p-2">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={cn(
            "flex flex-col justify-between rounded-xs border p-1.5 transition-colors duration-200",
            selected
              ? "border-blue-200/90 bg-white dark:border-blue-800/60 dark:bg-gray-900"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-xs transition-colors duration-200",
              selected ? "bg-blue-500 dark:bg-blue-400" : "bg-blue-100 dark:bg-blue-900/50",
            )}
          />
          <div className="flex flex-col gap-0.5">
            <span className="h-1 w-4/5 rounded-xs bg-gray-300 dark:bg-gray-600" />
            <span className="h-0.5 w-1/2 rounded-xs bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListLayoutPreview({ selected }: { selected: boolean }) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 p-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 rounded-xs border px-2 py-1.5 transition-colors duration-200",
            selected
              ? "border-blue-200/90 bg-white dark:border-blue-800/60 dark:bg-gray-900"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
          )}
        >
          <span
            className={cn(
              "size-2.5 shrink-0 rounded-xs transition-colors duration-200",
              selected ? "bg-blue-500 dark:bg-blue-400" : "bg-blue-100 dark:bg-blue-900/50",
            )}
          />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="h-1 w-3/5 rounded-xs bg-gray-300 dark:bg-gray-600" />
            <span className="h-1 w-1/5 rounded-xs bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

const DISPLAY_OPTIONS: {
  value: ViewMode;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "grid",
    description: "Visual cards arranged in columns",
    icon: <GridIcon className="size-4" />,
  },
  {
    value: "list",
    description: "Compact rows for fast scanning",
    icon: <ListIcon className="size-4" />,
  },
];

export function DisplaySettings() {
  const { value: viewMode, setValue: setViewMode } = useCookie<ViewMode>(
    VIEW_MODE_COOKIE_KEY,
    "grid",
  );

  return (
    <SettingsGroup
      title="Display"
      description="Choose how notebooks are displayed across the application."
    >
      <div role="radiogroup" aria-label="Display" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DISPLAY_OPTIONS.map((option) => {
          const isSelected = viewMode === option.value;
          return (
            <PreferenceOptionButton
              key={option.value}
              selected={isSelected}
              onSelect={() => setViewMode(option.value)}
              className="gap-3"
            >
              <div
                className={cn(
                  "h-24 w-full overflow-hidden rounded-xs border transition-colors duration-200",
                  isSelected
                    ? "border-blue-200 bg-blue-50/60 dark:border-blue-800/70 dark:bg-blue-950/20"
                    : "border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-950/60",
                )}
              >
                {option.value === "grid" ? (
                  <GridLayoutPreview selected={isSelected} />
                ) : (
                  <ListLayoutPreview selected={isSelected} />
                )}
              </div>

              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xs transition-colors duration-200",
                      isSelected
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                        : "bg-gray-100 text-gray-500 group-hover:bg-blue-100/70 group-hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700 dark:group-hover:text-gray-200",
                    )}
                  >
                    {option.icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold transition-colors",
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-900 dark:text-gray-100",
                      )}
                    >
                      {VIEW_MODE_LABELS[option.value]}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </div>
                <SelectionIndicator selected={isSelected} />
              </div>
            </PreferenceOptionButton>
          );
        })}
      </div>
    </SettingsGroup>
  );
}
