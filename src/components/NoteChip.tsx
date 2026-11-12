import { cn } from "@/lib/utils";
import { useFetch, useShortcut } from "@/hooks";
import type { Note, NoteGroup } from "@/interfaces";
import { DeleteIcon, DotsVerticalIcon, EditIcon, FolderIcon, NoteIcon } from "@/components/icons";
import {
  Button,
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
import { useEffect, useRef, useState } from "react";

const DRAG_PREVIEW_MAX_WIDTH = 240;

function isLinuxPlatform(): boolean {
  return /linux/i.test(`${navigator.userAgent} ${navigator.platform}`);
}

interface NoteChipProps {
  note: Note;
  notebookId?: string;
  groups?: NoteGroup[];
  className?: string;
  onSelect?: (note: Note) => void;
  onRename?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onMove?: () => void;
  onDragStart?: (note: Note) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function NoteChip({
  note,
  notebookId,
  groups,
  className,
  onSelect,
  onRename,
  onDelete,
  onMove,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: NoteChipProps) {
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [displayTitle, setDisplayTitle] = useState<string>(note.title);
  const [newTitle, setNewTitle] = useState<string>(note.title);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(note.groupId ?? null);
  const dragPreviewRef = useRef<HTMLElement | null>(null);
  const dragPreviewSizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setDisplayTitle(note.title);
  }, [note.title]);

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

  const { loading: movingNote, refetch: moveNote } = useFetch<Note>(
    "/notes",
    {
      method: "PUT",
      data: {
        id: note.id,
        groupId: selectedGroupId,
        removeGroup: selectedGroupId === null,
      },
      onSuccess: () => {
        useFetch.clearCache();
        setIsMoveModalOpen(false);
        onMove?.();
      },
      onError: (error) => {
        console.error("Error moving note:", error.message);
      },
    },
    false,
  );

  const { loading: renamingNote, refetch: renameNote } = useFetch<Note>(
    "/notes",
    {
      method: "PUT",
      data: {
        id: note.id,
        title: newTitle.trim(),
      },
      onSuccess: (updatedNote) => {
        const updatedTitle = updatedNote?.title?.trim() || newTitle.trim();
        useFetch.clearCache();
        setDisplayTitle(updatedTitle);
        setNewTitle(updatedTitle);
        setIsRenameModalOpen(false);
        onRename?.(updatedNote);
      },
      onError: (error) => {
        console.error("Error renaming note:", error.message);
      },
    },
    false,
  );

  const { loading: deletingNote, refetch: deleteNote } = useFetch<Note>(
    `/notes/${note.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache();
        setIsDeleteModalOpen(false);
        onDelete?.(note);
      },
      onError: (error) => {
        console.error("Error deleting note:", error.message);
      },
    },
    false,
  );

  const handleKeyDown = useShortcut("dialog-activate", () => onSelect?.(note));

  function handleOpenMoveModal() {
    setSelectedGroupId(note.groupId ?? null);
    setIsMoveModalOpen(true);
  }

  function handleOpenRenameModal() {
    setNewTitle(displayTitle);
    setIsRenameModalOpen(true);
  }

  async function handleRenameNote() {
    if (!newTitle.trim() || newTitle.trim() === displayTitle) {
      setIsRenameModalOpen(false);
      setNewTitle(displayTitle);
      return;
    }
    await renameNote();
  }

  async function handleMoveNote() {
    if ((note.groupId ?? null) === selectedGroupId) {
      setIsMoveModalOpen(false);
      return;
    }
    await moveNote();
  }

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xs border cursor-pointer",
          "transition-all duration-300 ease-out select-none",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          "dark:focus:ring-offset-gray-900",
          "bg-white dark:bg-gray-900",
          "border-gray-200 dark:border-gray-700",
          "hover:bg-blue-50 dark:hover:bg-gray-800",
          "hover:border-blue-300 dark:hover:border-gray-500",
          { "opacity-40": isDragging },
          className,
        )}
        draggable={Boolean(notebookId)}
        onDragStart={(e) => {
          if (!notebookId) return;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", note.id);

          if (isLinuxPlatform()) {
            suppressSystemDragImage(e);
            try {
              createDragPreview(e.currentTarget);
              moveDragPreview(e.clientX, e.clientY);
            } catch {
              removeDragPreview();
            }
          }

          onDragStart?.(note);
        }}
        onDragEnd={() => {
          removeDragPreview();
          onDragEnd?.();
        }}
        onClick={() => onSelect?.(note)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
      >
        <div className="relative flex h-full items-center gap-3 p-3">
          <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
            <div className="size-4 text-blue-600 dark:text-blue-400">
              <NoteIcon />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <h2 className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
              {displayTitle}
            </h2>
          </div>
          {(notebookId || onRename || onDelete) && (
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
                    label="Rename note"
                    onClick={handleOpenRenameModal}
                  />
                  <MenuItem
                    icon={<DeleteIcon className="size-4" />}
                    label="Delete note"
                    variant="danger"
                    onClick={() => setIsDeleteModalOpen(true)}
                  />
                </MenuContent>
              </Menu>
            </div>
          )}
        </div>
      </div>

      {isMoveModalOpen && (
        <Modal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          title={`Move "${displayTitle}"`}
          actions={
            <>
              <Button variant="secondary" onClick={() => setIsMoveModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleMoveNote}
                disabled={movingNote}
                icon={movingNote ? <Spinner className="size-4" /> : undefined}
              >
                {movingNote ? "Moving" : "Move"}
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
              emptyText="You don't have any groups yet, create one to organize your notes."
            />
            {selectedGroupId === null && (note.groupId ?? null) !== null && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will remove the note from its current group.
              </p>
            )}
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setNewTitle(displayTitle);
        }}
        title="Rename note"
        onSubmit={() => {
          if (newTitle.trim() && !renamingNote) handleRenameNote();
        }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsRenameModalOpen(false);
                setNewTitle(displayTitle);
              }}
              disabled={renamingNote}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameNote}
              disabled={!newTitle.trim() || renamingNote || newTitle.trim() === displayTitle}
              icon={renamingNote ? <Spinner className="size-4" /> : undefined}
            >
              {renamingNote ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <TextField
          id={`note-rename-${note.id}`}
          label="Name your note"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="e.g., Key ideas, Summary, To review…"
          autoFocus
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete note"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deletingNote}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteNote()}
              disabled={deletingNote}
              icon={deletingNote ? <Spinner className="size-4" /> : undefined}
            >
              {deletingNote ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-300">
          You&apos;re about to delete <span className="font-semibold">{displayTitle}</span>. This
          can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}
