import { cn } from "@/lib/utils";
import type { Source } from "@/interfaces";
import { getSourceIcon } from "@/lib/utils/index";
import { StarsIcon } from "@/components/icons";
import { Tooltip, Checkbox, Spinner } from "@/components/ui";

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
  const isPending = source.status === "PENDING";
  const isFailed = source.status === "FAILED";

  const handleChipClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (isPending || isFailed) return;
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
          "border-blue-300 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10": selected,
          "hover:border-blue-300 dark:hover:border-gray-500": !selected && !isPending && !isFailed,
          "opacity-70 cursor-not-allowed": isPending,
          "border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10 cursor-not-allowed":
            isFailed,
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
      tabIndex={isPending || isFailed ? -1 : 0}
      role="button"
    >
      <div className="relative flex h-full items-center gap-3 p-3">
        <div className="shrink-0 rounded-xs bg-gray-100 p-2 transition-all duration-300 group-hover:bg-blue-100 dark:bg-gray-700 dark:group-hover:bg-blue-800">
          <div className="grid size-4 place-items-center text-gray-600 transition-all duration-300 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
            {isPending ? <Spinner size={16} /> : getSourceIcon(source)}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 text-sm font-medium text-gray-800 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-200 dark:group-hover:text-blue-100">
            {source.title}
          </h2>
          {isFailed && (
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              Failed to process source
            </p>
          )}
        </div>
        {!isPending && !isFailed && source.isConvertedByAi && (
          <Tooltip text="Converted by AI" position="top">
            <div className="flex shrink-0 items-center gap-1.5 rounded-xs border border-blue-200 bg-blue-100 px-2 py-1 text-blue-700 transition-all duration-300 select-none group-hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-200 dark:group-hover:bg-blue-900">
              <div className="h-3 w-3 shrink-0">
                <StarsIcon />
              </div>
              <span className="text-xs font-semibold">AI</span>
            </div>
          </Tooltip>
        )}
        {!isPending && !isFailed && (
          <div id="checkbox" className="shrink-0">
            <Checkbox checked={selected} onChange={(checked) => onToggle?.(checked)} />
          </div>
        )}
      </div>
    </div>
  );
}
