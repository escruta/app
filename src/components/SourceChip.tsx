import { cn } from "@/lib/utils";
import type { Source, SourceGroup } from "@/interfaces";
import { getSourceIcon } from "@/lib/utils/index";
import { DeleteIcon, DotsVerticalIcon, FolderIcon } from "@/components/icons";
import {
  Button,
  Checkbox,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  Modal,
  SelectList,
  Spinner,
  Tooltip,
} from "@/components/ui";
import { useFetch } from "@/hooks";
import { useState } from "react";

interface SourceChipProps {
  source: Source;
  notebookId?: string;
  groups?: SourceGroup[];
  className?: string;
  onSourceSelect?: (source: Source) => void;
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
  onDelete?: () => void;
  onMove?: () => void;
  onDragStart?: (source: Source) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function SourceChip({
  source,
  notebookId,
  groups,
  className,
  onSourceSelect,
  selected = false,
  onToggle,
  onDelete,
  onMove,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: SourceChipProps) {
  const isPending = source.status === "PENDING";
  const isFailed = source.status === "FAILED";

  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(source.groupId ?? null);

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

  const { loading: movingSource, refetch: moveSource } = useFetch<Source>(
    `notebooks/${notebookId}/sources`,
    {
      method: "PUT",
      data: {
        id: source.id,
        groupId: selectedGroupId,
        removeGroup: selectedGroupId === null,
      },
      onSuccess: () => {
        useFetch.clearCache();
        setIsMoveModalOpen(false);
        onMove?.();
      },
      onError: (error) => {
        console.error("Error moving source:", error.message);
      },
    },
    false,
  );

  function handleOpenMoveModal() {
    setSelectedGroupId(source.groupId ?? null);
    setIsMoveModalOpen(true);
  }

  async function handleMoveSource() {
    if ((source.groupId ?? null) === selectedGroupId) {
      setIsMoveModalOpen(false);
      return;
    }
    await moveSource();
  }

  const handleChipClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (isPending || isFailed) return;
    if ((e.target as HTMLElement).closest("#checkbox")) {
      return;
    }
    onSourceSelect?.(source);
  };

  return (
    <>
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
            "opacity-40": isDragging,
          },
          className,
        )}
        draggable={!isPending && !isFailed}
        onDragStart={(e) => {
          if (isPending || isFailed) return;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", source.id);
          onDragStart?.(source);
        }}
        onDragEnd={() => onDragEnd?.()}
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
                We couldn't process this source
              </p>
            )}
          </div>
          {isFailed && notebookId && (
            <div className="z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Tooltip text="Remove this failed source" position="top">
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
            <>
              {groups && notebookId && (
                <div
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Menu>
                    <Tooltip text="Move to group" position="top">
                      <MenuTrigger>
                        <IconButton
                          icon={<DotsVerticalIcon className="size-3.5" />}
                          variant="ghost"
                          size="sm"
                          ariaLabel="Move to group"
                        />
                      </MenuTrigger>
                    </Tooltip>
                    <MenuContent align="right">
                      <MenuItem
                        icon={<FolderIcon className="size-4" />}
                        label="Move to group"
                        onClick={handleOpenMoveModal}
                      />
                    </MenuContent>
                  </Menu>
                </div>
              )}
              <div
                id="checkbox"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle?.(!selected);
                }}
              >
                <Checkbox checked={selected} />
              </div>
            </>
          )}
        </div>
      </div>
      {isMoveModalOpen && (
        <Modal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          title={`Move "${source.title}"`}
          actions={
            <>
              <Button variant="secondary" onClick={() => setIsMoveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleMoveSource}
                disabled={movingSource}
                icon={movingSource ? <Spinner className="size-4" /> : undefined}
              >
                {movingSource ? "Moving" : "Move"}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-2">
            <MenuLabel>Move to group</MenuLabel>
            <SelectList
              options={(groups ?? []).map((group) => ({
                id: group.id,
                label: group.title,
                icon: <FolderIcon />,
              }))}
              selectedId={selectedGroupId}
              onSelect={setSelectedGroupId}
              emptyText="You don't have any groups yet, create one to organize your sources."
            />
            {selectedGroupId === null && (source.groupId ?? null) !== null && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will remove the source from its current group.
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
