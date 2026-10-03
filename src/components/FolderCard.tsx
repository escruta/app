import type { Folder } from "@/interfaces";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  Menu,
  IconButton,
  Tooltip,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import {
  ChevronIcon,
  DotsVerticalIcon,
  EditIcon,
  DeleteIcon,
  FolderIcon,
} from "@/components/icons";
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

  const renderMenu = () => (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
    >
      <Menu>
        <Tooltip text="Folder settings" position="top">
          <MenuTrigger>
            <IconButton
              icon={<DotsVerticalIcon className="size-3.5" />}
              size="sm"
              ariaLabel="Folder settings"
              variant="ghost"
            />
          </MenuTrigger>
        </Tooltip>
        <MenuContent align="right">{renderMenuItems()}</MenuContent>
      </Menu>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          role="button"
          tabIndex={0}
          aria-expanded={onToggle ? isExpanded : undefined}
          className={cn(
            "w-full p-4 flex flex-row items-center gap-2.25",
            "group relative z-10 overflow-hidden rounded-xs border cursor-pointer transition-all duration-300 ease-out",
            "bg-blue-50 dark:bg-blue-950/40",
            "border-blue-200/80 dark:border-blue-800/50",
            "hover:bg-blue-100/80 dark:hover:bg-blue-900/40",
            "hover:border-blue-300 dark:hover:border-blue-700",
            "hover:ring-1 hover:ring-blue-300/60 dark:hover:ring-blue-700/60",
            isExpanded &&
              "border-blue-400 ring-2 ring-blue-400/60 hover:ring-blue-400/60 dark:border-blue-500 dark:ring-blue-500/50 dark:hover:ring-blue-500/50",
          )}
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
        >
          <div className="rounded-xs bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            <FolderIcon className="size-3.5" />
          </div>
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-blue-900 transition-colors duration-300 group-hover:text-blue-700 dark:text-blue-100 dark:group-hover:text-blue-50">
            {folder.title}
          </h2>
          {typeof notebookCount === "number" && notebookCount > 0 && (
            <span className="shrink-0 rounded-xs bg-blue-100/80 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              {notebookCount}
            </span>
          )}
          {onToggle && (
            <ChevronIcon
              direction={isExpanded ? "up" : "down"}
              className="size-4 shrink-0 text-blue-500/70 dark:text-blue-400/70"
            />
          )}
          {renderMenu()}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{renderContextMenuItems()}</ContextMenuContent>
    </ContextMenu>
  );
}
