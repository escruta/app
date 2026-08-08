import { useCookie } from "@/hooks";
import { Dropdown } from "@/components/ui";
import { SettingsGroup } from "./SettingsSection";

export type SortOption = "Newest" | "Oldest" | "Alphabetical" | "Reverse Alphabetical";

const SORT_LABELS: Record<SortOption, string> = {
  Newest: "Newest",
  Oldest: "Oldest",
  Alphabetical: "Alphabetical",
  "Reverse Alphabetical": "Reverse Alphabetical",
};

export function getSortedItems<T extends { createdAt: Date | string; title: string }>(
  items: T[],
  sortBy: SortOption,
): T[] {
  const sorted = [...items];
  switch (sortBy) {
    case "Newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "Oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "Alphabetical":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "Reverse Alphabetical":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
}

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
          options={["Newest", "Oldest", "Alphabetical", "Reverse Alphabetical"]}
          selectedOption={sortBy}
          onSelect={(option) => setSortBy(option)}
          className="w-full max-w-xs"
          renderOption={(option) => SORT_LABELS[option]}
        />
      </div>
    </SettingsGroup>
  );
}
