export type SortOption = "Newest" | "Oldest" | "Alphabetical" | "Reverse Alphabetical";

export const SORT_OPTIONS: SortOption[] = [
  "Newest",
  "Oldest",
  "Alphabetical",
  "Reverse Alphabetical",
];

export const SORT_LABELS: Record<SortOption, string> = {
  Newest: "Newest",
  Oldest: "Oldest",
  Alphabetical: "Alphabetical",
  "Reverse Alphabetical": "Reverse Alphabetical",
};

export function getSortedItems<T extends { createdAt: Date | string; title: string }>(
  items: T[],
  sortBy: SortOption,
  getDate: (item: T) => Date | string = (item) => item.createdAt,
): T[] {
  const sorted = [...items];
  switch (sortBy) {
    case "Newest":
      return sorted.sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
    case "Oldest":
      return sorted.sort((a, b) => new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime());
    case "Alphabetical":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "Reverse Alphabetical":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
}
