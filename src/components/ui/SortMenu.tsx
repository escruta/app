import { SortAlphabetAscIcon, SortAlphabetDescIcon, SortIcon } from "@/components/icons";
import { SORT_LABELS, type SortOption } from "@/components/settings/lib/sort";
import { cn } from "@/lib/utils";
import { Select, type SelectOption } from "./Select";
import { Tooltip } from "./Tooltip";

export const SORT_SELECT_OPTIONS: SelectOption<SortOption>[] = [
  {
    value: "Newest",
    label: SORT_LABELS.Newest,
    icon: <SortIcon className="size-4" />,
  },
  {
    value: "Oldest",
    label: SORT_LABELS.Oldest,
    icon: <SortIcon className="size-4 rotate-180" />,
  },
  {
    value: "Alphabetical",
    label: SORT_LABELS.Alphabetical,
    icon: <SortAlphabetAscIcon className="size-4" />,
  },
  {
    value: "Reverse Alphabetical",
    label: SORT_LABELS["Reverse Alphabetical"],
    icon: <SortAlphabetDescIcon className="size-4" />,
  },
];

interface SortMenuProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  label?: string;
  className?: string;
}

export function SortMenu({ value, onChange, label, className }: SortMenuProps) {
  const title = label ? `Sort ${label}` : "Sort";

  return (
    <Tooltip
      text={`${title}: ${SORT_LABELS[value]}`}
      position="bottom"
      className={cn("inline-flex", className)}
    >
      <Select
        variant="icon"
        iconVariant="secondary"
        size="sm"
        options={SORT_SELECT_OPTIONS}
        value={value}
        onChange={onChange}
        heading="Sort by"
        ariaLabel={`${title}: ${SORT_LABELS[value]}`}
        align="right"
      />
    </Tooltip>
  );
}
