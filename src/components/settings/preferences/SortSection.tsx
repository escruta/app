import { useCookie } from "@/hooks";
import { Dropdown } from "@/components/ui";
import { SettingsGroup } from "../shared/SettingsSection";
import { SORT_LABELS, SORT_OPTIONS, type SortOption } from "../lib/sort";

export function SortSettings() {
  const [sortBy, setSortBy] = useCookie<SortOption>("globalSortPreference", "Newest");

  return (
    <SettingsGroup
      title="Sort"
      description="Choose how notebooks are sorted across the application."
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Sort by</p>
        <Dropdown<SortOption>
          options={SORT_OPTIONS}
          selectedOption={sortBy}
          onSelect={(option) => setSortBy(option)}
          className="w-full max-w-xs"
          renderOption={(option) => SORT_LABELS[option]}
        />
      </div>
    </SettingsGroup>
  );
}
