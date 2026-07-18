import type { Folder, Note } from "@/interfaces";
import {
  Button,
  Chip,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  Modal,
  Menu,
  MenuLabel,
  IconButton,
  SelectList,
  Spinner,
  Tooltip,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@/components/ui";
import {
  NoteIcon,
  DotsVerticalIcon,
  DeleteIcon,
  NotebookIcon,
  FolderIcon,
} from "@/components/icons";
import { useState, useRef, useLayoutEffect } from "react";
import { useFetch } from "@/hooks";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  viewMode?: "grid" | "list";
  notebookTitle?: string;
  folders?: Folder[];
  onChange?: () => void;
}

export function NoteCard({
  note,
  viewMode = "grid",
  notebookTitle,
  folders,
  onChange,
}: NoteCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(note.folderId ?? null);
  const navigate = useNavigate();

  const firstDateRef = useRef<HTMLSpanElement>(null);
  const secondDateRef = useRef<HTMLSpanElement>(null);
  const [sameLine, setSameLine] = useState(true);

  useLayoutEffect(() => {
    const check = () => {
      const first = firstDateRef.current;
      const second = secondDateRef.current;
      if (first && second) {
        setSameLine(
          Math.abs(first.getBoundingClientRect().top - second.getBoundingClientRect().top) < 1,
        );
      }
    };
    check();
    const observer = new ResizeObserver(check);
    const parent = firstDateRef.current?.parentElement;
    if (parent) observer.observe(parent);
    window.addEventListener("resize", check);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", check);
    };
  }, []);

  const {
    loading: deletingNote,
    error: deleteError,
    refetch: deleteNote,
  } = useFetch<Note>(
    `/notes/${note.id}`,
    {
      method: "DELETE",
      onSuccess: () => {
        useFetch.clearCache(`/notes`);
        useFetch.clearCache(`/notebooks/${note.notebookId}`);
      },
    },
    false,
  );

  const { loading: movingNote, refetch: moveNote } = useFetch<Note>(
    `/notes`,
    {
      method: "PUT",
      data: {
        id: note.id,
        folderId: selectedFolderId,
        removeFolder: selectedFolderId === null,
      },
      onSuccess: () => {
        useFetch.clearCache("/notes");
        setIsMoveModalOpen(false);
        onChange?.();
      },
    },
    false,
  );

  async function handleDeleteNote() {
    try {
      await deleteNote();
      setIsDeleted(true);
      setIsDeleteModalOpen(false);
      useFetch.clearCache("/notes");
      onChange?.();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  }

  function handleOpenMoveModal() {
    setSelectedFolderId(note.folderId ?? null);
    setIsMoveModalOpen(true);
  }

  async function handleMoveNote() {
    if ((note.folderId ?? null) === selectedFolderId) {
      setIsMoveModalOpen(false);
      return;
    }
    await moveNote();
  }

  const moveToFolderBody = (
    <div className="flex flex-col gap-2">
      <MenuLabel>Move to folder</MenuLabel>
      <SelectList
        options={(folders ?? []).map((folder) => ({
          id: folder.id,
          label: folder.title,
          icon: <FolderIcon />,
        }))}
        selectedId={selectedFolderId}
        onSelect={setSelectedFolderId}
        emptyText="You don't have any folders yet."
      />
      {selectedFolderId === null && (note.folderId ?? null) !== null && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This will remove the note from its current folder.
        </p>
      )}
    </div>
  );

  const formatDate = (date: Date) => {
    return new Date(date)
      .toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .replace(".", "");
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (isDeleted) {
    return null;
  }

  const baseClasses = cn(
    "group z-10 rounded-xs border cursor-pointer transition-all duration-300 ease-out",
    "bg-white dark:bg-gray-900",
    "border-gray-200 dark:border-gray-700",
    "hover:bg-blue-50 dark:hover:bg-gray-800",
    "hover:border-blue-300 dark:hover:border-gray-500",
  );

  const gridClasses = cn("h-42 w-full p-4 flex flex-col justify-between");
  const listClasses = cn("h-20 w-full p-4 flex flex-row items-center justify-between");

  const handleCardClick = () => {
    navigate(`/note/${note.id}`);
    window.scrollTo(0, 0);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const renderMenuItems = () => (
    <>
      {folders && (
        <MenuItem
          icon={<FolderIcon className="size-4" />}
          label="Move to folder"
          onClick={handleOpenMoveModal}
        />
      )}
      <MenuItem
        icon={<DeleteIcon />}
        label="Delete"
        onClick={() => setIsDeleteModalOpen(true)}
        variant="danger"
      />
    </>
  );

  const renderContextMenuItems = () => (
    <>
      {folders && (
        <ContextMenuItem
          icon={<FolderIcon className="size-4" />}
          label="Move to folder"
          onClick={handleOpenMoveModal}
        />
      )}
      <ContextMenuItem
        icon={<DeleteIcon />}
        label="Delete"
        onClick={() => setIsDeleteModalOpen(true)}
        variant="danger"
      />
    </>
  );

  const renderMenu = () => (
    <div
      role="button"
      tabIndex={0}
      onClick={handleMenuClick}
      onKeyDown={(e) => e.key === "Enter" && handleMenuClick(e as unknown as React.MouseEvent)}
    >
      <Menu>
        <Tooltip text="More options" position="top">
          <MenuTrigger>
            <IconButton
              icon={<DotsVerticalIcon />}
              size="sm"
              ariaLabel="More options"
              variant="ghost"
            />
          </MenuTrigger>
        </Tooltip>
        <MenuContent>{renderMenuItems()}</MenuContent>
      </Menu>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          role="button"
          tabIndex={0}
          className={cn(baseClasses, {
            [gridClasses]: viewMode === "grid",
            [listClasses]: viewMode === "list",
          })}
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
        >
          {viewMode === "grid" ? (
            <>
              <div className="flex items-start justify-between">
                <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
                  <div className="flex size-4 items-center justify-center text-blue-600 dark:text-blue-400 [&>svg]:h-full [&>svg]:w-full">
                    <NoteIcon />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {note.notebookId && notebookTitle && (
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip text={notebookTitle} position="top">
                        <Chip
                          size="sm"
                          icon={<NotebookIcon className="size-2.5" />}
                          onClick={() => navigate(`/notebook/${note.notebookId}`)}
                          className="border-none bg-gray-50/40 opacity-40 transition-opacity hover:opacity-100 dark:bg-gray-800/40"
                        />
                      </Tooltip>
                    </div>
                  )}
                  {renderMenu()}
                </div>
              </div>

              <div>
                <h2 className="mb-1 line-clamp-2 text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
                  {note.title}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span ref={firstDateRef} className="whitespace-nowrap">
                    Created {formatDate(note.createdAt)}
                  </span>
                  {sameLine ? " - " : " "}
                  <span ref={secondDateRef} className="whitespace-nowrap">
                    Modified {formatDate(note.updatedAt)}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="shrink-0 rounded-xs bg-blue-100 p-2 dark:bg-blue-900/50">
                  <div className="flex size-4 items-center justify-center text-blue-600 dark:text-blue-400 [&>svg]:h-full [&>svg]:w-full">
                    <NoteIcon />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-900 dark:text-gray-100 dark:group-hover:text-blue-100">
                    {note.title}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {formatDate(note.createdAt)} - Modified {formatDate(note.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {note.notebookId && notebookTitle && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip text={notebookTitle} position="top">
                      <Chip
                        size="sm"
                        icon={<NotebookIcon className="size-2.5" />}
                        onClick={() => navigate(`/notebook/${note.notebookId}`)}
                        className="border-none bg-gray-50/40 opacity-40 transition-opacity hover:opacity-100 dark:bg-gray-800/40"
                      />
                    </Tooltip>
                  </div>
                )}
                {renderMenu()}
              </div>
            </>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{renderContextMenuItems()}</ContextMenuContent>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={`Delete note "${note.title}"`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteNote}
              disabled={deletingNote}
              icon={deletingNote ? <Spinner /> : undefined}
            >
              {deletingNote ? "Deleting" : "Delete"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will permanently delete the note, and you won't be able to undo it.
          </p>
          {deleteError && (
            <div className="text-sm text-red-500">
              We couldn't delete this note: {deleteError.message}
            </div>
          )}
        </div>
      </Modal>

      {/* Move to Folder Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title={`Move "${note.title}"`}
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
        {moveToFolderBody}
      </Modal>
    </ContextMenu>
  );
}
