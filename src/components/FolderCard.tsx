import type { Folder } from "@/interfaces";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  IconButton,
  Menu,
  Skeleton,
  Tooltip,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import { DotsVerticalIcon, EditIcon, DeleteIcon, FolderIcon } from "@/components/icons";
import { useShortcut } from "@/hooks";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  folder: Folder;
  notebookCount?: number;
  isDropTarget?: boolean;
  onOpen?: () => void;
  onEditFolder?: () => void;
  onDeleteFolder?: () => void;
}

export function FolderCardSkeleton() {
  return (
    <div className="flex h-16 w-full items-center gap-3 rounded-xs border border-gray-200 bg-white px-3.5 dark:border-gray-700 dark:bg-gray-900">
      <Skeleton variant="rectangle" width={32} height={32} className="shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton variant="rectangle" width="70%" height={14} />
        <Skeleton variant="rectangle" width="42%" height={10} />
      </div>
    </div>
  );
}

export function FolderCard({
  folder,
  notebookCount,
  isDropTarget = false,
  onOpen,
  onEditFolder,
  onDeleteFolder,
}: FolderCardProps) {
  const handleCardClick = () => {
    onOpen?.();
  };

  const handleCardKeyDown = useShortcut("dialog-activate", () => {
    onOpen?.();
  });

  const handleMenuWrapperKeyDown = useShortcut("dialog-activate", () => {}, {
    preventDefault: false,
    stopPropagation: true,
  });

  const countLabel =
    typeof notebookCount === "number"
      ? notebookCount === 0
        ? "Empty"
        : notebookCount === 1
          ? "1 notebook"
          : `${notebookCount} notebooks`
      : null;

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
          data-drop-folder-id={folder.id}
          className={cn(
            "group relative flex h-16 w-full cursor-pointer items-center justify-between gap-2 rounded-xs border px-3.5 transition-all duration-200 ease-out select-none",
            isDropTarget
              ? "border-blue-300 bg-blue-50/80 shadow-sm ring-1 ring-blue-400/50 dark:border-blue-600 dark:bg-blue-950/50 dark:ring-blue-500/40"
              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/60 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-500 dark:hover:bg-gray-800",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900",
          )}
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xs transition-colors duration-200",
                isDropTarget
                  ? "bg-blue-500 text-white dark:bg-blue-500 dark:text-white"
                  : "bg-blue-50 text-blue-600 group-hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-900/50",
              )}
            >
              <FolderIcon className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h4
                title={folder.title}
                className="truncate text-sm font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100"
              >
                {folder.title}
              </h4>
              {countLabel && (
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{countLabel}</p>
              )}
            </div>
          </div>

          {(onEditFolder || onDeleteFolder) && (
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleMenuWrapperKeyDown}
              className="-mr-1 shrink-0 opacity-100 transition-opacity duration-150 has-[[aria-expanded=true]]:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
            >
              <Menu>
                <Tooltip text="Folder options" position="top">
                  <MenuTrigger>
                    <IconButton
                      icon={<DotsVerticalIcon />}
                      size="sm"
                      ariaLabel="Folder options"
                      variant="ghost"
                    />
                  </MenuTrigger>
                </Tooltip>
                <MenuContent>{renderMenuItems()}</MenuContent>
              </Menu>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{renderContextMenuItems()}</ContextMenuContent>
    </ContextMenu>
  );
}
