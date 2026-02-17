import { cn } from "@/lib/utils";
import type { Source } from "@/interfaces";
import { getSourceIcon } from "@/lib/utils/index";
import { StarsIcon } from "@/components/icons";
import { Tooltip, Checkbox } from "@/components/ui";

interface SourceChipProps {
  source: Source;
  className?: string;
  onSourceSelect?: (source: Source) => void;
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
}

export function SourceChip({
  source,
  className,
  onSourceSelect,
  selected = false,
  onToggle,
}: SourceChipProps) {
  const handleChipClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("#checkbox")) {
      return;
    }
    onSourceSelect?.(source);
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xs border cursor-pointer ",
        "transition-all duration-300 ease-out select-none",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
        "dark:focus:ring-offset-gray-900",
        "bg-white dark:bg-gray-900",
        "border-gray-200 dark:border-gray-600",
        "hover:bg-blue-50 dark:hover:bg-gray-800",
        {
          "border-blue-300 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10":
            selected,
          "hover:border-blue-300 dark:hover:border-gray-500": !selected,
        },
        className,
      )}
      onClick={handleChipClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleChipClick(e);
        }
      }}
      tabIndex={0}
      role="button"
    >
      <div className="relative p-3 h-full flex items-center gap-3">
        <div className="shrink-0 p-2 rounded-xs transition-all duration-300 bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-800">
          <div className="w-4 h-4 transition-all duration-300 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {getSourceIcon(source)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300">
            {source.title}
          </h2>
        </div>
        {source.isConvertedByAi && (
          <Tooltip text="Converted by AI" position="top">
            <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-xs transition-all duration-300 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 group-hover:bg-blue-200 dark:group-hover:bg-blue-900 select-none">
              <div className="w-3 h-3 shrink-0">
                <StarsIcon />
              </div>
              <span className="text-xs font-semibold">AI</span>
            </div>
          </Tooltip>
        )}
        <div id="checkbox" className="shrink-0">
          <Checkbox
            checked={selected}
            onChange={(checked) => onToggle?.(checked)}
          />
        </div>
      </div>
    </div>
  );
}
