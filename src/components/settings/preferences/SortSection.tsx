import { SortIcon } from "@/components/icons";
import { useCookie } from "@/hooks";
import { cn } from "@/lib/utils";
import { SORT_LABELS, SORT_OPTIONS, type SortOption } from "../lib/sort";
import { SettingsGroup } from "../shared/SettingsSection";
import { PreferenceOptionButton, SelectionIndicator } from "./PreferenceCard";

const SORT_META: Record<SortOption, { description: string; badge: React.ReactNode }> = {
  Newest: {
    description: "Most recently created first",
    badge: <SortIcon className="size-4" />,
  },
  Oldest: {
    description: "Earliest created first",
    badge: <SortIcon className="size-4 rotate-180" />,
  },
  Alphabetical: {
    description: "Title from A to Z",
    badge: <span className="font-mono text-[11px] font-bold tracking-tighter">A–Z</span>,
  },
  "Reverse Alphabetical": {
    description: "Title from Z to A",
    badge: <span className="font-mono text-[11px] font-bold tracking-tighter">Z–A</span>,
  },
};

export function SortSettings() {
  const { value: sortBy, setValue: setSortBy } = useCookie<SortOption>(
    "globalSortPreference",
    "Newest",
  );

  return (
    <SettingsGroup
      title="Sort"
      description="Choose how notebooks are sorted across the application."
    >
      <div
        role="radiogroup"
        aria-label="Sort order"
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {SORT_OPTIONS.map((option) => {
          const isSelected = sortBy === option;
          const meta = SORT_META[option];

          return (
            <PreferenceOptionButton
              key={option}
              selected={isSelected}
              onSelect={() => setSortBy(option)}
              className="flex-row items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xs transition-colors duration-200",
                    isSelected
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                      : "bg-gray-100 text-gray-500 group-hover:bg-blue-100/70 group-hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700 dark:group-hover:text-gray-200",
                  )}
                >
                  {meta.badge}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-sm font-semibold transition-colors",
                      isSelected
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-900 dark:text-gray-100",
                    )}
                  >
                    {SORT_LABELS[option]}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {meta.description}
                  </p>
                </div>
              </div>
              <SelectionIndicator selected={isSelected} />
            </PreferenceOptionButton>
          );
        })}
      </div>
    </SettingsGroup>
  );
}
