import { cn } from "@/lib/utils";
import type { Source } from "@/interfaces";
import { getSourceIcon } from "@/lib/utils/index";
import { DeleteIcon } from "@/components/icons";
import { Tooltip, Checkbox, Spinner, IconButton } from "@/components/ui";
import { useFetch } from "@/hooks";

interface SourceChipProps {
  source: Source;
  notebookId?: string;
  className?: string;
  onSourceSelect?: (source: Source) => void;
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
  onDelete?: () => void;
}

export function SourceChip({
  source,
  notebookId,
  className,
  onSourceSelect,
  selected = false,
  onToggle,
  onDelete,
}: SourceChipProps) {
  const isPending = source.status === "PENDING";
  const isFailed = source.status === "FAILED";

  const { loading: deletingSource, refetch: deleteSource } = useFetch<Source>(
    `notebooks/${notebookId}/sources/${source.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        if (onDelete) onDelete();
      },
    },
    false,
  );

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
        "border-gray-200 dark:border-gray-700",
        {
          "border-blue-300 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-800/40":
            selected,
          "hover:border-blue-300 dark:hover:border-gray-500 hover:bg-blue-50 dark:hover:bg-gray-800":
            !selected && !isPending && !isFailed,
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
        <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
          <div className="grid size-4 place-items-center text-blue-600 dark:text-blue-400">
            {isPending ? <Spinner size={16} /> : getSourceIcon(source.type)}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
            {source.title}
          </h2>
          {isFailed && (
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
              Failed to process source
            </p>
          )}
        </div>
        {isFailed && notebookId && (
          <div className="z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Tooltip text="Delete failed source" position="top">
              <IconButton
                icon={deletingSource ? <Spinner size={16} /> : <DeleteIcon />}
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                onClick={() => deleteSource()}
                disabled={deletingSource}
              />
            </Tooltip>
          </div>
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
