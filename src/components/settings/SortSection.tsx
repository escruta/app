import { useCookie } from "@/hooks";
import { CommonBar } from "@/components";
import { Dropdown } from "@/components/ui";

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

export function SortSection() {
  const [sortBy, setSortBy] = useCookie<SortOption>("globalSortPreference", "Newest");

  return (
    <CommonBar className="z-10 flex-col items-start justify-center">
      <div className="flex flex-col gap-3 *:w-fit">
        <h2 className="text-xl font-medium">Sort</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose how notebooks and notes are sorted across the application.
        </p>
        <Dropdown<SortOption>
          options={["Newest", "Oldest", "Alphabetical", "Reverse Alphabetical"]}
          selectedOption={sortBy}
          onSelect={(option) => setSortBy(option)}
          label="Sort by: "
          renderOption={(option) => SORT_LABELS[option]}
        />
      </div>
    </CommonBar>
  );
}
