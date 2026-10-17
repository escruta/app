import type { Folder } from "@/interfaces";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  Menu,
  Tooltip,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import { DotsVerticalIcon, EditIcon, DeleteIcon, FolderIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  folder: Folder;
  isExpanded?: boolean;
  notebookCount?: number;
  onToggle?: () => void;
  onEditFolder?: () => void;
  onDeleteFolder?: () => void;
}

export function FolderCard({
  folder,
  isExpanded = false,
  notebookCount,
  onToggle,
  onEditFolder,
  onDeleteFolder,
}: FolderCardProps) {
  const handleCardClick = () => {
    onToggle?.();
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const renderMenuItems = () => (
    <>
      {onEditFolder && (
        <MenuItem
          icon={<EditIcon className="size-4" />}
          label="Rename folder"
          onClick={onEditFolder}
        />
      )}
      {onDeleteFolder && (
        <MenuItem
          icon={<DeleteIcon className="size-4" />}
          label="Delete folder"
          variant="danger"
          onClick={onDeleteFolder}
        />
      )}
    </>
  );

  const renderContextMenuItems = () => (
    <>
      {onEditFolder && (
        <ContextMenuItem
          icon={<EditIcon className="size-4" />}
          label="Rename folder"
          onClick={onEditFolder}
        />
      )}
      {onDeleteFolder && (
        <ContextMenuItem
          icon={<DeleteIcon className="size-4" />}
          label="Delete folder"
          variant="danger"
          onClick={onDeleteFolder}
        />
      )}
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          role="button"
          tabIndex={0}
          aria-pressed={onToggle ? isExpanded : undefined}
          className={cn(
            "group relative inline-flex h-9 shrink-0 items-center gap-2 rounded-xs border px-3 text-sm font-medium transition-all duration-200 ease-out select-none cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900",
            isExpanded
              ? "border-blue-400 bg-blue-50 text-blue-900 ring-1 ring-blue-400/50 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-100 dark:ring-blue-500/40"
              : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:hover:text-blue-100",
          )}
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
        >
          <div
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-xs transition-colors",
              isExpanded
                ? "bg-blue-500 text-white dark:bg-blue-500 dark:text-white"
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
            )}
          >
            <FolderIcon className="size-3" />
          </div>

          <span className="max-w-44 truncate font-semibold">{folder.title}</span>

          {typeof notebookCount === "number" && notebookCount > 0 && (
            <span
              className={cn(
                "shrink-0 rounded-xs px-1.5 py-0.5 text-[11px] leading-none font-semibold transition-colors",
                isExpanded
                  ? "bg-blue-200/70 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200"
                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-100/80 group-hover:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-gray-700 dark:group-hover:text-gray-200",
              )}
            >
              {notebookCount}
            </span>
          )}

          {(onEditFolder || onDeleteFolder) && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
              className="-mr-1 flex items-center"
            >
              <Menu>
                <Tooltip text="Folder settings" position="top">
                  <MenuTrigger>
                    <button
                      type="button"
                      aria-label="Folder settings"
                      className={cn(
                        "flex size-5 items-center justify-center rounded-xs transition-colors cursor-pointer",
                        isExpanded
                          ? "text-blue-600 hover:bg-blue-200/60 hover:text-blue-900 dark:text-blue-300 dark:hover:bg-blue-900/60 dark:hover:text-white"
                          : "text-gray-400 hover:bg-blue-100 hover:text-blue-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-200",
                      )}
                    >
                      <DotsVerticalIcon className="size-3.5" />
                    </button>
                  </MenuTrigger>
                </Tooltip>
                <MenuContent align="left">{renderMenuItems()}</MenuContent>
              </Menu>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{renderContextMenuItems()}</ContextMenuContent>
    </ContextMenu>
  );
}
