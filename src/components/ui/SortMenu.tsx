import { CheckIcon, SortIcon } from "@/components/icons";
import { SORT_LABELS, SORT_OPTIONS, type SortOption } from "@/components/settings/lib/sort";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "./Menu";
import { Tooltip } from "./Tooltip";

interface SortMenuProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  label?: string;
  className?: string;
}

export function SortMenu({ value, onChange, label, className }: SortMenuProps) {
  const title = label ? `Sort ${label}` : "Sort";

  return (
    <Menu className={className}>
      <Tooltip text={`${title}: ${SORT_LABELS[value]}`} position="bottom">
        <MenuTrigger>
          <IconButton icon={<SortIcon />} variant="secondary" size="sm" ariaLabel={title} />
        </MenuTrigger>
      </Tooltip>
      <MenuContent align="right">
        <MenuLabel>Sort by</MenuLabel>
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option}
            label={SORT_LABELS[option]}
            icon={
              option === value ? (
                <CheckIcon className="size-4" />
              ) : (
                <span className="block size-4" />
              )
            }
            className={cn({ "text-blue-600 dark:text-blue-400": option === value })}
            onClick={() => onChange(option)}
          />
        ))}
      </MenuContent>
    </Menu>
  );
}
