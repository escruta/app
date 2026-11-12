import { cn } from "@/lib/utils";
import type { Source, SourceGroup } from "@/interfaces";
import { getSourceIcon } from "@/lib/utils/index";
import { DeleteIcon, DotsVerticalIcon, EditIcon, FolderIcon } from "@/components/icons";
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
  TextField,
  Tooltip,
} from "@/components/ui";
import { useFetch, useShortcut } from "@/hooks";
import { useEffect, useRef, useState } from "react";

const DRAG_PREVIEW_MAX_WIDTH = 240;

function isLinuxPlatform(): boolean {
  return /linux/i.test(`${navigator.userAgent} ${navigator.platform}`);
}

interface SourceChipProps {
  source: Source;
  notebookId?: string;
  groups?: SourceGroup[];
  className?: string;
  onSourceSelect?: (source: Source) => void;
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
  onRename?: (source: Source) => void;
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
  onRename,
  onDelete,
  onMove,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: SourceChipProps) {
  const isPending = source.status === "PENDING";
  const isFailed = source.status === "FAILED";

  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>(source.title);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(source.groupId ?? null);
  const dragPreviewRef = useRef<HTMLElement | null>(null);
  const dragPreviewSizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    return () => {
      dragPreviewRef.current?.remove();
      dragPreviewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isDragging || !isLinuxPlatform()) return;

    const handleDragOver = (e: DragEvent) => {
      if (e.clientX === 0 && e.clientY === 0) return;
      moveDragPreview(e.clientX, e.clientY);
    };

    document.addEventListener("dragover", handleDragOver, true);

    return () => {
      document.removeEventListener("dragover", handleDragOver, true);
    };
  }, [isDragging]);

  function removeDragPreview() {
    dragPreviewRef.current?.remove();
    dragPreviewRef.current = null;
    dragPreviewSizeRef.current = null;
  }

  function moveDragPreview(clientX: number, clientY: number) {
    const preview = dragPreviewRef.current;
    const size = dragPreviewSizeRef.current;
    if (!preview || !size) return;

    preview.style.transform = `translate(${clientX - size.width / 2}px, ${clientY - size.height / 2}px)`;
  }

  function suppressSystemDragImage(e: React.DragEvent<HTMLDivElement>) {
    const blank = document.createElement("canvas");
    blank.width = 1;
    blank.height = 1;
    blank.style.cssText = "position:fixed;top:-9999px;left:-9999px;pointer-events:none;";
    document.body.appendChild(blank);
    window.setTimeout(() => blank.remove(), 0);

    try {
      e.dataTransfer.setDragImage(blank, 0, 0);
    } catch {
      blank.remove();
    }
  }

  function createDragPreview(element: HTMLElement) {
    removeDragPreview();

    const rect = element.getBoundingClientRect();
    const width = Math.min(rect.width, DRAG_PREVIEW_MAX_WIDTH);
    const preview = element.cloneNode(true) as HTMLElement;

    preview.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    preview.style.position = "fixed";
    preview.style.top = "0";
    preview.style.left = "0";
    preview.style.width = `${width}px`;
    preview.style.height = `${rect.height}px`;
    preview.style.maxWidth = "none";
    preview.style.opacity = "1";
    preview.style.pointerEvents = "none";
    preview.style.transition = "none";
    preview.style.zIndex = "9999";
    preview.setAttribute("aria-hidden", "true");

    document.body.appendChild(preview);
    dragPreviewRef.current = preview;
    dragPreviewSizeRef.current = { width, height: rect.height };
  }

  const { loading: deletingSource, refetch: deleteSource } = useFetch<Source>(
    `notebooks/${notebookId}/sources/${source.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        setIsDeleteModalOpen(false);
        onDelete?.();
      },
    },
    false,
  );

  const { loading: renamingSource, refetch: renameSource } = useFetch<Source>(
    `notebooks/${notebookId}/sources`,
    {
      method: "PUT",
      data: {
        id: source.id,
        title: newTitle.trim(),
      },
      onSuccess: (updatedSource) => {
        useFetch.clearCache();
        setIsRenameModalOpen(false);
        onRename?.(updatedSource);
      },
      onError: (error) => {
        console.error("Error renaming source:", error.message);
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

  function handleOpenRenameModal() {
    setNewTitle(source.title);
    setIsRenameModalOpen(true);
  }

  async function handleRenameSource() {
    if (!newTitle.trim() || newTitle.trim() === source.title) {
      setIsRenameModalOpen(false);
      setNewTitle(source.title);
      return;
    }
    await renameSource();
  }

  async function handleMoveSource() {
    if ((source.groupId ?? null) === selectedGroupId) {
      setIsMoveModalOpen(false);
      return;
    }
    await moveSource();
  }

  const handleChipClick = (e: { target: EventTarget | null }) => {
    if (isPending || isFailed) return;
    if ((e.target as HTMLElement).closest("#checkbox")) {
      return;
    }
    onSourceSelect?.(source);
  };

  const handleChipKeyDown = useShortcut("dialog-activate", handleChipClick, {
    enabled: !isPending && !isFailed,
  });

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

          if (isLinuxPlatform()) {
            suppressSystemDragImage(e);
            try {
              createDragPreview(e.currentTarget);
              moveDragPreview(e.clientX, e.clientY);
            } catch {
              removeDragPreview();
            }
          }

          onDragStart?.(source);
        }}
        onDragEnd={() => {
          removeDragPreview();
          onDragEnd?.();
        }}
        onClick={handleChipClick}
        onKeyDown={handleChipKeyDown}
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
              {notebookId && (
                <div
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Menu>
                    <Tooltip text="More options" position="top">
                      <MenuTrigger>
                        <IconButton
                          icon={<DotsVerticalIcon className="size-3.5" />}
                          variant="ghost"
                          size="sm"
                          ariaLabel="More options"
                        />
                      </MenuTrigger>
                    </Tooltip>
                    <MenuContent align="right">
                      {groups && (
                        <MenuItem
                          icon={<FolderIcon className="size-4" />}
                          label="Move to group"
                          onClick={handleOpenMoveModal}
                        />
                      )}
                      <MenuItem
                        icon={<EditIcon className="size-4" />}
                        label="Rename source"
                        onClick={handleOpenRenameModal}
                      />
                      <MenuItem
                        icon={<DeleteIcon className="size-4" />}
                        label="Delete source"
                        variant="danger"
                        onClick={() => setIsDeleteModalOpen(true)}
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
                icon: <FolderIcon className="size-4" />,
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

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setNewTitle(source.title);
        }}
        title="Rename source"
        onSubmit={() => {
          if (newTitle.trim() && !renamingSource) handleRenameSource();
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsRenameModalOpen(false);
                setNewTitle(source.title);
              }}
              disabled={renamingSource}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameSource}
              disabled={!newTitle.trim() || renamingSource || newTitle.trim() === source.title}
              icon={renamingSource ? <Spinner className="size-4" /> : undefined}
            >
              {renamingSource ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <TextField
          id={`source-rename-${source.id}`}
          label="Name your source"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Give your source a title..."
          autoFocus
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete source"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deletingSource}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteSource()}
              disabled={deletingSource}
              icon={deletingSource ? <Spinner className="size-4" /> : undefined}
            >
              {deletingSource ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-300">
          You&apos;re about to delete <span className="font-semibold">{source.title}</span>. This
          can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}
